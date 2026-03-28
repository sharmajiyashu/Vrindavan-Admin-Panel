"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Collapsible from "@radix-ui/react-collapsible";
import { IconChevronDown, IconLogout, IconUser } from "@tabler/icons-react";
import { sidebarNav, isNavSection } from "@/lib/sidebar-nav";
import React, { useState, useEffect } from "react";
import { twMerge } from "tailwind-merge";
import { useTranslations } from "@/contexts/LanguageContext";
import { getAuthUser, clearToken, type AuthUser } from "@/lib/api";
import { useRouter } from "next/navigation";

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslations();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [openSections, setOpenSections] = React.useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    setAuthUser(getAuthUser());
  }, []);

  const handleLogout = () => {
    clearToken();
    router.push("/login");
  };

  return (
    <aside className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-border overflow-hidden">
            <img src="/logo.png" alt="Vrindavan" className="h-full w-full object-cover" />
          </div>
          <span className="text-lg font-black tracking-tight text-[#5A2A13] uppercase">
            Vrindavan
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto scrollbar-none">
        {sidebarNav.map((item) => {
          const hasItems = isNavSection(item);
          const Icon = item.icon;
          const href = item.href;
          const titleKey = item.titleKey;

          if (!hasItems) {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                scroll={false}
                className={twMerge(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-[#5A2A13] text-white shadow-xl shadow-[#5A2A13]/20"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                {Icon && (
                  <Icon
                    className={twMerge(
                      "h-5 w-5 shrink-0 transition-transform group-hover:scale-110",
                      isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                )}
                <span>{t(titleKey)}</span>
              </Link>
            );
          }

          const isOpen = openSections[href] ?? pathname.startsWith(href);
          return (
            <Collapsible.Root
              key={href}
              open={isOpen}
              onOpenChange={(open) =>
                setOpenSections((prev) => ({ ...prev, [href]: open }))
              }
              className="space-y-1"
            >
              <Collapsible.Trigger
                className={twMerge(
                  "group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200",
                  "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                  isOpen && "bg-sidebar-accent/50 text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  {Icon && (
                    <Icon
                      className={twMerge(
                        "h-5 w-5 shrink-0 transition-transform group-hover:scale-110",
                        isOpen ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                  )}
                  <span>{t(titleKey)}</span>
                </div>
                <IconChevronDown
                  className={twMerge(
                    "h-4 w-4 shrink-0 transition-transform duration-300 opacity-50",
                    isOpen && "rotate-180 opacity-100"
                  )}
                />
              </Collapsible.Trigger>
              <Collapsible.Content className="overflow-hidden animate-in slide-in-from-top-2 duration-300">
                <div className="ml-5 mt-1 border-l-2 border-primary/10 pl-4 space-y-1">
                  {item.items.map((sub) => {
                    const subActive = pathname === sub.href;
                    const SubIcon = sub.icon;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        scroll={false}
                        className={twMerge(
                          "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                          subActive
                            ? "font-bold text-[#5A2A13] bg-[#5A2A13]/5"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        )}
                      >
                        {SubIcon && (
                          <SubIcon className={twMerge("h-4 w-4 shrink-0", subActive ? "text-primary" : "text-muted-foreground")} />
                        )}
                        {t(sub.titleKey)}
                      </Link>
                    );
                  })}
                </div>
              </Collapsible.Content>
            </Collapsible.Root>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="mt-auto p-4 border-t border-sidebar-border/50">
        <div className="flex items-center gap-3 rounded-2xl bg-sidebar-accent/30 p-3 ring-1 ring-inset ring-white/5 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5A2A13]/10 text-[#5A2A13]">
            <IconUser className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-foreground">
              {authUser?.name || "Admin"}
            </p>
            <p className="truncate text-[10px] font-medium text-muted-foreground">
              {authUser?.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors active:scale-95"
            title={t("common.logOut")}
          >
            <IconLogout className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
