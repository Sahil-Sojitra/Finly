import { eq, desc } from 'drizzle-orm';
import { getDatabase } from '../client';
import { salaryCycles } from '../schema';
import { Paise, SalaryCycle } from '@/types';

type DbInstance = ReturnType<typeof getDatabase>;

export class SalaryCycleRepository {
  private db: DbInstance;

  constructor(customDb?: DbInstance) {
    this.db = customDb ?? getDatabase();
  }

  async getAll(): Promise<SalaryCycle[]> {
    const rows = await this.db
      .select()
      .from(salaryCycles)
      .orderBy(desc(salaryCycles.receivedDate));

    return rows.map((r) => ({
      id: r.id,
      salaryAmount: r.salaryAmount,
      receivedDate: r.receivedDate,
      expectedNextDate: r.expectedNextDate,
      openingBalance: r.openingBalance,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  async getById(id: string): Promise<SalaryCycle | null> {
    const rows = await this.db
      .select()
      .from(salaryCycles)
      .where(eq(salaryCycles.id, id))
      .limit(1);

    const r = rows[0];
    if (!r) return null;

    return {
      id: r.id,
      salaryAmount: r.salaryAmount,
      receivedDate: r.receivedDate,
      expectedNextDate: r.expectedNextDate,
      openingBalance: r.openingBalance,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  async getLatest(): Promise<SalaryCycle | null> {
    const rows = await this.db
      .select()
      .from(salaryCycles)
      .orderBy(desc(salaryCycles.receivedDate))
      .limit(1);

    const r = rows[0];
    if (!r) return null;

    return {
      id: r.id,
      salaryAmount: r.salaryAmount,
      receivedDate: r.receivedDate,
      expectedNextDate: r.expectedNextDate,
      openingBalance: r.openingBalance,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  async create(data: {
    id: string;
    salaryAmount: Paise;
    receivedDate: string;
    expectedNextDate?: string | null;
    openingBalance?: Paise;
    createdAt?: string;
    updatedAt?: string;
  }): Promise<SalaryCycle> {
    const now = data.createdAt ?? new Date().toISOString();
    const row = {
      id: data.id,
      salaryAmount: data.salaryAmount,
      receivedDate: data.receivedDate,
      expectedNextDate: data.expectedNextDate ?? null,
      openingBalance: data.openingBalance ?? 0,
      createdAt: now,
      updatedAt: data.updatedAt ?? now,
    };

    await this.db.insert(salaryCycles).values(row);

    return {
      ...row,
    };
  }

  async update(
    id: string,
    data: Partial<{
      salaryAmount: Paise;
      receivedDate: string;
      expectedNextDate: string | null;
      openingBalance: Paise;
    }>
  ): Promise<SalaryCycle | null> {
    const now = new Date().toISOString();

    await this.db
      .update(salaryCycles)
      .set({
        ...data,
        updatedAt: now,
      })
      .where(eq(salaryCycles.id, id));

    return this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(salaryCycles)
      .where(eq(salaryCycles.id, id));
    return !!result;
  }
}
