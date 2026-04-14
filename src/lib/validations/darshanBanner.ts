import { z } from "zod";

const coerceNumber = z.coerce.number();
const coerceBoolean = z.coerce.boolean();

/** FormData often sends `""` for untouched fields; treat as missing. */
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

export const darshanBannerValidationSchema = z
  .object({
    isActive: z.preprocess(
      (v) => (v === "" || v === undefined ? undefined : boolFromMultipart(v)),
      coerceBoolean.default(true)
    ),
    linkType: z.preprocess(emptyToUndefined, z.enum(["tour", "whatsapp"])),
    tourId: z.preprocess(emptyToUndefined, coerceNumber.optional().nullable()),
    whatsappUrl: z.preprocess(
      (v) => (v === "" || v === undefined || v === null ? undefined : String(v).trim()),
      z.string().optional().nullable()
    ),
    buttonNameEn: z.preprocess(
      (v) => (v === "" || v === undefined || v === null ? undefined : String(v).trim()),
      z.string().optional().nullable()
    ),
    buttonNameHi: z.preprocess(
      (v) => (v === "" || v === undefined || v === null ? undefined : String(v).trim()),
      z.string().optional().nullable()
    ),
  })
  .superRefine((data, ctx) => {
    if (data.linkType === "tour") {
      if (data.tourId == null || Number.isNaN(Number(data.tourId)) || Number(data.tourId) < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tour ID is required when link type is tour",
          path: ["tourId"],
        });
      }
    } else {
      const w = (data.whatsappUrl ?? "").trim();
      if (w.length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "WhatsApp URL is required (e.g. https://wa.me/...)",
          path: ["whatsappUrl"],
        });
      }
    }
  });

export type DarshanBannerFormData = z.infer<typeof darshanBannerValidationSchema>;

/**
 * Partial update for multipart: empty strings become omitted so image-only updates validate.
 * tourId / whatsapp rules apply only when linkType is explicitly sent.
 */
export const updateDarshanBannerValidationSchema = z
  .object({
    isActive: z.preprocess(boolFromMultipart, z.boolean().optional()),
    linkType: z.preprocess(emptyToUndefined, z.enum(["tour", "whatsapp"]).optional()),
    tourId: z.preprocess(emptyToUndefined, coerceNumber.optional().nullable()),
    whatsappUrl: z.preprocess(
      (v) => (v === "" || v === undefined || v === null ? undefined : String(v).trim()),
      z.string().optional().nullable()
    ),
    buttonNameEn: z.preprocess(
      (v) => (v === "" || v === undefined || v === null ? undefined : String(v).trim()),
      z.string().optional().nullable()
    ),
    buttonNameHi: z.preprocess(
      (v) => (v === "" || v === undefined || v === null ? undefined : String(v).trim()),
      z.string().optional().nullable()
    ),
  })
  .superRefine((data, ctx) => {
    if (data.linkType === "tour") {
      if (data.tourId == null || Number.isNaN(Number(data.tourId)) || Number(data.tourId) < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "tourId is required when link type is tour",
          path: ["tourId"],
        });
      }
    }
    if (data.linkType === "whatsapp") {
      const w = (data.whatsappUrl ?? "").trim();
      if (w.length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "WhatsApp URL is required when link type is whatsapp",
          path: ["whatsappUrl"],
        });
      }
    }
  });

export type DarshanBannerUpdateFormData = z.infer<typeof updateDarshanBannerValidationSchema>;

/** Shape for multipart: only send fields relevant to the selected link type (matches backend normalize). */
export function toDarshanBannerMultipartBody(data: DarshanBannerFormData): Record<string, string | boolean> {
  const body: Record<string, string | boolean> = {
    isActive: data.isActive,
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
