import { get, post, put, postFormData, deleteRequest } from "../api";
import { TourFormData } from "../validations/tour";

export interface TourMedia {
  id: number;
  url: string;
  mimetype?: string;
  type?: 'image' | 'video' | 'audio' | 'document' | 'other' | 'gif' | 'sticker';
  size?: number;
  width?: number;
  height?: number;
}

export interface TourSlot {
  id?: number;
  date: string;
  startTime: string;
  guideName?: string | null;
  guidePhoneNumber?: string | null;
  alternateNumber?: string | null;
  isCancelled?: boolean;
  session?: 'morning' | 'evening';
  cancellationReason?: string | null;
}

export interface TourReview {
  id?: number;
  userName: string;
  userLocation?: string | null;
  date: string;
  rating: number;
  reviewText: string;
  isAdminAdded: boolean;
  isActive: boolean;
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

  shortHighlightListing?: { titleEn: string; titleHi: string; iconId?: number | null; icon?: TourMedia | null } | null;
  shortHighlightDetails?: { titleEn: string; titleHi: string; iconId?: number | null; icon?: TourMedia | null } | null;

  showOnReferralApp: boolean;
  referralTourSummaryEn?: string | null;
  referralTourSummaryHi?: string | null;

  customerPickupLines: string[];

  features: Array<{
    iconId: number | null;
    icon?: TourMedia | null;
    titleEn: string;
    titleHi: string;
    descriptionEn: string;
    descriptionHi: string;
  }>;

  itinerary: Array<{
    imageId: number | null;
    image?: TourMedia | null;
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
  referralAmount: number;

  guidePhoneNumber?: string | null;
  alternateNumber?: string | null;

  cancellationBeforeHours?: number;
  shareDetailsBeforeHours?: number;
  guideDetailsBeforeHours?: number;
  slotDeadlineHours?: number;

  isActive: boolean;
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
  gallery?: TourMedia[];
  slots?: TourSlot[];
  reviews?: TourReview[];
  averageRating?: number;
  reviewCount?: number;
  adminReviewCount?: number;
  userReviewCount?: number;
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

  getSlotBookingCount: async (tourId: number, date: string, time: string, slotId?: number) => {
    if (!date || !time) return { count: 0 };
    const query = slotId ? `?slotId=${slotId}` : '';
    return await get<{ count: number }>(`/tours/${tourId}/slots/${encodeURIComponent(date)}/${encodeURIComponent(time)}/bookings/count${query}`);
  },

  getSlotBookings: async (tourId: number, date: string, time: string, slotId?: number) => {
    if (!date || !time) return [];
    const query = slotId ? `?slotId=${slotId}` : '';
    return await get<any[]>(`/tours/${tourId}/slots/${encodeURIComponent(date)}/${encodeURIComponent(time)}/bookings${query}`);
  },

  cancelSlot: async (tourId: number, date: string, time: string, reason: string, slotId?: number) => {
    if (!date || !time) throw new Error("Date and time are required to cancel a slot");
    return await post<any>(`/tours/${tourId}/slots/${encodeURIComponent(date)}/${encodeURIComponent(time)}/cancel`, { reason, slotId });
  },

  getSlots: async (tourId: number, date?: string) => {
    const query = date ? `?date=${date}` : '';
    return await get<TourSlot[]>(`/tours/${tourId}/slots${query}`);
  },

  addSlot: async (tourId: number, slotData: Partial<TourSlot>) => {
    return await post<TourSlot>(`/tours/${tourId}/slots`, slotData);
  },

  updateSlot: async (slotId: number, slotData: Partial<TourSlot>) => {
    return await put<TourSlot>(`/tours/slots/${slotId}`, slotData);
  },

  addReview: async (tourId: number, reviewData: any) => {
    return await post<any>(`/tours/${tourId}/reviews`, reviewData);
  },

  updateReview: async (reviewId: number, reviewData: any) => {
    return await put<any>(`/tours/reviews/${reviewId}`, reviewData);
  },

  deleteReview: async (reviewId: number) => {
    return await deleteRequest(`/tours/reviews/${reviewId}`);
  },
};
