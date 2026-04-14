import { get, postFormData, putFormData, deleteRequest } from "../api";
import {
  type DarshanBannerFormData,
  toDarshanBannerMultipartBody,
} from "../validations/darshanBanner";

/**
 * Backend `parseDarshanBannerFile` accepts any of `image`, `banner`, or `file` (priority: image → banner → file).
 * We send `image` to match the primary field name in the API docs.
 */
const DARSHAN_BANNER_FILE_FIELD = "image" as const;

function appendDarshanBannerFile(formData: FormData, file: File): void {
  formData.append(DARSHAN_BANNER_FILE_FIELD, file);
}

export interface DarshanBannerTour {
  id: number;
  titleEn: string;
  titleHi: string;
}

export interface DarshanBanner {
  id: number;
  linkType?: "tour" | "whatsapp";
  tourId?: number | null;
  whatsappUrl?: string | null;
  buttonNameEn?: string | null;
  buttonNameHi?: string | null;
  mediaId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  media?: {
    id: number;
    url: string;
  };
  tour?: DarshanBannerTour | null;
}

export interface PaginatedBannerResponse {
  banners: DarshanBanner[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function appendBannerToFormData(
  formData: FormData,
  data: Record<string, unknown>,
  options: { partial: boolean }
): void {
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (options.partial) {
      if (value === null) continue;
      if (typeof value === "string" && value === "") continue;
    } else {
      if (value === null) continue;
    }
    if (typeof value === "boolean") {
      formData.append(key, value ? "true" : "false");
    } else {
      formData.append(key, String(value));
    }
  }
}

export const darshanBannerService = {
  listBanners: async (page: number = 1, limit: number = 10) => {
    return await get<PaginatedBannerResponse>(`/darshan-banners?page=${page}&limit=${limit}`);
  },

  getBanner: async (id: number) => {
    return await get<DarshanBanner>(`/darshan-banners/${id}`);
  },

  /** POST `/darshan-banners` — multipart body validated with `darshanBannerValidationSchema`. */
  createBanner: async (data: DarshanBannerFormData, file?: File) => {
    const formData = new FormData();
    const body = toDarshanBannerMultipartBody(data);
    appendBannerToFormData(formData, body as Record<string, unknown>, { partial: false });
    if (file) {
      appendDarshanBannerFile(formData, file);
    }
    return await postFormData<DarshanBanner>("/darshan-banners", formData);
  },

  /**
   * PUT `/darshan-banners/:id` — multipart; `updateDarshanBannerValidationSchema` allows image-only (no body fields).
   * When `data` is omitted, only the file is sent (partial append rules still apply when data is present).
   */
  updateBanner: async (id: number, data?: DarshanBannerFormData, file?: File) => {
    if (data === undefined && !file) {
      throw new Error("Nothing to update: provide banner fields and/or an image file.");
    }
    const formData = new FormData();
    if (data !== undefined) {
      const body = toDarshanBannerMultipartBody(data);
      appendBannerToFormData(formData, body as Record<string, unknown>, { partial: true });
    }
    if (file) {
      appendDarshanBannerFile(formData, file);
    }
    return await putFormData<DarshanBanner>(`/darshan-banners/${id}`, formData);
  },

  deleteBanner: async (id: number) => {
    return await deleteRequest(`/darshan-banners/${id}`);
  },
};
