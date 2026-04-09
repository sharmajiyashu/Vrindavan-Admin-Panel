"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconLoader2, IconPhoto } from "@tabler/icons-react";
import {
  darshanBannerValidationSchema,
  updateDarshanBannerValidationSchema,
  DarshanBannerFormData,
} from "@/lib/validations/darshanBanner";
import { useLanguage } from "@/contexts/LanguageContext";
import { twMerge } from "tailwind-merge";
import { DarshanBanner } from "@/lib/services/darshanBannerService";
import { tourService, Tour } from "@/lib/services/tourService";

interface DarshanBannerFormProps {
  initialData?: DarshanBanner | null;
  onSubmit: (data: DarshanBannerFormData, file?: File) => Promise<void>;
  isLoading?: boolean;
}

export function DarshanBannerForm({ initialData, onSubmit, isLoading }: DarshanBannerFormProps) {
  const { t } = useLanguage();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.media?.url || null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [isLoadingTours, setIsLoadingTours] = useState(false);

  const validationSchema = useMemo(
    () => (initialData ? updateDarshanBannerValidationSchema : darshanBannerValidationSchema),
    [initialData]
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<DarshanBannerFormData>({
    resolver: zodResolver(validationSchema) as any,
    defaultValues: initialData
      ? {
          isActive: initialData.isActive,
          linkType: initialData.linkType === "whatsapp" ? "whatsapp" : "tour",
          tourId: initialData.tourId ?? null,
          whatsappNumber: initialData.whatsappNumber ?? "",
        }
      : {
          isActive: true,
          linkType: "tour",
          tourId: null,
          whatsappNumber: "",
        },
  });

  const linkType = watch("linkType");

  useEffect(() => {
    const fetchTours = async () => {
      setIsLoadingTours(true);
      try {
        const response = await tourService.listTours();
        setTours(response.tours ?? []);
      } catch (err) {
        console.error("Failed to fetch tours:", err);
      } finally {
        setIsLoadingTours(false);
      }
    };
    fetchTours();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleFormSubmit = async (data: DarshanBannerFormData) => {
    await onSubmit(data, imageFile || undefined);
  };

  const inputClasses = "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none";
  const labelClasses = "block text-xs font-black uppercase tracking-widest text-muted-foreground/70 mb-1.5";
  const errorClasses = "text-[10px] font-bold text-destructive mt-1";

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <fieldset className="space-y-2 rounded-2xl border border-border bg-muted/10 p-4">
            <legend className={twMerge(labelClasses, "px-1")}>{t("darshanBanners.linkType")}</legend>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                <input type="radio" value="tour" {...register("linkType")} className="h-4 w-4 text-primary" />
                {t("darshanBanners.linkTypeTour")}
              </label>
              <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                <input type="radio" value="whatsapp" {...register("linkType")} className="h-4 w-4 text-primary" />
                {t("darshanBanners.linkTypeWhatsapp")}
              </label>
            </div>
          </fieldset>

          {linkType === "tour" ? (
            <div>
              <label className={labelClasses}>{t("darshanBanners.tour")}</label>
              <select
                {...register("tourId", {
                  setValueAs: (v) => {
                    if (v === "" || v === null || v === undefined) return null;
                    const n = Number(v);
                    return Number.isNaN(n) ? null : n;
                  },
                })}
                disabled={isLoadingTours}
                className={twMerge(inputClasses, "appearance-none bg-no-repeat bg-right")}
                style={{
                  backgroundImage:
                    'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")',
                  backgroundSize: "1.25rem",
                  backgroundPosition: "calc(100% - 1rem)",
                }}
              >
                <option value="">{t("darshanBanners.selectTour")}</option>
                {tours.map((tour) => (
                  <option key={tour.id} value={tour.id}>
                    {tour.titleEn} ({tour.titleHi})
                  </option>
                ))}
              </select>
              {errors.tourId && <p className={errorClasses}>{errors.tourId.message}</p>}
            </div>
          ) : (
            <div>
              <label className={labelClasses}>{t("darshanBanners.whatsappNumber")}</label>
              <input
                {...register("whatsappNumber")}
                className={inputClasses}
                placeholder="9198xxxxxxx"
                inputMode="tel"
                autoComplete="tel"
              />
              {errors.whatsappNumber && <p className={errorClasses}>{errors.whatsappNumber.message}</p>}
            </div>
          )}

          <div className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-muted/20">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  id="isActive"
                  checked={Boolean(field.value)}
                  onChange={(e) => field.onChange(e.target.checked)}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  className="h-5 w-5 rounded-lg border-border text-primary focus:ring-primary/20"
                />
              )}
            />
            <label htmlFor="isActive" className="text-sm font-bold text-foreground cursor-pointer select-none">
              {t("darshanBanners.active")}
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <label className={labelClasses}>{t("darshanBanners.image")}</label>
          <div className="relative group aspect-video rounded-3xl overflow-hidden border-2 border-dashed border-border flex items-center justify-center bg-muted/10 transition-all hover:bg-muted/20 hover:border-primary/50">
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-xs font-black text-white px-4 py-2 bg-white/20 backdrop-blur rounded-xl border border-white/30">
                    {t("darshanBanners.changeImage")}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <IconPhoto size={48} stroke={1} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{t("darshanBanners.uploadRequired")}</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileChange}
              required={!initialData}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-border">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-10 text-sm font-black text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
        >
          {isLoading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? t("common.save") : t("darshanBanners.add")}
        </button>
      </div>
    </form>
  );
}
