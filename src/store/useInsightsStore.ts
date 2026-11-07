import { create } from 'zustand';
import {
  SpendingInsightsData,
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
} from '@/domain/insights/insightsTypes';
import { InsightsEngine } from '@/domain/insights/insightsEngine';
import { NotificationService } from '@/services/notificationService';
import { SalaryCycleRepository } from '@/database/repositories/salaryCycleRepository';
import { TransactionRepository } from '@/database/repositories/transactionRepository';

interface InsightsState {
  insightsData: SpendingInsightsData | null;
  notificationSettings: NotificationSettings;
  hasNotificationPermissions: boolean;
  isLoading: boolean;
  error: string | null;

  fetchInsights: () => Promise<void>;
  loadNotificationSettings: () => Promise<void>;
  updateNotificationSettings: (
    partial: Partial<NotificationSettings>
  ) => Promise<void>;
  requestNotificationPermissions: () => Promise<boolean>;
  sendTestNotification: () => Promise<void>;
}

const cycleRepo = new SalaryCycleRepository();
const txRepo = new TransactionRepository();

export const useInsightsStore = create<InsightsState>((set, get) => ({
  insightsData: null,
  notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
  hasNotificationPermissions: false,
  isLoading: false,
  error: null,

  fetchInsights: async () => {
    set({ isLoading: true, error: null });
    try {
      const [allCycles, allTransactions] = await Promise.all([
        cycleRepo.getAll(),
        txRepo.getAll(),
      ]);

      const sortedCycles = [...allCycles].sort((a, b) => a.receivedDate.localeCompare(b.receivedDate));
      const activeCycle = sortedCycles.length > 0 ? sortedCycles[sortedCycles.length - 1]! : null;
      // Find previous cycle (the cycle immediately preceding the active one)
      const previousCycle = sortedCycles.length > 1 ? sortedCycles[sortedCycles.length - 2]! : null;

      const data = InsightsEngine.generateInsights(
        activeCycle,
        previousCycle,
        allTransactions
      );

      set({ insightsData: data, isLoading: false });

      // Check if any spending threshold alert should be fired
      if (data.hasActiveCycle && data.spentPercentage > 0) {
        const { notificationSettings, hasNotificationPermissions } = get();
        if (
          hasNotificationPermissions &&
          notificationSettings.thresholdAlertsEnabled &&
          notificationSettings.thresholdPercentages.includes(data.spentPercentage)
        ) {
          NotificationService.triggerThresholdAlert(
            data.spentPercentage,
            data.formattedSalaryAmount,
            data.formattedCycleExpenses
          ).catch(() => {});
        }
      }
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to generate insights',
      });
    }
  },

  loadNotificationSettings: async () => {
    try {
      const [settings, hasPerms] = await Promise.all([
        NotificationService.getSettings(),
        NotificationService.hasPermissions(),
      ]);
      set({
        notificationSettings: settings,
        hasNotificationPermissions: hasPerms,
      });
    } catch {
      // Non-fatal
    }
  },

  updateNotificationSettings: async (partial) => {
    const updated = { ...get().notificationSettings, ...partial };
    set({ notificationSettings: updated });

    try {
      const allCycles = await cycleRepo.getAll();
      const sortedCycles = [...allCycles].sort((a, b) => a.receivedDate.localeCompare(b.receivedDate));
      const activeCycle = sortedCycles.length > 0 ? sortedCycles[sortedCycles.length - 1]! : null;
      await NotificationService.saveSettings(updated, activeCycle);
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to save notification settings',
      });
    }
  },

  requestNotificationPermissions: async () => {
    const granted = await NotificationService.requestPermissions();
    set({ hasNotificationPermissions: granted });
    if (granted) {
      const { notificationSettings } = get();
      const allCycles = await cycleRepo.getAll();
      const sortedCycles = [...allCycles].sort((a, b) => a.receivedDate.localeCompare(b.receivedDate));
      const activeCycle = sortedCycles.length > 0 ? sortedCycles[sortedCycles.length - 1]! : null;
      await NotificationService.syncScheduledNotifications(notificationSettings, activeCycle);
    }
    return granted;
  },

  sendTestNotification: async () => {
    await NotificationService.triggerTestNotification();
  },
}));
