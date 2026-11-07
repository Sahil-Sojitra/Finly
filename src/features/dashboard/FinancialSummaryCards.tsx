import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FinancialSummary } from '@/domain/analyticsEngine';
import { formatPaiseToInr } from '@/utils';
import { radii, shadows, spacing, typography, useTheme, ThemeColors } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

interface FinancialSummaryCardsProps {
  summary: FinancialSummary;
}

export function FinancialSummaryCards({ summary }: FinancialSummaryCardsProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const isDeficit = summary.availableBalancePaise < 0;
  const isSavingsPositive = summary.netSavingsPaise >= 0;

  // Expense percentage badge color
  let expenseBadgeColor = isDark ? 'rgba(34, 197, 94, 0.25)' : '#DCFCE7';
  let expenseTextColor = isDark ? '#4ADE80' : '#15803D';
  if (summary.expensePercentage > 80) {
    expenseBadgeColor = isDark ? 'rgba(248, 113, 113, 0.25)' : '#FEE2E2';
    expenseTextColor = isDark ? '#F87171' : '#B91C1C';
  } else if (summary.expensePercentage > 50) {
    expenseBadgeColor = isDark ? 'rgba(251, 191, 36, 0.25)' : '#FEF3C7';
    expenseTextColor = isDark ? '#FBBF24' : '#B45309';
  }

  return (
    <View style={styles.container}>
      {/* Available Balance Hero Card */}
      <View style={[styles.card, styles.heroCard, isDeficit && styles.heroCardDeficit]}>
        <View style={styles.heroTopRow}>
          <Text style={styles.heroLabel}>AVAILABLE BALANCE</Text>
          <View style={[styles.percentageBadge, { backgroundColor: expenseBadgeColor }]}>
            <Text style={[styles.percentageBadgeText, { color: expenseTextColor }]}>
              {summary.expensePercentage}% Spent
            </Text>
          </View>
        </View>

        <Text style={[styles.heroBalanceText, isDeficit && styles.deficitText]}>
          {formatPaiseToInr(summary.availableBalancePaise)}
        </Text>

        <View style={styles.heroFooterRow}>
          <View style={styles.heroSubMetric}>
            <Ionicons
              name={isSavingsPositive ? 'trending-up' : 'trending-down'}
              size={14}
              color={isSavingsPositive ? colors.success : colors.danger}
            />
            <Text style={styles.heroSubMetricText}>
              Net Savings: {formatPaiseToInr(summary.netSavingsPaise)} ({summary.savingsPercentage}%)
            </Text>
          </View>
        </View>
      </View>

      {/* 2x2 Grid of Financial Breakdown */}
      <View style={styles.gridContainer}>
        {/* Total Salary Received */}
        <View style={[styles.card, styles.gridCard]}>
          <View style={styles.gridIconRow}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#EFF6FF' }]}>
              <Ionicons name="cash-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.gridCardLabel}>Salary</Text>
          </View>
          <Text style={styles.gridCardValue}>
            {formatPaiseToInr(summary.salaryIncomePaise)}
          </Text>
        </View>

        {/* Additional Income */}
        <View style={[styles.card, styles.gridCard]}>
          <View style={styles.gridIconRow}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#F0FDF4' }]}>
              <Ionicons name="add-circle-outline" size={18} color={colors.success} />
            </View>
            <Text style={styles.gridCardLabel}>Add. Income</Text>
          </View>
          <Text style={[styles.gridCardValue, { color: colors.success }]}>
            {formatPaiseToInr(summary.additionalIncomePaise)}
          </Text>
        </View>

        {/* Total Expenses */}
        <View style={[styles.card, styles.gridCard]}>
          <View style={styles.gridIconRow}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2' }]}>
              <Ionicons name="arrow-up-circle-outline" size={18} color={colors.danger} />
            </View>
            <Text style={styles.gridCardLabel}>Expenses</Text>
          </View>
          <Text style={[styles.gridCardValue, { color: colors.danger }]}>
            {formatPaiseToInr(summary.totalExpensesPaise)}
          </Text>
        </View>

        {/* Total Savings */}
        <View style={[styles.card, styles.gridCard]}>
          <View style={styles.gridIconRow}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(129, 140, 248, 0.2)' : '#F5F3FF' }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.accent} />
            </View>
            <Text style={styles.gridCardLabel}>Savings</Text>
          </View>
          <Text style={[styles.gridCardValue, { color: isSavingsPositive ? colors.accent : colors.danger }]}>
            {formatPaiseToInr(summary.netSavingsPaise)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      marginVertical: spacing.sm,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.sm,
    },
    heroCard: {
      marginBottom: spacing.md,
      backgroundColor: colors.surface,
    },
    heroCardDeficit: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
      borderColor: isDark ? colors.danger : '#FECACA',
    },
    heroTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    heroLabel: {
      ...typography.caption,
      fontWeight: '700',
      color: colors.textSecondary,
      letterSpacing: 0.5,
    },
    percentageBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radii.full,
    },
    percentageBadgeText: {
      ...typography.caption,
      fontWeight: '700',
    },
    heroBalanceText: {
      ...typography.hero,
      color: colors.textPrimary,
      fontWeight: '900',
      marginVertical: 4,
    },
    deficitText: {
      color: colors.danger,
    },
    heroFooterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.xs,
    },
    heroSubMetric: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    heroSubMetricText: {
      ...typography.bodyMedium,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    gridCard: {
      width: '47.5%',
      padding: spacing.md,
    },
    gridIconRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    iconBox: {
      width: 28,
      height: 28,
      borderRadius: radii.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    gridCardLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    gridCardValue: {
      ...typography.headingSmall,
      color: colors.textPrimary,
      fontWeight: '700',
    },
  });
