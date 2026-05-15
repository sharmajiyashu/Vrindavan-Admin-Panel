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
import { format, subHours, parse, isValid, addDays, subDays } from "date-fns";
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
    alternateNumber: ""
  });

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
      for (const ns of newSlotsToAdd) {
        await tourService.addSlot(tourId, ns);
      }
      toast.dismiss(loadingToast);
      toast.success(`Copied ${newSlotsToAdd.length} slots from ${prevDate}`);
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Failed to copy some slots");
    }
  };

  const handleAddSlot = () => {
    if (!newSlot.startTime) {
      toast.error("Please select a start time");
      return;
    }

    const isDuplicate = tour?.slots?.some(s => s.date === newSlot.date && s.startTime === newSlot.startTime && s.id !== newSlot.id);
    if (isDuplicate) {
      toast.error(`A slot at ${newSlot.startTime} already exists for this date`);
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
          <button
            onClick={() => {
              setEditingSlotIndex(null);
              setNewSlot({ date: selectedDate, startTime: "10:00 AM", guideName: "", guidePhoneNumber: "", alternateNumber: "" });
              setIsAddModalOpen(true);
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-[11px] font-black uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
          >
            <IconPlus size={16} /> Add Slot
          </button>
          <div className={twMerge(
            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm",
            tour.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
          )}>
            {tour.isActive ? "Active" : "Inactive"}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 px-2">
        <div className="aspect-[4/3] md:aspect-auto md:h-24 rounded-3xl overflow-hidden border border-border bg-muted/30 shadow-sm">
          {tour.gallery && tour.gallery[0] ? (
            <img src={tour.gallery[0].url} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
              <IconCalendar size={24} />
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center p-5 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">Pricing</p>
          <p className="text-xl font-black text-primary leading-tight">₹{tour.price}</p>
          <p className="text-[9px] font-bold text-muted-foreground/60 uppercase">Per {tour.type === 'group' ? 'Person' : 'Tour'}</p>
        </div>
        <div className="flex flex-col justify-center p-5 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">Duration</p>
          <p className="text-sm font-black text-foreground leading-tight">{tour.durationEn || "N/A"}</p>
          <p className="text-[9px] font-bold text-muted-foreground/60 uppercase">Total Trip Time</p>
        </div>
        <div className="flex flex-col justify-center p-5 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">Capacity</p>
          <p className="text-sm font-black text-foreground leading-tight">{tour.minPersons || 1} - {tour.maxPersons || 10}</p>
          <p className="text-[9px] font-bold text-muted-foreground/60 uppercase">Person Range</p>
        </div>
        <div className="hidden lg:flex flex-col justify-center p-5 rounded-3xl bg-primary/5 border border-primary/10 shadow-sm">
          <p className="text-[10px] font-black text-primary uppercase tracking-wider mb-1">Operations</p>
          <p className="text-sm font-black text-primary leading-tight">{tour.slots?.length || 0} Total Slots</p>
          <p className="text-[9px] font-bold text-primary/60 uppercase">Live Schedule</p>
        </div>
      </div>

      {/* Main Content: Full Width Tabs */}
      <div className="w-full">
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
            <div className="rounded-[2.5rem] border border-border bg-card p-6 md:p-8 shadow-xl space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h3 className="text-xl font-black tracking-tight">Slot Inventory</h3>
                  <p className="text-xs text-muted-foreground font-medium">Define operational hours for specific dates.</p>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                {/* Date Selector Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-[2rem] bg-muted/20 border border-border">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                      <IconCalendar size={24} />
                    </div>
                    <div>
                      <label className={labelClasses}>Manage Date</label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className={twMerge(inputClasses, "w-auto border-none bg-transparent p-0 font-black text-lg focus:ring-0")}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyFromPreviousDay}
                      className="px-4 py-2 rounded-xl border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 transition-all"
                    >
                      Copy From Previous Day
                    </button>
                  </div>
                </div>

                {/* Slots List: Compact Row View */}
                <div className="space-y-3">
                  {(!tour.slots || tour.slots.filter(s => s.date === selectedDate).length === 0) ? (
                    <div className="py-16 text-center border-2 border-dashed border-border rounded-[2.5rem] bg-muted/5 flex flex-col items-center gap-4">
                      <div className="h-20 w-20 rounded-[2rem] bg-muted/30 flex items-center justify-center text-muted-foreground/30">
                        <IconClock size={36} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-black text-foreground">Schedule Vacant</p>
                        <p className="text-xs font-bold text-muted-foreground/60 max-w-[200px]">No slots defined for {format(new Date(selectedDate), "EEEE, dd MMM")}.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {tour.slots
                        .map((slot, originalIndex) => ({ slot, originalIndex }))
                        .filter(item => item.slot.date === selectedDate)
                        .sort((a, b) => {
                          const timeA = parse(a.slot.startTime, "hh:mm a", new Date());
                          const timeB = parse(b.slot.startTime, "hh:mm a", new Date());
                          return timeA.getTime() - timeB.getTime();
                        })
                        .map(({ slot, originalIndex }) => (
                          <div key={slot.id || originalIndex} className="group p-5 rounded-3xl border border-border bg-muted/20 hover:bg-card hover:shadow-lg transition-all duration-300">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                              {/* Time Pillar */}
                              <div className="flex items-center gap-4 min-w-[140px]">
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all">
                                  <IconClock size={20} />
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Start Time</p>
                                  <p className="text-sm font-black text-foreground">{slot.startTime}</p>
                                </div>
                              </div>

                              {/* Guide & Operations Pillar */}
                              <div className="flex-1 lg:border-x lg:border-border/60 lg:px-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  <div className="space-y-0.5">
                                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Guide</p>
                                    <p className="text-[11px] font-bold flex items-center gap-1.5 text-primary">
                                      <IconId size={12} className="text-primary/60" />
                                      {slot.guideName || <span className="text-muted-foreground/40 italic">Not Assigned</span>}
                                    </p>
                                  </div>
                                  <div className="space-y-0.5">
                                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Contact</p>
                                    <p className="text-[11px] font-bold flex items-center gap-1.5">
                                      <IconPhone size={12} className="text-primary/60" />
                                      {slot.guidePhoneNumber || <span className="text-muted-foreground/40 italic">--</span>}
                                    </p>
                                  </div>
                                  <div className="space-y-0.5 hidden lg:block">
                                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Emergency No.</p>
                                    <p className="text-[11px] font-bold flex items-center gap-1.5">
                                      <IconAlertCircle size={12} className="text-primary/60" />
                                      {slot.alternateNumber || <span className="text-muted-foreground/40 italic">--</span>}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-0.5">
                                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Status</p>
                                <div className="flex items-center gap-1.5">
                                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                  <span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">Active</span>
                                </div>
                              </div>

                              {/* Actions Pillar */}
                              <div className="flex items-center gap-2 lg:min-w-[120px] justify-end">
                                <button
                                  onClick={() => {
                                    setEditingSlotIndex(originalIndex);
                                    setNewSlot(slot);
                                    setIsAddModalOpen(true);
                                  }}
                                  className="h-9 px-4 flex items-center gap-2 rounded-xl bg-primary/5 text-primary text-[10px] font-black uppercase tracking-wider hover:bg-primary hover:text-white transition-all shadow-sm"
                                >
                                  <IconSettings size={14} /> Edit
                                </button>
                                <button
                                  onClick={() => downloadBookings(slot)}
                                  className="h-9 w-9 flex items-center justify-center rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all"
                                >
                                  <IconUsers size={14} />
                                </button>
                                <button
                                  onClick={() => checkBookingsAndPrompt(originalIndex, slot)}
                                  className="h-9 w-9 flex items-center justify-center rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm"
                                >
                                  <IconTrash size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Cancelled Slots Tracking Section */}
                {(tour as any).cancelledSlots && (tour as any).cancelledSlots.length > 0 && (
                  <div className="pt-12 border-t border-border space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
                        <IconX size={20} />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-destructive">Cancelled Slots Log</h3>
                    </div>
                    <div className="grid gap-4">
                      {(tour as any).cancelledSlots.map((cs: any) => (
                        <div key={cs.id} className="p-6 rounded-3xl bg-destructive/5 border border-destructive/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-foreground">{format(new Date(cs.date), "dd MMM yyyy")}</span>
                              <span className="text-xs font-bold text-muted-foreground">•</span>
                              <span className="text-xs font-black text-primary">{cs.startTime}</span>
                            </div>
                            <p className="text-xs text-muted-foreground font-medium italic">"{cs.cancellationReason}"</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Impacted Bookings</p>
                              <p className="text-sm font-black text-destructive">{cs.bookingCountAtCancellation}</p>
                            </div>
                            <button
                              onClick={() => downloadBookings({ date: cs.date, startTime: cs.startTime, id: cs.slotId } as any)}
                              className="h-9 px-4 rounded-xl bg-destructive/10 text-destructive text-[10px] font-black uppercase tracking-widest hover:bg-destructive hover:text-white transition-all"
                            >
                              View Bookings
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
                  {["09:00 AM", "11:00 AM", "01:00 PM", "03:00 PM", "05:00 PM", "07:00 PM"].map(time => (
                    <button
                      key={time}
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
                  ))}
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
                  <label className={labelClasses}>Alternate Contact Number</label>
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
    </div>
  );
}
