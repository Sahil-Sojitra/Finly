import { useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, shadows, spacing, useTheme, ThemeColors } from '@/theme';
import { BackupSchedule } from '@/domain/backup/backupTypes';

interface BackupStatusCardProps {
  lastBackupTime: string | null;
  schedule: BackupSchedule;
  isBackingUp: boolean;
  backupProgress: number;
  statusMessage: string | null;
  onBackupNow: () => void;
  onScheduleChange: (newSchedule: BackupSchedule) => void;
  disabled?: boolean;
}

export function BackupStatusCard({
  lastBackupTime,
  schedule,
  isBackingUp,
  backupProgress,
  statusMessage,
  onBackupNow,
  onScheduleChange,
  disabled,
}: BackupStatusCardProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const formatTime = (isoString: string | null) => {
    if (!isoString) return 'Never backed up';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Ionicons name="cloud-upload" size={24} color={colors.primary} />
        </View>
        <View style={styles.headerTextCol}>
          <Text style={styles.cardTitle}>Encrypted Cloud Backup</Text>
          <Text style={styles.cardSubtitle}>
            Authenticated AES-256-GCM + PBKDF2
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Last Successful Backup:</Text>
        <Text style={styles.infoValue}>{formatTime(lastBackupTime)}</Text>
      </View>

      {/* Progress View during backup */}
      {isBackingUp && (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressStatusText}>
              {statusMessage || 'Backing up records...'}
            </Text>
            <Text style={styles.progressPercentText}>{backupProgress}%</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, Math.max(5, backupProgress))}%` },
              ]}
            />
          </View>
        </View>
      )}

      {/* Backup Now CTA */}
      <TouchableOpacity
        style={[styles.backupNowButton, (disabled || isBackingUp) && styles.buttonDisabled]}
        onPress={onBackupNow}
        disabled={disabled || isBackingUp}
        activeOpacity={0.8}
      >
        {isBackingUp ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="shield-checkmark-outline" size={18} color="#FFFFFF" />
            <Text style={styles.backupNowButtonText}>Back Up Now</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Schedule Selector */}
      <View style={styles.scheduleSection}>
        <Text style={styles.scheduleTitle}>Automatic Backup Frequency</Text>
        <View style={styles.schedulePillsRow}>
          {(['manual', 'daily', 'weekly'] as const).map((option) => {
            const isSelected = schedule === option;
            const label =
              option === 'manual'
                ? 'Manual Only'
                : option === 'daily'
                ? 'Daily'
                : 'Weekly';
            return (
              <TouchableOpacity
                key={option}
                style={[styles.schedulePill, isSelected && styles.schedulePillActive]}
                onPress={() => onScheduleChange(option)}
                disabled={disabled || isBackingUp}
              >
                <Text
                  style={[
                    styles.schedulePillText,
                    isSelected && styles.schedulePillTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.scheduleNote}>
          <Ionicons name="information-circle-outline" size={13} color={colors.textTertiary} />{' '}
          Automated backups run locally when the app opens or during OS background windows.
          Battery-saver modes may delay background execution.
        </Text>
      </View>
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
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
      marginBottom: spacing.md,
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isDark ? colors.surfaceSecondary : '#EFF6FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    headerTextCol: {
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
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      marginBottom: spacing.md,
    },
    infoLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    infoValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    progressContainer: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radii.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    progressStatusText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.primary,
    },
    progressPercentText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    progressBarTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 3,
    },
    backupNowButton: {
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: radii.md,
      gap: 8,
      ...shadows.sm,
      marginBottom: spacing.lg,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    backupNowButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
    scheduleSection: {
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      paddingTop: spacing.md,
    },
    scheduleTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    schedulePillsRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: spacing.sm,
    },
    schedulePill: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: radii.md,
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    schedulePillActive: {
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#EFF6FF',
      borderColor: colors.primary,
    },
    schedulePillText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    schedulePillTextActive: {
      color: colors.primary,
      fontWeight: '700',
    },
    scheduleNote: {
      fontSize: 11,
      color: colors.textTertiary,
      lineHeight: 16,
      marginTop: 4,
    },
  });
