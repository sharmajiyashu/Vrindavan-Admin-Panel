import { z } from 'zod';

const coerceNumber = z.coerce.number();
const coerceBoolean = z.coerce.boolean();

const jsonArrayPreprocess = (val: any) => {
  if (typeof val === 'string') {
    if (!val || val === '[]') return [];
    try { return JSON.parse(val); } catch (e) { return []; }
  }
  return val;
};

// Define the base schema without refinements to allow `.partial()`
export const tourBaseSchema = z.object({
  titleEn: z.string().min(1, 'Title in English is required'),
  titleHi: z.string().min(1, 'Title in Hindi is required'),

  descriptionEn: z.string().optional().nullable(),
  descriptionHi: z.string().optional().nullable(),

  badgeEn: z.string().optional().nullable(),
  badgeHi: z.string().optional().nullable(),

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

  cancellationBeforeHours: coerceNumber.default(24),
  guideDetailsBeforeHours: coerceNumber.default(24),

  cancellationPolicyEn: z.string().optional().nullable(),
  cancellationPolicyHi: z.string().optional().nullable(),

  type: z.enum(['group', 'private']).default('group'),
  minPersons: coerceNumber.optional().nullable(),
  maxPersons: coerceNumber.optional().nullable(),

  isActive: coerceBoolean.default(true),

  templeIds: z.preprocess(jsonArrayPreprocess, z.array(z.number())).default([]),
  imageIds: z.preprocess(jsonArrayPreprocess, z.array(z.number())).optional().default([]),
  morningSlots: z.preprocess(jsonArrayPreprocess, z.array(z.string())).default([]),
  eveningSlots: z.preprocess(jsonArrayPreprocess, z.array(z.string())).default([]),
});

// Refine the full schema for creation/full validation
export const tourValidationSchema = tourBaseSchema.refine(data => {
  if (data.type === 'private') {
    return data.minPersons != null && data.maxPersons != null;
  }
  return true;
}, {
  message: "Private tours must have min and max persons allowed",
  path: ["type"]
});

export type TourFormData = z.infer<typeof tourValidationSchema>;

// Use .partial() on the base schema, NOT the refined one
export const updateTourValidationSchema = tourBaseSchema.partial();
