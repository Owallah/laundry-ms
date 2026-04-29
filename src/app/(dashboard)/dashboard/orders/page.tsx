import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Filter, LayoutGrid } from "lucide-react";
import { formatKES, formatDate } from "@/lib/utils";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/StatusBadge";
import OrderFilters from "@/components/orders/OrderFilters";
import type { Order } from "@/types";

interface SearchParams {
  status?: string;
  payment?: string;
  q?: string;
  page?: string;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const page = parseInt(params.page ?? "1");
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("orders")
    .select(
      `*, customer:customers(name, phone), service_type:service_types(name)`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (params.status) query = query.eq("status", params.status);
  if (params.payment) query = query.eq("payment_status", params.payment);
  if (params.q) {
    query = query.ilike("order_number", `%${params.q}%`);
  }

  const { data: orders, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Orders</h1>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-0.5">
            {count ?? 0} total orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/orders/board"
            className="inline-flex items-center gap-2 px-3 py-2.5 text-sm font-medium border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-surface)] transition"
          >
            <LayoutGrid className="w-4 h-4" />
            Board
          </Link>
          <Link
            href="/dashboard/orders/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Order
          </Link>
        </div>
      </div>

      {/* Filters */}
      <OrderFilters />

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                {[
                  "Order #",
                  "Date",
                  "Customer",
                  "Service",
                  "Weight",
                  "Total",
                  "Balance Due",
                  "Status",
                  "Payment",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders && orders.length > 0 ? (
                (orders as Order[]).map((order) => (
                  <tr
                    key={order.id}
                    className="table-row-hover border-b border-[var(--color-border)] last:border-0"
                  >
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="text-sm font-semibold text-brand-600 hover:text-brand-700 font-mono"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[var(--color-text-secondary)] whitespace-nowrap">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        {(order.customer as { name: string } | undefined)?.name ?? "—"}
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        {(order.customer as { phone: string } | undefined)?.phone}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[var(--color-text-secondary)] whitespace-nowrap">
                      {(order.service_type as { name: string } | undefined)?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[var(--color-text-secondary)] tabular-nums whitespace-nowrap">
                      {order.weight_kg} kg
                    </td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-[var(--color-text-primary)] tabular-nums whitespace-nowrap">
                      {formatKES(order.total)}
                    </td>
                    <td className="px-4 py-3.5 text-sm tabular-nums whitespace-nowrap">
                      <span
                        className={
                          order.total - order.amount_paid > 0
                            ? "text-red-600 font-medium"
                            : "text-[var(--color-text-tertiary)]"
                        }
                      >
                        {formatKES(Math.max(0, order.total - order.amount_paid))}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <PaymentStatusBadge status={order.payment_status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="text-xs text-[var(--color-text-tertiary)] hover:text-brand-600 font-medium"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-12 text-center text-[var(--color-text-tertiary)] text-sm"
                  >
                    <Filter className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)]">
            <p className="text-sm text-[var(--color-text-tertiary)]">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`?page=${page - 1}`}
                  className="px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface)] transition"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`?page=${page + 1}`}
                  className="px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface)] transition"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
