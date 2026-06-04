"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IconCalendarStats,
  IconSearch,
  IconReload,
  IconClock,
  IconMapPin,
  IconUser,
  IconPhone,
  IconCircleCheck,
  IconArrowRight,
  IconLoader2,
  IconFilter
} from "@tabler/icons-react";
import { dashboardService, DashboardResponse } from "@/lib/services/dashboardService";
import { tourService } from "@/lib/services/tourService";
import { format, parse, isValid, differenceInMinutes } from "date-fns";
import { toast } from "react-toastify";
import { twMerge } from "tailwind-merge";
import Link from "next/link";

import * as Dialog from "@radix-ui/react-dialog";
import { IconX, IconShieldCheck, IconAlertCircle } from "@tabler/icons-react";

export default function TourOperationsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingSlot, setEditingSlot] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    guideName: "",
    guidePhoneNumber: "",
    alternateNumber: ""
  });

  const { data, isLoading } = useQuery<DashboardResponse>({
    queryKey: ["dashboard-stats"],
    queryFn: dashboardService.getStats,
  });

  const updateSlotMutation = useMutation({
    mutationFn: ({ slotId, data }: { slotId: number; data: any }) =>
      tourService.updateSlot(slotId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Guide details updated successfully");
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update guide details");
    },
  });

  const handleEditClick = (slot: any) => {
    setEditingSlot(slot);
    setFormData({
      guideName: slot.guideName || "",
      guidePhoneNumber: slot.guidePhoneNumber || "",
      alternateNumber: slot.alternateNumber || ""
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSlot) {
      updateSlotMutation.mutate({ slotId: editingSlot.id, data: formData });
    }
  };

  const allSlots = data?.upcomingSlots || [];
  const filteredSlots = allSlots.filter((slot: any) =>
    slot.tour?.titleEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    slot.guideName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
            <IconCalendarStats size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-foreground leading-none">
              Tour Operations
            </h1>
            <p className="text-[10px] font-bold text-muted-foreground/60 mt-1 uppercase tracking-wider">
              Manage guide assignments and deadlines
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 max-w-md ml-auto">
          <div className="relative group flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-4 w-4">
              <IconSearch className="h-3 w-3 text-muted-foreground/30" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-card/50 pl-8 pr-4 text-[10px] font-bold outline-none focus:border-primary transition-all"
            />
          </div>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })}
            className="h-9 w-9 rounded-lg border border-border bg-card text-muted-foreground flex items-center justify-center transition-all hover:bg-muted"
          >
            <IconReload className={twMerge("h-3.5 w-3.5", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Slots List - Compact */}
      <div className="grid gap-2 px-2">
        {isLoading ? (
          <div className="h-40 flex items-center justify-center">
            <IconLoader2 size={24} className="animate-spin text-primary/20" />
          </div>
        ) : filteredSlots.length === 0 ? (
          <div className="h-40 flex items-center justify-center border border-dashed rounded-2xl bg-muted/5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No slots found</p>
          </div>
        ) : (
          filteredSlots.map((slot: any) => {
            const dateTimeStr = `${slot.date} ${slot.startTime}`;
            const slotTime = parse(dateTimeStr, "yyyy-MM-dd hh:mm a", new Date());
            const deadlineHours = slot.tour?.shareDetailsBeforeHours || 2;
            const deadlineTime = new Date(slotTime.getTime() - deadlineHours * 60 * 60 * 1000);
            const minutesLeft = differenceInMinutes(deadlineTime, new Date());
            const isDeadlinePassed = minutesLeft <= 0;

            return (
              <div key={slot.id} className="p-4 rounded-[1.25rem] border border-border bg-card group hover:shadow-md transition-all duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/5 border border-primary/10 flex flex-col items-center justify-center text-primary">
                      <span className="text-[8px] font-black uppercase leading-none">{format(slotTime, "MMM")}</span>
                      <span className="text-sm font-black leading-none mt-0.5">{format(slotTime, "dd")}</span>
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-foreground leading-tight">{slot.tour?.titleEn}</h4>
                      <div className="flex items-center gap-3 mt-1 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><IconClock size={10} /> {slot.startTime}</span>
                        <span className="flex items-center gap-1"><IconMapPin size={10} /> {slot.tour?.locationNameEn || "Vrindavan"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {(() => {
                      const hasGuide = !!slot.guideName;
                      const isTourStarted = new Date() > slotTime;
                      let badgeText = "";
                      let badgeClasses = "";

                      if (hasGuide) {
                        badgeText = "Assigned";
                        badgeClasses = "bg-emerald-50 text-emerald-600 border-emerald-100";
                      } else if (isTourStarted) {
                        badgeText = "Expired";
                        badgeClasses = "bg-red-50 text-red-600 border-red-100";
                      } else if (isDeadlinePassed) {
                        badgeText = "Overdue";
                        badgeClasses = "bg-amber-50 text-amber-600 border-amber-100";
                      } else {
                        badgeText = `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m`;
                        badgeClasses = "bg-blue-50 text-blue-600 border-blue-100";
                      }

                      return (
                        <div className={twMerge(
                          "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider border flex items-center gap-1.5",
                          badgeClasses
                        )}>
                          {badgeText}
                        </div>
                      );
                    })()}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditClick(slot)}
                        className={twMerge(
                          "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border shadow-sm",
                          slot.guideName
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100"
                            : "bg-primary text-white border-primary hover:opacity-90 shadow-primary/20"
                        )}
                      >
                        {slot.guideName ? "Edit Guide" : "Assign Guide"}
                      </button>
                      <Link href={`/tours/${slot.tourId}`} className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all border border-primary/10">
                        <IconArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Assignment Modal */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-[2rem] bg-card p-8 shadow-2xl animate-in zoom-in-95 fade-in duration-300 outline-none border border-border">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-black tracking-tight flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <IconUser size={18} />
                </div>
                Assign Guide
              </Dialog.Title>
              <Dialog.Close className="h-8 w-8 flex items-center justify-center rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted transition-all active:scale-90">
                <IconX size={16} />
              </Dialog.Close>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                  Guide Full Name
                </label>
                <div className="relative group">
                  <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                  <input
                    required
                    placeholder="Enter name..."
                    value={formData.guideName}
                    onChange={(e) => setFormData({ ...formData, guideName: e.target.value })}
                    className="h-11 w-full rounded-xl border border-border bg-muted/20 pl-10 pr-4 text-xs font-bold outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    Primary Phone
                  </label>
                  <div className="relative group">
                    <IconPhone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                    <input
                      required
                      placeholder="Number"
                      value={formData.guidePhoneNumber}
                      onChange={(e) => setFormData({ ...formData, guidePhoneNumber: e.target.value })}
                      className="h-11 w-full rounded-xl border border-border bg-muted/20 pl-10 pr-4 text-xs font-bold outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    Emergency/Alt
                  </label>
                  <div className="relative group">
                    <IconAlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                    <input
                      placeholder="Alt Phone"
                      value={formData.alternateNumber}
                      onChange={(e) => setFormData({ ...formData, alternateNumber: e.target.value })}
                      className="h-11 w-full rounded-xl border border-border bg-muted/20 pl-10 pr-4 text-xs font-bold outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Dialog.Close asChild>
                  <button type="button" className="flex-1 h-11 rounded-xl border border-border text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:bg-muted transition-all">
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={updateSlotMutation.isPending}
                  className="flex-[2] h-11 rounded-xl bg-primary text-[10px] font-black uppercase tracking-wider text-white shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {updateSlotMutation.isPending ? <IconLoader2 size={14} className="animate-spin" /> : <IconShieldCheck size={14} />}
                  Save Guide Info
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
