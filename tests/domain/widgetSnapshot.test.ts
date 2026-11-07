import { WidgetSnapshotSerializer } from '@/domain/widgetSnapshot';
import { SalaryCycleEngine } from '@/domain/salaryCycleEngine';
import { SalaryCycle, TransactionWithCategory } from '@/types';

describe('WidgetSnapshotSerializer — Native Home Screen Widget Snapshot Engine', () => {
  const sampleCycles: SalaryCycle[] = [
    {
      id: 'cycle-1',
      salaryAmount: 3000000, // ₹30,000.00
      receivedDate: '2026-11-05',
      expectedNextDate: '2026-12-13',
      openingBalance: 0,
      createdAt: '2026-11-05T00:00:00Z',
      updatedAt: '2026-11-05T00:00:00Z',
    },
  ];

  const sampleTransactions: TransactionWithCategory[] = [
    {
      id: 'tx-1',
      cycleId: 'cycle-1',
      type: 'expense',
      amount: 450000, // ₹4,500.00
      description: 'Groceries and food',
      categoryId: 'cat-groceries-001',
      transactionDate: '2026-11-10',
      inputMethod: 'manual',
      notes: null,
      createdAt: '2026-11-10T10:00:00Z',
      updatedAt: '2026-11-10T10:00:00Z',
      category: {
        id: 'cat-groceries-001',
        name: 'Groceries',
        type: 'expense',
        icon: 'shopping-cart',
        color: '#10B981',
        isDefault: true,
        createdAt: '2026-01-01T00:00:00Z',
      },
    },
  ];

  it('1. Generates complete snapshot with active cycle and integer paise balances', () => {
    const evaluation = SalaryCycleEngine.evaluateAll(sampleCycles, sampleTransactions, '2026-11-15');
    const snapshot = WidgetSnapshotSerializer.createSnapshot({
      cycles: sampleCycles,
      transactions: sampleTransactions,
      evaluation,
      currentDate: '2026-11-15',
      nowIso: '2026-11-15T10:30:00.000Z',
    });

    expect(snapshot.appTitle).toBe('Finly');
    expect(snapshot.hasActiveCycle).toBe(true);
    expect(snapshot.cyclePeriodLabel).toBe('5 Nov 2026 – Present');
    expect(snapshot.availableBalancePaise).toBe(2550000); // 30,000 - 4,500 = 25,500
    expect(snapshot.availableBalanceFormatted).toBe('₹25,500.00');
    expect(snapshot.salaryReceivedPaise).toBe(3000000);
    expect(snapshot.salaryReceivedFormatted).toBe('₹30,000.00');
    expect(snapshot.totalExpensesPaise).toBe(450000);
    expect(snapshot.totalExpensesFormatted).toBe('₹4,500.00');
    expect(snapshot.spendingPercentage).toBe(15); // 4,500 / 30,000 = 15%
    expect(snapshot.isDeficit).toBe(false);
    expect(snapshot.daysElapsed).toBe(11); // 5 Nov to 15 Nov = 11 days
    expect(snapshot.daysRemaining).toBe(28); // 15 Nov to 13 Dec = 28 days
    expect(snapshot.lastUpdatedFormatted).toBe('Updated 10:30');
    expect(snapshot.deepLinkUrl).toBe('finly://');
  });

  it('2. Fallback snapshot when no cycles exist', () => {
    const snapshot = WidgetSnapshotSerializer.createSnapshot({
      cycles: [],
      transactions: [],
      evaluation: null,
      nowIso: '2026-11-15T12:00:00.000Z',
    });

    expect(snapshot.hasActiveCycle).toBe(false);
    expect(snapshot.cyclePeriodLabel).toBe('No Active Salary Cycle');
    expect(snapshot.availableBalancePaise).toBe(0);
    expect(snapshot.availableBalanceFormatted).toBe('₹0.00');
    expect(snapshot.spendingPercentage).toBe(0);
    expect(snapshot.isDeficit).toBe(false);
  });

  it('3. Overspending deficit handling', () => {
    const heavySpend: TransactionWithCategory[] = [
      {
        id: 'tx-heavy',
        cycleId: 'cycle-1',
        type: 'expense',
        amount: 3500000, // ₹35,000.00 (exceeds ₹30,000.00 salary)
        description: 'Big appliance',
        categoryId: 'cat-shopping-006',
        transactionDate: '2026-11-12',
        inputMethod: 'manual',
        notes: null,
        createdAt: '2026-11-12T10:00:00Z',
        updatedAt: '2026-11-12T10:00:00Z',
        category: sampleTransactions[0]!.category,
      },
    ];

    const evaluation = SalaryCycleEngine.evaluateAll(sampleCycles, heavySpend, '2026-11-15');
    const snapshot = WidgetSnapshotSerializer.createSnapshot({
      cycles: sampleCycles,
      transactions: heavySpend,
      evaluation,
      currentDate: '2026-11-15',
    });

    expect(snapshot.availableBalancePaise).toBe(-500000); // -₹5,000.00
    expect(snapshot.availableBalanceFormatted).toBe('-₹5,000.00');
    expect(snapshot.isDeficit).toBe(true);
    expect(snapshot.spendingPercentage).toBe(100);
  });

  it('4. Staleness detection evaluates correctly', () => {
    const freshSnapshot = WidgetSnapshotSerializer.createFallbackSnapshot(
      '2026-11-15T10:00:00.000Z'
    );
    expect(
      WidgetSnapshotSerializer.isStale(freshSnapshot, 24, '2026-11-15T18:00:00.000Z')
    ).toBe(false); // 8 hours old

    const staleSnapshot = WidgetSnapshotSerializer.createFallbackSnapshot(
      '2026-11-13T10:00:00.000Z'
    );
    expect(
      WidgetSnapshotSerializer.isStale(staleSnapshot, 24, '2026-11-15T12:00:00.000Z')
    ).toBe(true); // 50 hours old
  });
});
