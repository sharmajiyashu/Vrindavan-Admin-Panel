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
  getUploadSignature: async (folder = "temples") => {
    return await get<any>(`/temples/upload-signature?folder=${folder}`);
  },

  uploadGallery: async (id: number, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append("images", file));
    return await postFormData<any>(`/temples/${id}/gallery`, formData);
  },

  uploadDocumentary: async (id: number, file: File) => {
    try {
      // 1. Get Signature from our backend
      const { timestamp, signature, apiKey, cloudName, folder } = await templeService.getUploadSignature("temples");

      // 2. Upload directly to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("api_key", apiKey);
      formData.append("folder", folder);

      // Use native fetch or a clean axios instance to avoid our API base URL/interceptors
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;
      const response = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Cloudinary upload failed');
      }

      const uploadResult = await response.json();

      // 3. Save the result info back to our backend
      return await put<any>(`/temples/${id}/documentary-info`, {
        url: uploadResult.secure_url,
        size: uploadResult.bytes,
        mimetype: file.type,
        width: uploadResult.width,
        height: uploadResult.height
      });
    } catch (error: any) {
      console.error("Direct upload failed:", error);
      throw new Error(error.message || "Failed to upload documentary video");
    }
  },

  deleteDocumentary: async (id: number) => {
    return await deleteRequest(`/temples/${id}/documentary`);
  },

  uploadAudioGuide: async (id: number, lang: "en" | "hi", file: File) => {
    const formData = new FormData();
    formData.append("audio", file);
    return await putFormData<any>(`/temples/${id}/audio/${lang}`, formData);
  },

  deleteAudioGuide: async (id: number, lang: "en" | "hi") => {
    return await deleteRequest(`/temples/${id}/audio/${lang}`);
  },

  deleteGalleryMedia: async (templeId: number, mediaId: number) => {
    return await deleteRequest(`/temples/${templeId}/gallery/${mediaId}`);
  },

  deleteTemple: async (id: number) => {
    return await deleteRequest(`/temples/${id}`);
  },
};
