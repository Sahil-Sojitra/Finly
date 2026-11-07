import { eq } from 'drizzle-orm';
import { getDatabase } from '../client';
import { categories } from '../schema';
import { Category, TransactionType } from '@/types';

type DbInstance = ReturnType<typeof getDatabase>;

export class CategoryRepository {
  private customDb?: DbInstance;

  constructor(customDb?: DbInstance) {
    this.customDb = customDb;
  }

  private get db(): DbInstance {
    return this.customDb ?? getDatabase();
  }

  async getAll(): Promise<Category[]> {
    const rows = await this.db.select().from(categories).orderBy(categories.name);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      icon: r.icon,
      color: r.color,
      isDefault: r.isDefault,
      createdAt: r.createdAt,
    }));
  }

  async getByType(type: TransactionType): Promise<Category[]> {
    const rows = await this.db
      .select()
      .from(categories)
      .where(eq(categories.type, type))
      .orderBy(categories.name);

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      icon: r.icon,
      color: r.color,
      isDefault: r.isDefault,
      createdAt: r.createdAt,
    }));
  }

  async getById(id: string): Promise<Category | null> {
    const rows = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    const r = rows[0];
    if (!r) return null;

    return {
      id: r.id,
      name: r.name,
      type: r.type,
      icon: r.icon,
      color: r.color,
      isDefault: r.isDefault,
      createdAt: r.createdAt,
    };
  }

  async create(data: {
    id: string;
    name: string;
    type: TransactionType;
    icon: string;
    color: string;
    isDefault?: boolean;
    createdAt?: string;
  }): Promise<Category> {
    const now = data.createdAt ?? new Date().toISOString();
    const row = {
      id: data.id,
      name: data.name.trim(),
      type: data.type,
      icon: data.icon,
      color: data.color,
      isDefault: data.isDefault ?? false,
      createdAt: now,
    };

    await this.db.insert(categories).values(row);

    return {
      ...row,
    };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(categories).where(eq(categories.id, id));
    // In expo-sqlite result contains changes
    return !!result;
  }
}
