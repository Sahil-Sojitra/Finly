import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, shadows, spacing, useTheme, ThemeColors } from '@/theme';
import { SpendingWarning } from '@/domain/insights/insightsTypes';

interface SpendingWarningsCardProps {
  warnings: SpendingWarning[];
}

export function SpendingWarningsCard({ warnings }: SpendingWarningsCardProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  if (warnings.length === 0) {
    return (
      <View style={[styles.card, styles.cardHealthy]}>
        <View style={styles.healthyRow}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <View style={styles.textCol}>
            <Text style={styles.healthyTitle}>Pacing is on Track</Text>
            <Text style={styles.healthySubtitle}>
              No budget threshold warnings active for this salary cycle.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons name="warning" size={18} color={colors.danger} />
        <Text style={styles.cardTitle}>Spending Alerts ({warnings.length})</Text>
      </View>

      <View style={styles.list}>
        {warnings.map((warn) => {
          const isCritical = warn.level === 'critical';
          return (
            <View
              key={warn.id}
              style={[
                styles.warningItem,
                isCritical ? styles.warningItemCritical : styles.warningItemNormal,
              ]}
            >
              <Ionicons
                name={isCritical ? 'alert-circle' : 'warning-outline'}
                size={18}
                color={isCritical ? colors.danger : colors.warning}
                style={styles.itemIcon}
              />
              <View style={styles.textCol}>
                <View style={styles.itemTitleRow}>
                  <Text
                    style={[
                      styles.itemTitle,
                      { color: isCritical ? colors.danger : (isDark ? colors.warning : '#92400E') },
                    ]}
                  >
                    {warn.title}
                  </Text>
                  {warn.metric && (
                    <Text style={[styles.metricBadge, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.25)' : '#FEE2E2' }]}>
                      {warn.metric}
                    </Text>
                  )}
                </View>
                <Text style={styles.itemMessage}>{warn.message}</Text>
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
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.lg,
      marginBottom: spacing.md,
      ...shadows.sm,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    cardHealthy: {
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#F0FDF4',
      borderColor: isDark ? colors.success : '#BBF7D0',
      padding: spacing.md,
    },
    healthyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    healthyTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: isDark ? colors.success : '#166534',
    },
    healthySubtitle: {
      fontSize: 12,
      color: isDark ? colors.textSecondary : '#15803D',
      marginTop: 2,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.md,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    list: {
      gap: spacing.sm,
    },
    warningItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderRadius: radii.md,
      padding: spacing.md,
      borderWidth: 1,
    },
    warningItemCritical: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
      borderColor: isDark ? colors.danger : '#FCA5A5',
    },
    warningItemNormal: {
      backgroundColor: isDark ? 'rgba(251, 191, 36, 0.15)' : '#FFFBEB',
      borderColor: isDark ? colors.warning : '#FDE68A',
    },
    itemIcon: {
      marginRight: spacing.sm,
      marginTop: 1,
    },
    textCol: {
      flex: 1,
    },
    itemTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    itemTitle: {
      fontSize: 13,
      fontWeight: '700',
    },
    metricBadge: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.danger,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    itemMessage: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 16,
    },
  });
