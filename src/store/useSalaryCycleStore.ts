import { create } from 'zustand';
import { Paise, SalaryCycle } from '@/types';
import { SalaryCycleRepository } from '@/database/repositories/salaryCycleRepository';
import { TransactionRepository } from '@/database/repositories/transactionRepository';
import { MultiCycleEvaluation, SalaryCycleEngine } from '@/domain/salaryCycleEngine';
import * as Crypto from 'expo-crypto';

interface SalaryCycleState {
  cycles: SalaryCycle[];
  evaluation: MultiCycleEvaluation | null;
  isLoading: boolean;
  error: string | null;
  fetchCycles: () => Promise<void>;
  recordSalary: (data: {
    salaryAmountPaise: Paise;
    receivedDate: string;
    expectedNextDate?: string | null;
    openingBalancePaise?: Paise;
  }) => Promise<SalaryCycle>;
  updateSalary: (
    id: string,
    data: Partial<{
      salaryAmountPaise: Paise;
      receivedDate: string;
      expectedNextDate: string | null;
      openingBalancePaise: Paise;
    }>
  ) => Promise<SalaryCycle | null>;
  deleteSalary: (id: string) => Promise<boolean>;
}

const cycleRepo = new SalaryCycleRepository();
const txRepo = new TransactionRepository();

export const useSalaryCycleStore = create<SalaryCycleState>((set, get) => ({
  cycles: [],
  evaluation: null,
  isLoading: false,
  error: null,

  fetchCycles: async () => {
    set({ isLoading: true, error: null });
    try {
      const rawCycles = await cycleRepo.getAll();
      const allTx = await txRepo.getAll();

      // Run domain engine evaluation with carry-forward chaining
      const evaluation = SalaryCycleEngine.evaluateAll(rawCycles, allTx);

      set({
        cycles: rawCycles,
        evaluation,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch salary cycles',
        isLoading: false,
      });
    }
  },

  recordSalary: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const id = Crypto.randomUUID();
      const created = await cycleRepo.create({
        id,
        salaryAmount: data.salaryAmountPaise,
        receivedDate: data.receivedDate,
        expectedNextDate: data.expectedNextDate ?? null,
        openingBalance: data.openingBalancePaise ?? 0,
      });

      // Refresh cycles & domain evaluation
      await get().fetchCycles();
      return created;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to record salary cycle',
        isLoading: false,
      });
      throw err;
    }
  },

  updateSalary: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await cycleRepo.update(id, {
        ...(data.salaryAmountPaise !== undefined
          ? { salaryAmount: data.salaryAmountPaise }
          : {}),
        ...(data.receivedDate !== undefined ? { receivedDate: data.receivedDate } : {}),
        ...(data.expectedNextDate !== undefined
          ? { expectedNextDate: data.expectedNextDate }
          : {}),
        ...(data.openingBalancePaise !== undefined
          ? { openingBalance: data.openingBalancePaise }
          : {}),
      });

      await get().fetchCycles();
      return updated;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to update salary cycle',
        isLoading: false,
      });
      return null;
    }
  },

  deleteSalary: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const success = await cycleRepo.delete(id);
      if (success) {
        await get().fetchCycles();
      }
      return success;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to delete salary cycle',
        isLoading: false,
      });
      return false;
    }
  },
}));

