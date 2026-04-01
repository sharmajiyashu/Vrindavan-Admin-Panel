"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IconPlus,
  IconRoute,
  IconSearch,
  IconEdit,
  IconTrash,
  IconLoader2,
  IconChevronRight,
  IconChevronLeft,
  IconReload,
  IconX,
  IconSettings,
  IconDirections
} from "@tabler/icons-react";
import * as Dialog from "@radix-ui/react-dialog";
import { routeMapService, RouteMap } from "@/lib/services/routeMapService";
import { RouteMapForm } from "@/components/route-maps/RouteMapForm";
import { useLanguage } from "@/contexts/LanguageContext";
import { twMerge } from "tailwind-merge";
import { toast } from "react-toastify";
import { RouteMapFormData } from "@/lib/validations/routeMap";

export default function RouteMapsPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteMap | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<RouteMap | null>(null);

  const { data: paginatedData, isLoading } = useQuery({
    queryKey: ["route-maps", currentPage, limit],
    queryFn: () => routeMapService.listRouteMaps(currentPage, limit),
  });

  const routes = paginatedData?.routeMaps ?? [];
  const pagination = paginatedData?.pagination;

  const createMutation = useMutation({
    mutationFn: routeMapService.createRouteMap,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["route-maps"] });
      toast.success(t("routeMaps.saveSuccess"));
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create route map");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<RouteMapFormData> }) =>
      routeMapService.updateRouteMap(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["route-maps"] });
      toast.success(t("routeMaps.saveSuccess"));
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update route map");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: routeMapService.deleteRouteMap,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["route-maps"] });
      toast.success(t("routeMaps.deleteSuccess"));
      setIsDeleteModalOpen(false);
      setRouteToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete route map");
    },
  });

  const handleEdit = async (route: RouteMap) => {
    // We need the detailed version with temples
    const fullRoute = await routeMapService.getRouteMap(route.id);
    setEditingRoute(fullRoute);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
        <div className="space-y-0.5">
          <h1 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#5A2A13]/5 flex items-center justify-center text-[#5A2A13]">
              <IconRoute size={18} />
            </div>
            {t("routeMaps.title")}
          </h1>
          <p className="text-[11px] font-bold text-muted-foreground/60 pl-10.5 uppercase tracking-wider">
            {t("routeMaps.subtitle")}
          </p>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3 max-w-2xl ml-auto">
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["route-maps"] })}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-all hover:bg-muted active:scale-95 shadow-sm"
            title={t("common.refresh")}
          >
            <IconReload className={twMerge("h-4 w-4", isLoading && "animate-spin")} />
          </button>

          <Dialog.Root open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingRoute(null);
          }}>
            <Dialog.Trigger asChild>
              <button className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-6 text-[11px] font-black uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-95">
                {t("routeMaps.add")}
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" />
              <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-5xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-[2.5rem] bg-card p-10 shadow-2xl animate-in zoom-in-95 fade-in duration-300 outline-none">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/60">
                  <Dialog.Title className="text-2xl font-black tracking-tight flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <IconDirections size={20} />
                    </div>
                    {editingRoute ? t("routeMaps.edit") : t("routeMaps.add")}
                  </Dialog.Title>
                  <Dialog.Close className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-90">
                    <IconX size={20} />
                  </Dialog.Close>
                </div>

                <RouteMapForm
                  initialData={editingRoute}
                  isLoading={createMutation.isPending || updateMutation.isPending}
                  onSubmit={async (data) => {
                    if (editingRoute) {
                      return await updateMutation.mutateAsync({ id: editingRoute.id, data });
                    } else {
                      return await createMutation.mutateAsync(data);
                    }
                  }}
                  onComplete={() => {
                    setIsDialogOpen(false);
                    setEditingRoute(null);
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
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t("routeMaps.loading")}</p>
          </div>
        ) : routes.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
            <div className="h-16 w-16 rounded-3xl bg-muted/30 flex items-center justify-center text-muted-foreground">
              <IconRoute size={40} />
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold text-foreground">{t("routeMaps.noRoutes")}</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">Click "Add Route Map" above to start defining pilgrimage sequences.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/60 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                  <th className="px-6 py-4">{t("routeMaps.name")}</th>
                  <th className="px-6 py-4">{t("routeMaps.distance")}</th>
                  <th className="px-6 py-4">{t("routeMaps.time")}</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {routes.map((route) => (
                  <tr key={route.id} className="group transition-all hover:bg-muted/20">
                    <td className="px-6 py-5">
                      <div className="space-y-0.5">
                        <p className="text-xs font-black text-foreground uppercase tracking-wide">{route.nameEn}</p>
                        <p className="text-[10px] font-bold text-muted-foreground opacity-60 tracking-wider font-hindi">{route.nameHi}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[11px] font-bold text-muted-foreground">{route.totalDistanceEn || "-"}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[11px] font-bold text-muted-foreground">{route.approxTimeEn || "-"}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className={twMerge(
                        "inline-flex items-center gap-2 rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-wider",
                        route.isActive
                          ? "bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-500/20"
                          : "bg-muted text-muted-foreground ring-1 ring-inset ring-border/50"
                      )}>
                        <span className={twMerge("h-1 w-1 rounded-full", route.isActive ? "bg-emerald-500" : "bg-muted-foreground")} />
                        {route.isActive ? "Active" : "Archived"}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => handleEdit(route)}
                          className="h-9 w-9 flex items-center justify-center rounded-xl bg-card text-muted-foreground shadow-sm ring-1 ring-border transition-all hover:bg-primary hover:text-primary-foreground active:scale-90"
                        >
                          <IconEdit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setRouteToDelete(route);
                            setIsDeleteModalOpen(true);
                          }}
                          disabled={deleteMutation.isPending}
                          className="h-9 w-9 flex items-center justify-center rounded-xl bg-card text-muted-foreground shadow-sm ring-1 ring-border transition-all hover:bg-destructive hover:text-destructive-foreground active:scale-90 disabled:opacity-50"
                        >
                          <IconTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between border-t border-border/40 pt-6 px-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                  {t("common.showing")} <span className="text-foreground">{routes.length}</span> {t("common.of")} <span className="text-foreground">{pagination.total}</span> entries
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/30 text-muted-foreground transition-all hover:bg-card active:scale-90 disabled:opacity-30"
                  >
                    <IconChevronLeft size={18} />
                  </button>
                  <div className="flex items-center gap-1.5 px-2">
                    <span className="text-[11px] font-black tabular-nums">{currentPage}</span>
                    <span className="text-[11px] font-black opacity-30">/</span>
                    <span className="text-[11px] font-black opacity-30 tabular-nums">{pagination.totalPages}</span>
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={currentPage === pagination.totalPages}
                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/30 text-muted-foreground transition-all hover:bg-card active:scale-90 disabled:opacity-30"
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
          <Dialog.Content className="fixed left-[50%] top-[50%] z-[60] w-[calc(100%-2rem)] max-w-md translate-x-[-50%] translate-y-[-50%] rounded-[2.5rem] bg-card p-10 shadow-2xl animate-in zoom-in-95 fade-in duration-300 outline-none">
            <div className="flex flex-col items-center text-center">
              <div className="h-20 w-20 rounded-[2rem] bg-destructive/5 flex items-center justify-center text-destructive mb-6">
                <IconTrash size={40} />
              </div>
              <Dialog.Title className="text-2xl font-black tracking-tight mb-2 uppercase">{t("common.delete")}</Dialog.Title>
              <Dialog.Description className="text-xs font-bold text-muted-foreground leading-relaxed uppercase tracking-wider">
                {t("routeMaps.deleteConfirm")}
              </Dialog.Description>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-10">
              <Dialog.Close asChild>
                <button className="h-12 rounded-2xl border border-border bg-card text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all active:scale-95">
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={() => routeToDelete && deleteMutation.mutate(routeToDelete.id)}
                disabled={deleteMutation.isPending}
                className="h-12 rounded-2xl bg-destructive text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-destructive/20 hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending ? <IconLoader2 className="h-4 w-4 animate-spin" /> : null}
                {t("common.delete")}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
