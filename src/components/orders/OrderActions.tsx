"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  getNextStatus,
  ORDER_STATUS_LABELS,
  formatKES,
  formatDate,
} from "@/lib/utils";
import toast from "react-hot-toast";
import {
  ChevronRight,
  Loader2,
  Printer,
  XCircle,
} from "lucide-react";
import type { Order, OrderStatus } from "@/types";

export default function OrderActions({ order }: { order: Order }) {
  const router = useRouter();
  const supabase = createClient();
  const [advancing, setAdvancing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const nextStatus = getNextStatus(order.status);
  const canCancel =
    order.status !== "completed" && order.status !== "cancelled";

  async function advanceStatus() {
    if (!nextStatus) return;
    setAdvancing(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: nextStatus })
        .eq("id", order.id);
      if (error) throw error;
      toast.success(`Status updated to "${ORDER_STATUS_LABELS[nextStatus]}"`);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setAdvancing(false);
    }
  }

  async function cancelOrder() {
    if (!confirm("Cancel this order? This cannot be undone.")) return;
    setCancelling(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled" as OrderStatus })
        .eq("id", order.id);
      if (error) throw error;
      toast.success("Order cancelled");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  }

  function printReceipt() {
    const customer = order.customer as { name: string; phone: string } | undefined;
    const serviceType = order.service_type as { name: string } | undefined;

    // Pop-up guard — browsers may block window.open silently
    const win = window.open("", "_blank", "width=420,height=650");
    if (!win) {
      toast.error("Pop-up blocked. Please allow pop-ups for this site and try again.");
      return;
    }

    // Coerce Supabase NUMERIC strings to actual numbers
    const subtotal    = Number(order.subtotal);
    const discount    = Number(order.discount);
    const total       = Number(order.total);
    const amountPaid  = Number(order.amount_paid);
    const balanceDue  = Math.max(0, total - amountPaid);
    const pricePerKg  = Number(order.price_per_kg);
    const weightKg    = Number(order.weight_kg);

    const fmt = (n: number) => n.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt – ${order.order_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; font-size: 12px; padding: 20px; width: 300px; color: #000; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .line { border-top: 1px dashed #000; margin: 8px 0; }
    .row { display: flex; justify-content: space-between; margin: 3px 0; }
    h1 { font-size: 20px; margin-bottom: 2px; font-family: Arial, sans-serif; }
    h2 { font-size: 12px; font-weight: normal; margin-bottom: 2px; }
    @media print {
      body { margin: 0; padding: 10px; }
    }
  </style>
</head>
<body>
  <div class="center">
    <h1>FreshFlow</h1>
    <h2>Laundry Management</h2>
    <p>Tel: +254 700 000 000</p>
  </div>
  <div class="line"></div>
  <div class="row"><span class="bold">Order #</span><span>${order.order_number}</span></div>
  <div class="row"><span class="bold">Date</span><span>${formatDate(order.created_at)}</span></div>
  <div class="row"><span class="bold">Customer</span><span>${customer?.name ?? "—"}</span></div>
  <div class="row"><span class="bold">Phone</span><span>${customer?.phone ?? "—"}</span></div>
  <div class="line"></div>
  <div class="row"><span class="bold">Service</span><span>${serviceType?.name ?? "Laundry"}</span></div>
  <div class="row"><span>${weightKg} kg × KES ${fmt(pricePerKg)}</span><span>KES ${fmt(subtotal)}</span></div>
  ${discount > 0 ? `<div class="row"><span>Discount</span><span>-KES ${fmt(discount)}</span></div>` : ""}
  <div class="line"></div>
  <div class="row bold"><span>TOTAL</span><span>KES ${fmt(total)}</span></div>
  <div class="row"><span>Paid</span><span>KES ${fmt(amountPaid)}</span></div>
  <div class="row bold" style="color:${balanceDue > 0 ? "#c00" : "#000"}"><span>Balance Due</span><span>KES ${fmt(balanceDue)}</span></div>
  <div class="line"></div>
  ${order.pickup_date ? `<div class="row"><span class="bold">Pickup Date</span><span>${formatDate(order.pickup_date)}</span></div>` : ""}
  ${order.pickup_time_slot ? `<div class="row"><span class="bold">Time Slot</span><span>${order.pickup_time_slot}</span></div>` : ""}
  <div class="line"></div>
  <div class="center">
    <p>Thank you for choosing FreshFlow!</p>
    <p>Keep this receipt for pickup.</p>
  </div>
</body>
</html>`;

    // Write content then wait for onload before printing
    // This prevents the blank-print race condition
    win.document.open();
    win.document.write(html);
    win.document.close();

    // onload fires once the document is fully parsed and rendered
    win.onload = () => {
      win.focus();
      win.print();
    };
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Print receipt */}
      <button
        onClick={printReceipt}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-border rounded-xl hover:bg-surface transition"
      >
        <Printer className="w-4 h-4" />
        Receipt
      </button>

      {/* Cancel */}
      {canCancel && order.status !== "completed" && (
        <button
          onClick={cancelOrder}
          disabled={cancelling}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition disabled:opacity-50"
        >
          {cancelling ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          Cancel
        </button>
      )}

      {/* Advance status */}
      {nextStatus && (
        <button
          onClick={advanceStatus}
          disabled={advancing}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition shadow-sm disabled:opacity-50"
        >
          {advancing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          Mark as {ORDER_STATUS_LABELS[nextStatus]}
        </button>
      )}
    </div>
  );
}
