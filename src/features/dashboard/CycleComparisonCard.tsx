import { StyleSheet, Text, View } from 'react-native';
import { CycleComparison } from '@/domain/analyticsEngine';
import { formatPaiseToInr } from '@/utils';
import { colors, radii, shadows, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

interface CycleComparisonCardProps {
  comparison: CycleComparison;
}

export function CycleComparisonCard({ comparison }: CycleComparisonCardProps) {
  if (!comparison.hasComparison) {
    return null; // Only render when at least 2 cycles exist to compare
  }

  const isSpendHigher = comparison.spendDifferencePaise > 0;
  const isSavingsHigher = comparison.savingsDifferencePaise >= 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Ionicons name="git-compare-outline" size={18} color={colors.primary} />
          <Text style={styles.title}>Cycle vs. Previous Cycle</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        {/* Spend Comparison */}
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>Spending Change</Text>
          <View style={styles.valueRow}>
            <Ionicons
              name={isSpendHigher ? 'arrow-up' : 'arrow-down'}
              size={14}
              color={isSpendHigher ? colors.danger : colors.success}
            />
            <Text
              style={[
                styles.metricValue,
                { color: isSpendHigher ? colors.danger : colors.success },
              ]}
            >
              {isSpendHigher ? '+' : ''}
              {formatPaiseToInr(comparison.spendDifferencePaise)}
            </Text>
          </View>
          <Text style={styles.subText}>
            {comparison.spendPercentageChange > 0 ? '+' : ''}
            {comparison.spendPercentageChange}% vs prev
          </Text>
        </View>

        {/* Savings Comparison */}
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>Savings Change</Text>
          <View style={styles.valueRow}>
            <Ionicons
              name={isSavingsHigher ? 'arrow-up' : 'arrow-down'}
              size={14}
              color={isSavingsHigher ? colors.success : colors.danger}
            />
            <Text
              style={[
                styles.metricValue,
                { color: isSavingsHigher ? colors.success : colors.danger },
              ]}
            >
              {isSavingsHigher ? '+' : ''}
              {formatPaiseToInr(comparison.savingsDifferencePaise)}
            </Text>
          </View>
          <Text style={styles.subText}>
            Active: {formatPaiseToInr(comparison.activeCycleSavingsPaise)}
          </Text>
        </View>
      </View>

      {/* Daily Average Comparison */}
      <View style={styles.dailyCompareBar}>
        <Text style={styles.dailyCompareLabel}>Average Daily Burn:</Text>
        <Text style={styles.dailyCompareValue}>
          Active: <Text style={styles.boldText}>{formatPaiseToInr(comparison.activeDailyAvgPaise)}/day</Text> vs Prev: <Text style={styles.boldText}>{formatPaiseToInr(comparison.previousDailyAvgPaise)}/day</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    marginVertical: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.headingSmall,
    color: colors.textPrimary,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  metricBlock: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    borderRadius: radii.lg,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  metricValue: {
    ...typography.bodyMedium,
    fontWeight: '700',
  },
  subText: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  dailyCompareBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  dailyCompareLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  dailyCompareValue: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  boldText: {
    fontWeight: '700',
  },
});
