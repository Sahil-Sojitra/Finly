import { z } from 'zod';

export const salaryCycleFormSchema = z.object({
  salaryAmountInr: z
    .string()
    .min(1, 'Salary amount is required')
    .refine((val) => {
      const cleaned = val.replace(/[₹,\s]/g, '');
      const num = parseFloat(cleaned);
      return !isNaN(num) && num > 0;
    }, 'Salary amount must be greater than zero'),
  receivedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Received date must be in YYYY-MM-DD format'),
  expectedNextDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected next date must be in YYYY-MM-DD format')
    .optional()
    .or(z.literal('')),
  openingBalanceInr: z
    .string()
    .optional()
    .or(z.literal('')),
});

export type SalaryCycleFormValues = z.infer<typeof salaryCycleFormSchema>;

