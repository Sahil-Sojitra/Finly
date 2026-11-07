import { EncryptedBackupFile, DriveBackupItem } from '@/domain/backup/backupTypes';
import { getDatabase } from '@/database/client';
import { appSettings } from '@/database/schema';
import { eq } from 'drizzle-orm';

const MOCK_STORAGE_KEY = 'mock_remote_drive_files_v1';

export class GoogleDriveService {
  private static readonly UPLOAD_URL =
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  private static readonly FILES_URL = 'https://www.googleapis.com/drive/v3/files';

  /**
   * Uploads an encrypted backup file to the Google Drive appDataFolder.
   */
  static async uploadBackup(
    accessToken: string,
    encryptedFile: EncryptedBackupFile,
    onProgress?: (progressPercent: number) => void
  ): Promise<{ fileId: string; name: string }> {
    onProgress?.(10);
    const fileName = `finly_backup_${new Date(encryptedFile.createdAt).getTime()}.enc`;
    const payloadContent = JSON.stringify(encryptedFile);

    // If running in simulation/mock mode
    if (accessToken.startsWith('simulated_mock_')) {
      onProgress?.(50);
      const fileId = `mock_drive_file_${Date.now()}`;
      await this.saveMockFile({
        id: fileId,
        name: fileName,
        sizeBytes: payloadContent.length,
        createdTime: encryptedFile.createdAt,
        modifiedTime: encryptedFile.createdAt,
        content: payloadContent,
      });
      onProgress?.(100);
      return { fileId, name: fileName };
    }

    onProgress?.(30);

    // Multi-part related payload for Google Drive API v3
    const boundary = '-------FinlyBackupBoundary' + Date.now();
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      parents: ['appDataFolder'],
      description: 'Finly Authenticated AES-256-GCM Encrypted Backup',
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      payloadContent +
      closeDelimiter;

    onProgress?.(60);

    const response = await fetch(this.UPLOAD_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': String(multipartRequestBody.length),
      },
      body: multipartRequestBody,
    });

    onProgress?.(90);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Drive upload failed (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as { id: string; name: string };
    onProgress?.(100);
    return { fileId: data.id, name: data.name };
  }

  /**
   * Lists available backup archives in Google Drive appDataFolder.
   */
  static async listBackups(accessToken: string): Promise<DriveBackupItem[]> {
    if (accessToken.startsWith('simulated_mock_')) {
      const mockFiles = await this.getMockFiles();
      return mockFiles.map((f) => ({
        id: f.id,
        name: f.name,
        sizeBytes: f.sizeBytes,
        createdTime: f.createdTime,
        modifiedTime: f.modifiedTime,
      }));
    }

    const url = `${this.FILES_URL}?spaces=appDataFolder&fields=files(id,name,size,createdTime,modifiedTime)&orderBy=createdTime desc`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to list Google Drive backups (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as {
      files?: {
        id: string;
        name: string;
        size?: string;
        createdTime: string;
        modifiedTime: string;
      }[];
    };

    if (!data.files) return [];

    return data.files
      .filter((f) => f.name.startsWith('finly_backup_') && f.name.endsWith('.enc'))
      .map((f) => ({
        id: f.id,
        name: f.name,
        sizeBytes: f.size ? parseInt(f.size, 10) : 0,
        createdTime: f.createdTime,
        modifiedTime: f.modifiedTime,
      }));
  }

  /**
   * Downloads an encrypted backup file by ID from appDataFolder.
   */
  static async downloadBackup(
    accessToken: string,
    fileId: string
  ): Promise<EncryptedBackupFile> {
    if (accessToken.startsWith('simulated_mock_')) {
      const mockFiles = await this.getMockFiles();
      const match = mockFiles.find((f) => f.id === fileId);
      if (!match) {
        throw new Error(`Mock backup file ${fileId} not found.`);
      }
      return JSON.parse(match.content) as EncryptedBackupFile;
    }

    const url = `${this.FILES_URL}/${fileId}?alt=media`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to download backup file (${response.status}): ${errText}`);
    }

    const rawJson = await response.json();
    return rawJson as EncryptedBackupFile;
  }

  /**
   * Deletes a backup from Google Drive.
   */
  static async deleteBackup(accessToken: string, fileId: string): Promise<boolean> {
    if (accessToken.startsWith('simulated_mock_')) {
      const mockFiles = await this.getMockFiles();
      const filtered = mockFiles.filter((f) => f.id !== fileId);
      await this.saveAllMockFiles(filtered);
      return true;
    }

    const url = `${this.FILES_URL}/${fileId}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.ok;
  }

  // ---------------------------------------------------------------------------
  // Simulated / Mock Remote Storage Helpers
  // ---------------------------------------------------------------------------

  private static async getMockFiles(): Promise<
    (DriveBackupItem & { content: string })[]
  > {
    try {
      const db = getDatabase();
      const rows = await db
        .select()
        .from(appSettings)
        .where(eq(appSettings.key, MOCK_STORAGE_KEY));

      if (rows.length === 0 || !rows[0]?.value) return [];
      return JSON.parse(rows[0].value);
    } catch {
      return [];
    }
  }

  private static async saveMockFile(
    file: DriveBackupItem & { content: string }
  ): Promise<void> {
    const existing = await this.getMockFiles();
    const updated = [file, ...existing];
    await this.saveAllMockFiles(updated);
  }

  private static async saveAllMockFiles(
    files: (DriveBackupItem & { content: string })[]
  ): Promise<void> {
    const db = getDatabase();
    const jsonStr = JSON.stringify(files);
    await db
      .insert(appSettings)
      .values({
        key: MOCK_STORAGE_KEY,
        value: jsonStr,
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: {
          value: jsonStr,
          updatedAt: new Date().toISOString(),
        },
      });
  }
}
