import { post, setAuthUser, setToken, type AuthUser } from "@/lib/api";
import type { AdminLoginDto } from "@/lib/validations/admin-login";

export interface AdminRole {
  id: number;
  name: string;
  [key: string]: unknown;
}

export interface AdminUser {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email?: string;
  userRole?: string;
  adminRoleId?: number | null;
  adminRole?: AdminRole | null;
  [key: string]: unknown;
}

export interface AdminLoginPayload {
  token: string;
  user: AdminUser;
}

export async function adminLogin(
  body: AdminLoginDto
): Promise<AdminLoginPayload> {
  // Backend returns ResponseWrapper<{ token, user }>
  const data = await post<AdminLoginPayload>("login", body);
  if (data?.token) setToken(data.token);

  const u = data?.user;
  if (u && typeof u === "object") {
    const fullName = ([u.firstName, u.lastName]
      .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
      .join(" ")
      .trim()) || (typeof u.name === "string" ? u.name : "");

    const roleName =
      (u.adminRole && typeof u.adminRole === "object" ? u.adminRole.name : undefined) ??
      u.userRole;

    const authUser: AuthUser = {
      name: fullName || undefined,
      firstName: typeof u.firstName === "string" ? u.firstName : undefined,
      email: u.email,
      role: roleName,
      roleName,
    };
    setAuthUser(authUser);
  }

  return data;
}

