import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CategorySpendBreakdown } from '@/domain/analyticsEngine';
import { formatPaiseToInr } from '@/utils';
import { radii, shadows, spacing, typography, useTheme, ThemeColors } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

interface CategoryBreakdownCardProps {
  categories: CategorySpendBreakdown[];
  highestCategory: CategorySpendBreakdown | null;
  totalExpensesPaise: number;
}

export function CategoryBreakdownCard({
  categories,
  highestCategory,
  totalExpensesPaise,
}: CategoryBreakdownCardProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  if (categories.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Category Breakdown</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="pie-chart-outline" size={32} color={colors.textTertiary} />
          <Text style={styles.emptyText}>No expenses recorded in this period</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Category Breakdown</Text>
        <Text style={styles.totalText}>{formatPaiseToInr(totalExpensesPaise)}</Text>
      </View>

      {/* Highest Expense Category Callout */}
      {highestCategory && (
        <View style={styles.highestCallout}>
          <Ionicons name="sparkles" size={16} color={isDark ? colors.warning : '#B45309'} />
          <Text style={styles.highestCalloutText}>
            Top Spend: <Text style={styles.boldText}>{highestCategory.categoryName}</Text> ({highestCategory.percentageOfTotal}% of expenses)
          </Text>
        </View>
      )}

      {/* Category List */}
      <View style={styles.listContainer}>
        {categories.map((cat) => (
          <View key={cat.categoryId} style={styles.categoryItem}>
            <View style={styles.categoryTopRow}>
              <View style={styles.categoryLeft}>
                <View style={[styles.categoryColorDot, { backgroundColor: cat.categoryColor }]} />
                <Text style={styles.categoryName}>{cat.categoryName}</Text>
                <Text style={styles.txCountText}>({cat.transactionCount} tx)</Text>
              </View>

              <View style={styles.categoryRight}>
                <Text style={styles.amountText}>{formatPaiseToInr(cat.amountPaise)}</Text>
                <Text style={styles.percentText}>{cat.percentageOfTotal}%</Text>
              </View>
            </View>

            {/* Proportional Progress Bar */}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${cat.percentageOfTotal}%`,
                    backgroundColor: cat.categoryColor,
                  },
                ]}
              />
            </View>
          </View>
        ))}
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
      ...shadows.sm,
      marginVertical: spacing.sm,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    title: {
      ...typography.headingSmall,
      color: colors.textPrimary,
    },
    totalText: {
      ...typography.headingSmall,
      color: colors.textPrimary,
      fontWeight: '700',
    },
    highestCallout: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(251, 191, 36, 0.2)' : '#FEF3C7',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radii.md,
      gap: spacing.xs,
      marginBottom: spacing.md,
    },
    highestCalloutText: {
      ...typography.caption,
      color: isDark ? colors.warning : '#92400E',
      fontWeight: '500',
    },
    boldText: {
      fontWeight: '700',
    },
    listContainer: {
      gap: spacing.md,
    },
    categoryItem: {
      gap: 6,
    },
    categoryTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    categoryLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    categoryColorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    categoryName: {
      ...typography.bodyMedium,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    txCountText: {
      ...typography.caption,
      color: colors.textTertiary,
    },
    categoryRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    amountText: {
      ...typography.bodyMedium,
      color: colors.textPrimary,
      fontWeight: '700',
    },
    percentText: {
      ...typography.caption,
      color: colors.textSecondary,
      width: 32,
      textAlign: 'right',
      fontWeight: '600',
    },
    progressTrack: {
      height: 6,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radii.full,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: radii.full,
    },
    emptyContainer: {
      height: 100,
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.xs,
    },
    emptyText: {
      ...typography.bodyMedium,
      color: colors.textTertiary,
    },
  });
