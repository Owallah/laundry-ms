"use client";

import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { formatKES, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";
import { RefreshCw, Wifi } from "lucide-react";
import type { Order, OrderStatus } from "@/types";

const BOARD_STATUSES: OrderStatus[] = [
  "received",
  "in_progress",
  "ready",
  "out_for_delivery",
];

interface Props {
  initialOrders: Order[];
}

export default function LiveOrdersBoard({ initialOrders }: Props) {
  const { orders, loading, refresh } = useRealtimeOrders(initialOrders);

  const columns = BOARD_STATUSES.map((status) => ({
    status,
    label: ORDER_STATUS_LABELS[status],
    orders: orders.filter((o) => o.status === status),
    colors: ORDER_STATUS_COLORS[status],
  }));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <Wifi className="w-3.5 h-3.5" />
            Live
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] rounded-lg transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => (
          <div key={col.status} className="flex flex-col gap-2">
            {/* Column header */}
            <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${col.colors.bg}`}>
              <span className={`text-xs font-semibold ${col.colors.text}`}>
                {col.label}
              </span>
              <span className={`text-xs font-bold tabular-nums ${col.colors.text}`}>
                {col.orders.length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2 min-h-[120px]">
              {col.orders.length > 0 ? (
                col.orders.map((order) => {
                  const customer = order.customer as { name: string; phone: string } | undefined;
                  return (
                    <Link
                      key={order.id}
                      href={`/dashboard/orders/${order.id}`}
                      className="block card p-3 hover:shadow-md transition-shadow"
                    >
                      <p className="text-xs font-mono font-bold text-brand-600 mb-1">
                        {order.order_number}
                      </p>
                      <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                        {customer?.name ?? "—"}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-[var(--color-text-tertiary)]">
                          {order.weight_kg} kg
                        </span>
                        <span className="text-xs font-bold text-[var(--color-text-primary)] tabular-nums">
                          {formatKES(order.total)}
                        </span>
                      </div>
                      {order.pickup_date && (
                        <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1">
                          Pickup: {new Date(order.pickup_date).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}
                        </p>
                      )}
                    </Link>
                  );
                })
              ) : (
                <div className="flex items-center justify-center h-20 border-2 border-dashed border-[var(--color-border)] rounded-xl">
                  <p className="text-xs text-[var(--color-text-tertiary)]">Empty</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
