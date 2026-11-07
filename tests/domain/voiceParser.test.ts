import { VoiceTransactionParser } from '@/domain/voiceParser';

describe('VoiceTransactionParser — Deterministic Financial NLP Parser', () => {
  // Fix reference date for deterministic testing: 2026-11-07 (Saturday)
  const REF_DATE = '2026-11-07';

  it('1. Example 1: "Add shoes for 500 rupees today."', () => {
    const res = VoiceTransactionParser.parse('Add shoes for 500 rupees today.', REF_DATE);

    expect(res.type).toBe('expense');
    expect(res.amountPaise).toBe(50000); // ₹500.00
    expect(res.categoryName).toBe('Shopping');
    expect(res.categoryId).toBe('cat-shopping-006');
    expect(res.description.toLowerCase()).toContain('shoes');
    expect(res.transactionDate).toBe('2026-11-07');
    expect(res.isComplete).toBe(true);
    expect(res.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('2. Example 2: "I spent 200 on lunch."', () => {
    const res = VoiceTransactionParser.parse('I spent 200 on lunch.', REF_DATE);

    expect(res.type).toBe('expense');
    expect(res.amountPaise).toBe(20000); // ₹200.00
    expect(res.categoryName).toBe('Food & Dining');
    expect(res.categoryId).toBe('cat-dining-002');
    expect(res.description.toLowerCase()).toContain('lunch');
    expect(res.transactionDate).toBe('2026-11-07');
    expect(res.isComplete).toBe(true);
  });

  it('3. Example 3: "Add 150 rupees petrol yesterday."', () => {
    const res = VoiceTransactionParser.parse('Add 150 rupees petrol yesterday.', REF_DATE);

    expect(res.type).toBe('expense');
    expect(res.amountPaise).toBe(15000); // ₹150.00
    expect(res.categoryName).toBe('Transport & Fuel');
    expect(res.categoryId).toBe('cat-transport-005');
    expect(res.description.toLowerCase()).toContain('petrol');
    expect(res.transactionDate).toBe('2026-11-06'); // yesterday
    expect(res.isComplete).toBe(true);
  });

  it('4. Example 4: "I paid 1200 for electricity on 3 November."', () => {
    const res = VoiceTransactionParser.parse(
      'I paid 1200 for electricity on 3 November.',
      REF_DATE
    );

    expect(res.type).toBe('expense');
    expect(res.amountPaise).toBe(120000); // ₹1,200.00
    expect(res.categoryName).toBe('Bills & Utilities');
    expect(res.categoryId).toBe('cat-utilities-004');
    expect(res.description.toLowerCase()).toContain('electricity');
    expect(res.transactionDate).toBe('2026-11-03');
    expect(res.isComplete).toBe(true);
  });

  it('5. Example 5: "Received 5000 rupees from freelancing."', () => {
    const res = VoiceTransactionParser.parse(
      'Received 5000 rupees from freelancing.',
      REF_DATE
    );

    expect(res.type).toBe('income');
    expect(res.amountPaise).toBe(500000); // ₹5,000.00
    expect(res.categoryName).toBe('Freelance & Consulting');
    expect(res.categoryId).toBe('cat-freelance-102');
    expect(res.description.toLowerCase()).toContain('freelancing');
    expect(res.transactionDate).toBe('2026-11-07');
    expect(res.isComplete).toBe(true);
  });

  it('6. Example 6: "Add 250 for groceries last Sunday."', () => {
    // 2026-11-07 is Saturday. Last Sunday was 2026-11-01 (6 days ago)
    const res = VoiceTransactionParser.parse(
      'Add 250 for groceries last Sunday.',
      REF_DATE
    );

    expect(res.type).toBe('expense');
    expect(res.amountPaise).toBe(25000); // ₹250.00
    expect(res.categoryName).toBe('Groceries');
    expect(res.categoryId).toBe('cat-groceries-001');
    expect(res.description.toLowerCase()).toContain('groceries');
    expect(res.transactionDate).toBe('2026-11-01');
    expect(res.isComplete).toBe(true);
  });

  it('7. Example 7: "I spent 300 rupees on food using cash."', () => {
    const res = VoiceTransactionParser.parse(
      'I spent 300 rupees on food using cash.',
      REF_DATE
    );

    expect(res.type).toBe('expense');
    expect(res.amountPaise).toBe(30000); // ₹300.00
    expect(res.categoryName).toBe('Food & Dining');
    expect(res.paymentMethod).toBe('cash');
    expect(res.transactionDate).toBe('2026-11-07');
    expect(res.isComplete).toBe(true);
  });

  it('8. Hinglish: "500 rupay petrol me kharcha hua"', () => {
    const res = VoiceTransactionParser.parse(
      '500 rupay petrol me kharcha hua',
      REF_DATE
    );

    expect(res.type).toBe('expense');
    expect(res.amountPaise).toBe(50000);
    expect(res.categoryName).toBe('Transport & Fuel');
    expect(res.description.toLowerCase()).toContain('petrol');
    expect(res.isComplete).toBe(true);
  });

  it('9. Hinglish: "Salary mila 40000"', () => {
    const res = VoiceTransactionParser.parse('Salary mila 40000', REF_DATE);

    expect(res.type).toBe('income');
    expect(res.amountPaise).toBe(4000000); // ₹40,000.00
    expect(res.categoryName).toBe('Salary');
    expect(res.categoryId).toBe('cat-salary-101');
    expect(res.isComplete).toBe(true);
  });

  it('10. Hinglish: "Lunch pe 350 rupay kharch kiye kal"', () => {
    const res = VoiceTransactionParser.parse(
      'Lunch pe 350 rupay kharch kiye kal',
      REF_DATE
    );

    expect(res.type).toBe('expense');
    expect(res.amountPaise).toBe(35000);
    expect(res.categoryName).toBe('Food & Dining');
    expect(res.transactionDate).toBe('2026-11-06'); // kal = yesterday
    expect(res.isComplete).toBe(true);
  });

  it('11. Payment Method Detection: UPI / GPay / Card', () => {
    const upiRes = VoiceTransactionParser.parse('Paid 120 for coffee via UPI', REF_DATE);
    expect(upiRes.paymentMethod).toBe('upi');

    const cardRes = VoiceTransactionParser.parse('Spent 2500 on dinner using card', REF_DATE);
    expect(cardRes.paymentMethod).toBe('card');
  });

  it('12. Incomplete command with missing amount requests clarification', () => {
    const res = VoiceTransactionParser.parse('I spent on lunch today', REF_DATE);

    expect(res.isComplete).toBe(false);
    expect(res.amountPaise).toBeNull();
    expect(res.missingFields).toContain('amount');
    expect(res.clarificationPrompt).toBeDefined();
    expect(res.confidence).toBeLessThan(0.5);
  });

  it('13. Non-transaction speech command handling', () => {
    const res = VoiceTransactionParser.parse('Hello how are you doing today', REF_DATE);

    expect(res.isComplete).toBe(false);
    expect(res.amountPaise).toBeNull();
    expect(res.confidence).toBeLessThan(0.5);
  });

  it('14. Decimal amounts: "Spent 49.50 on snacks"', () => {
    const res = VoiceTransactionParser.parse('Spent 49.50 on snacks', REF_DATE);

    expect(res.type).toBe('expense');
    expect(res.amountPaise).toBe(4950); // ₹49.50 = 4950 paise
    expect(res.categoryName).toBe('Food & Dining');
    expect(res.isComplete).toBe(true);
  });
});
