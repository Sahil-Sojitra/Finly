import { useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
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
import { colors, shadows, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';


export default function DashboardScreen() {
  const router = useRouter();

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
    <View style={styles.screenWrapper}>
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

        {/* 2. Period Filter Selector (Current Cycle / Previous Cycle / All-Time / Custom) */}
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

        {/* 4. Financial Summary Cards (Available Balance, Salary, Income, Expenses, Savings, %) */}
        <FinancialSummaryCards summary={analytics.summary} />

        {/* 5. Spending Trend Chart (Daily & Weekly switchable view) */}
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

        {/* 7. Cycle Comparison (Active vs Previous Cycle) */}
        <CycleComparisonCard comparison={analytics.cycleComparison} />

        {/* 8. Recent Transactions */}
        <RecentTransactionsCard transactions={analytics.filteredTransactions} />

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Quick Add Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/transactions')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  bottomSpacer: {
    height: 80,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
});
