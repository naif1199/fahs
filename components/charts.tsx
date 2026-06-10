"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const colors = ["#0F5F5C", "#123047", "#D8C6A3", "#2E7D32", "#B42318", "#C47F17"];

export function DonutChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90} paddingAngle={3}>{data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}</Pie><Tooltip /></PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarsChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 8, right: 8 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis /><Tooltip /><Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#0F5F5C" /></BarChart>
      </ResponsiveContainer>
    </div>
  );
}
