import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const backupMetadata = sqliteTable('backup_metadata', {
  id: text('id').primaryKey(),
  backupDate: text('backup_date').notNull(),
  checksum: text('checksum').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  remoteFileId: text('remote_file_id'),
  status: text('status').notNull().$type<'success' | 'failed'>(),
});

export type BackupMetadataRow = typeof backupMetadata.$inferSelect;
export type NewBackupMetadataRow = typeof backupMetadata.$inferInsert;
