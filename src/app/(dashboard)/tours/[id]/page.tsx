"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IconChevronLeft,
  IconCalendar,
  IconStar,
  IconSettings,
  IconPlus,
  IconTrash,
  IconLoader2,
  IconCheck,
  IconX,
  IconUser,
  IconMapPin,
  IconClock,
  IconUsers
} from "@tabler/icons-react";
import * as Tabs from "@radix-ui/react-tabs";
import { tourService, Tour } from "@/lib/services/tourService";
import { useLanguage } from "@/contexts/LanguageContext";
import { twMerge } from "tailwind-merge";
import { toast } from "react-toastify";
import Link from "next/link";

export default function TourDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const tourId = Number(id);

  const { data: tour, isLoading } = useQuery<Tour>({
    queryKey: ["tour", tourId],
    queryFn: () => tourService.getTourById(tourId),
    enabled: !!tourId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Tour>) => tourService.updateTour(tourId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
      toast.success("Updated successfully");
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <IconLoader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Loading Tour Details...</p>
      </div>
    );
  }

  if (!tour) return null;

  const inputClasses = "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none";
  const labelClasses = "block text-xs font-black uppercase tracking-widest text-muted-foreground/70 mb-1.5";

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header & Back Button */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between px-2">
        <div className="flex items-center gap-4">
          <Link
            href="/tours"
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-card border border-border text-muted-foreground hover:bg-muted transition-all active:scale-90"
          >
            <IconChevronLeft size={20} />
          </Link>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black tracking-tight text-foreground leading-tight">
              {tour.titleEn}
            </h1>
            <p className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <IconMapPin size={12} /> {tour.locationNameEn || "Vrindavan, India"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={twMerge(
            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm",
            tour.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
          )}>
            {tour.isActive ? "Active" : "Inactive"}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Quick Stats & Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-[2rem] border border-border bg-card p-8 shadow-xl space-y-6">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-border bg-muted/30">
              {tour.gallery && tour.gallery[0] ? (
                <img src={tour.gallery[0].url} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                  <IconCalendar size={48} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-muted/30 space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Price</p>
                <p className="text-lg font-black text-primary">₹{tour.price}</p>
              </div>
              <div className="p-4 rounded-2xl bg-muted/30 space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Duration</p>
                <p className="text-sm font-bold text-foreground">{tour.durationEn || "N/A"}</p>
              </div>
              <div className="p-4 rounded-2xl bg-muted/30 space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Temples</p>
                <p className="text-sm font-bold text-foreground">{tour.templesCoveredCount || 0}</p>
              </div>
              <div className="p-4 rounded-2xl bg-muted/30 space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Type</p>
                <p className="text-sm font-bold text-foreground uppercase">{tour.type}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Slot & Review Management */}
        <div className="lg:col-span-2">
          <Tabs.Root defaultValue="slots" className="space-y-6">
            <Tabs.List className="flex p-1.5 gap-1 bg-muted/50 backdrop-blur-sm rounded-[1.5rem] border border-border/60 w-fit">
              <Tabs.Trigger
                value="slots"
                className="flex items-center gap-2 px-6 py-2.5 rounded-[1rem] text-[11px] font-black uppercase tracking-[0.1em] transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-lg text-muted-foreground hover:text-foreground"
              >
                <IconCalendar size={16} /> Slot Management
              </Tabs.Trigger>
              <Tabs.Trigger
                value="reviews"
                className="flex items-center gap-2 px-6 py-2.5 rounded-[1rem] text-[11px] font-black uppercase tracking-[0.1em] transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-lg text-muted-foreground hover:text-foreground"
              >
                <IconStar size={16} /> Review Management
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="slots" className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
              <div className="rounded-[2.5rem] border border-border bg-card p-8 shadow-xl space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black tracking-tight">Active Tour Slots</h3>
                    <p className="text-xs text-muted-foreground">Manage dates, times, and guide contacts for this tour.</p>
                  </div>
                  <button
                    onClick={() => {
                      const newSlot = {
                        date: new Date().toISOString().split('T')[0] || "",
                        startTime: "09:00 AM",
                        slotDeadlineHours: 2,
                        cancellationDeadlineHours: 24,
                        guidePhoneNumber: "",
                        alternateNumber: ""
                      };
                      updateMutation.mutate({ slots: [...(tour?.slots || []), newSlot] });
                    }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-[11px] font-black uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
                  >
                    <IconPlus size={16} /> Add New Slot
                  </button>
                </div>

                <div className="grid gap-4">
                  {(!tour.slots || tour.slots.length === 0) ? (
                    <div className="py-12 text-center border-2 border-dashed border-border rounded-[2rem] bg-muted/5">
                      <p className="text-sm font-medium text-muted-foreground">No slots scheduled for this tour yet.</p>
                    </div>
                  ) : (
                    tour.slots.map((slot, index) => (
                      <div key={index} className="p-6 rounded-[2rem] border border-border bg-muted/20 group hover:bg-card hover:shadow-xl transition-all duration-300 relative">
                        <button
                          onClick={() => {
                            const newSlots = tour?.slots?.filter((_, i) => i !== index);
                            updateMutation.mutate({ slots: newSlots });
                          }}
                          className="absolute -top-2 -right-2 h-8 w-8 flex items-center justify-center rounded-full bg-destructive text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-90"
                        >
                          <IconTrash size={14} />
                        </button>

                        <div className="grid gap-6 md:grid-cols-4">
                          <div>
                            <label className={labelClasses}>Date</label>
                            <div className="relative">
                              <IconCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                              <input
                                type="date"
                                defaultValue={slot.date}
                                onBlur={(e) => {
                                  const newSlots = [...(tour?.slots || [])];
                                  if (newSlots[index]) {
                                    newSlots[index].date = e.target.value;
                                    updateMutation.mutate({ slots: newSlots });
                                  }
                                }}
                                className={twMerge(inputClasses, "pl-10")}
                              />
                            </div>
                          </div>
                          <div>
                            <label className={labelClasses}>Start Time</label>
                            <div className="relative">
                              <IconClock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                              <input
                                defaultValue={slot.startTime}
                                onBlur={(e) => {
                                  const newSlots = [...(tour?.slots || [])];
                                  if (newSlots[index]) {
                                    newSlots[index].startTime = e.target.value;
                                    updateMutation.mutate({ slots: newSlots });
                                  }
                                }}
                                className={twMerge(inputClasses, "pl-10")}
                                placeholder="09:00 AM"
                              />
                            </div>
                          </div>
                          <div>
                            <label className={labelClasses}>Guide Contact</label>
                            <input
                              defaultValue={slot.guidePhoneNumber || ""}
                              onBlur={(e) => {
                                const newSlots = [...(tour?.slots || [])];
                                if (newSlots[index]) {
                                  newSlots[index].guidePhoneNumber = e.target.value;
                                  updateMutation.mutate({ slots: newSlots });
                                }
                              }}
                              className={inputClasses}
                              placeholder="Phone Number"
                            />
                          </div>
                          <div>
                            <label className={labelClasses}>Alternate Number</label>
                            <input
                              defaultValue={slot.alternateNumber || ""}
                              onBlur={(e) => {
                                const newSlots = [...(tour?.slots || [])];
                                if (newSlots[index]) {
                                  newSlots[index].alternateNumber = e.target.value;
                                  updateMutation.mutate({ slots: newSlots });
                                }
                              }}
                              className={inputClasses}
                              placeholder="Alt Phone"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Tabs.Content>

            <Tabs.Content value="reviews" className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
              <div className="rounded-[2.5rem] border border-border bg-card p-8 shadow-xl space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black tracking-tight">Tour Reviews</h3>
                    <p className="text-xs text-muted-foreground">Monitor and manage user feedback and testimonials.</p>
                  </div>
                  <button
                    onClick={() => {
                      const newReview = {
                        userName: "New User",
                        date: new Date().toISOString().split('T')[0] || "",
                        rating: 5,
                        reviewText: "Great experience!",
                        isAdminAdded: true
                      };
                      updateMutation.mutate({ reviews: [...(tour?.reviews || []), newReview] });
                    }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-[11px] font-black uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
                  >
                    <IconPlus size={16} /> Add Testimonial
                  </button>
                </div>

                <div className="grid gap-6">
                  {(!tour.reviews || tour.reviews.length === 0) ? (
                    <div className="py-12 text-center border-2 border-dashed border-border rounded-[2rem] bg-muted/5">
                      <p className="text-sm font-medium text-muted-foreground">No reviews found for this tour.</p>
                    </div>
                  ) : (
                    tour.reviews.map((review, index) => (
                      <div key={index} className="p-8 rounded-[2rem] border border-border bg-muted/20 group hover:bg-card hover:shadow-2xl transition-all duration-500 relative">
                        <button
                          onClick={() => {
                            const newReviews = tour?.reviews?.filter((_, i) => i !== index);
                            updateMutation.mutate({ reviews: newReviews });
                          }}
                          className="absolute top-6 right-6 h-10 w-10 flex items-center justify-center rounded-xl bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive hover:text-white"
                        >
                          <IconTrash size={18} />
                        </button>

                        <div className="space-y-6">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                              <IconUser size={24} />
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-3">
                                <input
                                  defaultValue={review.userName}
                                  onBlur={(e) => {
                                    const newReviews = [...(tour?.reviews || [])];
                                    if (newReviews[index]) {
                                      newReviews[index].userName = e.target.value;
                                      updateMutation.mutate({ reviews: newReviews });
                                    }
                                  }}
                                  className="bg-transparent border-none p-0 text-base font-black focus:ring-0 w-fit min-w-[150px]"
                                />
                                {review.isAdminAdded && (
                                  <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest">
                                    Verified Admin
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <IconStar
                                    key={star}
                                    size={14}
                                    className={twMerge(
                                      "cursor-pointer transition-all",
                                      star <= review.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"
                                    )}
                                    onClick={() => {
                                      const newReviews = [...(tour?.reviews || [])];
                                      if (newReviews[index]) {
                                        newReviews[index].rating = star;
                                        updateMutation.mutate({ reviews: newReviews });
                                      }
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Posted On</p>
                              <p className="text-xs font-bold text-foreground">{new Date(review.date).toLocaleDateString()}</p>
                            </div>
                          </div>

                          <textarea
                            defaultValue={review.reviewText}
                            onBlur={(e) => {
                              const newReviews = [...(tour?.reviews || [])];
                              if (newReviews[index]) {
                                newReviews[index].reviewText = e.target.value;
                                updateMutation.mutate({ reviews: newReviews });
                              }
                            }}
                            className="w-full bg-card/50 border border-border/60 rounded-2xl p-4 text-sm font-medium leading-relaxed resize-none focus:border-primary outline-none transition-all min-h-[100px]"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </div>
    </div>
  );
}
