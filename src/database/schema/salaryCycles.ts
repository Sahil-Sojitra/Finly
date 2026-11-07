import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const salaryCycles = sqliteTable(
  'salary_cycles',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    startDate: text('start_date').notNull(), // ISO8601 YYYY-MM-DD
    endDate: text('end_date'), // ISO8601 YYYY-MM-DD (null if active)
    baseSalaryPaise: integer('base_salary_paise').notNull().default(0),
    openingBalancePaise: integer('opening_balance_paise').notNull().default(0),
    carryForwardPaise: integer('carry_forward_paise').notNull().default(0),
    status: text('status').notNull().$type<'active' | 'closed'>(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_salary_cycles_dates').on(table.startDate, table.endDate),
  ]
);

export type SalaryCycleRow = typeof salaryCycles.$inferSelect;
export type NewSalaryCycleRow = typeof salaryCycles.$inferInsert;
