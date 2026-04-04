import { z } from 'zod';

const coerceNumber = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return undefined;
  const num = Number(val);
  return isNaN(num) ? undefined : num;
}, z.number().optional().nullable());

export const couponValidationSchema = z.object({
  code: z.string().min(1, "Coupon code is required").max(50),
  discountType: z.enum(['flat', 'percentage']),
  discountValue: z.coerce.number().min(0, "Discount value is required"),
  expiryDate: z.string().optional().nullable().refine((val) => {
    if (!val) return true;
    return /^\d{4}-\d{2}-\d{2}/.test(val);
  }, "Expiry date must be in YYYY-MM-DD format"),
  maxUsage: z.coerce.number().optional().nullable(),
  tourId: z.coerce.number().optional().nullable(),
  isActive: z.boolean().default(true),
});

export type CouponFormData = z.infer<typeof couponValidationSchema>;

export const updateCouponValidationSchema = couponValidationSchema.partial();
