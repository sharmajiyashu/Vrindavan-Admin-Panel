import { get, post, put, postFormData, deleteRequest } from "../api";
import { TourFormData } from "../validations/tour";

export interface TourMedia {
  id: number;
  url: string;
  type?: string;
}

export interface Tour {
  id: number;
  titleEn: string;
  titleHi: string;
  price: number;
  discountPrice?: number | null;
  pricePerPerson?: number | null;
  extraDiscountPerUser: number;
  expertGuidanceEn?: string | null;
  expertGuidanceHi?: string | null;
  spiritualImmersionEn?: string | null;
  spiritualImmersionHi?: string | null;
  hassleFreePlanningEn?: string | null;
  hassleFreePlanningHi?: string | null;
  localInsightsEn?: string | null;
  localInsightsHi?: string | null;
  totalWalkMinutes?: number | null;
  distanceEn?: string | null;
  distanceHi?: string | null;
  approxTimeEn?: string | null;
  approxTimeHi?: string | null;
  recommendationEn?: string | null;
  recommendationHi?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  gallery?: TourMedia[];
  temples?: any[]; // Should be Temple[] if available
  morningSlots?: string[];
  eveningSlots?: string[];
}

export interface PaginatedTourResponse {
  tours: Tour[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const tourService = {
  listTours: async () => {
    return await get<PaginatedTourResponse>("/tours");
  },

  getTour: async (id: number) => {
    return await get<Tour>(`/tours/${id}`);
  },

  createTour: async (data: TourFormData) => {
    return await post<Tour>("/tours", data);
  },

  updateTour: async (id: number, data: Partial<TourFormData>) => {
    return await put<Tour>(`/tours/${id}`, data);
  },

  uploadGallery: async (id: number, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append("images", file));
    return await postFormData<any>(`/tours/${id}/gallery`, formData);
  },

  deleteGalleryMedia: async (tourId: number, mediaId: number) => {
    return await deleteRequest(`/tours/${tourId}/gallery/${mediaId}`);
  },

  deleteTour: async (id: number) => {
    return await deleteRequest(`/tours/${id}`);
  },
};
