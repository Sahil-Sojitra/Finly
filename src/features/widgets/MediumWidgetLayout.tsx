import { StyleSheet, Text, View } from 'react-native';
import { WidgetSnapshotData } from '@/domain/widgetSnapshot';
import { colors, radii, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

interface MediumWidgetLayoutProps {
  data: WidgetSnapshotData;
}

export function MediumWidgetLayout({ data }: MediumWidgetLayoutProps) {
  const isDeficit = data.isDeficit;
  const progressPercent = Math.min(100, Math.max(0, data.spendingPercentage));

  let progressColor: string = colors.primary;
  if (data.spendingPercentage > 80) progressColor = colors.danger;
  else if (data.spendingPercentage > 50) progressColor = colors.warning;

  return (
    <View style={styles.container}>
      {/* Top Bar: Brand, Cycle Label, Open App Action */}
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Ionicons name="wallet" size={12} color="#FFFFFF" />
          </View>
          <Text style={styles.brandTitle}>Finly</Text>
          <Text style={styles.periodText}>• {data.cyclePeriodLabel}</Text>
        </View>

        <View style={styles.actionPill}>
          <Ionicons name="open-outline" size={11} color={colors.primary} />
          <Text style={styles.actionPillText}>Open App</Text>
        </View>
      </View>

      {/* Main Content: Balance Left, Sub-metrics Right */}
      <View style={styles.metricsRow}>
        {/* Left Column: Hero Available Balance */}
        <View style={styles.balanceCol}>
          <Text style={styles.metricLabel}>Available Balance</Text>
          <Text
            style={[styles.balanceValue, isDeficit && styles.deficitValue]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {data.availableBalanceFormatted}
          </Text>
          <Text style={styles.subtext}>
            {data.daysRemaining !== null
              ? `${data.daysRemaining} days until payday`
              : `Day ${data.daysElapsed} in cycle`}
          </Text>
        </View>

        {/* Right Column: Salary & Expenses */}
        <View style={styles.subMetricsCol}>
          <View style={styles.subMetricItem}>
            <Text style={styles.subMetricLabel}>Salary</Text>
            <Text style={styles.subMetricValue}>{data.salaryReceivedFormatted}</Text>
          </View>
          <View style={styles.subMetricItem}>
            <Text style={styles.subMetricLabel}>Expenses</Text>
            <Text style={[styles.subMetricValue, { color: colors.danger }]}>
              {data.totalExpensesFormatted}
            </Text>
          </View>
        </View>
      </View>

      {/* Spending Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Spending Progress</Text>
          <Text style={[styles.progressPercentText, { color: progressColor }]}>
            {data.spendingPercentage}% spent
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressPercent}%`, backgroundColor: progressColor },
            ]}
          />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footerRow}>
        <Text style={styles.footerText}>{data.lastUpdatedFormatted}</Text>
        <Text style={styles.footerSubtext}>Tap anywhere to record transaction</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 320,
    height: 155,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.md,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  logoBadge: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  periodText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.full,
    gap: 3,
  },
  actionPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  balanceCol: {
    flex: 1.2,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  balanceValue: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    lineHeight: 26,
  },
  deficitValue: {
    color: colors.danger,
  },
  subtext: {
    fontSize: 9,
    color: colors.textTertiary,
    marginTop: 1,
  },
  subMetricsCol: {
    flex: 1,
    gap: 2,
    alignItems: 'flex-end',
  },
  subMetricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  subMetricLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  subMetricValue: {
    fontSize: 11,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  progressContainer: {
    gap: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 9,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  progressPercentText: {
    fontSize: 9,
    fontWeight: '700',
  },
  progressTrack: {
    height: 5,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.full,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 3,
  },
  footerText: {
    fontSize: 9,
    color: colors.textTertiary,
  },
  footerSubtext: {
    fontSize: 9,
    color: colors.primary,
    fontWeight: '600',
  },
});
