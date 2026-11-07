import {
  SalaryCycle,
  TransactionWithCategory,
  Paise,
} from '@/types';
import {
  SpendingInsightsData,
  UnusualSpendingAnomaly,
  SpendingWarning,
  RuleBasedSuggestion,
  CategoryComparison,
} from './insightsTypes';
import {
  diffInDays,
  addDays,
  formatDisplayDate,
} from '@/domain/dateUtils';
import { formatPaiseToInr } from '@/utils';

export class InsightsEngine {
  /**
   * Generates deterministic spending insights and rule-based intelligence
   * using exact integer-paise calculations.
   */
  static generateInsights(
    activeCycle: SalaryCycle | null,
    previousCycle: SalaryCycle | null,
    allTransactions: TransactionWithCategory[],
    currentDate = new Date().toISOString().slice(0, 10)
  ): SpendingInsightsData {
    if (!activeCycle) {
      return this.generateEmptyInsights(allTransactions, currentDate);
    }

    const cycleId = activeCycle.id;
    const cycleStartDate = activeCycle.receivedDate;
    const expectedNextDate = activeCycle.expectedNextDate;

    // Filter transactions belonging to active cycle
    const cycleTransactions = allTransactions.filter(
      (tx) => tx.cycleId === cycleId || (!tx.cycleId && tx.transactionDate >= cycleStartDate)
    );

    let cycleExpensesPaise = 0;
    let additionalIncomePaise = 0;
    const categorySpendMap = new Map<
      string,
      { name: string; icon: string; color: string; amount: Paise }
    >();

    for (const tx of cycleTransactions) {
      if (tx.type === 'expense') {
        cycleExpensesPaise += tx.amount;
        const existing = categorySpendMap.get(tx.categoryId);
        if (existing) {
          existing.amount += tx.amount;
        } else {
          categorySpendMap.set(tx.categoryId, {
            name: tx.category.name,
            icon: tx.category.icon,
            color: tx.category.color,
            amount: tx.amount,
          });
        }
      } else if (tx.type === 'income') {
        additionalIncomePaise += tx.amount;
      }
    }

    const totalIncomePaise =
      activeCycle.openingBalance + activeCycle.salaryAmount + additionalIncomePaise;
    const availableBalancePaise = totalIncomePaise - cycleExpensesPaise;

    // 1. Daily Spending
    const todayExpenses = allTransactions.filter(
      (tx) => tx.type === 'expense' && tx.transactionDate === currentDate
    );
    const todaySpendingPaise = todayExpenses.reduce((sum, tx) => sum + tx.amount, 0);

    // Days elapsed in current cycle
    const daysElapsed = Math.max(1, diffInDays(cycleStartDate, currentDate) + 1);
    const dailyAverageExpensePaise = Math.round(cycleExpensesPaise / daysElapsed);
    const todayVsAverageDiffPaise = todaySpendingPaise - dailyAverageExpensePaise;
    const isTodaySpendingHigher = todayVsAverageDiffPaise > 0;

    // 2. Weekly Spending (Last 7 days vs previous 7 days)
    const sevenDaysAgo = addDays(currentDate, -6);
    const fourteenDaysAgo = addDays(currentDate, -13);
    const eightDaysAgo = addDays(currentDate, -7);

    let currentWeekSpendingPaise = 0;
    let previousWeekSpendingPaise = 0;

    for (const tx of allTransactions) {
      if (tx.type === 'expense') {
        if (tx.transactionDate >= sevenDaysAgo && tx.transactionDate <= currentDate) {
          currentWeekSpendingPaise += tx.amount;
        } else if (
          tx.transactionDate >= fourteenDaysAgo &&
          tx.transactionDate <= eightDaysAgo
        ) {
          previousWeekSpendingPaise += tx.amount;
        }
      }
    }

    let weekOverWeekChangePercent = 0;
    if (previousWeekSpendingPaise > 0) {
      weekOverWeekChangePercent = Math.round(
        ((currentWeekSpendingPaise - previousWeekSpendingPaise) / previousWeekSpendingPaise) *
          100
      );
    }

    // 3. Salary-Cycle Spending
    const salaryAmountPaise = activeCycle.salaryAmount;
    const spentPercentage = Math.round((cycleExpensesPaise / Math.max(1, salaryAmountPaise)) * 100);
    const spentSummaryMessage = `You have spent ${spentPercentage}% of your salary.`;

    // 4. Highest Expense Categories
    const topExpenseCategories = Array.from(categorySpendMap.entries())
      .map(([id, info]) => ({
        categoryId: id,
        categoryName: info.name,
        icon: info.icon,
        color: info.color,
        amountPaise: info.amount,
        formattedAmount: formatPaiseToInr(info.amount),
        percentOfCycleExpenses:
          cycleExpensesPaise > 0 ? Math.round((info.amount / cycleExpensesPaise) * 100) : 0,
      }))
      .sort((a, b) => b.amountPaise - a.amountPaise);

    // 5. Projected Remaining Balance
    let daysRemaining: number | null = null;
    let projectedRemainingBalancePaise: Paise | null = null;
    let projectedRunoutDays: number | null = null;
    let projectionMessage = '';

    if (expectedNextDate) {
      daysRemaining = Math.max(0, diffInDays(currentDate, expectedNextDate));
      const projectedBurn = dailyAverageExpensePaise * daysRemaining;
      projectedRemainingBalancePaise = availableBalancePaise - projectedBurn;

      if (projectedRemainingBalancePaise >= 0) {
        projectionMessage = `At your current spending rate, your estimated balance at the end of this cycle is ${formatPaiseToInr(
          projectedRemainingBalancePaise
        )}.`;
      } else {
        const deficit = Math.abs(projectedRemainingBalancePaise);
        projectionMessage = `At your current spending rate, you may face a deficit of ${formatPaiseToInr(
          deficit
        )} before your next salary.`;
      }
    } else {
      projectedRunoutDays =
        dailyAverageExpensePaise > 0
          ? Math.max(0, Math.floor(availableBalancePaise / dailyAverageExpensePaise))
          : 999;
      projectionMessage = `At your current spending rate, your remaining balance can sustain approximately ${projectedRunoutDays} more days.`;
    }

    // 6. Savings Percentage
    const savingsPaise = Math.max(0, totalIncomePaise - cycleExpensesPaise);
    const savingsPercentage =
      totalIncomePaise > 0 ? Math.max(0, Math.round((savingsPaise / totalIncomePaise) * 100)) : 0;

    // 7. Category Comparisons (Current cycle vs Previous cycle)
    const categoryComparisons: CategoryComparison[] = [];
    if (previousCycle) {
      const prevCycleId = previousCycle.id;
      const prevTx = allTransactions.filter((tx) => tx.cycleId === prevCycleId && tx.type === 'expense');
      const prevCategoryMap = new Map<string, Paise>();
      for (const t of prevTx) {
        prevCategoryMap.set(t.categoryId, (prevCategoryMap.get(t.categoryId) ?? 0) + t.amount);
      }

      for (const top of topExpenseCategories) {
        const prevSpend = prevCategoryMap.get(top.categoryId) ?? 0;
        if (prevSpend > 0) {
          const diff = top.amountPaise - prevSpend;
          const pct = Math.round((diff / prevSpend) * 100);
          const isHigher = diff > 0;
          categoryComparisons.push({
            categoryId: top.categoryId,
            categoryName: top.categoryName,
            categoryIcon: top.icon,
            categoryColor: top.color,
            currentCyclePaise: top.amountPaise,
            formattedCurrentSpend: top.formattedAmount,
            previousCyclePaise: prevSpend,
            formattedPreviousSpend: formatPaiseToInr(prevSpend),
            percentChange: pct,
            isHigher,
            message: isHigher
              ? `Your ${top.categoryName} expenses are ${pct}% higher than your previous salary cycle.`
              : `Your ${top.categoryName} expenses are ${Math.abs(pct)}% lower than your previous salary cycle.`,
          });
        }
      }
    }

    // 8. Unusual Spending & Anomalies
    const anomalies: UnusualSpendingAnomaly[] = [];

    // Check for single transaction spikes (> 2.5x daily average and >= ₹1,000)
    const spikeThreshold = Math.max(100000, dailyAverageExpensePaise * 2.5);
    for (const tx of cycleTransactions) {
      if (tx.type === 'expense' && tx.amount >= spikeThreshold) {
        anomalies.push({
          id: `anomaly_spike_${tx.id}`,
          type: 'single_transaction_spike',
          severity: tx.amount > spikeThreshold * 1.5 ? 'high' : 'medium',
          title: `Large Expense: ${tx.description}`,
          description: `${formatPaiseToInr(tx.amount)} is over 2.5× your average daily spending.`,
          amountPaise: tx.amount,
          formattedAmount: formatPaiseToInr(tx.amount),
          categoryName: tx.category.name,
          date: tx.transactionDate,
        });
      }
    }

    // Check for category spikes (> 30% higher than previous cycle)
    for (const comp of categoryComparisons) {
      if (comp.isHigher && comp.percentChange >= 30 && comp.currentCyclePaise >= 100000) {
        anomalies.push({
          id: `anomaly_cat_${comp.categoryId}`,
          type: 'category_cycle_spike',
          severity: comp.percentChange >= 50 ? 'high' : 'medium',
          title: `${comp.categoryName} Spending Spike`,
          description: `Your ${comp.categoryName.toLowerCase()} expenses are ${comp.percentChange}% higher than your previous salary cycle.`,
          amountPaise: comp.currentCyclePaise,
          formattedAmount: comp.formattedCurrentSpend,
          categoryName: comp.categoryName,
        });
      }
    }

    // 9. Warnings
    const warnings: SpendingWarning[] = [];

    if (spentPercentage >= 90) {
      warnings.push({
        id: 'warning_spent_90',
        level: 'critical',
        title: 'Critical Salary Consumption',
        message: `You have consumed ${spentPercentage}% of your cycle salary.`,
        metric: `${spentPercentage}% Spent`,
      });
    } else if (spentPercentage >= 75) {
      warnings.push({
        id: 'warning_spent_75',
        level: 'warning',
        title: 'High Spending Threshold',
        message: `You have spent ${spentPercentage}% of your cycle salary.`,
        metric: `${spentPercentage}% Spent`,
      });
    }

    // Pace warning: spent >= 50% in first 35% of duration
    if (expectedNextDate) {
      const totalDuration = Math.max(1, diffInDays(cycleStartDate, expectedNextDate));
      const progressFraction = daysElapsed / totalDuration;
      if (spentPercentage >= 50 && progressFraction < 0.35) {
        warnings.push({
          id: 'warning_fast_pace',
          level: 'warning',
          title: 'Accelerated Spending Pace',
          message: `You have spent ${spentPercentage}% of your salary in only ${daysElapsed} days (${Math.round(
            progressFraction * 100
          )}% of cycle).`,
        });
      }
    }

    if (projectedRemainingBalancePaise !== null && projectedRemainingBalancePaise < 0) {
      warnings.push({
        id: 'warning_projected_deficit',
        level: 'critical',
        title: 'Projected Deficit Alert',
        message: `At this burn rate, you are on track to exceed your funds before your expected payday.`,
      });
    }

    // 10. Personalized Rule-Based Suggestions
    const suggestions: RuleBasedSuggestion[] = [];

    if (daysRemaining !== null && daysRemaining > 0 && availableBalancePaise > 0) {
      const safeDailyLimit = Math.max(0, Math.floor(availableBalancePaise / daysRemaining));
      suggestions.push({
        id: 'sugg_safe_daily',
        category: 'budget',
        title: 'Safe Daily Spending Target',
        recommendation: `To maintain a positive balance until payday (${daysRemaining} days left), keep daily spending under ${formatPaiseToInr(
          safeDailyLimit
        )}.`,
        safeDailyLimitPaise: safeDailyLimit,
        formattedSafeDailyLimit: formatPaiseToInr(safeDailyLimit),
      });
    }

    if (topExpenseCategories[0]) {
      const top = topExpenseCategories[0];
      if (top.percentOfCycleExpenses >= 35) {
        suggestions.push({
          id: 'sugg_top_category',
          category: 'category_optimization',
          title: `${top.categoryName} Optimization`,
          recommendation: `${top.categoryName} represents ${top.percentOfCycleExpenses}% of your spending this cycle. Reviewing discretionary purchases here could yield the largest savings buffer.`,
        });
      }
    }

    if (savingsPercentage >= 25) {
      suggestions.push({
        id: 'sugg_healthy_savings',
        category: 'savings',
        title: 'Strong Savings Rate',
        recommendation: `Your savings rate is currently at ${savingsPercentage}%. Maintaining this disciplined pace will leave a solid carry-forward balance for your next cycle.`,
      });
    }

    return {
      hasActiveCycle: true,
      cycleName: `Cycle from ${formatDisplayDate(cycleStartDate)}`,
      cycleStartDate,
      cycleEndDate: expectedNextDate,
      todaySpendingPaise,
      formattedTodaySpending: formatPaiseToInr(todaySpendingPaise),
      todayVsAverageDiffPaise,
      isTodaySpendingHigher,
      currentWeekSpendingPaise,
      formattedCurrentWeekSpending: formatPaiseToInr(currentWeekSpendingPaise),
      previousWeekSpendingPaise,
      formattedPreviousWeekSpending: formatPaiseToInr(previousWeekSpendingPaise),
      weekOverWeekChangePercent,
      salaryAmountPaise,
      formattedSalaryAmount: formatPaiseToInr(salaryAmountPaise),
      cycleExpensesPaise,
      formattedCycleExpenses: formatPaiseToInr(cycleExpensesPaise),
      spentPercentage,
      spentSummaryMessage,
      topExpenseCategories,
      dailyAverageExpensePaise,
      formattedDailyAverageExpense: `Your average daily spending is ${formatPaiseToInr(
        dailyAverageExpensePaise
      )}.`,
      daysElapsed,
      daysRemaining,
      projectedRemainingBalancePaise,
      formattedProjectedRemainingBalance:
        projectedRemainingBalancePaise !== null
          ? formatPaiseToInr(projectedRemainingBalancePaise)
          : null,
      projectedRunoutDays,
      projectionMessage,
      savingsPercentage,
      savingsPaise,
      formattedSavings: formatPaiseToInr(savingsPaise),
      anomalies,
      warnings,
      suggestions,
      categoryComparisons,
    };
  }

  private static generateEmptyInsights(
    allTransactions: TransactionWithCategory[],
    currentDate: string
  ): SpendingInsightsData {
    const todayExpenses = allTransactions.filter(
      (tx) => tx.type === 'expense' && tx.transactionDate === currentDate
    );
    const todaySpendingPaise = todayExpenses.reduce((sum, tx) => sum + tx.amount, 0);

    return {
      hasActiveCycle: false,
      cycleName: 'No Active Salary Cycle',
      cycleStartDate: null,
      cycleEndDate: null,
      todaySpendingPaise,
      formattedTodaySpending: formatPaiseToInr(todaySpendingPaise),
      todayVsAverageDiffPaise: 0,
      isTodaySpendingHigher: false,
      currentWeekSpendingPaise: 0,
      formattedCurrentWeekSpending: formatPaiseToInr(0),
      previousWeekSpendingPaise: 0,
      formattedPreviousWeekSpending: formatPaiseToInr(0),
      weekOverWeekChangePercent: 0,
      salaryAmountPaise: 0,
      formattedSalaryAmount: formatPaiseToInr(0),
      cycleExpensesPaise: 0,
      formattedCycleExpenses: formatPaiseToInr(0),
      spentPercentage: 0,
      spentSummaryMessage: 'Record your salary receipt to generate cycle insights.',
      topExpenseCategories: [],
      dailyAverageExpensePaise: 0,
      formattedDailyAverageExpense: 'Your average daily spending is ₹0.00.',
      daysElapsed: 0,
      daysRemaining: null,
      projectedRemainingBalancePaise: null,
      formattedProjectedRemainingBalance: null,
      projectedRunoutDays: null,
      projectionMessage: 'Add an active salary cycle to project end-of-cycle balance.',
      savingsPercentage: 0,
      savingsPaise: 0,
      formattedSavings: formatPaiseToInr(0),
      anomalies: [],
      warnings: [],
      suggestions: [
        {
          id: 'sugg_open_cycle',
          category: 'budget',
          title: 'Start Tracking by Payday',
          recommendation:
            'Tap "New Salary Cycle" in the Salary tab to start tracking financial periods by your actual payday.',
        },
      ],
      categoryComparisons: [],
    };
  }
}
