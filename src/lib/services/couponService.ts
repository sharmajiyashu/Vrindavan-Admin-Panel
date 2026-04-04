import { get, post, put, deleteRequest } from "@/lib/api";
import { CouponFormData } from "../validations/coupon";

export interface Coupon {
  id: number;
  code: string;
  discountType: 'flat' | 'percentage';
  discountValue: number;
  expiryDate?: string;
  maxUsage?: number;
  currentUsage: number;
  tourId?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tour?: {
    id: number;
    titleEn: string;
    titleHi: string;
  };
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedCoupons {
  coupons: Coupon[];
  pagination: PaginationInfo;
}

export const couponService = {
  listCoupons: async (page: number = 1, limit: number = 10, search?: string) => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (search) params.append("search", search);

    return await get<PaginatedCoupons>(`/coupons?${params.toString()}`);
  },

  getCoupon: async (id: number) => {
    return await get<Coupon>(`/coupons/${id}`);
  },

  createCoupon: async (data: CouponFormData) => {
    return await post<Coupon>("/coupons", data);
  },

  updateCoupon: async (id: number, data: Partial<CouponFormData>) => {
    return await put<Coupon>(`/coupons/${id}`, data);
  },

  deleteCoupon: async (id: number) => {
    return await deleteRequest<void>(`/coupons/${id}`);
  },
};
