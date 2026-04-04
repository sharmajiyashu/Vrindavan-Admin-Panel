"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconTicket,
  IconCalendar,
  IconPercentage,
  IconCurrencyDollar,
  IconHash,
  IconLoader2,
  IconMap2,
  IconCheck
} from "@tabler/icons-react";
import { couponValidationSchema, CouponFormData } from "@/lib/validations/coupon";
import { useLanguage } from "@/contexts/LanguageContext";
import { twMerge } from "tailwind-merge";
import { Coupon } from "@/lib/services/couponService";
import { useQuery } from "@tanstack/react-query";
import { tourService } from "@/lib/services/tourService";

interface CouponFormProps {
  initialData?: Coupon | null;
  onSubmit: (data: CouponFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CouponForm({ initialData, onSubmit, onCancel, isLoading }: CouponFormProps) {
  const { t } = useLanguage();

  const { data: toursData } = useQuery({
    queryKey: ["tours", "all"],
    queryFn: () => tourService.listTours(),
  });

  const tours = toursData?.tours ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponValidationSchema) as any,
    defaultValues: initialData ? {
      code: initialData.code || "",
      discountType: initialData.discountType || "percentage",
      discountValue: initialData.discountValue || 0,
      expiryDate: initialData.expiryDate ? initialData.expiryDate.split("T")[0] : "",
      maxUsage: initialData.maxUsage ?? null,
      tourId: initialData.tourId ?? null,
      isActive: initialData.isActive ?? true,
    } : {
      code: "",
      discountType: "percentage",
      discountValue: 0,
      isActive: true,
      expiryDate: "",
      maxUsage: null,
      tourId: null,
    },
  });

  const discountType = watch("discountType");

  const inputClasses = "w-full rounded-xl border-2 border-border bg-background px-4 py-2.5 text-sm transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none placeholder:text-muted-foreground/30";
  const labelClasses = "block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-1.5 ml-1";
  const errorClasses = "text-[10px] font-bold text-destructive mt-1.5 ml-1";

  const onFormSubmit = async (data: any) => {
    // The data here is validated by zod and will match CouponFormData
    await onSubmit(data as CouponFormData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Code */}
        <div className="md:col-span-2">
          <label className={labelClasses}>{t("coupons.code")}</label>
          <div className="relative group">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors">
              <IconTicket size={18} />
            </div>
            <input
              {...register("code")}
              className={twMerge(inputClasses, "pl-11 font-black tracking-widest uppercase text-base")}
              placeholder="VRINDA25"
            />
          </div>
          {errors.code && <p className={errorClasses}>{errors.code.message}</p>}
        </div>

        {/* Discount Type */}
        <div>
          <label className={labelClasses}>{t("coupons.discountType")}</label>
          <div className="flex bg-muted/50 p-1.5 rounded-xl border-2 border-border shadow-sm">
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                value="percentage"
                {...register("discountType")}
                className="sr-only peer"
              />
              <div className="flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all peer-checked:bg-primary peer-checked:text-primary-foreground text-muted-foreground hover:bg-muted">
                <IconPercentage size={14} />
                {t("coupons.percentage")}
              </div>
            </label>
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                value="flat"
                {...register("discountType")}
                className="sr-only peer"
              />
              <div className="flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all peer-checked:bg-primary peer-checked:text-primary-foreground text-muted-foreground hover:bg-muted">
                <IconCurrencyDollar size={14} />
                {t("coupons.flat")}
              </div>
            </label>
          </div>
        </div>

        {/* Discount Value */}
        <div>
          <label className={labelClasses}>
            {t("coupons.discountValue")} {discountType === "percentage" ? "(%)" : "(₹)"}
          </label>
          <div className="relative group">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors">
              {discountType === "percentage" ? <IconPercentage size={18} /> : <span>₹</span>}
            </div>
            <input
              type="number"
              step="any"
              {...register("discountValue")}
              className={twMerge(inputClasses, "pl-11")}
              placeholder="0"
            />
          </div>
          {errors.discountValue && <p className={errorClasses}>{errors.discountValue.message}</p>}
        </div>

        {/* Expiry Date */}
        <div>
          <label className={labelClasses}>{t("coupons.expiryDate")}</label>
          <div className="relative group">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors">
              <IconCalendar size={18} />
            </div>
            <input
              type="date"
              {...register("expiryDate")}
              className={twMerge(inputClasses, "pl-11")}
            />
          </div>
          {errors.expiryDate && <p className={errorClasses}>{errors.expiryDate.message}</p>}
        </div>

        {/* Max Usage */}
        <div>
          <label className={labelClasses}>{t("coupons.maxUsage")}</label>
          <div className="relative group">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors">
              <IconHash size={18} />
            </div>
            <input
              type="number"
              {...register("maxUsage")}
              className={twMerge(inputClasses, "pl-11")}
              placeholder="Unlimited if empty"
            />
          </div>
          {errors.maxUsage && <p className={errorClasses}>{errors.maxUsage.message}</p>}
        </div>

        {/* Specific Tour */}
        <div className="md:col-span-2">
          <label className={labelClasses}>{t("coupons.tour")}</label>
          <div className="relative group">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors">
              <IconMap2 size={18} />
            </div>
            <select
              {...register("tourId", { valueAsNumber: true })}
              className={twMerge(inputClasses, "pl-11 appearance-none")}
            >
              <option value="">{t("coupons.allTours")}</option>
              {tours.map((tour) => (
                <option key={tour.id} value={tour.id}>
                  {tour.titleEn}
                </option>
              ))}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/40">
              <IconCheck size={14} />
            </div>
          </div>
        </div>

        {/* Active Status */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-border bg-muted/30">
            <input
              type="checkbox"
              id="isActive"
              {...register("isActive")}
              className="h-5 w-5 rounded border-2 border-border text-primary focus:ring-primary/20 accent-primary"
            />
            <label htmlFor="isActive" className="text-sm font-bold text-foreground cursor-pointer">
              {t("coupons.active")}
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t-2 border-border">
        <button
          type="button"
          onClick={onCancel}
          className="h-11 px-8 rounded-xl border-2 border-border bg-card text-xs font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all active:scale-95"
        >
          {t("common.cancel")}
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="h-11 px-10 rounded-xl bg-primary text-xs font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          {isLoading ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconCheck size={16} />}
          {t("common.save")}
        </button>
      </div>
    </form>
  );
}
