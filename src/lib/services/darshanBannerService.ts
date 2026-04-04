import { get, post, put, postFormData, deleteRequest } from "../api";

export interface DarshanBanner {
  id: number;
  titleEn?: string | null;
  titleHi?: string | null;
  subtitleEn?: string | null;
  subtitleHi?: string | null;
  templeId?: number | null;
  mediaId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  media?: {
    id: number;
    url: string;
  };
  temple?: {
    id: number;
    nameEn: string;
    nameHi: string;
  };
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

export const darshanBannerService = {
  listBanners: async (page: number = 1, limit: number = 10) => {
    return await get<PaginatedBannerResponse>(`/darshan-banners?page=${page}&limit=${limit}`);
  },

  getBanner: async (id: number) => {
    return await get<DarshanBanner>(`/darshan-banners/${id}`);
  },

  createBanner: async (data: any, file?: File) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, String(data[key]));
      }
    });
    if (file) {
      formData.append("image", file);
    }
    return await postFormData<DarshanBanner>("/darshan-banners", formData);
  },

  updateBanner: async (id: number, data: any, file?: File) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, String(data[key]));
      }
    });
    if (file) {
      formData.append("image", file);
    }
    return await postFormData<DarshanBanner>(`/darshan-banners/${id}?_method=PUT`, formData);
  },

  deleteBanner: async (id: number) => {
    return await deleteRequest(`/darshan-banners/${id}`);
  },
};
