import { api } from "../api";

export interface ReferralConfig {
  id: number;
  supportPhone: string;
  supportEmail: string;
  supportWhatsApp: string;
  minPayoutAmount: number;
  updatedAt: string;
}

export interface Referee {
  id: number;
  name: string;
  mobile: string;
  referralCode: string;
  aadhaarNumber?: string;
  paymentDetails: {
    upiId?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    isVerified?: boolean;
  };
  lifetimeEarned: number;
  pendingEarned: number;
  currentEarned: number;
  totalPaidOut: number;
  bookingCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface EarningHistory {
  id: number;
  bookingId: string;
  tourName: string;
  status: string;
  dateTime: string;
  personName: string;
  referralAmount: number;
}

export interface CreditedHistory {
  id: number;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  notes?: string;
  createdAt: string;
}

export interface RefereeDetails {
  referee: Referee;
  summary: {
    lifetimeEarned: number;
    pendingEarned: number;
    currentEarned: number;
    totalPaidOut: number;
    lifetimeToursReferred: number;
  };
  earningHistory: EarningHistory[];
  creditedHistory: CreditedHistory[];
}

export const referralService = {
  listReferees: async (params: {
    search?: string;
    eligibleOnly?: boolean;
    sortBy?: string;
    order?: string;
  }) => {
    const response = await api.get("/referral/referees", { params });
    return response.data.data as Referee[];
  },

  getRefereeDetails: async (id: number) => {
    const response = await api.get(`/referral/referees/${id}`);
    return response.data.data as RefereeDetails;
  },

  createReferee: async (data: any) => {
    const response = await api.post("/referral/referees", data);
    return response.data.data;
  },

  updateReferee: async (id: number, data: any) => {
    const response = await api.put(`/referral/referees/${id}`, data);
    return response.data.data;
  },

  deleteReferee: async (id: number) => {
    const response = await api.delete(`/referral/referees/${id}`);
    return response.data.data;
  },

  creditMoney: async (id: number, data: { amount: number; paymentMethod: string; transactionId?: string; notes?: string }) => {
    const response = await api.post(`/referral/referees/${id}/credit`, data);
    return response.data.data;
  },

  getConfig: async () => {
    const response = await api.get("/referral/config");
    return response.data.data as ReferralConfig;
  },

  updateConfig: async (data: any) => {
    const response = await api.put("/referral/config", data);
    return response.data.data as ReferralConfig;
  },
};
