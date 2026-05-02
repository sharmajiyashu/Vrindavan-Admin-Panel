import { z } from "zod";

// Helper to coerce strings to numbers/booleans for multipart form data
const coerceNumber = z.coerce.number();
const coerceBoolean = z.preprocess((val) => {
  if (val === "" || val === undefined || val === null) return true;
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val === "true" || val === "1";
  return Boolean(val);
}, z.boolean());

const optionalCoerceId = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? null : val),
  z.coerce.number().nullable().optional()
);

// Time regex that supports HH:mm (00:00 to 23:59) and HHmm
const timeRegex = /^([0-1]?[0-9]|2[0-3]):?([0-5][0-9])(\s?[AP]M)?$/i;

const timingEntrySchema = z.object({
  nameEn: z.string().min(1, "Shift name is required"),
  nameHi: z.string().min(1, "Shift name in Hindi is required"),
  startTime: z.string().regex(timeRegex, "Invalid time format (HH:mm)"),
  endTime: z.string().regex(timeRegex, "Invalid time format (HH:mm)"),
});

const templeSchemaObject = z.object({
  nameEn: z.string().min(1, "Name in English is required"),
  nameHi: z.string().min(1, "Name in Hindi is required"),
  shortTitleEn: z.string().min(1, "Short title in English is required"),
  shortTitleHi: z.string().min(1, "Short title in Hindi is required"),
  addressEn: z.string().min(1, "Address in English is required"),
  addressHi: z.string().min(1, "Address in Hindi is required"),
  cityEn: z.string().min(1, "City in English is required"),
  cityHi: z.string().min(1, "City in Hindi is required"),
  stateEn: z.string().min(1, "State in English is required"),
  stateHi: z.string().min(1, "State in Hindi is required"),
  lat: coerceNumber.min(-90).max(90),
  long: coerceNumber.min(-180).max(180),
  establishedEn: z.string().optional().nullable(),
  establishedHi: z.string().optional().nullable(),

  morningTimings: z
    .preprocess((val) => {
      if (typeof val === "string") {
        if (!val || val === "[]") return [];
        try {
          return JSON.parse(val) as unknown;
        } catch {
          return [];
        }
      }
      return val;
    }, z.array(timingEntrySchema))
    .default([]),

  eveningTimings: z
    .preprocess((val) => {
      if (typeof val === "string") {
        if (!val || val === "[]") return [];
        try {
          return JSON.parse(val) as unknown;
        } catch {
          return [];
        }
      }
      return val;
    }, z.array(timingEntrySchema))
    .default([]),

  imageIds: z
    .preprocess((val) => {
      if (typeof val === "string") {
        if (!val || val === "[]") return [];
        try {
          return JSON.parse(val) as unknown;
        } catch {
          return [];
        }
      }
      return val;
    }, z.array(z.number()))
    .default([]),

  thumbnailId: optionalCoerceId,
  audioGuideEnId: optionalCoerceId,
  audioGuideHiId: optionalCoerceId,
  documentaryVideoId: optionalCoerceId,
  audioGuideUrlEn: z.string().url().optional().nullable().or(z.literal("")),
  audioGuideUrlHi: z.string().url().optional().nullable().or(z.literal("")),
  documentaryVideoUrl: z.string().url().optional().nullable().or(z.literal("")),
  documentaryTitleEn: z.string().optional().nullable(),
  documentaryTitleHi: z.string().optional().nullable(),
  documentarySubtitleEn: z.string().optional().nullable(),
  documentarySubtitleHi: z.string().optional().nullable(),

  bestTimeEn: z.string().trim().min(1, "Best time in English is required"),
  bestTimeHi: z.string().trim().min(1, "Best time in Hindi is required"),
  bestTimeDetailEn: z.string().trim().min(1, "Best time detail in English is required"),
  bestTimeDetailHi: z.string().trim().min(1, "Best time detail in Hindi is required"),
  historyEn: z.string().optional().nullable(),
  historyHi: z.string().optional().nullable(),

  sortOrder: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? 0 : val),
    z.coerce.number()
  ).default(0),

  isActive: coerceBoolean.default(true),
  showDarshan: coerceBoolean.default(false),
});

const templeRefinement = (data: any, ctx: z.RefinementCtx) => {
  const checkPair = (en: any, hi: any, basePath: string) => {
    const hasEn = !!en?.trim();
    const hasHi = !!hi?.trim();
    if (hasEn !== hasHi) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Hindi and English must both be provided if one is filled.", path: [hasEn ? `${basePath}Hi` : `${basePath}En`] });
    }
  };
  checkPair(data.establishedEn, data.establishedHi, "established");
  checkPair(data.historyEn, data.historyHi, "history");
  checkPair(data.documentaryTitleEn, data.documentaryTitleHi, "documentaryTitle");
  checkPair(data.documentarySubtitleEn, data.documentarySubtitleHi, "documentarySubtitle");
};

export const templeValidationSchema = templeSchemaObject.superRefine(templeRefinement);

export type TempleFormData = z.infer<typeof templeValidationSchema>;

export const updateTempleValidationSchema = templeSchemaObject.partial().superRefine(templeRefinement);
