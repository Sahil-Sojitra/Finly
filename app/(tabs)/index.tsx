import { useEffect, useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSalaryCycleStore, useTransactionStore, useAnalyticsStore } from '@/store';
import { AnalyticsEngine } from '@/domain/analyticsEngine';
import {
  GreetingHeader,
  PeriodFilterSelector,
  ActiveCycleCard,
  FinancialSummaryCards,
  SpendingTrendChart,
  CategoryBreakdownCard,
  CycleComparisonCard,
  RecentTransactionsCard,
} from '@/features/dashboard';
import { VoiceRecordingModal } from '@/features/voice';
import { radii, shadows, spacing, typography, useTheme, ThemeColors } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const {
    cycles,
    evaluation,
    isLoading: isCyclesLoading,
    fetchCycles,
  } = useSalaryCycleStore();

  const {
    transactions,
    isLoading: isTxLoading,
    fetchTransactions,
  } = useTransactionStore();

  const { filter, setFilter } = useAnalyticsStore();

  const loadData = useCallback(async () => {
    await Promise.all([fetchCycles(), fetchTransactions()]);
  }, [fetchCycles, fetchTransactions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Pure domain analytics calculation derived directly from SQLite state
  const analytics = useMemo(() => {
    return AnalyticsEngine.evaluateDashboardAnalytics({
      cycles,
      transactions,
      evaluation,
      filter,
    });
  }, [cycles, transactions, evaluation, filter]);

  const isRefreshing = isCyclesLoading || isTxLoading;

  return (
    <View style={[styles.screenWrapper, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={loadData}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* 1. Greeting & Current Date */}
        <GreetingHeader />

        {/* Prominent Voice Quick-Action Banner */}
        <TouchableOpacity
          style={[
            styles.voiceBanner,
            {
              backgroundColor: isDark ? colors.surface : '#EFF6FF',
              borderColor: isDark ? colors.border : '#BFDBFE',
            },
          ]}
          onPress={() => setIsVoiceModalOpen(true)}
          activeOpacity={0.8}
        >
          <View style={styles.voiceBannerLeft}>
            <View style={[styles.voiceBannerIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="mic" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.voiceBannerText}>
              <Text style={[styles.voiceBannerTitle, { color: isDark ? colors.textPrimary : '#1D4ED8' }]}>
                Voice Transaction Entry
              </Text>
              <Text style={[styles.voiceBannerSubtitle, { color: colors.textSecondary }]}>
                Say &quot;Spent 200 on lunch&quot; or &quot;500 petrol yesterday&quot;
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>

        {/* 2. Period Filter Selector */}
        <PeriodFilterSelector
          filter={filter}
          onFilterChange={setFilter}
          hasActiveCycle={analytics.summary.hasActiveCycle}
        />

        {/* 3. Active Salary Cycle Card */}
        <ActiveCycleCard
          summary={analytics.summary}
          activeCycle={evaluation?.activeCycle ?? null}
        />

        {/* 4. Financial Summary Cards */}
        <FinancialSummaryCards summary={analytics.summary} />

        {/* 5. Spending Trend Chart */}
        <SpendingTrendChart
          dailySpending={analytics.dailySpending}
          weeklySpending={analytics.weeklySpending}
          averageDailyExpensePaise={analytics.summary.burnRatePaisePerDay}
        />

        {/* 6. Category-Wise Expense Breakdown */}
        <CategoryBreakdownCard
          categories={analytics.categoryBreakdown}
          highestCategory={analytics.highestExpenseCategory}
          totalExpensesPaise={analytics.summary.totalExpensesPaise}
        />

        {/* 7. Cycle Comparison */}
        <CycleComparisonCard comparison={analytics.cycleComparison} />

        {/* 8. Recent Transactions */}
        <RecentTransactionsCard transactions={analytics.filteredTransactions} />

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        {/* Prominent Voice Mic FAB */}
        <TouchableOpacity
          style={[styles.voiceFab, { backgroundColor: colors.accent }]}
          onPress={() => setIsVoiceModalOpen(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="mic" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Manual Add FAB */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/transaction/new')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Voice Recording Modal */}
      <VoiceRecordingModal
        visible={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSuccess={loadData}
      />
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
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xxl,
    },
    voiceBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? colors.surface : '#EFF6FF',
      borderRadius: radii.xl,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: isDark ? colors.border : '#BFDBFE',
      marginBottom: spacing.sm,
    },
    voiceBannerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    voiceBannerIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    voiceBannerText: {
      flex: 1,
    },
    voiceBannerTitle: {
      ...typography.bodyMedium,
      color: isDark ? colors.textPrimary : colors.primaryDark,
      fontWeight: '700',
    },
    voiceBannerSubtitle: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 1,
    },
    bottomSpacer: {
      height: 80,
    },
    fabContainer: {
      position: 'absolute',
      right: 20,
      bottom: 24,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    voiceFab: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadows.lg,
    },
    fab: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadows.lg,
    },
  });
