"use client";

import React from "react";
import { Booking } from "@/lib/services/bookingService";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  IconCalendar,
  IconClock,
  IconUser,
  IconPhone,
  IconMail,
  IconMapPin,
  IconTimeline,
  IconCurrencyRupee,
  IconUsers,
  IconCheck,
  IconX,
  IconAlertCircle,
} from "@tabler/icons-react";
import { twMerge } from "tailwind-merge";

interface BookingDetailsProps {
  booking: Booking;
}

export function BookingDetails({ booking }: BookingDetailsProps) {
  const { t } = useLanguage();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-50 text-blue-600 ring-blue-500/10";
      case "pending":
        return "bg-amber-50 text-amber-600 ring-amber-500/10";
      case "completed":
        return "bg-emerald-50 text-emerald-600 ring-emerald-500/10";
      case "cancelled":
        return "bg-red-50 text-red-600 ring-red-500/10";
      default:
        return "bg-gray-50 text-gray-600 ring-gray-500/10";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                  {t("bookings.bookingId")}
                </span>
                <h3 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2.5">
                  {booking.bookingId || `#${booking.id}`}
                  {booking.createdByAdmin && (
                    <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-purple-600 ring-1 ring-inset ring-purple-500/10">
                      Created by Admin
                    </span>
                  )}
                </h3>
                {booking.createdAt && (
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">
                    Booked on: {new Date(booking.createdAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                )}
              </div>
              <div
                className={twMerge(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ring-1 ring-inset",
                  getStatusColor(booking.status)
                )}
              >
                {booking.status}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IconCalendar size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {t("bookings.date")}
                  </span>
                </div>
                <p className="text-sm font-bold text-foreground">
                  {booking.bookingDate}
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IconClock size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {t("bookings.slot")}
                  </span>
                </div>
                <p className="text-sm font-bold text-foreground">
                  {booking.slot}
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IconUsers size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {booking.tour?.type === "private" ? "Tour Type" : t("bookings.personCount")}
                  </span>
                </div>
                {booking.tour?.type === "private" ? (
                  <div className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
                    Private Tour
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">
                      {booking.personCount}
                    </p>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
                      (Group)
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IconCurrencyRupee size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {t("bookings.totalPrice")}
                  </span>
                </div>
                <p className="text-sm font-black text-primary">
                  ₹{booking.totalPrice}
                </p>
              </div>
            </div>
          </div>

          {/* User Information (Account Holder) */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground/50 mb-4">
              User Information (Account Holder)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                  <IconUser size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">
                    Account Name
                  </p>
                  <p className="text-sm font-bold truncate">
                    {booking.user?.name || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                  <IconPhone size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">
                    Mobile
                  </p>
                  <p className="text-sm font-bold truncate">
                    {(() => {
                      const mobile = booking.user?.mobile;
                      if (!mobile) return "N/A";
                      if (mobile.startsWith("9191") && mobile.length >= 14) return `+91 ${mobile.slice(4)}`;
                      if (mobile.startsWith("91") && mobile.length === 12) return `+91 ${mobile.slice(2)}`;
                      return mobile;
                    })()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                  <IconMail size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">
                    Email
                  </p>
                  <p className="text-sm font-bold truncate">
                    {booking.user?.email || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information (Tour booked for) */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground/50 mb-4">
              Customer Information (Tour booked for)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                  <IconUser size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">
                    Customer Name
                  </p>
                  <p className="text-sm font-bold truncate">
                    {booking.contacts?.[0]?.name || booking.user?.name || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                  <IconPhone size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">
                    Mobile
                  </p>
                  <p className="text-sm font-bold truncate">
                    {(() => {
                      const mobile = booking.contacts?.[0]?.mobile || booking.user?.mobile;
                      if (!mobile) return "N/A";
                      if (mobile.startsWith("9191") && mobile.length >= 14) return `+91 ${mobile.slice(4)}`;
                      if (mobile.startsWith("91") && mobile.length === 12) return `+91 ${mobile.slice(2)}`;
                      return mobile;
                    })()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                  <IconMail size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">
                    Email
                  </p>
                  <p className="text-sm font-bold truncate">
                    {booking.contacts?.[0]?.email || booking.user?.email || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {booking.status === "cancelled" && booking.cancellationReason && (
            <div className="rounded-3xl border border-red-100 bg-red-50/50 p-6 flex gap-4">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                <IconAlertCircle size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-widest text-red-600/70">
                  Cancellation Reason
                </h4>
                <p className="text-sm font-bold text-red-900 leading-relaxed">
                  {booking.cancellationReason}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm overflow-hidden relative">
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground/50 mb-4">
              {t("bookings.tourInfo")}
            </h4>
            <div className="space-y-4">
              <div className="aspect-[16/10] rounded-2xl bg-muted overflow-hidden">
                {booking.tour?.gallery && booking.tour.gallery.length > 0 ? (
                  <img
                    src={booking.tour.gallery[0].url}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground/20">
                    <IconMapPin size={32} />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <h5 className="text-sm font-black text-foreground">
                  {booking.tour?.titleEn}
                </h5>
                <p className="text-[10px] font-bold text-muted-foreground opacity-70">
                  {booking.tour?.titleHi}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground/50 mb-4">
              {t("bookings.pricingInfo")}
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold text-muted-foreground">
                <span>Base Price</span>
                <span className="text-foreground">₹{booking.basePrice}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-muted-foreground">
                <span>Discount</span>
                <span className="text-emerald-600">-₹{booking.discountAmount}</span>
              </div>
              {booking.couponCode && (
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-1 rounded-lg">
                  <span>Coupon: {booking.couponCode}</span>
                  {booking.couponDiscount ? <span>-₹{booking.couponDiscount}</span> : null}
                </div>
              )}
              {booking.referrerId && (
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2 py-1 rounded-lg mt-2">
                  <span>Referred By: #{booking.referrerId}</span>
                  {booking.referralAmount ? <span>Bonus: ₹{booking.referralAmount}</span> : null}
                </div>
              )}
              <div className="pt-3 border-t border-border flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest text-foreground">
                  Total Paid
                </span>
                <span className="text-xl font-black text-primary">
                  ₹{booking.totalPrice}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Payment Status
                </span>
                <span className={twMerge(
                  "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md",
                  booking.paymentStatus === "success" ? "bg-emerald-50 text-emerald-600" :
                    booking.paymentStatus === "pending" ? "bg-amber-50 text-amber-600" :
                      "bg-red-50 text-red-600"
                )}>
                  {booking.paymentStatus === "success" ? "Completed" : booking.paymentStatus === "pending" ? "Pending" : booking.paymentStatus === "failed" ? "Refund" : "Pending"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Tabs / Context */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">
              {t("bookings.contacts")}
            </h4>
            <span className="h-6 px-2 rounded-lg bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
              {booking.contacts?.length || 0} Contacts
            </span>
          </div>
          <div className="space-y-3">
            {booking.contacts && booking.contacts.length > 0 ? (
              booking.contacts.map((contact, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/40 group hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-primary shadow-sm">
                      <IconUser size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {contact.name}
                      </p>
                      <p className="text-[10px] font-medium text-muted-foreground opacity-70">
                        {(() => {
                          const mobile = contact.mobile;
                          if (!mobile) return "N/A";
                          if (mobile.startsWith("9191") && mobile.length >= 14) return `+91 ${mobile.slice(4)}`;
                          if (mobile.startsWith("91") && mobile.length === 12) return `+91 ${mobile.slice(2)}`;
                          return mobile;
                        })()}
                      </p>
                    </div>
                  </div>
                  <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                    <IconPhone size={14} />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs font-bold text-muted-foreground italic py-4">
                No additional contacts provided.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">
              {t("bookings.tracking")}
            </h4>
            <div className="flex gap-1.5">
              <span className="h-6 px-2 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100 flex items-center">
                {booking.templeTracking?.filter((t) => t.isVisited).length || 0} Visited
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {booking.templeTracking && booking.templeTracking.length > 0 ? (
              booking.templeTracking.map((track, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-muted-foreground shadow-sm">
                      <IconMapPin size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {track.temple?.nameEn}
                      </p>
                      <p className="text-[10px] font-medium text-muted-foreground opacity-70 truncate">
                        {track.temple?.nameHi}
                      </p>
                    </div>
                  </div>
                  <div
                    className={twMerge(
                      "h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider",
                      track.isVisited
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        : "bg-muted text-muted-foreground border border-border/60"
                    )}
                  >
                    {track.isVisited ? (
                      <>
                        <IconCheck size={10} strokeWidth={4} />
                        {t("bookings.visited")}
                      </>
                    ) : (
                      <>
                        <IconX size={10} strokeWidth={4} />
                        {t("bookings.notVisited")}
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs font-bold text-muted-foreground italic py-4">
                No temple tracking data available.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
