import { Paise, TransactionType } from '@/types';
import { addDays, formatUtcDate, parseDateParts } from './dateUtils';
import { parseInrToPaise } from '@/utils';
import { DEFAULT_CATEGORIES } from '@/database/seeds/defaultCategories';

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'bank';

export interface ParsedVoiceCommand {
  rawText: string;
  type: TransactionType;
  amountPaise: Paise | null;
  description: string;
  categoryName: string | null;
  categoryId: string | null;
  transactionDate: string; // ISO8601 YYYY-MM-DD
  paymentMethod?: PaymentMethod | null;
  confidence: number; // 0.0 to 1.0
  isComplete: boolean;
  missingFields: ('amount' | 'description' | 'date')[];
  clarificationPrompt?: string;
}

export interface CategoryKeywordConfig {
  categoryId: string;
  categoryName: string;
  type: TransactionType;
  keywords: string[];
}

export class VoiceTransactionParser {
  private static categoryConfigs: CategoryKeywordConfig[] = [
    {
      categoryId: 'cat-groceries-001',
      categoryName: 'Groceries',
      type: 'expense',
      keywords: [
        'groceries',
        'grocery',
        'supermarket',
        'vegetables',
        'vegetable',
        'fruits',
        'fruit',
        'milk',
        'bread',
        'ration',
        'kirana',
        'sabzi',
        'sabji',
        'dal',
        'atta',
        'oil',
      ],
    },
    {
      categoryId: 'cat-dining-002',
      categoryName: 'Food & Dining',
      type: 'expense',
      keywords: [
        'lunch',
        'dinner',
        'breakfast',
        'food',
        'dining',
        'restaurant',
        'cafe',
        'coffee',
        'snack',
        'snacks',
        'burger',
        'pizza',
        'swiggy',
        'zomato',
        'chai',
        'tea',
        'khana',
        'nashta',
        'biryani',
        'sweets',
        'mithai',
      ],
    },
    {
      categoryId: 'cat-housing-003',
      categoryName: 'Housing & Rent',
      type: 'expense',
      keywords: [
        'rent',
        'maintenance',
        'society',
        'landlord',
        'kiraya',
        'makan',
        'flat',
        'house',
        'brokerage',
      ],
    },
    {
      categoryId: 'cat-utilities-004',
      categoryName: 'Bills & Utilities',
      type: 'expense',
      keywords: [
        'electricity',
        'electric',
        'current bill',
        'bijli',
        'water',
        'wifi',
        'internet',
        'broadband',
        'recharge',
        'mobile',
        'phone bill',
        'gas',
        'cylinder',
        'lpg',
        'dth',
        'cable',
      ],
    },
    {
      categoryId: 'cat-transport-005',
      categoryName: 'Transport & Fuel',
      type: 'expense',
      keywords: [
        'petrol',
        'diesel',
        'fuel',
        'metro',
        'cab',
        'taxi',
        'uber',
        'ola',
        'auto',
        'bus',
        'train',
        'flight',
        'toll',
        'parking',
        'rickshaw',
        'gaadi',
        'rapido',
        'ride',
      ],
    },
    {
      categoryId: 'cat-shopping-006',
      categoryName: 'Shopping',
      type: 'expense',
      keywords: [
        'shoes',
        'shoe',
        'clothes',
        'cloth',
        'dress',
        'shirt',
        'jeans',
        'shopping',
        'amazon',
        'flipkart',
        'myntra',
        'bag',
        'electronics',
        'gadget',
        'watch',
        'kapde',
        'joota',
        'joote',
      ],
    },
    {
      categoryId: 'cat-health-007',
      categoryName: 'Health & Medical',
      type: 'expense',
      keywords: [
        'medicine',
        'medicines',
        'doctor',
        'hospital',
        'clinic',
        'pharmacy',
        'medical',
        'tablets',
        'dawa',
        'dawai',
        'checkup',
        'dentist',
      ],
    },
    {
      categoryId: 'cat-entertainment-008',
      categoryName: 'Entertainment',
      type: 'expense',
      keywords: [
        'movie',
        'movies',
        'cinema',
        'theatre',
        'netflix',
        'spotify',
        'hotstar',
        'prime',
        'game',
        'gaming',
        'concert',
        'show',
        'film',
      ],
    },
    {
      categoryId: 'cat-personal-009',
      categoryName: 'Personal Care',
      type: 'expense',
      keywords: ['salon', 'haircut', 'spa', 'gym', 'grooming', 'barber', 'parlour'],
    },
    // Income Categories
    {
      categoryId: 'cat-salary-101',
      categoryName: 'Salary',
      type: 'income',
      keywords: ['salary', 'stipend', 'paycheck', 'tankha', 'tanha', 'vetan'],
    },
    {
      categoryId: 'cat-freelance-102',
      categoryName: 'Freelance & Consulting',
      type: 'income',
      keywords: [
        'freelance',
        'freelancing',
        'consulting',
        'client',
        'project',
        'contract',
        'side gig',
        'gig',
      ],
    },
    {
      categoryId: 'cat-investments-103',
      categoryName: 'Investments & Dividends',
      type: 'income',
      keywords: [
        'dividend',
        'dividends',
        'interest',
        'stock',
        'stocks',
        'mutual fund',
        'crypto',
        'sip',
        'returns',
      ],
    },
    {
      categoryId: 'cat-other-income-104',
      categoryName: 'Other Income',
      type: 'income',
      keywords: ['gift', 'cashback', 'bonus', 'refund', 'dost se mile'],
    },
  ];

  /**
   * Parses natural language spoken transaction text into a deterministic transaction proposal.
   */
  static parse(text: string, referenceDate?: string): ParsedVoiceCommand {
    const raw = text.trim();
    const today = referenceDate ?? new Date().toISOString().slice(0, 10);

    if (!raw) {
      return {
        rawText: text,
        type: 'expense',
        amountPaise: null,
        description: '',
        categoryName: null,
        categoryId: null,
        transactionDate: today,
        confidence: 0,
        isComplete: false,
        missingFields: ['amount', 'description'],
        clarificationPrompt: 'Please speak an expense or income statement.',
      };
    }

    const lower = raw.toLowerCase();

    // 1. Detect Payment Method
    const paymentMethod = this.detectPaymentMethod(lower);

    // 2. Detect Date
    const transactionDate = this.detectDate(lower, today);

    // 3. Detect Transaction Type (Income vs Expense)
    const type = this.detectType(lower);

    // 4. Detect Amount
    const amountPaise = this.detectAmount(lower);

    // 5. Detect Category
    const categoryMatch = this.detectCategory(lower, type);

    // 6. Extract Clean Description
    const description = this.extractDescription(lower, categoryMatch?.categoryName);


    // Check missing fields & completeness
    const missingFields: ('amount' | 'description' | 'date')[] = [];
    if (amountPaise === null || amountPaise <= 0) {
      missingFields.push('amount');
    }
    if (!description) {
      missingFields.push('description');
    }

    const isComplete = missingFields.length === 0;

    // Calculate confidence score
    let confidence = 0.5;
    if (amountPaise !== null && amountPaise > 0) confidence += 0.25;
    if (categoryMatch) confidence += 0.15;
    if (description) confidence += 0.1;
    if (!isComplete) confidence = Math.min(confidence, 0.4);

    let clarificationPrompt: string | undefined;
    if (!isComplete) {
      if (missingFields.includes('amount')) {
        clarificationPrompt = 'Could not detect the transaction amount. Please specify how much.';
      } else if (missingFields.includes('description')) {
        clarificationPrompt = 'Could not detect the description. Please specify what this was for.';
      }
    }

    return {
      rawText: raw,
      type,
      amountPaise,
      description: description || (categoryMatch?.categoryName ?? 'Voice Transaction'),
      categoryName: categoryMatch?.categoryName ?? null,
      categoryId: categoryMatch?.categoryId ?? null,
      transactionDate,
      paymentMethod,
      confidence: Math.round(confidence * 100) / 100,
      isComplete,
      missingFields,
      clarificationPrompt,
    };
  }

  /**
   * Detects payment method keywords (cash, upi, card, bank)
   */
  private static detectPaymentMethod(text: string): PaymentMethod | null {
    if (/\b(cash|nakad|hath me)\b/.test(text)) {
      return 'cash';
    }
    if (/\b(upi|gpay|google pay|phonepe|paytm|bhim|scanner)\b/.test(text)) {
      return 'upi';
    }
    if (/\b(card|credit card|debit card|visa|mastercard)\b/.test(text)) {
      return 'card';
    }
    if (/\b(bank|netbanking|neft|imps|transfer)\b/.test(text)) {
      return 'bank';
    }
    return null;
  }

  /**
   * Detects transaction date (today, yesterday, day before yesterday, relative weekday, or explicit dates)
   */
  private static detectDate(text: string, today: string): string {
    // Yesterday / Kal (in past tense context)
    if (/\b(yesterday|kal|beeta kal)\b/.test(text)) {
      return addDays(today, -1);
    }

    // Day before yesterday / Parso
    if (/\b(day before yesterday|parso)\b/.test(text)) {
      return addDays(today, -2);
    }

    // Explicit Month Date (e.g. "3 November", "3rd Nov", "November 3", "Nov 3rd")
    const monthNames = [
      'january|jan',
      'february|feb',
      'march|mar',
      'april|apr',
      'may',
      'june|jun',
      'july|jul',
      'august|aug',
      'september|sep|sept',
      'october|oct',
      'november|nov',
      'december|dec',
    ];

    for (let m = 0; m < monthNames.length; m++) {
      const monthPattern = monthNames[m]!;
      // Match "3 November" or "3rd November" or "on 3 November"
      const dayFirstRegex = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${monthPattern})\\b`, 'i');
      const dayFirstMatch = text.match(dayFirstRegex);
      if (dayFirstMatch && dayFirstMatch[1]) {
        const day = parseInt(dayFirstMatch[1], 10);
        const { year } = parseDateParts(today);
        return formatUtcDate(year, m + 1, day);
      }

      // Match "November 3" or "Nov 3rd"
      const monthFirstRegex = new RegExp(`\\b(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i');
      const monthFirstMatch = text.match(monthFirstRegex);
      if (monthFirstMatch && monthFirstMatch[2]) {
        const day = parseInt(monthFirstMatch[2], 10);
        const { year } = parseDateParts(today);
        return formatUtcDate(year, m + 1, day);
      }
    }

    // Explicit ISO Date (YYYY-MM-DD or DD-MM-YYYY)
    const isoMatch = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    if (isoMatch) {
      return isoMatch[0];
    }

    // Relative Weekday: "last sunday", "last monday", etc.
    const weekdays: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    for (const [dayName, targetDay] of Object.entries(weekdays)) {
      const regex = new RegExp(`\\b(?:last|previous|beete)\\s+${dayName}\\b`, 'i');
      if (regex.test(text)) {
        const { year, month, day } = parseDateParts(today);
        const todayUtc = new Date(Date.UTC(year, month - 1, day));
        const currentDay = todayUtc.getUTCDay();
        let diff = (currentDay - targetDay + 7) % 7;
        if (diff === 0) diff = 7; // "last Sunday" means 7 days ago if today is Sunday
        return addDays(today, -diff);
      }
    }

    // Default to today
    return today;
  }

  /**
   * Detects income vs expense classification
   */
  private static detectType(text: string): TransactionType {
    const incomeSignals = [
      'received',
      'got',
      'earned',
      'credited',
      'salary',
      'stipend',
      'freelance',
      'freelancing',
      'income',
      'dividend',
      'interest',
      'refund',
      'cashback',
      'mila',
      'mile',
      'aaye',
      'aaya',
      'kamaya',
    ];

    for (const signal of incomeSignals) {
      if (new RegExp(`\\b${signal}\\b`, 'i').test(text)) {
        return 'income';
      }
    }

    return 'expense';
  }

  /**
   * Detects numeric monetary amount and converts to integer paise.
   */
  private static detectAmount(text: string): Paise | null {
    // 1. Patterns with currency indicators:
    // e.g., "500 rupees", "rs 500", "rs. 500", "inr 500", "₹500", "500 rupay", "500 rs", "500 bucks"
    const currencyRegexes = [
      /(?:rs\.?|inr|₹|rupees|rupay|rupaye|bucks)\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)/i,
      /([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)\s*(?:rs\.?|inr|₹|rupees|rupay|rupaye|bucks)/i,
      /(?:spent|paid|received|for|of|add|cost)\s+([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)/i,
    ];

    for (const reg of currencyRegexes) {
      const match = text.match(reg);
      if (match && match[1]) {
        try {
          return parseInrToPaise(match[1]);
        } catch {
          // continue fallback
        }
      }
    }

    // 2. Generic standalone number fallback if not a date number
    const words = text.split(/\s+/);
    for (const w of words) {
      const cleaned = w.replace(/,/g, '');
      if (/^[0-9]+(?:\.[0-9]{1,2})?$/.test(cleaned)) {
        const val = parseFloat(cleaned);
        // Exclude year numbers like 2026 or small single digits that might be dates (if not prefixed by price)
        if (val > 0 && val !== 2026 && val !== 2025 && val !== 2027) {
          try {
            return parseInrToPaise(cleaned);
          } catch {
            // continue
          }
        }
      }
    }

    return null;
  }

  /**
   * Matches configured category keywords
   */
  private static detectCategory(
    text: string,
    type: TransactionType
  ): { categoryId: string; categoryName: string } | null {
    // Match based on category keywords
    for (const config of this.categoryConfigs) {
      for (const kw of config.keywords) {
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        if (regex.test(text)) {
          return {
            categoryId: config.categoryId,
            categoryName: config.categoryName,
          };
        }
      }
    }

    // Default fallback based on type
    if (type === 'income') {
      const defaultIncome = DEFAULT_CATEGORIES.find((c) => c.type === 'income');
      return defaultIncome
        ? { categoryId: defaultIncome.id, categoryName: defaultIncome.name }
        : null;
    }

    const defaultExpense = DEFAULT_CATEGORIES.find((c) => c.id === 'cat-dining-002') ?? DEFAULT_CATEGORIES[0];
    return defaultExpense
      ? { categoryId: defaultExpense.id, categoryName: defaultExpense.name }
      : null;
  }

  /**
   * Cleans text to extract readable transaction description
   */
  private static extractDescription(
    lower: string,
    detectedCategoryName?: string
  ): string {
    // Remove filler noise words, amounts, dates, and payment methods
    let cleaned = lower;

    // Remove amounts & currency
    cleaned = cleaned.replace(/(?:rs\.?|inr|₹|rupees|rupay|rupaye|bucks)\s*[0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?/gi, ' ');
    cleaned = cleaned.replace(/[0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?\s*(?:rs\.?|inr|₹|rupees|rupay|rupaye|bucks)?/gi, ' ');

    // Remove common voice prefix fillers
    const fillerPatterns = [
      /\bi spent\b/gi,
      /\bi paid\b/gi,
      /\bi received\b/gi,
      /\bi got\b/gi,
      /\bi bought\b/gi,
      /\badd\b/gi,
      /\breceived\b/gi,
      /\bspent\b/gi,
      /\bpaid\b/gi,
      /\bfrom\b/gi,
      /\busing cash\b/gi,
      /\bby cash\b/gi,
      /\bin cash\b/gi,
      /\busing card\b/gi,
      /\bvia upi\b/gi,
      /\btoday\b/gi,
      /\byesterday\b/gi,
      /\blast sunday\b/gi,
      /\blast monday\b/gi,
      /\blast saturday\b/gi,
      /\bfor\b/gi,
      /\bon\b/gi,
      /\bme\b/gi,
      /\bpe\b/gi,
      /\bse\b/gi,
      /\bko\b/gi,
      /\bkharcha hua\b/gi,
      /\bkharch kiye\b/gi,
      /\bdiye\b/gi,
      /\bdiya\b/gi,
      /\bmila\b/gi,
      /\bmiley\b/gi,
      /\bmile\b/gi,
      /\baaye\b/gi,
      /\baaya\b/gi,
      /\bkal\b/gi,
      /\baaj\b/gi,
      /\bparso\b/gi,
      /\busing\b/gi,
      /\bcash\b/gi,
      /\bupi\b/gi,
      /\bcard\b/gi,
    ];

    for (const pat of fillerPatterns) {
      cleaned = cleaned.replace(pat, ' ');
    }

    // Clean whitespace and punctuation
    cleaned = cleaned.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ').replace(/\s+/g, ' ').trim();

    if (!cleaned && detectedCategoryName) {
      return detectedCategoryName;
    }

    // Capitalize first letter
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
}
