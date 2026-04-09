"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IconEdit,
  IconTrash,
  IconLoader2,
  IconX,
  IconReload,
  IconPhoto,
  IconLayoutBottombar,
} from "@tabler/icons-react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  footerPromoService,
  FooterPromo,
  PaginatedFooterPromoResponse,
} from "@/lib/services/footerPromoService";
import { FooterPromoForm } from "@/components/footer-promos/FooterPromoForm";
import { useLanguage } from "@/contexts/LanguageContext";
import { twMerge } from "tailwind-merge";
import { toast } from "react-toastify";
import type { FooterPromoFormData } from "@/lib/validations/footerPromo";

export default function FooterPromosPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FooterPromo | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<FooterPromo | null>(null);
  const [page, setPage] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading } = useQuery<PaginatedFooterPromoResponse>({
    queryKey: ["footer-promos", page],
    queryFn: () => footerPromoService.listPromos(page, 10),
    enabled: mounted,
  });

  const rows = data?.footerPromos ?? [];

  const deleteMutation = useMutation({
    mutationFn: footerPromoService.deletePromo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["footer-promos"] });
      toast.success(t("footerPromos.deleteSuccess"));
      setIsDeleteOpen(false);
      setToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete");
    },
  });

  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
        <div className="space-y-0.5">
          <h1 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
              <IconLayoutBottombar size={18} />
            </div>
            {t("footerPromos.title")}
          </h1>
          <p className="text-[11px] font-bold text-muted-foreground/60 pl-10.5 uppercase tracking-wider">
            {t("footerPromos.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["footer-promos"] })}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-all hover:bg-muted active:scale-95 shadow-sm"
          >
            <IconReload className={twMerge("h-4 w-4", isLoading && "animate-spin")} />
          </button>

          <Dialog.Root
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) setEditing(null);
            }}
          >
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-6 text-[11px] font-black uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-95"
              >
                {t("footerPromos.add")}
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" />
              <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-4xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-[2.5rem] bg-card p-10 shadow-2xl animate-in zoom-in-95 fade-in duration-300 outline-none">
                <div className="flex items-center justify-between mb-8">
                  <Dialog.Title className="text-2xl font-black tracking-tight flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <IconLayoutBottombar size={20} />
                    </div>
                    {editing ? t("footerPromos.edit") : t("footerPromos.add")}
                  </Dialog.Title>
                  <Dialog.Close className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-90">
                    <IconX size={20} />
                  </Dialog.Close>
                </div>
                <FooterPromoForm
                  key={editing?.id ?? "new"}
                  initialData={editing}
                  isLoading={isSaving}
                  onSubmit={async (formData: FooterPromoFormData, file) => {
                    setIsSaving(true);
                    try {
                      if (editing) {
                        await footerPromoService.updatePromo(editing.id, formData, file);
                      } else {
                        await footerPromoService.createPromo(formData, file);
                      }
                      queryClient.invalidateQueries({ queryKey: ["footer-promos"] });
                      toast.success(t("footerPromos.saveSuccess"));
                      setIsDialogOpen(false);
                      setEditing(null);
                    } catch (err: unknown) {
                      toast.error(err instanceof Error ? err.message : "Failed to save");
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
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {t("footerPromos.loading")}
            </p>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
            <div className="h-16 w-16 rounded-3xl bg-muted/20 flex items-center justify-center text-muted-foreground">
              <IconPhoto size={32} />
            </div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              {t("footerPromos.empty")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-2">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="group relative overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-sm transition-all hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
                >
                  <div className="aspect-[4/3] relative overflow-hidden">
                    {row.media?.url ? (
                      <img
                        src={row.media.url}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center text-muted-foreground">
                        <IconPhoto size={48} stroke={1} />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(row);
                          setIsDialogOpen(true);
                        }}
                        className="h-10 w-10 rounded-xl bg-white/90 backdrop-blur shadow-sm flex items-center justify-center text-foreground hover:bg-primary hover:text-white transition-all"
                      >
                        <IconEdit size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setToDelete(row);
                          setIsDeleteOpen(true);
                        }}
                        className="h-10 w-10 rounded-xl bg-white/90 backdrop-blur shadow-sm flex items-center justify-center text-destructive hover:bg-destructive hover:text-white transition-all"
                      >
                        <IconTrash size={18} />
                      </button>
                    </div>
                    {row.isActive && (
                      <div className="absolute top-4 left-4 bg-emerald-500/90 backdrop-blur text-[9px] font-black uppercase tracking-widest text-white px-2.5 py-1 rounded-full shadow-sm">
                        {t("footerPromos.active")}
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
                      <span className="bg-black/50 backdrop-blur text-[9px] font-black text-white px-2 py-1 rounded-lg">
                        #{row.sortOrder ?? 0}
                      </span>
                      <span className="bg-black/50 backdrop-blur text-[9px] font-black text-white px-2 py-1 rounded-lg">
                        {t("footerPromos.showTimesLabel")}: {row.showTimes ?? 1}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-sm font-black text-foreground truncate">
                      {row.titleEn || row.titleHi || t("footerPromos.untitled")}
                    </h3>
                    <p className="text-[10px] font-bold text-muted-foreground/60 mt-0.5 truncate uppercase tracking-widest">
                      {row.subtitleEn || row.subtitleHi || "—"}
                    </p>
                    {row.tour && (
                      <p className="text-[10px] font-bold text-primary/80 mt-2 truncate">
                        {row.tour.titleEn} ({row.tour.titleHi})
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog.Root open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
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
                  {t("footerPromos.deleteConfirm")}
                </Dialog.Description>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-8">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="h-12 rounded-2xl border border-border text-sm font-bold hover:bg-muted transition-all"
                >
                  {t("common.cancel")}
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={() => toDelete && deleteMutation.mutate(toDelete.id)}
                disabled={deleteMutation.isPending}
                className="h-12 rounded-2xl bg-destructive text-sm font-black text-white shadow-lg shadow-destructive/20 transition-all hover:opacity-90 active:scale-95"
              >
                {deleteMutation.isPending ? (
                  <IconLoader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  t("common.delete")
                )}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
