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

const mediaObjectSchema = z.object({
  id: z.number(),
  url: z.string(),
  mimetype: z.string().optional(),
  type: z.string().optional(),
  size: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
}).optional().nullable();

// Define the base schema without refinements to allow `.partial()`
export const tourBaseSchema = z.object({
  titleEn: z.string().min(1, 'Title in English is required'),
  titleHi: z.string().min(1, 'Title in Hindi is required'),

  subtitleEn: z.string().optional().nullable(),
  subtitleHi: z.string().optional().nullable(),

  subtextEn: z.string().optional().nullable(),
  subtextHi: z.string().optional().nullable(),

  locationNameEn: z.string().optional().nullable(),
  locationNameHi: z.string().optional().nullable(),
  lat: coerceNumber.optional().nullable(),
  long: coerceNumber.optional().nullable(),

  badgeEn: z.string().optional().nullable(),
  badgeHi: z.string().optional().nullable(),

  price: coerceNumber.min(0),
  slashedPrice: coerceNumber.min(0).optional().nullable(),
  offerText: z.string().optional().nullable(),
  discountConfig: z.object({
    type: z.enum(['flat', 'percentage', 'flat_above']),
    value: coerceNumber,
    code: z.string(),
    minAmount: coerceNumber.optional(),
  }).optional().nullable(),

  extraDiscountPerUser: coerceNumber.min(0).default(0),

  templesCoveredCount: coerceNumber.optional().nullable(),
  durationEn: z.string().optional().nullable(),
  durationHi: z.string().optional().nullable(),

  startingAddressEn: z.string().optional().nullable(),
  startingAddressHi: z.string().optional().nullable(),

  shortHighlightListing: z.object({
    titleEn: z.string().optional().nullable(),
    titleHi: z.string().optional().nullable(),
    iconId: z.number().optional().nullable(),
    icon: mediaObjectSchema,
  }).optional().nullable(),
  shortHighlightDetails: z.object({
    titleEn: z.string().optional().nullable(),
    titleHi: z.string().optional().nullable(),
    iconId: z.number().optional().nullable(),
    icon: mediaObjectSchema,
  }).optional().nullable(),

  showOnReferralApp: coerceBoolean.default(false),
  referralTourSummaryEn: z.string().optional().nullable(),
  referralTourSummaryHi: z.string().optional().nullable(),
  referralAmount: coerceNumber.min(0).default(0),

  customerPickupLines: z.preprocess(jsonArrayPreprocess, z.array(z.string())).default([]),

  features: z.preprocess(jsonArrayPreprocess, z.array(z.object({
    iconId: z.number().optional().nullable(),
    icon: mediaObjectSchema,
    titleEn: z.string(),
    titleHi: z.string(),
    descriptionEn: z.string(),
    descriptionHi: z.string(),
  }))).default([]),

  itinerary: z.preprocess(jsonArrayPreprocess, z.array(z.object({
    imageId: z.number().optional().nullable(),
    image: mediaObjectSchema,
    titleEn: z.string(),
    titleHi: z.string(),
    descriptionEn: z.string(),
    descriptionHi: z.string(),
  }))).default([]),

  faqs: z.preprocess(jsonArrayPreprocess, z.array(z.object({
    questionEn: z.string(),
    questionHi: z.string(),
    answerEn: z.string(),
    answerHi: z.string(),
  }))).default([]),

  totalWalkMinutes: coerceNumber.optional().nullable(),
  distanceEn: z.string().optional().nullable(),
  distanceHi: z.string().optional().nullable(),
  approxTimeEn: z.string().optional().nullable(),
  approxTimeHi: z.string().optional().nullable(),
  recommendationEn: z.string().optional().nullable(),
  recommendationHi: z.string().optional().nullable(),



  cancellationBeforeHours: coerceNumber.default(24),
  shareDetailsBeforeHours: coerceNumber.default(2),
  guideDetailsBeforeHours: coerceNumber.default(24),
  slotDeadlineHours: coerceNumber.default(2),

  type: z.enum(['group', 'private']).default('group'),
  minPersons: coerceNumber.optional().nullable(),
  maxPersons: coerceNumber.optional().nullable(),

  isActive: coerceBoolean.default(true),
  isVerified: coerceBoolean.default(false),

  imageIds: z.preprocess(jsonArrayPreprocess, z.array(z.number())).optional().default([]),

  // Slots & Reviews management in form
  slots: z.array(z.object({
    id: z.number().optional(),
    date: z.string(),
    startTime: z.string(),
    slotDeadlineHours: z.number().default(2),
    cancellationDeadlineHours: z.number().default(2),
    guidePhoneNumber: z.string().optional().nullable(),
    alternateNumber: z.string().optional().nullable(),
  })).optional().default([]),

  reviews: z.array(z.object({
    id: z.number().optional(),
    userName: z.string(),
    date: z.string().optional(),
    rating: z.number().min(1).max(5),
    reviewText: z.string(),
    isAdminAdded: z.boolean().default(true),
  })).optional().default([]),
});

// Refine the full schema for creation/full validation (currently no refinements needed)
export const tourValidationSchema = tourBaseSchema;

export type TourFormData = z.infer<typeof tourValidationSchema>;

// Use .partial() on the base schema, NOT the refined one
export const updateTourValidationSchema = tourBaseSchema.partial();
