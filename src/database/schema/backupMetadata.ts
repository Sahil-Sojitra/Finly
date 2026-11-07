import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const backupMetadata = sqliteTable('backup_metadata', {
  id: text('id').primaryKey(),
  provider: text('provider').notNull(),
  lastBackupAt: text('last_backup_at').notNull(),
  backupVersion: text('backup_version').notNull(),
  status: text('status').notNull().$type<'success' | 'failed' | 'pending'>(),
  remoteBackupId: text('remote_backup_id'),
  createdAt: text('created_at').notNull(),
});

export type BackupMetadataRow = typeof backupMetadata.$inferSelect;
export type NewBackupMetadataRow = typeof backupMetadata.$inferInsert;
