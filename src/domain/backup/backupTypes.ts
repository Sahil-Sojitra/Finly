import { Paise } from '@/types';

/**
 * Current backup engine schema version.
 * Increment when breaking changes to payload structure occur.
 */
export const CURRENT_BACKUP_SCHEMA_VERSION = 1;
export const CURRENT_APP_VERSION = '1.0.0';

/**
 * Serialized representation of a single salary cycle for backup payload.
 */
export interface SerializedSalaryCycle {
  id: string;
  salaryAmount: Paise;
  receivedDate: string;
  expectedNextDate: string | null;
  openingBalance: Paise;
  createdAt: string;
  updatedAt: string;
}

/**
 * Serialized representation of a single transaction for backup payload.
 */
export interface SerializedTransaction {
  id: string;
  cycleId: string | null;
  type: 'income' | 'expense';
  amount: Paise;
  description: string;
  categoryId: string;
  transactionDate: string;
  inputMethod: 'manual' | 'voice';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Serialized category for backup payload.
 */
export interface SerializedCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
}

/**
 * Serialized key-value app setting.
 */
export interface SerializedAppSetting {
  key: string;
  value: string;
  updatedAt: string;
}

/**
 * Unencrypted, structured JSON payload of the entire Finly database.
 */
export interface BackupPayload {
  schemaVersion: number;
  appVersion: string;
  exportedAt: string;
  recordCount: {
    cycles: number;
    transactions: number;
    categories: number;
    settings: number;
  };
  salaryCycles: SerializedSalaryCycle[];
  transactions: SerializedTransaction[];
  categories: SerializedCategory[];
  appSettings: SerializedAppSetting[];
}

/**
 * Versioned, encrypted backup file structure uploaded to Google Drive appDataFolder.
 * Zero plaintext financial information is exposed.
 */
export interface EncryptedBackupFile {
  backupVersion: number;
  appVersion: string;
  schemaVersion: number;
  createdAt: string;
  /** 16-byte random salt used for PBKDF2 key derivation (Base64) */
  salt: string;
  /** 12-byte random initialization vector / nonce for AES-GCM (Base64) */
  iv: string;
  /** 16-byte GCM authentication tag for tamper resistance (Base64) */
  authTag: string;
  /** Encrypted ciphertext of JSON BackupPayload (Base64) */
  ciphertext: string;
  /** SHA-256 hash of unencrypted payload string for post-decryption integrity verification */
  checksum: string;
}

/**
 * Information extracted from a downloaded backup before the user confirms restore.
 */
export interface RestorePreview {
  backupVersion: number;
  appVersion: string;
  createdAt: string;
  recordCount: {
    cycles: number;
    transactions: number;
    categories: number;
  };
  isValid: boolean;
  error?: string;
}

/**
 * Automatic backup schedule preference.
 */
export type BackupSchedule = 'manual' | 'daily' | 'weekly';

/**
 * Remote Google Drive file item in appDataFolder.
 */
export interface DriveBackupItem {
  id: string;
  name: string;
  sizeBytes: number;
  createdTime: string;
  modifiedTime: string;
}

/**
 * Local database backup metadata record stored in `backup_metadata` table.
 */
export interface BackupMetadataRecord {
  id: string;
  provider: 'google_drive' | 'local_safety';
  lastBackupAt: string;
  backupVersion: number;
  status: 'success' | 'failed' | 'in_progress';
  remoteBackupId: string | null;
  createdAt: string;
}
