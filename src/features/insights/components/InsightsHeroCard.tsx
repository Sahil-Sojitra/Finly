import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, shadows, spacing, useTheme, ThemeColors } from '@/theme';
import { SpendingInsightsData } from '@/domain/insights/insightsTypes';

interface InsightsHeroCardProps {
  insights: SpendingInsightsData;
}

export function InsightsHeroCard({ insights }: InsightsHeroCardProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const isDeficit =
    insights.projectedRemainingBalancePaise !== null &&
    insights.projectedRemainingBalancePaise < 0;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Ionicons name="sparkles" size={20} color={colors.primary} />
        </View>
        <View style={styles.headerTextCol}>
          <Text style={styles.cardTitle}>Financial Intelligence</Text>
          <Text style={styles.cardSubtitle}>
            {insights.hasActiveCycle ? insights.cycleName : 'Deterministic Spending Insights'}
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Rule-Based</Text>
        </View>
      </View>

      {/* Hero Salary Consumption Highlight */}
      <View style={styles.highlightBanner}>
        <Ionicons
          name={insights.spentPercentage >= 75 ? 'alert-circle' : 'pie-chart'}
          size={22}
          color={insights.spentPercentage >= 75 ? colors.danger : colors.primary}
        />
        <Text style={styles.highlightText}>{insights.spentSummaryMessage}</Text>
      </View>

      {/* 2x2 Grid of Key Projections & Metrics */}
      <View style={styles.grid}>
        {/* Metric 1: Daily Average Expense */}
        <View style={styles.gridCell}>
          <Text style={styles.metricLabel}>Daily Average</Text>
          <Text style={styles.metricValue}>
            {insights.formattedDailyAverageExpense.replace('Your average daily spending is ', '')}
          </Text>
          <Text style={styles.metricSubtext}>Over {insights.daysElapsed} days</Text>
        </View>

        {/* Metric 2: Projected Remaining Balance */}
        <View style={styles.gridCell}>
          <Text style={styles.metricLabel}>Projected at Payday</Text>
          <Text
            style={[
              styles.metricValue,
              isDeficit && styles.metricValueDeficit,
            ]}
          >
            {insights.formattedProjectedRemainingBalance ?? 'Calculating...'}
          </Text>
          <Text style={styles.metricSubtext}>
            {insights.daysRemaining !== null
              ? `${insights.daysRemaining} days left`
              : 'End of cycle'}
          </Text>
        </View>

        {/* Metric 3: Savings Percentage */}
        <View style={styles.gridCell}>
          <Text style={styles.metricLabel}>Savings Rate</Text>
          <Text style={[styles.metricValue, { color: colors.success }]}>
            {insights.savingsPercentage}%
          </Text>
          <Text style={styles.metricSubtext}>{insights.formattedSavings} balance</Text>
        </View>

        {/* Metric 4: Total Spent */}
        <View style={styles.gridCell}>
          <Text style={styles.metricLabel}>Cycle Expenses</Text>
          <Text style={styles.metricValue}>{insights.formattedCycleExpenses}</Text>
          <Text style={styles.metricSubtext}>of {insights.formattedSalaryAmount}</Text>
        </View>
      </View>

      {/* Projection Explanation Footer */}
      <View style={styles.projectionFooter}>
        <Ionicons name="information-circle-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.projectionFooterText}>{insights.projectionMessage}</Text>
      </View>
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
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
      backgroundColor: isDark ? colors.surfaceSecondary : '#EFF6FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    headerTextCol: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    cardSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    badge: {
      backgroundColor: colors.surfaceSecondary,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    highlightBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radii.md,
      padding: spacing.md,
      gap: spacing.sm,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    highlightText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: spacing.md,
    },
    gridCell: {
      width: '48.5%',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radii.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    metricLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    metricValue: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    metricValueDeficit: {
      color: colors.danger,
    },
    metricSubtext: {
      fontSize: 11,
      color: colors.textTertiary,
      marginTop: 2,
    },
    projectionFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    projectionFooterText: {
      flex: 1,
      fontSize: 11,
      color: colors.textSecondary,
      lineHeight: 16,
    },
  });
