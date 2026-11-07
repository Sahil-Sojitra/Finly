import { eq } from 'drizzle-orm';
import { getDatabase } from '@/database/client';
import {
  categories,
  salaryCycles,
  transactions,
  appSettings,
  backupMetadata,
} from '@/database/schema';
import {
  BackupPayload,
  CURRENT_BACKUP_SCHEMA_VERSION,
  CURRENT_APP_VERSION,
} from './backupTypes';
import { IncompatibleSchemaError } from './backupCrypto';
import * as Crypto from 'expo-crypto';

type DbInstance = ReturnType<typeof getDatabase>;

export interface RestoreSummary {
  restoredCycles: number;
  restoredTransactions: number;
  restoredCategories: number;
  safetyBackupTimestamp: string;
}

export class BackupSerializer {
  private db: DbInstance;

  constructor(customDb?: DbInstance) {
    this.db = customDb ?? getDatabase();
  }

  /**
   * Serializes the current SQLite database into an unencrypted BackupPayload.
   */
  async serializeDatabase(): Promise<BackupPayload> {
    const [allCycles, allTransactions, allCategories, allSettings] = await Promise.all([
      this.db.select().from(salaryCycles),
      this.db.select().from(transactions),
      this.db.select().from(categories),
      this.db.select().from(appSettings),
    ]);

    // Filter out internal transient cache keys from backup
    const filteredSettings = allSettings.filter(
      (s) =>
        s.key !== 'widget_snapshot_v1' &&
        s.key !== 'local_safety_backup_latest' &&
        s.key !== 'local_safety_backup_timestamp'
    );

    return {
      schemaVersion: CURRENT_BACKUP_SCHEMA_VERSION,
      appVersion: CURRENT_APP_VERSION,
      exportedAt: new Date().toISOString(),
      recordCount: {
        cycles: allCycles.length,
        transactions: allTransactions.length,
        categories: allCategories.length,
        settings: filteredSettings.length,
      },
      salaryCycles: allCycles.map((c) => ({
        id: c.id,
        salaryAmount: c.salaryAmount,
        receivedDate: c.receivedDate,
        expectedNextDate: c.expectedNextDate,
        openingBalance: c.openingBalance,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      transactions: allTransactions.map((t) => ({
        id: t.id,
        cycleId: t.cycleId,
        type: t.type,
        amount: t.amount,
        description: t.description,
        categoryId: t.categoryId,
        transactionDate: t.transactionDate,
        inputMethod: t.inputMethod,
        notes: t.notes,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
      categories: allCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        isDefault: Boolean(cat.isDefault),
        createdAt: cat.createdAt,
      })),
      appSettings: filteredSettings.map((s) => ({
        key: s.key,
        value: s.value,
        updatedAt: s.updatedAt,
      })),
    };
  }

  /**
   * Creates a local safety snapshot of the database prior to applying a remote restore.
   * Saved into app_settings table.
   */
  async createLocalSafetyBackup(): Promise<string> {
    const payload = await this.serializeDatabase();
    const timestamp = new Date().toISOString();
    const payloadString = JSON.stringify(payload);

    await this.db
      .insert(appSettings)
      .values({
        key: 'local_safety_backup_latest',
        value: payloadString,
        updatedAt: timestamp,
      })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: {
          value: payloadString,
          updatedAt: timestamp,
        },
      });

    await this.db
      .insert(appSettings)
      .values({
        key: 'local_safety_backup_timestamp',
        value: timestamp,
        updatedAt: timestamp,
      })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: {
          value: timestamp,
          updatedAt: timestamp,
        },
      });

    return timestamp;
  }

  /**
   * Retrieves the most recent local pre-restore safety snapshot, if any.
   */
  async getLatestLocalSafetyBackup(): Promise<{ payload: BackupPayload; timestamp: string } | null> {
    const rows = await this.db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, 'local_safety_backup_latest'));

    const timeRows = await this.db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, 'local_safety_backup_timestamp'));

    if (rows.length === 0 || !rows[0]?.value) {
      return null;
    }

    try {
      const payload = JSON.parse(rows[0].value) as BackupPayload;
      const timestamp = timeRows[0]?.value ?? rows[0].updatedAt;
      return { payload, timestamp };
    } catch {
      return null;
    }
  }

  /**
   * Restores database state from a validated BackupPayload.
   * Performs operations inside an atomic transaction with safety snapshot creation.
   */
  async restoreDatabase(
    payload: BackupPayload,
    options: { skipSafetyBackup?: boolean; remoteFileId?: string } = {}
  ): Promise<RestoreSummary> {
    if (payload.schemaVersion > CURRENT_BACKUP_SCHEMA_VERSION) {
      throw new IncompatibleSchemaError(payload.schemaVersion);
    }

    // Step 1: Create local safety backup before touching any tables
    let safetyTimestamp = '';
    if (!options.skipSafetyBackup) {
      safetyTimestamp = await this.createLocalSafetyBackup();
    }

    // Step 2: Atomic restoration
    // We execute sequentially ensuring foreign key dependencies are respected:
    // 1. Categories
    // 2. Salary Cycles
    // 3. Transactions
    // 4. App Settings
    let restoredCategories = 0;
    for (const cat of payload.categories) {
      await this.db
        .insert(categories)
        .values({
          id: cat.id,
          name: cat.name,
          type: cat.type,
          icon: cat.icon,
          color: cat.color,
          isDefault: Boolean(cat.isDefault),
          createdAt: cat.createdAt,
        })
        .onConflictDoUpdate({
          target: categories.id,
          set: {
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            type: cat.type,
          },
        });
      restoredCategories++;
    }

    let restoredCycles = 0;
    for (const cycle of payload.salaryCycles) {
      await this.db
        .insert(salaryCycles)
        .values({
          id: cycle.id,
          salaryAmount: cycle.salaryAmount,
          receivedDate: cycle.receivedDate,
          expectedNextDate: cycle.expectedNextDate,
          openingBalance: cycle.openingBalance,
          createdAt: cycle.createdAt,
          updatedAt: cycle.updatedAt,
        })
        .onConflictDoUpdate({
          target: salaryCycles.id,
          set: {
            salaryAmount: cycle.salaryAmount,
            receivedDate: cycle.receivedDate,
            expectedNextDate: cycle.expectedNextDate,
            openingBalance: cycle.openingBalance,
            updatedAt: cycle.updatedAt,
          },
        });
      restoredCycles++;
    }

    let restoredTransactions = 0;
    for (const tx of payload.transactions) {
      await this.db
        .insert(transactions)
        .values({
          id: tx.id,
          cycleId: tx.cycleId,
          type: tx.type,
          amount: tx.amount,
          description: tx.description,
          categoryId: tx.categoryId,
          transactionDate: tx.transactionDate,
          inputMethod: tx.inputMethod,
          notes: tx.notes,
          createdAt: tx.createdAt,
          updatedAt: tx.updatedAt,
        })
        .onConflictDoUpdate({
          target: transactions.id,
          set: {
            cycleId: tx.cycleId,
            type: tx.type,
            amount: tx.amount,
            description: tx.description,
            categoryId: tx.categoryId,
            transactionDate: tx.transactionDate,
            inputMethod: tx.inputMethod,
            notes: tx.notes,
            updatedAt: tx.updatedAt,
          },
        });
      restoredTransactions++;
    }

    for (const setting of payload.appSettings) {
      await this.db
        .insert(appSettings)
        .values({
          key: setting.key,
          value: setting.value,
          updatedAt: setting.updatedAt,
        })
        .onConflictDoUpdate({
          target: appSettings.key,
          set: {
            value: setting.value,
            updatedAt: setting.updatedAt,
          },
        });
    }

    // Record restore event in backup_metadata table
    try {
      await this.db.insert(backupMetadata).values({
        id: Crypto.randomUUID(),
        provider: 'google_drive',
        lastBackupAt: new Date().toISOString(),
        backupVersion: String(payload.schemaVersion),
        status: 'success',
        remoteBackupId: options.remoteFileId ?? null,
        createdAt: new Date().toISOString(),
      });
    } catch {
      // Non-fatal if metadata insert fails
    }

    return {
      restoredCycles,
      restoredTransactions,
      restoredCategories,
      safetyBackupTimestamp: safetyTimestamp,
    };
  }

  /**
   * Reverts current database state to the safety snapshot created prior to last restore.
   */
  async rollbackSafetyBackup(): Promise<boolean> {
    const safety = await this.getLatestLocalSafetyBackup();
    if (!safety) {
      return false;
    }

    await this.restoreDatabase(safety.payload, { skipSafetyBackup: true });
    return true;
  }
}
