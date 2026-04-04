"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconEye,
  IconSettings,
  IconBuildingSkyscraper,
  IconDotsVertical,
  IconCheck,
  IconX,
  IconLoader2,
  IconChevronRight,
  IconChevronLeft,
  IconReload,
  IconChevronUp,
  IconChevronDown
} from "@tabler/icons-react";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { templeService, Temple } from "@/lib/services/templeService";
import { TempleForm } from "@/components/temples/TempleForm";
import { useLanguage } from "@/contexts/LanguageContext";
import { twMerge } from "tailwind-merge";
import { toast } from "react-toastify";
import { TempleFormData } from "@/lib/validations/temple";

export default function TemplesPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemple, setEditingTemple] = useState<Temple | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [templeToDelete, setTempleToDelete] = useState<Temple | null>(null);

  const { data: paginatedData, isLoading } = useQuery({
    queryKey: ["temples", currentPage, limit, searchTerm],
    queryFn: () => templeService.listTemples(currentPage, limit, searchTerm),
  });

  const temples = paginatedData?.temples ?? [];
  const pagination = paginatedData?.pagination;

  const createMutation = useMutation({
    mutationFn: async ({ data, files }: { data: TempleFormData; files: Record<string, File | File[] | undefined> }) => {
      // Step 1: Create Basic Record (JSON)
      const temple = await templeService.createTemple(data);
      const templeId = temple.id;

      // Step 2: Upload Files (FormData)
      const uploadPromises = [];
      if (Array.isArray(files.images) && files.images.length > 0) uploadPromises.push(templeService.uploadGallery(templeId, files.images));
      if (files.documentaryVideo instanceof File) uploadPromises.push(templeService.uploadDocumentary(templeId, files.documentaryVideo));
      if (files.audioGuideEn instanceof File) uploadPromises.push(templeService.uploadAudioGuide(templeId, "en", files.audioGuideEn));
      if (files.audioGuideHi instanceof File) uploadPromises.push(templeService.uploadAudioGuide(templeId, "hi", files.audioGuideHi));

      await Promise.all(uploadPromises);
      return temple;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["temples"] });
      toast.success(t("temples.saveSuccess"));
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create temple");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, files }: { id: number; data: Partial<TempleFormData>; files: Record<string, File | File[] | undefined> }) => {
      // Step 1: Update Basic Record (JSON)
      await templeService.updateTemple(id, data);

      // Step 2: Upload New Files (FormData)
      const uploadPromises = [];

      if (Array.isArray(files.images) && files.images.length > 0) uploadPromises.push(templeService.uploadGallery(id, files.images));
      if (files.documentaryVideo instanceof File) uploadPromises.push(templeService.uploadDocumentary(id, files.documentaryVideo));
      if (files.audioGuideEn instanceof File) uploadPromises.push(templeService.uploadAudioGuide(id, "en", files.audioGuideEn));
      if (files.audioGuideHi instanceof File) uploadPromises.push(templeService.uploadAudioGuide(id, "hi", files.audioGuideHi));

      await Promise.all(uploadPromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["temples"] });
      toast.success(t("temples.saveSuccess"));
      setIsDialogOpen(false);
      setEditingTemple(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update temple");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: templeService.deleteTemple,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["temples"] });
      toast.success(t("temples.deleteSuccess"));
      setIsDeleteModalOpen(false);
      setTempleToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete temple");
    },
  });

  const updateSortMutation = useMutation({
    mutationFn: async (updates: { id: number; sortOrder: number }[]) => {
      // Step 3: Run updates sequentially or in parallel
      return await Promise.all(
        updates.map((update) => templeService.updateTemple(update.id, { sortOrder: update.sortOrder }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["temples"] });
      toast.success(t("temples.saveSuccess"));
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update sort order");
    },
  });

  const handleMove = (temple: Temple, direction: "up" | "down") => {
    const index = temples.findIndex((t) => t.id === temple.id);
    if (index === -1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;

    // Create a new array with the item moved to its new position
    const sortedTemples = [...temples];
    const [movedItem] = sortedTemples.splice(index, 1);
    if (!movedItem) return;


    // Bounds check and injection
    if (newIndex < 0) {
      sortedTemples.unshift(movedItem);
    } else if (newIndex >= temples.length) {
      sortedTemples.push(movedItem);
    } else {
      sortedTemples.splice(newIndex, 0, movedItem);
    }

    // Determine the base sort order to maintain page context
    // This handles cases like "0, 1, 3, 3" by normalizing them to sequential integers
    const minSortOrder = temples.length > 0 ? Math.min(...temples.map((t) => t.sortOrder)) : 1;
    const baseSortOrder = newIndex < 0 ? minSortOrder - 1 : minSortOrder;

    // Map new positions to new sort orders and filter for only items that actually changed
    const updates = sortedTemples
      .map((t, idx) => ({
        id: t.id,
        sortOrder: baseSortOrder + idx,
      }))
      .filter((update) => {
        const oldTemple = temples.find((ot) => ot.id === update.id);
        return oldTemple?.sortOrder !== update.sortOrder;
      });

    if (updates.length > 0) {
      updateSortMutation.mutate(updates);
    }
  };

  const handleCreateOrUpdate = async (data: TempleFormData, files: Record<string, File | File[] | undefined>) => {
    if (editingTemple) {
      await updateMutation.mutateAsync({ id: editingTemple.id, data, files });
    } else {
      await createMutation.mutateAsync({ data, files });
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
        <div className="space-y-0.5">
          <h1 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#5A2A13]/5 flex items-center justify-center text-[#5A2A13]">
              <IconBuildingSkyscraper size={18} />
            </div>
            {t("temples.title")}
          </h1>
          <p className="text-[11px] font-bold text-muted-foreground/60 pl-10.5 uppercase tracking-wider">
            {t("temples.subtitle")}
          </p>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3 max-w-2xl ml-auto">
          <div className="relative group flex-1 max-w-xs">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center h-5 w-5">
              <IconSearch className="h-3.5 w-3.5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 w-full rounded-xl border-2 border-border bg-card pl-10 pr-4 text-[11px] font-bold shadow-sm transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none placeholder:text-muted-foreground/40"
            />
          </div>

          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["temples"] })}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border-2 border-border bg-card text-muted-foreground transition-all hover:bg-muted active:scale-95 shadow-sm"
            title="Refresh"
          >
            <IconReload className={twMerge("h-4 w-4", isLoading && "animate-spin")} />
          </button>

          <Dialog.Root open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingTemple(null);
          }}>
            <Dialog.Trigger asChild>
              <button className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-[11px] font-black uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-95">
                {t("temples.add")}
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 animate-in fade-in duration-300" />
              <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-4xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-3xl border-2 border-border bg-card p-10 shadow-2xl animate-in zoom-in-95 fade-in duration-300 outline-none">
                <div className="flex items-center justify-between mb-8">
                  <Dialog.Title className="text-2xl font-black tracking-tight flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <IconSettings size={20} />
                    </div>
                    {editingTemple ? t("temples.edit") : t("temples.add")}
                  </Dialog.Title>
                  <Dialog.Close className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-90">
                    <IconX size={20} />
                  </Dialog.Close>
                </div>
                <TempleForm
                  initialData={editingTemple}
                  isLoading={createMutation.isPending || updateMutation.isPending}
                  onSubmitBasic={async (data) => {
                    const id = (data as any).id || editingTemple?.id;
                    if (id) {
                      await templeService.updateTemple(id, data);
                      queryClient.invalidateQueries({ queryKey: ["temples"] });
                      toast.success(t("temples.saveSuccess"));
                      return id;
                    } else {
                      const result = await templeService.createTemple(data);
                      queryClient.invalidateQueries({ queryKey: ["temples"] });
                      toast.success(t("temples.saveSuccess"));
                      return result.id;
                    }
                  }}

                  onSubmitFiles={async (id, files) => {
                    const uploadPromises = [];
                    if (Array.isArray(files.images) && files.images.length > 0) uploadPromises.push(templeService.uploadGallery(id, files.images));
                    if (files.documentaryVideo instanceof File) uploadPromises.push(templeService.uploadDocumentary(id, files.documentaryVideo));
                    if (files.audioGuideEn instanceof File) uploadPromises.push(templeService.uploadAudioGuide(id, "en", files.audioGuideEn));
                    if (files.audioGuideHi instanceof File) uploadPromises.push(templeService.uploadAudioGuide(id, "hi", files.audioGuideHi));

                    await Promise.all(uploadPromises);
                    queryClient.invalidateQueries({ queryKey: ["temples"] });
                    toast.success(t("temples.saveSuccess"));
                  }}
                  onRemoveMedia={async (id, mediaId) => {
                    try {
                      await templeService.deleteGalleryMedia(id, mediaId);
                      toast.success(t("common.deleteSuccess"));
                    } catch (err: any) {
                      toast.error(err.message || "Failed to remove image");
                      throw err;
                    }
                  }}
                  onComplete={() => {
                    setIsDialogOpen(false);
                    setEditingTemple(null);
                    queryClient.invalidateQueries({ queryKey: ["temples"] });
                  }}
                />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>


      {/* Main Content */}
      <div className="rounded-3xl border-2 border-border bg-card p-2 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <IconLoader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t("temples.loading")}</p>
          </div>
        ) : temples.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
            <div className="h-16 w-16 rounded-3xl bg-muted/30 flex items-center justify-center text-muted-foreground">
              <IconBuildingSkyscraper size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold text-foreground">{t("temples.noTemples")}</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">Try adjusting your search terms or add a new temple to get started.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/60 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                  <th className="px-5 py-4 w-[80px]">Image</th>
                  <th className="px-4 py-4 min-w-[240px]">{t("temples.name")}</th>
                  <th className="px-4 py-4">{t("temples.city")} & {t("temples.state")}</th>
                  <th className="px-4 py-4">{t("temples.active")}</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {temples.map((temple) => (
                  <tr key={temple.id} className="group transition-all hover:bg-muted/50 border-b border-border/50 last:border-0">
                    <td className="px-5 py-3.5">
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-muted/50 border border-border shadow-sm">
                        {temple.thumbnail?.url || (temple.gallery && temple.gallery.length > 0) ? (
                          <img
                            src={temple.thumbnail?.url || temple.gallery?.[0]?.url}
                            alt={temple.nameEn}
                            className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-500"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground/20">
                            <IconBuildingSkyscraper size={20} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-foreground leading-tight">{temple.nameEn}</p>
                        <p className="truncate text-[10px] font-medium text-muted-foreground mt-1 opacity-70 tracking-wide">{temple.nameHi}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                          {temple.cityEn}
                          <IconChevronRight size={10} className="text-muted-foreground/30" />
                          {temple.stateEn}
                        </p>
                        <p className="text-[9px] text-muted-foreground font-medium opacity-60 uppercase tracking-tighter">{temple.cityHi}, {temple.stateHi}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className={twMerge(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider",
                        temple.isActive
                          ? "bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-500/10"
                          : "bg-red-50 text-red-600 ring-1 ring-inset ring-red-500/10"
                      )}>
                        <div className={twMerge("h-1 w-1 rounded-full", temple.isActive ? "bg-emerald-500" : "bg-red-500")} />
                        {temple.isActive ? "Active" : "Inactive"}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="flex items-center gap-1 bg-muted p-1 rounded-xl mr-2 border border-border/50">
                          <button
                            onClick={() => handleMove(temple, "up")}
                            disabled={updateSortMutation.isPending}
                            className="h-7 w-7 flex items-center justify-center rounded-lg bg-card text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all active:scale-90 disabled:opacity-50 shadow-sm"
                            title="Move Up"
                          >
                            <IconChevronUp size={14} />
                          </button>
                          <span className="w-5 text-center text-[10px] font-black text-muted-foreground">{temple.sortOrder}</span>
                          <button
                            onClick={() => handleMove(temple, "down")}
                            disabled={updateSortMutation.isPending}
                            className="h-7 w-7 flex items-center justify-center rounded-lg bg-card text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all active:scale-90 disabled:opacity-50 shadow-sm"
                            title="Move Down"
                          >
                            <IconChevronDown size={14} />
                          </button>
                        </div>

                        <button
                          onClick={() => {
                            setEditingTemple(temple);
                            setIsDialogOpen(true);
                          }}
                          className="h-9 w-9 flex items-center justify-center rounded-xl bg-card text-muted-foreground shadow-sm ring-1 ring-border transition-all hover:bg-primary hover:text-primary-foreground active:scale-90"
                          title={t("common.edit")}
                        >
                          <IconEdit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setTempleToDelete(temple);
                            setIsDeleteModalOpen(true);
                          }}
                          disabled={deleteMutation.isPending && deleteMutation.variables === temple.id}
                          className="h-9 w-9 flex items-center justify-center rounded-xl bg-card text-muted-foreground shadow-sm ring-1 ring-border transition-all hover:bg-destructive hover:text-destructive-foreground active:scale-90 disabled:opacity-50"
                          title={t("common.delete")}
                        >
                          {deleteMutation.isPending && deleteMutation.variables === temple.id ? (
                            <IconLoader2 size={16} className="animate-spin" />
                          ) : (
                            <IconTrash size={16} />
                          )}
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
                        Are you sure you want to delete <span className="font-bold text-foreground">"{templeToDelete?.nameEn}"</span>? This action cannot be undone.
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
                      onClick={() => templeToDelete && deleteMutation.mutate(templeToDelete.id)}
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

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Showing <span className="text-foreground">{Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}</span> to{" "}
                  <span className="text-foreground">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{" "}
                  <span className="text-foreground">{pagination.total}</span> entries
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3 mr-4 border-r border-border pr-4">
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-transparent text-xs font-bold outline-none cursor-pointer"
                    >
                      {[5, 10, 20, 50].map(val => (
                        <option key={val} value={val}>{val} per page</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={pagination.page === 1}
                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-all hover:bg-primary hover:text-primary-foreground disabled:opacity-30 active:scale-90"
                  >
                    <IconChevronLeft size={18} />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={twMerge(
                          "h-10 w-10 text-xs font-black transition-all rounded-xl",
                          pagination.page === p
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={pagination.page === pagination.totalPages}
                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-all hover:bg-primary hover:text-primary-foreground disabled:opacity-30 active:scale-90"
                  >
                    <IconChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
