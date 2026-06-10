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
import { tourService, Tour } from "@/lib/services/tourService";
import { templeService, Temple } from "@/lib/services/templeService";
import { toast } from "react-toastify";

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
  { en: "Popular", hi: "लोकप्रिय" },
  { en: "VIP Darshan", hi: "वीआईपी दर्शन" },
  { en: "Private Tour", hi: "निजी टूर" },
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
  const [uploadingKeys, setUploadingKeys] = useState<string[]>([]);
  const [singlePreviews, setSinglePreviews] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (initialData?.gallery) {
      setExistingGallery(initialData.gallery);
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
      subtitleEn: initialData.subtitleEn || "",
      subtitleHi: initialData.subtitleHi || "",
      subtextEn: initialData.subtextEn || "",
      subtextHi: initialData.subtextHi || "",
      locationNameEn: initialData.locationNameEn || "",
      locationNameHi: initialData.locationNameHi || "",
      lat: initialData.lat || null,
      long: initialData.long || null,
      templesCoveredCount: initialData.templesCoveredCount || 0,
      durationEn: initialData.durationEn || "",
      durationHi: initialData.durationHi || "",
      slashedPrice: initialData.slashedPrice || null,
      offerText: initialData.offerText || "",
      discountConfig: initialData.discountConfig || null,
      startingAddressEn: initialData.startingAddressEn || "",
      startingAddressHi: initialData.startingAddressHi || "",
      shortHighlightListing: {
        titleEn: initialData.shortHighlightListing?.titleEn || "",
        titleHi: initialData.shortHighlightListing?.titleHi || "",
        iconId: initialData.shortHighlightListing?.iconId || null,
        icon: typeof initialData.shortHighlightListing?.icon === 'object' ? initialData.shortHighlightListing?.icon : null,
      },
      shortHighlightDetails: {
        titleEn: initialData.shortHighlightDetails?.titleEn || "",
        titleHi: initialData.shortHighlightDetails?.titleHi || "",
        iconId: initialData.shortHighlightDetails?.iconId || null,
        icon: typeof initialData.shortHighlightDetails?.icon === 'object' ? initialData.shortHighlightDetails?.icon : null,
      },
      showOnReferralApp: initialData.showOnReferralApp ?? false,
      referralTourSummaryEn: initialData.referralTourSummaryEn || "",
      referralTourSummaryHi: initialData.referralTourSummaryHi || "",
      referralAmount: initialData.referralAmount || 0,
      customerPickupLines: initialData.customerPickupLines || [],
      features: (initialData.features || []).map(f => ({
        ...f,
        icon: typeof f.icon === 'object' ? f.icon : null,
      })),
      itinerary: (initialData.itinerary || []).map(i => ({
        ...i,
        image: typeof i.image === 'object' ? i.image : null,
      })),
      faqs: initialData.faqs || [],
      slots: initialData.slots || [],
      reviews: initialData.reviews || [],
      type: initialData.type || "group",
      minPersons: initialData.minPersons || null,
      maxPersons: initialData.maxPersons || null,
      badgeEn: initialData.badgeEn || "",
      badgeHi: initialData.badgeHi || "",
      cancellationBeforeHours: initialData.cancellationBeforeHours ?? 24,
      shareDetailsBeforeHours: initialData.shareDetailsBeforeHours ?? 2,
      guideDetailsBeforeHours: initialData.guideDetailsBeforeHours ?? 24,
      slotDeadlineHours: initialData.slotDeadlineHours ?? 2,
      isVerified: initialData.isVerified ?? false,
    } : {
      titleEn: "",
      titleHi: "",
      subtitleEn: "",
      subtitleHi: "",
      subtextEn: "",
      subtextHi: "",
      locationNameEn: "",
      locationNameHi: "",
      lat: null,
      long: null,
      price: 0,
      slashedPrice: null,
      offerText: "",
      discountConfig: null,
      extraDiscountPerUser: 0,
      isActive: true,
      isVerified: false,
      templesCoveredCount: 0,
      durationEn: "",
      durationHi: "",
      startingAddressEn: "",
      startingAddressHi: "",
      shortHighlightListing: { titleEn: "", titleHi: "", iconId: null },
      shortHighlightDetails: { titleEn: "", titleHi: "", iconId: null },
      showOnReferralApp: false,
      referralTourSummaryEn: "",
      referralTourSummaryHi: "",
      referralAmount: 0,
      customerPickupLines: [],
      features: [],
      itinerary: [],
      faqs: [],
      slots: [],
      reviews: [],
      type: "group",
      minPersons: null,
      maxPersons: null,
      badgeEn: "",
      badgeHi: "",
      cancellationBeforeHours: 24,
      shareDetailsBeforeHours: 2,
      guideDetailsBeforeHours: 24,
      slotDeadlineHours: 2,
    },
  });

  const tourType = watch("type");
  const faqs = watch("faqs") || [];

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

  const onFormError = (errors: any) => {
    console.error("Form validation errors:", errors);
    const errorCount = Object.keys(errors).length;
    if (errorCount > 0) {
      toast.error(`Please fix ${errorCount} invalid fields before proceeding.`);
    }
  };

  const onFormSubmit: SubmitHandler<TourFormData> = async (data) => {
    try {
      let currentId = tourId;

      // Exclude slots and reviews as they are managed via separate dedicated APIs
      const { slots, reviews, ...basicData } = data;

      if (basicData.type === "private") {
        basicData.minPersons = null;
        basicData.maxPersons = null;
      }

      // Always save basic details first to ensure all changes (including icons/itinerary images) are persisted
      currentId = await onSubmitBasic({
        ...basicData,
        imageIds: existingGallery.map(m => m.id),
      } as any);
      setTourId(currentId);

      if (activeTab === "media") {
        if (currentId) {
          setIsUploading(true);
          try {
            if (galleryFiles.length > 0) {
              await onSubmitFiles(currentId, galleryFiles);
            }
            onComplete();
          } finally {
            setIsUploading(false);
          }
        } else {
          toast.error("Tour ID missing. Please save basic details first.");
        }
      } else {
        // Auto-advance
        const tabSequence = ["basic", "pricing", "logistics", "referral", "content", "media"];
        const currentIndex = tabSequence.indexOf(activeTab);
        const nextTab = tabSequence[currentIndex + 1];
        if (nextTab) {
          setActiveTab(nextTab);
        }
      }
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast.error(error.message || "Failed to save tour details");
    }
  };

  const inputClasses = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none";
  const labelClasses = "block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1";
  const errorClasses = "text-[10px] font-medium text-destructive mt-0.5";

  return (
    <form onSubmit={handleSubmit(onFormSubmit, onFormError)} className="space-y-4">
      <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="w-full">
        <Tabs.List className="flex border-b border-border mb-4 overflow-x-auto scrollbar-none gap-1">
          {[
            { id: "basic", label: t("tours.basicDetails"), hasError: !!(errors.titleEn || errors.titleHi || errors.subtitleEn || errors.subtitleHi || errors.subtextEn || errors.subtextHi) },
            { id: "pricing", label: "Pricing & Discounts", hasError: !!(errors.price || errors.slashedPrice || errors.minPersons || errors.maxPersons || errors.type) },
            { id: "logistics", label: t("tours.logistics"), hasError: !!(errors.lat || errors.long || errors.durationEn || errors.durationHi || errors.startingAddressEn || errors.startingAddressHi || errors.cancellationBeforeHours || errors.shareDetailsBeforeHours || errors.guideDetailsBeforeHours || errors.slotDeadlineHours) },
            { id: "referral", label: "Referral App", hasError: !!(errors.referralTourSummaryEn || errors.referralTourSummaryHi || errors.customerPickupLines) },
            { id: "content", label: t("tours.content"), hasError: !!(errors.features || errors.itinerary || errors.faqs) },
            { id: "media", label: t("tours.media"), disabled: !tourId },
          ].map((tab) => (
            <Tabs.Trigger
              key={tab.id}
              value={tab.id}
              disabled={tab.disabled}
              className={twMerge(
                "relative px-3 py-2 text-xs font-bold transition-all border-b-2 border-transparent whitespace-nowrap",
                activeTab === tab.id ? "text-primary border-primary" : "text-muted-foreground hover:text-foreground",
                tab.disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {tab.label}
              {tab.hasError && (
                <span className="absolute top-1 right-0 h-1 w-1 rounded-full bg-destructive animate-pulse" />
              )}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="basic" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClasses}>{t("tours.titleEn")}</label>
              <input {...register("titleEn")} className={inputClasses} placeholder="Darshan of Vrindavan’s All Major Historic Temples" />
              {errors.titleEn && <p className={errorClasses}>{errors.titleEn.message}</p>}
            </div>
            <div>
              <label className={labelClasses}>{t("tours.titleHi")}</label>
              <input {...register("titleHi")} className={inputClasses} placeholder="वृंदावन के सभी प्रमुख ऐतिहासिक मंदिरों के दर्शन" />
              {errors.titleHi && <p className={errorClasses}>{errors.titleHi.message}</p>}
            </div>

            <div>
              <label className={labelClasses}>{t("tours.subtitleEn")}</label>
              <input {...register("subtitleEn")} className={inputClasses} />
            </div>
            <div>
              <label className={labelClasses}>{t("tours.subtitleHi")}</label>
              <input {...register("subtitleHi")} className={inputClasses} />
            </div>

            <div className="md:col-span-2">
              <label className={labelClasses}>{t("tours.subtextEn")}</label>
              <input {...register("subtextEn")} className={inputClasses} placeholder="Example: Spiritual Journey" />
            </div>
            <div className="md:col-span-2">
              <label className={labelClasses}>{t("tours.subtextHi")}</label>
              <input {...register("subtextHi")} className={inputClasses} placeholder="उदाहरण: आध्यात्मिक यात्रा" />
            </div>

            <div>
              <label className={labelClasses}>{t("tours.locationNameEn")}</label>
              <input {...register("locationNameEn")} className={inputClasses} placeholder="e.g. Vrindavan, Uttar Pradesh" />
              {errors.locationNameEn && <p className={errorClasses}>{errors.locationNameEn.message}</p>}
            </div>
            <div>
              <label className={labelClasses}>{t("tours.locationNameHi")}</label>
              <input {...register("locationNameHi")} className={inputClasses} placeholder="उदा. वृंदावन, उत्तर प्रदेश" />
              {errors.locationNameHi && <p className={errorClasses}>{errors.locationNameHi.message}</p>}
            </div>

            <div className="md:col-span-2 space-y-4">
              <label className={labelClasses}>Tags / Badges Support</label>
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
                      "px-3 py-1 rounded-full text-[10px] font-bold border transition-all",
                      watch("badgeEn") === badge.en
                        ? "bg-primary border-primary text-primary-foreground"
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

            <div className="md:col-span-2 grid gap-4 md:grid-cols-2 p-4 rounded-xl border border-border bg-muted/20">
              <div className="space-y-2">
                <h4 className="text-[9px] font-bold uppercase tracking-wider text-primary">Listing Highlight</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClasses}>Title (EN)</label>
                    <input {...register("shortHighlightListing.titleEn")} className={inputClasses} placeholder="8 Temples" />
                    {errors.shortHighlightListing?.titleEn && <p className={errorClasses}>{errors.shortHighlightListing.titleEn.message}</p>}
                  </div>
                  <div>
                    <label className={labelClasses}>Title (HI)</label>
                    <input {...register("shortHighlightListing.titleHi")} className={inputClasses} placeholder="8 मंदिर" />
                    {errors.shortHighlightListing?.titleHi && <p className={errorClasses}>{errors.shortHighlightListing.titleHi.message}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className={labelClasses}>Icon Image</label>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden relative">
                        {uploadingKeys.includes("listing-icon") ? (
                          <IconLoader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : singlePreviews["listing-icon"] || watch("shortHighlightListing.icon")?.url ? (
                          <img
                            src={singlePreviews["listing-icon"] || watch("shortHighlightListing.icon")?.url || ""}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <IconPhoto className="h-5 w-5 text-muted-foreground/20" />
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        id="listing-icon-upload"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploadingKeys(prev => [...prev, "listing-icon"]);
                            try {
                              const result = await tourService.uploadMedia(file);
                              setValue("shortHighlightListing.iconId", result.id);
                              setValue("shortHighlightListing.icon", result);
                              setSinglePreviews(prev => ({ ...prev, "listing-icon": result.url }));
                              toast.success("Listing icon uploaded");
                            } catch (error) {
                              toast.error("Upload failed");
                            } finally {
                              setUploadingKeys(prev => prev.filter(k => k !== "listing-icon"));
                            }
                          }
                        }}
                      />
                      <label
                        htmlFor="listing-icon-upload"
                        className="px-3 py-2 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider cursor-pointer hover:bg-primary hover:text-white transition-all"
                      >
                        <IconUpload size={14} className="inline mr-1" /> Upload
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-[9px] font-bold uppercase tracking-wider text-primary">Details Highlight</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClasses}>Title (EN)</label>
                    <input {...register("shortHighlightDetails.titleEn")} className={inputClasses} placeholder="8 Temples Covered" />
                    {errors.shortHighlightDetails?.titleEn && <p className={errorClasses}>{errors.shortHighlightDetails.titleEn.message}</p>}
                  </div>
                  <div>
                    <label className={labelClasses}>Title (HI)</label>
                    <input {...register("shortHighlightDetails.titleHi")} className={inputClasses} placeholder="8 मंदिर कवर्ड" />
                    {errors.shortHighlightDetails?.titleHi && <p className={errorClasses}>{errors.shortHighlightDetails.titleHi.message}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className={labelClasses}>Icon Image</label>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden relative">
                        {uploadingKeys.includes("details-icon") ? (
                          <IconLoader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : singlePreviews["details-icon"] || watch("shortHighlightDetails.icon")?.url ? (
                          <img
                            src={singlePreviews["details-icon"] || watch("shortHighlightDetails.icon")?.url || ""}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <IconPhoto className="h-5 w-5 text-muted-foreground/20" />
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        id="details-icon-upload"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploadingKeys(prev => [...prev, "details-icon"]);
                            try {
                              const result = await tourService.uploadMedia(file);
                              setValue("shortHighlightDetails.iconId", result.id);
                              setValue("shortHighlightDetails.icon", result);
                              setSinglePreviews(prev => ({ ...prev, "details-icon": result.url }));
                              toast.success("Details icon uploaded");
                            } catch (error) {
                              toast.error("Upload failed");
                            } finally {
                              setUploadingKeys(prev => prev.filter(k => k !== "details-icon"));
                            }
                          }
                        }}
                      />
                      <label
                        htmlFor="details-icon-upload"
                        className="px-3 py-2 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider cursor-pointer hover:bg-primary hover:text-white transition-all"
                      >
                        <IconUpload size={14} className="inline mr-1" /> Upload
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:col-span-2">
              <div className="flex items-center gap-2 p-3 rounded-xl border border-border bg-muted/20">
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

              <div className="flex items-center gap-2 p-3 rounded-xl border border-border bg-muted/20">
                <input
                  type="checkbox"
                  id="isVerified"
                  {...register("isVerified")}
                  className="h-5 w-5 rounded-lg border-border text-primary focus:ring-primary/20"
                />
                <label htmlFor="isVerified" className="text-sm font-bold text-foreground cursor-pointer select-none">
                  Verified Tour
                </label>
              </div>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="pricing" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClasses}>Tour Type</label>
              <select {...register("type")} className={twMerge(inputClasses, "appearance-none")}>
                <option value="group">Group Tour</option>
                <option value="private">Private Tour</option>
              </select>
              {errors.type && <p className={errorClasses}>{errors.type.message}</p>}
              <p className="text-[10px] text-muted-foreground mt-1">
                {tourType === "private" ? "Private Won’t have per person pricing." : "Group Tour has per person pricing."}
              </p>
            </div>

            {tourType !== "private" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Min Persons</label>
                  <input type="number" {...register("minPersons")} className={inputClasses} placeholder="1" />
                  {errors.minPersons && <p className={errorClasses}>{errors.minPersons.message}</p>}
                </div>
                <div>
                  <label className={labelClasses}>Max Persons</label>
                  <input type="number" {...register("maxPersons")} className={inputClasses} placeholder="10" />
                  {errors.maxPersons && <p className={errorClasses}>{errors.maxPersons.message}</p>}
                </div>
              </div>
            )}

            <div>
              <label className={labelClasses}>Price ({tourType === "private" ? "Complete Price" : "Per Person Price"})</label>
              <input type="number" {...register("price")} className={inputClasses} placeholder="99" />
              {errors.price && <p className={errorClasses}>{errors.price.message}</p>}
            </div>

            <div>
              <label className={labelClasses}>Slashed Price ({tourType === "private" ? "Complete Price" : "Per Person Price"})</label>
              <input type="number" {...register("slashedPrice")} className={inputClasses} placeholder="199" />
              {errors.slashedPrice && <p className={errorClasses}>{errors.slashedPrice.message}</p>}
            </div>

            <div>
              <label className={labelClasses}>Offer Text</label>
              <input {...register("offerText")} className={inputClasses} placeholder="50 % OFF" />
              {errors.offerText && <p className={errorClasses}>{errors.offerText.message}</p>}
            </div>

            <div>
              <label className={labelClasses}>Extra Discount Per User</label>
              <input type="number" {...register("extraDiscountPerUser")} className={inputClasses} placeholder="0" />
              {errors.extraDiscountPerUser && <p className={errorClasses}>{errors.extraDiscountPerUser.message}</p>}
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="logistics" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Starting Address (EN)</label>
                <input {...register("startingAddressEn")} className={inputClasses} placeholder="Shree Banke Bihari Ji Maharaja Temple" />
              </div>
              <div>
                <label className={labelClasses}>Starting Address (HI)</label>
                <input {...register("startingAddressHi")} className={inputClasses} placeholder="श्री बांके बिहारी जी महाराज मंदिर" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>{t("tours.lat")}</label>
                <input type="number" step="any" {...register("lat")} className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>{t("tours.long")}</label>
                <input type="number" step="any" {...register("long")} className={inputClasses} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>{t("tours.durationEn")}</label>
                <input {...register("durationEn")} className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>{t("tours.durationHi")}</label>
                <input {...register("durationHi")} className={inputClasses} />
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border/40">
              <div>
                <label className={labelClasses}>Tour Cancellation Deadline (Hours)</label>
                <input type="number" {...register("cancellationBeforeHours")} className={inputClasses} />
                <p className="text-[10px] text-muted-foreground mt-1">Users can cancel up to this many hours before slot.</p>
              </div>
              <div>
                <label className={labelClasses}>Share Final Details Deadline (Hours)</label>
                <input type="number" {...register("shareDetailsBeforeHours")} className={inputClasses} />
                <p className="text-[10px] text-muted-foreground mt-1">Final details shared x hours before start.</p>
              </div>
              <div>
                <label className={labelClasses}>Guide Details Deadline (Hours)</label>
                <input type="number" {...register("guideDetailsBeforeHours")} className={inputClasses} />
                <p className="text-[10px] text-muted-foreground mt-1">Reveal guide details to user.</p>
              </div>
              <div>
                <label className={labelClasses}>Slot Booking Deadline (Hours)</label>
                <input type="number" {...register("slotDeadlineHours")} className={inputClasses} />
                <p className="text-[10px] text-muted-foreground mt-1">Close slot booking x hours before start.</p>
              </div>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="referral" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-primary/20 bg-primary/5">
              <input
                type="checkbox"
                id="showOnReferralApp"
                {...register("showOnReferralApp")}
                className="h-5 w-5 rounded-lg border-primary text-primary focus:ring-primary/20"
              />
              <label htmlFor="showOnReferralApp" className="text-sm font-bold text-foreground cursor-pointer select-none">
                Show On Referral App
              </label>
            </div>

            {watch("showOnReferralApp") && (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="md:col-span-2 p-4 rounded-xl border border-primary/10 bg-primary/5 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-primary">Referral Earning Configuration</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className={labelClasses}>Referrer Earning Amount (₹)</label>
                      <input
                        type="number"
                        {...register("referralAmount")}
                        className={inputClasses}
                        placeholder="e.g. 100"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {tourType === "private"
                          ? "This amount will be awarded flat per private tour booking."
                          : "This amount will be multiplied by the number of travelers for group tour bookings."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-primary">Tour Summary for Referral App</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className={labelClasses}>Summary (EN)</label>
                      <textarea
                        {...register("referralTourSummaryEn")}
                        className={twMerge(inputClasses, "min-h-[150px] font-mono text-[12px]")}
                        placeholder="🕒 3 hours trip..."
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Summary (HI)</label>
                      <textarea
                        {...register("referralTourSummaryHi")}
                        className={twMerge(inputClasses, "min-h-[150px] font-mono text-[12px]")}
                        placeholder="🕒 3 घंटे की यात्रा..."
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-primary">Customer Pickup Lines</h4>
                  <div className="space-y-3">
                    {watch("customerPickupLines").map((line, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          className={inputClasses}
                          value={line}
                          onChange={(e) => {
                            const newLines = [...watch("customerPickupLines")];
                            newLines[index] = e.target.value;
                            setValue("customerPickupLines", newLines);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newLines = watch("customerPickupLines").filter((_, i) => i !== index);
                            setValue("customerPickupLines", newLines);
                          }}
                          className="p-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
                        >
                          <IconTrash className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setValue("customerPickupLines", [...watch("customerPickupLines"), ""])}
                      className="flex items-center gap-2 text-xs font-bold text-primary hover:opacity-80 transition-all"
                    >
                      <IconPlus className="h-4 w-4" /> Add Pickup Line
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Tabs.Content>

        <Tabs.Content value="content" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Features Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Features</h3>
              <button
                type="button"
                onClick={() => setValue("features", [...(watch("features") || []), { iconId: null, titleEn: "", titleHi: "", descriptionEn: "", descriptionHi: "" }])}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/20 transition-all"
              >
                <IconPlus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
            <div className="grid gap-3">
              {(watch("features") || []).map((_, index) => (
                <div key={index} className="p-4 rounded-xl border border-border bg-card space-y-3 relative">
                  <button
                    type="button"
                    onClick={() => setValue("features", watch("features").filter((_, i) => i !== index))}
                    className="absolute top-3 right-3 p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                  >
                    <IconTrash className="h-3.5 w-3.5" />
                  </button>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className={labelClasses}>Title (EN)</label>
                      <input {...register(`features.${index}.titleEn`)} className={inputClasses} />
                    </div>
                    <div>
                      <label className={labelClasses}>Title (HI)</label>
                      <input {...register(`features.${index}.titleHi`)} className={inputClasses} />
                    </div>
                    <div>
                      <label className={labelClasses}>Description (EN)</label>
                      <textarea {...register(`features.${index}.descriptionEn`)} className={twMerge(inputClasses, "min-h-[60px]")} />
                    </div>
                    <div>
                      <label className={labelClasses}>Description (HI)</label>
                      <textarea {...register(`features.${index}.descriptionHi`)} className={twMerge(inputClasses, "min-h-[60px]")} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClasses}>Icon</label>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg border border-border bg-muted/30 overflow-hidden flex items-center justify-center relative">
                          {uploadingKeys.includes(`feature-${index}`) ? (
                            <IconLoader2 className="h-5 w-5 animate-spin text-primary" />
                          ) : singlePreviews[`feature-${index}`] || watch(`features.${index}.icon`)?.url ? (
                            <img
                              src={singlePreviews[`feature-${index}`] || watch(`features.${index}.icon`)?.url || ""}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <IconPhoto className="h-5 w-5 text-muted-foreground/20" />
                          )}
                        </div>
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setUploadingKeys(prev => [...prev, `feature-${index}`]);
                                try {
                                  const result = await tourService.uploadMedia(file);
                                  setValue(`features.${index}.iconId`, result.id);
                                  setValue(`features.${index}.icon`, result);
                                  setSinglePreviews(prev => ({ ...prev, [`feature-${index}`]: result.url }));
                                  toast.success("Icon uploaded");
                                } catch (error) {
                                  toast.error("Upload failed");
                                } finally {
                                  setUploadingKeys(prev => prev.filter(k => k !== `feature-${index}`));
                                }
                              }
                            }}
                            className="hidden"
                            id={`feature-icon-${index}`}
                          />
                          <label
                            htmlFor={`feature-icon-${index}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-bold cursor-pointer hover:bg-primary hover:text-white transition-all"
                          >
                            <IconUpload size={12} /> Upload
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Itinerary Section */}
          <div className="space-y-3 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Itinerary</h3>
              <button
                type="button"
                onClick={() => setValue("itinerary", [...(watch("itinerary") || []), { imageId: null, titleEn: "", titleHi: "", descriptionEn: "", descriptionHi: "", sectionHeaderEn: "", sectionHeaderHi: "" }])}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/20 transition-all"
              >
                <IconPlus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
            <div className="grid gap-3">
              {(watch("itinerary") || []).map((_, index) => (
                <div key={index} className="p-4 rounded-xl border border-border bg-card space-y-3 relative">
                  <button
                    type="button"
                    onClick={() => setValue("itinerary", watch("itinerary").filter((_, i) => i !== index))}
                    className="absolute top-3 right-3 p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                  >
                    <IconTrash className="h-3.5 w-3.5" />
                  </button>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className={labelClasses}>Section Header (EN) [Optional]</label>
                      <input {...register(`itinerary.${index}.sectionHeaderEn`)} className={inputClasses} placeholder="e.g. Day 1" />
                    </div>
                    <div>
                      <label className={labelClasses}>Section Header (HI) [Optional]</label>
                      <input {...register(`itinerary.${index}.sectionHeaderHi`)} className={inputClasses} placeholder="उदा. पहला दिन" />
                    </div>
                    <div>
                      <label className={labelClasses}>Title (EN)</label>
                      <input {...register(`itinerary.${index}.titleEn`)} className={inputClasses} />
                    </div>
                    <div>
                      <label className={labelClasses}>Title (HI)</label>
                      <input {...register(`itinerary.${index}.titleHi`)} className={inputClasses} />
                    </div>
                    <div>
                      <label className={labelClasses}>Description (EN)</label>
                      <textarea {...register(`itinerary.${index}.descriptionEn`)} className={twMerge(inputClasses, "min-h-[60px]")} />
                    </div>
                    <div>
                      <label className={labelClasses}>Description (HI)</label>
                      <textarea {...register(`itinerary.${index}.descriptionHi`)} className={twMerge(inputClasses, "min-h-[60px]")} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClasses}>Image</label>
                      <div className="flex items-center gap-3">
                        <div className="h-16 w-24 rounded-lg border border-border bg-muted/30 overflow-hidden flex items-center justify-center relative">
                          {uploadingKeys.includes(`itinerary-${index}`) ? (
                            <IconLoader2 className="h-6 w-6 animate-spin text-primary" />
                          ) : singlePreviews[`itinerary-${index}`] || watch(`itinerary.${index}.image`)?.url ? (
                            <img
                              src={singlePreviews[`itinerary-${index}`] || watch(`itinerary.${index}.image`)?.url || ""}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <IconPhoto className="h-6 w-6 text-muted-foreground/20" />
                          )}
                        </div>
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setUploadingKeys(prev => [...prev, `itinerary-${index}`]);
                                try {
                                  const result = await tourService.uploadMedia(file);
                                  setValue(`itinerary.${index}.imageId`, result.id);
                                  setValue(`itinerary.${index}.image`, result);
                                  setSinglePreviews(prev => ({ ...prev, [`itinerary-${index}`]: result.url }));
                                  toast.success("Image uploaded");
                                } catch (error) {
                                  toast.error("Upload failed");
                                } finally {
                                  setUploadingKeys(prev => prev.filter(k => k !== `itinerary-${index}`));
                                }
                              }
                            }}
                            className="hidden"
                            id={`itinerary-image-${index}`}
                          />
                          <label
                            htmlFor={`itinerary-image-${index}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-bold cursor-pointer hover:bg-primary hover:text-white transition-all"
                          >
                            <IconUpload size={12} /> Upload
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQs Section */}
          <div className="space-y-3 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary">FAQs</h3>
              <button
                type="button"
                onClick={() => setValue("faqs", [...(watch("faqs") || []), { questionEn: "", questionHi: "", answerEn: "", answerHi: "" }])}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/20 transition-all"
              >
                <IconPlus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
            <div className="grid gap-3">
              {(watch("faqs") || []).map((_, index) => (
                <div key={index} className="p-4 rounded-xl border border-border bg-card space-y-3 relative">
                  <button
                    type="button"
                    onClick={() => setValue("faqs", watch("faqs").filter((_, i) => i !== index))}
                    className="absolute top-3 right-3 p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                  >
                    <IconTrash className="h-3.5 w-3.5" />
                  </button>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className={labelClasses}>Question (EN)</label>
                      <input {...register(`faqs.${index}.questionEn`)} className={inputClasses} />
                    </div>
                    <div>
                      <label className={labelClasses}>Question (HI)</label>
                      <input {...register(`faqs.${index}.questionHi`)} className={inputClasses} />
                    </div>
                    <div>
                      <label className={labelClasses}>Answer (EN)</label>
                      <textarea {...register(`faqs.${index}.answerEn`)} className={twMerge(inputClasses, "min-h-[60px]")} />
                    </div>
                    <div>
                      <label className={labelClasses}>Answer (HI)</label>
                      <textarea {...register(`faqs.${index}.answerHi`)} className={twMerge(inputClasses, "min-h-[60px]")} />
                    </div>
                  </div>
                </div>
              ))}
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

      <div className="flex flex-col items-end gap-2 pt-4 border-t border-border">
        {Object.keys(errors).length > 0 && (
          <p className="text-[10px] font-bold text-destructive animate-pulse">
            Fix errors ({Object.keys(errors).length})
          </p>
        )}
        <button
          type="submit"
          disabled={isLoading || isUploading}
          className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-xl bg-primary px-8 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
        >
          {(isLoading || isUploading) ? <IconLoader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
          {activeTab === "media" ? "Finish" : "Save & Continue"}
        </button>
      </div>
    </form>
  );
}
