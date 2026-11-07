import { createTestDatabase, TestDbInstance } from '../helpers/testDatabase';
import { BackupSerializer } from '@/domain/backup/backupSerializer';
import {
  BackupPayload,
  CURRENT_BACKUP_SCHEMA_VERSION,
  CURRENT_APP_VERSION,
} from '@/domain/backup/backupTypes';
import { IncompatibleSchemaError } from '@/domain/backup/backupCrypto';
import { SalaryCycleRepository } from '@/database/repositories/salaryCycleRepository';
import { TransactionRepository } from '@/database/repositories/transactionRepository';

describe('BackupSerializer — Database Serialization, Safety Snapshot & Restore', () => {
  let testDb: TestDbInstance;
  let serializer: BackupSerializer;
  let cycleRepo: SalaryCycleRepository;
  let txRepo: TransactionRepository;

  beforeEach(async () => {
    testDb = createTestDatabase(':memory:');
    serializer = new BackupSerializer(testDb.db as never);
    cycleRepo = new SalaryCycleRepository(testDb.db as never);
    txRepo = new TransactionRepository(testDb.db as never);

    // Populate initial state
    await cycleRepo.create({
      id: 'cycle-nov-2026',
      salaryAmount: 3000000, // ₹30,000.00
      receivedDate: '2026-11-05',
      expectedNextDate: '2026-12-12',
      openingBalance: 150000,
    });

    await txRepo.create({
      id: 'tx-groceries-1',
      cycleId: 'cycle-nov-2026',
      type: 'expense',
      amount: 45000, // ₹450.00
      description: 'Supermarket weekly grocery',
      categoryId: 'cat-groceries-001',
      transactionDate: '2026-11-06',
      inputMethod: 'manual',
      notes: 'Vegetables and dairy',
    });
  });

  afterEach(() => {
    testDb.close();
  });

  it('serializes database into a structured BackupPayload', async () => {
    const payload = await serializer.serializeDatabase();

    expect(payload.schemaVersion).toBe(CURRENT_BACKUP_SCHEMA_VERSION);
    expect(payload.appVersion).toBe(CURRENT_APP_VERSION);
    expect(payload.recordCount.cycles).toBe(1);
    expect(payload.recordCount.transactions).toBe(1);
    expect(payload.recordCount.categories).toBeGreaterThan(0); // 13 default categories

    expect(payload.salaryCycles[0]?.salaryAmount).toBe(3000000);
    expect(payload.transactions[0]?.amount).toBe(45000);
    expect(payload.transactions[0]?.description).toBe('Supermarket weekly grocery');
  });

  it('creates a local safety snapshot before modifying records', async () => {
    const timestamp = await serializer.createLocalSafetyBackup();
    expect(timestamp).toBeDefined();

    const safety = await serializer.getLatestLocalSafetyBackup();
    expect(safety).not.toBeNull();
    expect(safety?.payload.recordCount.transactions).toBe(1);
    expect(safety?.payload.transactions[0]?.id).toBe('tx-groceries-1');
  });

  it('restores new cycles and transactions from payload without duplicate crashes', async () => {
    const remotePayload: BackupPayload = {
      schemaVersion: CURRENT_BACKUP_SCHEMA_VERSION,
      appVersion: CURRENT_APP_VERSION,
      exportedAt: '2026-11-07T12:00:00.000Z',
      recordCount: { cycles: 2, transactions: 2, categories: 1, settings: 0 },
      salaryCycles: [
        {
          id: 'cycle-dec-2026',
          salaryAmount: 3500000,
          receivedDate: '2026-12-13',
          expectedNextDate: '2027-01-10',
          openingBalance: 200000,
          createdAt: '2026-12-13T09:00:00.000Z',
          updatedAt: '2026-12-13T09:00:00.000Z',
        },
      ],
      transactions: [
        {
          id: 'tx-fuel-1',
          cycleId: 'cycle-dec-2026',
          type: 'expense',
          amount: 15000,
          description: 'Petrol pump refill',
          categoryId: 'cat-transport-005',
          transactionDate: '2026-12-14',
          inputMethod: 'voice',
          notes: null,
          createdAt: '2026-12-14T10:00:00.000Z',
          updatedAt: '2026-12-14T10:00:00.000Z',
        },
      ],
      categories: [
        {
          id: 'cat_custom_crypto',
          name: 'Crypto Trading',
          type: 'income',
          icon: 'logo-bitcoin',
          color: '#F59E0B',
          isDefault: false,
          createdAt: '2026-11-01T00:00:00.000Z',
        },
      ],
      appSettings: [],
    };

    const summary = await serializer.restoreDatabase(remotePayload);
    expect(summary.restoredCycles).toBe(1);
    expect(summary.restoredTransactions).toBe(1);
    expect(summary.restoredCategories).toBe(1);
    expect(summary.safetyBackupTimestamp).toBeDefined();

    // Verify existing + newly restored records coexist
    const allCycles = await cycleRepo.getAll();
    expect(allCycles.length).toBe(2);

    const allTx = await txRepo.getAll();
    expect(allTx.length).toBe(2);
    expect(allTx.some((t) => t.id === 'tx-fuel-1')).toBe(true);
    expect(allTx.some((t) => t.id === 'tx-groceries-1')).toBe(true);
  });

  it('rejects restoring backups with newer, unsupported schema versions', async () => {
    const invalidPayload: BackupPayload = {
      schemaVersion: 999, // Incompatible future schema
      appVersion: '9.9.0',
      exportedAt: '2030-01-01T00:00:00.000Z',
      recordCount: { cycles: 0, transactions: 0, categories: 0, settings: 0 },
      salaryCycles: [],
      transactions: [],
      categories: [],
      appSettings: [],
    };

    await expect(serializer.restoreDatabase(invalidPayload)).rejects.toThrow(
      IncompatibleSchemaError
    );
  });

  it('rolls back database state using the safety snapshot', async () => {
    // 1. Initial state has 1 transaction ('tx-groceries-1')
    expect((await txRepo.getAll()).length).toBe(1);

    // 2. Perform restore with a modified transaction
    const updatePayload: BackupPayload = {
      schemaVersion: CURRENT_BACKUP_SCHEMA_VERSION,
      appVersion: CURRENT_APP_VERSION,
      exportedAt: '2026-11-07T12:00:00.000Z',
      recordCount: { cycles: 0, transactions: 1, categories: 0, settings: 0 },
      salaryCycles: [],
      transactions: [
        {
          id: 'tx-groceries-1',
          cycleId: 'cycle-nov-2026',
          type: 'expense',
          amount: 99999, // Changed amount
          description: 'Accidentally modified description',
          categoryId: 'cat-groceries-001',
          transactionDate: '2026-11-06',
          inputMethod: 'manual',
          notes: null,
          createdAt: '2026-11-06T14:30:00.000Z',
          updatedAt: '2026-11-06T14:30:00.000Z',
        },
      ],
      categories: [],
      appSettings: [],
    };

    await serializer.restoreDatabase(updatePayload);
    const modifiedTx = await txRepo.getById('tx-groceries-1');
    expect(modifiedTx?.amount).toBe(99999);

    // 3. Rollback using safety snapshot
    const rolledBack = await serializer.rollbackSafetyBackup();
    expect(rolledBack).toBe(true);

    const revertedTx = await txRepo.getById('tx-groceries-1');
    expect(revertedTx?.amount).toBe(45000); // Back to original ₹450.00
    expect(revertedTx?.description).toBe('Supermarket weekly grocery');
  });
});
