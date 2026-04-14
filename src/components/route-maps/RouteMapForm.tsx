"use client";

import React, { useState } from "react";
import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Tabs from "@radix-ui/react-tabs";
import {
  IconPlus,
  IconTrash,
  IconLoader2,
  IconClock,
  IconRoute,
  IconArrowsSort,
  IconMapPin,
  IconX,
  IconCheck
} from "@tabler/icons-react";
import { routeMapValidationSchema, RouteMapFormData } from "@/lib/validations/routeMap";
import { useLanguage } from "@/contexts/LanguageContext";
import { twMerge } from "tailwind-merge";
import { toast } from "react-toastify";
import { RouteMap } from "@/lib/services/routeMapService";
import { useQuery } from "@tanstack/react-query";
import { templeService } from "@/lib/services/templeService";

interface RouteMapFormProps {
  initialData?: RouteMap | null;
  onSubmit: (data: RouteMapFormData) => Promise<RouteMap>;
  onComplete: () => void;
  isLoading?: boolean;
}

export function RouteMapForm({ initialData, onSubmit, onComplete, isLoading }: RouteMapFormProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("basic");
  const [routeMapId, setRouteMapId] = useState<number | null>(initialData?.id || null);

  const { data: templesData } = useQuery({
    queryKey: ["temples", "all"],
    queryFn: () => templeService.listTemples(1, 1000),
  });

  const templesList = templesData?.temples ?? [];

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RouteMapFormData>({
    resolver: zodResolver(routeMapValidationSchema) as any,
    defaultValues: initialData ? {
      nameEn: initialData.nameEn,
      nameHi: initialData.nameHi,
      subtitleEn: initialData.subtitleEn ?? "",
      subtitleHi: initialData.subtitleHi ?? "",
      totalDistanceEn: initialData.totalDistanceEn,
      totalDistanceHi: initialData.totalDistanceHi,
      approxTimeEn: initialData.approxTimeEn,
      approxTimeHi: initialData.approxTimeHi,
      recommendationEn: initialData.recommendationEn,
      recommendationHi: initialData.recommendationHi,
      isActive: initialData.isActive,
      temples: initialData.temples?.map(t => ({
        templeId: t.templeId,
        sortOrder: t.sortOrder ?? 0,
        distanceFromPreviousEn: t.distanceFromPreviousEn,
        distanceFromPreviousHi: t.distanceFromPreviousHi,
        timeFromPreviousEn: t.timeFromPreviousEn,
        timeFromPreviousHi: t.timeFromPreviousHi,
      })) ?? [],
    } : {
      isActive: true,
      temples: [],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "temples",
  });

  const onFormSubmit: SubmitHandler<RouteMapFormData> = async (data) => {
    try {
      const result = await onSubmit(data);
      if (activeTab === "basic") {
        setRouteMapId(result.id);
        setActiveTab("sequence");
      } else {
        onComplete();
      }
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast.error(error.message || "Failed to save route map.");
    }
  };

  const inputClasses = "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none";
  const labelClasses = "block text-xs font-black uppercase tracking-widest text-muted-foreground/70 mb-1.5";
  const errorClasses = "text-[10px] font-bold text-destructive mt-1";

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="w-full">
        <Tabs.List className="flex border-b border-border mb-8">
          <Tabs.Trigger
            value="basic"
            className={twMerge(
              "relative px-8 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 border-transparent",
              activeTab === "basic" ? "text-primary border-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("temples.basicDetails")}
            {(errors.nameEn || errors.nameHi) && (
              <span className="absolute top-3 right-3 flex h-1.5 w-1.5 rounded-full bg-destructive" />
            )}
          </Tabs.Trigger>
          <Tabs.Trigger
            value="sequence"
            disabled={!routeMapId}
            className={twMerge(
              "relative px-8 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 border-transparent",
              activeTab === "sequence" ? "text-primary border-primary" : "text-muted-foreground hover:text-foreground",
              !routeMapId && "opacity-50 cursor-not-allowed"
            )}
          >
            {t("routeMaps.temples")}
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="basic" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className={labelClasses}>{t("routeMaps.nameEn")}</label>
              <input {...register("nameEn")} className={inputClasses} placeholder="Brahmotsavam Route" />
              {errors.nameEn && <p className={errorClasses}>{errors.nameEn.message}</p>}
            </div>
            <div>
              <label className={labelClasses}>{t("routeMaps.nameHi")}</label>
              <input {...register("nameHi")} className={inputClasses} placeholder="ब्रह्मोत्सव मार्ग" />
              {errors.nameHi && <p className={errorClasses}>{errors.nameHi.message}</p>}
            </div>
          </div>
 
           <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className={labelClasses}>{t("routeMaps.subtitleEn")}</label>
              <input {...register("subtitleEn")} className={inputClasses} placeholder="Example Subtitle" />
            </div>
            <div>
              <label className={labelClasses}>{t("routeMaps.subtitleHi")}</label>
              <input {...register("subtitleHi")} className={inputClasses} placeholder="उदाहरण उपशीर्षक" />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="grid gap-4 grid-cols-2">
              <div>
                <label className={labelClasses}>{t("routeMaps.distance")} (EN)</label>
                <input {...register("totalDistanceEn")} className={inputClasses} placeholder="5 km" />
              </div>
              <div>
                <label className={labelClasses}>{t("routeMaps.distance")} (HI)</label>
                <input {...register("totalDistanceHi")} className={inputClasses} placeholder="5 कि.मी." />
              </div>
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div>
                <label className={labelClasses}>{t("routeMaps.time")} (EN)</label>
                <input {...register("approxTimeEn")} className={inputClasses} placeholder="2 hours" />
              </div>
              <div>
                <label className={labelClasses}>{t("routeMaps.time")} (HI)</label>
                <input {...register("approxTimeHi")} className={inputClasses} placeholder="2 घंटे" />
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className={labelClasses}>{t("routeMaps.recommendation")} (EN)</label>
              <textarea {...register("recommendationEn")} className={twMerge(inputClasses, "min-h-[100px]")} placeholder="Start early to avoid crowds..." />
            </div>
            <div>
              <label className={labelClasses}>{t("routeMaps.recommendation")} (HI)</label>
              <textarea {...register("recommendationHi")} className={twMerge(inputClasses, "min-h-[100px]")} placeholder="भीड़ से बचने के लिए जल्दी शुरुआत करें..." />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" {...register("isActive")} className="sr-only peer" />
              <div className="w-11 h-6 bg-muted rounded-full peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full relative" />
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">Route Active</span>
            </label>
          </div>
        </Tabs.Content>

        <Tabs.Content value="sequence" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">{t("routeMaps.temples")}</h3>
            <button
              type="button"
              onClick={() => append({ templeId: 0, sortOrder: fields.length })}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 transition-all active:scale-95 shadow-sm"
            >
              <IconPlus size={16} />
              {t("routeMaps.addTemple")}
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="relative p-6 rounded-[2rem] bg-muted/20 border border-border/60 group">
                <div className="absolute -left-3 top-6 h-7 w-7 rounded-lg bg-card border border-border flex items-center justify-center text-[11px] font-black text-primary shadow-lg ring-4 ring-background">
                  {index + 1}
                </div>

                <div className="grid gap-6 md:grid-cols-12 items-end">
                  <div className="md:col-span-5">
                    <label className={labelClasses}>{t("routeMaps.temples")}</label>
                    <div className="relative">
                      <select {...register(`temples.${index}.templeId` as const)} className={twMerge(inputClasses, "appearance-none cursor-pointer")}>
                        <option value="0">Select Temple</option>
                        {templesList.map(t => (
                          <option key={t.id} value={t.id}>{t.nameEn}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                        <IconArrowsSort size={14} className="rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-3">
                    <label className={labelClasses}>{t("routeMaps.fromPrevious")} (EN)</label>
                    <div className="relative">
                      <IconMapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                      <input {...register(`temples.${index}.distanceFromPreviousEn` as const)} className={twMerge(inputClasses, "pl-9")} placeholder="500m" />
                    </div>
                  </div>

                  <div className="md:col-span-3">
                    <label className={labelClasses}>{t("routeMaps.fromPrevious")} (Time EN)</label>
                    <div className="relative">
                      <IconClock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                      <input {...register(`temples.${index}.timeFromPreviousEn` as const)} className={twMerge(inputClasses, "pl-9")} placeholder="5 mins" />
                    </div>
                  </div>

                  <div className="md:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="h-10 w-10 flex items-center justify-center text-destructive/40 hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all"
                    >
                      <IconTrash size={20} />
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 mt-4 pt-4 border-t border-border/40">
                  <input {...register(`temples.${index}.distanceFromPreviousHi` as const)} className={twMerge(inputClasses, "py-1.5 h-9 text-[10px] font-bold tracking-wide italic")} placeholder="Distance (Hindi)" />
                  <input {...register(`temples.${index}.timeFromPreviousHi` as const)} className={twMerge(inputClasses, "py-1.5 h-9 text-[10px] font-bold tracking-wide italic")} placeholder="Time (Hindi)" />
                </div>

                <div className="absolute -right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                  <button type="button" onClick={() => move(index, index - 1)} disabled={index === 0} className="h-7 w-7 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-all disabled:opacity-30 shadow-sm active:scale-75">
                    <IconArrowsSort size={14} className="rotate-0" />
                  </button>
                  <button type="button" onClick={() => move(index, index + 1)} disabled={index === fields.length - 1} className="h-7 w-7 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-all disabled:opacity-30 shadow-sm active:scale-75">
                    <IconArrowsSort size={14} className="rotate-180" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {fields.length === 0 && (
            <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-border/40 rounded-[3rem] bg-muted/5">
              <div className="h-16 w-16 rounded-[2rem] bg-muted/20 flex items-center justify-center text-muted-foreground/30 mb-4 ring-8 ring-muted/5">
                <IconRoute size={40} />
              </div>
              <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] leading-relaxed text-center">
                No temples in this route.<br />Use the button above to start building the sequence.
              </p>
            </div>
          )}
        </Tabs.Content>
      </Tabs.Root>

      <div className="flex items-center justify-end pt-8 border-t border-border">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-14 items-center justify-center rounded-[1.5rem] bg-primary px-12 text-[11px] font-black uppercase tracking-[0.2em] text-primary-foreground shadow-2xl shadow-primary/20 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
        >
          {isLoading && <IconLoader2 className="mr-3 h-5 w-5 animate-spin" />}
          {activeTab === "basic" ? (
            <>Save & Continue</>
          ) : (
            <>Finish & Save Route</>
          )}
        </button>
      </div>
    </form>
  );
}
