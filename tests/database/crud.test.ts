import fs from 'fs';
import path from 'path';
import { createTestDatabase, TestDbInstance } from '../helpers/testDatabase';
import { CategoryRepository } from '@/database/repositories/categoryRepository';
import { SalaryCycleRepository } from '@/database/repositories/salaryCycleRepository';
import { TransactionRepository } from '@/database/repositories/transactionRepository';

describe('Local Database CRUD & Persistence Suite', () => {
  let testDb: TestDbInstance;
  let categoryRepo: CategoryRepository;
  let cycleRepo: SalaryCycleRepository;
  let transactionRepo: TransactionRepository;

  beforeEach(() => {
    testDb = createTestDatabase(':memory:');
    // Inject test database into repositories
    categoryRepo = new CategoryRepository(testDb.db as never);
    cycleRepo = new SalaryCycleRepository(testDb.db as never);
    transactionRepo = new TransactionRepository(testDb.db as never);
  });

  afterEach(() => {
    testDb.close();
  });

  describe('1. Database Creation & Schema Integrity', () => {
    it('enforces foreign key constraints (PRAGMA foreign_keys = ON)', () => {
      const fkRow = testDb.sqlite
        .prepare('PRAGMA foreign_keys;')
        .get() as { foreign_keys: number };

      expect(fkRow.foreign_keys).toBe(1);
    });

    it('creates all normalized tables', () => {
      const tables = testDb.sqlite
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
        )
        .all() as { name: string }[];

      const tableNames = tables.map((t) => t.name);
      expect(tableNames).toContain('categories');
      expect(tableNames).toContain('salary_cycles');
      expect(tableNames).toContain('transactions');
      expect(tableNames).toContain('app_settings');
      expect(tableNames).toContain('backup_metadata');
    });

    it('creates performance indexes on transactions and cycles', () => {
      const indexes = testDb.sqlite
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%';"
        )
        .all() as { name: string }[];

      const indexNames = indexes.map((i) => i.name);
      expect(indexNames).toContain('idx_transactions_date');
      expect(indexNames).toContain('idx_transactions_cycle');
      expect(indexNames).toContain('idx_transactions_category');
      expect(indexNames).toContain('idx_salary_cycles_received_date');
    });
  });

  describe('2. Category Operations (Insertion & Querying)', () => {
    it('seeds default categories on initialization', async () => {
      const allCategories = await categoryRepo.getAll();
      expect(allCategories.length).toBeGreaterThanOrEqual(13);

      const groceries = await categoryRepo.getById('cat-groceries-001');
      expect(groceries).not.toBeNull();
      expect(groceries?.name).toBe('Groceries');
      expect(groceries?.type).toBe('expense');
    });

    it('inserts a custom category and filters by type', async () => {
      const customCat = await categoryRepo.create({
        id: 'cat-custom-gym',
        name: 'Gym & Fitness',
        type: 'expense',
        icon: 'dumbbell',
        color: '#F43F5E',
      });

      expect(customCat.id).toBe('cat-custom-gym');
      expect(customCat.name).toBe('Gym & Fitness');

      const expenseCategories = await categoryRepo.getByType('expense');
      const found = expenseCategories.find((c) => c.id === 'cat-custom-gym');
      expect(found).toBeDefined();

      const incomeCategories = await categoryRepo.getByType('income');
      const shouldNotExistInIncome = incomeCategories.find(
        (c) => c.id === 'cat-custom-gym'
      );
      expect(shouldNotExistInIncome).toBeUndefined();
    });
  });

  describe('3. Transaction Insertion & Integrity', () => {
    it('inserts a transaction with integer paise amounts', async () => {
      const cycle = await cycleRepo.create({
        id: 'cycle-nov-2026',
        salaryAmount: 3000000, // ₹30,000.00
        receivedDate: '2026-11-05',
        openingBalance: 500000, // ₹5,000.00
      });

      const tx = await transactionRepo.create({
        id: 'tx-grocery-001',
        cycleId: cycle.id,
        categoryId: 'cat-groceries-001',
        amount: 35000, // ₹350.00
        description: 'Weekly organic vegetables',
        transactionDate: '2026-11-06',
        type: 'expense',
        inputMethod: 'manual',
        notes: 'Paid via UPI',
      });

      expect(tx.id).toBe('tx-grocery-001');
      expect(tx.amount).toBe(35000);
      expect(tx.cycleId).toBe('cycle-nov-2026');

      const retrieved = await transactionRepo.getById('tx-grocery-001');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.description).toBe('Weekly organic vegetables');
      expect(retrieved?.category.name).toBe('Groceries');
      expect(retrieved?.category.color).toBe('#10B981');
    });

    it('rejects transaction insertion when foreign key category does not exist', async () => {
      await expect(
        transactionRepo.create({
          id: 'tx-invalid-fk',
          categoryId: 'non-existent-category-id',
          amount: 10000,
          description: 'Invalid category test',
          transactionDate: '2026-11-06',
          type: 'expense',
        })
      ).rejects.toThrow();
    });
  });

  describe('4. Transaction Editing', () => {
    it('updates transaction amount, description, and notes', async () => {
      await transactionRepo.create({
        id: 'tx-edit-target',
        categoryId: 'cat-dining-002',
        amount: 25000, // ₹250.00
        description: 'Dinner at cafe',
        transactionDate: '2026-11-07',
        type: 'expense',
      });

      const updated = await transactionRepo.update('tx-edit-target', {
        amount: 32000, // ₹320.00
        description: 'Dinner at cafe with dessert',
        notes: 'Updated bill amount',
      });

      expect(updated).not.toBeNull();
      expect(updated?.amount).toBe(32000);
      expect(updated?.description).toBe('Dinner at cafe with dessert');
      expect(updated?.notes).toBe('Updated bill amount');

      const reFetched = await transactionRepo.getById('tx-edit-target');
      expect(reFetched?.amount).toBe(32000);
    });
  });

  describe('5. Transaction Deletion', () => {
    it('deletes transaction without cascading damage to categories or cycles', async () => {
      const cycle = await cycleRepo.create({
        id: 'cycle-delete-test',
        salaryAmount: 2500000,
        receivedDate: '2026-10-01',
      });

      await transactionRepo.create({
        id: 'tx-to-delete',
        cycleId: cycle.id,
        categoryId: 'cat-groceries-001',
        amount: 15000,
        description: 'Snacks',
        transactionDate: '2026-10-02',
        type: 'expense',
      });

      const deleteResult = await transactionRepo.delete('tx-to-delete');
      expect(deleteResult).toBe(true);

      const shouldBeNull = await transactionRepo.getById('tx-to-delete');
      expect(shouldBeNull).toBeNull();

      // Ensure referenced category and cycle still exist
      const categoryStillExists = await categoryRepo.getById('cat-groceries-001');
      expect(categoryStillExists).not.toBeNull();

      const cycleStillExists = await cycleRepo.getById('cycle-delete-test');
      expect(cycleStillExists).not.toBeNull();
    });
  });

  describe('6. Database Persistence After Application Restart', () => {
    const tempDbPath = path.join(__dirname, 'restart_test.db');

    afterAll(() => {
      if (fs.existsSync(tempDbPath)) {
        fs.unlinkSync(tempDbPath);
      }
    });

    it('persists written data across database connection close and reopen', async () => {
      // Step A: Open first connection and write data
      const firstConnection = createTestDatabase(tempDbPath);
      const cycleRepo1 = new SalaryCycleRepository(firstConnection.db as never);
      const txRepo1 = new TransactionRepository(firstConnection.db as never);

      await cycleRepo1.create({
        id: 'cycle-restart-persistent',
        salaryAmount: 4500000, // ₹45,000.00
        receivedDate: '2026-11-01',
        openingBalance: 120000,
      });

      await txRepo1.create({
        id: 'tx-restart-persistent',
        cycleId: 'cycle-restart-persistent',
        categoryId: 'cat-housing-003',
        amount: 1500000, // ₹15,000.00
        description: 'House Rent November',
        transactionDate: '2026-11-02',
        type: 'expense',
        notes: 'Netbanking transfer',
      });

      // Step B: Simulate Application Shutdown (close SQLite connection)
      firstConnection.close();

      // Step C: Simulate Application Restart (re-open database file)
      const secondConnection = createTestDatabase(tempDbPath);
      const cycleRepo2 = new SalaryCycleRepository(secondConnection.db as never);
      const txRepo2 = new TransactionRepository(secondConnection.db as never);

      // Step D: Verify all data persisted across connection boundary
      const persistedCycle = await cycleRepo2.getById('cycle-restart-persistent');
      expect(persistedCycle).not.toBeNull();
      expect(persistedCycle?.salaryAmount).toBe(4500000);
      expect(persistedCycle?.receivedDate).toBe('2026-11-01');

      const persistedTx = await txRepo2.getById('tx-restart-persistent');
      expect(persistedTx).not.toBeNull();
      expect(persistedTx?.amount).toBe(1500000);
      expect(persistedTx?.description).toBe('House Rent November');
      expect(persistedTx?.category.name).toBe('Housing & Rent');
      expect(persistedTx?.notes).toBe('Netbanking transfer');

      // Calculate totals to verify aggregation query on re-opened DB
      const totals = await txRepo2.getTotalsByCycle('cycle-restart-persistent');
      expect(totals.totalExpensePaise).toBe(1500000);
      expect(totals.totalIncomePaise).toBe(0);

      secondConnection.close();
    });
  });
});
