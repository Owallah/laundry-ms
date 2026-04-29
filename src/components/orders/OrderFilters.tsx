"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useCallback, useState } from "react";
import type { OrderStatus } from "@/types";
import { ORDER_STATUS_LABELS } from "@/lib/utils";

const STATUSES: OrderStatus[] = [
  "received",
  "in_progress",
  "ready",
  "out_for_delivery",
  "completed",
  "cancelled",
];

export default function OrderFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const activeStatus = searchParams.get("status");
  const hasFilters = !!(searchParams.get("status") || searchParams.get("payment") || searchParams.get("q"));

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!e.target.value) updateParam("q", null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") updateParam("q", search || null);
          }}
          placeholder="Search order number…"
          className="w-full pl-9 pr-4 py-2 text-sm border border-[var(--color-border)] rounded-xl focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition bg-white"
        />
      </div>

      {/* Status pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => updateParam("status", null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            !activeStatus
              ? "bg-brand-600 text-white"
              : "bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]"
          }`}
        >
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => updateParam("status", s === activeStatus ? null : s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeStatus === s
                ? "bg-brand-600 text-white"
                : "bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]"
            }`}
          >
            {ORDER_STATUS_LABELS[s]}
          </button>
        ))}
        {hasFilters && (
          <button
            onClick={() => {
              setSearch("");
              router.push(pathname);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-red-600 hover:bg-red-50 transition"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
