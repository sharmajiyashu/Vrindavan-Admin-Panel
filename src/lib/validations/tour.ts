import { z } from 'zod';

const coerceNumber = z.coerce.number();
const coerceBoolean = z.coerce.boolean();

export const tourValidationSchema = z.object({
  titleEn: z.string().min(1, 'Title in English is required'),
  titleHi: z.string().min(1, 'Title in Hindi is required'),

  price: coerceNumber.min(0),
  discountPrice: coerceNumber.min(0).optional().nullable(),
  pricePerPerson: coerceNumber.min(0).optional().nullable(),
  extraDiscountPerUser: coerceNumber.min(0).default(0),

  expertGuidanceEn: z.string().optional().nullable(),
  expertGuidanceHi: z.string().optional().nullable(),
  spiritualImmersionEn: z.string().optional().nullable(),
  spiritualImmersionHi: z.string().optional().nullable(),
  hassleFreePlanningEn: z.string().optional().nullable(),
  hassleFreePlanningHi: z.string().optional().nullable(),
  localInsightsEn: z.string().optional().nullable(),
  localInsightsHi: z.string().optional().nullable(),

  totalWalkMinutes: coerceNumber.optional().nullable(),
  distanceEn: z.string().optional().nullable(),
  distanceHi: z.string().optional().nullable(),
  approxTimeEn: z.string().optional().nullable(),
  approxTimeHi: z.string().optional().nullable(),
  recommendationEn: z.string().optional().nullable(),
  recommendationHi: z.string().optional().nullable(),

  isActive: coerceBoolean.default(true),

  templeIds: z.array(z.number()).default([]),
  imageIds: z.array(z.number()).optional().default([]),
  morningSlots: z.array(z.string()).default([]),
  eveningSlots: z.array(z.string()).default([]),
});

export type TourFormData = z.infer<typeof tourValidationSchema>;

export const updateTourValidationSchema = tourValidationSchema.partial();
