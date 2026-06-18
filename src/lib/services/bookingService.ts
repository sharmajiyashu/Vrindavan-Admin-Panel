import { get, patch, post } from "../api";

export interface Booking {
  id: number;
  bookingId: string | null;
  userId: number;
  tourId: number;
  bookingDate: string;
  slot: string;
  personCount: number;
  basePrice: number;
  discountAmount: number;
  couponCode: string;
  couponDiscount?: number;
  totalPrice: number;
  paymentStatus?: "pending" | "success" | "failed";
  status: "upcoming" | "completed" | "cancelled";
  cancellationReason: string | null;
  createdByAdmin?: boolean;
  referrerId?: number | null;
  referralAmount?: number;
  createdAt: string;
  updatedAt: string;
  tour?: {
    id: number;
    titleEn: string;
    titleHi: string;
    price: number;
    [key: string]: any;
  };
  user?: {
    id: number;
    name: string;
    email: string | null;
    mobile: string;
    [key: string]: any;
  };
  contacts?: {
    id: number;
    name: string;
    mobile: string;
    email: string | null;
  }[];
  templeTracking?: {
    id: number;
    templeId: number;
    isVisited: boolean;
    visitedAt: string | null;
    temple: {
      id: number;
      nameEn: string;
      nameHi: string;
      [key: string]: any;
    };
  }[];
}

export interface PaginatedBookingResponse {
  bookings: Booking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const bookingService = {
  listBookings: async (
    page = 1,
    limit = 10,
    status?: string,
    search?: string,
    tourId?: number,
    startDate?: string,
    endDate?: string,
    createdByAdmin?: boolean,
    slotTime?: string,
    createdDate?: string,
    paymentStatus?: string
  ) => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (status) params.append("status", status);
    if (search) params.append("search", search);
    if (tourId) params.append("tourId", tourId.toString());
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (createdByAdmin !== undefined) params.append("createdByAdmin", createdByAdmin.toString());
    if (slotTime) params.append("slotTime", slotTime);
    if (createdDate) params.append("createdDate", createdDate);
    if (paymentStatus) params.append("paymentStatus", paymentStatus);

    return await get<PaginatedBookingResponse>(`/bookings?${params.toString()}`);
  },

  getBooking: async (id: number) => {
    return await get<Booking>(`/bookings/${id}`);
  },

  updateStatus: async (id: number, status: string, reason?: string) => {
    return await patch<Booking>(`/bookings/${id}/status`, { status, reason });
  },

  cancelBooking: async (id: number, reason: string) => {
    return await post<Booking>(`/bookings/${id}/cancel`, { reason });
  },

  completeBooking: async (id: number) => {
    return await post<Booking>(`/bookings/${id}/complete`);
  },

  updateBooking: async (id: number, data: Partial<Booking>) => {
    return await patch<Booking>(`/bookings/${id}`, data);
  },

  createBookingAdmin: async (data: any) => {
    return await post<Booking>("/bookings", data);
  },
};
