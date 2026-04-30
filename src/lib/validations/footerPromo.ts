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
  linkType: z.preprocess(emptyToUndefined, z.enum(["tour", "whatsapp"]).default("tour")),
  tourId: optionalTourId,
  whatsappUrl: optionalText,
  buttonNameEn: z.preprocess(emptyToUndefined, z.string().min(1, "Button Name (English) is required")),
  buttonNameHi: z.preprocess(emptyToUndefined, z.string().min(1, "Button Name (Hindi) is required")),
  showTimes: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1, "Show times must be at least 1").default(1)
  ),
  isActive: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : boolFromMultipart(v)),
    coerceBoolean.default(true)
  ),
}).superRefine((data, ctx) => {
  const hasEn = !!data.buttonNameEn?.trim();
  const hasHi = !!data.buttonNameHi?.trim();
  if (hasEn !== hasHi) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Hindi and English must both be provided if one is filled.", path: [hasEn ? "buttonNameHi" : "buttonNameEn"] });
  }
});

export type FooterPromoFormData = z.infer<typeof footerPromoValidationSchema>;

/** Matches admin `updateFooterPromoValidationSchema`. */
export const updateFooterPromoValidationSchema = z.object({
  linkType: z.preprocess(emptyToUndefined, z.enum(["tour", "whatsapp"]).optional()),
  tourId: optionalTourId,
  whatsappUrl: optionalText,
  buttonNameEn: optionalText,
  buttonNameHi: optionalText,
  showTimes: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1, "Show times must be at least 1").optional()
  ),
  isActive: z.preprocess(boolFromMultipart, z.boolean().optional()),
}).superRefine((data, ctx) => {
  const hasEn = !!data.buttonNameEn?.trim();
  const hasHi = !!data.buttonNameHi?.trim();
  if (hasEn !== hasHi) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Hindi and English must both be provided if one is filled.", path: [hasEn ? "buttonNameHi" : "buttonNameEn"] });
  }
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
    showTimes: String(data.showTimes ?? 1),
    linkType: data.linkType,
    buttonNameEn: (data.buttonNameEn ?? "").trim(),
    buttonNameHi: (data.buttonNameHi ?? "").trim(),
  };

  if (data.linkType === "tour") {
    body.tourId = data.tourId != null ? String(data.tourId) : "";
  } else {
    body.whatsappUrl = (data.whatsappUrl ?? "").trim();
  }

  return body;
}
