import { get, post, put, deleteRequest } from "../api";
import { RouteMapFormData } from "../validations/routeMap";

export interface RouteMapTemple {
  id: number;
  templeId: number;
  routeMapId: number;
  sortOrder?: number | null;
  distanceFromPreviousEn?: string | null;
  distanceFromPreviousHi?: string | null;
  timeFromPreviousEn?: string | null;
  timeFromPreviousHi?: string | null;
  nameEn?: string; // These come as flattened from the detailed GET
  nameHi?: string;
  thumbnail?: { url: string } | null;
}

export interface RouteMap {
  id: number;
  nameEn: string;
  nameHi: string;
  subtitleEn?: string | null;
  subtitleHi?: string | null;
  totalDistanceEn?: string | null;
  totalDistanceHi?: string | null;
  approxTimeEn?: string | null;
  approxTimeHi?: string | null;
  recommendationEn?: string | null;
  recommendationHi?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  temples?: RouteMapTemple[]; // Detailed version nested temples
}

export interface PaginatedRouteMapResponse {
  routeMaps: RouteMap[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const routeMapService = {
  listRouteMaps: async (page = 1, limit = 10) => {
    return await get<PaginatedRouteMapResponse>(`/route-maps?page=${page}&limit=${limit}`);
  },

  getRouteMap: async (id: number) => {
    return await get<RouteMap & { temples: RouteMapTemple[] }>(`/route-maps/${id}`);
  },

  createRouteMap: async (data: RouteMapFormData) => {
    // Send standard JSON as requested by the backend Express code
    return await post<RouteMap>("/route-maps", data);
  },

  updateRouteMap: async (id: number, data: Partial<RouteMapFormData>) => {
    return await put<RouteMap>(`/route-maps/${id}`, data);
  },

  deleteRouteMap: async (id: number) => {
    return await deleteRequest(`/route-maps/${id}`);
  },
};
