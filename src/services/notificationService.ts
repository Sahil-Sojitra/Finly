import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';
import {
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
} from '@/domain/insights/insightsTypes';
import { SalaryCycle } from '@/types';
import { getDatabase } from '@/database/client';
import { appSettings } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { addDays, parseDateParts } from '@/domain/dateUtils';

const NOTIFICATION_SETTINGS_KEY = 'notification_settings_v1';
const CHANNEL_REMINDERS_ID = 'finly_spending_reminders';
const CHANNEL_ALERTS_ID = 'finly_threshold_alerts';

export class NotificationService {
  /**
   * Initializes notification channels on Android and default presentation rules.
   */
  static async init(): Promise<void> {
    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    } catch {
      // Ignored in test or unsupported environments
    }
    if (Platform.OS === 'android') {
      await Promise.all([
        Notifications.setNotificationChannelAsync(CHANNEL_REMINDERS_ID, {
          name: 'Finly Spending Reminders',
          description: 'Daily and weekly expense tracking reminders',
          importance: AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2563EB',
        }),
        Notifications.setNotificationChannelAsync(CHANNEL_ALERTS_ID, {
          name: 'Finly Spending Warnings',
          description: 'Salary cycle burn rate and budget threshold alerts',
          importance: AndroidImportance.HIGH,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#DC2626',
        }),
      ]);
    }
  }

  /**
   * Requests local notification permissions from the OS.
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const existing = await Notifications.getPermissionsAsync();
      if (existing.granted) return true;

      const requested = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      return requested.granted;
    } catch {
      return false;
    }
  }

  /**
   * Checks whether local notification permissions are currently granted.
   */
  static async hasPermissions(): Promise<boolean> {
    try {
      const perms = await Notifications.getPermissionsAsync();
      return Boolean(perms.granted);
    } catch {
      return false;
    }
  }

  /**
   * Retrieves notification settings from local SQLite storage.
   */
  static async getSettings(): Promise<NotificationSettings> {
    try {
      const db = getDatabase();
      const rows = await db
        .select()
        .from(appSettings)
        .where(eq(appSettings.key, NOTIFICATION_SETTINGS_KEY));

      if (rows.length > 0 && rows[0]?.value) {
        return JSON.parse(rows[0].value) as NotificationSettings;
      }
      return DEFAULT_NOTIFICATION_SETTINGS;
    } catch {
      return DEFAULT_NOTIFICATION_SETTINGS;
    }
  }

  /**
   * Persists notification settings to local SQLite and re-schedules active triggers.
   */
  static async saveSettings(
    settings: NotificationSettings,
    activeCycle?: SalaryCycle | null
  ): Promise<void> {
    const db = getDatabase();
    const nowIso = new Date().toISOString();
    const jsonStr = JSON.stringify(settings);

    await db
      .insert(appSettings)
      .values({
        key: NOTIFICATION_SETTINGS_KEY,
        value: jsonStr,
        updatedAt: nowIso,
      })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: {
          value: jsonStr,
          updatedAt: nowIso,
        },
      });

    // Synchronize scheduled notification timers
    await this.syncScheduledNotifications(settings, activeCycle);
  }

  /**
   * Synchronizes local scheduled notifications to match active user preferences.
   */
  static async syncScheduledNotifications(
    settings: NotificationSettings,
    activeCycle?: SalaryCycle | null
  ): Promise<void> {
    const hasPerms = await this.hasPermissions();
    if (!hasPerms) return;

    // Cancel existing scheduled notifications before re-registering
    await Notifications.cancelAllScheduledNotificationsAsync();

    // 1. Daily Spending Reminder
    if (settings.dailyReminderEnabled) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Record Today’s Spending',
          body: 'Take 10 seconds to log today’s expenses and keep your salary cycle on track.',
          data: { screen: 'transactions' },
          sound: true,
          ...(Platform.OS === 'android' ? { channelId: CHANNEL_REMINDERS_ID } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: settings.dailyReminderHour,
          minute: settings.dailyReminderMinute,
        },
      });
    }

    // 2. Weekly Spending Summary
    if (settings.weeklySummaryEnabled) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Weekly Expense Summary',
          body: 'Review your weekly spending trend and remaining balance in the Insights tab.',
          data: { screen: 'insights' },
          sound: true,
          ...(Platform.OS === 'android' ? { channelId: CHANNEL_REMINDERS_ID } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: settings.weeklySummaryDay,
          hour: settings.weeklySummaryHour,
          minute: 0,
        },
      });
    }

    // 3. Expected Salary / Payday Reminder
    if (settings.salaryReceivedReminderEnabled && activeCycle?.expectedNextDate) {
      try {
        const reminderDateStr = addDays(activeCycle.expectedNextDate, -1);
        const { year, month, day } = parseDateParts(reminderDateStr);
        const triggerDate = new Date(Date.UTC(year, month - 1, day, 9, 0, 0)); // 9:00 AM day before

        if (triggerDate.getTime() > Date.now()) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Upcoming Payday Tomorrow',
              body: 'Your expected salary date is tomorrow. Record your salary when received to start the next cycle.',
              data: { screen: 'salary' },
              sound: true,
              ...(Platform.OS === 'android' ? { channelId: CHANNEL_REMINDERS_ID } : {}),
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: triggerDate,
            },
          });
        }
      } catch {
        // Date parsing error guard
      }
    }
  }

  /**
   * Fires an immediate spending threshold breach notification (50%, 75%, 90%).
   */
  static async triggerThresholdAlert(
    spentPercentage: number,
    salaryAmountFormatted: string,
    spentFormatted: string
  ): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.thresholdAlertsEnabled) return;

    const hasPerms = await this.hasPermissions();
    if (!hasPerms) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Spending Warning: ${spentPercentage}% of Salary Spent`,
        body: `You have consumed ${spentFormatted} of your ${salaryAmountFormatted} salary. Check your pacing in the Insights tab.`,
        data: { screen: 'insights' },
        sound: true,
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ALERTS_ID } : {}),
      },
      trigger: null, // Send immediately
    });
  }

  /**
   * Fires an immediate test notification so users can verify delivery on their device.
   */
  static async triggerTestNotification(): Promise<void> {
    const hasPerms = await this.hasPermissions();
    if (!hasPerms) {
      const granted = await this.requestPermissions();
      if (!granted) {
        throw new Error('Notification permissions were not granted in system settings.');
      }
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Finly Notifications Active',
        body: 'Local notifications are configured. You will receive spending reminders and budget alerts according to your schedule.',
        data: { screen: 'insights' },
        sound: true,
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_REMINDERS_ID } : {}),
      },
      trigger: null, // Send immediately
    });
  }
}
