import { z } from "zod";

export const aboutUsSchema = z.object({
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

export type AboutUsFormData = z.infer<typeof aboutUsSchema>;
