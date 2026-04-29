import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { formatKES, formatDate, getInitials } from "@/lib/utils";
import type { Customer } from "@/types";

interface SearchParams { q?: string; page?: string; }

export default async function CustomersPage({
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
    .from("customers")
    .select("*", { count: "exact" })
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (params.q) {
    query = query.or(`name.ilike.%${params.q}%,phone.ilike.%${params.q}%`);
  }

  const { data: customers, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Customers</h1>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-0.5">
            {count ?? 0} registered customers
          </p>
        </div>
        <Link
          href="/dashboard/customers/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Customer
        </Link>
      </div>

      {/* Search */}
      <form className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Search name or phone…"
          className="w-full pl-9 pr-4 py-2 text-sm border border-[var(--color-border)] rounded-xl focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 bg-white transition"
        />
      </form>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {customers && customers.length > 0 ? (
          (customers as Customer[]).map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/customers/${c.id}`}
              className="card p-5 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                  {getInitials(c.name)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--color-text-primary)] text-sm truncate group-hover:text-brand-600 transition-colors">
                    {c.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)] truncate">
                    {c.phone}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-[var(--color-surface)] rounded-lg p-2">
                  <p className="text-lg font-bold text-[var(--color-text-primary)]">
                    {c.total_orders}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wide">
                    Orders
                  </p>
                </div>
                <div className="bg-[var(--color-surface)] rounded-lg p-2">
                  <p className="text-sm font-bold text-brand-600 tabular-nums">
                    {formatKES(c.total_spent)}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wide">
                    Spent
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-[var(--color-text-tertiary)] mt-3 text-right">
                Since {formatDate(c.created_at)}
              </p>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-16 text-center text-[var(--color-text-tertiary)] text-sm">
            No customers found
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`?page=${p}${params.q ? `&q=${params.q}` : ""}`}
              className={`px-3 py-1.5 text-sm rounded-lg transition ${
                p === page
                  ? "bg-brand-600 text-white"
                  : "border border-[var(--color-border)] hover:bg-[var(--color-surface)]"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
