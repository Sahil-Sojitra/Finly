import { formatPaiseToInr, parseInrToPaise } from '@/utils/currency';

describe('Currency Utility (Integer Paise Calculations)', () => {
  describe('formatPaiseToInr', () => {
    it('formats standard positive amounts with paise decimals', () => {
      expect(formatPaiseToInr(3000000)).toBe('₹30,000.00');
      expect(formatPaiseToInr(10050)).toBe('₹100.50');
      expect(formatPaiseToInr(99)).toBe('₹0.99');
      expect(formatPaiseToInr(0)).toBe('₹0.00');
    });

    it('formats amounts without decimals when requested', () => {
      expect(formatPaiseToInr(3000000, false)).toBe('₹30,000');
      expect(formatPaiseToInr(4500000, false)).toBe('₹45,000');
    });

    it('formats negative balances accurately', () => {
      expect(formatPaiseToInr(-50000)).toBe('-₹500.00');
      expect(formatPaiseToInr(-75)).toBe('-₹0.75');
    });

    it('applies Indian numbering system formatting', () => {
      expect(formatPaiseToInr(1000000000)).toBe('₹1,00,00,000.00'); // 1 crore
      expect(formatPaiseToInr(10000000)).toBe('₹1,00,000.00'); // 1 lakh
    });
  });

  describe('parseInrToPaise', () => {
    it('parses formatted rupee strings into integer paise', () => {
      expect(parseInrToPaise('30,000')).toBe(3000000);
      expect(parseInrToPaise('₹30,000.00')).toBe(3000000);
      expect(parseInrToPaise('100.50')).toBe(10050);
      expect(parseInrToPaise('0.99')).toBe(99);
      expect(parseInrToPaise('0')).toBe(0);
    });

    it('handles single decimal digit gracefully', () => {
      expect(parseInrToPaise('100.5')).toBe(10050);
    });

    it('handles negative inputs', () => {
      expect(parseInrToPaise('-500')).toBe(-50000);
      expect(parseInrToPaise('-₹500.25')).toBe(-50025);
    });

    it('handles empty or whitespace strings as 0', () => {
      expect(parseInrToPaise('')).toBe(0);
      expect(parseInrToPaise('   ')).toBe(0);
    });

    it('throws error on invalid formatted strings', () => {
      expect(() => parseInrToPaise('10.20.30')).toThrow('Invalid currency format');
      expect(() => parseInrToPaise('abc')).toThrow('Invalid characters');
    });
  });
});

