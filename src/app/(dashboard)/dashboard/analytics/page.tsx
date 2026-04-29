import { createClient } from "@/lib/supabase/server";
import { formatKES, formatDate } from "@/lib/utils";
import RevenueChart from "@/components/analytics/RevenueChart";
import OrderStatusPie from "@/components/analytics/OrderStatusPie";
import AnalyticsBarChart from "@/components/analytics/AnalyticsBarChart";
import { TrendingUp, ShoppingBag, Users, Star } from "lucide-react";

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [
    { data: payments30 },
    { data: payments60 },
    { data: allOrders },
    { data: topCustomers },
    { data: serviceBreakdown },
  ] = await Promise.all([
    supabase
      .from("payments")
      .select("amount, method, created_at")
      .eq("status", "paid")
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("payments")
      .select("amount")
      .eq("status", "paid")
      .gte("created_at", sixtyDaysAgo)
      .lt("created_at", thirtyDaysAgo),
    supabase
      .from("orders")
      .select("status, created_at, total, weight_kg")
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("customers")
      .select("name, total_orders, total_spent")
      .order("total_spent", { ascending: false })
      .limit(5),
    supabase
      .from("orders")
      .select(`weight_kg, total, service_type:service_types(name)`)
      .gte("created_at", thirtyDaysAgo)
      .neq("status", "cancelled"),
  ]);

  const revenue30 = (payments30 ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const revenue60 = (payments60 ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const revenueGrowth = revenue60 > 0 ? ((revenue30 - revenue60) / revenue60) * 100 : 0;

  const orders30 = (allOrders ?? []).length;
  const completedOrders = (allOrders ?? []).filter((o) => o.status === "completed").length;
  const completionRate = orders30 > 0 ? (completedOrders / orders30) * 100 : 0;
  const avgOrderValue = completedOrders > 0
    ? (allOrders ?? []).filter(o => o.status === "completed").reduce((s, o) => s + Number(o.total), 0) / completedOrders
    : 0;
  const totalWeight = (allOrders ?? []).reduce((s, o) => s + Number(o.weight_kg), 0);

  // Build 30-day chart data
  const days: Record<string, { cash: number; mpesa: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    days[d] = { cash: 0, mpesa: 0 };
  }
  (payments30 ?? []).forEach((p) => {
    const d = p.created_at.split("T")[0];
    if (days[d]) {
      if (p.method === "cash") days[d].cash += Number(p.amount);
      else days[d].mpesa += Number(p.amount);
    }
  });
  const chartData = Object.entries(days).map(([day, vals]) => ({
    day: formatDate(day).slice(0, 6),
    cash: vals.cash,
    mpesa: vals.mpesa,
    total: vals.cash + vals.mpesa,
  }));

  // Service breakdown chart
  const svcMap: Record<string, { name: string; orders: number; revenue: number }> = {};
  (serviceBreakdown ?? []).forEach((o) => {
    const name = (o.service_type as unknown as { name: string } | undefined)?.name ?? "Unknown";
    if (!svcMap[name]) svcMap[name] = { name, orders: 0, revenue: 0 };
    svcMap[name].orders += 1;
    svcMap[name].revenue += Number(o.total);
  });
  const svcData = Object.values(svcMap).sort((a, b) => b.revenue - a.revenue);

  // Status breakdown for pie
  const statusCounts: Record<string, number> = {};
  (allOrders ?? []).forEach((o) => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });
  const pieData = [
    { name: "Received", value: statusCounts["received"] || 0, fill: "#3b82f6" },
    { name: "In Progress", value: statusCounts["in_progress"] || 0, fill: "#f59e0b" },
    { name: "Ready", value: statusCounts["ready"] || 0, fill: "#10b981" },
    { name: "Delivery", value: statusCounts["out_for_delivery"] || 0, fill: "#8b5cf6" },
    { name: "Completed", value: statusCounts["completed"] || 0, fill: "#14b8a6" },
    { name: "Cancelled", value: statusCounts["cancelled"] || 0, fill: "#f87171" },
  ].filter((d) => d.value > 0);

  const kpis = [
    {
      label: "Revenue (30d)",
      value: formatKES(revenue30),
      sub: `${revenueGrowth >= 0 ? "+" : ""}${revenueGrowth.toFixed(1)}% vs prev 30d`,
      icon: TrendingUp,
      positive: revenueGrowth >= 0,
    },
    {
      label: "Orders (30d)",
      value: String(orders30),
      sub: `${completionRate.toFixed(0)}% completion rate`,
      icon: ShoppingBag,
      positive: completionRate >= 80,
    },
    {
      label: "Avg Order Value",
      value: formatKES(avgOrderValue),
      sub: `${totalWeight.toFixed(1)} kg processed`,
      icon: Star,
      positive: true,
    },
    {
      label: "Active Customers",
      value: String(topCustomers?.length ?? 0),
      sub: "Top customers below",
      icon: Users,
      positive: true,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Analytics</h1>
        <p className="text-sm text-[var(--color-text-tertiary)] mt-0.5">
          Last 30 days performance overview
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 bg-brand-50 rounded-xl">
                  <Icon className="w-5 h-5 text-brand-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums">
                {kpi.value}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{kpi.label}</p>
              <p className={`text-xs mt-1 ${kpi.positive ? "text-emerald-600" : "text-red-500"}`}>
                {kpi.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* Revenue chart */}
      <div className="card p-5">
        <h2 className="font-semibold text-[var(--color-text-primary)] mb-1">
          Daily Revenue — 30 Days
        </h2>
        <p className="text-sm text-[var(--color-text-tertiary)] mb-4">
          Cash vs M-Pesa breakdown
        </p>
        <RevenueChart data={chartData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Service breakdown */}
        <div className="card p-5">
          <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">
            Revenue by Service
          </h2>
          <AnalyticsBarChart data={svcData} />
        </div>

        {/* Order status */}
        <div className="card p-5">
          <h2 className="font-semibold text-[var(--color-text-primary)] mb-1">
            Order Status Breakdown
          </h2>
          <p className="text-sm text-[var(--color-text-tertiary)] mb-2">
            Last 30 days
          </p>
          <OrderStatusPie data={pieData} />
        </div>
      </div>

      {/* Top customers */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-border)]">
          <h2 className="font-semibold text-[var(--color-text-primary)]">Top Customers</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              {["Rank", "Customer", "Orders", "Total Spent"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(topCustomers ?? []).map((c, i) => (
              <tr key={i} className="table-row-hover border-b border-[var(--color-border)] last:border-0">
                <td className="px-5 py-3.5">
                  <span className={`text-sm font-bold ${i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-700" : "text-[var(--color-text-tertiary)]"}`}>
                    #{i + 1}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-sm font-medium text-[var(--color-text-primary)]">{c.name}</td>
                <td className="px-5 py-3.5 text-sm text-[var(--color-text-secondary)]">{c.total_orders}</td>
                <td className="px-5 py-3.5 text-sm font-bold text-brand-600 tabular-nums">
                  {formatKES(c.total_spent)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
