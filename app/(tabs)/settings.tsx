import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { WidgetPreviewCard } from '@/features/widgets';
import { radii, shadows, spacing, typography, useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useBackupStore } from '@/store';
import { useEffect } from 'react';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark, themeMode, setThemeMode } = useTheme();
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
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* App Info Card */}
      <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.logoRow}>
          <Image source={require('../../assets/images/icon.png')} style={styles.logoBox} resizeMode="contain" />
          <View>
            <Text style={[styles.appTitle, { color: colors.textPrimary }]}>Finly</Text>
            <Text style={[styles.versionText, { color: colors.textSecondary }]}>Version 1.0.0 • Local-First Personal Finance</Text>
          </View>
        </View>
        <Text style={[styles.infoDescription, { color: colors.textSecondary }]}>
          Finly manages expense tracking and cash flow based on your actual salary receipt dates rather than fixed calendar months.
        </Text>
      </View>

      {/* Appearance & Night Vision Theme Selector */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Appearance & Theme</Text>
        </View>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
          Reduce eye strain at night with dark mode, or automatically match your system appearance.
        </Text>

        <View style={styles.themeSelectorRow}>
          <TouchableOpacity
            style={[
              styles.themeOptionBtn,
              {
                backgroundColor: themeMode === 'system' ? colors.primaryLight : colors.surfaceSubtle,
                borderColor: themeMode === 'system' ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setThemeMode('system')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="phone-portrait-outline"
              size={18}
              color={themeMode === 'system' ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.themeOptionText,
                { color: themeMode === 'system' ? colors.primary : colors.textPrimary },
              ]}
            >
              System
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.themeOptionBtn,
              {
                backgroundColor: themeMode === 'light' ? colors.primaryLight : colors.surfaceSubtle,
                borderColor: themeMode === 'light' ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setThemeMode('light')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="sunny-outline"
              size={18}
              color={themeMode === 'light' ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.themeOptionText,
                { color: themeMode === 'light' ? colors.primary : colors.textPrimary },
              ]}
            >
              Light
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.themeOptionBtn,
              {
                backgroundColor: themeMode === 'dark' ? (isDark ? '#1E3A8A' : colors.primaryLight) : colors.surfaceSubtle,
                borderColor: themeMode === 'dark' ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setThemeMode('dark')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="moon-outline"
              size={18}
              color={themeMode === 'dark' ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.themeOptionText,
                { color: themeMode === 'dark' ? (isDark ? '#93C5FD' : colors.primary) : colors.textPrimary },
              ]}
            >
              Dark
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cloud Backup & Recovery Entry Point */}
      <TouchableOpacity
        style={[styles.backupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => router.push('/backup' as never)}
        activeOpacity={0.8}
      >
        <View style={[styles.backupIconCircle, { backgroundColor: isDark ? colors.surfaceSecondary : '#EFF6FF' }]}>
          <Ionicons name="cloud-upload" size={22} color={colors.primary} />
        </View>
        <View style={styles.backupTextCol}>
          <View style={styles.backupTitleRow}>
            <Text style={[styles.backupTitle, { color: colors.textPrimary }]}>Cloud Backup & Recovery</Text>
            <View
              style={[
                styles.backupStatusBadge,
                isSignedIn
                  ? (isDark ? { backgroundColor: 'rgba(34, 197, 94, 0.2)' } : styles.badgeActive)
                  : (isDark ? { backgroundColor: colors.surfaceSecondary } : styles.badgeOffline),
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
          <Text style={[styles.backupSubtitle, { color: colors.textSecondary }]}>
            Google Drive appDataFolder • Last: {formatLastBackup(lastBackupTime)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>

      {/* Widget Preview & Sync Card */}
      <WidgetPreviewCard />

      {/* Privacy & Storage Section */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.success} />
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Privacy & Data Protection</Text>
        </View>
        <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
          • Local-First: All transaction records are stored on-device in SQLite.
        </Text>
        <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
          • Zero-Knowledge Backup: AES-256-GCM encrypted with your recovery passphrase.
        </Text>
        <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
          • Offline-Ready: Speech recognition and analytics run without external API subscriptions.
        </Text>
        <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
          • Deterministic: Financial figures are stored strictly as integer paise with no floating-point currency drift.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  infoCard: {
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  appTitle: {
    ...typography.headingMedium,
  },
  versionText: {
    ...typography.caption,
  },
  infoDescription: {
    ...typography.bodyMedium,
    lineHeight: 20,
  },
  themeSelectorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  themeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    gap: 6,
  },
  themeOptionText: {
    ...typography.bodyMedium,
    fontWeight: '700',
  },
  backupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  backupIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  },
  backupSubtitle: {
    fontSize: 12,
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
    color: '#16A34A',
  },
  badgeTextOffline: {
    color: '#94A3B8',
  },
  card: {
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    marginVertical: spacing.sm,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    ...typography.headingSmall,
  },
  cardSubtitle: {
    ...typography.bodySmall,
    lineHeight: 18,
  },
  cardBody: {
    ...typography.bodyMedium,
    marginBottom: 4,
    lineHeight: 20,
  },
});
