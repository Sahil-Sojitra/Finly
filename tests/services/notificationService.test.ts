import * as Notifications from 'expo-notifications';
import { DEFAULT_NOTIFICATION_SETTINGS } from '@/domain/insights/insightsTypes';
import { NotificationService } from '@/services/notificationService';

jest.mock('expo-notifications', () => ({
  AndroidImportance: {
    DEFAULT: 3,
    HIGH: 4,
    MAX: 5,
  },
  PermissionStatus: {
    UNDETERMINED: 'undetermined',
    GRANTED: 'granted',
    DENIED: 'denied',
  },
  SchedulableTriggerInputTypes: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    CALENDAR: 'calendar',
  },
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('test-id'),
}));

describe('NotificationService — Local Notification Scheduler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides default notification settings when unconfigured', async () => {
    const settings = await NotificationService.getSettings();
    expect(settings.dailyReminderEnabled).toBe(true);
    expect(settings.dailyReminderHour).toBe(20);
    expect(settings.thresholdAlertsEnabled).toBe(true);
    expect(settings.thresholdPercentages).toEqual([50, 75, 90]);
  });

  it('requests local notification permissions', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      granted: false,
      status: 'undetermined',
      canAskAgain: true,
      expires: 'never',
    });

    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      granted: true,
      status: 'granted',
      canAskAgain: true,
      expires: 'never',
    });

    const granted = await NotificationService.requestPermissions();
    expect(granted).toBe(true);
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
  });

  it('triggers immediate test notification', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      granted: true,
      status: 'granted',
      canAskAgain: true,
      expires: 'never',
    });

    (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValueOnce('test-notif-id');

    await NotificationService.triggerTestNotification();

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: 'Finly Notifications Active',
        }),
        trigger: null,
      })
    );
  });

  it('schedules daily and weekly reminders when permissions are granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      granted: true,
      status: 'granted',
      canAskAgain: true,
      expires: 'never',
    });

    (Notifications.cancelAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue(undefined);
    (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('scheduled-id');

    await NotificationService.syncScheduledNotifications(DEFAULT_NOTIFICATION_SETTINGS, {
      id: 'cycle-1',
      salaryAmount: 5000000,
      receivedDate: '2026-11-01',
      expectedNextDate: '2026-12-01',
      openingBalance: 0,
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-01T00:00:00.000Z',
    });

    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    // Daily reminder + Weekly summary + Payday reminder
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(3);
  });
});
