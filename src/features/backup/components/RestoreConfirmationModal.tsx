import { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, shadows, spacing, useTheme, ThemeColors } from '@/theme';
import { DriveBackupItem } from '@/domain/backup/backupTypes';

interface RestoreConfirmationModalProps {
  visible: boolean;
  backupItem: DriveBackupItem | null;
  isRestoring: boolean;
  restoreProgress: number;
  statusMessage: string | null;
  onClose: () => void;
  onConfirmRestore: (fileId: string, passphrase: string) => void;
}

export function RestoreConfirmationModal({
  visible,
  backupItem,
  isRestoring,
  restoreProgress,
  statusMessage,
  onClose,
  onConfirmRestore,
}: RestoreConfirmationModalProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const [passphrase, setPassphrase] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (!backupItem) return null;

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

  const handleRestore = () => {
    if (!passphrase.trim()) return;
    onConfirmRestore(backupItem.id, passphrase.trim());
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.headerRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="cloud-download" size={20} color={colors.primary} />
            </View>
            <Text style={styles.title}>Restore from Backup</Text>
            {!isRestoring && (
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Backup Summary Box */}
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Backup Date:</Text>
              <Text style={styles.summaryValue}>{formatTimestamp(backupItem.createdTime)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Archive Size:</Text>
              <Text style={styles.summaryValue}>{formatFileSize(backupItem.sizeBytes)}</Text>
            </View>
          </View>

          {/* Safety Notice */}
          <View style={styles.safetyBox}>
            <Ionicons name="shield-checkmark" size={18} color={colors.success} />
            <Text style={styles.safetyText}>
              Finly will automatically create a local safety backup of current data before
              restoring. Existing records will never be silently lost.
            </Text>
          </View>

          {/* Decryption Passphrase Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Enter Decryption Passphrase</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={passphrase}
                onChangeText={setPassphrase}
                placeholder="Passphrase used when backing up"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isRestoring}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Progress Indicator */}
          {isRestoring && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressStatusText}>
                  {statusMessage || 'Restoring records...'}
                </Text>
                <Text style={styles.progressPercentText}>{restoreProgress}%</Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(100, Math.max(5, restoreProgress))}%` },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isRestoring}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.restoreButton,
                (!passphrase.trim() || isRestoring) && styles.buttonDisabled,
              ]}
              onPress={handleRestore}
              disabled={!passphrase.trim() || isRestoring}
            >
              {isRestoring ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="cloud-download-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.restoreButtonText}>Confirm & Restore</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.md,
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.xl,
      width: '100%',
      maxWidth: 420,
      ...shadows.lg,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? colors.surfaceSecondary : '#EFF6FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    title: {
      flex: 1,
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    closeButton: {
      padding: 4,
    },
    summaryBox: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radii.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
      gap: 6,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    summaryLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    summaryValue: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    safetyBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#F0FDF4',
      borderRadius: radii.md,
      padding: spacing.md,
      gap: 8,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: isDark ? colors.success : '#BBF7D0',
    },
    safetyText: {
      flex: 1,
      fontSize: 11,
      color: isDark ? colors.success : '#166534',
      lineHeight: 16,
    },
    inputContainer: {
      marginBottom: spacing.lg,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textSecondary,
      marginBottom: 6,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: radii.md,
      backgroundColor: colors.surfaceSecondary,
    },
    textInput: {
      flex: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.textPrimary,
    },
    eyeButton: {
      padding: 10,
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
    buttonRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: radii.md,
      backgroundColor: colors.surfaceSecondary,
    },
    cancelButtonText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '500',
    },
    restoreButton: {
      flex: 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: radii.md,
      backgroundColor: colors.primary,
      gap: 6,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    restoreButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
  });
