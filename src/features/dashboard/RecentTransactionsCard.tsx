import { useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { TransactionWithCategory } from '@/types';
import { formatDisplayDate } from '@/domain/dateUtils';
import { formatPaiseToInr } from '@/utils';
import { radii, shadows, spacing, typography, useTheme, ThemeColors } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

interface RecentTransactionsCardProps {
  transactions: TransactionWithCategory[];
}

export function RecentTransactionsCard({ transactions }: RecentTransactionsCardProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  // Take top 5 latest transactions
  const recentList = transactions.slice(0, 5);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Recent Transactions</Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/transactions')}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {recentList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={32} color={colors.textTertiary} />
          <Text style={styles.emptyText}>No transactions recorded in this period</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {recentList.map((tx) => {
            const isIncome = tx.type === 'income';
            return (
              <View key={tx.id} style={styles.txRow}>
                {/* Category Icon */}
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: (tx.category?.color ?? colors.primary) + (isDark ? '33' : '20') },
                  ]}
                >
                  <Ionicons
                    name={isIncome ? 'arrow-down' : 'arrow-up'}
                    size={18}
                    color={tx.category?.color ?? colors.primary}
                  />
                </View>

                {/* Description & Category */}
                <View style={styles.detailsCol}>
                  <Text style={styles.descText} numberOfLines={1}>
                    {tx.description}
                  </Text>
                  <Text style={styles.subText}>
                    {tx.category?.name ?? 'General'} • {formatDisplayDate(tx.transactionDate)}
                  </Text>
                </View>

                {/* Amount */}
                <View style={styles.amountCol}>
                  <Text
                    style={[
                      styles.amountText,
                      isIncome ? styles.incomeText : styles.expenseText,
                    ]}
                  >
                    {isIncome ? '+' : '-'}
                    {formatPaiseToInr(tx.amount)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
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
      marginBottom: spacing.md,
    },
    title: {
      ...typography.headingSmall,
      color: colors.textPrimary,
    },
    viewAllText: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: '700',
    },
    listContainer: {
      gap: spacing.sm,
    },
    txRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.xs,
      gap: spacing.md,
    },
    iconBox: {
      width: 38,
      height: 38,
      borderRadius: radii.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    detailsCol: {
      flex: 1,
    },
    descText: {
      ...typography.bodyMedium,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    subText: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    amountCol: {
      alignItems: 'flex-end',
    },
    amountText: {
      ...typography.bodyMedium,
      fontWeight: '700',
    },
    incomeText: {
      color: colors.success,
    },
    expenseText: {
      color: colors.danger,
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
