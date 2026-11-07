import { Paise, SalaryCycle, TransactionWithCategory } from '@/types';
import { MultiCycleEvaluation } from './salaryCycleEngine';
import { formatDisplayDate, diffInDays } from './dateUtils';
import { formatPaiseToInr } from '@/utils';

export interface WidgetSnapshotData {
  appTitle: 'Finly';
  hasActiveCycle: boolean;
  cyclePeriodLabel: string;
  availableBalancePaise: Paise;
  availableBalanceFormatted: string;
  salaryReceivedPaise: Paise;
  salaryReceivedFormatted: string;
  totalExpensesPaise: Paise;
  totalExpensesFormatted: string;
  spendingPercentage: number; // 0 to 100
  isDeficit: boolean;
  daysElapsed: number;
  daysRemaining: number | null;
  lastUpdatedIso: string;
  lastUpdatedFormatted: string;
  deepLinkUrl: string;
}

export class WidgetSnapshotSerializer {
  /**
   * Creates a deterministic, serializable snapshot of the active cycle and financial KPIs
   * for consumption by isolated native home screen widgets.
   */
  static createSnapshot(params: {
    cycles: SalaryCycle[];
    transactions: TransactionWithCategory[];
    evaluation: MultiCycleEvaluation | null;
    currentDate?: string;
    nowIso?: string;
  }): WidgetSnapshotData {
    const { evaluation } = params;
    const today = params.currentDate ?? new Date().toISOString().slice(0, 10);
    const nowIso = params.nowIso ?? new Date().toISOString();

    // Format last updated time: e.g. "15:45"
    const timeStr = nowIso.slice(11, 16);
    const lastUpdatedFormatted = `Updated ${timeStr}`;

    const activeBoundary = evaluation?.boundaries?.find((b) => b.isActive) ?? null;

    if (!activeBoundary || !evaluation) {
      return this.createFallbackSnapshot(nowIso, lastUpdatedFormatted);
    }

    const metrics = evaluation.metricsByCycleId.get(activeBoundary.id);
    const startDate = activeBoundary.receivedDate;
    const endDate = activeBoundary.endDate;

    const baseSalary = metrics ? metrics.baseSalaryPaise : activeBoundary.salaryAmount;
    const totalIncome = metrics ? metrics.totalIncomePaise : baseSalary;
    const totalExpenses = metrics ? metrics.expensesPaise : 0;
    const availableBalance = metrics ? metrics.availableBalancePaise : activeBoundary.openingBalance + totalIncome - totalExpenses;

    const spendingPercentage = totalIncome > 0
      ? Math.min(100, Math.round((totalExpenses / totalIncome) * 100))
      : 0;

    let daysRemaining: number | null = null;
    if (activeBoundary.expectedNextDate) {
      const diff = diffInDays(today, activeBoundary.expectedNextDate);
      daysRemaining = Math.max(0, diff);
    }

    const daysElapsed = metrics?.daysElapsed ?? Math.max(1, diffInDays(startDate, today) + 1);

    const periodLabel = endDate
      ? `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`
      : `${formatDisplayDate(startDate)} – Present`;

    return {
      appTitle: 'Finly',
      hasActiveCycle: true,
      cyclePeriodLabel: periodLabel,
      availableBalancePaise: availableBalance,
      availableBalanceFormatted: formatPaiseToInr(availableBalance),
      salaryReceivedPaise: baseSalary,
      salaryReceivedFormatted: formatPaiseToInr(baseSalary),
      totalExpensesPaise: totalExpenses,
      totalExpensesFormatted: formatPaiseToInr(totalExpenses),
      spendingPercentage,
      isDeficit: availableBalance < 0,
      daysElapsed,
      daysRemaining,
      lastUpdatedIso: nowIso,
      lastUpdatedFormatted,
      deepLinkUrl: 'finly://',
    };
  }

  /**
   * Safe fallback snapshot when no salary cycles exist in database
   */
  static createFallbackSnapshot(
    nowIso = new Date().toISOString(),
    lastUpdatedFormatted = 'Updated just now'
  ): WidgetSnapshotData {
    return {
      appTitle: 'Finly',
      hasActiveCycle: false,
      cyclePeriodLabel: 'No Active Salary Cycle',
      availableBalancePaise: 0,
      availableBalanceFormatted: '₹0.00',
      salaryReceivedPaise: 0,
      salaryReceivedFormatted: '₹0.00',
      totalExpensesPaise: 0,
      totalExpensesFormatted: '₹0.00',
      spendingPercentage: 0,
      isDeficit: false,
      daysElapsed: 0,
      daysRemaining: null,
      lastUpdatedIso: nowIso,
      lastUpdatedFormatted,
      deepLinkUrl: 'finly://',
    };
  }

  /**
   * Checks if snapshot data is older than maxAgeHours (default 24 hours).
   */
  static isStale(snapshot: WidgetSnapshotData, maxAgeHours = 24, currentIso?: string): boolean {
    const snapshotTime = Date.parse(snapshot.lastUpdatedIso);
    if (isNaN(snapshotTime)) return true;

    const currentTime = currentIso ? Date.parse(currentIso) : Date.now();
    const ageMs = currentTime - snapshotTime;
    return ageMs > maxAgeHours * 60 * 60 * 1000;
  }
}
