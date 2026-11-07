import { relations } from 'drizzle-orm';
import { categories } from './categories';
import { salaryCycles } from './salaryCycles';
import { transactions } from './transactions';
import { appSettings } from './appSettings';
import { backupMetadata } from './backupMetadata';

export * from './categories';
export * from './salaryCycles';
export * from './transactions';
export * from './appSettings';
export * from './backupMetadata';

export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
}));

export const salaryCyclesRelations = relations(salaryCycles, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  salaryCycle: one(salaryCycles, {
    fields: [transactions.cycleId],
    references: [salaryCycles.id],
  }),
}));

export const schema = {
  categories,
  salaryCycles,
  transactions,
  appSettings,
  backupMetadata,
  categoriesRelations,
  salaryCyclesRelations,
  transactionsRelations,
};
