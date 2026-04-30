import { get, post, put, postFormData, putFormData, deleteRequest } from "../api";
import { DarshanFormData } from "../validations/darshan";

export interface DarshanMedia {
  id: number;
  url: string;
  mimetype: string;
  type: 'image' | 'video' | 'audio';
  size: number;
  width?: number;
  height?: number;
}

export interface Darshan {
  id: number;
  templeId: number;
  date: string;
  shift: 'morning' | 'evening';
  descriptionEn?: string | null;
  descriptionHi?: string | null;
  displayTextEn?: string | null;
  displayTextHi?: string | null;
  createdAt: string;
  updatedAt: string;
  temple?: {
    id: number;
    nameEn: string;
    nameHi: string;
  };
  gallery?: DarshanMedia[];
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedDarshanResponse {
  darshans: Darshan[];
  pagination: PaginationInfo;
}

export const darshanService = {
  listDarshans: async (page = 1, limit = 10, templeId?: number, date?: string, shift?: string) => {
    let url = `/darshans?page=${page}&limit=${limit}`;
    if (templeId) url += `&templeId=${templeId}`;
    if (date) url += `&date=${date}`;
    if (shift) url += `&shift=${shift}`;
    return await get<PaginatedDarshanResponse>(url);
  },

  getDarshan: async (id: number) => {
    return await get<Darshan>(`/darshans/${id}`);
  },

  createDarshan: async (formData: FormData) => {
    return await postFormData<Darshan>("/darshans", formData);
  },

  updateDarshan: async (id: number, formData: FormData) => {
    return await putFormData<Darshan>(`/darshans/${id}`, formData);
  },

  uploadGallery: async (id: number, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append("images", file));
    return await postFormData<any>(`/darshans/${id}/gallery`, formData);
  },

  deleteGalleryMedia: async (darshanId: number, mediaId: number) => {
    return await deleteRequest(`/darshans/${darshanId}/gallery/${mediaId}`);
  },

  deleteDarshan: async (id: number) => {
    return await deleteRequest(`/darshans/${id}`);
  },
};
