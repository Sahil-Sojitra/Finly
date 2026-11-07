import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, shadows, spacing, useTheme, ThemeColors } from '@/theme';
import { UnusualSpendingAnomaly } from '@/domain/insights/insightsTypes';

interface UnusualSpendingCardProps {
  anomalies: UnusualSpendingAnomaly[];
}

export function UnusualSpendingCard({ anomalies }: UnusualSpendingCardProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  if (anomalies.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Ionicons name="flash" size={18} color="#D97706" />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.cardTitle}>Unusual Spending Detected</Text>
          <Text style={styles.cardSubtitle}>
            Flagged against historical cycle averages
          </Text>
        </View>
      </View>

      <View style={styles.list}>
        {anomalies.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemIconCol}>
              <Ionicons
                name={
                  item.type === 'single_transaction_spike'
                    ? 'receipt-outline'
                    : 'trending-up'
                }
                size={16}
                color={colors.primary}
              />
            </View>
            <View style={styles.itemTextCol}>
              <View style={styles.itemTitleRow}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                {item.formattedAmount && (
                  <Text style={styles.itemAmount}>{item.formattedAmount}</Text>
                )}
              </View>
              <Text style={styles.itemDesc}>{item.description}</Text>
            </View>
          </View>
        ))}
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
      backgroundColor: isDark ? 'rgba(217, 119, 6, 0.2)' : '#FEF3C7',
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
    list: {
      gap: spacing.sm,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radii.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    itemIconCol: {
      marginRight: spacing.sm,
      marginTop: 2,
    },
    itemTextCol: {
      flex: 1,
    },
    itemTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 2,
    },
    itemTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    itemAmount: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.danger,
    },
    itemDesc: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 16,
    },
  });
