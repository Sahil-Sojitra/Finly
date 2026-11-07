import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows, spacing } from '@/theme';
import { NotificationSettings } from '@/domain/insights/insightsTypes';

interface NotificationPreferencesCardProps {
  settings: NotificationSettings;
  hasPermissions: boolean;
  onUpdateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  onRequestPermissions: () => Promise<boolean>;
  onSendTestNotification: () => Promise<void>;
}

export function NotificationPreferencesCard({
  settings,
  hasPermissions,
  onUpdateSettings,
  onRequestPermissions,
  onSendTestNotification,
}: NotificationPreferencesCardProps) {
  const [isTesting, setIsTesting] = useState(false);

  const handleTestNotification = async () => {
    setIsTesting(true);
    try {
      await onSendTestNotification();
      Alert.alert(
        'Test Notification Triggered',
        'A local notification was dispatched to your notification center.'
      );
    } catch (err) {
      Alert.alert(
        'Notification Failed',
        err instanceof Error ? err.message : 'Please check app notification permissions in Settings.'
      );
    } finally {
      setIsTesting(false);
    }
  };

  const handleToggle = async (key: keyof NotificationSettings, value: boolean) => {
    if (value && !hasPermissions) {
      const granted = await onRequestPermissions();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your phone settings to receive spending reminders.'
        );
        return;
      }
    }
    await onUpdateSettings({ [key]: value });
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Ionicons name="notifications" size={20} color={colors.primary} />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.cardTitle}>Local Notification Reminders</Text>
          <Text style={styles.cardSubtitle}>
            100% on-device alerts • Zero tracking
          </Text>
        </View>
        <View
          style={[
            styles.permBadge,
            hasPermissions ? styles.permBadgeActive : styles.permBadgeInactive,
          ]}
        >
          <Text
            style={[
              styles.permBadgeText,
              hasPermissions ? styles.permTextActive : styles.permTextInactive,
            ]}
          >
            {hasPermissions ? 'Enabled' : 'Disabled'}
          </Text>
        </View>
      </View>

      <View style={styles.togglesList}>
        {/* Toggle 1: Daily Reminder */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleTextCol}>
            <Text style={styles.toggleTitle}>Daily Spending Reminder</Text>
            <Text style={styles.toggleSubtitle}>
              Evening prompt at 8:00 PM to record any unlogged expenses
            </Text>
          </View>
          <Switch
            value={settings.dailyReminderEnabled}
            onValueChange={(val) => handleToggle('dailyReminderEnabled', val)}
            trackColor={{ false: '#E2E8F0', true: colors.primary }}
          />
        </View>

        <View style={styles.divider} />

        {/* Toggle 2: Weekly Summary */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleTextCol}>
            <Text style={styles.toggleTitle}>Weekly Spending Summary</Text>
            <Text style={styles.toggleSubtitle}>
              Sunday evening recap of your weekly spend and remaining balance
            </Text>
          </View>
          <Switch
            value={settings.weeklySummaryEnabled}
            onValueChange={(val) => handleToggle('weeklySummaryEnabled', val)}
            trackColor={{ false: '#E2E8F0', true: colors.primary }}
          />
        </View>

        <View style={styles.divider} />

        {/* Toggle 3: Payday Reminder */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleTextCol}>
            <Text style={styles.toggleTitle}>Payday / Salary Reminder</Text>
            <Text style={styles.toggleSubtitle}>
              Reminder 1 day before expected payday to log incoming salary
            </Text>
          </View>
          <Switch
            value={settings.salaryReceivedReminderEnabled}
            onValueChange={(val) => handleToggle('salaryReceivedReminderEnabled', val)}
            trackColor={{ false: '#E2E8F0', true: colors.primary }}
          />
        </View>

        <View style={styles.divider} />

        {/* Toggle 4: Spending Threshold Alerts */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleTextCol}>
            <Text style={styles.toggleTitle}>Budget Threshold Warnings</Text>
            <Text style={styles.toggleSubtitle}>
              Instant alerts when cycle spending crosses 50%, 75%, and 90%
            </Text>
          </View>
          <Switch
            value={settings.thresholdAlertsEnabled}
            onValueChange={(val) => handleToggle('thresholdAlertsEnabled', val)}
            trackColor={{ false: '#E2E8F0', true: colors.primary }}
          />
        </View>
      </View>

      {/* Test Notification Button */}
      <TouchableOpacity
        style={styles.testButton}
        onPress={handleTestNotification}
        disabled={isTesting}
        activeOpacity={0.8}
      >
        {isTesting ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <>
            <Ionicons name="paper-plane-outline" size={16} color={colors.primary} />
            <Text style={styles.testButtonText}>Send Test Local Notification</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  textCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  permBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  permBadgeActive: {
    backgroundColor: '#DCFCE7',
  },
  permBadgeInactive: {
    backgroundColor: '#F1F5F9',
  },
  permBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  permTextActive: {
    color: colors.success,
  },
  permTextInactive: {
    color: colors.textTertiary,
  },
  togglesList: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  toggleTextCol: {
    flex: 1,
    paddingRight: spacing.md,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  toggleSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    borderRadius: radii.md,
    marginTop: spacing.md,
    gap: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  testButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});
