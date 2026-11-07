import { eq, desc } from 'drizzle-orm';
import { getDatabase } from '../client';
import { transactions, categories } from '../schema';
import {
  Paise,
  Transaction,
  TransactionType,
  InputMethod,
  TransactionWithCategory,
} from '@/types';

type DbInstance = ReturnType<typeof getDatabase>;

export class TransactionRepository {
  private db: DbInstance;

  constructor(customDb?: DbInstance) {
    this.db = customDb ?? getDatabase();
  }

  async getAll(): Promise<TransactionWithCategory[]> {
    const rows = await this.db
      .select({
        tx: transactions,
        cat: categories,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .orderBy(desc(transactions.transactionDate), desc(transactions.createdAt));

    return rows.map(({ tx, cat }) => ({
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
      category: {
        id: cat.id,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        isDefault: cat.isDefault,
        createdAt: cat.createdAt,
      },
    }));
  }

  async getByCycleId(cycleId: string | null): Promise<TransactionWithCategory[]> {
    const condition = cycleId === null
      ? eq(transactions.cycleId, '') // or null check
      : eq(transactions.cycleId, cycleId);

    const rows = await this.db
      .select({
        tx: transactions,
        cat: categories,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(condition)
      .orderBy(desc(transactions.transactionDate), desc(transactions.createdAt));

    return rows.map(({ tx, cat }) => ({
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
      category: {
        id: cat.id,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        isDefault: cat.isDefault,
        createdAt: cat.createdAt,
      },
    }));
  }

  async getById(id: string): Promise<TransactionWithCategory | null> {
    const rows = await this.db
      .select({
        tx: transactions,
        cat: categories,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(eq(transactions.id, id))
      .limit(1);

    const r = rows[0];
    if (!r) return null;

    return {
      id: r.tx.id,
      cycleId: r.tx.cycleId,
      type: r.tx.type,
      amount: r.tx.amount,
      description: r.tx.description,
      categoryId: r.tx.categoryId,
      transactionDate: r.tx.transactionDate,
      inputMethod: r.tx.inputMethod,
      notes: r.tx.notes,
      createdAt: r.tx.createdAt,
      updatedAt: r.tx.updatedAt,
      category: {
        id: r.cat.id,
        name: r.cat.name,
        type: r.cat.type,
        icon: r.cat.icon,
        color: r.cat.color,
        isDefault: r.cat.isDefault,
        createdAt: r.cat.createdAt,
      },
    };
  }

  async create(data: {
    id: string;
    cycleId?: string | null;
    type: TransactionType;
    amount: Paise;
    description: string;
    categoryId: string;
    transactionDate: string;
    inputMethod?: InputMethod;
    notes?: string | null;
    createdAt?: string;
    updatedAt?: string;
  }): Promise<Transaction> {
    const now = data.createdAt ?? new Date().toISOString();
    const row = {
      id: data.id,
      cycleId: data.cycleId ?? null,
      type: data.type,
      amount: data.amount,
      description: data.description.trim(),
      categoryId: data.categoryId,
      transactionDate: data.transactionDate,
      inputMethod: data.inputMethod ?? 'manual',
      notes: data.notes ?? null,
      createdAt: now,
      updatedAt: data.updatedAt ?? now,
    };

    await this.db.insert(transactions).values(row);

    return {
      ...row,
    };
  }

  async update(
    id: string,
    data: Partial<{
      cycleId: string | null;
      type: TransactionType;
      amount: Paise;
      description: string;
      categoryId: string;
      transactionDate: string;
      inputMethod: InputMethod;
      notes: string | null;
    }>
  ): Promise<TransactionWithCategory | null> {
    const now = new Date().toISOString();

    await this.db
      .update(transactions)
      .set({
        ...data,
        updatedAt: now,
      })
      .where(eq(transactions.id, id));

    return this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(transactions)
      .where(eq(transactions.id, id));
    return !!result;
  }

  async getTotalsByCycle(
    cycleId: string
  ): Promise<{ totalIncomePaise: Paise; totalExpensePaise: Paise; netPaise: Paise }> {
    const rows = await this.db
      .select({
        type: transactions.type,
        amount: transactions.amount,
      })
      .from(transactions)
      .where(eq(transactions.cycleId, cycleId));

    let totalIncomePaise = 0;
    let totalExpensePaise = 0;

    for (const row of rows) {
      if (row.type === 'income') {
        totalIncomePaise += row.amount;
      } else if (row.type === 'expense') {
        totalExpensePaise += row.amount;
      }
    }

    return {
      totalIncomePaise,
      totalExpensePaise,
      netPaise: totalIncomePaise - totalExpensePaise,
    };
  }
}
