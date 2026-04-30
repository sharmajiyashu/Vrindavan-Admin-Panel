import { z } from 'zod';

const coerceNumber = z.coerce.number();

const darshanSchemaObject = z.object({
  templeId: coerceNumber.min(1, 'Please select a temple'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  shift: z.enum(['morning', 'evening']).default('morning'),
  descriptionEn: z.string().optional().nullable(),
  descriptionHi: z.string().optional().nullable(),
  displayTextEn: z.string().optional().nullable(),
  displayTextHi: z.string().optional().nullable(),
});

const darshanRefinement = (data: any, ctx: z.RefinementCtx) => {
  const dHasEn = !!data.descriptionEn?.trim();
  const dHasHi = !!data.descriptionHi?.trim();
  if (dHasEn !== dHasHi) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Hindi and English must both be provided if one is filled.", path: [dHasEn ? "descriptionHi" : "descriptionEn"] });
  }
  const dtHasEn = !!data.displayTextEn?.trim();
  const dtHasHi = !!data.displayTextHi?.trim();
  if (dtHasEn !== dtHasHi) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Hindi and English must both be provided if one is filled.", path: [dtHasEn ? "displayTextHi" : "displayTextEn"] });
  }
};

export const darshanValidationSchema = darshanSchemaObject.superRefine(darshanRefinement);

export type DarshanFormData = z.infer<typeof darshanValidationSchema>;

export const updateDarshanValidationSchema = darshanSchemaObject.partial().superRefine(darshanRefinement);

export const getDarshansQuerySchema = z.object({
  page: coerceNumber.default(1),
  limit: coerceNumber.default(10),
  templeId: coerceNumber.optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  shift: z.enum(['morning', 'evening']).optional(),
});
