import { getNativeDatabase, getDatabase } from './client';
import { categories, appSettings } from './schema';
import { DEFAULT_CATEGORIES } from './seeds';
import { sql } from 'drizzle-orm';

export const INIT_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS salary_cycles (
  id TEXT PRIMARY KEY NOT NULL,
  salary_amount INTEGER NOT NULL,
  received_date TEXT NOT NULL,
  expected_next_date TEXT,
  opening_balance INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY NOT NULL,
  cycle_id TEXT,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  category_id TEXT NOT NULL,
  transaction_date TEXT NOT NULL,
  input_method TEXT NOT NULL DEFAULT 'manual',
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (cycle_id) REFERENCES salary_cycles(id) ON DELETE SET NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS backup_metadata (
  id TEXT PRIMARY KEY NOT NULL,
  provider TEXT NOT NULL,
  last_backup_at TEXT NOT NULL,
  backup_version TEXT NOT NULL,
  status TEXT NOT NULL,
  remote_backup_id TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_cycle ON transactions(cycle_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_salary_cycles_received_date ON salary_cycles(received_date);
`;

/**
 * Executes initial table and index creation, PRAGMA checks, and seeds default categories.
 */
export async function initializeDatabase(): Promise<void> {
  const rawDb = getNativeDatabase();

  // Execute schema creation scripts
  rawDb.execSync(INIT_SQL);

  const db = getDatabase();

  // Check if categories already exist
  const existingCategories = await db.select().from(categories).limit(1);

  if (existingCategories.length === 0) {
    // Seed default categories inside a multi-row transaction
    await db.transaction(async (tx) => {
      for (const cat of DEFAULT_CATEGORIES) {
        await tx.insert(categories).values({
          id: cat.id,
          name: cat.name,
          type: cat.type,
          icon: cat.icon,
          color: cat.color,
          isDefault: cat.isDefault,
          createdAt: cat.createdAt,
        });
      }

      // Record database schema initialized timestamp in app_settings
      await tx
        .insert(appSettings)
        .values({
          key: 'db_initialized_at',
          value: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .onConflictDoUpdate({
          target: appSettings.key,
          set: {
            value: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
    });
  }
}

/**
 * Health check verifying foreign keys and table counts
 */
export async function verifyDatabaseIntegrity(): Promise<{
  foreignKeysEnabled: boolean;
  categoryCount: number;
  transactionCount: number;
  cycleCount: number;
}> {
  const db = getDatabase();
  const rawDb = getNativeDatabase();

  const fkCheck = rawDb.getFirstSync<{ foreign_keys: number }>('PRAGMA foreign_keys;');
  const foreignKeysEnabled = fkCheck ? fkCheck.foreign_keys === 1 : false;

  const catCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(categories);
  const txCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(categories);
  const cycleCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(categories);

  return {
    foreignKeysEnabled,
    categoryCount: Number(catCountResult[0]?.count ?? 0),
    transactionCount: Number(txCountResult[0]?.count ?? 0),
    cycleCount: Number(cycleCountResult[0]?.count ?? 0),
  };
}
