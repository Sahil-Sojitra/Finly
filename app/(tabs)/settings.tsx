import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { WidgetPreviewCard } from '@/features/widgets';
import { colors, radii, shadows, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useBackupStore } from '@/store';
import { useEffect } from 'react';

export default function SettingsScreen() {
  const router = useRouter();
  const { isSignedIn, lastBackupTime, loadBackupState } = useBackupStore();

  useEffect(() => {
    loadBackupState();
  }, [loadBackupState]);

  const formatLastBackup = (iso: string | null) => {
    if (!iso) return 'Never backed up';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return 'Never';
    }
  };

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

      {/* Cloud Backup & Recovery Entry Point */}
      <TouchableOpacity
        style={styles.backupCard}
        onPress={() => router.push('/backup' as never)}
        activeOpacity={0.8}
      >
        <View style={styles.backupIconCircle}>
          <Ionicons name="cloud-upload" size={22} color={colors.primary} />
        </View>
        <View style={styles.backupTextCol}>
          <View style={styles.backupTitleRow}>
            <Text style={styles.backupTitle}>Cloud Backup & Recovery</Text>
            <View
              style={[
                styles.backupStatusBadge,
                isSignedIn ? styles.badgeActive : styles.badgeOffline,
              ]}
            >
              <Text
                style={[
                  styles.backupStatusBadgeText,
                  isSignedIn ? styles.badgeTextActive : styles.badgeTextOffline,
                ]}
              >
                {isSignedIn ? 'Connected' : 'Offline'}
              </Text>
            </View>
          </View>
          <Text style={styles.backupSubtitle}>
            Google Drive appDataFolder • Last: {formatLastBackup(lastBackupTime)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>

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
          • Zero-Knowledge Backup: AES-256-GCM encrypted with your recovery passphrase.
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
  backupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  backupIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  backupTextCol: {
    flex: 1,
  },
  backupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backupTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  backupSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  backupStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeActive: {
    backgroundColor: '#DCFCE7',
  },
  badgeOffline: {
    backgroundColor: '#F1F5F9',
  },
  backupStatusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  badgeTextActive: {
    color: colors.success,
  },
  badgeTextOffline: {
    color: colors.textTertiary,
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
