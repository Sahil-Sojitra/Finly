import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { schema } from '@/database/schema';
import { INIT_SQL } from '@/database/init';
import { DEFAULT_CATEGORIES } from '@/database/seeds';

export interface TestDbInstance {
  sqlite: Database.Database;
  db: BetterSQLite3Database<typeof schema>;
  close: () => void;
}

/**
 * Creates an actual SQLite test database (in-memory or file-backed),
 * enables foreign keys, executes INIT_SQL, and seeds default categories.
 */
export function createTestDatabase(filePath = ':memory:'): TestDbInstance {
  const sqlite = new Database(filePath);

  // Enforce foreign key constraints
  sqlite.pragma('foreign_keys = ON');

  // Execute initialization SQL schema
  sqlite.exec(INIT_SQL);

  const db = drizzle(sqlite, { schema });

  // Seed default categories
  for (const cat of DEFAULT_CATEGORIES) {
    sqlite
      .prepare(
        `INSERT OR IGNORE INTO categories (id, name, type, icon, color, is_default, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        cat.id,
        cat.name,
        cat.type,
        cat.icon,
        cat.color,
        cat.isDefault ? 1 : 0,
        cat.createdAt
      );
  }

  return {
    sqlite,
    db,
    close: () => sqlite.close(),
  };
}
