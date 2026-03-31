import { get } from "../api";

export interface WalletTransaction {
  id: number;
  userId: number;
  bookingId: number | null;
  amount: number;
  type: "credit" | "debit";
  description: string;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    email: string | null;
    mobile: string;
  };
  booking?: {
    id: number;
    bookingId: string | null;
  };
}

export interface PaginatedWalletResponse {
  transactions: WalletTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const walletService = {
  listTransactions: async (page = 1, limit = 10, search?: string, type?: "credit" | "debit") => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (search) params.append("search", search);
    if (type) params.append("type", type);

    return await get<PaginatedWalletResponse>(`/wallets?${params.toString()}`);
  },
};
