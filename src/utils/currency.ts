import { Paise } from '../types';

/**
 * Formats integer paise into localized Indian Rupee display string.
 * Example: 3000000 paise -> "₹30,000.00"
 */
export function formatPaiseToInr(paise: Paise, includeDecimals = true): string {
  const isNegative = paise < 0;
  const absPaise = Math.abs(Math.round(paise));
  const rupees = Math.floor(absPaise / 100);
  const remainingPaise = absPaise % 100;

  // Format rupees with Indian numbering system (e.g., 1,00,000)
  const rupeeString = rupees.toLocaleString('en-IN');

  const formatted = includeDecimals
    ? `₹${rupeeString}.${remainingPaise.toString().padStart(2, '0')}`
    : `₹${rupeeString}`;

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Parses user input rupee string into integer paise.
 * Throws an error or returns 0 if input is invalid.
 * Example: "30,000.50" -> 3000050 paise
 */
export function parseInrToPaise(input: string): Paise {
  if (!input || typeof input !== 'string') {
    return 0;
  }

  // Remove currency symbol, spaces, and commas
  const cleaned = input.replace(/[₹\s,]/g, '').trim();
  if (cleaned === '' || cleaned === '-') {
    return 0;
  }

  const isNegative = cleaned.startsWith('-');
  const unsigned = isNegative ? cleaned.slice(1) : cleaned;

  const parts = unsigned.split('.');
  if (parts.length > 2) {
    throw new Error(`Invalid currency format: ${input}`);
  }

  const rupeePart = parts[0] ?? '0';
  const paisePart = parts[1] ?? '0';

  if (!/^\d*$/.test(rupeePart) || !/^\d*$/.test(paisePart)) {
    throw new Error(`Invalid characters in currency input: ${input}`);
  }

  const rupees = parseInt(rupeePart || '0', 10);
  const paisePadded = (paisePart + '00').slice(0, 2);
  const paise = parseInt(paisePadded, 10);

  const total = rupees * 100 + paise;
  return isNegative ? -total : total;
}

