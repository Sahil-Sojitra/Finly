import { create } from 'zustand';
import { TransactionWithCategory, Paise, Transaction } from '@/types';
import { TransactionRepository } from '@/database/repositories/transactionRepository';

interface TransactionState {
  transactions: TransactionWithCategory[];
  isLoading: boolean;
  error: string | null;
  fetchTransactions: () => Promise<void>;
  addTransaction: (
    data: Parameters<TransactionRepository['create']>[0]
  ) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<boolean>;
  getTotals: () => { totalIncome: Paise; totalExpense: Paise; balance: Paise };
}

const repository = new TransactionRepository();

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,

  fetchTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const items = await repository.getAll();
      set({ transactions: items, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch transactions',
        isLoading: false,
      });
    }
  },

  addTransaction: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const created = await repository.create(data);
      // Refresh list to pull full joined category details
      const items = await repository.getAll();
      set({ transactions: items, isLoading: false });
      return created;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to create transaction',
        isLoading: false,
      });
      throw err;
    }
  },

  deleteTransaction: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const success = await repository.delete(id);
      if (success) {
        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.id !== id),
          isLoading: false,
        }));
      }
      return success;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to delete transaction',
        isLoading: false,
      });
      return false;
    }
  },

  getTotals: () => {
    const { transactions } = get();
    let totalIncome = 0;
    let totalExpense = 0;

    for (const tx of transactions) {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else if (tx.type === 'expense') {
        totalExpense += tx.amount;
      }
    }

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  },
}));

