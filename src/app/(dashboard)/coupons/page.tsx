"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconLoader2,
  IconChevronRight,
  IconChevronLeft,
  IconReload,
  IconTicket,
  IconX,
  IconSettings,
  IconCalendar,
  IconClock,
  IconMap2,
  IconAlertTriangle
} from "@tabler/icons-react";
import * as Dialog from "@radix-ui/react-dialog";
import { couponService, Coupon } from "@/lib/services/couponService";
import { CouponForm } from "@/components/coupons/CouponForm";
import { useLanguage } from "@/contexts/LanguageContext";
import { twMerge } from "tailwind-merge";
import { toast } from "react-toastify";
import { CouponFormData } from "@/lib/validations/coupon";

export default function CouponsPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);

  const { data: paginatedData, isLoading } = useQuery({
    queryKey: ["coupons", currentPage, limit, searchTerm],
    queryFn: () => couponService.listCoupons(currentPage, limit, searchTerm),
  });

  const coupons = paginatedData?.coupons ?? [];
  const pagination = paginatedData?.pagination;

  const createMutation = useMutation({
    mutationFn: couponService.createCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast.success(t("coupons.saveSuccess"));
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create coupon");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CouponFormData> }) =>
      couponService.updateCoupon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast.success(t("coupons.saveSuccess"));
      setIsDialogOpen(false);
      setEditingCoupon(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update coupon");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: couponService.deleteCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast.success(t("coupons.deleteSuccess"));
      setIsDeleteModalOpen(false);
      setCouponToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete coupon");
    },
  });

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
        <div className="space-y-0.5">
          <h1 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
              <IconTicket size={18} />
            </div>
            {t("coupons.title")}
          </h1>
          <p className="text-[11px] font-bold text-muted-foreground/60 pl-10.5 uppercase tracking-wider">
            {t("coupons.subtitle")}
          </p>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3 max-w-2xl ml-auto">
          <div className="relative group flex-1 max-w-xs">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center h-5 w-5">
              <IconSearch className="h-3.5 w-3.5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search code..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="h-11 w-full rounded-xl border-2 border-border bg-card pl-10 pr-4 text-[11px] font-bold shadow-sm transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none placeholder:text-muted-foreground/40"
            />
          </div>

          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["coupons"] })}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border-2 border-border bg-card text-muted-foreground transition-all hover:bg-muted active:scale-95 shadow-sm"
            title={t("common.refresh")}
          >
            <IconReload className={twMerge("h-4 w-4", isLoading && "animate-spin")} />
          </button>

          <Dialog.Root open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingCoupon(null);
          }}>
            <Dialog.Trigger asChild>
              <button className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-[11px] font-black uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-95">
                {t("coupons.add")}
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" />
              <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-4xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-3xl border-2 border-border bg-card p-10 shadow-2xl animate-in zoom-in-95 fade-in duration-300 outline-none">
                <div className="flex items-center justify-between mb-8">
                  <Dialog.Title className="text-2xl font-black tracking-tight flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <IconSettings size={20} />
                    </div>
                    {editingCoupon ? t("coupons.edit") : t("coupons.add")}
                  </Dialog.Title>
                  <Dialog.Close className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-90">
                    <IconX size={20} />
                  </Dialog.Close>
                </div>
                <CouponForm
                  initialData={editingCoupon}
                  isLoading={createMutation.isPending || updateMutation.isPending}
                  onSubmit={async (data) => {
                    if (editingCoupon) {
                      await updateMutation.mutateAsync({ id: editingCoupon.id, data });
                    } else {
                      await createMutation.mutateAsync(data);
                    }
                  }}
                  onCancel={() => {
                    setIsDialogOpen(false);
                    setEditingCoupon(null);
                  }}
                />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>

      {/* Main Content */}
      <div className="rounded-3xl border-2 border-border bg-card p-2 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <IconLoader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t("coupons.loading")}</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
            <div className="h-16 w-16 rounded-3xl bg-muted/30 flex items-center justify-center text-muted-foreground border-2 border-dashed border-border">
              <IconTicket size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold text-foreground">{t("coupons.noCoupons")}</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">Try a different search or create your first promotional coupon.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="border-b border-border/60 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                  <th className="px-5 py-4">{t("coupons.code")}</th>
                  <th className="px-4 py-4">{t("coupons.discountValue")}</th>
                  <th className="px-4 py-4">{t("coupons.tour")}</th>
                  <th className="px-4 py-4">{t("coupons.expiryDate")}</th>
                  <th className="px-4 py-4">{t("coupons.currentUsage")}</th>
                  <th className="px-4 py-4">{t("coupons.active")}</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="group transition-all hover:bg-muted/50 border-b border-border/50 last:border-0">
                    <td className="px-5 py-3.5">
                      <div className="inline-flex items-center gap-2 rounded-lg bg-primary/5 px-2.5 py-1 text-xs font-black tracking-widest text-primary border-2 border-primary/10 transition-transform group-hover:scale-105 duration-300">
                        <IconTicket size={14} className="opacity-60" />
                        {coupon.code}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs font-black text-foreground">
                        {coupon.discountType === "flat" ? "₹" : ""}{coupon.discountValue}{coupon.discountType === "percentage" ? "%" : ""} OFF
                      </p>
                      <p className="text-[9px] font-bold text-muted-foreground mt-0.5 opacity-60 uppercase tracking-wider">
                        {coupon.discountType === "flat" ? t("coupons.flat") : t("coupons.percentage")}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      {coupon.tour ? (
                        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                          <IconMap2 size={14} className="text-primary/40" />
                          {coupon.tour.titleEn}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground opacity-50">
                          <IconMap2 size={14} />
                          {t("coupons.allTours")}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-1 text-[10px] font-bold text-muted-foreground border-2 border-border/50">
                        <IconCalendar size={12} className="opacity-60" />
                        {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'No Limit'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="inline-flex items-center gap-1.5">
                        <IconClock size={12} className="text-muted-foreground opacity-40" />
                        <span className="text-xs font-bold tabular-nums">
                          {coupon.currentUsage} / {coupon.maxUsage || '∞'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className={twMerge(
                        "inline-flex items-center gap-1.5 rounded-xl px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ring-1 ring-inset",
                        coupon.isActive 
                          ? "bg-emerald-50 text-emerald-600 ring-emerald-500/20" 
                          : "bg-destructive/5 text-destructive ring-destructive/10"
                      )}>
                        {coupon.isActive ? "Active" : "Inactive"}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingCoupon(coupon);
                            setIsDialogOpen(true);
                          }}
                          className="h-9 w-9 flex items-center justify-center rounded-xl bg-card text-muted-foreground shadow-sm ring-2 ring-border transition-all hover:bg-primary hover:text-primary-foreground hover:ring-primary active:scale-90"
                          title={t("common.edit")}
                        >
                          <IconEdit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setCouponToDelete(coupon);
                            setIsDeleteModalOpen(true);
                          }}
                          disabled={deleteMutation.isPending}
                          className="h-9 w-9 flex items-center justify-center rounded-xl bg-card text-muted-foreground shadow-sm ring-2 ring-border transition-all hover:bg-destructive hover:text-destructive-foreground hover:ring-destructive active:scale-90 disabled:opacity-50"
                          title={t("common.delete")}
                        >
                          <IconTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t-2 border-border pt-6 sm:flex-row">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4">
                  Showing <span className="text-foreground">{Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}</span> to{" "}
                  <span className="text-foreground">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{" "}
                  <span className="text-foreground">{pagination.total}</span> coupons
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={pagination.page === 1}
                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-card border-2 border-border text-muted-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary disabled:opacity-30 active:scale-90"
                  >
                    <IconChevronLeft size={18} />
                  </button>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                      const p = i + 1;
                      return (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className={twMerge(
                            "h-10 w-10 text-xs font-black transition-all rounded-xl border-2",
                            pagination.page === p
                              ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                              : "text-muted-foreground bg-card border-border hover:border-primary hover:text-primary"
                          )}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={pagination.page === pagination.totalPages}
                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-card border-2 border-border text-muted-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary disabled:opacity-30 active:scale-90"
                  >
                    <IconChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <Dialog.Root open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-[60] w-[calc(100%-2rem)] max-w-md translate-x-[-50%] translate-y-[-50%] rounded-3xl bg-card p-8 shadow-2xl animate-in zoom-in-95 fade-in duration-300 outline-none border-2 border-border">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive border-2 border-destructive/10">
                <IconAlertTriangle size={32} />
              </div>
              <div className="space-y-1">
                <Dialog.Title className="text-xl font-black tracking-tight">{t("common.delete")}</Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground">
                  {t("coupons.deleteConfirm")}
                </Dialog.Description>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-8">
              <Dialog.Close asChild>
                <button className="h-12 rounded-xl border-2 border-border bg-card text-sm font-bold text-muted-foreground hover:bg-muted transition-all active:scale-95">
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={() => couponToDelete && deleteMutation.mutate(couponToDelete.id)}
                disabled={deleteMutation.isPending}
                className="h-12 rounded-xl bg-destructive text-sm font-black text-white shadow-lg shadow-destructive/20 hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconTrash className="h-4 w-4" />}
                {t("common.delete")}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
