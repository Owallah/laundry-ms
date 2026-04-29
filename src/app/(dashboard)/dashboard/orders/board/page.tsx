import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, List } from "lucide-react";
import LiveOrdersBoard from "@/components/orders/LiveOrdersBoard";
import type { Order } from "@/types";

export default async function OrdersBoardPage() {
  const supabase = await createClient();

  const { data: activeOrders } = await supabase
    .from("orders")
    .select(`
      *,
      customer:customers(name, phone),
      service_type:service_types(name)
    `)
    .in("status", ["received", "in_progress", "ready", "out_for_delivery"])
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
            Live Orders Board
          </h1>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-0.5">
            {activeOrders?.length ?? 0} active orders — updates in real time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-surface)] transition"
          >
            <List className="w-4 h-4" />
            List view
          </Link>
          <Link
            href="/dashboard/orders/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Order
          </Link>
        </div>
      </div>

      <div className="card p-5">
        <LiveOrdersBoard initialOrders={(activeOrders as Order[]) ?? []} />
      </div>
    </div>
  );
}
