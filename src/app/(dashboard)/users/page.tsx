"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IconSearch,
  IconReload,
  IconUsers,
  IconChevronRight,
  IconChevronLeft,
  IconLoader2,
  IconUser,
  IconPhone,
  IconMail,
  IconWallet,
  IconTicket,
  IconId,
  IconEdit,
  IconX,
  IconShieldCheck,
} from "@tabler/icons-react";
import * as Dialog from "@radix-ui/react-dialog";
import { userService, User, PaginatedUserResponse } from "@/lib/services/userService";
import { useLanguage } from "@/contexts/LanguageContext";
import { twMerge } from "tailwind-merge";
import { toast } from "react-toastify";

export default function UsersPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [formData, setFormData] = useState({ name: "", email: "" });

  const { data, isLoading } = useQuery<PaginatedUserResponse>({
    queryKey: ["users", page, limit, searchTerm],
    queryFn: () => userService.listUsers(page, limit, searchTerm),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; email: string } }) =>
      userService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(t("users.saveSuccess"));
      setIsEditDialogOpen(false);
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update user");
    },
  });

  const users = data?.users || [];
  const pagination = data?.pagination;

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email || "" });
    setIsEditDialogOpen(true);
  };

  const onUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data: formData });
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
        <div className="space-y-0.5">
          <h1 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
              <IconUsers size={18} />
            </div>
            {t("users.title")}
          </h1>
          <p className="text-[11px] font-bold text-muted-foreground/60 pl-10.5 uppercase tracking-wider">
            {t("users.subtitle")}
          </p>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3 max-w-2xl ml-auto">
          <div className="relative group flex-1 max-w-xs">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center h-5 w-5">
              <IconSearch className="h-3.5 w-3.5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search by name, email or mobile..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-xl border border-border bg-card/50 pl-10 pr-4 text-[11px] font-bold shadow-sm transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none placeholder:text-muted-foreground/20"
            />
          </div>

          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["users"] })}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-all hover:bg-muted active:scale-95 shadow-sm"
          >
            <IconReload className={twMerge("h-4 w-4", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="rounded-[2.5rem] border border-border bg-card p-4 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <IconLoader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t("users.loading")}</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
            <div className="h-16 w-16 rounded-3xl bg-muted/30 flex items-center justify-center text-muted-foreground">
              <IconUsers size={32} />
            </div>
            <p className="text-base font-bold text-foreground">{t("users.noUsers")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/60 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                  <th className="px-6 py-4">User</th>
                  <th className="px-4 py-4">{t("users.walletBalance")}</th>
                  <th className="px-4 py-4">{t("users.referralCode")}</th>
                  <th className="px-4 py-4">{t("users.totalBookings")}</th>
                  <th className="px-4 py-4">{t("users.role")}</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {users.map((user: User) => (
                  <tr key={user.id} className="group transition-all hover:bg-muted/20">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-muted/50 border border-border flex items-center justify-center text-muted-foreground">
                          <IconUser size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-foreground leading-tight">{user.name}</p>
                          <div className="flex items-center gap-3 mt-1 opacity-70">
                            <p className="truncate text-[10px] font-medium text-muted-foreground tracking-wide flex items-center gap-1">
                              <IconMail size={10} />
                              {user.email || "No email"}
                            </p>
                            <p className="truncate text-[10px] font-medium text-muted-foreground tracking-wide flex items-center gap-1">
                              <IconPhone size={10} />
                              {user.mobile}
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-xs font-black text-emerald-600">₹{user.walletBalance}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/5 text-primary">
                        <IconTicket size={12} />
                        <span className="text-[10px] font-black tracking-widest uppercase">{user.referralCode || "NONE"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-xs font-bold text-foreground">{user.totalBookings}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{user.userRole}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEditClick(user)}
                        className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-card text-muted-foreground shadow-sm ring-1 ring-border transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
                      >
                        <IconEdit size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination && pagination.totalPages ? (
              <div className="flex items-center justify-between px-6 py-6 border-t border-border/40">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="h-9 w-9 rounded-xl border border-border flex items-center justify-center bg-card text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
                  >
                    <IconChevronLeft size={16} />
                  </button>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                    className="h-9 w-9 rounded-xl border border-border flex items-center justify-center bg-card text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
                  >
                    <IconChevronRight size={16} />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      <Dialog.Root open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-[2.5rem] bg-card p-10 shadow-2xl animate-in zoom-in-95 fade-in duration-300 outline-none border border-border">
            <div className="flex items-center justify-between mb-8">
              <Dialog.Title className="text-2xl font-black tracking-tight flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <IconUser size={20} />
                </div>
                {t("users.edit")}
              </Dialog.Title>
              <Dialog.Close className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-90">
                <IconX size={20} />
              </Dialog.Close>
            </div>

            <form onSubmit={onUpdateSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    {t("users.name")}
                  </label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-12 w-full rounded-2xl border border-border bg-muted/20 px-4 text-sm font-bold transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none placeholder:text-muted-foreground/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    {t("users.email")}
                  </label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-12 w-full rounded-2xl border border-border bg-muted/20 px-4 text-sm font-bold transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none placeholder:text-muted-foreground/30"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Dialog.Close asChild>
                  <button type="button" className="flex-1 h-12 rounded-2xl border border-border text-xs font-black uppercase tracking-wider text-muted-foreground hover:bg-muted transition-all active:scale-95">
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex-[2] h-12 rounded-2xl bg-primary text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {updateMutation.isPending ? <IconLoader2 size={16} className="animate-spin" /> : <IconShieldCheck size={16} />}
                  {t("users.updateProfile")}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
