import { z } from "zod";

const aboutUsSchemaObject = z.object({
  imageTitleEn: z.string().optional(),
  imageTitleHi: z.string().optional(),
  visionDescriptionEn: z.string().optional(),
  visionDescriptionHi: z.string().optional(),
  youtubeUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  youtubeDescriptionEn: z.string().optional(),
  youtubeDescriptionHi: z.string().optional(),
  whatsappUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  whatsappDescriptionEn: z.string().optional(),
  whatsappDescriptionHi: z.string().optional(),
  instagramUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  instagramDescriptionEn: z.string().optional(),
  instagramDescriptionHi: z.string().optional(),
  facebookUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  facebookDescriptionEn: z.string().optional(),
  facebookDescriptionHi: z.string().optional(),
});

const aboutUsRefinement = (data: any, ctx: z.RefinementCtx) => {
  const checkPair = (en: any, hi: any, basePath: string) => {
    const hasEn = !!en?.trim();
    const hasHi = !!hi?.trim();
    if (hasEn !== hasHi) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Hindi and English must both be provided if one is filled.", path: [hasEn ? `${basePath}Hi` : `${basePath}En`] });
    }
  };
  checkPair(data.imageTitleEn, data.imageTitleHi, "imageTitle");
  checkPair(data.visionDescriptionEn, data.visionDescriptionHi, "visionDescription");
  checkPair(data.youtubeDescriptionEn, data.youtubeDescriptionHi, "youtubeDescription");
  checkPair(data.whatsappDescriptionEn, data.whatsappDescriptionHi, "whatsappDescription");
  checkPair(data.instagramDescriptionEn, data.instagramDescriptionHi, "instagramDescription");
  checkPair(data.facebookDescriptionEn, data.facebookDescriptionHi, "facebookDescription");
};

export const aboutUsSchema = aboutUsSchemaObject.superRefine(aboutUsRefinement);

export type AboutUsFormData = z.infer<typeof aboutUsSchema>;
