"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconLoader2,
  IconX,
  IconReload,
  IconPhoto,
  IconDotsVertical,
  IconPhotoStar
} from "@tabler/icons-react";
import * as Dialog from "@radix-ui/react-dialog";
import { darshanBannerService, DarshanBanner, PaginatedBannerResponse } from "@/lib/services/darshanBannerService";
import { DarshanBannerForm } from "@/components/darshan-banners/DarshanBannerForm";
import { useLanguage } from "@/contexts/LanguageContext";
import { twMerge } from "tailwind-merge";
import { toast } from "react-toastify";
import { DarshanBannerFormData } from "@/lib/validations/darshanBanner";

export default function DarshanBannersPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<DarshanBanner | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<DarshanBanner | null>(null);
  const [page, setPage] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading, isError } = useQuery<PaginatedBannerResponse>({
    queryKey: ["darshan-banners", page],
    queryFn: () => darshanBannerService.listBanners(page, 10),
    enabled: mounted,
  });

  const banners = data?.banners || [];

  const deleteMutation = useMutation({
    mutationFn: darshanBannerService.deleteBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["darshan-banners"] });
      toast.success(t("darshanBanners.deleteSuccess"));
      setIsDeleteModalOpen(false);
      setBannerToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete banner");
    },
  });

  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
        <div className="space-y-0.5">
          <h1 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
              <IconPhotoStar size={18} />
            </div>
            {t("darshanBanners.title")}
          </h1>
          <p className="text-[11px] font-bold text-muted-foreground/60 pl-10.5 uppercase tracking-wider">
            {t("darshanBanners.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["darshan-banners"] })}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-all hover:bg-muted active:scale-95 shadow-sm"
          >
            <IconReload className={twMerge("h-4 w-4", isLoading && "animate-spin")} />
          </button>

          <Dialog.Root open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingBanner(null);
          }}>
            <Dialog.Trigger asChild>
              <button className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-6 text-[11px] font-black uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-95">
                {t("darshanBanners.add")}
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" />
              <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-4xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-[2.5rem] bg-card p-10 shadow-2xl animate-in zoom-in-95 fade-in duration-300 outline-none">
                <div className="flex items-center justify-between mb-8">
                  <Dialog.Title className="text-2xl font-black tracking-tight flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <IconPhotoStar size={20} />
                    </div>
                    {editingBanner ? t("darshanBanners.edit") : t("darshanBanners.add")}
                  </Dialog.Title>
                  <Dialog.Close className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-90">
                    <IconX size={20} />
                  </Dialog.Close>
                </div>
                <DarshanBannerForm
                  key={editingBanner?.id ?? "new"}
                  initialData={editingBanner}
                  isLoading={isSaving}
                  onSubmit={async (data, file) => {
                    setIsSaving(true);
                    try {
                      if (editingBanner) {
                        await darshanBannerService.updateBanner(editingBanner.id, data, file);
                      } else {
                        await darshanBannerService.createBanner(data, file);
                      }
                      queryClient.invalidateQueries({ queryKey: ["darshan-banners"] });
                      toast.success(t("darshanBanners.saveSuccess"));
                      setIsDialogOpen(false);
                      setEditingBanner(null);
                    } catch (err: any) {
                      toast.error(err.message || "Failed to save banner");
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>

      <div className="rounded-[2.5rem] border border-border bg-card shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] overflow-hidden p-4">
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <IconLoader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t("darshanBanners.loading")}</p>
          </div>
        ) : banners.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
            <div className="h-16 w-16 rounded-3xl bg-muted/20 flex items-center justify-center text-muted-foreground">
              <IconPhoto size={32} />
            </div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{t("darshanBanners.noBanners")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-2">
              {banners.map((banner) => (
                <div key={banner.id} className="group relative overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-sm transition-all hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
                  <div className="aspect-video relative overflow-hidden">
                    {banner.media?.url ? (
                      <img src={banner.media.url} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center text-muted-foreground">
                        <IconPhoto size={48} stroke={1} />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <button
                        onClick={() => {
                          setEditingBanner(banner);
                          setIsDialogOpen(true);
                        }}
                        className="h-10 w-10 rounded-xl bg-white/90 backdrop-blur shadow-sm flex items-center justify-center text-foreground hover:bg-primary hover:text-white transition-all"
                      >
                        <IconEdit size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setBannerToDelete(banner);
                          setIsDeleteModalOpen(true);
                        }}
                        className="h-10 w-10 rounded-xl bg-white/90 backdrop-blur shadow-sm flex items-center justify-center text-destructive hover:bg-destructive hover:text-white transition-all"
                      >
                        <IconTrash size={18} />
                      </button>
                    </div>
                    {banner.isActive && (
                      <div className="absolute top-4 left-4 bg-emerald-500/90 backdrop-blur text-[9px] font-black uppercase tracking-widest text-white px-2.5 py-1 rounded-full shadow-sm">
                        Active
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-sm font-black text-foreground truncate">
                      {banner.linkType === "whatsapp"
                        ? t("darshanBanners.linkTypeWhatsapp")
                        : t("darshanBanners.linkTypeTour")}
                    </h3>
                    <p className="text-[10px] font-bold text-muted-foreground/60 mt-0.5 truncate uppercase tracking-widest">
                      {banner.linkType === "whatsapp"
                        ? banner.whatsappNumber || "—"
                        : banner.tour
                          ? `${banner.tour.titleEn} (${banner.tour.titleHi})`
                          : banner.tourId != null
                            ? `${t("darshanBanners.tour")} #${banner.tourId}`
                            : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog.Root open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-[2.5rem] bg-card p-10 shadow-2xl animate-in zoom-in-95 fade-in duration-300 outline-none border border-border">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 mx-auto rounded-3xl bg-destructive/10 flex items-center justify-center text-destructive">
                <IconTrash size={32} />
              </div>
              <div className="space-y-1">
                <Dialog.Title className="text-xl font-black">{t("common.delete")}</Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground">
                  {t("darshanBanners.deleteConfirm")}
                </Dialog.Description>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-8">
              <Dialog.Close asChild>
                <button className="h-12 rounded-2xl border border-border text-sm font-bold hover:bg-muted transition-all">
                  {t("common.cancel")}
                </button>
              </Dialog.Close>
              <button
                onClick={() => bannerToDelete && deleteMutation.mutate(bannerToDelete.id)}
                disabled={deleteMutation.isPending}
                className="h-12 rounded-2xl bg-destructive text-sm font-black text-white shadow-lg shadow-destructive/20 transition-all hover:opacity-90 active:scale-95"
              >
                {deleteMutation.isPending ? <IconLoader2 className="h-4 w-4 animate-spin" /> : t("common.delete")}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
