import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows, spacing } from '@/theme';
import { DriveBackupItem } from '@/domain/backup/backupTypes';

interface RemoteBackupsListProps {
  backups: DriveBackupItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectBackup: (item: DriveBackupItem) => void;
  disabled?: boolean;
}

export function RemoteBackupsList({
  backups,
  isLoading,
  onRefresh,
  onSelectBackup,
  disabled,
}: RemoteBackupsListProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatTimestamp = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerTitleCol}>
          <Text style={styles.cardTitle}>Cloud Backup Archives</Text>
          <Text style={styles.cardSubtitle}>
            Available in Google Drive appDataFolder
          </Text>
        </View>
        <TouchableOpacity
          onPress={onRefresh}
          disabled={isLoading || disabled}
          style={styles.refreshButton}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="reload" size={18} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      {backups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cloud-outline" size={36} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>No Backups Found</Text>
          <Text style={styles.emptySubtitle}>
            Tap &quot;Back Up Now&quot; above to create your first encrypted archive.
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {backups.map((item) => (
            <View key={item.id} style={styles.backupRow}>
              <View style={styles.fileIconCircle}>
                <Ionicons name="document-lock" size={20} color={colors.primary} />
              </View>
              <View style={styles.backupDetailsCol}>
                <Text style={styles.backupDate}>{formatTimestamp(item.createdTime)}</Text>
                <View style={styles.badgeRow}>
                  <Text style={styles.backupSize}>{formatFileSize(item.sizeBytes)}</Text>
                  <View style={styles.dot} />
                  <Text style={styles.encryptedBadge}>AES-256-GCM</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.restoreRowButton}
                onPress={() => onSelectBackup(item)}
                disabled={disabled}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh-circle-outline" size={16} color={colors.primary} />
                <Text style={styles.restoreRowButtonText}>Restore</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerTitleCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  refreshButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
  listContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
    gap: 8,
  },
  backupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  fileIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  backupDetailsCol: {
    flex: 1,
  },
  backupDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  backupSize: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textTertiary,
  },
  encryptedBadge: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  restoreRowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.sm,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 4,
  },
  restoreRowButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
});
