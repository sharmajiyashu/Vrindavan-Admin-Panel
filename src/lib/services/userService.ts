import { get, put } from "../api";

export interface User {
  id: number;
  name: string;
  email: string | null;
  mobile: string;
  walletBalance: string | number;
  referralCode: string | null;
  userRole: string;
  isActive: boolean;
  createdAt: string;
  totalBookings: number;
  location?: string | null;
}

export interface PaginatedUserResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const userService = {
  listUsers: async (page = 1, limit = 10, search?: string) => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (search) params.append("search", search);

    return await get<PaginatedUserResponse>(`/users?${params.toString()}`);
  },

  getUser: async (id: number) => {
    return await get<User>(`/users/${id}`);
  },

  updateUser: async (id: number, data: { name?: string; email?: string; userRole?: string; isActive?: boolean; walletBalance?: number; location?: string }) => {
    return await put<User>(`/users/${id}`, data);
  },
};
