import { Paise } from '@/types';

export interface CategoryComparison {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  currentCyclePaise: Paise;
  formattedCurrentSpend: string;
  previousCyclePaise: Paise;
  formattedPreviousSpend: string;
  percentChange: number; // e.g. +35% or -10%
  isHigher: boolean;
  message: string;
}

export interface UnusualSpendingAnomaly {
  id: string;
  type: 'single_transaction_spike' | 'category_cycle_spike' | 'daily_burn_spike';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  amountPaise?: Paise;
  formattedAmount?: string;
  categoryName?: string;
  date?: string;
}

export interface SpendingWarning {
  id: string;
  level: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  metric?: string;
}

export interface RuleBasedSuggestion {
  id: string;
  category: 'budget' | 'savings' | 'category_optimization' | 'pacing';
  title: string;
  recommendation: string;
  safeDailyLimitPaise?: Paise;
  formattedSafeDailyLimit?: string;
}

export interface SpendingInsightsData {
  hasActiveCycle: boolean;
  cycleName: string;
  cycleStartDate: string | null;
  cycleEndDate: string | null;

  // 1. Daily Spending
  todaySpendingPaise: Paise;
  formattedTodaySpending: string;
  todayVsAverageDiffPaise: Paise;
  isTodaySpendingHigher: boolean;

  // 2. Weekly Spending
  currentWeekSpendingPaise: Paise;
  formattedCurrentWeekSpending: string;
  previousWeekSpendingPaise: Paise;
  formattedPreviousWeekSpending: string;
  weekOverWeekChangePercent: number;

  // 3. Salary-Cycle Spending
  salaryAmountPaise: Paise;
  formattedSalaryAmount: string;
  cycleExpensesPaise: Paise;
  formattedCycleExpenses: string;
  spentPercentage: number; // e.g. 60
  spentSummaryMessage: string; // "You have spent 60% of your salary."

  // 4. Highest Expense Categories
  topExpenseCategories: {
    categoryId: string;
    categoryName: string;
    icon: string;
    color: string;
    amountPaise: Paise;
    formattedAmount: string;
    percentOfCycleExpenses: number;
  }[];

  // 5. Daily Average Expense
  dailyAverageExpensePaise: Paise;
  formattedDailyAverageExpense: string; // "Your average daily spending is ₹450."
  daysElapsed: number;
  daysRemaining: number | null;

  // 6. Projected Remaining Balance
  projectedRemainingBalancePaise: Paise | null;
  formattedProjectedRemainingBalance: string | null;
  projectedRunoutDays: number | null;
  projectionMessage: string;

  // 7. Savings Percentage
  savingsPercentage: number;
  savingsPaise: Paise;
  formattedSavings: string;

  // 8. Unusual Spending & Anomalies
  anomalies: UnusualSpendingAnomaly[];

  // 9. Warnings & Threshold Breaches
  warnings: SpendingWarning[];

  // 10. Personalized Rule-Based Suggestions
  suggestions: RuleBasedSuggestion[];

  // Cycle Category Comparisons
  categoryComparisons: CategoryComparison[];
}

export interface NotificationSettings {
  dailyReminderEnabled: boolean;
  dailyReminderHour: number; // 24-hour (default 20:00 / 8 PM)
  dailyReminderMinute: number;

  weeklySummaryEnabled: boolean;
  weeklySummaryDay: number; // 1 = Monday ... 7 = Sunday (default Sunday)
  weeklySummaryHour: number;

  salaryReceivedReminderEnabled: boolean;
  backupReminderEnabled: boolean;

  thresholdAlertsEnabled: boolean;
  thresholdPercentages: number[]; // e.g. [50, 75, 90]
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  dailyReminderEnabled: true,
  dailyReminderHour: 20, // 8:00 PM
  dailyReminderMinute: 0,
  weeklySummaryEnabled: true,
  weeklySummaryDay: 7, // Sunday
  weeklySummaryHour: 19, // 7:00 PM
  salaryReceivedReminderEnabled: true,
  backupReminderEnabled: true,
  thresholdAlertsEnabled: true,
  thresholdPercentages: [50, 75, 90],
};
