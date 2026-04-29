"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataItem {
  name: string;
  orders: number;
  revenue: number;
}

export default function AnalyticsBarChart({ data }: { data: DataItem[] }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-[var(--color-text-tertiary)] text-sm">
        No data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            fontSize: "12px",
          }}
          formatter={(value: number, name: string) => [
            name === "revenue" ? `KES ${value.toLocaleString()}` : value,
            name === "revenue" ? "Revenue" : "Orders",
          ]}
        />
        <Bar dataKey="revenue" fill="#14b8a6" radius={[6, 6, 0, 0]} />
        <Bar dataKey="orders" fill="#e2e8f0" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
