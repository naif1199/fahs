"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const colors = ["#0F5F5C", "#5C918D", "#C8B27A", "#3F7D5A", "#A33A2B", "#B9852D"];
const axis = { fontSize: 12, fill: "#6B7280" };

export function DonutChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="h-72 rounded-lg bg-soft/70 p-2">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={3} stroke="transparent">
            {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 10, borderColor: "#DDE4DF", boxShadow: "0 10px 24px rgba(18,48,71,.10)", direction: "rtl" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarsChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="h-72 rounded-lg bg-soft/70 p-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 8, right: 8, top: 12, bottom: 6 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(107,114,128,.20)" />
          <XAxis dataKey="name" tick={axis} tickLine={false} axisLine={false} interval={0} height={46} />
          <YAxis tick={axis} tickLine={false} axisLine={false} width={34} />
          <Tooltip contentStyle={{ borderRadius: 10, borderColor: "#DDE4DF", boxShadow: "0 10px 24px rgba(18,48,71,.10)", direction: "rtl" }} />
          <Bar dataKey="value" radius={[8, 8, 2, 2]} fill="#0F5F5C" maxBarSize={44} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}