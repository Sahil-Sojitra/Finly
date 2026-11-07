import { createTestDatabase, TestDbInstance } from '../helpers/testDatabase';
import { SalaryCycleEngine } from '@/domain/salaryCycleEngine';
import { AnalyticsEngine } from '@/domain/analyticsEngine';
import { WidgetSnapshotSerializer } from '@/domain/widgetSnapshot';
import { InsightsEngine } from '@/domain/insights/insightsEngine';
import { VoiceTransactionParser } from '@/domain/voiceParser';
import { SalaryCycle, TransactionWithCategory } from '@/types';

describe('QA & Performance Audit — Stress Benchmarks & High-Volume Datasets', () => {
  let testDb: TestDbInstance;

  beforeEach(() => {
    testDb = createTestDatabase();
  });

  afterEach(() => {
    testDb.close();
  });

  it('handles 2,000 transactions across 12 variable salary cycles with sub-50ms engine computation', () => {
    const { sqlite } = testDb;

    // 1. Generate 12 variable salary cycles spanning an entire year (irregular dates & variable amounts)
    const cycles: SalaryCycle[] = [];
    const cycleDates = [
      '2026-01-05',
      '2026-02-04',
      '2026-03-08',
      '2026-04-03',
      '2026-05-07',
      '2026-06-05',
      '2026-07-06',
      '2026-08-04',
      '2026-09-07',
      '2026-10-06',
      '2026-11-05',
      '2026-12-07',
    ];

    const insertCycleStmt = sqlite.prepare(`
      INSERT INTO salary_cycles (id, salary_amount, received_date, expected_next_date, opening_balance, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (let i = 0; i < cycleDates.length; i++) {
      const id = `cycle-stress-${i + 1}`;
      const salaryAmount = 3000000 + i * 50000; // Variable salary: ₹30,000 to ₹35,500
      const receivedDate = cycleDates[i]!;
      const expectedNext = i < cycleDates.length - 1 ? cycleDates[i + 1]! : '2027-01-08';
      const openingBalance = i === 0 ? 500000 : 0; // ₹5,000 initial opening balance

      insertCycleStmt.run(
        id,
        salaryAmount,
        receivedDate,
        expectedNext,
        openingBalance,
        `${receivedDate}T00:00:00.000Z`,
        `${receivedDate}T00:00:00.000Z`
      );

      cycles.push({
        id,
        salaryAmount,
        receivedDate,
        expectedNextDate: expectedNext,
        openingBalance,
        createdAt: `${receivedDate}T00:00:00.000Z`,
        updatedAt: `${receivedDate}T00:00:00.000Z`,
      });
    }

    // 2. Batch insert 2,000 realistic transactions with exact seeded category foreign keys
    const expenseCategoryIds = [
      'cat-groceries-001',
      'cat-dining-002',
      'cat-housing-003',
      'cat-utilities-004',
      'cat-transport-005',
      'cat-shopping-006',
      'cat-health-007',
      'cat-entertainment-008',
      'cat-personal-009',
    ];
    const incomeCategoryIds = [
      'cat-salary-101',
      'cat-freelance-102',
      'cat-investments-103',
      'cat-other-income-104',
    ];

    const insertTxStmt = sqlite.prepare(`
      INSERT INTO transactions (id, cycle_id, type, amount, description, category_id, transaction_date, input_method, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const boundaries = SalaryCycleEngine.computeBoundaries(cycles);
    const generatedTransactions: TransactionWithCategory[] = [];

    const insertManyTx = sqlite.transaction((count: number) => {
      for (let i = 0; i < count; i++) {
        const id = `tx-stress-${i + 1}`;
        const dayOffset = Math.floor((i / count) * 360);
        const dateObj = new Date(2026, 0, 5);
        dateObj.setDate(dateObj.getDate() + dayOffset);
        const isoDate = dateObj.toISOString().split('T')[0]!;

        const isIncome = i % 25 === 0; // 4% additional income transactions
        const type: 'income' | 'expense' = isIncome ? 'income' : 'expense';
        const amount = isIncome ? 500000 : 25000 + (i % 200) * 1000; // Expenses ₹250 to ₹2,250
        const categoryId = isIncome
          ? incomeCategoryIds[i % incomeCategoryIds.length]!
          : expenseCategoryIds[i % expenseCategoryIds.length]!;
        const cycleId = SalaryCycleEngine.assignTransaction(isoDate, boundaries);

        insertTxStmt.run(
          id,
          cycleId,
          type,
          amount,
          `Stress test transaction #${i + 1}`,
          categoryId,
          isoDate,
          i % 10 === 0 ? 'voice' : 'manual',
          null,
          `${isoDate}T12:00:00.000Z`,
          `${isoDate}T12:00:00.000Z`
        );

        generatedTransactions.push({
          id,
          cycleId,
          type,
          amount,
          description: `Stress test transaction #${i + 1}`,
          categoryId,
          transactionDate: isoDate,
          inputMethod: i % 10 === 0 ? 'voice' : 'manual',
          notes: null,
          createdAt: `${isoDate}T12:00:00.000Z`,
          updatedAt: `${isoDate}T12:00:00.000Z`,
          category: {
            id: categoryId,
            name: categoryId.replace('cat-', ''),
            type,
            icon: 'cart',
            color: '#2563EB',
            isDefault: true,
            createdAt: `${isoDate}T00:00:00.000Z`,
          },
        });
      }
    });

    const startInsert = Date.now();
    insertManyTx(2000);
    const insertDuration = Date.now() - startInsert;

    // Database batch insertion should easily finish under 500ms
    expect(insertDuration).toBeLessThan(500);

    // 3. Test Indexed Query Performance
    const startQuery = Date.now();
    const rows = sqlite
      .prepare(
        `SELECT t.*, c.name as categoryName
         FROM transactions t
         JOIN categories c ON t.category_id = c.id
         WHERE t.transaction_date BETWEEN '2026-06-01' AND '2026-08-31'
         ORDER BY t.transaction_date DESC`
      )
      .all();
    const queryDuration = Date.now() - startQuery;

    expect(rows.length).toBeGreaterThan(0);
    // Indexed range query over 2,000 rows should take < 50ms
    expect(queryDuration).toBeLessThan(50);

    // 4. Test SalaryCycleEngine multi-cycle evaluation over 2,000 transactions
    const startEval = Date.now();
    const evaluation = SalaryCycleEngine.evaluateAll(cycles, generatedTransactions);
    const evalDuration = Date.now() - startEval;

    expect(evalDuration).toBeLessThan(50);
    expect(evaluation.boundaries.length).toBe(12);
    expect(evaluation.activeCycle).not.toBeNull();
    expect(evaluation.activeCycle?.id).toBe('cycle-stress-12');

    // Mathematical Invariant: Carry forward chaining across 12 cycles
    for (let c = 0; c < evaluation.metricsList.length; c++) {
      const metrics = evaluation.metricsList[c]!;
      const expectedBalance =
        metrics.openingBalancePaise +
        metrics.baseSalaryPaise +
        metrics.additionalIncomePaise -
        metrics.expensesPaise;

      expect(metrics.availableBalancePaise).toBe(expectedBalance);

      if (c < evaluation.metricsList.length - 1) {
        const nextMetrics = evaluation.metricsList[c + 1]!;
        expect(nextMetrics.openingBalancePaise).toBe(metrics.availableBalancePaise);
      }
    }

    // 5. Test AnalyticsEngine computation with 2,000 transactions
    const startAnalytics = Date.now();
    const analytics = AnalyticsEngine.evaluateDashboardAnalytics({
      cycles,
      transactions: generatedTransactions,
      evaluation,
      filter: { type: 'current_cycle' },
      currentDate: '2026-12-25',
    });
    const analyticsDuration = Date.now() - startAnalytics;

    expect(analyticsDuration).toBeLessThan(50);
    expect(analytics.summary.hasActiveCycle).toBe(true);
    expect(analytics.categoryBreakdown.length).toBeGreaterThan(0);

    // 6. Test Widget Snapshot generation
    const startWidget = Date.now();
    const snapshot = WidgetSnapshotSerializer.createSnapshot({
      cycles,
      evaluation,
      transactions: generatedTransactions,
    });
    const widgetDuration = Date.now() - startWidget;

    // Snapshot creation should complete in < 35ms even with thousands of items
    expect(widgetDuration).toBeLessThan(35);
    expect(snapshot.hasActiveCycle).toBe(true);
    expect(snapshot.appTitle).toBe('Finly');

    // 7. Test InsightsEngine rule calculations
    const startInsights = Date.now();
    const insights = InsightsEngine.generateInsights(
      cycles[cycles.length - 1] ?? null,
      cycles[cycles.length - 2] ?? null,
      generatedTransactions
    );
    const insightsDuration = Date.now() - startInsights;

    // Full 10 insights rules execution should take < 50ms
    expect(insightsDuration).toBeLessThan(50);
    expect(insights.hasActiveCycle).toBe(true);
    expect(insights.dailyAverageExpensePaise).toBeGreaterThan(0);
  });

  it('processes 100 natural language voice entries deterministically with sub-millisecond per-utterance throughput', () => {
    const utterances = [
      'I spent 250 on coffee today',
      'Add 1500 for groceries yesterday',
      'Paid 1200 electricity bill using upi',
      'Received 15000 freelance income today',
      'Spent 450 petrol',
      'Add 320 for lunch yesterday',
      'Bought shoes for 2499',
      'Paid 600 wifi bill',
      'Spent 180 on auto rickshaw',
      'Received 500 cashback',
    ];

    const startTime = Date.now();
    for (let i = 0; i < 100; i++) {
      const text = utterances[i % utterances.length]!;
      const result = VoiceTransactionParser.parse(text, '2026-11-07');
      expect(result.amountPaise).toBeGreaterThan(0);
      expect(result.type).toBeDefined();
    }
    const totalTime = Date.now() - startTime;

    // 100 utterances should parse in < 100ms (< 1ms per utterance)
    expect(totalTime).toBeLessThan(100);
  });
});
