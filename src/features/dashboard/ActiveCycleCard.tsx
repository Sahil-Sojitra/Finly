import { useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FinancialSummary } from '@/domain/analyticsEngine';
import { CycleBoundary } from '@/domain/salaryCycleEngine';
import { formatDisplayDate } from '@/domain/dateUtils';
import { formatPaiseToInr } from '@/utils';
import { radii, shadows, spacing, typography, useTheme, ThemeColors } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

interface ActiveCycleCardProps {
  summary: FinancialSummary;
  activeCycle: CycleBoundary | null;
}

export function ActiveCycleCard({ summary, activeCycle }: ActiveCycleCardProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  if (!activeCycle || !summary.hasActiveCycle) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="calendar-outline" size={32} color={colors.warning} />
        </View>
        <View style={styles.emptyContent}>
          <Text style={styles.emptyTitle}>No Active Salary Cycle</Text>
          <Text style={styles.emptySubtitle}>
            Finly tracks spending based on actual salary receipt dates. Record your latest salary receipt to activate cycle tracking.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.recordButton}
          onPress={() => router.push('/salary/new')}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
          <Text style={styles.recordButtonText}>Record Salary</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOverdue = summary.daysRemaining !== null && summary.daysRemaining <= 0;
  const daysTotal = summary.daysTotal ?? (summary.daysElapsed + (summary.daysRemaining ?? 0));
  const progressPercent = daysTotal > 0
    ? Math.min(100, Math.round((summary.daysElapsed / daysTotal) * 100))
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <View style={styles.pulseDot} />
          <Text style={styles.badgeText}>ACTIVE CYCLE</Text>
        </View>
        <Text style={styles.periodText}>{summary.periodLabel}</Text>
      </View>

      <View style={styles.mainMetricsRow}>
        <View>
          <Text style={styles.metricLabel}>Remaining Balance</Text>
          <Text style={styles.balanceValue}>
            {formatPaiseToInr(summary.availableBalancePaise)}
          </Text>
        </View>
        <View style={styles.salaryRight}>
          <Text style={styles.metricLabel}>Base Salary</Text>
          <Text style={styles.salaryValue}>
            {formatPaiseToInr(summary.salaryIncomePaise)}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressText}>
            Day {summary.daysElapsed} elapsed
          </Text>
          <Text style={styles.progressText}>
            {summary.daysRemaining !== null
              ? isOverdue
                ? 'Payday arrived / overdue'
                : `${summary.daysRemaining} days remaining`
              : 'Next date not set'}
          </Text>
        </View>
      </View>

      {/* Cycle Details Grid */}
      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Ionicons name="log-in-outline" size={16} color={colors.textSecondary} />
          <View style={styles.detailTextWrapper}>
            <Text style={styles.detailLabel}>Received Date</Text>
            <Text style={styles.detailValue}>
              {formatDisplayDate(activeCycle.receivedDate)}
            </Text>
          </View>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="calendar-clear-outline" size={16} color={colors.textSecondary} />
          <View style={styles.detailTextWrapper}>
            <Text style={styles.detailLabel}>Next Expected Payday</Text>
            <Text style={styles.detailValue}>
              {activeCycle.expectedNextDate
                ? formatDisplayDate(activeCycle.expectedNextDate)
                : 'Not Set'}
            </Text>
          </View>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="repeat-outline" size={16} color={colors.textSecondary} />
          <View style={styles.detailTextWrapper}>
            <Text style={styles.detailLabel}>Opening Balance</Text>
            <Text style={styles.detailValue}>
              {formatPaiseToInr(activeCycle.openingBalance)}
            </Text>
          </View>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="flame-outline" size={16} color={colors.textSecondary} />
          <View style={styles.detailTextWrapper}>
            <Text style={styles.detailLabel}>Daily Burn Rate</Text>
            <Text style={styles.detailValue}>
              {formatPaiseToInr(summary.burnRatePaisePerDay)}/day
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginVertical: spacing.sm,
      ...shadows.card,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryLight,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radii.full,
      gap: 6,
    },
    pulseDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
    badgeText: {
      ...typography.caption,
      fontWeight: '700',
      color: isDark ? '#93C5FD' : colors.primaryDark,
    },
    periodText: {
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    mainMetricsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.md,
    },
    metricLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    balanceValue: {
      ...typography.headingLarge,
      color: colors.textPrimary,
      fontWeight: '800',
    },
    salaryRight: {
      alignItems: 'flex-end',
    },
    salaryValue: {
      ...typography.headingSmall,
      color: colors.primary,
      fontWeight: '700',
    },
    progressContainer: {
      marginBottom: spacing.lg,
    },
    progressTrack: {
      height: 8,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radii.full,
      overflow: 'hidden',
      marginBottom: 6,
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: radii.full,
    },
    progressLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    progressText: {
      ...typography.caption,
      color: colors.textTertiary,
    },
    detailsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '47%',
      gap: spacing.sm,
    },
    detailTextWrapper: {
      flex: 1,
    },
    detailLabel: {
      ...typography.caption,
      color: colors.textTertiary,
    },
    detailValue: {
      ...typography.bodyMedium,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      backgroundColor: isDark ? colors.surface : '#FFFBEB',
      borderColor: isDark ? colors.border : '#FDE68A',
    },
    emptyIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: isDark ? colors.surfaceSecondary : '#FEF3C7',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    emptyContent: {
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    emptyTitle: {
      ...typography.headingSmall,
      color: isDark ? colors.warning : '#92400E',
      marginBottom: spacing.xs,
    },
    emptySubtitle: {
      ...typography.bodyMedium,
      color: isDark ? colors.textSecondary : '#B45309',
      textAlign: 'center',
      lineHeight: 20,
      maxWidth: 320,
    },
    recordButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
      borderRadius: radii.full,
      gap: spacing.xs,
    },
    recordButtonText: {
      ...typography.bodyMedium,
      color: '#FFFFFF',
      fontWeight: '700',
    },
  });
