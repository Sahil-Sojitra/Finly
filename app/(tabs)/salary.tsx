import { useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSalaryCycleStore, useTransactionStore } from '@/store';
import { CycleTimeline } from '@/features/salary-cycles/CycleTimeline';
import { formatDisplayDate } from '@/domain/dateUtils';
import { formatPaiseToInr } from '@/utils';
import { Button } from '@/components/Button';
import { colors, radii, spacing, typography, shadows } from '@/theme';

export default function SalaryScreen() {
  const router = useRouter();
  const { evaluation, isLoading, fetchCycles, deleteSalary } = useSalaryCycleStore();
  const { fetchTransactions } = useTransactionStore();

  const loadData = useCallback(async () => {
    await Promise.all([fetchCycles(), fetchTransactions()]);
  }, [fetchCycles, fetchTransactions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteCycle = (cycleId: string) => {
    Alert.alert(
      'Delete Salary Cycle',
      'Are you sure you want to delete this salary cycle? All transactions will be safely preserved and reassigned to adjacent periods.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteSalary(cycleId);
          },
        },
      ]
    );
  };

  const activeMetrics = evaluation?.activeCycle
    ? evaluation.metricsByCycleId.get(evaluation.activeCycle.id)
    : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={loadData} />
      }
    >
      {/* Top Banner Action */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Salary Management</Text>
          <Text style={styles.pageSubtitle}>
            Financial periods mapped to your real paydays
          </Text>
        </View>
        <Button
          title="+ Record Salary"
          onPress={() => router.push('/salary/new')}
          variant="primary"
          size="sm"
        />
      </View>

      {/* Active Cycle Hero Card */}
      {activeMetrics ? (
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.activePill}>
              <View style={styles.pulseDot} />
              <Text style={styles.activePillText}>Current Active Period</Text>
            </View>
            <Text style={styles.elapsedDaysText}>
              Day {activeMetrics.daysElapsed}
            </Text>
          </View>

          <Text style={styles.heroDateRange}>
            Started {formatDisplayDate(activeMetrics.startDate)}
          </Text>

          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Available to Spend</Text>
            <Text style={styles.balanceValue}>
              {formatPaiseToInr(activeMetrics.availableBalancePaise)}
            </Text>
          </View>

          <View style={styles.heroStatsGrid}>
            <View style={styles.heroStat}>
              <Text style={styles.statLabel}>Salary Received</Text>
              <Text style={styles.statValue}>
                {formatPaiseToInr(activeMetrics.baseSalaryPaise, false)}
              </Text>
            </View>

            <View style={styles.heroStat}>
              <Text style={styles.statLabel}>Carried Over</Text>
              <Text style={styles.statValue}>
                {formatPaiseToInr(activeMetrics.openingBalancePaise, false)}
              </Text>
            </View>

            <View style={styles.heroStat}>
              <Text style={styles.statLabel}>Spent so far</Text>
              <Text style={styles.statValueExpense}>
                {formatPaiseToInr(activeMetrics.expensesPaise, false)}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Salary Cycle Established</Text>
          <Text style={styles.emptySubtitle}>
            Finly groups your expenses by actual salary receipt dates. Record your first salary to begin personalized cycle tracking.
          </Text>
          <Button
            title="Record First Salary"
            onPress={() => router.push('/salary/new')}
            variant="primary"
            size="md"
            style={styles.emptyBtn}
          />
        </View>
      )}

      {/* Cycle Timeline */}
      {evaluation && evaluation.metricsList.length > 0 && (
        <CycleTimeline
          metrics={evaluation.metricsList}
          onDeleteCycle={handleDeleteCycle}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  pageTitle: {
    ...typography.headingMedium,
    color: colors.textPrimary,
  },
  pageSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    ...shadows.floating,
    marginBottom: spacing.xl,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  activePillText: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.primary,
  },
  elapsedDaysText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  heroDateRange: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  balanceContainer: {
    marginBottom: spacing.xl,
  },
  balanceLabel: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  balanceValue: {
    ...typography.headingLarge,
    fontSize: 34,
    color: colors.primary,
    fontWeight: '800',
  },
  heroStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  heroStat: {
    alignItems: 'flex-start',
  },
  statLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statValueExpense: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.danger,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  emptyTitle: {
    ...typography.headingSmall,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  emptyBtn: {
    minWidth: 180,
  },
});
