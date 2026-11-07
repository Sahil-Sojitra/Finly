import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, shadows, spacing, useTheme, ThemeColors } from '@/theme';
import { SpendingInsightsData } from '@/domain/insights/insightsTypes';

interface DailyWeeklySummaryCardProps {
  insights: SpendingInsightsData;
}

export function DailyWeeklySummaryCard({ insights }: DailyWeeklySummaryCardProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const isWeekHigher = insights.weekOverWeekChangePercent > 0;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Ionicons name="calendar" size={20} color={colors.primary} />
        </View>
        <Text style={styles.cardTitle}>Daily & Weekly Trends</Text>
      </View>

      {/* Daily Row */}
      <View style={styles.trendRow}>
        <View style={styles.trendIconCol}>
          <View style={[styles.miniCircle, { backgroundColor: isDark ? colors.surfaceSecondary : '#EFF6FF' }]}>
            <Ionicons name="today-outline" size={16} color={colors.primary} />
          </View>
        </View>
        <View style={styles.trendDetailsCol}>
          <Text style={styles.trendLabel}>Today’s Spending</Text>
          <Text style={styles.trendValue}>{insights.formattedTodaySpending}</Text>
          <Text style={styles.trendSubtext}>
            {insights.isTodaySpendingHigher
              ? `Above daily average by ${insights.formattedTodaySpending}`
              : `Within safe daily average pacing`}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Weekly Row */}
      <View style={styles.trendRow}>
        <View style={styles.trendIconCol}>
          <View style={[styles.miniCircle, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#F0FDF4' }]}>
            <Ionicons name="trending-up" size={16} color={colors.success} />
          </View>
        </View>
        <View style={styles.trendDetailsCol}>
          <View style={styles.weekTitleRow}>
            <Text style={styles.trendLabel}>Past 7 Days</Text>
            {insights.previousWeekSpendingPaise > 0 && (
              <View
                style={[
                  styles.pctBadge,
                  isWeekHigher ? styles.pctBadgeDanger : styles.pctBadgeSuccess,
                ]}
              >
                <Ionicons
                  name={isWeekHigher ? 'arrow-up' : 'arrow-down'}
                  size={10}
                  color={isWeekHigher ? colors.danger : colors.success}
                />
                <Text
                  style={[
                    styles.pctBadgeText,
                    isWeekHigher ? styles.pctBadgeTextDanger : styles.pctBadgeTextSuccess,
                  ]}
                >
                  {Math.abs(insights.weekOverWeekChangePercent)}% vs prior week
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.trendValue}>{insights.formattedCurrentWeekSpending}</Text>
          <Text style={styles.trendSubtext}>
            Previous 7 days: {insights.formattedPreviousWeekSpending}
          </Text>
        </View>
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
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? colors.surfaceSecondary : '#EFF6FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    trendRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: spacing.xs,
    },
    trendIconCol: {
      marginRight: spacing.sm,
    },
    miniCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    trendDetailsCol: {
      flex: 1,
    },
    weekTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    trendLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    pctBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      gap: 2,
    },
    pctBadgeDanger: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2',
    },
    pctBadgeSuccess: {
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7',
    },
    pctBadgeText: {
      fontSize: 10,
      fontWeight: '700',
    },
    pctBadgeTextDanger: {
      color: colors.danger,
    },
    pctBadgeTextSuccess: {
      color: colors.success,
    },
    trendValue: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginVertical: 2,
    },
    trendSubtext: {
      fontSize: 11,
      color: colors.textTertiary,
    },
    divider: {
      height: 1,
      backgroundColor: colors.borderLight,
      marginVertical: spacing.md,
    },
  });
