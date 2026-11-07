import { Paise, TransactionWithCategory, SalaryCycle } from '@/types';
import { MultiCycleEvaluation } from './salaryCycleEngine';
import {
  diffInDays,
  formatDisplayDate,
  formatShortDate,
  formatDayOfWeek,
  generateDateRange,
  isDateWithinInterval,
} from './dateUtils';

export type AnalyticsFilterType = 'current_cycle' | 'previous_cycle' | 'all_time' | 'custom';

export interface AnalyticsFilter {
  type: AnalyticsFilterType;
  customStartDate?: string; // ISO8601 YYYY-MM-DD
  customEndDate?: string; // ISO8601 YYYY-MM-DD
}

export interface FinancialSummary {
  hasActiveCycle: boolean;
  filterType: AnalyticsFilterType;
  periodLabel: string;
  startDate: string | null;
  endDate: string | null;

  // Balances & Incomes (in integer paise)
  openingBalancePaise: Paise;
  salaryIncomePaise: Paise;
  additionalIncomePaise: Paise;
  totalIncomePaise: Paise; // salaryIncome + additionalIncome
  totalExpensesPaise: Paise;
  netSavingsPaise: Paise; // totalIncome - totalExpenses
  availableBalancePaise: Paise; // openingBalance + totalIncome - totalExpenses

  // Percentages & Rates
  expensePercentage: number; // (expenses / totalIncome) * 100
  savingsPercentage: number; // (netSavings / totalIncome) * 100
  burnRatePaisePerDay: Paise; // totalExpenses / max(1, daysElapsed)

  // Counts & Days
  daysTotal: number | null;
  daysElapsed: number;
  daysRemaining: number | null; // until expected date or cycle end
  transactionCount: number;
}

export interface CategorySpendBreakdown {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amountPaise: Paise;
  percentageOfTotal: number; // 0 to 100 (rounded)
  transactionCount: number;
}

export interface DailySpendingPoint {
  date: string; // YYYY-MM-DD
  displayDate: string; // e.g. "05 Nov"
  dayOfWeek: string; // "Mon", "Tue"
  amountPaise: Paise;
  isToday: boolean;
}

export interface WeeklySpendingPoint {
  weekIndex: number; // 1, 2, 3...
  label: string; // "Week 1", "Week 2"...
  startDate: string;
  endDate: string;
  amountPaise: Paise;
}

export interface CycleComparison {
  hasComparison: boolean;
  activeCycleId: string | null;
  previousCycleId: string | null;
  activeCycleSpendPaise: Paise;
  previousCycleSpendPaise: Paise;
  spendDifferencePaise: Paise; // active - previous
  spendPercentageChange: number; // ((active - prev) / prev) * 100
  activeCycleSavingsPaise: Paise;
  previousCycleSavingsPaise: Paise;
  savingsDifferencePaise: Paise; // active - previous
  activeDailyAvgPaise: Paise;
  previousDailyAvgPaise: Paise;
}

export interface DashboardAnalytics {
  summary: FinancialSummary;
  categoryBreakdown: CategorySpendBreakdown[];
  highestExpenseCategory: CategorySpendBreakdown | null;
  dailySpending: DailySpendingPoint[];
  weeklySpending: WeeklySpendingPoint[];
  cycleComparison: CycleComparison;
  filteredTransactions: TransactionWithCategory[];
}

export class AnalyticsEngine {
  /**
   * Main evaluation entry point for dashboard financial analytics.
   * Deterministically computes summaries, breakdowns, trends, and comparisons
   * strictly from domain entities and integer paise.
   */
  static evaluateDashboardAnalytics(params: {
    cycles: SalaryCycle[];
    transactions: TransactionWithCategory[];
    evaluation: MultiCycleEvaluation | null;
    filter: AnalyticsFilter;
    currentDate?: string;
  }): DashboardAnalytics {
    const { cycles, transactions, evaluation, filter } = params;
    const today = params.currentDate ?? new Date().toISOString().slice(0, 10);

    const boundaries = evaluation?.boundaries ?? [];
    const activeBoundary = boundaries.find((b) => b.isActive) ?? null;

    let filteredTransactions: TransactionWithCategory[] = [];
    let summary: FinancialSummary;

    switch (filter.type) {
      case 'current_cycle': {
        if (!activeBoundary || !evaluation) {
          summary = this.createEmptySummary('current_cycle', 'No Active Salary Cycle');
          break;
        }

        const metrics = evaluation.metricsByCycleId.get(activeBoundary.id);
        const startDate = activeBoundary.receivedDate;
        const endDate = activeBoundary.endDate;

        // Transactions within active cycle
        filteredTransactions = transactions.filter((tx) =>
          isDateWithinInterval(tx.transactionDate, startDate, endDate)
        );

        const totalIncome = metrics ? metrics.totalIncomePaise : activeBoundary.salaryAmount;
        const expenses = metrics ? metrics.expensesPaise : 0;
        const netSavings = metrics ? metrics.netSavingsPaise : totalIncome;
        const openingBalance = metrics ? metrics.openingBalancePaise : activeBoundary.openingBalance;
        const availableBalance = metrics ? metrics.availableBalancePaise : openingBalance + totalIncome;

        const expensePercentage = totalIncome > 0
          ? Math.min(100, Math.round((expenses / totalIncome) * 100))
          : 0;

        const savingsPercentage = totalIncome > 0
          ? Math.round((netSavings / totalIncome) * 100)
          : 0;

        const daysElapsed = metrics ? metrics.daysElapsed : Math.max(1, diffInDays(startDate, today) + 1);
        const burnRate = Math.round(expenses / Math.max(1, daysElapsed));

        let daysRemaining: number | null = null;
        if (activeBoundary.expectedNextDate) {
          const diff = diffInDays(today, activeBoundary.expectedNextDate);
          daysRemaining = Math.max(0, diff);
        }

        summary = {
          hasActiveCycle: true,
          filterType: 'current_cycle',
          periodLabel: `${formatDisplayDate(startDate)} – Present`,
          startDate,
          endDate,
          openingBalancePaise: openingBalance,
          salaryIncomePaise: activeBoundary.salaryAmount,
          additionalIncomePaise: metrics ? metrics.additionalIncomePaise : 0,
          totalIncomePaise: totalIncome,
          totalExpensesPaise: expenses,
          netSavingsPaise: netSavings,
          availableBalancePaise: availableBalance,
          expensePercentage,
          savingsPercentage,
          burnRatePaisePerDay: burnRate,
          daysTotal: metrics?.daysTotal ?? null,
          daysElapsed,
          daysRemaining,
          transactionCount: filteredTransactions.length,
        };
        break;
      }

      case 'previous_cycle': {
        if (!evaluation || boundaries.length < 2) {
          summary = this.createEmptySummary('previous_cycle', 'No Previous Salary Cycle');
          break;
        }

        const prevBoundary = boundaries[boundaries.length - 2]!;
        const prevMetrics = evaluation.metricsByCycleId.get(prevBoundary.id);
        const startDate = prevBoundary.receivedDate;
        const endDate = prevBoundary.endDate ?? today;

        filteredTransactions = transactions.filter((tx) =>
          isDateWithinInterval(tx.transactionDate, startDate, endDate)
        );

        const totalIncome = prevMetrics ? prevMetrics.totalIncomePaise : prevBoundary.salaryAmount;
        const expenses = prevMetrics ? prevMetrics.expensesPaise : 0;
        const netSavings = prevMetrics ? prevMetrics.netSavingsPaise : totalIncome;
        const openingBalance = prevMetrics ? prevMetrics.openingBalancePaise : prevBoundary.openingBalance;
        const availableBalance = prevMetrics ? prevMetrics.availableBalancePaise : openingBalance + totalIncome - expenses;

        const expensePercentage = totalIncome > 0
          ? Math.min(100, Math.round((expenses / totalIncome) * 100))
          : 0;

        const savingsPercentage = totalIncome > 0
          ? Math.round((netSavings / totalIncome) * 100)
          : 0;

        const daysElapsed = prevMetrics?.daysElapsed ?? Math.max(1, diffInDays(startDate, endDate) + 1);
        const burnRate = Math.round(expenses / Math.max(1, daysElapsed));

        summary = {
          hasActiveCycle: false,
          filterType: 'previous_cycle',
          periodLabel: `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`,
          startDate,
          endDate,
          openingBalancePaise: openingBalance,
          salaryIncomePaise: prevBoundary.salaryAmount,
          additionalIncomePaise: prevMetrics ? prevMetrics.additionalIncomePaise : 0,
          totalIncomePaise: totalIncome,
          totalExpensesPaise: expenses,
          netSavingsPaise: netSavings,
          availableBalancePaise: availableBalance,
          expensePercentage,
          savingsPercentage,
          burnRatePaisePerDay: burnRate,
          daysTotal: prevMetrics?.daysTotal ?? null,
          daysElapsed,
          daysRemaining: 0,
          transactionCount: filteredTransactions.length,
        };
        break;
      }

      case 'all_time': {
        filteredTransactions = [...transactions];

        let totalSalaryIncome: Paise = 0;
        for (const c of cycles) {
          totalSalaryIncome += c.salaryAmount;
        }

        let additionalIncome: Paise = 0;
        let totalExpenses: Paise = 0;

        for (const tx of filteredTransactions) {
          if (tx.type === 'income') {
            additionalIncome += tx.amount;
          } else if (tx.type === 'expense') {
            totalExpenses += tx.amount;
          }
        }

        const initialOpeningBalance: Paise = boundaries[0]?.openingBalance ?? 0;
        const totalIncome = totalSalaryIncome + additionalIncome;
        const netSavings = totalIncome - totalExpenses;
        const availableBalance = initialOpeningBalance + totalIncome - totalExpenses;

        const expensePercentage = totalIncome > 0
          ? Math.min(100, Math.round((totalExpenses / totalIncome) * 100))
          : 0;

        const savingsPercentage = totalIncome > 0
          ? Math.round((netSavings / totalIncome) * 100)
          : 0;

        // Determine date span
        const firstDate = boundaries[0]?.receivedDate ?? (filteredTransactions[filteredTransactions.length - 1]?.transactionDate ?? today);
        const daysElapsed = Math.max(1, diffInDays(firstDate, today) + 1);
        const burnRate = Math.round(totalExpenses / Math.max(1, daysElapsed));

        summary = {
          hasActiveCycle: !!activeBoundary,
          filterType: 'all_time',
          periodLabel: 'All-Time Financial History',
          startDate: firstDate,
          endDate: today,
          openingBalancePaise: initialOpeningBalance,
          salaryIncomePaise: totalSalaryIncome,
          additionalIncomePaise: additionalIncome,
          totalIncomePaise: totalIncome,
          totalExpensesPaise: totalExpenses,
          netSavingsPaise: netSavings,
          availableBalancePaise: availableBalance,
          expensePercentage,
          savingsPercentage,
          burnRatePaisePerDay: burnRate,
          daysTotal: null,
          daysElapsed,
          daysRemaining: null,
          transactionCount: filteredTransactions.length,
        };
        break;
      }

      case 'custom': {
        const start = filter.customStartDate ?? today;
        const end = filter.customEndDate ?? today;

        filteredTransactions = transactions.filter((tx) =>
          isDateWithinInterval(tx.transactionDate, start, end)
        );

        let salaryIncome: Paise = 0;
        for (const c of cycles) {
          if (c.receivedDate >= start && c.receivedDate <= end) {
            salaryIncome += c.salaryAmount;
          }
        }

        let additionalIncome: Paise = 0;
        let totalExpenses: Paise = 0;

        for (const tx of filteredTransactions) {
          if (tx.type === 'income') {
            additionalIncome += tx.amount;
          } else if (tx.type === 'expense') {
            totalExpenses += tx.amount;
          }
        }

        const totalIncome = salaryIncome + additionalIncome;
        const netSavings = totalIncome - totalExpenses;
        const expensePercentage = totalIncome > 0
          ? Math.min(100, Math.round((totalExpenses / totalIncome) * 100))
          : 0;

        const savingsPercentage = totalIncome > 0
          ? Math.round((netSavings / totalIncome) * 100)
          : 0;

        const daysElapsed = Math.max(1, diffInDays(start, end) + 1);
        const burnRate = Math.round(totalExpenses / Math.max(1, daysElapsed));

        summary = {
          hasActiveCycle: !!activeBoundary,
          filterType: 'custom',
          periodLabel: `${formatDisplayDate(start)} – ${formatDisplayDate(end)}`,
          startDate: start,
          endDate: end,
          openingBalancePaise: 0,
          salaryIncomePaise: salaryIncome,
          additionalIncomePaise: additionalIncome,
          totalIncomePaise: totalIncome,
          totalExpensesPaise: totalExpenses,
          netSavingsPaise: netSavings,
          availableBalancePaise: netSavings,
          expensePercentage,
          savingsPercentage,
          burnRatePaisePerDay: burnRate,
          daysTotal: daysElapsed,
          daysElapsed,
          daysRemaining: null,
          transactionCount: filteredTransactions.length,
        };
        break;
      }
    }

    // Category breakdown
    const categoryBreakdown = this.computeCategoryBreakdown(
      filteredTransactions,
      summary.totalExpensesPaise
    );
    const highestExpenseCategory = categoryBreakdown[0] ?? null;

    // Daily & weekly spending
    const rangeStart = summary.startDate ?? today;
    const rangeEnd = summary.endDate ?? today;
    const dailySpending = this.computeDailySpending(filteredTransactions, rangeStart, rangeEnd, today);
    const weeklySpending = this.computeWeeklySpending(filteredTransactions, rangeStart, rangeEnd);

    // Cycle comparison
    const cycleComparison = this.computeCycleComparison(evaluation);

    return {
      summary,
      categoryBreakdown,
      highestExpenseCategory,
      dailySpending,
      weeklySpending,
      cycleComparison,
      filteredTransactions,
    };
  }

  /**
   * Aggregates expenses by category, sorts descending by amount,
   * and computes percentage of total expenses.
   */
  static computeCategoryBreakdown(
    transactions: TransactionWithCategory[],
    totalExpensesPaise: Paise
  ): CategorySpendBreakdown[] {
    const expenseTx = transactions.filter((tx) => tx.type === 'expense');
    const map = new Map<
      string,
      {
        categoryId: string;
        categoryName: string;
        categoryIcon: string;
        categoryColor: string;
        amountPaise: Paise;
        count: number;
      }
    >();

    for (const tx of expenseTx) {
      const existing = map.get(tx.categoryId);
      if (existing) {
        existing.amountPaise += tx.amount;
        existing.count += 1;
      } else {
        map.set(tx.categoryId, {
          categoryId: tx.categoryId,
          categoryName: tx.category?.name ?? 'Other',
          categoryIcon: tx.category?.icon ?? 'cash',
          categoryColor: tx.category?.color ?? '#6B7280',
          amountPaise: tx.amount,
          count: 1,
        });
      }
    }

    const list: CategorySpendBreakdown[] = [];
    for (const item of map.values()) {
      const percentage = totalExpensesPaise > 0
        ? Math.round((item.amountPaise / totalExpensesPaise) * 100)
        : 0;

      list.push({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        categoryIcon: item.categoryIcon,
        categoryColor: item.categoryColor,
        amountPaise: item.amountPaise,
        percentageOfTotal: percentage,
        transactionCount: item.count,
      });
    }

    // Sort descending by highest expense
    return list.sort((a, b) => b.amountPaise - a.amountPaise);
  }

  /**
   * Produces daily spending points for a given date window.
   * If the window spans more than 14 days, trims to the last 14 days
   * for optimal mobile readability.
   */
  static computeDailySpending(
    transactions: TransactionWithCategory[],
    startDate: string,
    endDate: string,
    currentDate: string
  ): DailySpendingPoint[] {
    const expenseTx = transactions.filter((tx) => tx.type === 'expense');

    // Aggregate spend per date
    const spendByDate = new Map<string, Paise>();
    for (const tx of expenseTx) {
      const existing = spendByDate.get(tx.transactionDate) ?? 0;
      spendByDate.set(tx.transactionDate, existing + tx.amount);
    }

    // Determine window to display (max 14 days to keep charts readable on small screens)
    const fullRange = generateDateRange(startDate, endDate);
    const visibleRange = fullRange.length > 14
      ? fullRange.slice(fullRange.length - 14)
      : fullRange;

    return visibleRange.map((d) => {
      const amountPaise = spendByDate.get(d) ?? 0;
      return {
        date: d,
        displayDate: formatShortDate(d),
        dayOfWeek: formatDayOfWeek(d),
        amountPaise,
        isToday: d === currentDate,
      };
    });
  }

  /**
   * Groups spending into 7-day chronological weeks.
   */
  static computeWeeklySpending(
    transactions: TransactionWithCategory[],
    startDate: string,
    endDate: string
  ): WeeklySpendingPoint[] {
    const expenseTx = transactions.filter((tx) => tx.type === 'expense');
    const days = generateDateRange(startDate, endDate);
    if (days.length === 0) return [];

    const weeks: WeeklySpendingPoint[] = [];
    const chunkSize = 7;

    for (let i = 0; i < days.length; i += chunkSize) {
      const weekIndex = Math.floor(i / chunkSize) + 1;
      const weekDays = days.slice(i, i + chunkSize);
      const wStart = weekDays[0]!;
      const wEnd = weekDays[weekDays.length - 1]!;

      let weekSpend: Paise = 0;
      for (const tx of expenseTx) {
        if (tx.transactionDate >= wStart && tx.transactionDate <= wEnd) {
          weekSpend += tx.amount;
        }
      }

      weeks.push({
        weekIndex,
        label: `Week ${weekIndex}`,
        startDate: wStart,
        endDate: wEnd,
        amountPaise: weekSpend,
      });
    }

    return weeks;
  }

  /**
   * Compares the Active salary cycle with the Previous salary cycle.
   */
  static computeCycleComparison(evaluation: MultiCycleEvaluation | null): CycleComparison {
    if (!evaluation || evaluation.boundaries.length < 2) {
      return {
        hasComparison: false,
        activeCycleId: null,
        previousCycleId: null,
        activeCycleSpendPaise: 0,
        previousCycleSpendPaise: 0,
        spendDifferencePaise: 0,
        spendPercentageChange: 0,
        activeCycleSavingsPaise: 0,
        previousCycleSavingsPaise: 0,
        savingsDifferencePaise: 0,
        activeDailyAvgPaise: 0,
        previousDailyAvgPaise: 0,
      };
    }

    const boundaries = evaluation.boundaries;
    const active = boundaries[boundaries.length - 1]!;
    const previous = boundaries[boundaries.length - 2]!;

    const activeMetrics = evaluation.metricsByCycleId.get(active.id);
    const prevMetrics = evaluation.metricsByCycleId.get(previous.id);

    const activeSpend = activeMetrics?.expensesPaise ?? 0;
    const prevSpend = prevMetrics?.expensesPaise ?? 0;
    const spendDiff = activeSpend - prevSpend;

    const spendPctChange = prevSpend > 0
      ? Math.round((spendDiff / prevSpend) * 100)
      : 0;

    const activeSavings = activeMetrics?.netSavingsPaise ?? 0;
    const prevSavings = prevMetrics?.netSavingsPaise ?? 0;
    const savingsDiff = activeSavings - prevSavings;

    const activeDaily = activeMetrics
      ? Math.round(activeMetrics.expensesPaise / Math.max(1, activeMetrics.daysElapsed))
      : 0;

    const prevDaily = prevMetrics
      ? Math.round(prevMetrics.expensesPaise / Math.max(1, prevMetrics.daysElapsed))
      : 0;

    return {
      hasComparison: true,
      activeCycleId: active.id,
      previousCycleId: previous.id,
      activeCycleSpendPaise: activeSpend,
      previousCycleSpendPaise: prevSpend,
      spendDifferencePaise: spendDiff,
      spendPercentageChange: spendPctChange,
      activeCycleSavingsPaise: activeSavings,
      previousCycleSavingsPaise: prevSavings,
      savingsDifferencePaise: savingsDiff,
      activeDailyAvgPaise: activeDaily,
      previousDailyAvgPaise: prevDaily,
    };
  }

  private static createEmptySummary(
    filterType: AnalyticsFilterType,
    periodLabel: string
  ): FinancialSummary {
    return {
      hasActiveCycle: false,
      filterType,
      periodLabel,
      startDate: null,
      endDate: null,
      openingBalancePaise: 0,
      salaryIncomePaise: 0,
      additionalIncomePaise: 0,
      totalIncomePaise: 0,
      totalExpensesPaise: 0,
      netSavingsPaise: 0,
      availableBalancePaise: 0,
      expensePercentage: 0,
      savingsPercentage: 0,
      burnRatePaisePerDay: 0,
      daysTotal: null,
      daysElapsed: 0,
      daysRemaining: null,
      transactionCount: 0,
    };
  }
}
