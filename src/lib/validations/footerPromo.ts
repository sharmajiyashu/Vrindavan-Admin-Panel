import { z } from "zod";

const coerceNumber = z.coerce.number();
const coerceBoolean = z.coerce.boolean();

function emptyToUndefined(v: unknown): unknown {
  return v === "" ? undefined : v;
}

function boolFromMultipart(v: unknown): unknown {
  if (v === "" || v === undefined) return undefined;
  if (typeof v === "boolean") return v;
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  return v;
}

const optionalText = z.preprocess(emptyToUndefined, z.string().optional().nullable());

const optionalTourId = z.preprocess(emptyToUndefined, coerceNumber.optional().nullable());

/** Matches admin `footerPromoValidationSchema` (multipart body). */
export const footerPromoValidationSchema = z.object({
  titleEn: optionalText,
  titleHi: optionalText,
  subtitleEn: optionalText,
  subtitleHi: optionalText,
  tourId: optionalTourId,
  showTimes: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1, "Show times must be at least 1").default(1)
  ),
  sortOrder: z.preprocess(emptyToUndefined, coerceNumber.default(0)),
  isActive: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : boolFromMultipart(v)),
    coerceBoolean.default(true)
  ),
});

export type FooterPromoFormData = z.infer<typeof footerPromoValidationSchema>;

/** Matches admin `updateFooterPromoValidationSchema`. */
export const updateFooterPromoValidationSchema = z.object({
  titleEn: optionalText,
  titleHi: optionalText,
  subtitleEn: optionalText,
  subtitleHi: optionalText,
  tourId: optionalTourId,
  showTimes: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1, "Show times must be at least 1").optional()
  ),
  sortOrder: z.preprocess(emptyToUndefined, coerceNumber.optional().nullable()),
  isActive: z.preprocess(boolFromMultipart, z.boolean().optional()),
});

export type FooterPromoUpdateFormData = z.infer<typeof updateFooterPromoValidationSchema>;

/** Matches admin `footerPromoListQuerySchema` (query string). */
export const footerPromoListQuerySchema = z.object({
  page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).default(1)),
  limit: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(100).default(10)),
});

export function toFooterPromoMultipartBody(data: FooterPromoFormData): Record<string, string | boolean> {
  const body: Record<string, string | boolean> = {
    isActive: data.isActive,
    sortOrder: String(data.sortOrder ?? 0),
    showTimes: String(data.showTimes ?? 1),
  };
  if (data.titleEn != null && data.titleEn !== "") body.titleEn = data.titleEn;
  if (data.titleHi != null && data.titleHi !== "") body.titleHi = data.titleHi;
  if (data.subtitleEn != null && data.subtitleEn !== "") body.subtitleEn = data.subtitleEn;
  if (data.subtitleHi != null && data.subtitleHi !== "") body.subtitleHi = data.subtitleHi;
  if (data.tourId != null) body.tourId = String(data.tourId);
  return body;
}
