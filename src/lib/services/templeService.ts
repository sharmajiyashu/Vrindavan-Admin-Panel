import { get, post, put, postFormData, putFormData, deleteRequest } from "../api";
import { TempleFormData } from "../validations/temple";

export interface TempleMedia {
  id: number;
  url: string;
  type?: string;
}

export interface Temple {
  id: number;
  nameEn: string;
  nameHi: string;
  shortTitleEn?: string | null;
  shortTitleHi?: string | null;
  addressEn: string;
  addressHi: string;
  cityEn: string;
  cityHi: string;
  stateEn: string;
  stateHi: string;
  lat: number;
  long: number;
  establishedEn?: string | null;
  establishedHi?: string | null;
  morningTimings: any[];
  eveningTimings: any[];
  thumbnailId?: number | null;
  documentaryVideoId?: number | null;
  documentaryVideoUrl?: string | null;
  documentaryTitleEn?: string | null;
  documentaryTitleHi?: string | null;
  documentarySubtitleEn?: string | null;
  documentarySubtitleHi?: string | null;
  audioGuideEnId?: number | null;
  audioGuideHiId?: number | null;
  imageIds: number[];
  isActive: boolean;
  showDarshan: boolean;
  sortOrder: number;
  bestTimeEn?: string | null;
  bestTimeHi?: string | null;
  bestTimeDetailEn?: string | null;
  bestTimeDetailHi?: string | null;
  historyEn?: string | null;
  historyHi?: string | null;
  audioGuideUrlEn?: string | null;
  audioGuideUrlHi?: string | null;
  createdAt: string;
  updatedAt: string;
  thumbnail?: TempleMedia;
  gallery?: TempleMedia[];
  documentaryVideo?: TempleMedia;
  audioGuideEn?: TempleMedia;
  audioGuideHi?: TempleMedia;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedTempleResponse {
  temples: Temple[];
  pagination: PaginationInfo;
}

export const templeService = {
  listTemples: async (page = 1, limit = 10, search = "") => {
    return await get<PaginatedTempleResponse>(`/temples?page=${page}&limit=${limit}&search=${search}`);
  },

  getTemple: async (id: number) => {
    return await get<Temple>(`/temples/${id}`);
  },

  createTemple: async (data: TempleFormData) => {
    // Step 1: Create temple with basic details using JSON (raw)
    console.log("POST /temples - Outgoing JSON:", JSON.stringify(data, null, 2));
    return await post<Temple>("/temples", data);
  },

  updateTemple: async (id: number, data: Partial<TempleFormData>) => {
    console.log(`PUT /temples/${id} - Outgoing JSON:`, JSON.stringify(data, null, 2));
    return await put<Temple>(`/temples/${id}`, data);
  },

  // Document & File Uploads (Step 2)
  uploadGallery: async (id: number, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append("images", file));
    return await postFormData<any>(`/temples/${id}/gallery`, formData);
  },

  uploadDocumentary: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append("documentaryVideo", file);
    return await putFormData<any>(`/temples/${id}/documentary`, formData);
  },

  uploadAudioGuide: async (id: number, lang: "en" | "hi", file: File) => {
    const formData = new FormData();
    formData.append("audio", file);
    return await putFormData<any>(`/temples/${id}/audio/${lang}`, formData);
  },

  deleteGalleryMedia: async (templeId: number, mediaId: number) => {
    return await deleteRequest(`/temples/${templeId}/gallery/${mediaId}`);
  },

  deleteTemple: async (id: number) => {
    return await deleteRequest(`/temples/${id}`);
  },
};
