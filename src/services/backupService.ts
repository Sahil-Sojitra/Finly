import { BackupCryptoEngine } from '@/domain/backup/backupCrypto';
import { BackupSerializer, RestoreSummary } from '@/domain/backup/backupSerializer';
import {
  DriveBackupItem,
  BackupSchedule,
} from '@/domain/backup/backupTypes';
import { GoogleAuthService } from './googleAuthService';
import { GoogleDriveService } from './googleDriveService';
import { getDatabase } from '@/database/client';
import { appSettings, backupMetadata } from '@/database/schema';
import { eq, desc } from 'drizzle-orm';
import { WidgetService } from './widgetService';
import * as Crypto from 'expo-crypto';

export interface BackupProgressCallback {
  (step: string, percent: number): void;
}

export class BackupService {
  private static readonly SCHEDULE_KEY = 'backup_schedule_preference';
  private static readonly LAST_BACKUP_TIME_KEY = 'last_successful_backup_timestamp';

  /**
   * Generates a full encrypted backup and uploads it to Google Drive appDataFolder.
   */
  static async createAndUploadBackup(
    passphrase: string,
    onProgress?: BackupProgressCallback
  ): Promise<{ fileId: string; fileName: string; timestamp: string }> {
    const accessToken = await GoogleAuthService.getAccessToken();
    if (!accessToken) {
      throw new Error('Please connect your Google account before backing up.');
    }

    onProgress?.('Reading local financial records...', 15);
    const serializer = new BackupSerializer();
    const payload = await serializer.serializeDatabase();

    onProgress?.('Encrypting records with AES-256-GCM...', 40);
    const payloadJson = JSON.stringify(payload);
    const encryptedFile = await BackupCryptoEngine.encrypt(payloadJson, passphrase);

    onProgress?.('Uploading to Google Drive appDataFolder...', 70);
    const result = await GoogleDriveService.uploadBackup(
      accessToken,
      encryptedFile,
      (uploadPct) => {
        onProgress?.('Uploading to Google Drive...', 70 + Math.floor(uploadPct * 0.25));
      }
    );

    // Save timestamp & audit log in database
    const db = getDatabase();
    const nowIso = new Date().toISOString();

    await db
      .insert(appSettings)
      .values({
        key: this.LAST_BACKUP_TIME_KEY,
        value: nowIso,
        updatedAt: nowIso,
      })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: {
          value: nowIso,
          updatedAt: nowIso,
        },
      });

    await db.insert(backupMetadata).values({
      id: Crypto.randomUUID(),
      provider: 'google_drive',
      lastBackupAt: nowIso,
      backupVersion: String(encryptedFile.backupVersion),
      status: 'success',
      remoteBackupId: result.fileId,
      createdAt: nowIso,
    });

    onProgress?.('Backup complete!', 100);
    return {
      fileId: result.fileId,
      fileName: result.name,
      timestamp: nowIso,
    };
  }

  /**
   * Fetches remote backups available in Google Drive appDataFolder.
   */
  static async listAvailableBackups(): Promise<DriveBackupItem[]> {
    const accessToken = await GoogleAuthService.getAccessToken();
    if (!accessToken) {
      return [];
    }
    return await GoogleDriveService.listBackups(accessToken);
  }

  /**
   * Downloads, decrypts, validates, and restores a remote backup.
   */
  static async downloadAndRestoreBackup(
    fileId: string,
    passphrase: string,
    onProgress?: BackupProgressCallback
  ): Promise<RestoreSummary> {
    const accessToken = await GoogleAuthService.getAccessToken();
    if (!accessToken) {
      throw new Error('Please connect your Google account before restoring.');
    }

    onProgress?.('Downloading encrypted backup archive...', 20);
    const encryptedFile = await GoogleDriveService.downloadBackup(accessToken, fileId);

    onProgress?.('Decrypting & validating authentication tag...', 50);
    const decryptedPayload = await BackupCryptoEngine.decrypt(encryptedFile, passphrase);

    onProgress?.('Creating local safety snapshot & applying records...', 80);
    const serializer = new BackupSerializer();
    const summary = await serializer.restoreDatabase(decryptedPayload, {
      remoteFileId: fileId,
    });

    onProgress?.('Synchronizing widget cache & financial totals...', 95);
    await WidgetService.syncFromDatabase().catch(() => {});

    onProgress?.('Restoration completed successfully!', 100);
    return summary;
  }

  /**
   * Reads the timestamp of the last successful backup.
   */
  static async getLastBackupTime(): Promise<string | null> {
    const db = getDatabase();
    const rows = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, this.LAST_BACKUP_TIME_KEY));

    if (rows.length > 0 && rows[0]?.value) {
      return rows[0].value;
    }

    // Fallback: check backup_metadata table
    const metaRows = await db
      .select()
      .from(backupMetadata)
      .where(eq(backupMetadata.status, 'success'))
      .orderBy(desc(backupMetadata.createdAt))
      .limit(1);

    return metaRows[0]?.lastBackupAt ?? null;
  }

  /**
   * Retrieves automatic backup schedule preference ('manual' | 'daily' | 'weekly').
   */
  static async getBackupSchedule(): Promise<BackupSchedule> {
    const db = getDatabase();
    const rows = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, this.SCHEDULE_KEY));

    if (rows.length > 0 && rows[0]?.value) {
      return rows[0].value as BackupSchedule;
    }
    return 'manual';
  }

  /**
   * Updates automatic backup schedule preference.
   */
  static async setBackupSchedule(schedule: BackupSchedule): Promise<void> {
    const db = getDatabase();
    const nowIso = new Date().toISOString();
    await db
      .insert(appSettings)
      .values({
        key: this.SCHEDULE_KEY,
        value: schedule,
        updatedAt: nowIso,
      })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: {
          value: schedule,
          updatedAt: nowIso,
        },
      });
  }

  /**
   * Checks if an automated backup is due and runs it if recovery credentials exist.
   */
  static async checkAndRunScheduledBackup(): Promise<boolean> {
    const schedule = await this.getBackupSchedule();
    if (schedule === 'manual') return false;

    const isSignedIn = await GoogleAuthService.isSignedIn();
    if (!isSignedIn) return false;

    const savedPassphrase = await GoogleAuthService.getLocalRecoveryPassphrase();
    if (!savedPassphrase) return false;

    const lastTime = await this.getLastBackupTime();
    if (lastTime) {
      const lastEpoch = new Date(lastTime).getTime();
      const elapsedMs = Date.now() - lastEpoch;
      const thresholdMs =
        schedule === 'daily'
          ? 24 * 60 * 60 * 1000 // 24 hours
          : 7 * 24 * 60 * 60 * 1000; // 7 days

      if (elapsedMs < thresholdMs) {
        return false; // Not due yet
      }
    }

    try {
      await this.createAndUploadBackup(savedPassphrase);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Reverts current database state to the safety snapshot created prior to last restore.
   */
  static async rollbackSafetyBackup(): Promise<boolean> {
    const serializer = new BackupSerializer();
    const success = await serializer.rollbackSafetyBackup();
    if (success) {
      await WidgetService.syncFromDatabase().catch(() => {});
    }
    return success;
  }

  /**
   * Checks if a local safety snapshot exists.
   */
  static async hasSafetyBackup(): Promise<boolean> {
    const serializer = new BackupSerializer();
    const safety = await serializer.getLatestLocalSafetyBackup();
    return Boolean(safety);
  }
}
