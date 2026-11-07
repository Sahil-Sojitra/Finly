import { useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { radii, shadows, spacing, useTheme, ThemeColors } from '@/theme';
import { useInsightsStore } from '@/store';
import {
  InsightsHeroCard,
  DailyWeeklySummaryCard,
  SpendingWarningsCard,
  UnusualSpendingCard,
  CategoryComparisonCard,
  RuleSuggestionsCard,
} from '@/features/insights';
import { NotificationPreferencesCard } from '@/features/notifications';

export default function InsightsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const {
    insightsData,
    notificationSettings,
    hasNotificationPermissions,
    isLoading,
    fetchInsights,
    loadNotificationSettings,
    updateNotificationSettings,
    requestNotificationPermissions,
    sendTestNotification,
  } = useInsightsStore();

  useEffect(() => {
    fetchInsights();
    loadNotificationSettings();
  }, [fetchInsights, loadNotificationSettings]);

  const onRefresh = useCallback(async () => {
    await Promise.all([fetchInsights(), loadNotificationSettings()]);
  }, [fetchInsights, loadNotificationSettings]);

  return (
    <View style={styles.screenWrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && Boolean(insightsData)}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {isLoading && !insightsData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Analyzing salary cycle spending...</Text>
          </View>
        ) : insightsData && insightsData.hasActiveCycle ? (
          <>
            {/* Hero Insights Card */}
            <InsightsHeroCard insights={insightsData} />

            {/* Spending Alerts & Warnings */}
            <SpendingWarningsCard warnings={insightsData.warnings} />

            {/* Daily & Weekly Trends */}
            <DailyWeeklySummaryCard insights={insightsData} />

            {/* Unusual Spending Anomaly Detection */}
            <UnusualSpendingCard anomalies={insightsData.anomalies} />

            {/* Category Breakdown & Shift vs Prior Cycle */}
            <CategoryComparisonCard insights={insightsData} />

            {/* Personalized Rule Suggestions */}
            <RuleSuggestionsCard suggestions={insightsData.suggestions} />

            {/* Local Notification Controls */}
            <NotificationPreferencesCard
              settings={notificationSettings}
              hasPermissions={hasNotificationPermissions}
              onUpdateSettings={updateNotificationSettings}
              onRequestPermissions={requestNotificationPermissions}
              onSendTestNotification={sendTestNotification}
            />
          </>
        ) : (
          <>
            {/* Empty State Banner */}
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="bulb-outline" size={32} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Personalized Spending Intelligence</Text>
              <Text style={styles.emptyDescription}>
                Finly tracks spending trends, daily burn rates, and anomalies based on your actual
                salary receipt cycles. Record a salary cycle to activate full projections and alerts.
              </Text>
              <TouchableOpacity
                style={styles.recordButton}
                onPress={() => router.push('/salary/new')}
                activeOpacity={0.8}
              >
                <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
                <Text style={styles.recordButtonText}>Record Salary Cycle</Text>
              </TouchableOpacity>
            </View>

            {/* Notification Preferences Card (Always accessible) */}
            <NotificationPreferencesCard
              settings={notificationSettings}
              hasPermissions={hasNotificationPermissions}
              onUpdateSettings={updateNotificationSettings}
              onRequestPermissions={requestNotificationPermissions}
              onSendTestNotification={sendTestNotification}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    screenWrapper: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
    },
    contentContainer: {
      padding: spacing.md,
      paddingBottom: spacing.xxl * 2,
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
      gap: 12,
    },
    loadingText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    emptyCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.xl,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.borderLight,
      marginBottom: spacing.md,
      ...shadows.sm,
    },
    emptyIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: isDark ? colors.surfaceSecondary : '#EFF6FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    emptyDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: spacing.lg,
    },
    recordButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.lg,
      borderRadius: radii.full,
      gap: spacing.xs,
    },
    recordButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
