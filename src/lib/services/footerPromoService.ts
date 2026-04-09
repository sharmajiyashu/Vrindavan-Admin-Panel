import { get, postFormData, putFormData, deleteRequest } from "../api";
import {
  type FooterPromoFormData,
  toFooterPromoMultipartBody,
} from "../validations/footerPromo";

/** Admin routes use `upload.single('image')` — same field name here. */
const FILE_FIELD = "image" as const;

export interface FooterPromoTour {
  id: number;
  titleEn: string;
  titleHi: string;
}

export interface FooterPromo {
  id: number;
  titleEn?: string | null;
  titleHi?: string | null;
  subtitleEn?: string | null;
  subtitleHi?: string | null;
  tourId?: number | null;
  mediaId?: number | null;
  sortOrder: number;
  /** Max times the app should show this promo (client-enforced). */
  showTimes?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  media?: { id: number; url: string };
  tour?: FooterPromoTour | null;
}

/** Matches `listPaginated` response: `{ footerPromos, pagination }`. */
export interface PaginatedFooterPromoResponse {
  footerPromos: FooterPromo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function appendFields(
  formData: FormData,
  data: Record<string, unknown>,
  partial: boolean
): void {
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (partial) {
      if (value === null) continue;
      if (typeof value === "string" && value === "") continue;
    } else if (value === null) continue;
    if (typeof value === "boolean") {
      formData.append(key, value ? "true" : "false");
    } else {
      formData.append(key, String(value));
    }
  }
}

export const footerPromoService = {
  listPromos: async (page = 1, limit = 10) => {
    return await get<PaginatedFooterPromoResponse>(`/footer-promos?page=${page}&limit=${limit}`);
  },

  getPromo: async (id: number) => {
    return await get<FooterPromo>(`/footer-promos/${id}`);
  },

  createPromo: async (data: FooterPromoFormData, file?: File) => {
    const formData = new FormData();
    const body = toFooterPromoMultipartBody(data);
    appendFields(formData, body as Record<string, unknown>, false);
    if (file) formData.append(FILE_FIELD, file);
    return await postFormData<FooterPromo>("/footer-promos", formData);
  },

  updatePromo: async (id: number, data?: FooterPromoFormData, file?: File) => {
    if (data === undefined && !file) {
      throw new Error("Nothing to update: provide fields and/or an image file.");
    }
    const formData = new FormData();
    if (data !== undefined) {
      const body = toFooterPromoMultipartBody(data);
      appendFields(formData, body as Record<string, unknown>, true);
    }
    if (file) formData.append(FILE_FIELD, file);
    return await putFormData<FooterPromo>(`/footer-promos/${id}`, formData);
  },

  deletePromo: async (id: number) => {
    return await deleteRequest(`/footer-promos/${id}`);
  },
};
