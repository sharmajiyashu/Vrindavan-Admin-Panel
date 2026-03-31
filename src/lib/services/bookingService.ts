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
  totalPrice: number;
  status: "upcoming" | "completed" | "cancelled";
  cancellationReason: string | null;
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
  listBookings: async (page = 1, limit = 10, status?: string, search?: string) => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (status) params.append("status", status);
    if (search) params.append("search", search);

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
};
