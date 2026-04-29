"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface PieDataItem {
  name: string;
  value: number;
  fill: string;
}

interface Props {
  data: PieDataItem[];
}

export default function OrderStatusPie({ data }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-[var(--color-text-tertiary)] text-sm">
        No orders yet
      </div>
    );
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.fill} strokeWidth={0} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              fontSize: "12px",
            }}
            formatter={(value: number) => [value, ""]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11 }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Centre label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: -10 }}>
        <span className="text-2xl font-bold text-[var(--color-text-primary)]">
          {total}
        </span>
        <span className="text-xs text-[var(--color-text-tertiary)]">total</span>
      </div>
    </div>
  );
}
