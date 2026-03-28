"use client";

import * as React from "react";
import { IconChevronLeft, IconChevronRight, IconDots } from "@tabler/icons-react";
import { twMerge } from "tailwind-merge";
import { useTranslations } from "@/contexts/LanguageContext";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total?: number;
  limit?: number;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  total,
  limit,
  className,
}: PaginationProps) {
  const { t } = useTranslations();

  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const showMax = 5;

    if (totalPages <= showMax) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("ellipsis-start");

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (page < totalPages - 2) pages.push("ellipsis-end");
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  const showingFrom = limit ? (page - 1) * limit + 1 : null;
  const showingTo = limit ? Math.min(page * limit, total || 0) : null;

  return (
    <div className={twMerge("flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-card/50 backdrop-blur-sm px-6 py-4 shadow-sm", className)}>
      <div className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">
          {t("common.page")} {page}
        </span>{" "}
        {t("common.of")}{" "}
        <span className="font-semibold text-foreground">{totalPages}</span>
        {total !== undefined && limit !== undefined && (
          <>
            <span className="mx-2 text-muted-foreground/40">|</span>
            {t("common.showing")}{" "}
            <span className="font-semibold text-foreground">{showingFrom}</span>{" "}
            {t("common.to")}{" "}
            <span className="font-semibold text-foreground">{showingTo}</span>{" "}
            {t("common.of")}{" "}
            <span className="font-bold text-primary">{total}</span>{" "}
            {t("common.results")}
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-all hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:hover:bg-background active:scale-95 shadow-sm"
          aria-label={t("common.previous")}
        >
          <IconChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-1.5">
          {getPageNumbers().map((p, i) => {
            if (p === "ellipsis-start" || p === "ellipsis-end") {
              return (
                <div key={`${p}-${i}`} className="flex h-10 w-10 items-center justify-center text-muted-foreground/50">
                  <IconDots className="h-4 w-4" />
                </div>
              );
            }

            const pNum = p as number;
            const isCurrent = pNum === page;

            return (
              <button
                key={pNum}
                type="button"
                onClick={() => onPageChange(pNum)}
                className={twMerge(
                  "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm",
                  isCurrent
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 border border-primary"
                    : "border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {pNum}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-all hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:hover:bg-background active:scale-95 shadow-sm"
          aria-label={t("common.next")}
        >
          <IconChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
