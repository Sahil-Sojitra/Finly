import { useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Text,
} from 'react-native';
import { colors, spacing } from '@/theme';
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
            colors={[colors.primary]}
          />
        }
      >
        {isLoading && !insightsData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Analyzing salary cycle spending...</Text>
          </View>
        ) : insightsData ? (
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
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
