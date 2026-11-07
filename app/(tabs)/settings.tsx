import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { WidgetPreviewCard } from '@/features/widgets';
import { colors, radii, shadows, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* App Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.logoRow}>
          <View style={styles.logoBox}>
            <Ionicons name="wallet" size={24} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.appTitle}>Finly</Text>
            <Text style={styles.versionText}>Version 1.0.0 • Local-First Personal Finance</Text>
          </View>
        </View>
        <Text style={styles.infoDescription}>
          Finly manages expense tracking and cash flow based on your actual salary receipt dates rather than fixed calendar months.
        </Text>
      </View>

      {/* Widget Preview & Sync Card */}
      <WidgetPreviewCard />

      {/* Privacy & Storage Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.success} />
          <Text style={styles.cardTitle}>Privacy & Data Protection</Text>
        </View>
        <Text style={styles.cardBody}>
          • Local-First: All transaction records are stored on-device in SQLite.
        </Text>
        <Text style={styles.cardBody}>
          • Offline-Ready: Speech recognition and analytics run without external API subscriptions.
        </Text>
        <Text style={styles.cardBody}>
          • Deterministic: Financial figures are stored strictly as integer paise with no floating-point currency drift.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  infoCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appTitle: {
    ...typography.headingMedium,
    color: colors.textPrimary,
  },
  versionText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  infoDescription: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.sm,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    ...typography.headingSmall,
    color: colors.textPrimary,
  },
  cardBody: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: 4,
    lineHeight: 20,
  },
});
