import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatKES, formatDate, getInitials } from "@/lib/utils";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";
import { Phone, Mail, MapPin, ShoppingBag, Star, Plus } from "lucide-react";
import type { Customer, Order } from "@/types";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: customer }, { data: orders }] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id).single(),
    supabase
      .from("orders")
      .select(`*, service_type:service_types(name)`)
      .eq("customer_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (!customer) notFound();
  const c = customer as Customer;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {getInitials(c.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{c.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)]">
                <Phone className="w-3.5 h-3.5" /> {c.phone}
              </span>
              {c.email && (
                <span className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)]">
                  <Mail className="w-3.5 h-3.5" /> {c.email}
                </span>
              )}
              {c.address && (
                <span className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)]">
                  <MapPin className="w-3.5 h-3.5" /> {c.address}
                </span>
              )}
            </div>
          </div>
          <Link
            href={`/dashboard/orders/new?customer=${c.id}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Order
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-[var(--color-border)]">
          <Stat icon={ShoppingBag} label="Total Orders" value={String(c.total_orders)} />
          <Stat icon={Star} label="Total Spent" value={formatKES(c.total_spent)} highlight />
          <Stat icon={Star} label="Loyalty Points" value={String(c.loyalty_points)} />
        </div>
      </div>

      {/* Notes */}
      {c.notes && (
        <div className="card p-5">
          <h2 className="font-semibold text-[var(--color-text-primary)] mb-2">Notes</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">{c.notes}</p>
        </div>
      )}

      {/* Order history */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="font-semibold text-[var(--color-text-primary)]">Order History</h2>
          <span className="text-sm text-[var(--color-text-tertiary)]">
            {orders?.length ?? 0} orders
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                {["Order #", "Date", "Service", "Weight", "Total", "Status", "Payment"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders && orders.length > 0 ? (
                (orders as Order[]).map((o) => (
                  <tr key={o.id} className="table-row-hover border-b border-[var(--color-border)] last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/orders/${o.id}`} className="text-sm font-semibold text-brand-600 hover:text-brand-700 font-mono">
                        {o.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)] whitespace-nowrap">
                      {formatDate(o.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)] whitespace-nowrap">
                      {(o.service_type as { name: string } | undefined)?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)] tabular-nums">
                      {o.weight_kg} kg
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold tabular-nums">
                      {formatKES(o.total)}
                    </td>
                    <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
                    <td className="px-4 py-3"><PaymentStatusBadge status={o.payment_status} /></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-[var(--color-text-tertiary)]">
                    No orders yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, highlight }: {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="text-center">
      <div className={`text-lg font-bold tabular-nums ${highlight ? "text-brand-600" : "text-[var(--color-text-primary)]"}`}>
        {value}
      </div>
      <div className="flex items-center justify-center gap-1 mt-0.5">
        <Icon className="w-3 h-3 text-[var(--color-text-tertiary)]" />
        <span className="text-xs text-[var(--color-text-tertiary)]">{label}</span>
      </div>
    </div>
  );
}
