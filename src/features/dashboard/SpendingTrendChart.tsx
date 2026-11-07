import { useState, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { DailySpendingPoint, WeeklySpendingPoint } from '@/domain/analyticsEngine';
import { formatPaiseToInr } from '@/utils';
import { radii, shadows, spacing, typography, useTheme, ThemeColors } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

interface SpendingTrendChartProps {
  dailySpending: DailySpendingPoint[];
  weeklySpending: WeeklySpendingPoint[];
  averageDailyExpensePaise: number;
}

export function SpendingTrendChart({
  dailySpending,
  weeklySpending,
  averageDailyExpensePaise,
}: SpendingTrendChartProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);

  const isDaily = viewMode === 'daily';
  const dataPoints = isDaily ? dailySpending : weeklySpending;

  // Compute maximum amount for scaling
  const maxAmount = Math.max(
    1,
    ...dataPoints.map((p) => p.amountPaise)
  );

  const hasAnySpending = dataPoints.some((p) => p.amountPaise > 0);

  const selectedPoint = selectedPointIndex !== null ? dataPoints[selectedPointIndex] : null;

  return (
    <View style={styles.container}>
      {/* Header with Title and Mode Switcher */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Spending Trend</Text>
          <Text style={styles.subtitle}>
            Avg {formatPaiseToInr(averageDailyExpensePaise)}/day
          </Text>
        </View>

        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, isDaily && styles.activeToggleButton]}
            onPress={() => {
              setViewMode('daily');
              setSelectedPointIndex(null);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleText, isDaily && styles.activeToggleText]}>
              Daily
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, !isDaily && styles.activeToggleButton]}
            onPress={() => {
              setViewMode('weekly');
              setSelectedPointIndex(null);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleText, !isDaily && styles.activeToggleText]}>
              Weekly
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Selected Data Point Tooltip */}
      {selectedPoint && (
        <View style={styles.tooltipBox}>
          <Text style={styles.tooltipLabel}>
            {'displayDate' in selectedPoint
              ? `${selectedPoint.displayDate} (${selectedPoint.dayOfWeek})`
              : `${selectedPoint.label} (${selectedPoint.startDate} to ${selectedPoint.endDate})`}
          </Text>
          <Text style={styles.tooltipAmount}>
            {formatPaiseToInr(selectedPoint.amountPaise)}
          </Text>
        </View>
      )}

      {/* Bar Chart Visualization */}
      {!hasAnySpending ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bar-chart-outline" size={32} color={colors.textTertiary} />
          <Text style={styles.emptyText}>No spending recorded in this period</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chartScrollContainer}
        >
          {dataPoints.map((point, idx) => {
            const isSelected = selectedPointIndex === idx;
            const heightPercentage = Math.max(
              point.amountPaise > 0 ? 8 : 0,
              Math.min(100, Math.round((point.amountPaise / maxAmount) * 100))
            );
            const isToday = 'isToday' in point ? point.isToday : false;

            return (
              <TouchableOpacity
                key={'date' in point ? point.date : point.weekIndex}
                style={styles.barColumn}
                onPress={() => setSelectedPointIndex(idx)}
                activeOpacity={0.8}
              >
                {/* Bar Track & Fill */}
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { height: `${heightPercentage}%` },
                      isSelected && styles.barSelectedFill,
                      isToday && !isSelected && styles.barTodayFill,
                      point.amountPaise === 0 && styles.barZeroFill,
                    ]}
                  />
                </View>

                {/* X-Axis Labels */}
                <Text
                  style={[
                    styles.barLabel,
                    isSelected && styles.barSelectedLabel,
                    isToday && styles.barTodayLabel,
                  ]}
                  numberOfLines={1}
                >
                  {'dayOfWeek' in point ? point.dayOfWeek : point.label}
                </Text>

                {'displayDate' in point && (
                  <Text style={styles.barSubLabel}>{point.displayDate.slice(0, 2)}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
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
    title: {
      ...typography.headingSmall,
      color: colors.textPrimary,
    },
    subtitle: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    toggleContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radii.full,
      padding: 3,
    },
    toggleButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
      borderRadius: radii.full,
    },
    activeToggleButton: {
      backgroundColor: colors.surface,
      ...shadows.sm,
    },
    toggleText: {
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    activeToggleText: {
      color: colors.textPrimary,
      fontWeight: '700',
    },
    tooltipBox: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radii.md,
      padding: spacing.sm,
      marginBottom: spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    tooltipLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    tooltipAmount: {
      ...typography.bodyMedium,
      color: colors.danger,
      fontWeight: '700',
    },
    chartScrollContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingTop: spacing.md,
      paddingBottom: spacing.xs,
      gap: 8,
      minWidth: '100%',
      justifyContent: 'space-between',
    },
    barColumn: {
      alignItems: 'center',
      width: 38,
    },
    barTrack: {
      height: 120,
      width: 14,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radii.full,
      justifyContent: 'flex-end',
      overflow: 'hidden',
      marginBottom: 6,
    },
    barFill: {
      width: '100%',
      backgroundColor: colors.primary,
      borderRadius: radii.full,
    },
    barZeroFill: {
      backgroundColor: 'transparent',
    },
    barSelectedFill: {
      backgroundColor: isDark ? '#60A5FA' : colors.primaryDark,
    },
    barTodayFill: {
      backgroundColor: colors.accent,
    },
    barLabel: {
      ...typography.caption,
      fontSize: 10,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    barSubLabel: {
      fontSize: 9,
      color: colors.textTertiary,
    },
    barSelectedLabel: {
      color: colors.primary,
      fontWeight: '700',
    },
    barTodayLabel: {
      color: colors.accent,
      fontWeight: '700',
    },
    emptyContainer: {
      height: 120,
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.xs,
    },
    emptyText: {
      ...typography.bodyMedium,
      color: colors.textTertiary,
    },
  });
