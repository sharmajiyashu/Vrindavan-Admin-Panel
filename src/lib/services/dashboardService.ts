import { get } from "../api";

export interface DashboardStats {
  totalUsers: number;
  totalBookings: number;
  todayBookings: number;
  totalTemples: number;
  totalTours: number;
  totalRevenue: number;
  totalWalletBalance: number;
  statusBreakdown: {
    upcoming: number;
    completed: number;
    cancelled: number;
  };
}

export interface RecentUpcomingBooking {
  id: number;
  bookingId: string;
  userId: number;
  tourId: number;
  status: string;
  createdAt: string;
  user: {
    name: string;
    mobile: string;
    email: string;
  };
  tour: {
    titleEn: string;
  };
}

export interface DashboardResponse {
  stats: DashboardStats;
  recentUpcomingBookings: RecentUpcomingBooking[];
}

export const dashboardService = {
  getStats: async () => {
    return await get<DashboardResponse>("/dashboard");
  },
};
