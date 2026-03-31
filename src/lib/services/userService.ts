import { get, put } from "../api";

export interface User {
  id: number;
  name: string;
  email: string | null;
  mobile: string;
  walletBalance: string | number;
  referralCode: string | null;
  userRole: string;
  createdAt: string;
  totalBookings: number;
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

  updateUser: async (id: number, data: { name?: string; email?: string }) => {
    return await put<User>(`/users/${id}`, data);
  },
};
