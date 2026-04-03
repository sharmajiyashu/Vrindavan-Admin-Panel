import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios";

const BASE_URL = "http://localhost:3000/v1/api/admin";
// const BASE_URL = "https://temple-api.creatamax.in/v1/api/admin";


const PUBLIC_PATHS = ["/health", "/auth/login", "/user/login", "/login"];

/** Token is considered valid for 6 hours */
const TOKEN_EXPIRY_MS = 6 * 60 * 60 * 1000;
const TOKEN_KEY = "token";
const TOKEN_EXPIRY_KEY = "tokenExpiry";
const AUTH_USER_KEY = "authUser";
const SELECTED_LOCATION_ID_KEY = "selectedLocationId";

/** Location shape returned at login (user.clinic.locations). */
export interface AuthUserLocation {
  id: number;
  locationCode?: string;
  locationName?: { en: string; kh: string };
  isMainLocation?: boolean;
  isEmergencyBranch?: boolean;
  address?: { en: string; kh: string };
  province?: { en: string; kh: string };
  district?: { en: string; kh: string };
  phoneNumber?: string;
  email?: string;
  status?: string;
  branchImage?: { url?: string; mimetype?: string };
  [key: string]: unknown;
}

/** Clinic shape returned at login (user.clinic) and from PUT /clinic/update. */
export interface AuthUserClinic {
  id: number;
  clinicCode?: string;
  clinicName?: { en: string; kh: string };
  clinicDescription?: { en: string; kh: string };
  clinicLogo?: { id?: number; url?: string; mimetype?: string } | null;
  status?: "active" | "inactive" | "suspended";
  isVerifiedByModerator?: boolean;
  verifiedDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
  locations?: AuthUserLocation[];
  [key: string]: unknown;
}

export interface AuthUser {
  name?: string;
  firstName?: string;
  email?: string;
  username?: string;
  role?: { name?: string } | string;
  roleName?: string;
  clinicId?: number;
  clinic?: AuthUserClinic;
  [key: string]: unknown;
}

/** Matches backend ResponseWrapper */
export interface ResponseWrapper<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

function toErrorMessage(value: unknown, fallback = "Request failed"): string {
  if (typeof value === "string" && value.trim().length > 0) return value;
  if (value == null) return fallback;
  if (typeof value === "object") {
    try {
      const json = JSON.stringify(value);
      return json && json !== "{}" ? json : fallback;
    } catch {
      return fallback;
    }
  }
  const s = String(value);
  return s.trim().length > 0 ? s : fallback;
}

/** Type guard: response is success with data */
export function isSuccessResponse<T>(
  r: ResponseWrapper<T>
): r is ResponseWrapper<T> & { success: true; data: T } {
  return r.success === true && r.data !== undefined;
}

function isPublicPath(path: string): boolean {
  const normalized = "/" + (path?.split("?")[0] ?? "").replace(/^\/+/, "");
  return PUBLIC_PATHS.some(
    (p) => normalized === p || normalized.startsWith(p + "/")
  );
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (expiry) {
    const expiryMs = Number(expiry);
    if (!Number.isNaN(expiryMs) && Date.now() >= expiryMs) {
      clearToken();
      return null;
    }
  }
  return token;
}

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const path = config.url ?? "";
    if (!isPublicPath(path)) {
      const token = getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    const { config, status, data } = response;
    if (process.env.NODE_ENV === "development") {
      console.log("[API success]", {
        method: config.method?.toUpperCase(),
        url: config.url,
        status,
      });
    }

    const wrapped = data as ResponseWrapper<unknown>;
    if (
      wrapped &&
      typeof wrapped.success === "boolean" &&
      !wrapped.success
    ) {
      const message = toErrorMessage(wrapped.error, "Request failed");
      if (process.env.NODE_ENV === "development") {
        console.log("[API error]", {
          method: config.method?.toUpperCase(),
          url: config.url,
          message,
        });
      }
      return Promise.reject(new Error(message));
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data as ResponseWrapper<unknown> | undefined;
    const message = toErrorMessage(data?.error ?? error?.message, "Request failed");
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();

    if (process.env.NODE_ENV === "development") {
      console.log("[API error]", { method, url, status, message });
    }

    if (status === 401) {
      clearToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(new Error(message));
  }
);

export async function checkHealth(): Promise<boolean> {
  try {
    const { status } = await api.get("/health");
    return status === 200;
  } catch {
    return false;
  }
}

export async function get<T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const { data } = await api.get<ResponseWrapper<T>>(url, config);
  if (data.success && data.data !== undefined) return data.data as T;
  throw new Error(data.error ?? "Request failed");
}

export async function post<T = unknown>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const { data } = await api.post<ResponseWrapper<T>>(url, body, config);
  if (data.success && data.data !== undefined) return data.data as T;
  throw new Error(data.error ?? "Request failed");
}

export async function postFormData<T = unknown>(
  url: string,
  formData: FormData,
  config?: AxiosRequestConfig
): Promise<T> {
  const { data } = await api.post<ResponseWrapper<T>>(url, formData, {
    ...config,
    headers: {
      ...config?.headers,
      "Content-Type": undefined,
    },
  });
  if (data.success && data.data !== undefined) return data.data as T;
  throw new Error(data.error ?? "Request failed");
}

export async function put<T = unknown>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const { data } = await api.put<ResponseWrapper<T>>(url, body, config);
  if (data.success && data.data !== undefined) return data.data as T;
  throw new Error(data.error ?? "Request failed");
}

export async function patch<T = unknown>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const { data } = await api.patch<ResponseWrapper<T>>(url, body, config);
  if (data.success && data.data !== undefined) return data.data as T;
  throw new Error(data.error ?? "Request failed");
}

export async function putFormData<T = unknown>(
  url: string,
  formData: FormData,
  config?: AxiosRequestConfig
): Promise<T> {
  const { data } = await api.put<ResponseWrapper<T>>(url, formData, {
    ...config,
    headers: {
      ...config?.headers,
      "Content-Type": undefined,
    },
  });
  if (data.success && data.data !== undefined) return data.data as T;
  throw new Error(data.error ?? "Request failed");
}

export async function deleteRequest<T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const { data } = await api.delete<ResponseWrapper<T>>(url, config);
  if (data.success && data.data !== undefined) return data.data as T;
  throw new Error(data.error ?? "Request failed");
}

export function setToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
    const expiry = String(Date.now() + TOKEN_EXPIRY_MS);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiry);
  }
}

export function clearToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(SELECTED_LOCATION_ID_KEY);
  }
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuthUser(user: AuthUser): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
}

/** Update the stored auth user's clinic (e.g. after PUT /clinic/update). */
export function updateAuthUserClinic(clinic: AuthUserClinic): void {
  const user = getAuthUser();
  if (!user) return;
  setAuthUser({ ...user, clinic });
}

/** Selected location ID (persisted in localStorage). Use when APIs require locationId. */
export function getSelectedLocationId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SELECTED_LOCATION_ID_KEY);
  if (raw === null || raw === "") return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}

export function setSelectedLocationId(locationId: number): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(SELECTED_LOCATION_ID_KEY, String(locationId));
  }
}

/**
 * Current location ID for API calls: stored selection, or first location of the clinic.
 * Use this when a request body requires locationId and no specific location is chosen by the user.
 */
export function getCurrentLocationId(): number | null {
  const selected = getSelectedLocationId();
  if (selected !== null) return selected;
  const user = getAuthUser();
  const locations = user?.clinic?.locations;
  const first = Array.isArray(locations) && locations.length > 0 ? locations[0] : undefined;
  return first && typeof first.id === "number" ? first.id : null;
}
