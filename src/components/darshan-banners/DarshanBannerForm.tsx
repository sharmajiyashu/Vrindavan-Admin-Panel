"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconPlus,
  IconUpload,
  IconLoader2,
  IconX,
  IconMapPin,
  IconPhoto
} from "@tabler/icons-react";
import { darshanBannerValidationSchema, DarshanBannerFormData } from "@/lib/validations/darshanBanner";
import { useLanguage } from "@/contexts/LanguageContext";
import { twMerge } from "tailwind-merge";
import { DarshanBanner } from "@/lib/services/darshanBannerService";
import { templeService, Temple } from "@/lib/services/templeService";

interface DarshanBannerFormProps {
  initialData?: DarshanBanner | null;
  onSubmit: (data: DarshanBannerFormData, file?: File) => Promise<void>;
  isLoading?: boolean;
}

export function DarshanBannerForm({ initialData, onSubmit, isLoading }: DarshanBannerFormProps) {
  const { t } = useLanguage();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.media?.url || null);
  const [temples, setTemples] = useState<Temple[]>([]);
  const [isLoadingTemples, setIsLoadingTemples] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<DarshanBannerFormData>({
    resolver: zodResolver(darshanBannerValidationSchema) as any,
    defaultValues: initialData ? {
      titleEn: initialData.titleEn || "",
      titleHi: initialData.titleHi || "",
      subtitleEn: initialData.subtitleEn || "",
      subtitleHi: initialData.subtitleHi || "",
      templeId: initialData.templeId,
      isActive: initialData.isActive,
    } : {
      titleEn: "",
      titleHi: "",
      subtitleEn: "",
      subtitleHi: "",
      isActive: true,
    },
  });

  useEffect(() => {
    const fetchTemples = async () => {
      setIsLoadingTemples(true);
      try {
        const response = await templeService.listTemples(1, 100);
        setTemples(response.temples);
      } catch (err) {
        console.error("Failed to fetch temples:", err);
      } finally {
        setIsLoadingTemples(false);
      }
    };
    fetchTemples();
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
          <div>
            <label className={labelClasses}>{t("darshanBanners.titleEn")}</label>
            <input {...register("titleEn")} className={inputClasses} placeholder="Morning Special" />
          </div>
          <div>
            <label className={labelClasses}>{t("darshanBanners.titleHi")}</label>
            <input {...register("titleHi")} className={inputClasses} placeholder="सुबह का विशेष" />
          </div>
          <div>
            <label className={labelClasses}>{t("darshanBanners.subtitleEn")}</label>
            <input {...register("subtitleEn")} className={inputClasses} placeholder="Live Darshan" />
          </div>
          <div>
            <label className={labelClasses}>{t("darshanBanners.subtitleHi")}</label>
            <input {...register("subtitleHi")} className={inputClasses} placeholder="लाइव दर्शन" />
          </div>
          
          <div>
            <label className={labelClasses}>{t("darshanBanners.temple")}</label>
            <select 
              {...register("templeId")} 
              className={twMerge(inputClasses, "appearance-none bg-no-repeat bg-right")}
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundSize: '1.25rem', backgroundPosition: 'calc(100% - 1rem)' }}
            >
              <option value="">Select a temple (Optional)</option>
              {temples.map(temple => (
                <option key={temple.id} value={temple.id}>{temple.nameEn} ({temple.nameHi})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-muted/20">
            <input
              type="checkbox"
              id="isActive"
              {...register("isActive")}
              className="h-5 w-5 rounded-lg border-border text-primary focus:ring-primary/20"
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
                <img src={imagePreview} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-xs font-black text-white px-4 py-2 bg-white/20 backdrop-blur rounded-xl border border-white/30">
                    Change Image
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <IconPhoto size={48} stroke={1} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Upload Banner (Required)</span>
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
