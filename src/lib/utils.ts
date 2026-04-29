import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import type { OrderStatus, PaymentStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Currency ──────────────────────────────────────────────
export function formatKES(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ── Dates ─────────────────────────────────────────────────
export function formatDate(date: string | Date): string {
  return format(new Date(date), "dd MMM yyyy");
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "dd MMM yyyy, HH:mm");
}

export function formatTime(date: string | Date): string {
  return format(new Date(date), "HH:mm");
}

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

// ── Order status helpers ──────────────────────────────────
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  received: "Received",
  in_progress: "In Progress",
  ready: "Ready",
  out_for_delivery: "Out for Delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_COLORS: Record<
  OrderStatus,
  { bg: string; text: string; dot: string }
> = {
  received: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  in_progress: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  ready: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  out_for_delivery: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    dot: "bg-purple-500",
  },
  completed: { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" },
  cancelled: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "received",
  "in_progress",
  "ready",
  "out_for_delivery",
  "completed",
];

export function getNextStatus(
  current: OrderStatus
): OrderStatus | null {
  const idx = ORDER_STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx === ORDER_STATUS_FLOW.length - 1) return null;
  return ORDER_STATUS_FLOW[idx + 1];
}

// ── Payment status helpers ────────────────────────────────
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Unpaid",
  partial: "Partial",
  paid: "Paid",
  refunded: "Refunded",
};

export const PAYMENT_STATUS_COLORS: Record<
  PaymentStatus,
  { bg: string; text: string }
> = {
  pending: { bg: "bg-red-50", text: "text-red-600" },
  partial: { bg: "bg-amber-50", text: "text-amber-700" },
  paid: { bg: "bg-emerald-50", text: "text-emerald-700" },
  refunded: { bg: "bg-slate-50", text: "text-slate-600" },
};

// ── Phone formatting ──────────────────────────────────────
export function formatMpesaPhone(phone: string): string {
  // Normalize to 254XXXXXXXXX format
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) return "254" + cleaned.slice(1);
  if (cleaned.startsWith("+")) return cleaned.slice(1);
  return cleaned;
}

// ── Calculations ──────────────────────────────────────────
export function calculateOrderTotal(
  weightKg: number,
  pricePerKg: number,
  discount = 0
): { subtotal: number; discount: number; total: number } {
  const subtotal = weightKg * pricePerKg;
  const discountAmount = Math.min(discount, subtotal);
  return {
    subtotal,
    discount: discountAmount,
    total: subtotal - discountAmount,
  };
}

// ── Truncate ──────────────────────────────────────────────
export function truncate(str: string, maxLength: number): string {
  return str.length > maxLength ? str.slice(0, maxLength) + "…" : str;
}

// ── Initials ──────────────────────────────────────────────
export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}
