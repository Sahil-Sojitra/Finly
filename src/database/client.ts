import { openDatabaseSync, SQLiteDatabase } from 'expo-sqlite';
import { drizzle, ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { schema } from './schema';

export const DB_NAME = 'finly.db';

let nativeDb: SQLiteDatabase | null = null;
let drizzleDb: ExpoSQLiteDatabase<typeof schema> | null = null;

/**
 * Returns the raw Expo SQLite connection, ensuring PRAGMA foreign_keys = ON
 */
export function getNativeDatabase(): SQLiteDatabase {
  if (!nativeDb) {
    nativeDb = openDatabaseSync(DB_NAME);
    // Explicitly enforce foreign key constraints
    nativeDb.execSync('PRAGMA foreign_keys = ON;');
  }
  return nativeDb;
}

/**
 * Returns the Drizzle ORM client instance with loaded schema
 */
export function getDatabase(): ExpoSQLiteDatabase<typeof schema> {
  if (!drizzleDb) {
    const rawDb = getNativeDatabase();
    drizzleDb = drizzle(rawDb, { schema });
  }
  return drizzleDb;
}

/**
 * Utility to close or reset connection (useful during backups, restore, or testing)
 */
export function resetDatabaseClient(): void {
  if (nativeDb) {
    try {
      nativeDb.closeSync();
    } catch {
      // Ignore close errors during reset
    }
    nativeDb = null;
  }
  drizzleDb = null;
}
