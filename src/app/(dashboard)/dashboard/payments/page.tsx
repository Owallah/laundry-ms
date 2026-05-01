import { createClient } from "@/lib/supabase/server";
import { formatKES, formatDateTime } from "@/lib/utils";
import { Banknote, Smartphone, TrendingUp } from "lucide-react";
import type { Payment } from "@/types";
import Link from "next/link";

interface SearchParams { page?: string; method?: string; }

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const page = parseInt(params.page ?? "1");
  const pageSize = 25;
  const offset = (page - 1) * pageSize;

  const today = new Date().toISOString().split("T")[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0];

  let query = supabase
    .from("payments")
    .select(`*, order:orders(order_number), customer:customers(name, phone)`, {
      count: "exact",
    })
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (params.method) query = query.eq("method", params.method);

  const [
    { data: payments, count },
    { data: todaySummary },
    { data: monthSummary },
  ] = await Promise.all([
    query,
    supabase
      .from("payments")
      .select("amount, method")
      .eq("status", "paid")
      .gte("created_at", today),
    supabase
      .from("payments")
      .select("amount, method")
      .eq("status", "paid")
      .gte("created_at", monthStart),
  ]);

  const todayCash = (todaySummary ?? [])
    .filter((p) => p.method === "cash")
    .reduce((s, p) => s + Number(p.amount), 0);
  const todayMpesa = (todaySummary ?? [])
    .filter((p) => p.method === "mpesa")
    .reduce((s, p) => s + Number(p.amount), 0);
  const monthTotal = (monthSummary ?? []).reduce(
    (s, p) => s + Number(p.amount),
    0
  );

  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <h1 className="text-xl font-bold text-text-primary">Payments</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="w-4 h-4 text-blue-500" />
            <p className="text-sm text-text-secondary font-medium">Today — Cash</p>
          </div>
          <p className="text-2xl font-bold text-text-primary tabular-nums">
            {formatKES(todayCash)}
          </p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="w-4 h-4 text-emerald-500" />
            <p className="text-sm text-text-secondary font-medium">Today — M-Pesa</p>
          </div>
          <p className="text-2xl font-bold text-text-primary tabular-nums">
            {formatKES(todayMpesa)}
          </p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-brand-500" />
            <p className="text-sm text-text-secondary font-medium">This Month</p>
          </div>
          <p className="text-2xl font-bold text-brand-600 tabular-nums">
            {formatKES(monthTotal)}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[
          { label: "All", value: "" },
          { label: "M-Pesa", value: "mpesa" },
          { label: "Cash", value: "cash" },
        ].map((opt) => (
          <Link
            key={opt.value}
            href={opt.value ? `?method=${opt.value}` : "/dashboard/payments"}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              (params.method ?? "") === opt.value
                ? "bg-brand-600 text-white"
                : "bg-white border border-border text-text-secondary hover:border-border-strong"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface">
                {["Date", "Order", "Customer", "Method", "Receipt", "Amount", "Notes"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments && payments.length > 0 ? (
                (payments as Payment[]).map((p) => (
                  <tr key={p.id} className="table-row-hover border-b border-border last:border-0">
                    <td className="px-4 py-3.5 text-sm text-text-secondary whitespace-nowrap">
                      {formatDateTime(p.created_at)}
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/dashboard/orders/${p.order_id}`}
                        className="text-sm font-semibold text-brand-600 hover:text-brand-700 font-mono"
                      >
                        {(p.order as { order_number: string } | undefined)?.order_number ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-text-primary">
                        {(p.customer as { name: string } | undefined)?.name ?? "—"}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {(p.customer as { phone: string } | undefined)?.phone}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {p.method === "mpesa" ? (
                          <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Banknote className="w-3.5 h-3.5 text-blue-600" />
                        )}
                        <span className="text-sm capitalize text-text-secondary">
                          {p.method === "mpesa" ? "M-Pesa" : "Cash"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-mono text-text-tertiary">
                      {p.mpesa_receipt_number ?? "—"}
                    </td>
                    <td className="px-4 py-3.5 text-sm font-bold text-emerald-600 tabular-nums">
                      {formatKES(p.amount)}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-text-tertiary max-w-40">
                      {p.notes ?? "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-text-tertiary">
                    No payments recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-text-tertiary">
              Page {page} of {totalPages} · {count} payments
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`?page=${page - 1}${params.method ? `&method=${params.method}` : ""}`}
                  className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-surface transition">
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link href={`?page=${page + 1}${params.method ? `&method=${params.method}` : ""}`}
                  className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-surface transition">
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
