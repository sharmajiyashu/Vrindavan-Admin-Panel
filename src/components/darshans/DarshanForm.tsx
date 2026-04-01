"use client";

import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Tabs from "@radix-ui/react-tabs";
import {
  IconPlus,
  IconTrash,
  IconPhoto,
  IconLoader2,
  IconX,
  IconBuildingSkyscraper,
  IconCalendar
} from "@tabler/icons-react";
import { darshanValidationSchema, DarshanFormData } from "@/lib/validations/darshan";
import { useLanguage } from "@/contexts/LanguageContext";
import { twMerge } from "tailwind-merge";
import { toast } from "react-toastify";
import { Darshan } from "@/lib/services/darshanService";
import { useQuery } from "@tanstack/react-query";
import { templeService } from "@/lib/services/templeService";

interface DarshanFormProps {
  initialData?: Darshan | null;
  onSubmitBasic: (data: DarshanFormData) => Promise<number>;
  onSubmitFiles: (id: number, files: File[]) => Promise<void>;
  onRemoveMedia?: (darshanId: number, mediaId: number) => Promise<void>;
  onComplete: () => void;
  isLoading?: boolean;
}

export function DarshanForm({ initialData, onSubmitBasic, onSubmitFiles, onRemoveMedia, onComplete, isLoading }: DarshanFormProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("basic");
  const [darshanId, setDarshanId] = useState<number | null>(initialData?.id || null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingGallery, setExistingGallery] = useState<any[]>(initialData?.gallery || []);
  const [deletingMediaIds, setDeletingMediaIds] = useState<number[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { data: templesData } = useQuery({
    queryKey: ["temples", "all"],
    queryFn: () => templeService.listTemples(1, 1000), // Get all temples for dropdown
  });

  const temples = templesData?.temples ?? [];

  React.useEffect(() => {
    if (initialData?.gallery) {
      setExistingGallery(initialData.gallery);
    }
  }, [initialData]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DarshanFormData>({
    resolver: zodResolver(darshanValidationSchema) as any,
    defaultValues: initialData ? {
      templeId: initialData.templeId,
      date: initialData.date,
      descriptionEn: initialData.descriptionEn,
      descriptionHi: initialData.descriptionHi,
    } : {
      date: new Date().toISOString().split("T")[0],
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles = Array.from(selectedFiles);
    setFiles((prev) => [...prev, ...newFiles]);

    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const onFormSubmit: SubmitHandler<DarshanFormData> = async (data) => {
    try {
      if (activeTab === "basic") {
        const id = await onSubmitBasic(data);
        setDarshanId(id);
        setActiveTab("gallery");
      } else {
        if (darshanId) {
          setIsUploading(true);
          try {
            if (files.length > 0) {
              await onSubmitFiles(darshanId, files);
            }
            onComplete();
          } finally {
            setIsUploading(false);
          }
        }
      }
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast.error(error.message || "Failed to save darshan details.");
    }
  };

  const inputClasses = "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none";
  const labelClasses = "block text-xs font-black uppercase tracking-widest text-muted-foreground/70 mb-1.5";
  const errorClasses = "text-[10px] font-bold text-destructive mt-1";

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="w-full">
        <Tabs.List className="flex border-b border-border mb-6">
          <Tabs.Trigger
            value="basic"
            className={twMerge(
              "relative px-6 py-3 text-sm font-bold transition-all border-b-2 border-transparent",
              activeTab === "basic" ? "text-primary border-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("darshans.basicDetails") || "Basic Details"}
            {(errors.templeId || errors.date || errors.descriptionEn || errors.descriptionHi) && (
              <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-destructive" />
            )}
          </Tabs.Trigger>
          <Tabs.Trigger
            value="gallery"
            disabled={!darshanId}
            className={twMerge(
              "relative px-6 py-3 text-sm font-bold transition-all border-b-2 border-transparent",
              activeTab === "gallery" ? "text-primary border-primary" : "text-muted-foreground hover:text-foreground",
              !darshanId && "opacity-50 cursor-not-allowed"
            )}
          >
            {t("darshans.gallery")}
            {!darshanId && <div className="absolute inset-0 z-10" title="Complete basic details first" />}
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="basic" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className={labelClasses}>{t("darshans.temple")}</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40">
                  <IconBuildingSkyscraper size={18} />
                </div>
                <select
                  {...register("templeId")}
                  className={twMerge(inputClasses, "pl-11")}
                >
                  <option value="">Select Temple</option>
                  {temples.map((temple) => (
                    <option key={temple.id} value={temple.id}>
                      {temple.nameEn}
                    </option>
                  ))}
                </select>
              </div>
              {errors.templeId && <p className={errorClasses}>{errors.templeId.message}</p>}
            </div>

            <div>
              <label className={labelClasses}>{t("darshans.date")}</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40">
                  <IconCalendar size={18} />
                </div>
                <input
                  type="date"
                  {...register("date")}
                  className={twMerge(inputClasses, "pl-11")}
                />
              </div>
              {errors.date && <p className={errorClasses}>{errors.date.message}</p>}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className={labelClasses}>{t("darshans.descriptionEn")}</label>
              <textarea
                {...register("descriptionEn")}
                className={twMerge(inputClasses, "min-h-[120px]")}
                placeholder="Describe the deity's appearance today..."
              />
              {errors.descriptionEn && <p className={errorClasses}>{errors.descriptionEn.message}</p>}
            </div>
            <div>
              <label className={labelClasses}>{t("darshans.descriptionHi")}</label>
              <textarea
                {...register("descriptionHi")}
                className={twMerge(inputClasses, "min-h-[120px]")}
                placeholder="आज के दर्शन का वर्णन करें..."
              />
              {errors.descriptionHi && <p className={errorClasses}>{errors.descriptionHi.message}</p>}
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="gallery" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {/* Existing Images */}
            {existingGallery.map((media) => (
              <div key={media.id} className="relative group aspect-square rounded-2xl bg-muted/30 overflow-hidden border border-border">
                <img src={media.url} className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all" />
                <button
                  type="button"
                  disabled={deletingMediaIds.includes(media.id)}
                  onClick={async () => {
                    if (onRemoveMedia && darshanId) {
                      try {
                        setDeletingMediaIds(prev => [...prev, media.id]);
                        await onRemoveMedia(darshanId, media.id);
                        setExistingGallery(prev => prev.filter(m => m.id !== media.id));
                      } catch (err) {
                        console.error("Failed to remove media:", err);
                      } finally {
                        setDeletingMediaIds(prev => prev.filter(id => id !== media.id));
                      }
                    }
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-destructive/10 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white disabled:opacity-50"
                >
                  {deletingMediaIds.includes(media.id) ? (
                    <IconLoader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <IconTrash className="h-3 w-3" />
                  )}
                </button>
              </div>
            ))}

            {/* New Previews */}
            {previews.map((src, idx) => (
              <div key={idx} className="relative group aspect-square rounded-2xl bg-muted/30 overflow-hidden border border-primary/20">
                <img src={src} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <IconTrash className="h-3 w-3 text-destructive" />
                </button>
                <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-primary/20 backdrop-blur rounded-md">
                  <span className="text-[8px] font-black text-primary uppercase">New</span>
                </div>
              </div>
            ))}

            <label className={twMerge(
              "cursor-pointer aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center bg-muted/10 hover:bg-muted/30 transition-all hover:border-primary/50",
              isLoading && "opacity-50 cursor-not-allowed pointer-events-none"
            )}>
              <IconPlus className="h-6 w-6 text-muted-foreground" />
              <span className="text-[10px] font-bold text-muted-foreground mt-1">Add Image</span>
              <input type="file" accept="image/*" multiple className="hidden" disabled={isLoading} onChange={handleFileChange} />
            </label>
          </div>
        </Tabs.Content>
      </Tabs.Root>

      <div className="flex flex-col items-end gap-3 pt-6 border-t border-border">
        {Object.keys(errors).length > 0 && (
          <p className="text-xs font-bold text-destructive animate-pulse">
            Please fix the errors before submitting
          </p>
        )}
        <button
          type="submit"
          disabled={isLoading || isUploading}
          className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-2xl bg-primary px-10 text-sm font-black text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
        >
          {(isLoading || isUploading) ? <IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {activeTab === "basic" ? "Next (Save Details)" : "Upload & Finish"}
        </button>
      </div>
    </form>
  );
}
