import { create } from 'zustand';
import { AnalyticsFilter } from '@/domain/analyticsEngine';

interface AnalyticsState {
  filter: AnalyticsFilter;
  spendingTrendView: 'daily' | 'weekly';
  setFilter: (filter: AnalyticsFilter) => void;
  setSpendingTrendView: (view: 'daily' | 'weekly') => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  filter: { type: 'current_cycle' },
  spendingTrendView: 'daily',

  setFilter: (filter: AnalyticsFilter) => set({ filter }),
  setSpendingTrendView: (spendingTrendView: 'daily' | 'weekly') =>
    set({ spendingTrendView }),
}));
