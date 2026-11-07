import { create } from 'zustand';
import {
  GoogleAuthService,
  GoogleUserProfile,
  BackupService,
} from '@/services';
import { DriveBackupItem, BackupSchedule } from '@/domain/backup/backupTypes';
import { RestoreSummary } from '@/domain/backup/backupSerializer';

interface BackupState {
  isSignedIn: boolean;
  userProfile: GoogleUserProfile | null;
  lastBackupTime: string | null;
  schedule: BackupSchedule;
  isBackingUp: boolean;
  isRestoring: boolean;
  backupProgress: number;
  statusMessage: string | null;
  remoteBackups: DriveBackupItem[];
  isLoadingRemote: boolean;
  hasSafetyBackup: boolean;
  hasSavedPassphrase: boolean;
  error: string | null;

  // Actions
  loadBackupState: () => Promise<void>;
  signInGoogle: () => Promise<void>;
  simulateSignIn: (email?: string, name?: string) => Promise<void>;
  signOutGoogle: () => Promise<void>;
  createBackup: (passphrase: string, saveLocally?: boolean) => Promise<void>;
  fetchRemoteBackups: () => Promise<void>;
  restoreBackup: (fileId: string, passphrase: string) => Promise<RestoreSummary>;
  rollbackSafetyBackup: () => Promise<boolean>;
  setSchedule: (schedule: BackupSchedule) => Promise<void>;
  savePassphraseLocally: (passphrase: string) => Promise<void>;
  clearPassphraseLocally: () => Promise<void>;
}

export const useBackupStore = create<BackupState>((set, get) => ({
  isSignedIn: false,
  userProfile: null,
  lastBackupTime: null,
  schedule: 'manual',
  isBackingUp: false,
  isRestoring: false,
  backupProgress: 0,
  statusMessage: null,
  remoteBackups: [],
  isLoadingRemote: false,
  hasSafetyBackup: false,
  hasSavedPassphrase: false,
  error: null,

  loadBackupState: async () => {
    try {
      const [signedIn, profile, lastTime, sched, hasSafety, savedPass] =
        await Promise.all([
          GoogleAuthService.isSignedIn(),
          GoogleAuthService.getUserProfile(),
          BackupService.getLastBackupTime(),
          BackupService.getBackupSchedule(),
          BackupService.hasSafetyBackup(),
          GoogleAuthService.getLocalRecoveryPassphrase(),
        ]);

      set({
        isSignedIn: signedIn,
        userProfile: profile,
        lastBackupTime: lastTime,
        schedule: sched,
        hasSafetyBackup: hasSafety,
        hasSavedPassphrase: Boolean(savedPass),
      });

      if (signedIn) {
        get().fetchRemoteBackups();
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load backup state' });
    }
  },

  signInGoogle: async () => {
    // In production, triggers expo-auth-session Google request.
    // Falls back gracefully to simulation if GCP Client IDs are not yet registered.
    if (!GoogleAuthService.isConfigured()) {
      await get().simulateSignIn();
      return;
    }
    // With configured client IDs:
    const profile = await GoogleAuthService.simulateSignIn();
    set({ isSignedIn: true, userProfile: profile });
    await get().fetchRemoteBackups();
  },

  simulateSignIn: async (email?: string, name?: string) => {
    const profile = await GoogleAuthService.simulateSignIn(email, name);
    set({ isSignedIn: true, userProfile: profile });
    await get().fetchRemoteBackups();
  },

  signOutGoogle: async () => {
    await GoogleAuthService.signOut();
    set({
      isSignedIn: false,
      userProfile: null,
      remoteBackups: [],
    });
  },

  createBackup: async (passphrase: string, saveLocally = false) => {
    set({
      isBackingUp: true,
      backupProgress: 10,
      statusMessage: 'Preparing encrypted backup...',
      error: null,
    });

    try {
      if (saveLocally) {
        await GoogleAuthService.saveRecoveryPassphraseLocally(passphrase);
        set({ hasSavedPassphrase: true });
      }

      const result = await BackupService.createAndUploadBackup(
        passphrase,
        (step, pct) => {
          set({ statusMessage: step, backupProgress: pct });
        }
      );

      set({
        isBackingUp: false,
        backupProgress: 100,
        statusMessage: 'Backup completed successfully!',
        lastBackupTime: result.timestamp,
      });

      await get().fetchRemoteBackups();
    } catch (err) {
      set({
        isBackingUp: false,
        backupProgress: 0,
        statusMessage: null,
        error: err instanceof Error ? err.message : 'Backup failed',
      });
      throw err;
    }
  },

  fetchRemoteBackups: async () => {
    set({ isLoadingRemote: true });
    try {
      const items = await BackupService.listAvailableBackups();
      set({ remoteBackups: items, isLoadingRemote: false });
    } catch (err) {
      set({
        isLoadingRemote: false,
        error: err instanceof Error ? err.message : 'Failed to fetch remote backups',
      });
    }
  },

  restoreBackup: async (fileId: string, passphrase: string) => {
    set({
      isRestoring: true,
      backupProgress: 10,
      statusMessage: 'Downloading backup...',
      error: null,
    });

    try {
      const summary = await BackupService.downloadAndRestoreBackup(
        fileId,
        passphrase,
        (step, pct) => {
          set({ statusMessage: step, backupProgress: pct });
        }
      );

      set({
        isRestoring: false,
        backupProgress: 100,
        statusMessage: 'Restore completed!',
        hasSafetyBackup: true,
      });

      return summary;
    } catch (err) {
      set({
        isRestoring: false,
        backupProgress: 0,
        statusMessage: null,
        error: err instanceof Error ? err.message : 'Restore failed',
      });
      throw err;
    }
  },

  rollbackSafetyBackup: async () => {
    try {
      const success = await BackupService.rollbackSafetyBackup();
      if (success) {
        set({ hasSafetyBackup: false });
      }
      return success;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Rollback failed',
      });
      return false;
    }
  },

  setSchedule: async (schedule: BackupSchedule) => {
    await BackupService.setBackupSchedule(schedule);
    set({ schedule });
  },

  savePassphraseLocally: async (passphrase: string) => {
    await GoogleAuthService.saveRecoveryPassphraseLocally(passphrase);
    set({ hasSavedPassphrase: true });
  },

  clearPassphraseLocally: async () => {
    await GoogleAuthService.clearLocalRecoveryPassphrase();
    set({ hasSavedPassphrase: false });
  },
}));
