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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading } = useQuery<PaginatedFooterPromoResponse>({
    queryKey: ["footer-promos"],
    queryFn: () => footerPromoService.listPromos(1, 1), // Only need the first one
    enabled: mounted,
  });

  const activePromo = data?.footerPromos?.[0] || null;

  const deleteMutation = useMutation({
    mutationFn: footerPromoService.deletePromo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["footer-promos"] });
      toast.success(t("footerPromos.deleteSuccess"));
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete");
    },
  });

  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700 max-w-5xl mx-auto">
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

          {activePromo && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(t("footerPromos.deleteConfirm"))) {
                  deleteMutation.mutate(activePromo.id);
                }
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 text-destructive transition-all hover:bg-destructive hover:text-white active:scale-95 shadow-sm"
              title={t("common.delete")}
            >
              <IconTrash className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="rounded-[2.5rem] border border-border bg-card shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] overflow-hidden p-10">
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <IconLoader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {t("footerPromos.loading")}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between pb-6 border-b border-border">
              <div className="space-y-1">
                <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                  {activePromo ? t("footerPromos.edit") : t("footerPromos.add")}
                </h2>
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                  {activePromo ? "Update existing footer banner" : "Setup a new footer banner"}
                </p>
              </div>
            </div>

            <FooterPromoForm
              key={activePromo?.id ?? "new"}
              initialData={activePromo}
              isLoading={isSaving}
              onSubmit={async (formData, file) => {
                setIsSaving(true);
                try {
                  if (activePromo) {
                    await footerPromoService.updatePromo(activePromo.id, formData, file);
                  } else {
                    await footerPromoService.createPromo(formData, file);
                  }
                  queryClient.invalidateQueries({ queryKey: ["footer-promos"] });
                  toast.success(t("footerPromos.saveSuccess"));
                } catch (err: unknown) {
                  toast.error(err instanceof Error ? err.message : "Failed to save");
                } finally {
                  setIsSaving(false);
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
