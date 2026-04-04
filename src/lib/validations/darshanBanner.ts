import { z } from 'zod';

const coerceNumber = z.coerce.number();
const coerceBoolean = z.coerce.boolean();

export const darshanBannerValidationSchema = z.object({
  titleEn: z.string().optional().nullable(),
  titleHi: z.string().optional().nullable(),
  subtitleEn: z.string().optional().nullable(),
  subtitleHi: z.string().optional().nullable(),
  templeId: coerceNumber.optional().nullable(),
  isActive: coerceBoolean.default(true),
});

export type DarshanBannerFormData = z.infer<typeof darshanBannerValidationSchema>;

export const updateDarshanBannerValidationSchema = darshanBannerValidationSchema.partial();
