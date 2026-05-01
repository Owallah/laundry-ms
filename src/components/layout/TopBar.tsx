"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import type { Profile } from "@/types";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/orders": "Orders",
  "/dashboard/orders/new": "New Order",
  "/dashboard/customers": "Customers",
  "/dashboard/staff": "Staff & Shifts",
  "/dashboard/inventory": "Inventory",
  "/dashboard/payments": "Payments",
  "/dashboard/analytics": "Analytics",
  "/dashboard/settings": "Settings",
  "/dashboard/orders/board": "Orders Board",
};

function getTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/dashboard/orders/")) return "Order Details";
  if (pathname.startsWith("/dashboard/customers/")) return "Customer Profile";
  return "FreshFlow";
}

export default function TopBar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const title = getTitle(pathname);
  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? "Good morning"
      : now.getHours() < 17
      ? "Good afternoon"
      : "Good evening";

  return (
    <header className="h-16 bg-[var(--color-surface-raised)] border-b border-[var(--color-border)] flex items-center justify-between px-6 flex-shrink-0">
      <div>
        <h1 className="font-semibold text-[var(--color-text-primary)] text-lg leading-none">
          {title}
        </h1>
        {pathname === "/dashboard" && (
          <p className="text-[var(--color-text-tertiary)] text-sm mt-0.5">
            {greeting},{" "}
            {profile?.full_name?.split(" ")[0] || "there"} 👋
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Search hint */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-tertiary)] text-sm cursor-pointer hover:border-[var(--color-border-strong)] transition">
          <Search className="w-3.5 h-3.5" />
          <span>Quick search…</span>
          <kbd className="ml-2 text-[10px] font-mono bg-[var(--color-border)] px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>
        </div>

        {/* Notification bell */}
        <button className="relative p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] rounded-lg transition">
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
}
