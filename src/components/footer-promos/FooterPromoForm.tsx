"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconLoader2, IconPhoto } from "@tabler/icons-react";
import { footerPromoValidationSchema, type FooterPromoFormData } from "@/lib/validations/footerPromo";
import { useLanguage } from "@/contexts/LanguageContext";
import { twMerge } from "tailwind-merge";
import { FooterPromo } from "@/lib/services/footerPromoService";
import { tourService, Tour } from "@/lib/services/tourService";

interface FooterPromoFormProps {
  initialData?: FooterPromo | null;
  onSubmit: (data: FooterPromoFormData, file?: File) => Promise<void>;
  isLoading?: boolean;
}

export function FooterPromoForm({ initialData, onSubmit, isLoading }: FooterPromoFormProps) {
  const { t } = useLanguage();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.media?.url || null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [loadingTours, setLoadingTours] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FooterPromoFormData>({
    resolver: zodResolver(footerPromoValidationSchema) as any,
    defaultValues: initialData
      ? {
        linkType: (initialData as any).linkType === "whatsapp" ? "whatsapp" : "tour",
        tourId: initialData.tourId ?? null,
        whatsappUrl: (initialData as any).whatsappUrl ?? "",
        buttonNameEn: (initialData as any).buttonNameEn ?? "",
        buttonNameHi: (initialData as any).buttonNameHi ?? "",
        showTimes: initialData.showTimes ?? 1,
        isActive: initialData.isActive,
      }
      : {
        linkType: "tour",
        tourId: null,
        whatsappUrl: "",
        buttonNameEn: "",
        buttonNameHi: "",
        showTimes: 1,
        isActive: true,
      },
  });

  const linkType = watch("linkType");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingTours(true);
      try {
        const res = await tourService.listTours();
        if (!cancelled) setTours(res.tours ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoadingTours(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const inputClasses =
    "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none";
  const labelClasses = "block text-xs font-black uppercase tracking-widest text-muted-foreground/70 mb-1.5";
  const errorClasses = "text-[10px] font-bold text-destructive mt-1";

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        await onSubmit(data, imageFile || undefined);
      })}
      className="space-y-6"
    >
      <p className="text-[11px] font-medium text-muted-foreground rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        {t("footerPromos.activeSlotHint")}
      </p>

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
              <label className={labelClasses}>{t("footerPromos.tourOptional")}</label>
              <select
                {...register("tourId", {
                  setValueAs: (v) => {
                    if (v === "" || v == null) return null;
                    const n = Number(v);
                    return Number.isNaN(n) ? null : n;
                  },
                })}
                disabled={loadingTours}
                className={twMerge(inputClasses, "appearance-none bg-no-repeat bg-right")}
                style={{
                  backgroundImage:
                    'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")',
                  backgroundSize: "1.25rem",
                  backgroundPosition: "calc(100% - 1rem)",
                }}
              >
                <option value="">{t("footerPromos.noTour")}</option>
                {tours.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.titleEn} ({x.titleHi})
                  </option>
                ))}
              </select>
              {errors.tourId && <p className={errorClasses}>{errors.tourId.message}</p>}
            </div>
          ) : (
            <div>
              <label className={labelClasses}>{t("darshanBanners.whatsappUrl")}</label>
              <input
                {...register("whatsappUrl" as any)}
                className={inputClasses}
                placeholder="https://wa.me/9198xxxxxxx"
              />
              {(errors as any).whatsappUrl && <p className={errorClasses}>{(errors as any).whatsappUrl.message}</p>}
            </div>
          )}

          <div>
            <label className={labelClasses}>{t("darshanBanners.buttonNameEn")}</label>
            <input
              {...register("buttonNameEn" as any)}
              className={inputClasses}
              placeholder="e.g. Book Now"
            />
          </div>

          <div>
            <label className={labelClasses}>{t("darshanBanners.buttonNameHi")}</label>
            <input
              {...register("buttonNameHi" as any)}
              className={inputClasses}
              placeholder="जैसे. अभी बुक करें"
            />
          </div>

          <div>
            <div>
              <label className={labelClasses}>{t("footerPromos.showTimes")}</label>
              <input type="number" min={1} {...register("showTimes")} className={inputClasses} />
              <p className="text-[9px] text-muted-foreground mt-1 font-medium">{t("footerPromos.showTimesHint")}</p>
              {errors.showTimes && <p className={errorClasses}>{errors.showTimes.message}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-muted/20">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  id="fp-active"
                  checked={Boolean(field.value)}
                  onChange={(e) => field.onChange(e.target.checked)}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  className="h-5 w-5 rounded-lg border-border text-primary focus:ring-primary/20"
                />
              )}
            />
            <label htmlFor="fp-active" className="text-sm font-bold text-foreground cursor-pointer select-none">
              {t("footerPromos.active")}
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <label className={labelClasses}>{t("footerPromos.image")}</label>
          <div className="relative group aspect-[4/3] rounded-3xl overflow-hidden border-2 border-dashed border-border flex items-center justify-center bg-muted/10 transition-all hover:bg-muted/20 hover:border-primary/50">
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-xs font-black text-white px-4 py-2 bg-white/20 backdrop-blur rounded-xl border border-white/30">
                    {t("footerPromos.changeImage")}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <IconPhoto size={48} stroke={1} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-center px-4">
                  {t("footerPromos.uploadHint")}
                </span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setImageFile(f);
                  setImagePreview(URL.createObjectURL(f));
                }
              }}
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
          {initialData ? t("common.save") : t("footerPromos.add")}
        </button>
      </div>
    </form>
  );
}
