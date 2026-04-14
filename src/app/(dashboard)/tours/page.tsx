"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconSettings,
  IconMap2,
  IconDotsVertical,
  IconCheck,
  IconX,
  IconLoader2,
  IconChevronRight,
  IconChevronLeft,
  IconReload,
  IconMapPin
} from "@tabler/icons-react";
import * as Dialog from "@radix-ui/react-dialog";
import { tourService, Tour, PaginatedTourResponse } from "@/lib/services/tourService";
import { TourForm } from "@/components/tours/TourForm";
import { useLanguage } from "@/contexts/LanguageContext";
import { twMerge } from "tailwind-merge";
import { toast } from "react-toastify";
import { TourFormData } from "@/lib/validations/tour";

export default function ToursPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tourToDelete, setTourToDelete] = useState<Tour | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading } = useQuery<PaginatedTourResponse>({
    queryKey: ["tours"],
    queryFn: () => tourService.listTours(),
  });

  const tours = data?.tours || [];

  const filteredTours = tours.filter((tour: Tour) =>
    tour.titleEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tour.titleHi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deleteMutation = useMutation({
    mutationFn: tourService.deleteTour,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
      toast.success("Tour deleted successfully");
      setIsDeleteModalOpen(false);
      setTourToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete tour");
    },
  });

  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
        <div className="space-y-0.5">
          <h1 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
              <IconMap2 size={18} />
            </div>
            {t("tours.title")}
          </h1>
          <p className="text-[11px] font-bold text-muted-foreground/60 pl-10.5 uppercase tracking-wider">
            {t("tours.subtitle")}
          </p>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3 max-w-2xl ml-auto">
          <div className="relative group flex-1 max-w-xs">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center h-5 w-5">
              <IconSearch className="h-3.5 w-3.5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search tours..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-card/50 pl-10 pr-4 text-[11px] font-bold shadow-sm transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none placeholder:text-muted-foreground/20"
            />
          </div>

          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["tours"] })}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-all hover:bg-muted active:scale-95 shadow-sm"
            title="Refresh"
          >
            <IconReload className={twMerge("h-4 w-4", isLoading && "animate-spin")} />
          </button>

          <Dialog.Root open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingTour(null);
          }}>
            <Dialog.Trigger asChild>
              <button className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-6 text-[11px] font-black uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-95">
                {t("tours.add")}
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" />
              <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-4xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-[2.5rem] bg-card p-10 shadow-2xl animate-in zoom-in-95 fade-in duration-300 outline-none">
                <div className="flex items-center justify-between mb-8">
                  <Dialog.Title className="text-2xl font-black tracking-tight flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <IconSettings size={20} />
                    </div>
                    {editingTour ? t("tours.edit") : t("tours.add")}
                  </Dialog.Title>
                  <Dialog.Close className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-90">
                    <IconX size={20} />
                  </Dialog.Close>
                </div>
                <TourForm
                  initialData={editingTour}
                  onSubmitBasic={async (data) => {
                    if (editingTour) {
                      await tourService.updateTour(editingTour.id, data);
                      queryClient.invalidateQueries({ queryKey: ["tours"] });
                      toast.success("Details updated and saved");
                      return editingTour.id;
                    } else {
                      const result = await tourService.createTour(data);
                      queryClient.invalidateQueries({ queryKey: ["tours"] });
                      toast.success("Tour created successfully");
                      setEditingTour(result); // Update editingTour state to prevent multi-create on tab switch
                      return result.id;
                    }
                  }}
                  onSubmitFiles={async (id, files) => {
                    if (files.length > 0) {
                      await tourService.uploadGallery(id, files);
                      queryClient.invalidateQueries({ queryKey: ["tours"] });
                      toast.success("New images uploaded and saved");
                    }
                  }}
                  onRemoveMedia={async (id, mediaId) => {
                    await tourService.deleteGalleryMedia(id, mediaId);
                    toast.success("Image removed from gallery");
                  }}
                  onComplete={() => {
                    toast.success("Finished saving tour details");
                    setIsDialogOpen(false);
                    setEditingTour(null);
                    queryClient.invalidateQueries({ queryKey: ["tours"] });
                  }}
                />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>

      {/* Main Content */}
      <div className="rounded-[2.5rem] border border-border bg-card p-4 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <IconLoader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t("tours.loading")}</p>
          </div>
        ) : filteredTours.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
            <div className="h-16 w-16 rounded-3xl bg-muted/30 flex items-center justify-center text-muted-foreground">
              <IconMap2 size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold text-foreground">{t("tours.noTours")}</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">Add a new spiritual tour to get started.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/60 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                  <th className="px-5 py-4 w-[80px]">Image</th>
                  <th className="px-4 py-4 min-w-[240px]">Tour Name</th>
                  <th className="px-4 py-4">Price</th>
                  <th className="px-4 py-4">Temples</th>
                  <th className="px-4 py-4">{t("tours.active")}</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredTours.map((tour: Tour) => (
                  <tr key={tour.id} className="group transition-all hover:bg-muted/20">
                    <td className="px-5 py-3.5">
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-muted/50 border border-border shadow-sm">
                        {tour.gallery && tour.gallery.length > 0 ? (
                          <img
                            src={tour.gallery[0]?.url}
                            alt={tour.titleEn}
                            className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-500"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground/20">
                            <IconMap2 size={20} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-foreground leading-tight">{tour.titleEn}</p>
                        <p className="truncate text-[10px] font-medium text-muted-foreground mt-1 opacity-70 tracking-wide">{tour.titleHi}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        <p className="text-xs font-black text-primary">₹{tour.price}</p>
                        {tour.discountPrice && (
                          <p className="text-[10px] text-muted-foreground line-through opacity-50">₹{tour.discountPrice}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex -space-x-2 overflow-hidden">
                        {(tour.temples as any[])?.slice(0, 3).map((temple: any, idx: number) => (
                          <div key={idx} className="inline-block h-7 w-7 rounded-lg ring-2 ring-card bg-muted flex items-center justify-center overflow-hidden" title={temple.nameEn}>
                            {temple.thumbnail ? (
                              <img src={temple.thumbnail.url} className="h-full w-full object-cover" />
                            ) : (
                              <IconMapPin size={12} className="text-muted-foreground" />
                            )}
                          </div>
                        ))}
                        {tour.temples && tour.temples.length > 3 && (
                          <div className="inline-block h-7 w-7 rounded-lg ring-2 ring-card bg-muted/50 flex items-center justify-center text-[8px] font-black text-muted-foreground">
                            +{tour.temples.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className={twMerge(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider",
                        tour.isActive
                          ? "bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-500/10"
                          : "bg-red-50 text-red-600 ring-1 ring-inset ring-red-500/10"
                      )}>
                        <div className={twMerge("h-1 w-1 rounded-full", tour.isActive ? "bg-emerald-500" : "bg-red-500")} />
                        {tour.isActive ? "Active" : "Inactive"}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingTour(tour);
                            setIsDialogOpen(true);
                          }}
                          className="h-9 w-9 flex items-center justify-center rounded-xl bg-card text-muted-foreground shadow-sm ring-1 ring-border transition-all hover:bg-primary hover:text-primary-foreground active:scale-90"
                        >
                          <IconEdit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setTourToDelete(tour);
                            setIsDeleteModalOpen(true);
                          }}
                          className="h-9 w-9 flex items-center justify-center rounded-xl bg-card text-muted-foreground shadow-sm ring-1 ring-border transition-all hover:bg-destructive hover:text-destructive-foreground active:scale-90"
                        >
                          <IconTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Delete Confirmation Modal */}
            <Dialog.Root open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" />
                <Dialog.Content className="fixed left-[50%] top-[50%] z-[60] w-[calc(100%-2rem)] max-w-md translate-x-[-50%] translate-y-[-50%] rounded-3xl bg-card p-8 shadow-2xl animate-in zoom-in-95 fade-in duration-300 outline-none border border-border">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
                      <IconTrash size={32} />
                    </div>
                    <div className="space-y-1">
                      <Dialog.Title className="text-xl font-black tracking-tight">{t("common.delete")}</Dialog.Title>
                      <Dialog.Description className="text-sm text-muted-foreground">
                        Are you sure you want to delete tour <span className="font-bold text-foreground">"{tourToDelete?.titleEn}"</span>?
                      </Dialog.Description>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-8">
                    <Dialog.Close asChild>
                      <button className="h-12 rounded-xl border border-border bg-card text-sm font-bold text-muted-foreground hover:bg-muted transition-all active:scale-95">
                        Cancel
                      </button>
                    </Dialog.Close>
                    <button
                      onClick={() => tourToDelete && deleteMutation.mutate(tourToDelete.id)}
                      disabled={deleteMutation.isPending}
                      className="h-12 rounded-xl bg-destructive text-sm font-black text-white shadow-lg shadow-destructive/20 hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      {deleteMutation.isPending ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconTrash className="h-4 w-4" />}
                      {t("common.delete")}
                    </button>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        )}
      </div>
    </div>
  );
}
