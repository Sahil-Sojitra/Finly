import {
  BackupCryptoEngine,
  DecryptionFailedError,
  computeSha256Hex,
} from '@/domain/backup/backupCrypto';
import {
  BackupPayload,
  CURRENT_BACKUP_SCHEMA_VERSION,
  CURRENT_APP_VERSION,
} from '@/domain/backup/backupTypes';

describe('BackupCryptoEngine — AES-256-GCM & PBKDF2 Authenticated Encryption', () => {
  const samplePayload: BackupPayload = {
    schemaVersion: CURRENT_BACKUP_SCHEMA_VERSION,
    appVersion: CURRENT_APP_VERSION,
    exportedAt: '2026-11-07T12:00:00.000Z',
    recordCount: {
      cycles: 2,
      transactions: 3,
      categories: 13,
      settings: 4,
    },
    salaryCycles: [
      {
        id: 'cycle-uuid-1',
        salaryAmount: 5000000,
        receivedDate: '2026-11-05',
        expectedNextDate: '2026-12-05',
        openingBalance: 120000,
        createdAt: '2026-11-05T09:00:00.000Z',
        updatedAt: '2026-11-05T09:00:00.000Z',
      },
    ],
    transactions: [
      {
        id: 'tx-uuid-1',
        cycleId: 'cycle-uuid-1',
        type: 'expense',
        amount: 25000,
        description: 'Groceries store',
        categoryId: 'cat-groceries',
        transactionDate: '2026-11-06',
        inputMethod: 'manual',
        notes: 'Organic milk and vegetables',
        createdAt: '2026-11-06T14:30:00.000Z',
        updatedAt: '2026-11-06T14:30:00.000Z',
      },
    ],
    categories: [
      {
        id: 'cat-groceries',
        name: 'Groceries',
        type: 'expense',
        icon: 'cart',
        color: '#10B981',
        isDefault: true,
        createdAt: '2026-11-01T00:00:00.000Z',
      },
    ],
    appSettings: [
      {
        key: 'currency_symbol',
        value: '₹',
        updatedAt: '2026-11-01T00:00:00.000Z',
      },
    ],
  };

  const validPassphrase = 'SuperSecretRecoveryPassphrase2026!';

  it('successfully encrypts and decrypts a backup payload with correct passphrase', async () => {
    const payloadJson = JSON.stringify(samplePayload);
    const encryptedFile = await BackupCryptoEngine.encrypt(payloadJson, validPassphrase);

    // Verify encrypted file metadata
    expect(encryptedFile.backupVersion).toBe(1);
    expect(encryptedFile.appVersion).toBe(CURRENT_APP_VERSION);
    expect(encryptedFile.schemaVersion).toBe(CURRENT_BACKUP_SCHEMA_VERSION);
    expect(encryptedFile.salt).toBeDefined();
    expect(encryptedFile.iv).toBeDefined();
    expect(encryptedFile.authTag).toBeDefined();
    expect(encryptedFile.ciphertext).toBeDefined();
    expect(encryptedFile.checksum).toBeDefined();

    // Verify no plaintext leak
    expect(encryptedFile.ciphertext).not.toContain('Groceries store');
    expect(encryptedFile.ciphertext).not.toContain('5000000');

    // Decrypt and verify roundtrip
    const decrypted = await BackupCryptoEngine.decrypt(encryptedFile, validPassphrase);
    expect(decrypted.recordCount.cycles).toBe(2);
    expect(decrypted.recordCount.transactions).toBe(3);
    expect(decrypted.transactions[0]?.description).toBe('Groceries store');
    expect(decrypted.transactions[0]?.amount).toBe(25000);
    expect(decrypted.salaryCycles[0]?.salaryAmount).toBe(5000000);
  });

  it('rejects decryption when an incorrect passphrase is provided', async () => {
    const payloadJson = JSON.stringify(samplePayload);
    const encryptedFile = await BackupCryptoEngine.encrypt(payloadJson, validPassphrase);

    await expect(
      BackupCryptoEngine.decrypt(encryptedFile, 'WrongPassword123!')
    ).rejects.toThrow(DecryptionFailedError);
  });

  it('detects tampering with ciphertext via AES-GCM authentication tag', async () => {
    const payloadJson = JSON.stringify(samplePayload);
    const encryptedFile = await BackupCryptoEngine.encrypt(payloadJson, validPassphrase);

    // Flip a bit in the Base64 ciphertext
    const tamperedCiphertext =
      encryptedFile.ciphertext.slice(0, -4) + 'AAAA';
    const tamperedFile = {
      ...encryptedFile,
      ciphertext: tamperedCiphertext,
    };

    await expect(
      BackupCryptoEngine.decrypt(tamperedFile, validPassphrase)
    ).rejects.toThrow(DecryptionFailedError);
  });

  it('verifies SHA-256 checksum helper produces valid digests', async () => {
    const hash = await computeSha256Hex('Finly Zero Cost Architecture');
    expect(hash).toHaveLength(64);
    expect(typeof hash).toBe('string');
  });

  it('rejects passphrases shorter than 8 characters during encryption', async () => {
    const payloadJson = JSON.stringify(samplePayload);
    await expect(
      BackupCryptoEngine.encrypt(payloadJson, 'short')
    ).rejects.toThrow('Recovery passphrase must be at least 8 characters long.');
  });
});
