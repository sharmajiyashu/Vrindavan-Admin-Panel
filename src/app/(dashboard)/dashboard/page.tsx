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
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
              <IconCalendarStats size={24} />
            </div>
            {t("dashboard.title")}
          </h1>
          <p className="text-xs font-semibold text-muted-foreground/80 pl-13">
            Welcome back! Here's what's happening today in Vrindavan.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-all hover:bg-muted active:scale-95 shadow-sm"
            title="Refresh dashboard metrics"
          >
            <IconReload className={twMerge("h-4 w-4", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <section className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 px-2">
        {statCards.map((stat, i) => (
          <div
            key={i}
            className={twMerge(
              "group relative overflow-hidden rounded-3xl border-2 bg-card p-6 transition-all duration-300",
              "hover:shadow-lg hover:-translate-y-1",
              stat.border
            )}
          >
            <div className="flex items-center justify-between">
              <div className={twMerge("rounded-2xl p-3 shadow-inner", stat.bg, stat.color)}>
                <stat.icon size={26} stroke={2} />
              </div>
              <div className={twMerge(
                "h-2 w-2 rounded-full",
                isLoading ? "bg-muted animate-pulse" : "bg-emerald-400"
              )} />
            </div>

            <div className="mt-6 space-y-1">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">
                {stat.title}
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tighter text-foreground tabular-nums">
                  {stat.value}
                </span>
              </div>
            </div>

            {/* Subtle background glow */}
            <div className={twMerge(
              "absolute -right-8 -bottom-8 h-32 w-32 rounded-full opacity-[0.05] blur-2xl transition-all duration-500 group-hover:scale-150",
              stat.bg
            )} />
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-3 px-2">
        {/* Upcoming Tours Operations */}
        <section className="lg:col-span-2 rounded-[2.5rem] border border-border bg-card p-10 shadow-xl overflow-hidden space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                Upcoming Tours Operations
              </h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                Monitor deadlines and assign guides
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <IconCalendarCheck size={20} />
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="h-64 flex flex-col items-center justify-center gap-3">
                <IconLoader2 size={32} className="animate-spin text-primary/30" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Loading operations...</p>
              </div>
            ) : (data?.upcomingSlots || []).length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center gap-4 text-center">
                <div className="h-16 w-16 rounded-3xl bg-muted/30 flex items-center justify-center text-muted-foreground">
                  <IconCalendarCheck size={32} stroke={1.5} />
                </div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">No tours scheduled<br />for the next 48 hours.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {data?.upcomingSlots.map((slot: any) => {
                  const dateTimeStr = `${slot.date} ${slot.startTime}`;
                  const slotTime = parse(dateTimeStr, "yyyy-MM-dd hh:mm a", new Date());
                  const deadlineHours = slot.tour?.shareDetailsBeforeHours || 2;
                  const deadlineTime = new Date(slotTime.getTime() - deadlineHours * 60 * 60 * 1000);
                  const minutesLeft = differenceInMinutes(deadlineTime, new Date());
                  const isDeadlinePassed = minutesLeft <= 0;

                  return (
                    <div key={slot.id} className="p-6 rounded-3xl border border-border bg-muted/20 group hover:bg-card hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                          <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <span className="text-[10px] font-black uppercase leading-none">{format(slotTime, "MMM")}</span>
                            <span className="text-lg font-black leading-none mt-0.5">{format(slotTime, "dd")}</span>
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{slot.tour?.titleEn}</h4>
                            <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                              <span className="flex items-center gap-1"><IconClock size={12} /> {slot.startTime}</span>
                              <span className="flex items-center gap-1"><IconMapPin size={12} /> {slot.tour?.locationNameEn || "Vrindavan"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col md:items-end gap-3">
                          <div className={twMerge(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm flex items-center gap-2",
                            isDeadlinePassed
                              ? "bg-red-50 text-red-600 border-red-100"
                              : "bg-emerald-50 text-emerald-600 border-emerald-100"
                          )}>
                            <IconCircleCheck size={12} />
                            {isDeadlinePassed
                              ? "Deadline Passed"
                              : `Final Details in ${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m`
                            }
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex flex-col gap-2">
                              <div className="relative group/input">
                                <input
                                  defaultValue={slot.guidePhoneNumber || ""}
                                  placeholder="Guide Phone"
                                  onBlur={async (e) => {
                                    if (e.target.value !== slot.guidePhoneNumber) {
                                      try {
                                        const fullTour = await tourService.getTourById(slot.tourId);
                                        const updatedSlots = (fullTour?.slots || []).map((s: any) =>
                                          (s.date === slot.date && s.startTime === slot.startTime)
                                            ? { ...s, guidePhoneNumber: e.target.value }
                                            : s
                                        );
                                        await tourService.updateTour(slot.tourId, { slots: updatedSlots });
                                        toast.success("Guide info updated");
                                      } catch (err) {
                                        toast.error("Failed to update guide");
                                      }
                                    }
                                  }}
                                  className="h-10 w-44 rounded-xl border border-border bg-card/50 px-4 text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                                />
                              </div>
                              <div className="relative group/input">
                                <input
                                  defaultValue={slot.alternateNumber || ""}
                                  placeholder="Alt Phone *"
                                  onBlur={async (e) => {
                                    if (e.target.value !== slot.alternateNumber) {
                                      try {
                                        const fullTour = await tourService.getTourById(slot.tourId);
                                        const updatedSlots = (fullTour?.slots || []).map((s: any) =>
                                          (s.date === slot.date && s.startTime === slot.startTime)
                                            ? { ...s, alternateNumber: e.target.value }
                                            : s
                                        );
                                        await tourService.updateTour(slot.tourId, { slots: updatedSlots });
                                        toast.success("Alternate contact updated");
                                      } catch (err) {
                                        toast.error("Failed to update alternate contact");
                                      }
                                    }
                                  }}
                                  className="h-10 w-44 rounded-xl border border-border bg-card/50 px-4 text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all border-destructive/20"
                                />
                              </div>
                            </div>
                            <Link
                              href={`/tours/${slot.tourId}`}
                              className="h-full min-h-[5.5rem] w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-sm border border-primary/10"
                            >
                              <IconArrowRight size={24} />
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* Background accent */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Quick Stats & Actions Sidebar */}
        <div className="space-y-6">
          <section className="rounded-[2.5rem] border border-border bg-card p-8 shadow-xl space-y-8">
            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/50">Quick Shortcuts</h3>
            </div>
            <div className="grid gap-4">
              <Link href="/temples" className="flex items-center justify-between p-5 rounded-2xl bg-amber-50 border border-amber-100 text-amber-900 group transition-all hover:bg-amber-100 active:scale-[0.98]">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                    <IconMapPin size={20} className="text-amber-600" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest">Temples</span>
                </div>
                <IconArrowRight size={16} className="opacity-30 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/tours" className="flex items-center justify-between p-5 rounded-2xl bg-purple-50 border border-purple-100 text-purple-900 group transition-all hover:bg-purple-100 active:scale-[0.98]">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                    <IconCalendarCheck size={20} className="text-purple-600" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest">Tours</span>
                </div>
                <IconArrowRight size={16} className="opacity-30 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/bookings" className="flex items-center justify-between p-5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-900 group transition-all hover:bg-emerald-100 active:scale-[0.98]">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                    <IconReceipt2 size={20} className="text-emerald-600" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest">Bookings</span>
                </div>
                <IconArrowRight size={16} className="opacity-30 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="pt-8 border-t border-border/40">
              <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 text-center space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">System Status</p>
                <div className="flex items-center justify-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-xs font-bold text-foreground">Operational v2.4</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
