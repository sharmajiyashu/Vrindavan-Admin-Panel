"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconLoader2, IconPhoto } from "@tabler/icons-react";
import { aboutUsSchema, type AboutUsFormData } from "@/lib/validations/aboutUs";
import { useLanguage } from "@/contexts/LanguageContext";
import { twMerge } from "tailwind-merge";
import { AboutUs } from "@/lib/services/aboutUsService";

interface AboutUsFormProps {
  initialData?: AboutUs | null;
  onSubmit: (data: AboutUsFormData, file?: File) => Promise<void>;
  isLoading?: boolean;
}

export function AboutUsForm({ initialData, onSubmit, isLoading }: AboutUsFormProps) {
  const { t } = useLanguage();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image?.url || null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AboutUsFormData>({
    resolver: zodResolver(aboutUsSchema) as any,
    defaultValues: initialData ? {
      imageTitleEn: initialData.imageTitleEn || "",
      imageTitleHi: initialData.imageTitleHi || "",
      visionDescriptionEn: initialData.visionDescriptionEn || "",
      visionDescriptionHi: initialData.visionDescriptionHi || "",
      youtubeUrl: initialData.youtubeUrl || "",
      youtubeDescriptionEn: initialData.youtubeDescriptionEn || "",
      youtubeDescriptionHi: initialData.youtubeDescriptionHi || "",
      whatsappUrl: initialData.whatsappUrl || "",
      whatsappDescriptionEn: initialData.whatsappDescriptionEn || "",
      whatsappDescriptionHi: initialData.whatsappDescriptionHi || "",
      instagramUrl: initialData.instagramUrl || "",
      instagramDescriptionEn: initialData.instagramDescriptionEn || "",
      instagramDescriptionHi: initialData.instagramDescriptionHi || "",
      facebookUrl: initialData.facebookUrl || "",
      facebookDescriptionEn: initialData.facebookDescriptionEn || "",
      facebookDescriptionHi: initialData.facebookDescriptionHi || "",
    } : {
      imageTitleEn: "",
      imageTitleHi: "",
      visionDescriptionEn: "",
      visionDescriptionHi: "",
      youtubeUrl: "",
      youtubeDescriptionEn: "",
      youtubeDescriptionHi: "",
      whatsappUrl: "",
      whatsappDescriptionEn: "",
      whatsappDescriptionHi: "",
      instagramUrl: "",
      instagramDescriptionEn: "",
      instagramDescriptionHi: "",
      facebookUrl: "",
      facebookDescriptionEn: "",
      facebookDescriptionHi: "",
    },
  });

  const inputClasses =
    "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none";
  const labelClasses = "block text-xs font-black uppercase tracking-widest text-muted-foreground/70 mb-1.5";
  const errorClasses = "text-[10px] font-bold text-destructive mt-1";

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        await onSubmit(data, imageFile || undefined);
      })}
      className="space-y-8"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Image Settings</h3>
            <div>
              <label className={labelClasses}>Image Title (English)</label>
              <input
                {...register("imageTitleEn")}
                className={inputClasses}
                placeholder="e.g. About Us"
              />
            </div>
            <div>
              <label className={labelClasses}>Image Title (Hindi)</label>
              <input
                {...register("imageTitleHi")}
                className={inputClasses}
                placeholder="हमारे बारे में"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-lg font-bold">Vision Description</h3>
            <div>
              <label className={labelClasses}>Description (English)</label>
              <textarea
                {...register("visionDescriptionEn")}
                className={twMerge(inputClasses, "min-h-[100px] resize-y")}
                placeholder="Our vision..."
              />
            </div>
            <div>
              <label className={labelClasses}>Description (Hindi)</label>
              <textarea
                {...register("visionDescriptionHi")}
                className={twMerge(inputClasses, "min-h-[100px] resize-y")}
                placeholder="हमारी दृष्टि..."
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <label className={labelClasses}>About Us Image</label>
            <div className="relative group aspect-video rounded-3xl overflow-hidden border-2 border-dashed border-border flex items-center justify-center bg-muted/10 transition-all hover:bg-muted/20 hover:border-primary/50">
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-xs font-black text-white px-4 py-2 bg-white/20 backdrop-blur rounded-xl border border-white/30">
                      Change Image
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <IconPhoto size={48} stroke={1} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-center px-4">
                    Upload Image
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

          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-lg font-bold">Social Links</h3>

            <div className="space-y-4 rounded-xl border border-border p-4 bg-muted/5">
              <h4 className="font-bold text-sm">YouTube</h4>
              <div>
                <label className={labelClasses}>YouTube URL</label>
                <input {...register("youtubeUrl")} className={inputClasses} placeholder="https://youtube.com/..." />
                {errors.youtubeUrl && <p className={errorClasses}>{errors.youtubeUrl.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Description (EN)</label>
                  <input {...register("youtubeDescriptionEn")} className={inputClasses} placeholder="Subscribe to..." />
                </div>
                <div>
                  <label className={labelClasses}>Description (HI)</label>
                  <input {...register("youtubeDescriptionHi")} className={inputClasses} placeholder="सब्सक्राइब करें..." />
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-border p-4 bg-muted/5">
              <h4 className="font-bold text-sm">WhatsApp</h4>
              <div>
                <label className={labelClasses}>WhatsApp URL</label>
                <input {...register("whatsappUrl")} className={inputClasses} placeholder="https://wa.me/..." />
                {errors.whatsappUrl && <p className={errorClasses}>{errors.whatsappUrl.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Description (EN)</label>
                  <input {...register("whatsappDescriptionEn")} className={inputClasses} placeholder="Message us..." />
                </div>
                <div>
                  <label className={labelClasses}>Description (HI)</label>
                  <input {...register("whatsappDescriptionHi")} className={inputClasses} placeholder="हमें संदेश भेजें..." />
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-border p-4 bg-muted/5">
              <h4 className="font-bold text-sm">Instagram</h4>
              <div>
                <label className={labelClasses}>Instagram URL</label>
                <input {...register("instagramUrl")} className={inputClasses} placeholder="https://instagram.com/..." />
                {errors.instagramUrl && <p className={errorClasses}>{errors.instagramUrl.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Description (EN)</label>
                  <input {...register("instagramDescriptionEn")} className={inputClasses} placeholder="Follow on Instagram..." />
                </div>
                <div>
                  <label className={labelClasses}>Description (HI)</label>
                  <input {...register("instagramDescriptionHi")} className={inputClasses} placeholder="इंस्टाग्राम पर फॉलो करें..." />
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-border p-4 bg-muted/5">
              <h4 className="font-bold text-sm">Facebook</h4>
              <div>
                <label className={labelClasses}>Facebook URL</label>
                <input {...register("facebookUrl")} className={inputClasses} placeholder="https://facebook.com/..." />
                {errors.facebookUrl && <p className={errorClasses}>{errors.facebookUrl.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Description (EN)</label>
                  <input {...register("facebookDescriptionEn")} className={inputClasses} placeholder="Like our page..." />
                </div>
                <div>
                  <label className={labelClasses}>Description (HI)</label>
                  <input {...register("facebookDescriptionHi")} className={inputClasses} placeholder="हमारा पेज लाइक करें..." />
                </div>
              </div>
            </div>
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
          {t("common.save")}
        </button>
      </div>
    </form>
  );
}
