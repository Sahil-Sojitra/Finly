import { z } from 'zod';

export const transactionFormSchema = z.object({
  type: z.enum(['expense', 'income']),
  amountInr: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => {
      const cleaned = val.replace(/[₹,\s]/g, '');
      const num = parseFloat(cleaned);
      return !isNaN(num) && num > 0;
    }, 'Amount must be greater than zero'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(100, 'Description cannot exceed 100 characters'),
  categoryId: z.string().min(1, 'Please select a category'),
  transactionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  notes: z
    .string()
    .max(300, 'Notes cannot exceed 300 characters')
    .optional()
    .or(z.literal('')),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

