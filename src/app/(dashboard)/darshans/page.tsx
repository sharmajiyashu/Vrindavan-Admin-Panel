"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconLoader2,
  IconChevronRight,
  IconChevronLeft,
  IconReload,
  IconPhoto,
  IconBuildingSkyscraper,
  IconCalendar,
  IconX,
  IconSettings
} from "@tabler/icons-react";
import * as Dialog from "@radix-ui/react-dialog";
import { darshanService, Darshan } from "@/lib/services/darshanService";
import { templeService } from "@/lib/services/templeService";
import { DarshanForm } from "@/components/darshans/DarshanForm";
import { useLanguage } from "@/contexts/LanguageContext";
import { twMerge } from "tailwind-merge";
import { toast } from "react-toastify";
import { DarshanFormData } from "@/lib/validations/darshan";

export default function DarshansPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDarshan, setEditingDarshan] = useState<Darshan | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [templeId, setTempleId] = useState<number | undefined>(undefined);
  const [date, setDate] = useState<string>("");
  const [shift, setShift] = useState<string>("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [darshanToDelete, setDarshanToDelete] = useState<Darshan | null>(null);

  const { data: paginatedData, isLoading } = useQuery({
    queryKey: ["darshans", currentPage, limit, templeId, date, shift],
    queryFn: () => darshanService.listDarshans(currentPage, limit, templeId, date, shift),
  });

  const { data: templesData } = useQuery({
    queryKey: ["temples", 1, 1000, ""],
    queryFn: () => templeService.listTemples(1, 1000, ""),
  });

  const darshans = paginatedData?.darshans ?? [];
  const pagination = paginatedData?.pagination;

  const createMutation = useMutation({
    mutationFn: darshanService.createDarshan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["darshans"] });
      toast.success(t("darshans.saveSuccess"));
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create darshan");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DarshanFormData> }) =>
      darshanService.updateDarshan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["darshans"] });
      toast.success(t("darshans.saveSuccess"));
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update darshan");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: darshanService.deleteDarshan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["darshans"] });
      toast.success(t("darshans.deleteSuccess"));
      setIsDeleteModalOpen(false);
      setDarshanToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete darshan");
    },
  });

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
        <div className="space-y-0.5">
          <h1 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#5A2A13]/5 flex items-center justify-center text-[#5A2A13]">
              <IconPhoto size={18} />
            </div>
            {t("darshans.title")}
          </h1>
          <p className="text-[11px] font-bold text-muted-foreground/60 pl-10.5 uppercase tracking-wider">
            {t("darshans.subtitle")}
          </p>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3 max-w-2xl ml-auto">
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["darshans"] })}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border-2 border-border bg-card text-muted-foreground transition-all hover:bg-muted active:scale-95 shadow-sm"
            title={t("common.refresh")}
          >
            <IconReload className={twMerge("h-4 w-4", isLoading && "animate-spin")} />
          </button>

          <Dialog.Root open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingDarshan(null);
          }}>
            <Dialog.Trigger asChild>
              <button className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-[11px] font-black uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-95">
                {t("darshans.add")}
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
                    {editingDarshan ? t("darshans.edit") : t("darshans.add")}
                  </Dialog.Title>
                  <Dialog.Close className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-90">
                    <IconX size={20} />
                  </Dialog.Close>
                </div>
                <DarshanForm
                  initialData={editingDarshan}
                  isLoading={createMutation.isPending || updateMutation.isPending}
                  onSubmitBasic={async (data) => {
                    const id = (data as any).id || editingDarshan?.id;
                    if (id) {
                      await updateMutation.mutateAsync({ id, data });
                      return id;
                    } else {
                      const result = await createMutation.mutateAsync(data);
                      return result.id;
                    }
                  }}
                  onSubmitFiles={async (id, files) => {
                    await darshanService.uploadGallery(id, files);
                    queryClient.invalidateQueries({ queryKey: ["darshans"] });
                  }}
                  onRemoveMedia={async (id, mediaId) => {
                    await darshanService.deleteGalleryMedia(id, mediaId);
                  }}
                  onComplete={() => {
                    setIsDialogOpen(false);
                    setEditingDarshan(null);
                    queryClient.invalidateQueries({ queryKey: ["darshans"] });
                  }}
                />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-2">
        <div className="relative group">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors">
            <IconBuildingSkyscraper size={14} />
          </div>
          <select
            value={templeId || ""}
            onChange={(e) => {
              setTempleId(e.target.value ? Number(e.target.value) : undefined);
              setCurrentPage(1);
            }}
            className="h-11 w-full rounded-xl border-2 border-border bg-card pl-10 pr-4 text-[11px] font-bold shadow-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 appearance-none cursor-pointer"
          >
            <option value="">All Temples</option>
            {templesData?.temples?.map((t) => (
              <option key={t.id} value={t.id}>{t.nameEn}</option>
            ))}
          </select>
        </div>

        <div className="relative group">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors">
            <IconCalendar size={14} />
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setCurrentPage(1); }}
            className="h-11 w-full rounded-xl border-2 border-border bg-card pl-10 pr-4 text-[11px] font-bold shadow-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
          />
        </div>

        <div className="relative group">
          <select
            value={shift}
            onChange={(e) => { setShift(e.target.value); setCurrentPage(1); }}
            className="h-11 w-full rounded-xl border-2 border-border bg-card px-4 text-[11px] font-bold shadow-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 appearance-none cursor-pointer"
          >
            <option value="">{t("darshans.allShifts") || "All Shifts"}</option>
            <option value="morning">{t("darshans.morning") || "Morning"}</option>
            <option value="evening">{t("darshans.evening") || "Evening"}</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="rounded-3xl border-2 border-border bg-card p-2 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <IconLoader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t("darshans.loading")}</p>
          </div>
        ) : darshans.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
            <div className="h-16 w-16 rounded-3xl bg-muted/30 flex items-center justify-center text-muted-foreground">
              <IconPhoto size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold text-foreground">{t("darshans.noDarshans")}</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">Try adjusting your filters or add a new darshan entry.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/60 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                  <th className="px-5 py-4 w-[80px]">Image</th>
                  <th className="px-4 py-4">{t("darshans.temple")}</th>
                  <th className="px-4 py-4">{t("darshans.date")}</th>
                  <th className="px-4 py-4">{t("darshans.shift") || "Shift"}</th>
                  <th className="px-4 py-4">{t("darshans.description")}</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {darshans.map((darshan) => (
                  <tr key={darshan.id} className="group transition-all hover:bg-muted/50 border-b border-border/50 last:border-0">
                    <td className="px-5 py-3.5">
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-muted/50 border border-border shadow-sm">
                        {darshan.gallery && darshan.gallery.length > 0 ? (
                          <img
                            src={darshan.gallery[0]?.url}
                            alt="Darshan"
                            className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-500"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground/20">
                            <IconPhoto size={20} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs font-bold text-foreground leading-tight">{darshan.temple?.nameEn || "N/A"}</p>
                      <p className="text-[10px] font-medium text-muted-foreground mt-1 opacity-70">{darshan.temple?.nameHi || "N/A"}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/5 px-2.5 py-1 text-[10px] font-bold text-primary border border-primary/10">
                        <IconCalendar size={12} className="opacity-60" />
                        {darshan.date}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/5 px-2.5 py-1 text-[10px] font-bold text-primary border border-primary/10 tracking-widest uppercase">
                        {darshan.shift === "morning" ? t("darshans.morning") : t("darshans.evening")}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="truncate max-w-[300px] text-[11px] text-muted-foreground">{darshan.descriptionEn || "No English description provided."}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingDarshan(darshan);
                            setIsDialogOpen(true);
                          }}
                          className="h-9 w-9 flex items-center justify-center rounded-xl bg-card text-muted-foreground shadow-sm ring-1 ring-border transition-all hover:bg-primary hover:text-primary-foreground active:scale-90"
                          title={t("common.edit")}
                        >
                          <IconEdit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setDarshanToDelete(darshan);
                            setIsDeleteModalOpen(true);
                          }}
                          disabled={deleteMutation.isPending}
                          className="h-9 w-9 flex items-center justify-center rounded-xl bg-card text-muted-foreground shadow-sm ring-1 ring-border transition-all hover:bg-destructive hover:text-destructive-foreground active:scale-90 disabled:opacity-50"
                          title={t("common.delete")}
                        >
                          <IconTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

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
                    {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                      // Simple range logic: show first 5 pages for now
                      return i + 1;
                    }).map((p) => (
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

      {/* Delete Confirmation */}
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
                  {t("darshans.deleteConfirm")}
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
                onClick={() => darshanToDelete && deleteMutation.mutate(darshanToDelete.id)}
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
  );
}
