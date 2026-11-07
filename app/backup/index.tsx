import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, useTheme, ThemeColors } from '@/theme';
import { useBackupStore } from '@/store';
import {
  GoogleConnectCard,
  BackupStatusCard,
  PassphraseModal,
  RestoreConfirmationModal,
  RemoteBackupsList,
  SafetyRollbackCard,
} from '@/features/backup';
import { DriveBackupItem } from '@/domain/backup/backupTypes';

export default function BackupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [isPassphraseModalOpen, setIsPassphraseModalOpen] = useState(false);
  const [selectedBackupForRestore, setSelectedBackupForRestore] =
    useState<DriveBackupItem | null>(null);

  const {
    isSignedIn,
    userProfile,
    lastBackupTime,
    schedule,
    isBackingUp,
    isRestoring,
    backupProgress,
    statusMessage,
    remoteBackups,
    isLoadingRemote,
    hasSafetyBackup,
    loadBackupState,
    signInGoogle,
    signOutGoogle,
    createBackup,
    fetchRemoteBackups,
    restoreBackup,
    rollbackSafetyBackup,
    setSchedule,
  } = useBackupStore();

  useEffect(() => {
    loadBackupState();
  }, [loadBackupState]);

  const onRefresh = useCallback(async () => {
    await Promise.all([loadBackupState(), fetchRemoteBackups()]);
  }, [loadBackupState, fetchRemoteBackups]);

  const handleBackupNowClick = () => {
    if (!isSignedIn) {
      Alert.alert(
        'Account Required',
        'Please connect your Google account before backing up to Google Drive.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Connect Now', onPress: signInGoogle },
        ]
      );
      return;
    }
    setIsPassphraseModalOpen(true);
  };

  const handlePassphraseSubmit = async (passphrase: string, saveLocally: boolean) => {
    setIsPassphraseModalOpen(false);
    try {
      await createBackup(passphrase, saveLocally);
      Alert.alert(
        'Backup Successful',
        'Your financial records have been encrypted with AES-256-GCM and uploaded to Google Drive appDataFolder.'
      );
    } catch (err) {
      Alert.alert(
        'Backup Failed',
        err instanceof Error ? err.message : 'An error occurred during backup creation.'
      );
    }
  };

  const handleConfirmRestore = async (fileId: string, passphrase: string) => {
    try {
      const summary = await restoreBackup(fileId, passphrase);
      setSelectedBackupForRestore(null);
      Alert.alert(
        'Restoration Complete',
        `Successfully restored:\n• ${summary.restoredCycles} Salary Cycles\n• ${summary.restoredTransactions} Transactions\n• ${summary.restoredCategories} Categories\n\nA local safety snapshot was saved before restoring.`
      );
    } catch (err) {
      Alert.alert(
        'Restore Failed',
        err instanceof Error
          ? err.message
          : 'Invalid recovery passphrase or corrupted archive.'
      );
    }
  };

  return (
    <View style={styles.screenWrapper}>
      {/* Header */}
      <View
        style={[
          styles.headerBar,
          { paddingTop: Math.max(insets.top, 16) + spacing.xs },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Backup & Recovery</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingRemote && !isBackingUp && !isRestoring}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Google Drive Connection Card */}
        <GoogleConnectCard
          isSignedIn={isSignedIn}
          userProfile={userProfile}
          onConnect={signInGoogle}
          onDisconnect={signOutGoogle}
          isLoading={isLoadingRemote}
        />

        {/* Safety Rollback Notice if available */}
        <SafetyRollbackCard
          hasSafetyBackup={hasSafetyBackup}
          onRollback={rollbackSafetyBackup}
          disabled={isBackingUp || isRestoring}
        />

        {/* Backup Status and Trigger Card */}
        <BackupStatusCard
          lastBackupTime={lastBackupTime}
          schedule={schedule}
          isBackingUp={isBackingUp}
          backupProgress={backupProgress}
          statusMessage={statusMessage}
          onBackupNow={handleBackupNowClick}
          onScheduleChange={setSchedule}
          disabled={!isSignedIn || isRestoring}
        />

        {/* List of Remote Backups */}
        {isSignedIn && (
          <RemoteBackupsList
            backups={remoteBackups}
            isLoading={isLoadingRemote}
            onRefresh={fetchRemoteBackups}
            onSelectBackup={(item) => setSelectedBackupForRestore(item)}
            disabled={isBackingUp || isRestoring}
          />
        )}
      </ScrollView>

      {/* Passphrase Modal for New Backup */}
      <PassphraseModal
        visible={isPassphraseModalOpen}
        onClose={() => setIsPassphraseModalOpen(false)}
        onSubmit={handlePassphraseSubmit}
      />

      {/* Restore Confirmation Modal */}
      <RestoreConfirmationModal
        visible={Boolean(selectedBackupForRestore)}
        backupItem={selectedBackupForRestore}
        isRestoring={isRestoring}
        restoreProgress={backupProgress}
        statusMessage={statusMessage}
        onClose={() => setSelectedBackupForRestore(null)}
        onConfirmRestore={handleConfirmRestore}
      />
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screenWrapper: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    backButton: {
      padding: spacing.xs,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    headerRightSpacer: {
      width: 32,
    },
    container: {
      flex: 1,
    },
    contentContainer: {
      padding: spacing.md,
      paddingBottom: 40,
    },
  });
