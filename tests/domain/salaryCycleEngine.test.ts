import { SalaryCycleEngine } from '@/domain/salaryCycleEngine';
import { SalaryCycle, Transaction } from '@/types';

describe('SalaryCycleEngine — Variable Salary Cycle Domain Service', () => {
  // Helpers to create test entities
  const makeCycle = (
    id: string,
    receivedDate: string,
    salaryAmount: number,
    openingBalance = 0,
    expectedNextDate: string | null = null
  ): SalaryCycle => ({
    id,
    salaryAmount,
    receivedDate,
    expectedNextDate,
    openingBalance,
    createdAt: `${receivedDate}T00:00:00.000Z`,
    updatedAt: `${receivedDate}T00:00:00.000Z`,
  });

  const makeTx = (
    id: string,
    transactionDate: string,
    amount: number,
    type: 'expense' | 'income' = 'expense',
    categoryId = 'cat-test'
  ): Transaction => ({
    id,
    cycleId: null,
    type,
    amount,
    description: `Test ${type} ${id}`,
    categoryId,
    transactionDate,
    inputMethod: 'manual',
    notes: null,
    createdAt: `${transactionDate}T12:00:00.000Z`,
    updatedAt: `${transactionDate}T12:00:00.000Z`,
  });

  describe('1. Variable Salary Dates & Dynamic Cycle Closures', () => {
    it('sets previous cycle end date to the day before next actual salary', () => {
      // Cycle 1: 5 Nov 2026, ₹30,000
      // Cycle 2: 13 Dec 2026, ₹32,000
      // Cycle 3: 8 Jan 2027, ₹35,000
      const cycles: SalaryCycle[] = [
        makeCycle('c1', '2026-11-05', 3000000),
        makeCycle('c2', '2026-12-13', 3200000),
        makeCycle('c3', '2027-01-08', 3500000),
      ];

      const boundaries = SalaryCycleEngine.computeBoundaries(cycles);

      expect(boundaries).toHaveLength(3);

      // Cycle 1: 5 Nov to 12 Dec
      expect(boundaries[0]?.receivedDate).toBe('2026-11-05');
      expect(boundaries[0]?.endDate).toBe('2026-12-12');
      expect(boundaries[0]?.isActive).toBe(false);

      // Cycle 2: 13 Dec to 7 Jan
      expect(boundaries[1]?.receivedDate).toBe('2026-12-13');
      expect(boundaries[1]?.endDate).toBe('2027-01-07');
      expect(boundaries[1]?.isActive).toBe(false);

      // Cycle 3: 8 Jan to active (null)
      expect(boundaries[2]?.receivedDate).toBe('2027-01-08');
      expect(boundaries[2]?.endDate).toBeNull();
      expect(boundaries[2]?.isActive).toBe(true);
    });

    it('never uses expected next date to automatically close a cycle', () => {
      const singleCycleWithExpected: SalaryCycle[] = [
        makeCycle('c1', '2026-11-05', 3000000, 0, '2026-11-30'),
      ];

      const boundaries = SalaryCycleEngine.computeBoundaries(singleCycleWithExpected);

      expect(boundaries).toHaveLength(1);
      // Expected date 30 Nov must NOT close the cycle
      expect(boundaries[0]?.endDate).toBeNull();
      expect(boundaries[0]?.isActive).toBe(true);
      expect(boundaries[0]?.expectedNextDate).toBe('2026-11-30');
    });
  });

  describe('2. Variable Salary Amounts & Available Balance Formula', () => {
    it('calculates available balance = opening + salary + income - expenses', () => {
      const cycles = [makeCycle('c1', '2026-11-05', 3000000, 500000)]; // ₹5,000 opening + ₹30,000 salary
      const transactions = [
        makeTx('tx1', '2026-11-06', 400000, 'expense'), // ₹4,000 expense
        makeTx('tx2', '2026-11-10', 200000, 'income'), // ₹2,000 additional income
      ];

      const evaluation = SalaryCycleEngine.evaluateAll(cycles, transactions, '2026-11-20');
      const metrics = evaluation.metricsByCycleId.get('c1');

      expect(metrics).toBeDefined();
      expect(metrics?.openingBalancePaise).toBe(500000); // ₹5,000
      expect(metrics?.baseSalaryPaise).toBe(3000000); // ₹30,000
      expect(metrics?.additionalIncomePaise).toBe(200000); // ₹2,000
      expect(metrics?.expensesPaise).toBe(400000); // ₹4,000
      // Available = 5,000 + 30,000 + 2,000 - 4,000 = ₹33,000 (3,300,000 paise)
      expect(metrics?.availableBalancePaise).toBe(3300000);
    });
  });

  describe('3. Backdated Salary Insertion & Auto Re-sorting', () => {
    it('re-sorts chronologically and re-links boundaries when a backdated cycle is added', () => {
      // User initially recorded Dec cycle
      const decCycle = makeCycle('c-dec', '2026-12-13', 3200000);
      // Later adds backdated Nov cycle
      const novCycle = makeCycle('c-nov', '2026-11-05', 3000000);

      const boundaries = SalaryCycleEngine.computeBoundaries([decCycle, novCycle]);

      expect(boundaries[0]?.id).toBe('c-nov');
      expect(boundaries[0]?.endDate).toBe('2026-12-12');
      expect(boundaries[1]?.id).toBe('c-dec');
      expect(boundaries[1]?.endDate).toBeNull();
    });
  });

  describe('4. Transactions Crossing Calendar Month Boundaries', () => {
    it('assigns transactions from late Nov and early Dec to the same salary cycle', () => {
      const cycles = [
        makeCycle('c1', '2026-11-05', 3000000),
        makeCycle('c2', '2026-12-13', 3200000),
      ];

      const txNov28 = makeTx('tx-nov', '2026-11-28', 150000);
      const txDec02 = makeTx('tx-dec02', '2026-12-02', 250000);
      const txDec12 = makeTx('tx-dec12', '2026-12-12', 100000); // Day before next salary
      const txDec13 = makeTx('tx-dec13', '2026-12-13', 50000); // Day of next salary

      const boundaries = SalaryCycleEngine.computeBoundaries(cycles);

      expect(SalaryCycleEngine.assignTransaction(txNov28.transactionDate, boundaries)).toBe('c1');
      expect(SalaryCycleEngine.assignTransaction(txDec02.transactionDate, boundaries)).toBe('c1');
      expect(SalaryCycleEngine.assignTransaction(txDec12.transactionDate, boundaries)).toBe('c1');
      expect(SalaryCycleEngine.assignTransaction(txDec13.transactionDate, boundaries)).toBe('c2');
    });
  });

  describe('5. Transactions Entered Late (Backdated Expenses)', () => {
    it('retroactively recalculates historical cycle and adjusts subsequent carry-forward', () => {
      const cycles = [
        makeCycle('c1', '2026-11-05', 3000000), // ₹30,000
        makeCycle('c2', '2026-12-13', 3200000), // ₹32,000
      ];

      // Initial state: Cycle 1 had ₹10,000 spent -> ₹20,000 carried forward
      const txInitial = [
        makeTx('tx1', '2026-11-10', 1000000), // ₹10,000
      ];

      const evalBefore = SalaryCycleEngine.evaluateAll(cycles, txInitial);
      expect(evalBefore.metricsByCycleId.get('c1')?.availableBalancePaise).toBe(2000000);
      expect(evalBefore.metricsByCycleId.get('c2')?.openingBalancePaise).toBe(2000000);

      // Now user enters a late expense for Cycle 1: ₹5,000 spent on 15 Nov
      const txWithLate = [
        ...txInitial,
        makeTx('tx-late', '2026-11-15', 500000), // ₹5,000
      ];

      const evalAfter = SalaryCycleEngine.evaluateAll(cycles, txWithLate);
      // Cycle 1 balance is now ₹15,000 (1,500,000 paise)
      expect(evalAfter.metricsByCycleId.get('c1')?.availableBalancePaise).toBe(1500000);
      // Cycle 2 opening balance automatically adjusted to ₹15,000
      expect(evalAfter.metricsByCycleId.get('c2')?.openingBalancePaise).toBe(1500000);
      // Cycle 2 available = 15,000 + 32,000 = ₹47,000 (4,700,000 paise)
      expect(evalAfter.metricsByCycleId.get('c2')?.availableBalancePaise).toBe(4700000);
    });
  });

  describe('6. Carry-Forward Savings (No Double Counting)', () => {
    it('chains unspent balances forward through multiple cycles without double-counting', () => {
      const cycles = [
        makeCycle('c1', '2026-10-05', 3000000), // ₹30,000
        makeCycle('c2', '2026-11-05', 3000000), // ₹30,000
        makeCycle('c3', '2026-12-05', 3500000), // ₹35,000
      ];

      const txs = [
        // Cycle 1: Spent ₹20,000 -> Remaining ₹10,000
        makeTx('t1', '2026-10-15', 2000000),
        // Cycle 2: Spent ₹25,000 -> (Opening 10,000 + Salary 30,000 - Spent 25,000) = Remaining ₹15,000
        makeTx('t2', '2026-11-15', 2500000),
        // Cycle 3: Spent ₹10,000 -> (Opening 15,000 + Salary 35,000 - Spent 10,000) = Remaining ₹40,000
        makeTx('t3', '2026-12-15', 1000000),
      ];

      const result = SalaryCycleEngine.evaluateAll(cycles, txs);

      const m1 = result.metricsByCycleId.get('c1');
      const m2 = result.metricsByCycleId.get('c2');
      const m3 = result.metricsByCycleId.get('c3');

      expect(m1?.availableBalancePaise).toBe(1000000); // ₹10,000
      expect(m2?.openingBalancePaise).toBe(1000000); // Inherited ₹10,000
      expect(m2?.availableBalancePaise).toBe(1500000); // ₹15,000
      expect(m3?.openingBalancePaise).toBe(1500000); // Inherited ₹15,000
      expect(m3?.availableBalancePaise).toBe(4000000); // ₹40,000
    });
  });

  describe('7. Editing Previous Salary Records', () => {
    it('updates cycle calculations when salary amount is edited', () => {
      const cycleBefore = makeCycle('c1', '2026-11-05', 3000000);
      const eval1 = SalaryCycleEngine.evaluateAll([cycleBefore], []);
      expect(eval1.metricsByCycleId.get('c1')?.availableBalancePaise).toBe(3000000);

      // User got a bonus adjustment: salary edited to ₹35,000
      const cycleAfter = makeCycle('c1', '2026-11-05', 3500000);
      const eval2 = SalaryCycleEngine.evaluateAll([cycleAfter], []);
      expect(eval2.metricsByCycleId.get('c1')?.availableBalancePaise).toBe(3500000);
    });
  });

  describe('8. Safe Deletion of a Salary Record', () => {
    it('seamlessly merges intervals and retains all transactions when intermediate cycle is deleted', () => {
      // Cycles initially had c1 (Nov 5), c2 (Dec 5), c3 (Jan 5).
      // Now user deletes c2 (Dec 5) so only c1 and c3 remain.
      const c1 = makeCycle('c1', '2026-11-05', 3000000);
      const c3 = makeCycle('c3', '2027-01-05', 3000000);

      const txNov = makeTx('tx-nov', '2026-11-20', 500000);
      const txDec = makeTx('tx-dec', '2026-12-20', 500000);

      // Now suppose user deletes c2 (Dec 5).
      // Only c1 (Nov 5) and c3 (Jan 5) remain.
      const remainingCycles = [c1, c3];
      const result = SalaryCycleEngine.evaluateAll(remainingCycles, [txNov, txDec]);

      // c1 boundary now stretches from Nov 5 to Jan 4!
      const m1 = result.metricsByCycleId.get('c1');
      expect(m1?.endDate).toBe('2027-01-04');
      // Both Nov and Dec transactions are now assigned to c1 without losing any data!
      expect(m1?.transactionCount).toBe(2);
      expect(m1?.expensesPaise).toBe(1000000);
      expect(result.unassignedTransactions).toHaveLength(0);
    });
  });

  describe('9. Unassigned Transactions (Predating All Cycles)', () => {
    it('explicitly categorizes transactions occurring before the first salary as unassigned', () => {
      const cycles = [makeCycle('c1', '2026-11-05', 3000000)];
      const txBeforeFirstSalary = makeTx('tx-prior', '2026-11-01', 50000); // 1 Nov

      const result = SalaryCycleEngine.evaluateAll(cycles, [txBeforeFirstSalary]);

      expect(result.unassignedTransactions).toHaveLength(1);
      expect(result.unassignedTransactions[0]?.id).toBe('tx-prior');
      expect(result.metricsByCycleId.get('c1')?.transactionCount).toBe(0);
    });
  });
});
