import { createClient } from "@/lib/supabase/server";
import { formatKES, formatDate } from "@/lib/utils";
import {
  ShoppingBag,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  Package,
} from "lucide-react";
import Link from "next/link";
import RevenueChart from "@/components/analytics/RevenueChart";
import OrderStatusPie from "@/components/analytics/OrderStatusPie";
import RecentOrders from "@/components/orders/RecentOrders";
import type { Order } from "@/types";

async function getDashboardData() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [
    { data: todayPayments },
    { data: weekPayments },
    { data: monthPayments },
    { data: ordersByStatus },
    { data: recentOrders },
    { count: customerCount },
    { data: lowStockItems },
    { data: revenueTimeSeries },
  ] = await Promise.all([
    supabase
      .from("payments")
      .select("amount")
      .eq("status", "paid")
      .gte("created_at", today),
    supabase
      .from("payments")
      .select("amount")
      .eq("status", "paid")
      .gte("created_at", weekAgo),
    supabase
      .from("payments")
      .select("amount")
      .eq("status", "paid")
      .gte("created_at", monthAgo),
    supabase.from("orders").select("status"),
    supabase
      .from("orders")
      .select(`
        *,
        customer:customers(name, phone),
        service_type:service_types(name)
      `)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase
      .from("inventory_items")
      .select("id, name, current_stock, minimum_stock")
      .filter("current_stock", "lte", "minimum_stock")
      .eq("is_active", true),
    supabase
      .from("payments")
      .select("amount, method, created_at")
      .eq("status", "paid")
      .gte("created_at", weekAgo)
      .order("created_at"),
  ]);

  const todayRevenue =
    todayPayments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const weekRevenue =
    weekPayments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const monthRevenue =
    monthPayments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0;

  const statusCounts = (ordersByStatus || []).reduce(
    (acc, o) => ({ ...acc, [o.status]: (acc[o.status] || 0) + 1 }),
    {} as Record<string, number>
  );

  // Build 7-day revenue chart data
  const days: Record<string, { cash: number; mpesa: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    days[d] = { cash: 0, mpesa: 0 };
  }
  revenueTimeSeries?.forEach((p) => {
    const d = p.created_at.split("T")[0];
    if (days[d]) {
      if (p.method === "cash") days[d].cash += Number(p.amount);
      else days[d].mpesa += Number(p.amount);
    }
  });
  const chartData = Object.entries(days).map(([day, vals]) => ({
    day: formatDate(day).slice(0, 6), // "01 Jan" format
    cash: vals.cash,
    mpesa: vals.mpesa,
    total: vals.cash + vals.mpesa,
  }));

  return {
    todayRevenue,
    weekRevenue,
    monthRevenue,
    statusCounts,
    recentOrders: (recentOrders ?? []) as Order[],
    customerCount: customerCount ?? 0,
    lowStockItems: lowStockItems ?? [],
    chartData,
  };
}

export default async function DashboardPage() {
  const {
    todayRevenue,
    weekRevenue,
    monthRevenue,
    statusCounts,
    recentOrders,
    customerCount,
    lowStockItems,
    chartData,
  } = await getDashboardData();

  const stats = [
    {
      label: "Today's Revenue",
      value: formatKES(todayRevenue),
      sub: `${formatKES(weekRevenue)} this week`,
      icon: TrendingUp,
      color: "text-brand-600",
      bg: "bg-brand-50",
      delay: "0ms",
    },
    {
      label: "Active Orders",
      value:
        (statusCounts["received"] || 0) + (statusCounts["in_progress"] || 0),
      sub: `${statusCounts["ready"] || 0} ready for pickup`,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      delay: "60ms",
    },
    {
      label: "Completed Today",
      value: statusCounts["completed"] || 0,
      sub: `${formatKES(monthRevenue)} this month`,
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      delay: "120ms",
    },
    {
      label: "Total Customers",
      value: customerCount,
      sub: "Registered customers",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      delay: "180ms",
    },
  ];

  const pieData = [
    { name: "Received", value: statusCounts["received"] || 0, fill: "#3b82f6" },
    { name: "In Progress", value: statusCounts["in_progress"] || 0, fill: "#f59e0b" },
    { name: "Ready", value: statusCounts["ready"] || 0, fill: "#10b981" },
    { name: "Delivery", value: statusCounts["out_for_delivery"] || 0, fill: "#8b5cf6" },
    { name: "Completed", value: statusCounts["completed"] || 0, fill: "#94a3b8" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="card p-5 animate-fade-up"
              style={{ animationDelay: s.delay }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${s.bg} ${s.color} p-2.5 rounded-xl`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-[var(--color-text-tertiary)]" />
              </div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums">
                {s.value}
              </p>
              <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-0.5">
                {s.label}
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                {s.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-[var(--color-text-primary)]">
                Revenue (7 days)
              </h2>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                Cash vs M-Pesa breakdown
              </p>
            </div>
          </div>
          <RevenueChart data={chartData} />
        </div>
        <div className="card p-5">
          <h2 className="font-semibold text-[var(--color-text-primary)] mb-1">
            Order Status
          </h2>
          <p className="text-sm text-[var(--color-text-tertiary)] mb-4">
            Current pipeline breakdown
          </p>
          <OrderStatusPie data={pieData} />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent orders */}
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
            <h2 className="font-semibold text-[var(--color-text-primary)]">
              Recent Orders
            </h2>
            <Link
              href="/dashboard/orders"
              className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <RecentOrders orders={recentOrders} />
        </div>

        {/* Low stock + quick actions */}
        <div className="space-y-4">
          {/* Low stock alerts */}
          {lowStockItems.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold text-[var(--color-text-primary)] text-sm">
                  Low Stock Alerts
                </h3>
              </div>
              <ul className="space-y-2">
                {lowStockItems.slice(0, 5).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
                      <span className="text-[var(--color-text-secondary)]">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-amber-600 font-medium">
                      {item.current_stock} left
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard/inventory"
                className="mt-3 block text-center text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                Manage inventory →
              </Link>
            </div>
          )}

          {/* Quick actions */}
          <div className="card p-5">
            <h3 className="font-semibold text-[var(--color-text-primary)] text-sm mb-3">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link
                href="/dashboard/orders/new"
                className="flex items-center gap-3 p-3 rounded-xl bg-brand-50 hover:bg-brand-100 transition group"
              >
                <ShoppingBag className="w-4 h-4 text-brand-600" />
                <span className="text-sm font-medium text-brand-700">
                  New Order
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-brand-500 ml-auto opacity-0 group-hover:opacity-100 transition" />
              </Link>
              <Link
                href="/dashboard/customers/new"
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition group"
              >
                <Users className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">
                  New Customer
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 ml-auto opacity-0 group-hover:opacity-100 transition" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
