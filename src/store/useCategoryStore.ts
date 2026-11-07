import { create } from 'zustand';
import { Category, TransactionType } from '@/types';
import { CategoryRepository } from '@/database/repositories/categoryRepository';

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  getByType: (type: TransactionType) => Category[];
}

const repository = new CategoryRepository();

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const items = await repository.getAll();
      set({ categories: items, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch categories',
        isLoading: false,
      });
    }
  },

  getByType: (type: TransactionType) => {
    return get().categories.filter((c) => c.type === type);
  },
}));

