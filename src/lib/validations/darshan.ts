import { z } from 'zod';

const coerceNumber = z.coerce.number();

export const darshanValidationSchema = z.object({
  templeId: coerceNumber.min(1, 'Please select a temple'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  descriptionEn: z.string().optional().nullable(),
  descriptionHi: z.string().optional().nullable(),
});

export type DarshanFormData = z.infer<typeof darshanValidationSchema>;

export const updateDarshanValidationSchema = darshanValidationSchema.partial();
