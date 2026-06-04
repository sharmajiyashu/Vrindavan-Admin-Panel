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
  IconX,
  IconUser,
  IconMapPin,
  IconClock,
  IconUsers,
  IconPhone,
  IconAlertCircle,
  IconId
} from "@tabler/icons-react";
import * as Tabs from "@radix-ui/react-tabs";
import * as Dialog from "@radix-ui/react-dialog";
import { tourService, Tour, TourSlot } from "@/lib/services/tourService";
import { useLanguage } from "@/contexts/LanguageContext";
import { twMerge } from "tailwind-merge";
import { toast } from "react-toastify";
import Link from "next/link";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { bookingService } from "@/lib/services/bookingService";
import { format, subHours, parse, isValid, addDays, subDays, isToday, isAfter } from "date-fns";
import * as XLSX from "xlsx";

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
      toast.success("Changes saved successfully");
    },
    onError: (error: any) => {
      console.error(`Update failed:`, error);
      toast.error(error.message || "Failed to save changes");
    }
  });

  const slotMutation = useMutation({
    mutationFn: (data: Partial<TourSlot>) => {
      if (data.id) {
        return tourService.updateSlot(data.id, data);
      } else {
        return tourService.addSlot(tourId, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
      toast.success("Slot saved successfully");
      setIsAddModalOpen(false);
      setEditingSlotIndex(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save slot");
    }
  });

  const reviewMutation = useMutation({
    mutationFn: async (review: any) => {
      if (editingReviewIndex !== null && review.id) {
        return tourService.updateReview(review.id, review);
      }
      return tourService.addReview(tourId, review);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
      setIsReviewModalOpen(false);
      setEditingReviewIndex(null);
      toast.success(editingReviewIndex !== null ? "Review updated" : "Review added");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save review");
    }
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: number) => tourService.deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
      toast.success("Review deleted");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete review");
    }
  });

  const cancelBookingMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => bookingService.cancelBooking(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slotBookings"] });
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
      toast.success("Booking cancelled and refunded to wallet");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to cancel booking");
    }
  });

  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [slotToDelete, setSlotToDelete] = useState<{ index: number; slot: TourSlot } | null>(null);
  const [bookingCount, setBookingCount] = useState<number>(0);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);

  const { data: slotBookings, isLoading: isLoadingBookings } = useQuery({
    queryKey: ["slotBookings", tourId, slotToDelete?.slot.date, slotToDelete?.slot.startTime],
    queryFn: () => tourService.getSlotBookings(tourId, slotToDelete!.slot.date, slotToDelete!.slot.startTime, slotToDelete?.slot.id),
    enabled: isAlertOpen && !!slotToDelete,
  });

  const [newSlot, setNewSlot] = useState<Partial<TourSlot>>({
    date: selectedDate,
    startTime: "10:00 AM",
    guideName: "",
    guidePhoneNumber: "",
    alternateNumber: "",
    session: "morning"
  });

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [editingReviewIndex, setEditingReviewIndex] = useState<number | null>(null);
  const [newReview, setNewReview] = useState<any>({
    userName: "",
    userLocation: "",
    reviewText: "",
    rating: 5,
    isAdminAdded: true,
    isActive: true,
    date: new Date().toISOString()
  });

  const [isBookingsModalOpen, setIsBookingsModalOpen] = useState(false);
  const [activeSlotForBookings, setActiveSlotForBookings] = useState<any>(null);

  const checkBookingsAndPrompt = async (index: number, slot: TourSlot) => {
    if (!slot.startTime) {
      toast.error("Slot time is required for this action");
      return;
    }
    const loadingToast = toast.loading("Checking for bookings...");
    try {
      const response = await tourService.getSlotBookingCount(tourId, slot.date, slot.startTime, slot.id);
      toast.dismiss(loadingToast);

      if (response.count > 0) {
        setBookingCount(response.count);
        setSlotToDelete({ index, slot });
        setIsAlertOpen(true);
      } else {
        // If no bookings, we can just cancel it (which deletes it)
        await tourService.cancelSlot(tourId, slot.date, slot.startTime, "Admin removal", slot.id);
        queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
        toast.success("Slot removed");
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error("Failed to check bookings: " + (error.message || "Unknown error"));
    }
  };

  const confirmDelete = async () => {
    if (slotToDelete) {
      if (bookingCount > 0) {
        if (!cancellationReason) {
          toast.error("Cancellation reason is required to notify customers");
          return;
        }
        try {
          await tourService.cancelSlot(tourId, slotToDelete.slot.date, slotToDelete.slot.startTime, cancellationReason, slotToDelete.slot.id);
          toast.success("Slot cancelled and all bookings refunded");
        } catch (error) {
          toast.error("Failed to cancel slot");
          return;
        }
      } else {
        await tourService.cancelSlot(tourId, slotToDelete.slot.date, slotToDelete.slot.startTime, "Admin removal", slotToDelete.slot.id);
      }
      setIsAlertOpen(false);
      setSlotToDelete(null);
      setCancellationReason("");
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    }
  };

  const downloadBookings = async (slot: any) => {
    if (!slot.startTime) {
      toast.error("Slot time is required to download bookings");
      return;
    }
    try {
      const bookings = await tourService.getSlotBookings(tourId, slot.date, slot.startTime, slot.id);
      if (bookings.length === 0) {
        toast.info("No bookings found for this slot");
        return;
      }

      const data = bookings.map(b => ({
        "Booking ID": b.bookingId,
        "Name": b.user?.name || b.contacts?.[0]?.name || "N/A",
        "Phone": b.user?.phone || b.contacts?.[0]?.mobile || "N/A",
        "Email": b.user?.email || b.contacts?.[0]?.email || "N/A",
        "Persons": b.personCount,
        "Total Price": `₹${b.totalPrice}`,
        "Status": b.status,
        "Payment": b.paymentStatus,
        "Booking Date": format(new Date(b.createdAt), "dd MMM yyyy HH:mm")
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Bookings");
      XLSX.writeFile(wb, `Tour_Bookings_${slot.date}_${slot.startTime.replace(/[: ]/g, "_")}.xlsx`);
    } catch (error) {
      toast.error("Failed to download bookings");
    }
  };

  const copyFromPreviousDay = async () => {
    if (!tour?.slots) return;
    const prevDate = format(subDays(new Date(selectedDate), 1), "yyyy-MM-dd");
    const prevSlots = tour.slots.filter(s => s.date === prevDate);

    if (prevSlots.length === 0) {
      toast.error(`No slots found for ${prevDate}`);
      return;
    }

    const newSlotsToAdd = prevSlots
      .map(s => ({
        ...s,
        id: undefined,
        date: selectedDate
      }))
      .filter(ns => !(tour?.slots || []).some(es => es.date === ns.date && es.startTime === ns.startTime));

    if (newSlotsToAdd.length === 0) {
      toast.info("All slots from previous day already exist on this date");
      return;
    }

    const loadingToast = toast.loading(`Copying ${newSlotsToAdd.length} slots...`);
    try {
      const results = await Promise.allSettled(newSlotsToAdd.map(ns => tourService.addSlot(tourId, ns)));

      const fulfilled = results.filter(r => r.status === 'fulfilled').length;
      const rejected = results.filter(r => r.status === 'rejected').length;

      toast.dismiss(loadingToast);

      if (fulfilled > 0) {
        toast.success(`Successfully copied ${fulfilled} slots`);
      }
      if (rejected > 0) {
        toast.error(`Failed to copy ${rejected} slots (possibly duplicates)`);
      }

      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || "An unexpected error occurred during copy");
    }
  };

  const handleAddSlot = () => {
    if (!newSlot.startTime) {
      toast.error("Please select a start time");
      return;
    }

    if (!newSlot.alternateNumber || !newSlot.alternateNumber.trim()) {
      toast.error("Alternate contact number is required");
      return;
    }

    // Date & Time Validation
    const now = new Date();
    const selectedDateObj = parse(newSlot.date!, "yyyy-MM-dd", new Date());
    const slotTimeObj = parse(newSlot.startTime, "hh:mm a", selectedDateObj);

    if (slotTimeObj < now) {
      toast.error("Cannot create a slot for a past time/date");
      return;
    }

    const isDuplicate = tour?.slots?.some(s =>
      s.date === newSlot.date &&
      s.startTime === newSlot.startTime &&
      s.id !== newSlot.id &&
      !s.isCancelled
    );

    if (isDuplicate) {
      toast.error(`An active slot at ${newSlot.startTime} already exists for this date. Please edit the existing slot instead.`);
      return;
    }

    slotMutation.mutate(newSlot);
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <IconLoader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Loading Tour Details...</p>
      </div>
    );
  }

  if (!tour) return null;

  const inputClasses = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none";
  const labelClasses = "block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1";

  return (
    <div className="space-y-4 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Back Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
        <div className="flex items-center gap-3">
          <Link
            href="/tours"
            className="h-8 w-8 flex items-center justify-center rounded-lg bg-card border border-border text-muted-foreground hover:bg-muted transition-all active:scale-90"
          >
            <IconChevronLeft size={16} />
          </Link>
          <div className="space-y-0.5">
            <h1 className="text-lg font-bold tracking-tight text-foreground leading-tight">
              {tour.titleEn}
            </h1>
            <p className="text-[10px] font-medium text-primary uppercase tracking-wider flex items-center gap-1">
              <IconMapPin size={10} /> {tour.locationNameEn || "Vrindavan, India"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingSlotIndex(null);
              setNewSlot({ date: selectedDate, startTime: "10:00 AM", guideName: "", guidePhoneNumber: "", alternateNumber: "" });
              setIsAddModalOpen(true);
            }}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-md shadow-primary/10 hover:opacity-90 active:scale-95 transition-all"
          >
            <IconPlus size={14} /> Add Slot
          </button>
          <div className={twMerge(
            "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border",
            tour.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
          )}>
            {tour.isActive ? "Active" : "Inactive"}
          </div>
          {tour.isVerified && (
            <div className="px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border bg-emerald-50 text-emerald-600 border-emerald-100">
              Verified Tour
            </div>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 px-2">
        <div className="h-16 rounded-xl overflow-hidden border border-border bg-muted/30">
          {tour.gallery && tour.gallery[0] ? (
            <img src={tour.gallery[0].url} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/10">
              <IconCalendar size={16} />
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center p-3 rounded-xl bg-card border border-border shadow-sm">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Price</p>
          <p className="text-base font-bold text-primary leading-tight">₹{tour.price}</p>
        </div>
        <div className="flex flex-col justify-center p-3 rounded-xl bg-card border border-border shadow-sm">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Duration</p>
          <p className="text-sm font-bold text-foreground leading-tight">{tour.durationEn || "N/A"}</p>
        </div>
        <div className="flex flex-col justify-center p-3 rounded-xl bg-card border border-border shadow-sm">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Capacity</p>
          <p className="text-sm font-bold text-foreground leading-tight">
            {tour.type === "private" ? "Private" : `${tour.minPersons || 1} - ${tour.maxPersons || 10}`}
          </p>
        </div>
        <div className="hidden lg:flex flex-col justify-center p-3 rounded-xl bg-primary/5 border border-primary/10">
          <p className="text-[9px] font-bold text-primary uppercase tracking-wider">Total Slots</p>
          <p className="text-sm font-bold text-primary leading-tight">{tour.slots?.length || 0}</p>
        </div>
        <div className="flex flex-col justify-center p-3 rounded-xl bg-amber-50 border border-amber-100">
          <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">Avg Rating</p>
          <div className="flex items-center gap-1">
            <IconStar size={12} className="text-amber-500 fill-amber-500" />
            <p className="text-sm font-bold text-amber-600 leading-tight">{tour.averageRating || "0.0"}</p>
          </div>
        </div>
      </div>

      {/* Main Content: Full Width Tabs */}
      <div className="w-full">
        <Tabs.Root defaultValue="slots" className="space-y-4">
          <Tabs.List className="flex border-b border-border w-full gap-4">
            <Tabs.Trigger
              value="slots"
              className="px-4 py-2 text-xs font-bold transition-all border-b-2 border-transparent data-[state=active]:text-primary data-[state=active]:border-primary text-muted-foreground hover:text-foreground"
            >
              Slots Management
            </Tabs.Trigger>
            <Tabs.Trigger
              value="reviews"
              className="px-4 py-2 text-xs font-bold transition-all border-b-2 border-transparent data-[state=active]:text-primary data-[state=active]:border-primary text-muted-foreground hover:text-foreground"
            >
              Reviews
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="slots" className="animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
              {/* Left Column: Date Selector & Sidebar */}
              <div className="space-y-4 lg:sticky lg:top-4">
                <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-4">
                  <div>
                    <label className={labelClasses}>Select Date</label>
                    <input
                      type="date"
                      min={format(new Date(), "yyyy-MM-dd")}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className={twMerge(inputClasses, "font-bold text-base")}
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={copyFromPreviousDay}
                      className="w-full px-4 py-2 rounded-lg border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider hover:bg-primary/5 transition-all"
                    >
                      Copy From Prev Day
                    </button>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Slot Stats</p>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[10px] text-muted-foreground">Today's Slots</span>
                      <span className="text-xs font-bold">{tour.slots?.filter(s => s.date === selectedDate).length || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-[10px] font-medium text-primary leading-relaxed">
                    Choose a date on the left to manage available slots for that specific day.
                  </p>
                </div>
              </div>

              {/* Right Column: Slots List (Stock Inventory) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Slot Inventory</h3>
                  <p className="text-[10px] font-medium text-muted-foreground">{format(new Date(selectedDate), "EEEE, dd MMM yyyy")}</p>
                </div>

                <div className="space-y-2">
                  {(!tour.slots || tour.slots.filter(s => s.date === selectedDate).length === 0) ? (
                    <div className="py-12 text-center border-2 border-dashed border-border rounded-xl bg-muted/5 flex flex-col items-center gap-3">
                      <IconClock size={32} className="text-muted-foreground/20" />
                      <p className="text-xs font-bold text-muted-foreground">No slots defined for this date.</p>
                    </div>
                  ) : (
                    <div className="grid gap-8">
                      {["morning", "evening"].map(session => {
                        const sessionSlots = tour.slots!
                          .map((slot, originalIndex) => ({ slot, originalIndex }))
                          .filter(item => item.slot.date === selectedDate && !item.slot.isCancelled && (item.slot.session === session || (!item.slot.session && session === "morning")))
                          .sort((a, b) => {
                            const timeA = parse(a.slot.startTime, "hh:mm a", new Date());
                            const timeB = parse(b.slot.startTime, "hh:mm a", new Date());
                            return timeA.getTime() - timeB.getTime();
                          });

                        if (sessionSlots.length === 0) return null;

                        return (
                          <div key={session} className="space-y-3">
                            <div className="flex items-center gap-2 px-2">
                              <div className={twMerge(
                                "h-1.5 w-1.5 rounded-full",
                                session === "morning" ? "bg-amber-400" : "bg-indigo-400"
                              )} />
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                {session} Slots
                              </h4>
                            </div>
                            <div className="grid gap-2">
                              {sessionSlots.map(({ slot, originalIndex }) => {
                                const slotTime = parse(slot.startTime, "hh:mm a", parse(slot.date, "yyyy-MM-dd", new Date()));
                                const isPast = slotTime < new Date();

                                return (
                                  <div
                                    key={slot.id || originalIndex}
                                    className={twMerge(
                                      "group p-3 rounded-xl border border-border transition-all",
                                      isPast ? "bg-muted/30 opacity-60 grayscale-[0.5]" : "bg-card hover:border-primary/30"
                                    )}
                                  >
                                    <div className="flex items-center gap-4">
                                      <div className={twMerge(
                                        "h-10 w-10 rounded-lg flex items-center justify-center border transition-all",
                                        isPast ? "bg-muted text-muted-foreground border-border" : "bg-primary/5 text-primary border-primary/10"
                                      )}>
                                        <IconClock size={16} />
                                      </div>

                                      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                          <p className={labelClasses}>Time</p>
                                          <p className={twMerge("text-xs font-bold", isPast && "line-through")}>{slot.startTime}</p>
                                        </div>
                                        <div>
                                          <p className={labelClasses}>Guide</p>
                                          <p className="text-xs font-medium truncate max-w-[120px]">{slot.guideName || "Unassigned"}</p>
                                        </div>
                                        <div>
                                          <p className={labelClasses}>Contact</p>
                                          <p className="text-xs font-medium">{slot.guidePhoneNumber || "--"}</p>
                                        </div>
                                        <div>
                                          <p className={labelClasses}>Status</p>
                                          <div className="flex items-center gap-1.5">
                                            <div className={twMerge("h-1.5 w-1.5 rounded-full", isPast ? "bg-muted-foreground" : "bg-emerald-500")} />
                                            <span className={twMerge("text-[10px] font-bold uppercase", isPast ? "text-muted-foreground" : "text-emerald-600")}>
                                              {isPast ? "Expired" : "Active"}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1">
                                        {!isPast && (
                                          <button
                                            onClick={() => {
                                              setEditingSlotIndex(originalIndex);
                                              setNewSlot(slot);
                                              setIsAddModalOpen(true);
                                            }}
                                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                                            title="Edit"
                                          >
                                            <IconSettings size={14} />
                                          </button>
                                        )}
                                        <button
                                          onClick={() => {
                                            setActiveSlotForBookings(slot);
                                            setIsBookingsModalOpen(true);
                                          }}
                                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                                          title="View Bookings"
                                        >
                                          <IconUsers size={14} />
                                        </button>
                                        <button
                                          onClick={() => checkBookingsAndPrompt(originalIndex, slot)}
                                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                                          title="Delete"
                                        >
                                          <IconTrash size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Cancelled Slots Tracking Section */}
                {tour.slots && tour.slots.some(s => s.isCancelled) && (
                  <div className="pt-8 space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <IconAlertCircle size={14} className="text-destructive" />
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-destructive">Cancellation History & Logs</h3>
                      </div>
                      <p className="text-[9px] font-bold text-muted-foreground/60">Historical Record of Terminated Slots</p>
                    </div>
                    <div className="grid gap-3">
                      {tour.slots
                        .filter(s => s.isCancelled)
                        .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                        .map((cs: any) => (
                          <div key={cs.id} className="group p-4 rounded-2xl bg-destructive/5 border border-destructive/10 hover:bg-destructive/[0.08] transition-all flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
                                <IconCalendar size={18} />
                              </div>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-foreground">{format(new Date(cs.date), "EEEE, dd MMM yyyy")}</span>
                                  <span className="px-2 py-0.5 rounded-md bg-destructive/10 text-destructive text-[8px] font-black uppercase">{cs.startTime}</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground font-medium leading-relaxed max-w-[400px]">
                                  <span className="font-black text-destructive/80 uppercase text-[8px]">Reason:</span> {cs.cancellationReason}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => {
                                  setActiveSlotForBookings(cs);
                                  setIsBookingsModalOpen(true);
                                }}
                                className="h-9 px-4 rounded-xl bg-destructive text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-destructive/20 hover:scale-105 active:scale-95 transition-all"
                              >
                                View Logs
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Tabs.Content>

          <Tabs.Content value="reviews" className="animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
              {/* Left Column: Stats & Add */}
              <div className="space-y-4 lg:sticky lg:top-4">
                <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Testimonials</h3>
                    <p className="text-[10px] text-muted-foreground font-medium">Manage user feedback and social proof.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="p-2 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="text-[8px] font-bold text-primary uppercase">Total</p>
                      <p className="text-sm font-bold text-primary">{tour.reviews?.length || 0}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                      <p className="text-[8px] font-bold text-emerald-600 uppercase">Active</p>
                      <p className="text-sm font-bold text-emerald-600">{tour.reviews?.filter(r => r.isActive).length || 0}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-50 border border-blue-100">
                      <p className="text-[8px] font-bold text-blue-600 uppercase">Admin</p>
                      <p className="text-sm font-bold text-blue-600">{tour.adminReviewCount || 0}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-purple-50 border border-purple-100">
                      <p className="text-[8px] font-bold text-purple-600 uppercase">Users</p>
                      <p className="text-sm font-bold text-purple-600">{tour.userReviewCount || 0}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-100 col-span-2">
                      <p className="text-[8px] font-bold text-amber-600 uppercase">Average Rating</p>
                      <div className="flex items-center gap-1">
                        <IconStar size={10} className="text-amber-500 fill-amber-500" />
                        <p className="text-sm font-bold text-amber-600">{tour.averageRating || "0.0"}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setEditingReviewIndex(null);
                      setNewReview({
                        userName: "",
                        userLocation: "",
                        reviewText: "",
                        rating: 5,
                        isAdminAdded: true,
                        isActive: true,
                        date: new Date().toISOString()
                      });
                      setIsReviewModalOpen(true);
                    }}
                    className="w-full inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-md shadow-primary/10 hover:opacity-90 active:scale-95 transition-all"
                  >
                    <IconPlus size={14} /> Add Testimonial
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
                    Reviews marked as <strong>Active</strong> will be visible on the mobile app. User-submitted reviews should be reviewed here before activation.
                  </p>
                </div>
              </div>

              {/* Right Column: Reviews List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Moderation Queue</h3>
                </div>

                <div className="space-y-3">
                  {(!tour.reviews || tour.reviews.length === 0) ? (
                    <div className="py-12 text-center border-2 border-dashed border-border rounded-xl bg-muted/5 flex flex-col items-center gap-3">
                      <IconStar size={32} className="text-muted-foreground/20" />
                      <p className="text-xs font-bold text-muted-foreground">No reviews found for this tour.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {tour.reviews
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((review, index) => (
                          <div key={review.id || index} className={twMerge(
                            "group p-4 rounded-xl border transition-all",
                            review.isActive ? "bg-card border-border hover:border-primary/30" : "bg-muted/30 border-dashed border-border opacity-80"
                          )}>
                            <div className="flex gap-4">
                              <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 shrink-0">
                                <IconUser size={18} />
                              </div>

                              <div className="flex-1 space-y-2">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-sm font-bold text-foreground">{review.userName}</h4>
                                      {review.isAdminAdded && (
                                        <span className="px-1.5 py-0.5 rounded-md bg-primary/5 text-primary text-[8px] font-bold uppercase tracking-widest">
                                          Admin
                                        </span>
                                      )}
                                      {!review.isActive && (
                                        <span className="px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground text-[8px] font-bold uppercase tracking-widest">
                                          Hidden
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                      <IconMapPin size={10} /> {review.userLocation || "Global Traveler"} • {format(new Date(review.date), "dd MMM yyyy")}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => {
                                        setEditingReviewIndex(index);
                                        setNewReview(review);
                                        setIsReviewModalOpen(true);
                                      }}
                                      className="p-1.5 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                                      title="Edit"
                                    >
                                      <IconSettings size={14} />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (review.id && confirm("Are you sure you want to delete this review?")) {
                                          deleteReviewMutation.mutate(review.id);
                                        }
                                      }}
                                      className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                                      title="Delete"
                                    >
                                      <IconTrash size={14} />
                                    </button>
                                  </div>
                                </div>

                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <IconStar
                                      key={star}
                                      size={10}
                                      className={twMerge(
                                        star <= review.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"
                                      )}
                                    />
                                  ))}
                                </div>

                                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                                  {review.reviewText}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>

      {/* Add/Edit Slot Modal */}
      <Dialog.Root open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-[100] w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-[2.5rem] bg-card p-8 md:p-10 shadow-2xl animate-in zoom-in-95 fade-in duration-300 outline-none border border-border">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <Dialog.Title className="text-2xl font-black tracking-tight">
                  {newSlot.id ? "Edit Slot" : "Create New Slot"}
                </Dialog.Title>
                <Dialog.Description className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  {newSlot.id ? `Modifying slot on ${format(new Date(selectedDate), "dd MMMM")}` : `Scheduling for ${format(new Date(selectedDate), "EEEE, dd MMMM yyyy")}`}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/50 hover:bg-muted transition-all">
                  <IconX size={20} />
                </button>
              </Dialog.Close>
            </div>

            <div className="grid gap-6 py-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className={labelClasses}>Session</label>
                  <div className="flex bg-muted/40 p-1 rounded-xl border border-border/50">
                    {["morning", "evening"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setNewSlot(prev => ({
                          ...prev,
                          session: s as any,
                          startTime: s === "morning" ? "09:00 AM" : "04:00 PM"
                        }))}
                        className={twMerge(
                          "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                          newSlot.session === s
                            ? "bg-card text-primary shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className={labelClasses}>Start Time</label>
                  <div className="relative">
                    <IconClock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                    <input
                      type="text"
                      placeholder="10:00 AM"
                      value={newSlot.startTime}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, startTime: e.target.value }))}
                      className={twMerge(inputClasses, "pl-10 h-12 font-bold focus:ring-primary/20")}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(newSlot.session === "evening"
                      ? ["12:00 PM", "02:00 PM", "04:00 PM", "06:00 PM", "08:00 PM"]
                      : ["06:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM"]
                    ).map(time => {
                      const slotDate = parse(selectedDate, "yyyy-MM-dd", new Date());
                      const slotTime = parse(time, "hh:mm a", slotDate);
                      const isExpired = isToday(slotDate) && isAfter(new Date(), slotTime);

                      if (isExpired) return null;

                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setNewSlot(prev => ({ ...prev, startTime: time }))}
                          className={twMerge(
                            "px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.05em] border transition-all duration-300",
                            newSlot.startTime === time
                              ? "bg-primary text-white border-primary shadow-lg shadow-primary/30 scale-105"
                              : "bg-muted/40 text-muted-foreground border-border/50 hover:bg-muted hover:border-primary/30"
                          )}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClasses}>Guide Name</label>
                <div className="relative">
                  <IconId className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  <input
                    type="text"
                    placeholder="Enter Guide Name"
                    value={newSlot.guideName || ""}
                    onChange={(e) => setNewSlot(prev => ({ ...prev, guideName: e.target.value }))}
                    className={twMerge(inputClasses, "pl-10 h-12")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={labelClasses}>Guide Contact Number</label>
                  <div className="relative">
                    <IconPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                    <input
                      type="text"
                      placeholder="e.g. +91 98765 43210"
                      value={newSlot.guidePhoneNumber || ""}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, guidePhoneNumber: e.target.value }))}
                      className={twMerge(inputClasses, "pl-10 h-12")}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={labelClasses}>Alternate Contact Number <span className="text-destructive">*</span></label>
                  <div className="relative">
                    <IconAlertCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                    <input
                      type="text"
                      placeholder="Emergency backup"
                      value={newSlot.alternateNumber || ""}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, alternateNumber: e.target.value }))}
                      className={twMerge(inputClasses, "pl-10 h-12")}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-10">
              <Dialog.Close asChild>
                <button className="h-12 flex-1 rounded-2xl border border-border bg-muted/10 text-sm font-black text-muted-foreground hover:bg-muted transition-all">
                  Discard
                </button>
              </Dialog.Close>
              <button
                onClick={handleAddSlot}
                disabled={slotMutation.isPending}
                className="h-12 flex-1 rounded-2xl bg-primary text-sm font-black text-white shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              >
                {slotMutation.isPending ? "Saving..." : (newSlot.id ? "Save Changes" : "Create Slot")}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Red Alert Modal for Bookings */}
      <AlertDialog.Root open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm animate-in fade-in duration-300" />
          <AlertDialog.Content className="fixed left-[50%] top-[50%] z-[100] w-[calc(100%-2rem)] max-w-2xl translate-x-[-50%] translate-y-[-50%] rounded-[2.5rem] bg-card p-10 shadow-2xl animate-in zoom-in-95 fade-in duration-300 outline-none border border-destructive/20">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive animate-bounce">
                <IconTrash size={32} />
              </div>
              <div className="space-y-2">
                <AlertDialog.Title className="text-2xl font-black tracking-tight text-destructive">
                  Critical: Active Bookings Detected!
                </AlertDialog.Title>
                <AlertDialog.Description className="text-sm font-medium text-muted-foreground leading-relaxed">
                  There are <span className="px-2 py-0.5 rounded-lg bg-destructive text-white font-black">{bookingCount}</span> active bookings for this slot.
                  Manage individual bookings below or cancel all to delete the slot.
                </AlertDialog.Description>
              </div>

              {/* Advanced Booking Management inside Alert */}
              <div className="w-full p-6 rounded-3xl bg-muted/30 border border-border space-y-4 max-h-[300px] overflow-y-auto">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 text-left">Impacted Bookings (Manage):</p>
                {isLoadingBookings ? (
                  <div className="flex justify-center py-6"><IconLoader2 className="animate-spin text-primary" /></div>
                ) : (
                  <div className="grid gap-2">
                    {slotBookings?.map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border/60 hover:border-destructive/20 transition-all text-left">
                        <div className="space-y-1">
                          <p className="text-[11px] font-black text-foreground">#{b.bookingId || b.id}</p>
                          <p className="text-[10px] font-bold text-muted-foreground">{b.user?.name || b.contacts?.[0]?.name || "Customer"}</p>
                          <p className="text-[9px] font-medium text-muted-foreground/60">{b.user?.mobile || b.contacts?.[0]?.mobile || "No Phone"}</p>
                          <p className="text-[9px] font-medium text-muted-foreground/40 italic">{b.user?.email || b.contacts?.[0]?.email || ""}</p>
                        </div>
                        <button
                          onClick={() => cancelBookingMutation.mutate({ id: b.id, reason: "Manual management via Admin" })}
                          disabled={cancelBookingMutation.isPending}
                          className="h-8 px-4 rounded-xl bg-destructive/5 text-destructive text-[9px] font-black uppercase tracking-widest hover:bg-destructive hover:text-white transition-all disabled:opacity-50"
                        >
                          {cancelBookingMutation.isPending ? "..." : "Cancel & Refund"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-full space-y-4 pt-4 border-t border-border/60">
                <div className="space-y-2 text-left">
                  <label className={labelClasses}>Reason for Entire Slot Cancellation</label>
                  <textarea
                    placeholder="Enter reason to notify all remaining customers..."
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className={twMerge(inputClasses, "min-h-[80px] resize-none")}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <AlertDialog.Cancel asChild>
                    <button className="h-12 flex-1 rounded-2xl border border-border bg-muted/10 text-sm font-black text-muted-foreground hover:bg-muted transition-all">
                      Keep Slot
                    </button>
                  </AlertDialog.Cancel>
                  <button
                    onClick={confirmDelete}
                    className="h-12 flex-1 rounded-2xl bg-destructive text-sm font-black text-white shadow-xl shadow-destructive/20 hover:opacity-90 active:scale-95 transition-all"
                  >
                    Cancel Slot & All Bookings
                  </button>
                </div>

                <button
                  onClick={() => slotToDelete && downloadBookings(slotToDelete.slot)}
                  className="flex items-center justify-center gap-2 w-full py-3 text-primary text-[10px] font-black uppercase tracking-widest hover:underline"
                >
                  <IconSettings size={14} /> Download Excel Report
                </button>
              </div>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
      {/* Bookings Full Width Modal */}
      <Dialog.Root open={isBookingsModalOpen} onOpenChange={setIsBookingsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md animate-in fade-in duration-300" />
          <Dialog.Content className="fixed left-0 top-0 z-[100] h-full w-full bg-background p-8 overflow-y-auto animate-in slide-in-from-right duration-500 outline-none">
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsBookingsModalOpen(false)}
                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted transition-all"
                  >
                    <IconChevronLeft size={20} />
                  </button>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-black tracking-tight">Slot Booking Details</h2>
                      {activeSlotForBookings?.isCancelled && (
                        <span className="px-3 py-1 rounded-full bg-destructive text-white text-[10px] font-black uppercase tracking-widest">Cancelled Slot</span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                      <IconCalendar size={14} /> {activeSlotForBookings && format(new Date(activeSlotForBookings.date), "EEEE, dd MMMM yyyy")}
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                      <IconClock size={14} /> {activeSlotForBookings?.startTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => activeSlotForBookings && downloadBookings(activeSlotForBookings)}
                    className="h-10 px-6 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200 hover:opacity-90 active:scale-95 transition-all"
                  >
                    Export to Excel
                  </button>
                  <Dialog.Close className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted transition-all">
                    <IconX size={20} />
                  </Dialog.Close>
                </div>
              </div>

              {/* Bookings List / Table */}
              <div className="rounded-[2.5rem] border border-border bg-card overflow-hidden shadow-2xl">
                <TourBookingsTable slot={activeSlotForBookings} tourId={tourId} />
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Review Modal */}
      <Dialog.Root open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-background p-6 shadow-2xl animate-in zoom-in-95 duration-300 outline-none">
            <div className="mb-6 flex items-center justify-between">
              <div className="space-y-1">
                <Dialog.Title className="text-lg font-bold tracking-tight">
                  {editingReviewIndex !== null ? "Edit Testimonial" : "Add Testimonial"}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-muted-foreground font-medium">
                  {editingReviewIndex !== null ? "Modify the existing review details." : "Create a new dummy or manual review."}
                </Dialog.Description>
              </div>
              <Dialog.Close className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-all">
                <IconX size={20} />
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>User Name</label>
                  <input
                    type="text"
                    value={newReview.userName}
                    onChange={(e) => setNewReview({ ...newReview, userName: e.target.value })}
                    className={inputClasses}
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className={labelClasses}>User Location</label>
                  <input
                    type="text"
                    value={newReview.userLocation}
                    onChange={(e) => setNewReview({ ...newReview, userLocation: e.target.value })}
                    className={inputClasses}
                    placeholder="e.g. London, UK"
                  />
                </div>
              </div>

              <div>
                <label className={labelClasses}>Review Content</label>
                <textarea
                  value={newReview.reviewText}
                  onChange={(e) => setNewReview({ ...newReview, reviewText: e.target.value })}
                  className={twMerge(inputClasses, "min-h-[100px] resize-none")}
                  placeholder="Share the traveler's experience..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Rating</label>
                  <div className="flex items-center gap-1.5 h-10 px-3 rounded-lg border border-border bg-background">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <IconStar
                        key={star}
                        size={20}
                        className={twMerge(
                          "cursor-pointer transition-all",
                          star <= newReview.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20 hover:text-amber-200"
                        )}
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>Review Date</label>
                  <input
                    type="date"
                    value={newReview.date ? format(new Date(newReview.date), "yyyy-MM-dd") : ""}
                    onChange={(e) => setNewReview({ ...newReview, date: new Date(e.target.value).toISOString() })}
                    className={inputClasses}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={newReview.isActive}
                    onChange={(e) => setNewReview({ ...newReview, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground">Visible on App</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={newReview.isAdminAdded}
                    onChange={(e) => setNewReview({ ...newReview, isAdminAdded: e.target.checked })}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground">Admin Added</span>
                </label>
              </div>

              <button
                onClick={() => reviewMutation.mutate(newReview)}
                disabled={reviewMutation.isPending || !newReview.userName || !newReview.reviewText}
                className="mt-2 w-full h-11 rounded-xl bg-primary text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              >
                {reviewMutation.isPending ? "Saving..." : (editingReviewIndex !== null ? "Update Testimonial" : "Post Testimonial")}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

/**
 * Sub-component for Detailed Bookings Table
 */
function TourBookingsTable({ slot, tourId }: { slot: any, tourId: number }) {
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["slotBookings", tourId, slot?.date, slot?.startTime, slot?.id],
    queryFn: () => tourService.getSlotBookings(tourId, slot!.date, slot!.startTime, slot?.id),
    enabled: !!slot,
  });

  if (isLoading) return <div className="p-20 flex justify-center"><IconLoader2 className="animate-spin text-primary h-12 w-12" /></div>;

  if (!bookings || bookings.length === 0) {
    return (
      <div className="p-20 text-center space-y-4">
        <div className="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto">
          <IconUsers size={40} className="text-muted-foreground/20" />
        </div>
        <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">No active bookings found for this slot.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-muted/30 border-b border-border">
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Booking ID</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Customer Profile</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Persons</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Payment Status</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order Total</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Booking Date</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {bookings.map((booking: any) => (
            <tr key={booking.id} className="hover:bg-muted/10 transition-all group">
              <td className="px-6 py-4">
                <span className="text-xs font-black text-primary">#{booking.bookingId || booking.id}</span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 font-black text-xs">
                    {booking.user?.name?.[0] || booking.contacts?.[0]?.name?.[0] || 'U'}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-foreground">{booking.user?.name || booking.contacts?.[0]?.name || "Guest User"}</p>
                    <p className="text-[10px] font-bold text-muted-foreground">{booking.user?.phone || booking.contacts?.[0]?.mobile || "No Phone"}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-muted text-[10px] font-black">{booking.personCount}</span>
              </td>
              <td className="px-6 py-4">
                <div className={twMerge(
                  "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest",
                  booking.paymentStatus === 'paid' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                )}>
                  {booking.paymentStatus}
                </div>
              </td>
              <td className="px-6 py-4">
                <p className="text-xs font-black text-foreground">₹{booking.totalPrice}</p>
              </td>
              <td className="px-6 py-4">
                <p className="text-[10px] font-bold text-muted-foreground">{format(new Date(booking.createdAt), "dd MMM yyyy, HH:mm")}</p>
              </td>
              <td className="px-6 py-4 text-right">
                <div className={twMerge(
                  "inline-flex px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                  booking.status === 'confirmed' ? "bg-primary text-white" :
                    booking.status === 'cancelled' ? "bg-destructive text-white" : "bg-muted text-muted-foreground"
                )}>
                  {booking.status}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
