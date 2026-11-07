import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, shadows, spacing, useTheme, ThemeColors } from '@/theme';
import { SpendingInsightsData } from '@/domain/insights/insightsTypes';

interface CategoryComparisonCardProps {
  insights: SpendingInsightsData;
}

export function CategoryComparisonCard({ insights }: CategoryComparisonCardProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const { topExpenseCategories, categoryComparisons } = insights;

  if (topExpenseCategories.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Ionicons name="pie-chart" size={18} color={colors.primary} />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.cardTitle}>Category Breakdown & History</Text>
          <Text style={styles.cardSubtitle}>
            Highest expense areas compared to prior cycle
          </Text>
        </View>
      </View>

      {/* Top 3 Categories Bars */}
      <View style={styles.categoriesContainer}>
        {topExpenseCategories.slice(0, 4).map((cat) => (
          <View key={cat.categoryId} style={styles.catRow}>
            <View style={styles.catHeader}>
              <View style={styles.catNameRow}>
                <View
                  style={[styles.colorIndicator, { backgroundColor: cat.color || colors.primary }]}
                />
                <Text style={styles.catName}>{cat.categoryName}</Text>
              </View>
              <View style={styles.catAmountRow}>
                <Text style={styles.catAmount}>{cat.formattedAmount}</Text>
                <Text style={styles.catPercent}>({cat.percentOfCycleExpenses}%)</Text>
              </View>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.min(100, Math.max(3, cat.percentOfCycleExpenses))}%`,
                    backgroundColor: cat.color || colors.primary,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Cycle-over-Cycle Comparisons */}
      {categoryComparisons.length > 0 && (
        <View style={styles.comparisonsSection}>
          <Text style={styles.comparisonHeaderTitle}>Cycle-Over-Cycle Shift</Text>
          {categoryComparisons.slice(0, 3).map((comp) => (
            <View key={comp.categoryId} style={styles.compRow}>
              <Ionicons
                name={comp.isHigher ? 'trending-up' : 'trending-down'}
                size={14}
                color={comp.isHigher ? colors.danger : colors.success}
              />
              <Text style={styles.compMessage}>{comp.message}</Text>
            </View>
          ))}
        </View>
      )}
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
    textCol: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    cardSubtitle: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    categoriesContainer: {
      gap: 10,
      marginBottom: spacing.sm,
    },
    catRow: {
      gap: 4,
    },
    catHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    catNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    colorIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    catName: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    catAmountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    catAmount: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    catPercent: {
      fontSize: 11,
      color: colors.textTertiary,
    },
    barTrack: {
      height: 6,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 3,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 3,
    },
    comparisonsSection: {
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      paddingTop: spacing.md,
      marginTop: spacing.xs,
      gap: 6,
    },
    comparisonHeaderTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    compRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.surfaceSecondary,
      padding: 8,
      borderRadius: radii.sm,
    },
    compMessage: {
      flex: 1,
      fontSize: 12,
      color: colors.textPrimary,
      lineHeight: 16,
    },
  });
