/**
 * Core type definitions for MyChoice AI (Finly)
 */

/**
 * Monetary amounts are strictly integer paise.
 * ₹1.00 = 100 paise.
 */
export type Paise = number;

export type TransactionType = 'expense' | 'income' | 'carry_forward';

export type PaymentMode = 'upi' | 'card' | 'cash' | 'netbanking' | 'other';

export type SalaryCycleStatus = 'active' | 'closed';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryCycle {
  id: string;
  name: string;
  startDate: string; // ISO 8601 YYYY-MM-DD
  endDate: string | null; // ISO 8601 YYYY-MM-DD, null if active
  baseSalaryPaise: Paise;
  openingBalancePaise: Paise;
  carryForwardPaise: Paise;
  status: SalaryCycleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  salaryCycleId: string | null;
  categoryId: string;
  amountPaise: Paise;
  type: TransactionType;
  transactionDate: string; // ISO 8601 YYYY-MM-DD
  note?: string | null;
  paymentMode: PaymentMode;
  createdAt: string;
  updatedAt: string;
}

export interface AppSetting {
  key: string;
  value: string;
  updatedAt: string;
}

export interface BackupMetadata {
  id: string;
  backupDate: string;
  checksum: string;
  sizeBytes: number;
  remoteFileId: string;
  status: 'success' | 'failed';
}

