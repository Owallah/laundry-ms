"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { RevenueDataPoint } from "@/types";

interface Props {
  data: RevenueDataPoint[];
}

function formatK(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

export default function RevenueChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="mpesaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatK}
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
            boxShadow: "0 4px 16px 0 rgba(0,0,0,0.08)",
          }}
          formatter={(value: number, name: string) => [
            `KES ${value.toLocaleString()}`,
            name === "cash" ? "Cash" : "M-Pesa",
          ]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (value === "cash" ? "Cash" : "M-Pesa")}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Area
          type="monotone"
          dataKey="cash"
          stroke="#14b8a6"
          strokeWidth={2}
          fill="url(#cashGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#14b8a6" }}
        />
        <Area
          type="monotone"
          dataKey="mpesa"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#mpesaGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#3b82f6" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
