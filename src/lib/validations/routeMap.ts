import { z } from 'zod';

const coerceNumber = z.coerce.number();
const coerceBoolean = z.coerce.boolean();

export const routeMapValidationSchema = z.object({
  nameEn: z.string().min(1, 'Name in English is required'),
  nameHi: z.string().min(1, 'Name in Hindi is required'),
  subtitleEn: z.string().optional().nullable(),
  subtitleHi: z.string().optional().nullable(),

  totalDistanceEn: z.string().optional().nullable(),
  totalDistanceHi: z.string().optional().nullable(),

  approxTimeEn: z.string().optional().nullable(),
  approxTimeHi: z.string().optional().nullable(),

  recommendationEn: z.string().optional().nullable(),
  recommendationHi: z.string().optional().nullable(),

  isActive: coerceBoolean.default(true),

  temples: z.array(z.object({
    templeId: coerceNumber,
    sortOrder: coerceNumber.default(0),
    distanceFromPreviousEn: z.string().optional().nullable(),
    distanceFromPreviousHi: z.string().optional().nullable(),
    timeFromPreviousEn: z.string().optional().nullable(),
    timeFromPreviousHi: z.string().optional().nullable(),
  })).default([]),

});

export type RouteMapFormData = z.infer<typeof routeMapValidationSchema>;

export const updateRouteMapValidationSchema = routeMapValidationSchema.partial();
