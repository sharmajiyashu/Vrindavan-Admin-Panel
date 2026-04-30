import { get, postFormData } from "../api";
import { type AboutUsFormData } from "../validations/aboutUs";

export interface AboutUs {
  id: number;
  imageId?: number | null;
  imageTitleEn?: string | null;
  imageTitleHi?: string | null;
  visionDescriptionEn?: string | null;
  visionDescriptionHi?: string | null;
  youtubeUrl?: string | null;
  youtubeDescriptionEn?: string | null;
  youtubeDescriptionHi?: string | null;
  whatsappUrl?: string | null;
  whatsappDescriptionEn?: string | null;
  whatsappDescriptionHi?: string | null;
  instagramUrl?: string | null;
  instagramDescriptionEn?: string | null;
  instagramDescriptionHi?: string | null;
  facebookUrl?: string | null;
  facebookDescriptionEn?: string | null;
  facebookDescriptionHi?: string | null;
  createdAt: string;
  updatedAt: string;
  image?: { id: number; url: string };
}

function appendFields(
  formData: FormData,
  data: Record<string, unknown>,
): void {
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "boolean") {
      formData.append(key, value ? "true" : "false");
    } else {
      formData.append(key, String(value));
    }
  }
}

export const aboutUsService = {
  getAboutUs: async () => {
    return await get<AboutUs | null>("/about-us");
  },

  upsertAboutUs: async (data: AboutUsFormData, file?: File) => {
    const formData = new FormData();
    appendFields(formData, data as Record<string, unknown>);
    if (file) formData.append("image", file);
    return await postFormData<AboutUs>("/about-us", formData);
  },
};
