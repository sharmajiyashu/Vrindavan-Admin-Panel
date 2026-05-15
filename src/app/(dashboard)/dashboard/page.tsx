"use client";

import * as React from "react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconUsers,
  IconCalendarEvent,
  IconCalendarCheck,
  IconArrowRight,
  IconReload,
  IconReceipt2,
  IconCircleCheck,
  IconCircleX,
  IconLoader2,
  IconUser,
  IconMapPin,
  IconPhone,
  IconCalendarStats,
  IconClock,
  IconX,
} from "@tabler/icons-react";
import { twMerge } from "tailwind-merge";
import { useLanguage } from "@/contexts/LanguageContext";
import { dashboardService, DashboardResponse } from "@/lib/services/dashboardService";
import { tourService } from "@/lib/services/tourService";
import Link from "next/link";
import { format, parse, isValid, differenceInMinutes } from "date-fns";
import { toast } from "react-toastify";

export default function DashboardPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<DashboardResponse>({
    queryKey: ["dashboard-stats"],
    queryFn: dashboardService.getStats,
  });

  const stats = data?.stats;

  const statCards = [
    {
      title: t("dashboard.card.totalUsers"),
      value: stats?.totalUsers ?? "...",
      icon: IconUsers,
      color: "text-[#5A2A13]",
      bg: "bg-[#5A2A13]/5",
      border: "border-[#5A2A13]/10",
    },
    {
      title: t("dashboard.card.totalBookings"),
      value: stats?.totalBookings ?? "...",
      icon: IconCalendarCheck,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-200",
    },
    {
      title: t("dashboard.card.cancelledBookings"),
      value: stats?.statusBreakdown.cancelled ?? "...",
      icon: IconCircleX,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
    },
    {
      title: t("dashboard.card.todayBookings"),
      value: stats?.todayBookings ?? "...",
      icon: IconCalendarEvent,
      color: "text-pink-600",
      bg: "bg-pink-50",
      border: "border-pink-200",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-8">
      {/* Header section */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
            <IconCalendarStats size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-foreground leading-none">
              {t("dashboard.title")}
            </h1>
            <p className="text-[10px] font-bold text-muted-foreground/60 mt-1 uppercase tracking-wider">
              {format(new Date(), "EEEE, MMMM do")}
            </p>
          </div>
        </div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-all hover:bg-muted active:scale-95 shadow-sm"
        >
          <IconReload className={twMerge("h-3.5 w-3.5", isLoading && "animate-spin")} />
        </button>
      </div>

      {/* Stats Grid - Smaller Cards */}
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4 px-2">
        {statCards.map((stat, i) => (
          <div
            key={i}
            className={twMerge(
              "group relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all duration-300",
              "hover:shadow-md",
              stat.border
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={twMerge("rounded-lg p-1.5", stat.bg, stat.color)}>
                <stat.icon size={18} stroke={2.5} />
              </div>
            </div>
            <div className="space-y-0.5">
              <h3 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                {stat.title}
              </h3>
              <p className="text-xl font-black tracking-tighter text-foreground tabular-nums leading-none">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-3 px-2">
        {/* Compact Tour Operations */}
        <section className="lg:col-span-2 rounded-[1.5rem] border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black tracking-tight text-foreground">
                Tour Operations
              </h2>
              <p className="text-[9px] font-bold uppercase tracking-widest text-primary/60">
                Manage guide assignments and deadlines
              </p>
            </div>
            <IconCalendarStats size={18} className="text-primary/20" />
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="h-40 flex flex-col items-center justify-center gap-2">
                <IconLoader2 size={24} className="animate-spin text-primary/20" />
              </div>
            ) : (data?.upcomingSlots || []).length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center gap-2 text-center border border-dashed rounded-2xl bg-muted/5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No tours scheduled</p>
              </div>
            ) : (
              <div className="grid gap-2">
                {data?.upcomingSlots.slice(0, 5).map((slot: any) => {
                  const dateTimeStr = `${slot.date} ${slot.startTime}`;
                  const slotTime = parse(dateTimeStr, "yyyy-MM-dd hh:mm a", new Date());
                  const deadlineHours = slot.tour?.shareDetailsBeforeHours || 2;
                  const deadlineTime = new Date(slotTime.getTime() - deadlineHours * 60 * 60 * 1000);
                  const minutesLeft = differenceInMinutes(deadlineTime, new Date());
                  const isDeadlinePassed = minutesLeft <= 0;

                  return (
                    <div key={slot.id} className="p-3 rounded-xl border border-border bg-muted/5 group hover:bg-card hover:shadow-md transition-all flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/5 flex flex-col items-center justify-center text-primary font-black text-[10px]">
                          <span className="leading-none">{format(slotTime, "dd")}</span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[11px] font-bold text-foreground truncate max-w-[120px] sm:max-w-none">{slot.tour?.titleEn}</h4>
                          <p className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-widest">{slot.startTime}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={twMerge(
                          "px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-wider border flex items-center gap-1",
                          isDeadlinePassed ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                        )}>
                          {isDeadlinePassed ? "Expired" : `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m`}
                        </div>
                        <Link href={`/tours/${slot.tourId}`} className="h-7 w-7 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                          <IconArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {(data?.upcomingSlots || []).length > 5 && (
                  <Link href="/tour-operations" className="text-center p-3 rounded-xl border border-dashed border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-primary transition-all">
                    View All Operations
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Sidebar Mini Section */}
        <div className="space-y-4">
          <section className="rounded-[1.5rem] border border-border bg-card p-5 shadow-sm space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Shortcuts</h3>
            <div className="grid gap-2">
              {[
                { label: "Tours", href: "/tours", color: "bg-purple-50 text-purple-600" },
                { label: "Bookings", href: "/bookings", color: "bg-emerald-50 text-emerald-600" },
                { label: "Users", href: "/users", color: "bg-amber-50 text-amber-600" }
              ].map((link, idx) => (
                <Link key={idx} href={link.href} className={twMerge("flex items-center justify-between p-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-[0.98]", link.color)}>
                  {link.label}
                  <IconArrowRight size={12} />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
