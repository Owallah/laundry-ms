"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatKES, formatDateTime } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  Loader2,
  Smartphone,
  Banknote,
  CheckCircle2,
  Clock,
} from "lucide-react";
import type { Order, Payment } from "@/types";

interface Props {
  order: Order;
  payments: Payment[];
}

export default function PaymentPanel({ order, payments }: Props) {
  const router = useRouter();
  const [method, setMethod] = useState<"mpesa" | "cash">("mpesa");
  const [amount, setAmount] = useState(
    String(Math.max(0, order.total - order.amount_paid))
  );
  const [mpesaPhone, setMpesaPhone] = useState(
    (order.customer as { phone?: string } | undefined)?.phone ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);

  const balanceDue = Math.max(0, order.total - order.amount_paid);
  const isPaid = order.payment_status === "paid";

  async function handleCashPayment() {
    setLoading(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.id,
          customer_id: order.customer_id,
          amount: parseFloat(amount),
          method: "cash",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed");
      toast.success(`Cash payment of ${formatKES(parseFloat(amount))} recorded`);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleMpesaPush() {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/mpesa/stk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.id,
          customer_id: order.customer_id,
          amount: parseFloat(amount),
          phone: mpesaPhone,
          account_reference: order.order_number,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "STK push failed");
      setCheckoutId(data.checkout_request_id);
      toast.success("M-Pesa prompt sent to " + mpesaPhone);
      // Start polling for status
      pollMpesaStatus(data.checkout_request_id);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "M-Pesa push failed");
    } finally {
      setLoading(false);
    }
  }

  async function pollMpesaStatus(cid: string) {
    setPolling(true);
    const maxAttempts = 12; // 60s total
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      try {
        const res = await fetch(`/api/payments/mpesa/status?checkout_id=${cid}`);
        const data = await res.json();
        if (data.status === "paid") {
          toast.success("M-Pesa payment confirmed! ✓");
          setCheckoutId(null);
          router.refresh();
          setPolling(false);
          return;
        }
        if (data.status === "failed") {
          toast.error("M-Pesa payment failed or cancelled");
          setCheckoutId(null);
          setPolling(false);
          return;
        }
      } catch {
        // continue polling
      }
    }
    setPolling(false);
    toast.error("Payment confirmation timed out. Check M-Pesa messages.");
    setCheckoutId(null);
  }

  return (
    <div className="card p-5">
      <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">
        Payments
      </h2>

      {/* Payment history */}
      {payments.length > 0 && (
        <div className="mb-4 space-y-2">
          {payments.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between text-sm p-2.5 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]"
            >
              <div className="flex items-center gap-2">
                {p.method === "mpesa" ? (
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Banknote className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span className="text-[var(--color-text-secondary)] capitalize">
                  {p.method}
                </span>
                {p.mpesa_receipt_number && (
                  <span className="text-xs text-[var(--color-text-tertiary)] font-mono">
                    {p.mpesa_receipt_number}
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold text-emerald-600 tabular-nums">
                  {formatKES(p.amount)}
                </p>
                <p className="text-[10px] text-[var(--color-text-tertiary)]">
                  {formatDateTime(p.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isPaid ? (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl text-emerald-700 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          Fully paid — {formatKES(order.total)}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Balance due */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex justify-between items-center">
            <span className="text-sm font-medium text-amber-700">
              Balance Due
            </span>
            <span className="text-base font-bold text-amber-800 tabular-nums">
              {formatKES(balanceDue)}
            </span>
          </div>

          {/* M-Pesa polling indicator */}
          {polling && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl text-blue-700 text-sm">
              <Clock className="w-4 h-4 animate-pulse" />
              Waiting for customer to complete M-Pesa payment…
            </div>
          )}

          {!polling && (
            <>
              {/* Method tabs */}
              <div className="flex gap-1 p-1 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                {(["mpesa", "cash"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition ${
                      method === m
                        ? "bg-white shadow-sm text-[var(--color-text-primary)]"
                        : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {m === "mpesa" ? (
                      <Smartphone className="w-3.5 h-3.5" />
                    ) : (
                      <Banknote className="w-3.5 h-3.5" />
                    )}
                    {m === "mpesa" ? "M-Pesa" : "Cash"}
                  </button>
                ))}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                  Amount (KES)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-[var(--color-border)] rounded-xl focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition"
                />
              </div>

              {/* M-Pesa phone */}
              {method === "mpesa" && (
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    M-Pesa Phone Number
                  </label>
                  <input
                    type="tel"
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                    placeholder="07XXXXXXXX"
                    className="w-full px-3 py-2.5 text-sm border border-[var(--color-border)] rounded-xl focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition"
                  />
                </div>
              )}

              {/* Submit */}
              <button
                onClick={method === "mpesa" ? handleMpesaPush : handleCashPayment}
                disabled={loading || !amount}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {method === "mpesa"
                  ? `Send M-Pesa Prompt — ${formatKES(parseFloat(amount) || 0)}`
                  : `Record Cash — ${formatKES(parseFloat(amount) || 0)}`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
