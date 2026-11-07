import {
  EncryptedBackupFile,
  BackupPayload,
  CURRENT_BACKUP_SCHEMA_VERSION,
  CURRENT_APP_VERSION,
} from './backupTypes';

export class DecryptionFailedError extends Error {
  constructor(message = 'Invalid recovery passphrase or corrupted backup archive.') {
    super(message);
    this.name = 'DecryptionFailedError';
  }
}

export class IntegrityCheckFailedError extends Error {
  constructor(message = 'Backup integrity validation failed. Checksum mismatch.') {
    super(message);
    this.name = 'IntegrityCheckFailedError';
  }
}

export class IncompatibleSchemaError extends Error {
  constructor(version: number) {
    super(
      `Backup schema version ${version} is newer than supported version ${CURRENT_BACKUP_SCHEMA_VERSION}. Please update Finly.`
    );
    this.name = 'IncompatibleSchemaError';
  }
}

// ---------------------------------------------------------------------------
// Base64 & Hex Conversion Utilities
// ---------------------------------------------------------------------------

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  if (typeof btoa === 'function') {
    return btoa(binary);
  }
  // Node.js fallback
  return Buffer.from(binary, 'binary').toString('base64');
}

export function base64ToUint8Array(base64: string): Uint8Array {
  if (typeof atob === 'function') {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  // Node.js fallback
  const buf = Buffer.from(base64, 'base64');
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

export function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i]!.toString(16).padStart(2, '0');
  }
  return hex;
}

// ---------------------------------------------------------------------------
// Cryptographic Random Bytes
// ---------------------------------------------------------------------------

export function getRandomBytes(count: number): Uint8Array {
  const bytes = new Uint8Array(count);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes);
    return bytes;
  }
  // Fallback for Node environments without globalThis.crypto
  for (let i = 0; i < count; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

// ---------------------------------------------------------------------------
// Pure TypeScript SHA-256 & HMAC (RFC 6234 / FIPS 180-4 compliant)
// Guarantees 100% deterministic operation across all environments
// ---------------------------------------------------------------------------

function rotr(n: number, x: number): number {
  return (x >>> n) | (x << (32 - n));
}

function sha256Blocks(words: number[], totalBytes: number): number[] {
  // Initial hash values
  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  // Append padding bit
  const bitLength = totalBytes * 8;
  const wordCount = ((totalBytes + 8) >>> 6 << 4) + 16;
  const padded = new Array<number>(wordCount).fill(0);

  for (let i = 0; i < words.length; i++) {
    padded[i] = words[i]!;
  }
  padded[totalBytes >>> 2]! |= 0x80 << (24 - (totalBytes & 3) * 8);
  padded[wordCount - 1] = bitLength & 0xffffffff;
  padded[wordCount - 2] = Math.floor(bitLength / 0x100000000);

  const W = new Array<number>(64);

  for (let chunk = 0; chunk < wordCount; chunk += 16) {
    for (let i = 0; i < 16; i++) {
      W[i] = padded[chunk + i]!;
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(7, W[i - 15]!) ^ rotr(18, W[i - 15]!) ^ (W[i - 15]! >>> 3);
      const s1 = rotr(17, W[i - 2]!) ^ rotr(19, W[i - 2]!) ^ (W[i - 2]! >>> 10);
      W[i] = (W[i - 16]! + s0 + W[i - 7]! + s1) | 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i]! + W[i]!) | 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
    h5 = (h5 + f) | 0;
    h6 = (h6 + g) | 0;
    h7 = (h7 + h) | 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7];
}

export function computeSha256Bytes(data: Uint8Array): Uint8Array {
  const words: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    words.push(
      ((data[i]! << 24) |
        ((data[i + 1] ?? 0) << 16) |
        ((data[i + 2] ?? 0) << 8) |
        (data[i + 3] ?? 0)) >>>
        0
    );
  }
  const hashWords = sha256Blocks(words, data.length);
  const out = new Uint8Array(32);
  for (let i = 0; i < 8; i++) {
    const w = hashWords[i]!;
    out[i * 4] = (w >>> 24) & 0xff;
    out[i * 4 + 1] = (w >>> 16) & 0xff;
    out[i * 4 + 2] = (w >>> 8) & 0xff;
    out[i * 4 + 3] = w & 0xff;
  }
  return out;
}

export async function computeSha256Hex(text: string): Promise<string> {
  const enc = new TextEncoder();
  const bytes = enc.encode(text);
  if (typeof globalThis.crypto?.subtle?.digest === 'function') {
    const hashBuf = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    return bytesToHex(new Uint8Array(hashBuf));
  }
  return bytesToHex(computeSha256Bytes(bytes));
}

// ---------------------------------------------------------------------------
// HMAC-SHA256 & PBKDF2 (100,000 iterations for banking-grade key stretching)
// ---------------------------------------------------------------------------

function hmacSha256(key: Uint8Array, message: Uint8Array): Uint8Array {
  const blockSize = 64;
  let keyPadded = new Uint8Array(blockSize);
  if (key.length > blockSize) {
    const hashedKey = computeSha256Bytes(key);
    keyPadded.set(hashedKey);
  } else {
    keyPadded.set(key);
  }

  const oKeyPad = new Uint8Array(blockSize);
  const iKeyPad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    oKeyPad[i] = keyPadded[i]! ^ 0x5c;
    iKeyPad[i] = keyPadded[i]! ^ 0x36;
  }

  const innerMsg = new Uint8Array(blockSize + message.length);
  innerMsg.set(iKeyPad, 0);
  innerMsg.set(message, blockSize);
  const innerHash = computeSha256Bytes(innerMsg);

  const outerMsg = new Uint8Array(blockSize + 32);
  outerMsg.set(oKeyPad, 0);
  outerMsg.set(innerHash, blockSize);
  return computeSha256Bytes(outerMsg);
}

export async function deriveKeyPbkdf2(
  passphrase: string,
  salt: Uint8Array,
  iterations = 100000,
  keyByteLength = 32
): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const passBytes = enc.encode(passphrase);

  // Fast path: use native WebCrypto subtle if available
  if (typeof globalThis.crypto?.subtle?.importKey === 'function') {
    try {
      const keyMaterial = await globalThis.crypto.subtle.importKey(
        'raw',
        passBytes,
        'PBKDF2',
        false,
        ['deriveBits']
      );
      const derivedBits = await globalThis.crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: salt as unknown as BufferSource,
          iterations,
          hash: 'SHA-256',
        },
        keyMaterial,
        keyByteLength * 8
      );
      return new Uint8Array(derivedBits);
    } catch {
      // Fall through to deterministic pure-JS fallback
    }
  }

  // Pure-JS PBKDF2-HMAC-SHA256 fallback (standard RFC 2898)
  const blocksCount = Math.ceil(keyByteLength / 32);
  const result = new Uint8Array(keyByteLength);
  let offset = 0;

  for (let block = 1; block <= blocksCount; block++) {
    const saltBlock = new Uint8Array(salt.length + 4);
    saltBlock.set(salt, 0);
    saltBlock[salt.length] = (block >>> 24) & 0xff;
    saltBlock[salt.length + 1] = (block >>> 16) & 0xff;
    saltBlock[salt.length + 2] = (block >>> 8) & 0xff;
    saltBlock[salt.length + 3] = block & 0xff;

    let u = hmacSha256(passBytes, saltBlock);
    const uXor = new Uint8Array(u);

    for (let iter = 1; iter < iterations; iter++) {
      u = hmacSha256(passBytes, u);
      for (let k = 0; k < 32; k++) {
        uXor[k]! ^= u[k]!;
      }
    }

    const toCopy = Math.min(32, keyByteLength - offset);
    result.set(uXor.subarray(0, toCopy), offset);
    offset += toCopy;
  }

  return result;
}

// ---------------------------------------------------------------------------
// AES-256-GCM Authenticated Encryption & Decryption Engine
// ---------------------------------------------------------------------------

export class BackupCryptoEngine {
  /**
   * Encrypts a plaintext JSON string into an authenticated, tamper-evident EncryptedBackupFile.
   */
  static async encrypt(
    payloadString: string,
    passphrase: string
  ): Promise<EncryptedBackupFile> {
    if (!passphrase || passphrase.trim().length < 8) {
      throw new Error('Recovery passphrase must be at least 8 characters long.');
    }

    const enc = new TextEncoder();
    const dataBytes = enc.encode(payloadString);
    const checksum = await computeSha256Hex(payloadString);

    // 16-byte random salt for PBKDF2
    const salt = getRandomBytes(16);
    // 12-byte random IV/nonce for AES-GCM
    const iv = getRandomBytes(12);

    // Derive 256-bit encryption key
    const derivedKeyBytes = await deriveKeyPbkdf2(passphrase, salt, 100000, 32);

    // Perform AES-GCM encryption
    if (typeof globalThis.crypto?.subtle?.importKey === 'function') {
      const cryptoKey = await globalThis.crypto.subtle.importKey(
        'raw',
        derivedKeyBytes as unknown as BufferSource,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );

      // WebCrypto AES-GCM outputs ciphertext with 16-byte authentication tag appended
      const encryptedBuffer = await globalThis.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv as unknown as BufferSource },
        cryptoKey,
        dataBytes as unknown as BufferSource
      );

      const encryptedBytes = new Uint8Array(encryptedBuffer);
      const tagLength = 16;
      const ciphertextLength = encryptedBytes.byteLength - tagLength;

      const ciphertextBytes = encryptedBytes.subarray(0, ciphertextLength);
      const authTagBytes = encryptedBytes.subarray(ciphertextLength);

      return {
        backupVersion: 1,
        appVersion: CURRENT_APP_VERSION,
        schemaVersion: CURRENT_BACKUP_SCHEMA_VERSION,
        createdAt: new Date().toISOString(),
        salt: uint8ArrayToBase64(salt),
        iv: uint8ArrayToBase64(iv),
        authTag: uint8ArrayToBase64(authTagBytes),
        ciphertext: uint8ArrayToBase64(ciphertextBytes),
        checksum,
      };
    }

    throw new Error('WebCrypto subtle AES-GCM engine is not available on this platform.');
  }

  /**
   * Decrypts and authenticates an EncryptedBackupFile using the user's recovery passphrase.
   * Throws DecryptionFailedError if passphrase is wrong or data was tampered with.
   * Throws IntegrityCheckFailedError if SHA-256 checksum fails.
   */
  static async decrypt(
    backupFile: EncryptedBackupFile,
    passphrase: string
  ): Promise<BackupPayload> {
    if (!passphrase) {
      throw new DecryptionFailedError('Passphrase is required.');
    }

    if (backupFile.schemaVersion > CURRENT_BACKUP_SCHEMA_VERSION) {
      throw new IncompatibleSchemaError(backupFile.schemaVersion);
    }

    try {
      const salt = base64ToUint8Array(backupFile.salt);
      const iv = base64ToUint8Array(backupFile.iv);
      const ciphertext = base64ToUint8Array(backupFile.ciphertext);
      const authTag = base64ToUint8Array(backupFile.authTag);

      // Re-derive the exact 256-bit key from passphrase + backup's salt
      const derivedKeyBytes = await deriveKeyPbkdf2(passphrase, salt, 100000, 32);

      if (typeof globalThis.crypto?.subtle?.importKey !== 'function') {
        throw new Error('WebCrypto subtle AES-GCM engine is not available on this platform.');
      }

      const cryptoKey = await globalThis.crypto.subtle.importKey(
        'raw',
        derivedKeyBytes as unknown as BufferSource,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      // WebCrypto AES-GCM expects ciphertext + auth tag concatenated
      const combined = new Uint8Array(ciphertext.byteLength + authTag.byteLength);
      combined.set(ciphertext, 0);
      combined.set(authTag, ciphertext.byteLength);

      const decryptedBuffer = await globalThis.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as unknown as BufferSource },
        cryptoKey,
        combined as unknown as BufferSource
      );

      const dec = new TextDecoder();
      const plaintext = dec.decode(decryptedBuffer);

      // Validate post-decryption SHA-256 integrity checksum
      const computedChecksum = await computeSha256Hex(plaintext);
      if (computedChecksum.toLowerCase() !== backupFile.checksum.toLowerCase()) {
        throw new IntegrityCheckFailedError();
      }

      const payload = JSON.parse(plaintext) as BackupPayload;
      if (!payload.recordCount || !Array.isArray(payload.transactions)) {
        throw new DecryptionFailedError('Corrupted backup payload structure.');
      }

      return payload;
    } catch (err) {
      if (err instanceof IntegrityCheckFailedError || err instanceof IncompatibleSchemaError) {
        throw err;
      }
      throw new DecryptionFailedError(
        err instanceof Error ? err.message : 'Decryption failed. Please verify your passphrase.'
      );
    }
  }
}
