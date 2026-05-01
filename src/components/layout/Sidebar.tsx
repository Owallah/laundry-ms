"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  UserCog,
  Package,
  CreditCard,
  BarChart3,
  Droplets,
  LogOut,
  ChevronRight,
  Settings,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn, getInitials } from "@/lib/utils";
import type { Profile } from "@/types";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  { label: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
  { label: "Customers", href: "/dashboard/customers", icon: Users },
  { label: "Staff & Shifts", href: "/dashboard/staff", icon: UserCog },
  { label: "Inventory", href: "/dashboard/inventory", icon: Package },
  { label: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/login");
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-60 flex-shrink-0 bg-[var(--color-brand-950)] flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Droplets className="w-4.5 h-4.5 text-white" />
        </div>
        <span className="font-display font-bold text-white text-lg tracking-tight">
          FreshFlow
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
          Main
        </p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    active
                      ? "active bg-white/10 text-white"
                      : "text-white/55 hover:text-white hover:bg-white/8"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 flex-shrink-0",
                      active ? "text-brand-400" : "text-white/40"
                    )}
                  />
                  {item.label}
                  {active && (
                    <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/30" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Profile + logout */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-brand-700 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {profile ? getInitials(profile.full_name) : "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {profile?.full_name || "User"}
            </p>
            <p className="text-white/40 text-xs capitalize">
              {profile?.role || "staff"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 text-white/30 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
