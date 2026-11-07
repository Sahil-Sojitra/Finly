import { useMemo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { CycleMetrics } from '@/domain/salaryCycleEngine';
import { formatDisplayDate } from '@/domain/dateUtils';
import { formatPaiseToInr } from '@/utils';
import { radii, spacing, typography, shadows, useTheme, ThemeColors } from '@/theme';

export interface CycleTimelineProps {
  evaluation?: { cycles: any[]; metricsByCycleId: Map<string, CycleMetrics> };
  metrics?: CycleMetrics[];
  onEditCycle?: (cycleId: string) => void;
  onDeleteCycle?: (cycleId: string) => void;
}

export function CycleTimeline({
  evaluation,
  metrics: explicitMetrics,
  onEditCycle,
  onDeleteCycle,
}: CycleTimelineProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const metrics = explicitMetrics ?? (evaluation ? Array.from(evaluation.metricsByCycleId.values()) : []);

  if (metrics.length === 0) {
    return null;
  }

  // Display latest cycle at the top
  const sorted = [...metrics].reverse();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Salary Cycle Timeline</Text>
      <View style={styles.timelineList}>
        {sorted.map((item, index) => {
          const isLatest = index === 0;
          const isLastItem = index === sorted.length - 1;

          const dateRange = item.endDate
            ? `${formatDisplayDate(item.startDate)} → ${formatDisplayDate(item.endDate)}`
            : `Started ${formatDisplayDate(item.startDate)} (Active)`;

          return (
            <View key={item.cycleId} style={styles.timelineRow}>
              {/* Vertical connector line & Node */}
              <View style={styles.nodeColumn}>
                <View
                  style={[
                    styles.nodeDot,
                    item.isActive ? styles.nodeActive : styles.nodeClosed,
                  ]}
                />
                {!isLastItem && <View style={styles.connectorLine} />}
              </View>

              {/* Cycle Card */}
              <View style={[styles.card, item.isActive && styles.cardActive]}>
                <View style={styles.cardHeader}>
                  <View style={styles.titleColumn}>
                    <View style={styles.badgeRow}>
                      <View
                        style={[
                          styles.statusBadge,
                          item.isActive ? styles.badgeActive : styles.badgeClosed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            item.isActive
                              ? styles.statusTextActive
                              : styles.statusTextClosed,
                          ]}
                        >
                          {item.isActive ? 'Active Cycle' : 'Closed'}
                        </Text>
                      </View>
                      {item.daysTotal !== null && (
                        <Text style={styles.durationText}>
                          {item.daysTotal} {item.daysTotal === 1 ? 'day' : 'days'}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.dateRange}>{dateRange}</Text>
                  </View>

                  {/* Actions */}
                  <View style={styles.actionRow}>
                    {onEditCycle && (
                      <Pressable
                        onPress={() => onEditCycle(item.cycleId)}
                        style={styles.actionBtn}
                        accessibilityLabel="Edit salary cycle"
                      >
                        <Text style={styles.actionText}>Edit</Text>
                      </Pressable>
                    )}
                    {onDeleteCycle && (
                      <Pressable
                        onPress={() => onDeleteCycle(item.cycleId)}
                        style={styles.actionBtn}
                        accessibilityLabel="Delete salary cycle"
                      >
                        <Text style={styles.actionDeleteText}>Delete</Text>
                      </Pressable>
                    )}
                  </View>
                </View>

                {/* Metrics Grid */}
                <View style={styles.metricsGrid}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Salary</Text>
                    <Text style={styles.metricValuePrimary}>
                      {formatPaiseToInr(item.baseSalaryPaise, false)}
                    </Text>
                  </View>

                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>
                      {isLatest ? 'Carried Over' : 'Opening'}
                    </Text>
                    <Text style={styles.metricValue}>
                      {formatPaiseToInr(item.openingBalancePaise, false)}
                    </Text>
                  </View>

                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Expenses</Text>
                    <Text style={styles.metricValueExpense}>
                      {formatPaiseToInr(item.expensesPaise, false)}
                    </Text>
                  </View>

                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>
                      {item.isActive ? 'Remaining' : 'Saved'}
                    </Text>
                    <Text
                      style={[
                        styles.metricValue,
                        item.availableBalancePaise >= 0
                          ? styles.metricPositive
                          : styles.metricNegative,
                      ]}
                    >
                      {formatPaiseToInr(item.availableBalancePaise, false)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      marginVertical: spacing.lg,
    },
    sectionTitle: {
      ...typography.headingSmall,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    timelineList: {
      paddingLeft: spacing.xs,
    },
    timelineRow: {
      flexDirection: 'row',
      marginBottom: spacing.md,
    },
    nodeColumn: {
      width: 28,
      alignItems: 'center',
    },
    nodeDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      marginTop: 6,
      zIndex: 2,
    },
    nodeActive: {
      backgroundColor: colors.primary,
      borderWidth: 2,
      borderColor: colors.surface,
    },
    nodeClosed: {
      backgroundColor: colors.borderStrong,
    },
    connectorLine: {
      width: 2,
      flex: 1,
      backgroundColor: colors.border,
      marginVertical: 4,
    },
    card: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginLeft: spacing.sm,
      ...shadows.card,
    },
    cardActive: {
      borderColor: colors.primary,
      borderWidth: 1.5,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.md,
    },
    titleColumn: {
      flex: 1,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: 4,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radii.sm,
    },
    badgeActive: {
      backgroundColor: colors.primaryLight,
    },
    badgeClosed: {
      backgroundColor: colors.surfaceMuted,
    },
    statusText: {
      ...typography.bodySmall,
      fontWeight: '600',
    },
    statusTextActive: {
      color: isDark ? '#93C5FD' : colors.primary,
    },
    statusTextClosed: {
      color: colors.textSecondary,
    },
    durationText: {
      ...typography.bodySmall,
      color: colors.textSecondary,
    },
    dateRange: {
      ...typography.bodyMedium,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    actionRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    actionBtn: {
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
    },
    actionText: {
      ...typography.bodySmall,
      color: colors.primary,
      fontWeight: '500',
    },
    actionDeleteText: {
      ...typography.bodySmall,
      color: colors.danger,
      fontWeight: '500',
    },
    metricsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceSubtle,
      borderRadius: radii.sm,
      padding: spacing.sm,
    },
    metricItem: {
      alignItems: 'center',
    },
    metricLabel: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    metricValue: {
      ...typography.bodyMedium,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    metricValuePrimary: {
      ...typography.bodyMedium,
      fontWeight: '700',
      color: colors.primary,
    },
    metricValueExpense: {
      ...typography.bodyMedium,
      fontWeight: '600',
      color: colors.danger,
    },
    metricPositive: {
      color: colors.success,
    },
    metricNegative: {
      color: colors.danger,
    },
  });

