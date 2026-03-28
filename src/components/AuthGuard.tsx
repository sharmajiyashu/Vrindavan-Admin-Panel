"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/api";
import { useTranslations } from "@/contexts/LanguageContext";

const PUBLIC_APP_ROUTES = ["/login", "/role/permissions"];

function isPublicAppRoute(pathname: string): boolean {
  const path = pathname ?? "";
  return PUBLIC_APP_ROUTES.some(
    (p) => path === p || path.startsWith(p + "/")
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslations();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setChecked(true));
  }, []);

  useEffect(() => {
    if (!checked) return;
    if (isPublicAppRoute(pathname)) return;
    if (!getToken()) {
      router.replace("/login");
    }
  }, [checked, pathname, router]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }
  if (!isPublicAppRoute(pathname) && !getToken()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">{t("auth.redirectingToLogin")}</p>
      </div>
    );
  }
  return <>{children}</>;
}
