/**
 * Core type definitions for MyChoice AI (Finly)
 */

/**
 * Monetary amounts are strictly integer paise.
 * ₹1.00 = 100 paise.
 */
export type Paise = number;

export type TransactionType = 'income' | 'expense';

export type InputMethod = 'manual' | 'voice';

export type BackupStatus = 'success' | 'failed' | 'pending';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
}

export interface SalaryCycle {
  id: string;
  salaryAmount: Paise;
  receivedDate: string; // ISO 8601 YYYY-MM-DD
  expectedNextDate: string | null; // ISO 8601 YYYY-MM-DD (nullable)
  openingBalance: Paise;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  cycleId: string | null;
  type: TransactionType;
  amount: Paise;
  description: string;
  categoryId: string;
  transactionDate: string; // ISO 8601 YYYY-MM-DD
  inputMethod: InputMethod;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionWithCategory extends Transaction {
  category: Category;
}

export interface AppSetting {
  key: string;
  value: string;
  updatedAt: string;
}

export interface BackupMetadata {
  id: string;
  provider: string;
  lastBackupAt: string;
  backupVersion: string;
  status: BackupStatus;
  remoteBackupId: string | null;
  createdAt: string;
}
