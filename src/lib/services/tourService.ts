import { get, post, put, postFormData, deleteRequest } from "../api";
import { TourFormData } from "../validations/tour";

export interface TourMedia {
  id: number;
  url: string;
  type?: string;
}

export interface TourSlot {
  id?: number;
  date: string;
  startTime: string;
  slotDeadlineHours: number;
  cancellationDeadlineHours: number;
  guidePhoneNumber?: string | null;
  alternateNumber?: string | null;
}

export interface TourReview {
  id?: number;
  userName: string;
  date: string;
  rating: number;
  reviewText: string;
  isAdminAdded: boolean;
}

export interface Tour {
  id: number;
  titleEn: string;
  titleHi: string;
  subtitleEn?: string | null;
  subtitleHi?: string | null;
  subtextEn?: string | null;
  subtextHi?: string | null;
  locationNameEn?: string | null;
  locationNameHi?: string | null;
  lat?: number | null;
  long?: number | null;
  price: number;
  slashedPrice?: number | null;
  offerText?: string | null;
  discountConfig?: {
    type: 'flat' | 'percentage' | 'flat_above';
    value: number;
    code: string;
    minAmount?: number;
  } | null;
  extraDiscountPerUser: number;
  templesCoveredCount?: number | null;
  durationEn?: string | null;
  durationHi?: string | null;

  startingAddressEn?: string | null;
  startingAddressHi?: string | null;

  shortHighlightListing?: { titleEn: string; titleHi: string; icon: string } | null;
  shortHighlightDetails?: { titleEn: string; titleHi: string; icon: string } | null;

  showOnReferralApp: boolean;
  referralTourSummaryEn?: string | null;
  referralTourSummaryHi?: string | null;

  customerPickupLines: string[];

  features: Array<{
    iconId: number | null;
    titleEn: string;
    titleHi: string;
    descriptionEn: string;
    descriptionHi: string;
  }>;

  itinerary: Array<{
    imageId: number | null;
    titleEn: string;
    titleHi: string;
    descriptionEn: string;
    descriptionHi: string;
  }>;

  faqs?: Array<{
    questionEn: string;
    questionHi: string;
    answerEn: string;
    answerHi: string;
  }>;
  type: 'group' | 'private';
  minPersons?: number | null;
  maxPersons?: number | null;
  totalWalkMinutes?: number | null;
  distanceEn?: string | null;
  distanceHi?: string | null;
  approxTimeEn?: string | null;
  approxTimeHi?: string | null;
  recommendationEn?: string | null;
  recommendationHi?: string | null;
  badgeEn?: string | null;
  badgeHi?: string | null;

  guidePhoneNumber?: string | null;
  alternateNumber?: string | null;

  cancellationBeforeHours?: number;
  shareDetailsBeforeHours?: number;
  guideDetailsBeforeHours?: number;

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  gallery?: TourMedia[];
  slots?: TourSlot[];
  reviews?: TourReview[];
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

  getTourById: async (id: number) => {
    return await get<Tour>(`/tours/${id}`);
  },

  createTour: async (data: TourFormData) => {
    return await post<Tour>("/tours", data);
  },

  updateTour: async (id: number, data: any) => {
    return await put<Tour>(`/tours/${id}`, data);
  },

  uploadGallery: async (id: number, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append("images", file));
    return await postFormData<any>(`/tours/${id}/gallery`, formData);
  },

  uploadMedia: async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return await postFormData<any>("/tours/upload-single", formData);
  },

  deleteGalleryMedia: async (tourId: number, mediaId: number) => {
    return await deleteRequest(`/tours/${tourId}/gallery/${mediaId}`);
  },

  deleteTour: async (id: number) => {
    return await deleteRequest(`/tours/${id}`);
  },
};
