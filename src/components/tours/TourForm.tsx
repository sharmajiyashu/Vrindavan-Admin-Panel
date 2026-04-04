"use client";

import React, { useState, useEffect } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Tabs from "@radix-ui/react-tabs";
import { RichTextEditor } from "@/components/RichTextEditor";
import {
  IconPlus,
  IconTrash,
  IconUpload,
  IconPhoto,
  IconLoader2,
  IconX,
  IconMapPin,
  IconCheck
} from "@tabler/icons-react";
import { tourValidationSchema, TourFormData } from "@/lib/validations/tour";
import { useLanguage } from "@/contexts/LanguageContext";
import { twMerge } from "tailwind-merge";
import { Tour } from "@/lib/services/tourService";
import { templeService, Temple } from "@/lib/services/templeService";

interface TourFormProps {
  initialData?: Tour | null;
  onSubmitBasic: (data: TourFormData) => Promise<number>;
  onSubmitFiles: (id: number, files: File[]) => Promise<void>;
  onRemoveMedia?: (tourId: number, mediaId: number) => Promise<void>;
  onComplete: () => void;
  isLoading?: boolean;
}

const PREDEFINED_BADGES = [
  { en: "Bestseller", hi: "बेस्टसेलर" },
  { en: "Value For Money", hi: "पैसे की कीमत" },
  { en: "Popular", hi: "लोकप्रिय" },
  { en: "Private", hi: "निजी" },
  { en: "Group", hi: "समूह" },
];

export function TourForm({ initialData, onSubmitBasic, onSubmitFiles, onRemoveMedia, onComplete, isLoading }: TourFormProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("basic");
  const [tourId, setTourId] = useState<number | null>(initialData?.id || null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [existingGallery, setExistingGallery] = useState<any[]>(initialData?.gallery || []);
  const [deletingMediaIds, setDeletingMediaIds] = useState<number[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Temple selection state
  const [allTemples, setAllTemples] = useState<Temple[]>([]);
  const [selectedTempleIds, setSelectedTempleIds] = useState<number[]>(initialData?.temples?.map(t => t.id) || []);
  const [selectedMorningSlots, setSelectedMorningSlots] = useState<string[]>(initialData?.morningSlots || []);
  const [selectedEveningSlots, setSelectedEveningSlots] = useState<string[]>(initialData?.eveningSlots || []);
  const [isLoadingTemples, setIsLoadingTemples] = useState(false);

  const morningOptions = ["6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM"];
  const eveningOptions = ["4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM"];

  const toggleSlot = (slot: string, type: "morning" | "evening") => {
    if (type === "morning") {
      const next = selectedMorningSlots.includes(slot) ? selectedMorningSlots.filter(s => s !== slot) : [...selectedMorningSlots, slot];
      setSelectedMorningSlots(next);
      setValue("morningSlots", next);
    } else {
      const next = selectedEveningSlots.includes(slot) ? selectedEveningSlots.filter(s => s !== slot) : [...selectedEveningSlots, slot];
      setSelectedEveningSlots(next);
      setValue("eveningSlots", next);
    }
  };

  useEffect(() => {
    const fetchTemples = async () => {
      setIsLoadingTemples(true);
      try {
        const response = await templeService.listTemples(1, 100);
        setAllTemples(response.temples);
      } catch (err) {
        console.error("Failed to fetch temples:", err);
      } finally {
        setIsLoadingTemples(false);
      }
    };
    fetchTemples();
  }, []);

  useEffect(() => {
    if (initialData?.gallery) {
      setExistingGallery(initialData.gallery);
    }
    if (initialData?.temples) {
      setSelectedTempleIds(initialData.temples.map(t => t.id));
    }
    if (initialData?.morningSlots) {
      setSelectedMorningSlots(initialData.morningSlots);
    }
    if (initialData?.eveningSlots) {
      setSelectedEveningSlots(initialData.eveningSlots);
    }
  }, [initialData]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { errors },
  } = useForm<TourFormData>({
    resolver: zodResolver(tourValidationSchema) as any,
    defaultValues: initialData ? {
      ...initialData,
      templeIds: initialData.temples?.map(t => t.id) || [],
      descriptionEn: initialData.descriptionEn || "",
      descriptionHi: initialData.descriptionHi || "",
      cancellationPolicyEn: initialData.cancellationPolicyEn || "",
      cancellationPolicyHi: initialData.cancellationPolicyHi || "",
      type: initialData.type || "group",
      minPersons: initialData.minPersons || null,
      maxPersons: initialData.maxPersons || null,
      badgeEn: initialData.badgeEn || "",
      badgeHi: initialData.badgeHi || "",
      cancellationBeforeHours: initialData.cancellationBeforeHours ?? 24,
      guideDetailsBeforeHours: initialData.guideDetailsBeforeHours ?? 24,
    } : {
      titleEn: "",
      titleHi: "",
      price: 0,
      extraDiscountPerUser: 0,
      isActive: true,
      templeIds: [],
      descriptionEn: "",
      descriptionHi: "",
      cancellationPolicyEn: "",
      cancellationPolicyHi: "",
      morningSlots: [],
      eveningSlots: [],
      type: "group",
      minPersons: null,
      maxPersons: null,
      badgeEn: "",
      badgeHi: "",
      cancellationBeforeHours: 24,
      guideDetailsBeforeHours: 24,
    },
  });

  const tourType = watch("type");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles = Array.from(selectedFiles);
    setGalleryFiles((prev) => [...prev, ...newFiles]);

    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setGalleryPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleTemple = (id: number) => {
    setSelectedTempleIds(prev => {
      const next = prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id];
      setValue("templeIds", next);
      return next;
    });
  };

  const onFormSubmit: SubmitHandler<TourFormData> = async (data) => {
    try {
      // Always save basic data first and preserve existing images and temples
      const id = await onSubmitBasic({
        ...data,
        templeIds: selectedTempleIds,
        imageIds: existingGallery.map(m => m.id),
        morningSlots: selectedMorningSlots,
        eveningSlots: selectedEveningSlots
      });
      setTourId(id);

      // On final tab, upload media if any and then finish
      if (activeTab === "media") {
        if (id) {
          setIsUploading(true);
          try {
            if (galleryFiles.length > 0) {
              await onSubmitFiles(id, galleryFiles);
            }
            onComplete();
          } finally {
            setIsUploading(false);
          }
        }
      } else {
        // Auto-advance the tab after every successful save (create or update)
        if (activeTab === "basic") setActiveTab("content");
        else if (activeTab === "content") setActiveTab("features");
        else if (activeTab === "features") setActiveTab("logistics");
        else if (activeTab === "logistics") setActiveTab("temples");
        else if (activeTab === "temples") setActiveTab("slots");
        else if (activeTab === "slots") setActiveTab("media");
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
            {t("tours.basicDetails")}
            {(errors.titleEn || errors.titleHi || errors.price) && (
              <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-destructive" />
            )}
          </Tabs.Trigger>
          <Tabs.Trigger
            value="content"
            className={twMerge(
              "relative px-6 py-3 text-sm font-bold transition-all border-b-2 border-transparent",
              activeTab === "content" ? "text-primary border-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("tours.content")}
          </Tabs.Trigger>
          <Tabs.Trigger
            value="features"
            className={twMerge(
              "relative px-6 py-3 text-sm font-bold transition-all border-b-2 border-transparent",
              activeTab === "features" ? "text-primary border-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("tours.features")}
          </Tabs.Trigger>
          <Tabs.Trigger
            value="logistics"
            className={twMerge(
              "relative px-6 py-3 text-sm font-bold transition-all border-b-2 border-transparent",
              activeTab === "logistics" ? "text-primary border-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("tours.logistics")}
          </Tabs.Trigger>
          <Tabs.Trigger
            value="temples"
            className={twMerge(
              "relative px-6 py-3 text-sm font-bold transition-all border-b-2 border-transparent",
              activeTab === "temples" ? "text-primary border-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("tours.temples")}
          </Tabs.Trigger>
          <Tabs.Trigger
            value="slots"
            className={twMerge(
              "relative px-6 py-3 text-sm font-bold transition-all border-b-2 border-transparent",
              activeTab === "slots" ? "text-primary border-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("tours.slots")}
          </Tabs.Trigger>
          <Tabs.Trigger
            value="media"
            disabled={!tourId}
            className={twMerge(
              "relative px-6 py-3 text-sm font-bold transition-all border-b-2 border-transparent",
              activeTab === "media" ? "text-primary border-primary" : "text-muted-foreground hover:text-foreground",
              !tourId && "opacity-50 cursor-not-allowed"
            )}
          >
            {t("tours.media")}
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="basic" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className={labelClasses}>{t("tours.titleEn")}</label>
              <input {...register("titleEn")} className={inputClasses} placeholder="Traditional Braj Yatra" />
              {errors.titleEn && <p className={errorClasses}>{errors.titleEn.message}</p>}
            </div>
            <div>
              <label className={labelClasses}>{t("tours.titleHi")}</label>
              <input {...register("titleHi")} className={inputClasses} placeholder="पारंपरिक ब्रज यात्रा" />
              {errors.titleHi && <p className={errorClasses}>{errors.titleHi.message}</p>}
            </div>

            <div className="md:col-span-2 space-y-4">
              <label className={labelClasses}>Select Badge</label>
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_BADGES.map((badge) => (
                  <button
                    key={badge.en}
                    type="button"
                    onClick={() => {
                      setValue("badgeEn", badge.en);
                      setValue("badgeHi", badge.hi);
                    }}
                    className={twMerge(
                      "px-4 py-1.5 rounded-full text-xs font-bold border transition-all",
                      watch("badgeEn") === badge.en
                        ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "bg-muted/50 border-border text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {badge.en}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setValue("badgeEn", "");
                    setValue("badgeHi", "");
                  }}
                  className="px-4 py-1.5 rounded-full text-xs font-bold border border-destructive/20 text-destructive hover:bg-destructive/10 transition-all"
                >
                  Clear
                </button>
              </div>
            </div>

            <div>
              <input type="hidden" {...register("badgeEn")} />
            </div>
            <div>
              <input type="hidden" {...register("badgeHi")} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>{t("tours.price")}</label>
                <input type="number" {...register("price")} className={inputClasses} placeholder="2500" />
                {errors.price && <p className={errorClasses}>{errors.price.message}</p>}
              </div>
              <div>
                <label className={labelClasses}>{t("tours.discountPrice")}</label>
                <input type="number" {...register("discountPrice")} className={inputClasses} placeholder="1999" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>{t("tours.pricePerPerson")}</label>
                <input type="number" {...register("pricePerPerson")} className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>{t("tours.extraDiscount")}</label>
                <input type="number" {...register("extraDiscountPerUser")} className={inputClasses} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>{t("tours.tourType")}</label>
                <select {...register("type")} className={twMerge(inputClasses, "appearance-none")}>
                  <option value="group">Group Tour</option>
                  <option value="private">Private Tour</option>
                </select>
                {errors.type && <p className={errorClasses}>{errors.type.message as string}</p>}
              </div>

              {tourType === "private" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClasses}>{t("tours.minPersons")}</label>
                    <input type="number" {...register("minPersons")} className={inputClasses} placeholder="1" />
                    {errors.minPersons && <p className={errorClasses}>{errors.minPersons.message as string}</p>}
                  </div>
                  <div>
                    <label className={labelClasses}>{t("tours.maxPersons")}</label>
                    <input type="number" {...register("maxPersons")} className={inputClasses} placeholder="10" />
                    {errors.maxPersons && <p className={errorClasses}>{errors.maxPersons.message as string}</p>}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-muted/20">
              <input
                type="checkbox"
                id="isActive"
                {...register("isActive")}
                className="h-5 w-5 rounded-lg border-border text-primary focus:ring-primary/20"
              />
              <label htmlFor="isActive" className="text-sm font-bold text-foreground cursor-pointer select-none">
                {t("tours.active")}
              </label>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="content" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <label className={labelClasses}>{t("tours.descriptionEn")}</label>
                <Controller
                  name="descriptionEn"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Describe the pilgrimage journey, highlights, and history..."
                    />
                  )}
                />
              </div>
              <div className="space-y-3">
                <label className={labelClasses}>{t("tours.descriptionHi")}</label>
                <Controller
                  name="descriptionHi"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="तीर्थयात्रा, मुख्य आकर्षण और इतिहास का वर्णन करें..."
                    />
                  )}
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 pt-6 border-t border-border/40">
              <div className="space-y-3">
                <label className={labelClasses}>{t("tours.cancellationPolicyEn")}</label>
                <Controller
                  name="cancellationPolicyEn"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Terms for refunds, cancellations, and rescheduling..."
                    />
                  )}
                />
              </div>
              <div className="space-y-3">
                <label className={labelClasses}>{t("tours.cancellationPolicyHi")}</label>
                <Controller
                  name="cancellationPolicyHi"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="रिफंड, रद्दीकरण और पुनर्निर्धारण की शर्तें..."
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="features" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className={labelClasses}>{t("tours.expertGuidance")} (EN)</label>
              <textarea {...register("expertGuidanceEn")} className={twMerge(inputClasses, "min-h-[80px]")} placeholder="Deep historical and mythological insights provided by expert guides..." />
            </div>
            <div>
              <label className={labelClasses}>{t("tours.expertGuidance")} (HI)</label>
              <textarea {...register("expertGuidanceHi")} className={twMerge(inputClasses, "min-h-[80px]")} placeholder="विशेषज्ञों द्वारा विस्तृत ऐतिहासिक और पौराणिक जानकारी..." />
            </div>

            <div>
              <label className={labelClasses}>{t("tours.spiritualImmersion")} (EN)</label>
              <textarea {...register("spiritualImmersionEn")} className={twMerge(inputClasses, "min-h-[80px]")} placeholder="Experience sacred kirtans and deep meditation sessions..." />
            </div>
            <div>
              <label className={labelClasses}>{t("tours.spiritualImmersion")} (HI)</label>
              <textarea {...register("spiritualImmersionHi")} className={twMerge(inputClasses, "min-h-[80px]")} placeholder="पवित्र कीर्तन और गहन ध्यान सत्रों का अनुभव..." />
            </div>

            <div>
              <label className={labelClasses}>{t("tours.hassleFreePlanning")} (EN)</label>
              <textarea {...register("hassleFreePlanningEn")} className={twMerge(inputClasses, "min-h-[80px]")} placeholder="Pre-booked transportation and VIP darshan for a smooth experience..." />
            </div>
            <div>
              <label className={labelClasses}>{t("tours.hassleFreePlanning")} (HI)</label>
              <textarea {...register("hassleFreePlanningHi")} className={twMerge(inputClasses, "min-h-[80px]")} placeholder="सुगम अनुभव के लिए पूर्व-आरक्षित परिवहन और वीआईपी दर्शन..." />
            </div>

            <div>
              <label className={labelClasses}>{t("tours.localInsights")} (EN)</label>
              <textarea {...register("localInsightsEn")} className={twMerge(inputClasses, "min-h-[80px]")} placeholder="Visit hidden temples and sample local braj cuisine..." />
            </div>
            <div>
              <label className={labelClasses}>{t("tours.localInsights")} (HI)</label>
              <textarea {...register("localInsightsHi")} className={twMerge(inputClasses, "min-h-[80px]")} placeholder="छिपे हुए मंदिरों के दर्शन और स्थानीय ब्रज व्यंजनों का स्वाद..." />
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="logistics" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className={labelClasses}>{t("tours.totalWalkMinutes")}</label>
              <input type="number" {...register("totalWalkMinutes")} className={inputClasses} placeholder="45" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>{t("tours.distance")} (EN)</label>
                <input {...register("distanceEn")} className={inputClasses} placeholder="5 km" />
              </div>
              <div>
                <label className={labelClasses}>{t("tours.distance")} (HI)</label>
                <input {...register("distanceHi")} className={inputClasses} placeholder="5 किमी" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>{t("tours.approxTime")} (EN)</label>
                <input {...register("approxTimeEn")} className={inputClasses} placeholder="4 Hours" />
              </div>
              <div>
                <label className={labelClasses}>{t("tours.approxTime")} (HI)</label>
                <input {...register("approxTimeHi")} className={inputClasses} placeholder="4 घंटे" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>{t("tours.recommendation")} (EN)</label>
                <input {...register("recommendationEn")} className={inputClasses} placeholder="Carry water and wear comfortable shoes..." />
              </div>
              <div>
                <label className={labelClasses}>{t("tours.recommendation")} (HI)</label>
                <input {...register("recommendationHi")} className={inputClasses} placeholder="पानी ले जाएँ और आरामदायक जूते पहनें..." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/40">
              <div>
                <label className={labelClasses}>{t("tours.cancellationBeforeHours")}</label>
                <input type="number" {...register("cancellationBeforeHours")} className={inputClasses} />
                <p className="text-[10px] text-muted-foreground mt-1">{t("tours.cancellationBeforeHoursHint")}</p>
              </div>
              <div>
                <label className={labelClasses}>{t("tours.guideDetailsBeforeHour")}</label>
                <input type="number" {...register("guideDetailsBeforeHours")} className={inputClasses} />
                <p className="text-[10px] text-muted-foreground mt-1">{t("tours.guideDetailsBeforeHourHint")}</p>
              </div>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="temples" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground">{t("tours.temples")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {isLoadingTemples ? (
                <div className="col-span-full py-10 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <IconLoader2 className="h-8 w-8 animate-spin" />
                  <p className="text-xs font-bold uppercase tracking-widest">Loading Temples...</p>
                </div>
              ) : allTemples.map((temple) => (
                <button
                  key={temple.id}
                  type="button"
                  onClick={() => toggleTemple(temple.id)}
                  className={twMerge(
                    "flex items-center gap-3 p-3 rounded-2xl border transition-all text-left",
                    selectedTempleIds.includes(temple.id)
                      ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <div className={twMerge(
                    "h-10 w-10 shrink-0 rounded-xl overflow-hidden bg-muted flex items-center justify-center",
                    selectedTempleIds.includes(temple.id) ? "ring-2 ring-primary/20" : ""
                  )}>
                    {temple.thumbnail ? (
                      <img src={temple.thumbnail.url} className="h-full w-full object-cover" />
                    ) : (
                      <IconMapPin className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={twMerge(
                      "text-[11px] font-bold truncate leading-tight",
                      selectedTempleIds.includes(temple.id) ? "text-primary" : "text-foreground"
                    )}>
                      {temple.nameEn}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate opacity-70">{temple.nameHi}</p>
                  </div>
                  {selectedTempleIds.includes(temple.id) && (
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                      <IconCheck className="h-3.5 w-3.5" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="slots" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary">{t("tours.morningSlots")}</h3>
              <div className="grid grid-cols-2 gap-3">
                {morningOptions.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggleSlot(slot, "morning")}
                    className={twMerge(
                      "flex items-center justify-center p-3 rounded-2xl border transition-all text-sm font-bold",
                      selectedMorningSlots.includes(slot)
                        ? "border-primary bg-primary/5 ring-1 ring-primary text-primary"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    {slot}
                    {selectedMorningSlots.includes(slot) && <IconCheck className="ml-2 h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary">{t("tours.eveningSlots")}</h3>
              <div className="grid grid-cols-2 gap-3">
                {eveningOptions.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggleSlot(slot, "evening")}
                    className={twMerge(
                      "flex items-center justify-center p-3 rounded-2xl border transition-all text-sm font-bold",
                      selectedEveningSlots.includes(slot)
                        ? "border-primary bg-primary/5 ring-1 ring-primary text-primary"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    {slot}
                    {selectedEveningSlots.includes(slot) && <IconCheck className="ml-2 h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="media" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="space-y-4">
            <label className={labelClasses}>{t("tours.gallery")}</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {existingGallery.map((media) => (
                <div key={media.id} className="relative group aspect-square rounded-2xl bg-muted/30 overflow-hidden border border-border">
                  <img src={media.url} className="w-full h-full object-cover opacity-80" />
                  <button
                    type="button"
                    disabled={deletingMediaIds.includes(media.id)}
                    onClick={async () => {
                      if (onRemoveMedia && tourId) {
                        try {
                          setDeletingMediaIds(prev => [...prev, media.id]);
                          await onRemoveMedia(tourId, media.id);
                          setExistingGallery(prev => prev.filter(m => m.id !== media.id));
                        } catch (err) {
                          console.error("Failed to remove media:", err);
                        } finally {
                          setDeletingMediaIds(prev => prev.filter(id => id !== media.id));
                        }
                      }
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-destructive/10 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white"
                  >
                    {deletingMediaIds.includes(media.id) ? <IconLoader2 className="h-3 w-3 animate-spin" /> : <IconTrash className="h-3 w-3" />}
                  </button>
                </div>
              ))}

              {galleryPreviews.map((src, idx) => (
                <div key={idx} className="relative group aspect-square rounded-2xl bg-muted/30 overflow-hidden border border-primary/20">
                  <img src={src} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeFile(idx)} className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <IconTrash className="h-3 w-3 text-destructive" />
                  </button>
                </div>
              ))}

              <label className="cursor-pointer aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center bg-muted/10 hover:bg-muted/30 transition-all hover:border-primary/50">
                <IconPlus className="h-6 w-6 text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground mt-1">Add Image</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          </div>
        </Tabs.Content>
      </Tabs.Root>

      <div className="flex flex-col items-end gap-3 pt-6 border-t border-border">
        {Object.keys(errors).length > 0 && (
          <p className="text-xs font-bold text-destructive animate-pulse">
            Please fix errors ({Object.keys(errors).length} invalid)
          </p>
        )}
        <button
          type="submit"
          disabled={isLoading || isUploading}
          className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-2xl bg-primary px-10 text-sm font-black text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
        >
          {(isLoading || isUploading) ? <IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {activeTab === "media" ? "Upload & Finish" : "Save & Continue"}
        </button>
      </div>
    </form>
  );
}
