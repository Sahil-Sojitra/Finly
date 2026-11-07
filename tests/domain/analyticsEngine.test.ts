import { AnalyticsEngine, AnalyticsFilter } from '@/domain/analyticsEngine';
import { SalaryCycleEngine } from '@/domain/salaryCycleEngine';
import { SalaryCycle, TransactionWithCategory } from '@/types';

describe('AnalyticsEngine — Financial Analytics & Dashboard Computations', () => {
  const mockCategories = {
    food: {
      id: 'cat-food',
      name: 'Food & Dining',
      type: 'expense' as const,
      icon: 'restaurant',
      color: '#EF4444',
      isDefault: true,
      createdAt: '2026-01-01T00:00:00Z',
    },
    transport: {
      id: 'cat-transport',
      name: 'Transportation',
      type: 'expense' as const,
      icon: 'car',
      color: '#3B82F6',
      isDefault: true,
      createdAt: '2026-01-01T00:00:00Z',
    },
    shopping: {
      id: 'cat-shopping',
      name: 'Shopping',
      type: 'expense' as const,
      icon: 'cart',
      color: '#F59E0B',
      isDefault: true,
      createdAt: '2026-01-01T00:00:00Z',
    },
    freelance: {
      id: 'cat-freelance',
      name: 'Freelance',
      type: 'income' as const,
      icon: 'cash',
      color: '#10B981',
      isDefault: true,
      createdAt: '2026-01-01T00:00:00Z',
    },
  };

  const sampleCycles: SalaryCycle[] = [
    {
      id: 'cycle-1',
      salaryAmount: 3000000, // ₹30,000.00
      receivedDate: '2026-11-05',
      expectedNextDate: '2026-12-13',
      openingBalance: 500000, // ₹5,000.00
      createdAt: '2026-11-05T00:00:00Z',
      updatedAt: '2026-11-05T00:00:00Z',
    },
    {
      id: 'cycle-2',
      salaryAmount: 3500000, // ₹35,000.00
      receivedDate: '2026-12-13',
      expectedNextDate: '2027-01-10',
      openingBalance: 0,
      createdAt: '2026-12-13T00:00:00Z',
      updatedAt: '2026-12-13T00:00:00Z',
    },
  ];

  const sampleTransactions: TransactionWithCategory[] = [
    // Cycle 1 transactions (2026-11-05 to 2026-12-12)
    {
      id: 'tx-1',
      cycleId: 'cycle-1',
      type: 'expense',
      amount: 150000, // ₹1,500.00
      description: 'Groceries',
      categoryId: mockCategories.food.id,
      transactionDate: '2026-11-06',
      inputMethod: 'manual',
      notes: null,
      createdAt: '2026-11-06T10:00:00Z',
      updatedAt: '2026-11-06T10:00:00Z',
      category: mockCategories.food,
    },
    {
      id: 'tx-2',
      cycleId: 'cycle-1',
      type: 'expense',
      amount: 50000, // ₹500.00
      description: 'Metro pass',
      categoryId: mockCategories.transport.id,
      transactionDate: '2026-11-10',
      inputMethod: 'manual',
      notes: null,
      createdAt: '2026-11-10T10:00:00Z',
      updatedAt: '2026-11-10T10:00:00Z',
      category: mockCategories.transport,
    },
    // Cycle 2 transactions (2026-12-13 to present)
    {
      id: 'tx-3',
      cycleId: 'cycle-2',
      type: 'income',
      amount: 400000, // ₹4,000.00
      description: 'Consulting gig',
      categoryId: mockCategories.freelance.id,
      transactionDate: '2026-12-15',
      inputMethod: 'manual',
      notes: null,
      createdAt: '2026-12-15T10:00:00Z',
      updatedAt: '2026-12-15T10:00:00Z',
      category: mockCategories.freelance,
    },
    {
      id: 'tx-4',
      cycleId: 'cycle-2',
      type: 'expense',
      amount: 300000, // ₹3,000.00
      description: 'Dinner with team',
      categoryId: mockCategories.food.id,
      transactionDate: '2026-12-16',
      inputMethod: 'manual',
      notes: null,
      createdAt: '2026-12-16T10:00:00Z',
      updatedAt: '2026-12-16T10:00:00Z',
      category: mockCategories.food,
    },
    {
      id: 'tx-5',
      cycleId: 'cycle-2',
      type: 'expense',
      amount: 700000, // ₹7,000.00
      description: 'New shoes',
      categoryId: mockCategories.shopping.id,
      transactionDate: '2026-12-20',
      inputMethod: 'manual',
      notes: null,
      createdAt: '2026-12-20T10:00:00Z',
      updatedAt: '2026-12-20T10:00:00Z',
      category: mockCategories.shopping,
    },
  ];

  it('1. Current Cycle Analytics with active cycle and carry-forward', () => {
    const evaluation = SalaryCycleEngine.evaluateAll(sampleCycles, sampleTransactions, '2026-12-25');
    const filter: AnalyticsFilter = { type: 'current_cycle' };

    const analytics = AnalyticsEngine.evaluateDashboardAnalytics({
      cycles: sampleCycles,
      transactions: sampleTransactions,
      evaluation,
      filter,
      currentDate: '2026-12-25',
    });

    const summary = analytics.summary;
    expect(summary.hasActiveCycle).toBe(true);
    expect(summary.filterType).toBe('current_cycle');
    expect(summary.startDate).toBe('2026-12-13');
    expect(summary.endDate).toBeNull();

    // Cycle 1 carry-forward = 5,000 (opening) + 30,000 (salary) - 2,000 (expenses) = 33,000 (₹33,000.00 = 3,300,000 paise)
    expect(summary.openingBalancePaise).toBe(3300000);
    expect(summary.salaryIncomePaise).toBe(3500000);
    expect(summary.additionalIncomePaise).toBe(400000); // consulting gig
    expect(summary.totalIncomePaise).toBe(3900000); // 35,000 + 4,000 = 39,000
    expect(summary.totalExpensesPaise).toBe(1000000); // 3,000 (food) + 7,000 (shopping) = 10,000 (1,000,000 paise)

    // Net savings = 39,000 - 10,000 = 29,000 (2,900,000 paise)
    expect(summary.netSavingsPaise).toBe(2900000);
    // Available balance = 33,000 (opening) + 39,000 (income) - 10,000 (expenses) = 62,000 (6,200,000 paise)
    expect(summary.availableBalancePaise).toBe(6200000);

    // Expense % = 10,000 / 39,000 = ~26%
    expect(summary.expensePercentage).toBe(26);
    // Savings % = 29,000 / 39,000 = ~74%
    expect(summary.savingsPercentage).toBe(74);

    // Days: 2026-12-13 to 2026-12-25 = 13 days
    expect(summary.daysElapsed).toBe(13);
    // Days remaining: 2026-12-25 to expected 2027-01-10 = 16 days
    expect(summary.daysRemaining).toBe(16);
    // Burn rate = 1,000,000 / 13 = 76,923 paise/day (~₹769.23/day)
    expect(summary.burnRatePaisePerDay).toBe(76923);
  });

  it('2. Empty State when no salary cycles exist', () => {
    const filter: AnalyticsFilter = { type: 'current_cycle' };
    const analytics = AnalyticsEngine.evaluateDashboardAnalytics({
      cycles: [],
      transactions: [],
      evaluation: null,
      filter,
      currentDate: '2026-12-25',
    });

    expect(analytics.summary.hasActiveCycle).toBe(false);
    expect(analytics.summary.totalIncomePaise).toBe(0);
    expect(analytics.summary.totalExpensesPaise).toBe(0);
    expect(analytics.summary.availableBalancePaise).toBe(0);
    expect(analytics.summary.expensePercentage).toBe(0);
    expect(analytics.summary.savingsPercentage).toBe(0);
    expect(analytics.categoryBreakdown).toEqual([]);
    expect(analytics.highestExpenseCategory).toBeNull();
    expect(analytics.cycleComparison.hasComparison).toBe(false);
  });

  it('3. Cycle with Zero Expenses handles division safely', () => {
    const evaluation = SalaryCycleEngine.evaluateAll(sampleCycles, [], '2026-12-25');
    const filter: AnalyticsFilter = { type: 'current_cycle' };

    const analytics = AnalyticsEngine.evaluateDashboardAnalytics({
      cycles: sampleCycles,
      transactions: [],
      evaluation,
      filter,
      currentDate: '2026-12-25',
    });

    expect(analytics.summary.totalExpensesPaise).toBe(0);
    expect(analytics.summary.expensePercentage).toBe(0);
    expect(analytics.summary.savingsPercentage).toBe(100);
    expect(analytics.summary.burnRatePaisePerDay).toBe(0);
    expect(analytics.highestExpenseCategory).toBeNull();
  });

  it('4. Previous Cycle Filter isolates historical period correctly', () => {
    const evaluation = SalaryCycleEngine.evaluateAll(sampleCycles, sampleTransactions, '2026-12-25');
    const filter: AnalyticsFilter = { type: 'previous_cycle' };

    const analytics = AnalyticsEngine.evaluateDashboardAnalytics({
      cycles: sampleCycles,
      transactions: sampleTransactions,
      evaluation,
      filter,
      currentDate: '2026-12-25',
    });

    const summary = analytics.summary;
    expect(summary.filterType).toBe('previous_cycle');
    expect(summary.startDate).toBe('2026-11-05');
    expect(summary.endDate).toBe('2026-12-12'); // Day before Cycle 2 received date

    expect(summary.salaryIncomePaise).toBe(3000000);
    expect(summary.openingBalancePaise).toBe(500000);
    expect(summary.totalExpensesPaise).toBe(200000); // 1,500 + 500 = 2,000 (200,000 paise)
    expect(summary.availableBalancePaise).toBe(3300000);
    expect(summary.transactionCount).toBe(2);
  });

  it('5. All-Time Filter aggregates entire history', () => {
    const evaluation = SalaryCycleEngine.evaluateAll(sampleCycles, sampleTransactions, '2026-12-25');
    const filter: AnalyticsFilter = { type: 'all_time' };

    const analytics = AnalyticsEngine.evaluateDashboardAnalytics({
      cycles: sampleCycles,
      transactions: sampleTransactions,
      evaluation,
      filter,
      currentDate: '2026-12-25',
    });

    const summary = analytics.summary;
    expect(summary.filterType).toBe('all_time');
    // Total salary = 30,000 + 35,000 = 65,000 (6,500,000 paise)
    expect(summary.salaryIncomePaise).toBe(6500000);
    expect(summary.additionalIncomePaise).toBe(400000);
    expect(summary.totalIncomePaise).toBe(6900000);
    // Total expenses = 2,000 (c1) + 10,000 (c2) = 12,000 (1,200,000 paise)
    expect(summary.totalExpensesPaise).toBe(1200000);
    expect(summary.availableBalancePaise).toBe(500000 + 6900000 - 1200000); // 62,000 (6,200,000 paise)
    expect(summary.transactionCount).toBe(5);
  });

  it('6. Custom Date Range Filter computes metrics strictly in range', () => {
    const evaluation = SalaryCycleEngine.evaluateAll(sampleCycles, sampleTransactions, '2026-12-25');
    const filter: AnalyticsFilter = {
      type: 'custom',
      customStartDate: '2026-12-14',
      customEndDate: '2026-12-18',
    };

    const analytics = AnalyticsEngine.evaluateDashboardAnalytics({
      cycles: sampleCycles,
      transactions: sampleTransactions,
      evaluation,
      filter,
      currentDate: '2026-12-25',
    });

    const summary = analytics.summary;
    expect(summary.filterType).toBe('custom');
    expect(summary.startDate).toBe('2026-12-14');
    expect(summary.endDate).toBe('2026-12-18');
    // Transactions in range: tx-3 (income 4,000), tx-4 (food 3,000)
    expect(summary.additionalIncomePaise).toBe(400000);
    expect(summary.totalExpensesPaise).toBe(300000);
    expect(summary.netSavingsPaise).toBe(100000);
    expect(summary.transactionCount).toBe(2);
  });

  it('7. Category Breakdown aggregates and sorts descending', () => {
    const evaluation = SalaryCycleEngine.evaluateAll(sampleCycles, sampleTransactions, '2026-12-25');
    const filter: AnalyticsFilter = { type: 'current_cycle' };

    const analytics = AnalyticsEngine.evaluateDashboardAnalytics({
      cycles: sampleCycles,
      transactions: sampleTransactions,
      evaluation,
      filter,
      currentDate: '2026-12-25',
    });

    const breakdown = analytics.categoryBreakdown;
    expect(breakdown.length).toBe(2);

    // Shopping was ₹7,000, Food was ₹3,000
    expect(breakdown[0]!.categoryName).toBe('Shopping');
    expect(breakdown[0]!.amountPaise).toBe(700000);
    expect(breakdown[0]!.percentageOfTotal).toBe(70);

    expect(breakdown[1]!.categoryName).toBe('Food & Dining');
    expect(breakdown[1]!.amountPaise).toBe(300000);
    expect(breakdown[1]!.percentageOfTotal).toBe(30);

    expect(analytics.highestExpenseCategory?.categoryName).toBe('Shopping');
  });

  it('8. Daily Spending aggregates accurately per calendar date', () => {
    const evaluation = SalaryCycleEngine.evaluateAll(sampleCycles, sampleTransactions, '2026-12-25');
    const filter: AnalyticsFilter = { type: 'current_cycle' };

    const analytics = AnalyticsEngine.evaluateDashboardAnalytics({
      cycles: sampleCycles,
      transactions: sampleTransactions,
      evaluation,
      filter,
      currentDate: '2026-12-25',
    });

    const daily = analytics.dailySpending;
    expect(daily.length).toBeGreaterThan(0);

    const spendOn16th = daily.find((d) => d.date === '2026-12-16');
    expect(spendOn16th).toBeDefined();
    expect(spendOn16th?.amountPaise).toBe(300000); // ₹3,000 dinner

    const spendOn20th = daily.find((d) => d.date === '2026-12-20');
    expect(spendOn20th).toBeDefined();
    expect(spendOn20th?.amountPaise).toBe(700000); // ₹7,000 shoes

    const todayPoint = daily.find((d) => d.date === '2026-12-25');
    expect(todayPoint?.isToday).toBe(true);
  });

  it('9. Weekly Spending groups chronologically', () => {
    const evaluation = SalaryCycleEngine.evaluateAll(sampleCycles, sampleTransactions, '2026-12-25');
    const filter: AnalyticsFilter = { type: 'current_cycle' };

    const analytics = AnalyticsEngine.evaluateDashboardAnalytics({
      cycles: sampleCycles,
      transactions: sampleTransactions,
      evaluation,
      filter,
      currentDate: '2026-12-25',
    });

    const weekly = analytics.weeklySpending;
    expect(weekly.length).toBe(2);
    // Week 1 (2026-12-13 to 2026-12-19): tx-4 is on 16th (300,000 paise)
    expect(weekly[0]!.weekIndex).toBe(1);
    expect(weekly[0]!.amountPaise).toBe(300000);

    // Week 2 (2026-12-20 to 2026-12-25): tx-5 is on 20th (700,000 paise)
    expect(weekly[1]!.weekIndex).toBe(2);
    expect(weekly[1]!.amountPaise).toBe(700000);
  });

  it('10. Cycle Comparison compares Active vs Previous cycle metrics', () => {
    const evaluation = SalaryCycleEngine.evaluateAll(sampleCycles, sampleTransactions, '2026-12-25');
    const filter: AnalyticsFilter = { type: 'current_cycle' };

    const analytics = AnalyticsEngine.evaluateDashboardAnalytics({
      cycles: sampleCycles,
      transactions: sampleTransactions,
      evaluation,
      filter,
      currentDate: '2026-12-25',
    });

    const comp = analytics.cycleComparison;
    expect(comp.hasComparison).toBe(true);
    expect(comp.activeCycleSpendPaise).toBe(1000000); // ₹10,000
    expect(comp.previousCycleSpendPaise).toBe(200000); // ₹2,000
    // Spend difference = 10,000 - 2,000 = +8,000 (+800,000 paise)
    expect(comp.spendDifferencePaise).toBe(800000);
    // Percentage change = ((10,000 - 2,000) / 2,000) * 100 = +400%
    expect(comp.spendPercentageChange).toBe(400);

    // Active savings: 29,000 (2,900,000), Prev savings: 28,000 (2,800,000)
    expect(comp.savingsDifferencePaise).toBe(100000);
  });

  it('11. Overspending scenario handles negative savings and boundary cap', () => {
    const heavySpendTx: TransactionWithCategory[] = [
      {
        id: 'tx-heavy',
        cycleId: 'cycle-2',
        type: 'expense',
        amount: 5000000, // ₹50,000.00 (exceeds total income of ₹39,000.00)
        description: 'Emergency expense',
        categoryId: mockCategories.shopping.id,
        transactionDate: '2026-12-18',
        inputMethod: 'manual',
        notes: null,
        createdAt: '2026-12-18T10:00:00Z',
        updatedAt: '2026-12-18T10:00:00Z',
        category: mockCategories.shopping,
      },
    ];

    const evaluation = SalaryCycleEngine.evaluateAll(sampleCycles, heavySpendTx, '2026-12-25');
    const analytics = AnalyticsEngine.evaluateDashboardAnalytics({
      cycles: sampleCycles,
      transactions: heavySpendTx,
      evaluation,
      filter: { type: 'current_cycle' },
      currentDate: '2026-12-25',
    });

    const summary = analytics.summary;
    expect(summary.totalIncomePaise).toBe(3500000);
    expect(summary.totalExpensesPaise).toBe(5000000);
    expect(summary.netSavingsPaise).toBe(-1500000); // -₹15,000.00 deficit
    expect(summary.expensePercentage).toBe(100); // capped at 100%
    expect(summary.savingsPercentage).toBe(-43); // negative savings rate
  });
});
