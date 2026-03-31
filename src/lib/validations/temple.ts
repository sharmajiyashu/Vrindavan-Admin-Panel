import { z } from 'zod';

// Time regex that supports HH:mm (00:00 to 23:59) and HHmm
const timeRegex = /^([0-1]?[0-9]|2[0-3]):?([0-5][0-9])(\s?[AP]M)?$/i;

export const timingSchema = z.object({
  nameEn: z.string().min(1, 'Shift name is required'),
  nameHi: z.string().min(1, 'Shift name in Hindi is required'),
  startTime: z.string().regex(timeRegex, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(timeRegex, 'Invalid time format (HH:mm)')
});

export const templeValidationSchema = z.object({
  nameEn: z.string().min(1, 'Name in English is required'),
  nameHi: z.string().min(1, 'Name in Hindi is required'),
  addressEn: z.string().min(1, 'Address in English is required'),
  addressHi: z.string().min(1, 'Address in Hindi is required'),
  cityEn: z.string().min(1, 'City in English is required'),
  cityHi: z.string().min(1, 'City in Hindi is required'),
  stateEn: z.string().min(1, 'State in English is required'),
  stateHi: z.string().min(1, 'State in Hindi is required'),
  lat: z.coerce.number().min(-90).max(90),
  long: z.coerce.number().min(-180).max(180),
  descriptionEn: z.string().min(1, 'Description in English is required'),
  descriptionHi: z.string().min(1, 'Description in Hindi is required'),
  establishedEn: z.string().optional().nullable(),
  establishedHi: z.string().optional().nullable(),
  morningTimings: z.array(timingSchema).default([]),
  eveningTimings: z.array(timingSchema).default([]),
  bestTimeEn: z.string().optional().nullable(),
  bestTimeHi: z.string().optional().nullable(),
  historyEn: z.string().optional().nullable(),
  historyHi: z.string().optional().nullable(),
  isActive: z.coerce.boolean().default(true),
  imageIds: z.array(z.number()).optional().default([]),
  thumbnailId: z.number().optional().nullable(),
  documentaryVideoId: z.number().optional().nullable(),
  audioGuideEnId: z.number().optional().nullable(),
  audioGuideHiId: z.number().optional().nullable(),
});

export type TempleFormData = z.infer<typeof templeValidationSchema>;

export const updateTempleValidationSchema = templeValidationSchema.partial();
