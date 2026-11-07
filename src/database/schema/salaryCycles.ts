import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const salaryCycles = sqliteTable(
  'salary_cycles',
  {
    id: text('id').primaryKey(),
    salaryAmount: integer('salary_amount').notNull(),
    receivedDate: text('received_date').notNull(), // ISO8601 YYYY-MM-DD
    expectedNextDate: text('expected_next_date'), // ISO8601 YYYY-MM-DD (nullable)
    openingBalance: integer('opening_balance').notNull().default(0),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_salary_cycles_received_date').on(table.receivedDate),
  ]
);

export type SalaryCycleRow = typeof salaryCycles.$inferSelect;
export type NewSalaryCycleRow = typeof salaryCycles.$inferInsert;
