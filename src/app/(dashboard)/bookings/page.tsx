"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IconSearch,
  IconReload,
  IconReceipt2,
  IconChevronRight,
  IconChevronLeft,
  IconLoader2,
  IconCalendar,
  IconClock,
  IconCircleCheck,
  IconCircleX,
  IconCircleDotted,
  IconExternalLink,
  IconX,
  IconSettings,
} from "@tabler/icons-react";
import * as Dialog from "@radix-ui/react-dialog";
import { bookingService, Booking, PaginatedBookingResponse } from "@/lib/services/bookingService";
import { BookingDetails } from "@/components/bookings/BookingDetails";
import { useLanguage } from "@/contexts/LanguageContext";
import { twMerge } from "tailwind-merge";
import { toast } from "react-toastify";

export default function BookingsPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data, isLoading } = useQuery<PaginatedBookingResponse>({
    queryKey: ["bookings", page, limit, statusFilter, searchTerm],
    queryFn: () => bookingService.listBookings(page, limit, statusFilter === "all" ? undefined : statusFilter, searchTerm),
  });

  const { data: bookingDetail, isLoading: isLoadingDetail } = useQuery<Booking>({
    queryKey: ["booking", selectedBookingId],
    queryFn: () => bookingService.getBooking(selectedBookingId!),
    enabled: !!selectedBookingId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: number; status: string; reason?: string }) => {
      if (status === "cancelled") return bookingService.cancelBooking(id, reason || "");
      if (status === "completed") return bookingService.completeBooking(id);
      return bookingService.updateStatus(id, status, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking", selectedBookingId] });
      toast.success("Booking updated successfully");
      setIsCancelDialogOpen(false);
      setSelectedReason("");
      setOtherReason("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update booking");
    },
  });

  const bookings = data?.bookings || [];
  const pagination = data?.pagination;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "upcoming":
        return <IconCircleDotted size={14} className="text-blue-500" />;
      case "completed":
        return <IconCircleCheck size={14} className="text-emerald-500" />;
      case "cancelled":
        return <IconCircleX size={14} className="text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-50 text-blue-600 ring-blue-500/10";
      case "completed":
        return "bg-emerald-50 text-emerald-600 ring-emerald-500/10";
      case "cancelled":
        return "bg-red-50 text-red-600 ring-red-500/10";
      default:
        return "bg-gray-50 text-gray-600 ring-gray-500/10";
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
        <div className="space-y-0.5">
          <h1 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
              <IconReceipt2 size={18} />
            </div>
            {t("bookings.title")}
          </h1>
          <p className="text-[11px] font-bold text-muted-foreground/60 pl-10.5 uppercase tracking-wider">
            {t("bookings.subtitle")}
          </p>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3 max-w-2xl ml-auto">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            {["all", "upcoming", "completed", "cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={twMerge(
                  "h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  statusFilter === status
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-card text-muted-foreground border border-border hover:bg-muted"
                )}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="relative group flex-1 max-w-[180px]">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center h-5 w-5">
              <IconSearch className="h-3.5 w-3.5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-card/50 pl-10 pr-4 text-[11px] font-bold shadow-sm transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none placeholder:text-muted-foreground/20"
            />
          </div>

          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["bookings"] })}
            className="inline-flex h-10 w-10 min-w-[40px] items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-all hover:bg-muted shadow-sm"
          >
            <IconReload className={twMerge("h-4 w-4", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="rounded-[2.5rem] border border-border bg-card p-4 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <IconLoader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t("bookings.loading")}</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
            <div className="h-16 w-16 rounded-3xl bg-muted/30 flex items-center justify-center text-muted-foreground">
              <IconReceipt2 size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold text-foreground">{t("bookings.noBookings")}</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">No bookings found matching your filters.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/60 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-4 py-4">{t("bookings.user")}</th>
                  <th className="px-4 py-4">{t("bookings.tour")}</th>
                  <th className="px-4 py-4">{t("bookings.date")}</th>
                  <th className="px-4 py-4">{t("bookings.totalPrice")}</th>
                  <th className="px-4 py-4">{t("bookings.status")}</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {bookings.map((booking: Booking) => (
                  <tr key={booking.id} className="group transition-all hover:bg-muted/20">
                    <td className="px-6 py-4 text-xs font-black text-foreground/80">
                      {booking.bookingId || `#${booking.id}`}
                    </td>
                    <td className="px-4 py-4">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-foreground leading-tight">
                          {booking.user?.name}
                        </p>
                        <p className="truncate text-[9px] font-bold text-muted-foreground/40 mt-1 tracking-wider uppercase">
                          {booking.user?.mobile}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-foreground leading-tight">
                          {booking.tour?.titleEn}
                        </p>
                        <p className="truncate text-[9px] font-bold text-primary/60 mt-1 tracking-wider uppercase">
                          {booking.slot}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground/80">
                        <IconCalendar size={13} className="text-muted-foreground/30" />
                        <span className="text-xs font-bold">{booking.bookingDate}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-xs font-black text-foreground">₹{booking.totalPrice}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className={twMerge(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider",
                        getStatusClasses(booking.status)
                      )}>
                        {getStatusIcon(booking.status)}
                        {booking.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedBookingId(booking.id);
                          setIsDetailOpen(true);
                        }}
                        className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-card text-muted-foreground shadow-sm ring-1 ring-border transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
                      >
                        <IconExternalLink size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-6 border-t border-border/40">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="h-9 w-9 rounded-xl border border-border flex items-center justify-center bg-card text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
                  >
                    <IconChevronLeft size={16} />
                  </button>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                    className="h-9 w-9 rounded-xl border border-border flex items-center justify-center bg-card text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
                  >
                    <IconChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog.Root open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-5xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-[2.5rem] bg-card p-10 shadow-2xl animate-in zoom-in-95 fade-in duration-300 outline-none">
            <div className="flex items-center justify-between mb-8">
              <Dialog.Title className="text-2xl font-black tracking-tight flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <IconReceipt2 size={20} />
                </div>
                {t("bookings.details")}
              </Dialog.Title>
              <div className="flex items-center gap-3">
                {bookingDetail && (
                  <div className="flex items-center gap-3">
                    {bookingDetail.status === "upcoming" && (
                      <>
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: bookingDetail.id, status: "completed" })}
                          disabled={updateStatusMutation.isPending}
                          className="h-10 px-4 rounded-xl bg-emerald-500 text-[10px] font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-500/20 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                        >
                          {updateStatusMutation.isPending && <IconLoader2 size={14} className="animate-spin" />}
                          Complete
                        </button>
                        <button
                          onClick={() => setIsCancelDialogOpen(true)}
                          disabled={updateStatusMutation.isPending}
                          className="h-10 px-4 rounded-xl bg-red-500 text-[10px] font-black uppercase tracking-wider text-white shadow-lg shadow-red-500/20 hover:opacity-90 active:scale-95 transition-all"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                )}
                <Dialog.Close className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-90">
                  <IconX size={20} />
                </Dialog.Close>
              </div>
            </div>

            {isLoadingDetail ? (
              <div className="flex h-96 flex-col items-center justify-center gap-3">
                <IconLoader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t("common.loading")}</p>
              </div>
            ) : bookingDetail ? (
              <BookingDetails booking={bookingDetail} />
            ) : (
              <div className="flex h-96 flex-col items-center justify-center gap-3 text-muted-foreground">
                <IconSettings size={40} strokeWidth={1} />
                <p className="text-sm font-bold opacity-40">Failed to load booking details.</p>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Cancellation Modal */}
      <Dialog.Root open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-[70] w-full max-w-lg translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-[2.5rem] bg-card p-10 shadow-2xl animate-in zoom-in-95 fade-in duration-300 outline-none border border-border">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="h-16 w-16 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
                <IconCircleX size={32} />
              </div>
              <div className="space-y-2">
                <Dialog.Title className="text-2xl font-black tracking-tight">{t("bookings.cancelTitle")}</Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground max-w-xs">{t("bookings.cancelSubtitle")}</Dialog.Description>
              </div>

              <div className="w-full space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    Cancellation Reason
                  </label>
                  <select
                    value={selectedReason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-full h-12 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-bold transition-all focus:border-red-500 focus:ring-4 focus:ring-red-500/5 outline-none appearance-none cursor-pointer"
                  >
                    <option value="" disabled>{t("bookings.cancelReasonPlaceholder")}</option>
                    <option value={t("bookings.reasons.plans")}>{t("bookings.reasons.plans")}</option>
                    <option value={t("bookings.reasons.health")}>{t("bookings.reasons.health")}</option>
                    <option value={t("bookings.reasons.mistake")}>{t("bookings.reasons.mistake")}</option>
                    <option value={t("bookings.reasons.timing")}>{t("bookings.reasons.timing")}</option>
                    <option value="other">{t("bookings.reasons.other")}</option>
                  </select>
                </div>

                {selectedReason === "other" && (
                  <textarea
                    placeholder={t("bookings.otherReason")}
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    className="w-full min-h-[100px] rounded-2xl border border-border bg-muted/20 p-4 text-xs font-bold transition-all focus:border-red-500 focus:ring-4 focus:ring-red-500/5 outline-none placeholder:text-muted-foreground/30"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 w-full pt-4">
                <button
                  onClick={() => setIsCancelDialogOpen(false)}
                  className="h-12 rounded-2xl border border-border bg-card text-xs font-black uppercase tracking-wider text-muted-foreground hover:bg-muted transition-all active:scale-95"
                >
                  {t("bookings.keepTrip")}
                </button>
                <button
                  onClick={() => {
                    if (!selectedReason) {
                      toast.warning("Please select a reason");
                      return;
                    }
                    const finalReason = selectedReason === "other" ? otherReason : selectedReason;
                    if (selectedBookingId) updateStatusMutation.mutate({ id: selectedBookingId, status: "cancelled", reason: finalReason });
                  }}
                  disabled={updateStatusMutation.isPending || (selectedReason === "other" && !otherReason.trim())}
                  className="h-12 rounded-2xl bg-red-500 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-500/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {updateStatusMutation.isPending ? <IconLoader2 size={16} className="animate-spin" /> : <IconCircleX size={16} />}
                  {t("bookings.confirmCancel")}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
