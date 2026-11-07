import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { categories } from './categories';
import { salaryCycles } from './salaryCycles';

export const transactions = sqliteTable(
  'transactions',
  {
    id: text('id').primaryKey(),
    salaryCycleId: text('salary_cycle_id').references(() => salaryCycles.id, {
      onDelete: 'set null',
    }),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    amountPaise: integer('amount_paise').notNull(),
    type: text('type').notNull().$type<'expense' | 'income' | 'carry_forward'>(),
    transactionDate: text('transaction_date').notNull(), // ISO8601 YYYY-MM-DD
    note: text('note'),
    paymentMode: text('payment_mode')
      .notNull()
      .$type<'upi' | 'card' | 'cash' | 'netbanking' | 'other'>(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_transactions_date').on(table.transactionDate),
    index('idx_transactions_cycle').on(table.salaryCycleId),
    index('idx_transactions_category').on(table.categoryId),
  ]
);

export type TransactionRow = typeof transactions.$inferSelect;
export type NewTransactionRow = typeof transactions.$inferInsert;
