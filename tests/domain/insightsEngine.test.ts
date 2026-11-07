import { InsightsEngine } from '@/domain/insights/insightsEngine';
import { SalaryCycle, TransactionWithCategory } from '@/types';

describe('InsightsEngine — Deterministic Financial Intelligence Suite', () => {
  const mockActiveCycle: SalaryCycle = {
    id: 'cycle-nov-2026',
    salaryAmount: 5000000, // ₹50,000.00
    receivedDate: '2026-11-01',
    expectedNextDate: '2026-12-01', // 30-day cycle
    openingBalance: 0,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  };

  const mockPreviousCycle: SalaryCycle = {
    id: 'cycle-oct-2026',
    salaryAmount: 4800000,
    receivedDate: '2026-10-01',
    expectedNextDate: '2026-11-01',
    openingBalance: 0,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  };

  const mockTransactions: TransactionWithCategory[] = [
    // Previous cycle: Food spend = ₹3,000 (300000 paise)
    {
      id: 'tx-prev-1',
      cycleId: 'cycle-oct-2026',
      type: 'expense',
      amount: 300000,
      description: 'Oct Dining',
      categoryId: 'cat-dining-002',
      transactionDate: '2026-10-15',
      inputMethod: 'manual',
      notes: null,
      createdAt: '2026-10-15T00:00:00.000Z',
      updatedAt: '2026-10-15T00:00:00.000Z',
      category: {
        id: 'cat-dining-002',
        name: 'Food & Dining',
        type: 'expense',
        icon: 'restaurant',
        color: '#F59E0B',
        isDefault: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    },
    // Current cycle transactions (Simulate currentDate = '2026-11-10', 10 days elapsed)
    // Total spent so far = ₹30,000 (3000000 paise) -> exactly 60% of ₹50,000 salary!
    // Food spend = ₹5,000 (500000 paise) -> 66% higher than previous cycle!
    {
      id: 'tx-curr-food',
      cycleId: 'cycle-nov-2026',
      type: 'expense',
      amount: 500000, // ₹5,000.00
      description: 'Restaurant party',
      categoryId: 'cat-dining-002',
      transactionDate: '2026-11-05',
      inputMethod: 'manual',
      notes: null,
      createdAt: '2026-11-05T00:00:00.000Z',
      updatedAt: '2026-11-05T00:00:00.000Z',
      category: {
        id: 'cat-dining-002',
        name: 'Food & Dining',
        type: 'expense',
        icon: 'restaurant',
        color: '#F59E0B',
        isDefault: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    },
    // Large single expense spike = ₹20,000 (2000000 paise)
    {
      id: 'tx-curr-rent',
      cycleId: 'cycle-nov-2026',
      type: 'expense',
      amount: 2000000, // ₹20,000.00
      description: 'Apartment Rent Nov',
      categoryId: 'cat-housing-003',
      transactionDate: '2026-11-02',
      inputMethod: 'manual',
      notes: null,
      createdAt: '2026-11-02T00:00:00.000Z',
      updatedAt: '2026-11-02T00:00:00.000Z',
      category: {
        id: 'cat-housing-003',
        name: 'Housing & Rent',
        type: 'expense',
        icon: 'home',
        color: '#6366F1',
        isDefault: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    },
    // Today's expense ('2026-11-10') = ₹5,000 (500000 paise)
    {
      id: 'tx-curr-groceries-today',
      cycleId: 'cycle-nov-2026',
      type: 'expense',
      amount: 500000, // ₹5,000.00
      description: 'Weekly Supermarket',
      categoryId: 'cat-groceries-001',
      transactionDate: '2026-11-10',
      inputMethod: 'manual',
      notes: null,
      createdAt: '2026-11-10T00:00:00.000Z',
      updatedAt: '2026-11-10T00:00:00.000Z',
      category: {
        id: 'cat-groceries-001',
        name: 'Groceries',
        type: 'expense',
        icon: 'shopping-cart',
        color: '#10B981',
        isDefault: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    },
  ];

  it('calculates salary-cycle spending summary and spent percentage', () => {
    const insights = InsightsEngine.generateInsights(
      mockActiveCycle,
      mockPreviousCycle,
      mockTransactions,
      '2026-11-10'
    );

    expect(insights.hasActiveCycle).toBe(true);
    expect(insights.salaryAmountPaise).toBe(5000000); // ₹50,000
    expect(insights.cycleExpensesPaise).toBe(3000000); // ₹30,000
    expect(insights.spentPercentage).toBe(60); // 60%
    expect(insights.spentSummaryMessage).toBe('You have spent 60% of your salary.');
  });

  it('calculates average daily expense accurately across elapsed days', () => {
    const insights = InsightsEngine.generateInsights(
      mockActiveCycle,
      mockPreviousCycle,
      mockTransactions,
      '2026-11-10'
    );

    // From 2026-11-01 to 2026-11-10 = 10 days elapsed
    expect(insights.daysElapsed).toBe(10);
    // ₹30,000 / 10 days = ₹3,000 / day (300000 paise)
    expect(insights.dailyAverageExpensePaise).toBe(300000);
    expect(insights.formattedDailyAverageExpense).toBe('Your average daily spending is ₹3,000.00.');
  });

  it('projects remaining balance at current burn rate until expected payday', () => {
    const insights = InsightsEngine.generateInsights(
      mockActiveCycle,
      mockPreviousCycle,
      mockTransactions,
      '2026-11-10'
    );

    // Expected payday = 2026-12-01 -> 21 days remaining
    expect(insights.daysRemaining).toBe(21);
    // Available balance = ₹50,000 - ₹30,000 = ₹20,000 (2000000 paise)
    // Projected burn = 21 days * ₹3,000/day = ₹63,000 (6300000 paise)
    // Projected balance = ₹20,000 - ₹63,000 = -₹43,000 (deficit)
    expect(insights.projectedRemainingBalancePaise).toBe(-4300000);
    expect(insights.projectionMessage).toContain('deficit');
  });

  it('detects unusual single transaction spikes and category spikes vs previous cycle', () => {
    const insights = InsightsEngine.generateInsights(
      mockActiveCycle,
      mockPreviousCycle,
      mockTransactions,
      '2026-11-10'
    );

    // 1. Single spike: Apartment Rent (₹20,000) > 2.5x daily avg (₹3,000 * 2.5 = ₹7,500)
    const rentSpike = insights.anomalies.find((a) => a.title.includes('Apartment Rent'));
    expect(rentSpike).toBeDefined();
    expect(rentSpike?.type).toBe('single_transaction_spike');

    // 2. Category spike: Food & Dining (₹5,000 vs ₹3,000 in Oct = +67%)
    const foodComp = insights.categoryComparisons.find((c) => c.categoryName === 'Food & Dining');
    expect(foodComp).toBeDefined();
    expect(foodComp?.isHigher).toBe(true);
    expect(foodComp?.percentChange).toBe(67);
    expect(foodComp?.message).toContain('67% higher than your previous salary cycle');

    const foodAnomaly = insights.anomalies.find((a) => a.title.includes('Food & Dining'));
    expect(foodAnomaly).toBeDefined();
  });

  it('generates spending warnings for high burn rate and projected deficit', () => {
    const insights = InsightsEngine.generateInsights(
      mockActiveCycle,
      mockPreviousCycle,
      mockTransactions,
      '2026-11-10'
    );

    // Spent 60% in 10 days of a 30-day cycle -> pace warning
    const paceWarning = insights.warnings.find((w) => w.id === 'warning_fast_pace');
    expect(paceWarning).toBeDefined();

    // Deficit warning because projected remaining balance < 0
    const deficitWarning = insights.warnings.find((w) => w.id === 'warning_projected_deficit');
    expect(deficitWarning).toBeDefined();
  });

  it('recommends personalized rule-based safe daily spending limits', () => {
    const insights = InsightsEngine.generateInsights(
      mockActiveCycle,
      mockPreviousCycle,
      mockTransactions,
      '2026-11-10'
    );

    const safeDailySugg = insights.suggestions.find((s) => s.id === 'sugg_safe_daily');
    expect(safeDailySugg).toBeDefined();
    // Available balance = ₹20,000 (2000000 paise), 21 days remaining
    // Safe daily = floor(2000000 / 21) = 95238 paise (₹952.38)
    expect(safeDailySugg?.safeDailyLimitPaise).toBe(95238);
    expect(safeDailySugg?.formattedSafeDailyLimit).toBe('₹952.38');
  });

  it('ranks highest expense categories by amount and percentage of cycle expenses', () => {
    const insights = InsightsEngine.generateInsights(
      mockActiveCycle,
      mockPreviousCycle,
      mockTransactions,
      '2026-11-10'
    );

    expect(insights.topExpenseCategories.length).toBe(3);
    expect(insights.topExpenseCategories[0]?.categoryName).toBe('Housing & Rent');
    expect(insights.topExpenseCategories[0]?.amountPaise).toBe(2000000);
    // ₹20,000 / ₹30,000 = 67%
    expect(insights.topExpenseCategories[0]?.percentOfCycleExpenses).toBe(67);
  });

  it('handles empty datasets cleanly without active salary cycle', () => {
    const insights = InsightsEngine.generateInsights(null, null, [], '2026-11-10');

    expect(insights.hasActiveCycle).toBe(false);
    expect(insights.spentPercentage).toBe(0);
    expect(insights.dailyAverageExpensePaise).toBe(0);
    expect(insights.warnings.length).toBe(0);
    expect(insights.topExpenseCategories.length).toBe(0);
    expect(insights.suggestions[0]?.id).toBe('sugg_open_cycle');
  });
});
