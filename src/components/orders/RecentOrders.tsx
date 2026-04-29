import Link from "next/link";
import { formatKES, formatDate } from "@/lib/utils";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/StatusBadge";
import type { Order } from "@/types";

export default function RecentOrders({ orders }: { orders: Order[] }) {
  if (!orders.length) {
    return (
      <div className="p-8 text-center text-[var(--color-text-tertiary)] text-sm">
        No orders yet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            {["Order", "Customer", "Weight", "Total", "Status", "Payment"].map(
              (h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide"
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              className="table-row-hover border-b border-[var(--color-border)] last:border-0"
            >
              <td className="px-5 py-3.5">
                <Link
                  href={`/dashboard/orders/${order.id}`}
                  className="text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  {order.order_number}
                </Link>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                  {formatDate(order.created_at)}
                </p>
              </td>
              <td className="px-5 py-3.5">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {(order.customer as { name: string } | undefined)?.name ?? "—"}
                </p>
              </td>
              <td className="px-5 py-3.5 text-sm text-[var(--color-text-secondary)] tabular-nums">
                {order.weight_kg} kg
              </td>
              <td className="px-5 py-3.5 text-sm font-semibold text-[var(--color-text-primary)] tabular-nums">
                {formatKES(order.total)}
              </td>
              <td className="px-5 py-3.5">
                <OrderStatusBadge status={order.status} />
              </td>
              <td className="px-5 py-3.5">
                <PaymentStatusBadge status={order.payment_status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
