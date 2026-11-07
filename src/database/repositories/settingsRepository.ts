import { eq } from 'drizzle-orm';
import { getDatabase } from '../client';
import { appSettings } from '../schema';

type DbInstance = ReturnType<typeof getDatabase>;

export class SettingsRepository {
  private db: DbInstance;

  constructor(customDb?: DbInstance) {
    this.db = customDb ?? getDatabase();
  }

  async get(key: string): Promise<string | null> {
    const rows = await this.db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, key))
      .limit(1);

    const r = rows[0];
    return r ? r.value : null;
  }

  async set(key: string, value: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db
      .insert(appSettings)
      .values({
        key,
        value,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: {
          value,
          updatedAt: now,
        },
      });
  }

  async getAll(): Promise<Record<string, string>> {
    const rows = await this.db.select().from(appSettings);
    const map: Record<string, string> = {};
    for (const row of rows) {
      map[row.key] = row.value;
    }
    return map;
  }
}
