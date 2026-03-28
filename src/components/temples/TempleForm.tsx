"use client";

import React, { useState } from "react";
import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Tabs from "@radix-ui/react-tabs";
import {
  IconPlus,
  IconTrash,
  IconUpload,
  IconVideo,
  IconMusic,
  IconPhoto,
  IconLoader2,
  IconX
} from "@tabler/icons-react";
import { templeValidationSchema, TempleFormData } from "@/lib/validations/temple";
import { useLanguage } from "@/contexts/LanguageContext";
import { twMerge } from "tailwind-merge";
import { Temple } from "@/lib/services/templeService";

interface TempleFormProps {
  initialData?: Temple | null;
  onSubmitBasic: (data: TempleFormData) => Promise<number>;
  onSubmitFiles: (id: number, files: Record<string, File | File[] | undefined>) => Promise<void>;
  onRemoveMedia?: (templeId: number, mediaId: number) => Promise<void>;
  onComplete: () => void;
  isLoading?: boolean;
}

export function TempleForm({ initialData, onSubmitBasic, onSubmitFiles, onRemoveMedia, onComplete, isLoading }: TempleFormProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("basic");
  const [templeId, setTempleId] = useState<number | null>(initialData?.id || null);
  const [files, setFiles] = useState<Record<string, File | File[] | undefined>>({});
  const [previews, setPreviews] = useState<Record<string, string | string[] | undefined>>({});
  const [existingGallery, setExistingGallery] = useState<any[]>(initialData?.gallery || []);
  const [deletingMediaIds, setDeletingMediaIds] = useState<number[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  React.useEffect(() => {
    if (initialData?.gallery) {
      setExistingGallery(initialData.gallery);
    }
  }, [initialData]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TempleFormData>({
    resolver: zodResolver(templeValidationSchema) as any,
    defaultValues: initialData || {
      morningTimings: [],
      eveningTimings: [],
      isActive: true,
    },
  });

  const { fields: morningFields, append: appendMorning, remove: removeMorning } = useFieldArray({
    control,
    name: "morningTimings",
  });

  const { fields: eveningFields, append: appendEvening, remove: removeEvening } = useFieldArray({
    control,
    name: "eveningTimings",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string, isMultiple = false) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    if (isMultiple) {
      const newFiles = Array.from(selectedFiles);
      setFiles((prev) => {
        const current = (prev[fieldName] as File[]) || [];
        return { ...prev, [fieldName]: [...current, ...newFiles] };
      });

      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviews((prev) => {
        const current = (prev[fieldName] as string[]) || [];
        return { ...prev, [fieldName]: [...current, ...newPreviews] };
      });
    } else {
      const file = selectedFiles[0];
      if (file) {
        setFiles((prev): Record<string, File | File[] | undefined> => {
          return { ...prev, [fieldName]: file };
        });
        setPreviews((prev): Record<string, string | string[] | undefined> => {
          return { ...prev, [fieldName]: URL.createObjectURL(file) };
        });
      }
    }
  };

  const removeFile = (fieldName: string, index?: number) => {
    if (index !== undefined) {
      setFiles((prev) => {
        const currentFiles = prev[fieldName] as File[] || [];
        const updatedFiles = currentFiles.filter((_, i) => i !== index);
        const newState = { ...prev };
        if (updatedFiles.length === 0) delete newState[fieldName];
        else newState[fieldName] = updatedFiles;
        return newState;
      });
      setPreviews((prev) => {
        const currentPreviews = prev[fieldName] as string[] || [];
        const updatedPreviews = currentPreviews.filter((_, i) => i !== index);
        const newState = { ...prev };
        if (updatedPreviews.length === 0) delete newState[fieldName];
        else newState[fieldName] = updatedPreviews;
        return newState;
      });
    } else {
      setFiles((prev) => {
        const newState = { ...prev };
        delete newState[fieldName];
        return newState;
      });
      setPreviews((prev) => {
        const newState = { ...prev };
        delete newState[fieldName];
        return newState;
      });
    }
  };

  const onFormSubmit: SubmitHandler<TempleFormData> = async (data) => {
    try {
      if (activeTab === "basic") {
        // Include all existing media IDs to prevent the backend from clearing them on update
        const id = await onSubmitBasic({ 
          ...data,
          thumbnailId: initialData?.thumbnailId,
          documentaryVideoId: initialData?.documentaryVideoId,
          audioGuideEnId: initialData?.audioGuideEnId,
          audioGuideHiId: initialData?.audioGuideHiId,
          imageIds: existingGallery.map(m => m.id)
        });
        setTempleId(id);
        setActiveTab("documents");
      } else {
        if (templeId) {
          setIsUploading(true);
          try {
            await onSubmitFiles(templeId, files);
            onComplete();
          } finally {
            setIsUploading(false);
          }
        }
      }
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const inputClasses = "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none";
  const labelClasses = "block text-xs font-black uppercase tracking-widest text-muted-foreground/70 mb-1.5";
  const errorClasses = "text-[10px] font-bold text-destructive mt-1";

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="w-full">
        <Tabs.List className="flex border-b border-border mb-6 overflow-x-auto scrollbar-none">
          <Tabs.Trigger
            value="basic"
            className={twMerge(
              "relative px-6 py-3 text-sm font-bold transition-all border-b-2 border-transparent",
              activeTab === "basic" ? "text-primary border-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("temples.basicDetails")}
            {(errors.nameEn || errors.nameHi || errors.addressEn || errors.addressHi || errors.cityEn || errors.cityHi || errors.stateEn || errors.stateHi || errors.lat || errors.long || errors.descriptionEn || errors.descriptionHi) && (
              <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-destructive" />
            )}
          </Tabs.Trigger>
          <Tabs.Trigger
            value="documents"
            disabled={!templeId}
            className={twMerge(
              "relative px-6 py-3 text-sm font-bold transition-all border-b-2 border-transparent",
              activeTab === "documents" ? "text-primary border-primary" : "text-muted-foreground hover:text-foreground",
              !templeId && "opacity-50 cursor-not-allowed"
            )}
          >
            {t("temples.documents")}
            {(errors.morningTimings || errors.eveningTimings) && (
              <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-destructive" />
            )}
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="basic" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className={labelClasses}>{t("temples.nameEn")}</label>
              <input {...register("nameEn")} className={inputClasses} placeholder="Vrindavan Temple" />
              {errors.nameEn && <p className={errorClasses}>{errors.nameEn.message}</p>}
            </div>
            <div>
              <label className={labelClasses}>{t("temples.nameHi")}</label>
              <input {...register("nameHi")} className={inputClasses} placeholder="वृंदावन मंदिर" />
              {errors.nameHi && <p className={errorClasses}>{errors.nameHi.message}</p>}
            </div>

            <div>
              <label className={labelClasses}>{t("temples.addressEn")}</label>
              <input {...register("addressEn")} className={inputClasses} placeholder="123 Street, Vrindavan" />
              {errors.addressEn && <p className={errorClasses}>{errors.addressEn.message}</p>}
            </div>
            <div>
              <label className={labelClasses}>{t("temples.addressHi")}</label>
              <input {...register("addressHi")} className={inputClasses} placeholder="123 स्ट्रीट, वृंदावन" />
              {errors.addressHi && <p className={errorClasses}>{errors.addressHi.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>{t("temples.cityEn")}</label>
                <input {...register("cityEn")} className={inputClasses} placeholder="Vrindavan" />
                {errors.cityEn && <p className={errorClasses}>{errors.cityEn.message}</p>}
              </div>
              <div>
                <label className={labelClasses}>{t("temples.stateEn")}</label>
                <input {...register("stateEn")} className={inputClasses} placeholder="Uttar Pradesh" />
                {errors.stateEn && <p className={errorClasses}>{errors.stateEn.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>{t("temples.cityHi")}</label>
                <input {...register("cityHi")} className={inputClasses} placeholder="वृंदावन" />
                {errors.cityHi && <p className={errorClasses}>{errors.cityHi.message}</p>}
              </div>
              <div>
                <label className={labelClasses}>{t("temples.stateHi")}</label>
                <input {...register("stateHi")} className={inputClasses} placeholder="उत्तर प्रदेश" />
                {errors.stateHi && <p className={errorClasses}>{errors.stateHi.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>{t("temples.lat")}</label>
                <input type="number" step="any" {...register("lat")} className={inputClasses} />
                {errors.lat && <p className={errorClasses}>{errors.lat.message}</p>}
              </div>
              <div>
                <label className={labelClasses}>{t("temples.long")}</label>
                <input type="number" step="any" {...register("long")} className={inputClasses} />
                {errors.long && <p className={errorClasses}>{errors.long.message}</p>}
              </div>
            </div>

            <div>
              <label className={labelClasses}>{t("temples.establishedEn")}</label>
              <input {...register("establishedEn")} className={inputClasses} placeholder="16th Century" />
            </div>
            <div>
              <label className={labelClasses}>{t("temples.establishedHi")}</label>
              <input {...register("establishedHi")} className={inputClasses} placeholder="16वीं शताब्दी" />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className={labelClasses}>{t("temples.descriptionEn")}</label>
              <textarea {...register("descriptionEn")} className={twMerge(inputClasses, "min-h-[120px]")} />
              {errors.descriptionEn && <p className={errorClasses}>{errors.descriptionEn.message}</p>}
            </div>
            <div>
              <label className={labelClasses}>{t("temples.descriptionHi")}</label>
              <textarea {...register("descriptionHi")} className={twMerge(inputClasses, "min-h-[120px]")} />
              {errors.descriptionHi && <p className={errorClasses}>{errors.descriptionHi.message}</p>}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className={labelClasses}>{t("temples.historyEn")}</label>
              <textarea {...register("historyEn")} className={twMerge(inputClasses, "min-h-[120px]")} />
            </div>
            <div>
              <label className={labelClasses}>{t("temples.historyHi")}</label>
              <textarea {...register("historyHi")} className={twMerge(inputClasses, "min-h-[120px]")} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground">{t("temples.morningTimings")}</h3>
                <button
                  type="button"
                  onClick={() => appendMorning({ nameEn: "", nameHi: "", startTime: "08:00", endTime: "12:00" })}
                  className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-primary hover:underline"
                >
                  {t("temples.addTiming")}
                </button>
              </div>
              {morningFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-2 md:grid-cols-12 gap-3 p-3 rounded-2xl bg-muted/20 border border-border/50 items-end">
                  <div className="col-span-2 md:col-span-3">
                    <label className="text-[9px] font-black uppercase text-muted-foreground/50 mb-1 ml-1">Name (EN)</label>
                    <input {...register(`morningTimings.${index}.nameEn`)} className={twMerge(inputClasses, "text-xs py-2")} placeholder="Morning Aarti" />
                  </div>
                  <div className="col-span-2 md:col-span-3">
                    <label className="text-[9px] font-black uppercase text-muted-foreground/50 mb-1 ml-1">Name (HI)</label>
                    <input {...register(`morningTimings.${index}.nameHi`)} className={twMerge(inputClasses, "text-xs py-2")} placeholder="सुबह की आरती" />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-[9px] font-black uppercase text-muted-foreground/50 mb-1 ml-1">Start</label>
                    <input type="time" {...register(`morningTimings.${index}.startTime`)} className={twMerge(inputClasses, "text-xs py-2")} />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-[9px] font-black uppercase text-muted-foreground/50 mb-1 ml-1">End</label>
                    <input type="time" {...register(`morningTimings.${index}.endTime`)} className={twMerge(inputClasses, "text-xs py-2")} />
                  </div>
                  <div className="col-span-2 md:col-span-2 flex justify-end">
                    <button type="button" onClick={() => removeMorning(index)} className="h-9 w-9 flex items-center justify-center text-destructive hover:bg-destructive/10 rounded-xl transition-colors">
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground">{t("temples.eveningTimings")}</h3>
                <button
                  type="button"
                  onClick={() => appendEvening({ nameEn: "", nameHi: "", startTime: "16:00", endTime: "20:00" })}
                  className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-primary hover:underline"
                >
                  {t("temples.addTiming")}
                </button>
              </div>
              {eveningFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-2 md:grid-cols-12 gap-3 p-3 rounded-2xl bg-muted/20 border border-border/50 items-end">
                  <div className="col-span-2 md:col-span-3">
                    <label className="text-[9px] font-black uppercase text-muted-foreground/50 mb-1 ml-1">Name (EN)</label>
                    <input {...register(`eveningTimings.${index}.nameEn`)} className={twMerge(inputClasses, "text-xs py-2")} placeholder="Evening Aarti" />
                  </div>
                  <div className="col-span-2 md:col-span-3">
                    <label className="text-[9px] font-black uppercase text-muted-foreground/50 mb-1 ml-1">Name (HI)</label>
                    <input {...register(`eveningTimings.${index}.nameHi`)} className={twMerge(inputClasses, "text-xs py-2")} placeholder="शाम की आरती" />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-[9px] font-black uppercase text-muted-foreground/50 mb-1 ml-1">Start</label>
                    <input type="time" {...register(`eveningTimings.${index}.startTime`)} className={twMerge(inputClasses, "text-xs py-2")} />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-[9px] font-black uppercase text-muted-foreground/50 mb-1 ml-1">End</label>
                    <input type="time" {...register(`eveningTimings.${index}.endTime`)} className={twMerge(inputClasses, "text-xs py-2")} />
                  </div>
                  <div className="col-span-2 md:col-span-2 flex justify-end">
                    <button type="button" onClick={() => removeEvening(index)} className="h-9 w-9 flex items-center justify-center text-destructive hover:bg-destructive/10 rounded-xl transition-colors">
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="documents" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="space-y-4">
            <label className={labelClasses}>{t("temples.gallery")}</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {/* Existing Gallery Images */}
              {existingGallery.map((media) => (
                <div key={media.id} className="relative group aspect-square rounded-2xl bg-muted/30 overflow-hidden border border-border">
                  <img src={media.url} className="w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all" />
                  <button
                    type="button"
                    disabled={deletingMediaIds.includes(media.id)}
                    onClick={async () => {
                      if (onRemoveMedia && templeId) {
                        try {
                          setDeletingMediaIds(prev => [...prev, media.id]);
                          await onRemoveMedia(templeId, media.id);
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

              {/* New Photos (Previews) */}
              {Array.isArray(previews.images) && previews.images.map((src, idx) => (
                <div key={idx} className="relative group aspect-square rounded-2xl bg-muted/30 overflow-hidden border border-border border-primary/20">
                  <img src={src} className="w-full h-full object-cover" />
                  {isLoading ? (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
                      <IconLoader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => removeFile("images", idx)}
                      className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <IconTrash className="h-3 w-3 text-destructive" />
                    </button>
                  )}
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
                <input type="file" accept="image/*" multiple className="hidden" disabled={isLoading} onChange={(e) => handleFileChange(e, "images", true)} />
              </label>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Video Section */}
            <div className="space-y-3">
              <label className={labelClasses}>{t("temples.video")}</label>
              <div className={twMerge(
                "relative overflow-hidden p-4 rounded-2xl border bg-card flex items-center gap-3 transition-all",
                (files.documentaryVideo || initialData?.documentaryVideo) ? "border-primary/30" : "border-border"
              )}>
                {isLoading && files.documentaryVideo && (
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-primary/20">
                    <div className="h-full bg-primary animate-progress-indeterminate w-1/3" />
                  </div>
                )}
                <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  {isLoading && files.documentaryVideo ? <IconLoader2 className="h-5 w-5 animate-spin" /> : <IconVideo className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  {files.documentaryVideo ? (
                    <p className="text-xs font-bold truncate">{(files.documentaryVideo as File).name}</p>
                  ) : initialData?.documentaryVideo ? (
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <p className="text-xs font-bold text-primary truncate uppercase tracking-tighter">Documentary</p>
                      <a
                        href={initialData.documentaryVideo?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-muted-foreground hover:text-primary underline truncate"
                      >
                        View current video
                      </a>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-muted-foreground">No video selected</p>
                  )}
                </div>
                {files.documentaryVideo ? (
                  <button type="button" disabled={isLoading || isUploading} onClick={() => removeFile("documentaryVideo")} className="p-1 text-destructive disabled:opacity-30">
                    <IconTrash className="h-4 w-4" />
                  </button>
                ) : initialData?.documentaryVideo ? (
                  <button
                    type="button"
                    disabled={deletingMediaIds.includes(initialData.documentaryVideo?.id || 0) || isLoading || isUploading}
                    onClick={async () => {
                      if (onRemoveMedia && templeId && initialData.documentaryVideo) {
                        try {
                          const mediaId = initialData.documentaryVideo.id;
                          setDeletingMediaIds(prev => [...prev, mediaId]);
                          await onRemoveMedia(templeId, mediaId);
                        } catch (err) {
                          console.error("Failed to remove video:", err);
                        } finally {
                          setDeletingMediaIds(prev => prev.filter(id => id !== initialData.documentaryVideo?.id));
                        }
                      }
                    }}
                    className="p-1 text-destructive disabled:opacity-30"
                  >
                    {deletingMediaIds.includes(initialData.documentaryVideo?.id || 0) ? (
                      <IconLoader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <IconTrash className="h-4 w-4" />
                    )}
                  </button>
                ) : (
                  <label className={twMerge("cursor-pointer p-1 text-primary", (isLoading || isUploading) && "opacity-30 pointer-events-none")}>
                    <IconUpload className="h-4 w-4" />
                    <input type="file" accept="video/*" className="hidden" disabled={isLoading || isUploading} onChange={(e) => handleFileChange(e, "documentaryVideo")} />
                  </label>
                )}
              </div>
            </div>

            {/* Audio EN Section */}
            <div className="space-y-3">
              <label className={labelClasses}>{t("temples.audioEn")}</label>
              <div className={twMerge(
                "relative overflow-hidden p-4 rounded-2xl border bg-card flex items-center gap-3 transition-all",
                (files.audioGuideEn || initialData?.audioGuideEn) ? "border-emerald-100" : "border-border"
              )}>
                {(isLoading || isUploading) && files.audioGuideEn && (
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-emerald-100">
                    <div className="h-full bg-emerald-500 animate-progress-indeterminate w-1/3" />
                  </div>
                )}
                <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-100/50 flex items-center justify-center text-emerald-600">
                  {(isLoading || isUploading) && files.audioGuideEn ? <IconLoader2 className="h-5 w-5 animate-spin" /> : <IconMusic className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  {files.audioGuideEn ? (
                    <p className="text-xs font-bold truncate">{(files.audioGuideEn as File).name}</p>
                  ) : initialData?.audioGuideEn ? (
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <p className="text-xs font-bold text-emerald-600 truncate uppercase tracking-tighter">Audio (EN)</p>
                      <a
                        href={initialData.audioGuideEn?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-muted-foreground hover:text-emerald-600 underline truncate"
                      >
                        Listen to current
                      </a>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-muted-foreground">No audio selected</p>
                  )}
                </div>
                {files.audioGuideEn ? (
                  <button type="button" disabled={isLoading || isUploading} onClick={() => removeFile("audioGuideEn")} className="p-1 text-destructive disabled:opacity-30">
                    <IconTrash className="h-4 w-4" />
                  </button>
                ) : initialData?.audioGuideEn ? (
                  <button
                    type="button"
                    disabled={deletingMediaIds.includes(initialData.audioGuideEn?.id || 0) || isLoading || isUploading}
                    onClick={async () => {
                      if (onRemoveMedia && templeId && initialData.audioGuideEn) {
                        try {
                          const mediaId = initialData.audioGuideEn.id;
                          setDeletingMediaIds(prev => [...prev, mediaId]);
                          await onRemoveMedia(templeId, mediaId);
                        } catch (err) {
                          console.error("Failed to remove audio:", err);
                        } finally {
                          setDeletingMediaIds(prev => prev.filter(id => id !== initialData.audioGuideEn?.id));
                        }
                      }
                    }}
                    className="p-1 text-destructive disabled:opacity-30"
                  >
                    {deletingMediaIds.includes(initialData.audioGuideEn?.id || 0) ? (
                      <IconLoader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <IconTrash className="h-4 w-4" />
                    )}
                  </button>
                ) : (
                  <label className={twMerge("cursor-pointer p-1 text-primary", (isLoading || isUploading) && "opacity-30 pointer-events-none")}>
                    <IconUpload className="h-4 w-4" />
                    <input type="file" accept="audio/*" className="hidden" disabled={isLoading || isUploading} onChange={(e) => handleFileChange(e, "audioGuideEn")} />
                  </label>
                )}
              </div>
            </div>

            {/* Audio HI Section */}
            <div className="space-y-3">
              <label className={labelClasses}>{t("temples.audioHi")}</label>
              <div className={twMerge(
                "relative overflow-hidden p-4 rounded-2xl border bg-card flex items-center gap-3 transition-all",
                (files.audioGuideHi || initialData?.audioGuideHi) ? "border-orange-100" : "border-border"
              )}>
                {(isLoading || isUploading) && files.audioGuideHi && (
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-orange-100">
                    <div className="h-full bg-orange-500 animate-progress-indeterminate w-1/3" />
                  </div>
                )}
                <div className="h-10 w-10 shrink-0 rounded-xl bg-orange-100/50 flex items-center justify-center text-orange-600">
                  {(isLoading || isUploading) && files.audioGuideHi ? <IconLoader2 className="h-5 w-5 animate-spin" /> : <IconMusic className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  {files.audioGuideHi ? (
                    <p className="text-xs font-bold truncate">{(files.audioGuideHi as File).name}</p>
                  ) : initialData?.audioGuideHi ? (
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <p className="text-xs font-bold text-orange-600 truncate uppercase tracking-tighter">Audio (HI)</p>
                      <a
                        href={initialData.audioGuideHi?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-muted-foreground hover:text-orange-600 underline truncate"
                      >
                        Listen to current
                      </a>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-muted-foreground">No audio selected</p>
                  )}
                </div>
                {files.audioGuideHi ? (
                  <button type="button" disabled={isLoading || isUploading} onClick={() => removeFile("audioGuideHi")} className="p-1 text-destructive disabled:opacity-30">
                    <IconTrash className="h-4 w-4" />
                  </button>
                ) : initialData?.audioGuideHi ? (
                  <button
                    type="button"
                    disabled={deletingMediaIds.includes(initialData.audioGuideHi?.id || 0) || isLoading || isUploading}
                    onClick={async () => {
                      if (onRemoveMedia && templeId && initialData.audioGuideHi) {
                        try {
                          const mediaId = initialData.audioGuideHi.id;
                          setDeletingMediaIds(prev => [...prev, mediaId]);
                          await onRemoveMedia(templeId, mediaId);
                        } catch (err) {
                          console.error("Failed to remove audio:", err);
                        } finally {
                          setDeletingMediaIds(prev => prev.filter(id => id !== initialData.audioGuideHi?.id));
                        }
                      }
                    }}
                    className="p-1 text-destructive disabled:opacity-30"
                  >
                    {deletingMediaIds.includes(initialData.audioGuideHi?.id || 0) ? (
                      <IconLoader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <IconTrash className="h-4 w-4" />
                    )}
                  </button>
                ) : (
                  <label className={twMerge("cursor-pointer p-1 text-primary", (isLoading || isUploading) && "opacity-30 pointer-events-none")}>
                    <IconUpload className="h-4 w-4" />
                    <input type="file" accept="audio/*" className="hidden" disabled={isLoading || isUploading} onChange={(e) => handleFileChange(e, "audioGuideHi")} />
                  </label>
                )}
              </div>
            </div>
          </div>
        </Tabs.Content>
      </Tabs.Root>

      <div className="flex flex-col items-end gap-3 pt-6 border-t border-border">
        {Object.keys(errors).length > 0 && (
          <p className="text-xs font-bold text-destructive animate-pulse">
            Please fix the errors before submitting ({Object.keys(errors).length} fields invalid)
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
