import { StyleSheet, Text, View } from 'react-native';
import { WidgetSnapshotData } from '@/domain/widgetSnapshot';
import { colors, radii, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

interface SmallWidgetLayoutProps {
  data: WidgetSnapshotData;
}

export function SmallWidgetLayout({ data }: SmallWidgetLayoutProps) {
  const isDeficit = data.isDeficit;

  return (
    <View style={styles.container}>
      {/* Header: Finly Branding */}
      <View style={styles.headerRow}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Ionicons name="wallet" size={12} color="#FFFFFF" />
          </View>
          <Text style={styles.brandText}>Finly</Text>
        </View>
        <Text style={styles.cycleBadgeText} numberOfLines={1}>
          {data.hasActiveCycle ? 'ACTIVE' : 'NO CYCLE'}
        </Text>
      </View>

      {/* Main Metric: Available Balance */}
      <View style={styles.metricBlock}>
        <Text style={styles.metricLabel}>Available Balance</Text>
        <Text
          style={[styles.balanceValue, isDeficit && styles.deficitValue]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {data.availableBalanceFormatted}
        </Text>
      </View>

      {/* Footer: Date Range & Last Updated */}
      <View style={styles.footerCol}>
        <Text style={styles.cycleDateText} numberOfLines={1}>
          {data.cyclePeriodLabel}
        </Text>
        <Text style={styles.updatedText}>{data.lastUpdatedFormatted}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 155,
    height: 155,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.md,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logoBadge: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  cycleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radii.full,
  },
  metricBlock: {
    marginVertical: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    lineHeight: 24,
  },
  deficitValue: {
    color: colors.danger,
  },
  footerCol: {
    gap: 2,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 4,
  },
  cycleDateText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  updatedText: {
    fontSize: 9,
    color: colors.textTertiary,
  },
});
