import { Paise, SalaryCycle, Transaction } from '@/types';
import { addDays, diffInDays, isDateWithinInterval } from './dateUtils';

export interface CycleBoundary {
  id: string;
  salaryAmount: Paise;
  receivedDate: string; // ISO8601 YYYY-MM-DD
  expectedNextDate: string | null;
  openingBalance: Paise;
  endDate: string | null; // ISO8601 YYYY-MM-DD (null if active)
  isActive: boolean;
  cycleIndex: number;
}

export interface CycleMetrics {
  cycleId: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  baseSalaryPaise: Paise;
  openingBalancePaise: Paise;
  additionalIncomePaise: Paise;
  totalIncomePaise: Paise; // baseSalary + additionalIncome
  expensesPaise: Paise;
  availableBalancePaise: Paise; // openingBalance + baseSalary + additionalIncome - expenses
  netSavingsPaise: Paise; // totalIncome - expenses
  transactionCount: number;
  daysTotal: number | null; // null if active
  daysElapsed: number;
}

export interface MultiCycleEvaluation {
  boundaries: CycleBoundary[];
  metricsByCycleId: Map<string, CycleMetrics>;
  metricsList: CycleMetrics[];
  unassignedTransactions: Transaction[];
  activeCycle: CycleBoundary | null;
}

export class SalaryCycleEngine {
  /**
   * Sorts cycles chronologically by received_date ascending
   */
  static sortCycles(cycles: SalaryCycle[]): SalaryCycle[] {
    return [...cycles].sort((a, b) => a.receivedDate.localeCompare(b.receivedDate));
  }

  /**
   * Derives cycle boundaries. The next actual salary receipt date defines
   * the previous cycle's end date: endDate = nextReceivedDate - 1 day.
   * Expected salary dates are strictly informational and never close a cycle.
   */
  static computeBoundaries(cycles: SalaryCycle[]): CycleBoundary[] {
    if (cycles.length === 0) {
      return [];
    }

    const sorted = this.sortCycles(cycles);
    const count = sorted.length;
    const boundaries: CycleBoundary[] = [];

    for (let i = 0; i < count; i++) {
      const current = sorted[i]!;
      const isLatest = i === count - 1;

      // Next actual salary date defines the previous cycle's end date
      let endDate: string | null = null;
      if (!isLatest) {
        const nextCycle = sorted[i + 1]!;
        endDate = addDays(nextCycle.receivedDate, -1);
      }

      boundaries.push({
        id: current.id,
        salaryAmount: current.salaryAmount,
        receivedDate: current.receivedDate,
        expectedNextDate: current.expectedNextDate,
        openingBalance: current.openingBalance,
        endDate,
        isActive: isLatest,
        cycleIndex: i + 1,
      });
    }

    return boundaries;
  }

  /**
   * Assigns a transaction to a salary cycle based on actual transaction date.
   * Returns null if transaction predates the first known salary cycle.
   */
  static assignTransaction(
    transactionDate: string,
    boundaries: CycleBoundary[]
  ): string | null {
    if (boundaries.length === 0) {
      return null;
    }

    // Transactions before the first salary are explicitly unassigned
    const firstCycle = boundaries[0]!;
    if (transactionDate < firstCycle.receivedDate) {
      return null;
    }

    // Match cycle whose interval covers transactionDate
    for (const b of boundaries) {
      if (isDateWithinInterval(transactionDate, b.receivedDate, b.endDate)) {
        return b.id;
      }
    }

    // If transaction date is beyond the active cycle's start date
    const latest = boundaries[boundaries.length - 1]!;
    if (transactionDate >= latest.receivedDate) {
      return latest.id;
    }

    return null;
  }

  /**
   * Evaluates all salary cycles sequentially, computing carry-forward balances
   * without double counting and partitioning transactions accurately.
   */
  static evaluateAll(
    rawCycles: SalaryCycle[],
    allTransactions: Transaction[],
    currentDate?: string
  ): MultiCycleEvaluation {
    const today = currentDate ?? new Date().toISOString().slice(0, 10);
    const sorted = this.sortCycles(rawCycles);
    const boundaries = this.computeBoundaries(sorted);

    // Group transactions by assigned cycle
    const transactionsByCycle = new Map<string, Transaction[]>();
    const unassignedTransactions: Transaction[] = [];

    for (const b of boundaries) {
      transactionsByCycle.set(b.id, []);
    }

    for (const tx of allTransactions) {
      const assignedCycleId = this.assignTransaction(tx.transactionDate, boundaries);
      if (assignedCycleId && transactionsByCycle.has(assignedCycleId)) {
        transactionsByCycle.get(assignedCycleId)!.push(tx);
      } else {
        unassignedTransactions.push(tx);
      }
    }

    // Calculate metrics with sequential carry-forward chaining
    const metricsByCycleId = new Map<string, CycleMetrics>();
    const metricsList: CycleMetrics[] = [];
    let carryForwardBalance: Paise = 0;

    for (let i = 0; i < boundaries.length; i++) {
      const b = boundaries[i]!;
      const isFirstCycle = i === 0;

      // Cycle 1 uses entered openingBalance. Subsequent cycles inherit carry-forward
      const effectiveOpeningBalance: Paise = isFirstCycle
        ? b.openingBalance
        : carryForwardBalance;

      // Update boundary with effective opening balance
      b.openingBalance = effectiveOpeningBalance;

      const txs = transactionsByCycle.get(b.id) ?? [];
      let additionalIncome: Paise = 0;
      let expenses: Paise = 0;

      for (const tx of txs) {
        if (tx.type === 'income') {
          additionalIncome += tx.amount;
        } else if (tx.type === 'expense') {
          expenses += tx.amount;
        }
      }

      const totalIncome = b.salaryAmount + additionalIncome;
      // Formula: Available = Opening Balance + Salary Received + Additional Income - Expenses
      const availableBalance = effectiveOpeningBalance + totalIncome - expenses;
      const netSavings = totalIncome - expenses;

      // Carry forward the entire remaining available balance to next cycle
      carryForwardBalance = availableBalance;

      // Calculate days
      let daysTotal: number | null = null;
      let daysElapsed = 0;

      if (b.endDate !== null) {
        daysTotal = Math.max(1, diffInDays(b.receivedDate, b.endDate) + 1);
        daysElapsed = daysTotal;
      } else {
        // Active cycle: elapsed up to today
        const elapsed = diffInDays(b.receivedDate, today) + 1;
        daysElapsed = Math.max(1, elapsed);
      }

      const metrics: CycleMetrics = {
        cycleId: b.id,
        startDate: b.receivedDate,
        endDate: b.endDate,
        isActive: b.isActive,
        baseSalaryPaise: b.salaryAmount,
        openingBalancePaise: effectiveOpeningBalance,
        additionalIncomePaise: additionalIncome,
        totalIncomePaise: totalIncome,
        expensesPaise: expenses,
        availableBalancePaise: availableBalance,
        netSavingsPaise: netSavings,
        transactionCount: txs.length,
        daysTotal,
        daysElapsed,
      };

      metricsByCycleId.set(b.id, metrics);
      metricsList.push(metrics);
    }

    const activeCycle = boundaries.find((b) => b.isActive) ?? null;

    return {
      boundaries,
      metricsByCycleId,
      metricsList,
      unassignedTransactions,
      activeCycle,
    };
  }
}

