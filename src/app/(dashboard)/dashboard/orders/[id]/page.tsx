import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatKES, formatDateTime, formatDate } from "@/lib/utils";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/StatusBadge";
import OrderActions from "@/components/orders/OrderActions";
import PaymentPanel from "@/components/payments/PaymentPanel";
import { Scale, Calendar, User, Truck, Clock, FileText } from "lucide-react";
import type { Order, OrderStatusHistory, Payment } from "@/types";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: order }, { data: history }, { data: payments }] =
    await Promise.all([
      supabase
        .from("orders")
        .select(`
          *,
          customer:customers(*),
          service_type:service_types(*),
          assigned_staff:profiles!orders_assigned_to_fkey(full_name, role)
        `)
        .eq("id", id)
        .single(),
      supabase
        .from("order_status_history")
        .select(`*, profile:profiles(full_name)`)
        .eq("order_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("payments")
        .select("*")
        .eq("order_id", id)
        .order("created_at"),
    ]);

  if (!order) notFound();

  const o = order as Order;
  const balanceDue = Math.max(0, o.total - o.amount_paid);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-[var(--color-text-primary)] font-mono">
              {o.order_number}
            </h1>
            <OrderStatusBadge status={o.status} pulse />
            <PaymentStatusBadge status={o.payment_status} />
          </div>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
            Created {formatDateTime(o.created_at)}
          </p>
        </div>
        <OrderActions order={o} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Order details */}
          <div className="card p-5">
            <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">Order Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <Detail icon={Scale} label="Weight" value={`${o.weight_kg} kg`} />
              <Detail
                icon={FileText}
                label="Service"
                value={(o.service_type as { name: string } | undefined)?.name ?? "—"}
              />
              <Detail
                icon={Calendar}
                label="Expected Pickup"
                value={o.pickup_date ? formatDate(o.pickup_date) : "Not set"}
              />
              <Detail
                icon={Clock}
                label="Time Slot"
                value={o.pickup_time_slot ?? "Any time"}
              />
              {o.is_delivery && (
                <Detail
                  icon={Truck}
                  label="Delivery Address"
                  value={o.delivery_address ?? "—"}
                  className="col-span-2"
                />
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="card p-5">
            <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">Pricing</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-[var(--color-text-secondary)]">
                <span>
                  {o.weight_kg} kg × {formatKES(o.price_per_kg)}/kg
                </span>
                <span className="tabular-nums">{formatKES(o.subtotal)}</span>
              </div>
              {o.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span className="tabular-nums">−{formatKES(o.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-[var(--color-text-primary)] pt-2 border-t border-[var(--color-border)]">
                <span>Total</span>
                <span className="tabular-nums">{formatKES(o.total)}</span>
              </div>
              <div className="flex justify-between text-[var(--color-text-secondary)]">
                <span>Amount Paid</span>
                <span className="tabular-nums text-emerald-600 font-medium">
                  {formatKES(o.amount_paid)}
                </span>
              </div>
              {balanceDue > 0 && (
                <div className="flex justify-between font-semibold text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  <span>Balance Due</span>
                  <span className="tabular-nums">{formatKES(balanceDue)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {(o.notes || o.special_instructions) && (
            <div className="card p-5">
              <h2 className="font-semibold text-[var(--color-text-primary)] mb-3">Notes</h2>
              {o.notes && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide mb-1">
                    Internal
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{o.notes}</p>
                </div>
              )}
              {o.special_instructions && (
                <div>
                  <p className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide mb-1">
                    Special Instructions
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {o.special_instructions}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Status history */}
          <div className="card p-5">
            <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">Status History</h2>
            <ol className="relative border-l border-[var(--color-border)] ml-3 space-y-4">
              {(history as OrderStatusHistory[])?.map((h) => (
                <li key={h.id} className="ml-4">
                  <div className="absolute -left-1.5 mt-1 w-3 h-3 rounded-full bg-brand-500 border-2 border-white" />
                  <div className="flex items-center gap-2 flex-wrap">
                    <OrderStatusBadge status={h.status} />
                    <span className="text-xs text-[var(--color-text-tertiary)]">
                      {formatDateTime(h.created_at)}
                    </span>
                  </div>
                  {h.notes && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{h.notes}</p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Customer */}
          <div className="card p-5">
            <h2 className="font-semibold text-[var(--color-text-primary)] mb-3">Customer</h2>
            {o.customer ? (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--color-text-primary)] text-sm">
                      {(o.customer as { name: string }).name}
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      {(o.customer as { phone: string }).phone}
                    </p>
                  </div>
                </div>
                {(o.customer as { email?: string }).email && (
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {(o.customer as { email: string }).email}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-tertiary)]">No customer linked</p>
            )}
          </div>

          {/* Payment panel */}
          <PaymentPanel
            order={o}
            payments={(payments as Payment[]) ?? []}
          />
        </div>
      </div>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
  className = "",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
        <p className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide">
          {label}
        </p>
      </div>
      <p className="text-sm font-medium text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
}
