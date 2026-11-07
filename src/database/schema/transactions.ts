import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { categories } from './categories';
import { salaryCycles } from './salaryCycles';

export const transactions = sqliteTable(
  'transactions',
  {
    id: text('id').primaryKey(),
    cycleId: text('cycle_id').references(() => salaryCycles.id, {
      onDelete: 'set null',
    }),
    type: text('type').notNull().$type<'income' | 'expense'>(),
    amount: integer('amount').notNull(),
    description: text('description').notNull(),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    transactionDate: text('transaction_date').notNull(), // ISO8601 YYYY-MM-DD
    inputMethod: text('input_method')
      .notNull()
      .$type<'manual' | 'voice'>()
      .default('manual'),
    notes: text('notes'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_transactions_date').on(table.transactionDate),
    index('idx_transactions_cycle').on(table.cycleId),
    index('idx_transactions_category').on(table.categoryId),
  ]
);

export type TransactionRow = typeof transactions.$inferSelect;
export type NewTransactionRow = typeof transactions.$inferInsert;
