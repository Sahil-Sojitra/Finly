import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows, spacing } from '@/theme';
import { SpendingWarning } from '@/domain/insights/insightsTypes';

interface SpendingWarningsCardProps {
  warnings: SpendingWarning[];
}

export function SpendingWarningsCard({ warnings }: SpendingWarningsCardProps) {
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
                      { color: isCritical ? colors.danger : '#92400E' },
                    ]}
                  >
                    {warn.title}
                  </Text>
                  {warn.metric && (
                    <Text style={styles.metricBadge}>{warn.metric}</Text>
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

const styles = StyleSheet.create({
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
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
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
    color: '#166534',
  },
  healthySubtitle: {
    fontSize: 12,
    color: '#15803D',
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
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  warningItemNormal: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
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
    backgroundColor: '#FEE2E2',
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
