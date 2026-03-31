"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconSearch,
  IconReload,
  IconWallet,
  IconChevronRight,
  IconChevronLeft,
  IconLoader2,
  IconArrowUpRight,
  IconArrowDownLeft,
  IconReceipt2,
  IconUser,
  IconCalendar,
  IconBuildingBank,
  IconChartPie,
  IconCreditCard,
  IconClock,
} from "@tabler/icons-react";
import { walletService, PaginatedWalletResponse, WalletTransaction } from "@/lib/services/walletService";
import { useLanguage } from "@/contexts/LanguageContext";
import { twMerge } from "tailwind-merge";

export default function WalletsPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "credit" | "debit">("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const { data, isLoading } = useQuery<PaginatedWalletResponse>({
    queryKey: ["wallets", page, limit, typeFilter, searchTerm],
    queryFn: () => walletService.listTransactions(page, limit, searchTerm, typeFilter === "all" ? undefined : typeFilter),
  });

  const transactions = data?.transactions || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
        <div className="space-y-0.5">
          <h1 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
              <IconWallet size={18} />
            </div>
            {t("wallets.title")}
          </h1>
          <p className="text-[11px] font-bold text-muted-foreground/60 pl-10.5 uppercase tracking-wider">
            {t("wallets.subtitle")}
          </p>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3 max-w-2xl ml-auto">
          <div className="flex items-center gap-2">
            {(["all", "credit", "debit"] as const).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setTypeFilter(type);
                  setPage(1);
                }}
                className={twMerge(
                  "h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  typeFilter === type
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-card text-muted-foreground border border-border hover:bg-muted"
                )}
              >
                {type === "all" ? t("wallets.all") : type}
              </button>
            ))}
          </div>

          <div className="relative group flex-1 max-w-[180px]">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center h-5 w-5">
              <IconSearch className="h-3.5 w-3.5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-xl border border-border bg-card/50 pl-10 pr-4 text-[11px] font-bold shadow-sm transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none placeholder:text-muted-foreground/20"
            />
          </div>

          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["wallets"] })}
            className="inline-flex h-10 w-10 min-w-[40px] items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-all hover:bg-muted shadow-sm"
          >
            <IconReload className={twMerge("h-4 w-4", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="rounded-[2.5rem] border border-border bg-card p-4 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <IconLoader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t("wallets.loading")}</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
            <div className="h-16 w-16 rounded-3xl bg-muted/30 flex items-center justify-center text-muted-foreground">
              <IconWallet size={32} />
            </div>
            <p className="text-base font-bold text-foreground">{t("wallets.noTransactions")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/60 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                  <th className="px-6 py-4">Transaction</th>
                  <th className="px-4 py-4">{t("wallets.user")}</th>
                  <th className="px-4 py-4">{t("wallets.amount")}</th>
                  <th className="px-4 py-4">{t("wallets.type")}</th>
                  <th className="px-4 py-4">{t("wallets.date")}</th>
                  <th className="px-6 py-4 text-right">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {transactions.map((tx: WalletTransaction) => (
                  <tr key={tx.id} className="group transition-all hover:bg-muted/20">
                    <td className="px-6 py-4">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-foreground leading-tight">{tx.description}</p>
                        <p className="truncate text-[9px] font-bold text-muted-foreground/40 mt-1 tracking-wider uppercase">
                          TXID: {tx.id.toString().padStart(6, '0')}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                          <IconUser size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-foreground">{tx.user?.name}</p>
                          <p className="truncate text-[9px] font-medium text-muted-foreground opacity-60">{tx.user?.mobile}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className={twMerge(
                        "text-xs font-black",
                        tx.type === "credit" ? "text-emerald-600" : "text-red-500"
                      )}>
                        {tx.type === "credit" ? "+" : "-"}₹{tx.amount}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className={twMerge(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider",
                        tx.type === "credit"
                          ? "bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-500/10"
                          : "bg-red-50 text-red-600 ring-1 ring-inset ring-red-500/10"
                      )}>
                        {tx.type === "credit" ? <IconArrowUpRight size={10} /> : <IconArrowDownLeft size={10} />}
                        {tx.type}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="inline-flex flex-col items-start gap-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground/80">
                          <IconCalendar size={13} className="opacity-30" />
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {tx.booking && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all cursor-pointer">
                          <IconReceipt2 size={13} />
                          <span className="text-[10px] font-black tracking-wider uppercase">{tx.booking.bookingId || `#${tx.booking.id}`}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
