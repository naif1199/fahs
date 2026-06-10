"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const colors = ["#0F5F5C", "#5C918D", "#C8B27A", "#3F7D5A", "#A33A2B", "#B9852D"];
const axis = { fontSize: 12, fill: "#6B7280" };
const tooltip = { borderRadius: 10, borderColor: "#DDE4DF", boxShadow: "0 10px 24px rgba(18,48,71,.10)", direction: "rtl" as const };

type ChartDatum = { name: string; value: number; fullName?: string };

export function DonutChart({ data, legend = false }: { data: ChartDatum[]; legend?: boolean }) {
  return (
    <div className="h-72 rounded-lg bg-soft/70 p-2">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3} stroke="transparent">
            {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          </Pie>
          {legend ? <Legend verticalAlign="bottom" height={32} iconType="circle" wrapperStyle={{ fontSize: 12 }} /> : null}
          <Tooltip contentStyle={tooltip} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarsChart({ data }: { data: ChartDatum[] }) {
  return <ChartFrame><BarChart data={data} margin={{ left: 8, right: 8, top: 12, bottom: 6 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(107,114,128,.20)" /><XAxis dataKey="name" tick={axis} tickLine={false} axisLine={false} interval={0} height={46} /><YAxis tick={axis} tickLine={false} axisLine={false} width={34} /><Tooltip contentStyle={tooltip} labelFormatter={(label, items) => items?.[0]?.payload?.fullName ?? label} /><Bar dataKey="value" radius={[8, 8, 2, 2]} fill="#0F5F5C" maxBarSize={44} /></BarChart></ChartFrame>;
}

export function HorizontalBarsChart({ data, percent = false, height }: { data: ChartDatum[]; percent?: boolean; height?: number }) {
  return <ChartFrame height={height ?? Math.max(288, data.length * 44)}><BarChart data={data} layout="vertical" margin={{ left: 12, right: 18, top: 12, bottom: 6 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(107,114,128,.20)" /><XAxis type="number" domain={percent ? [0, 100] : undefined} tick={axis} tickLine={false} axisLine={false} tickFormatter={(value) => percent ? `${value}%` : `${value}`} /><YAxis type="category" dataKey="name" tick={axis} tickLine={false} axisLine={false} width={112} /><Tooltip contentStyle={tooltip} labelFormatter={(label, items) => items?.[0]?.payload?.fullName ?? label} formatter={(value) => percent ? [`${value}%`, "القيمة"] : [value, "القيمة"]} /><Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#5C918D" maxBarSize={28} /></BarChart></ChartFrame>;
}

export function LineTrendChart({ data }: { data: ChartDatum[] }) {
  return <ChartFrame><LineChart data={data} margin={{ left: 8, right: 16, top: 16, bottom: 6 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(107,114,128,.20)" /><XAxis dataKey="name" tick={axis} tickLine={false} axisLine={false} /><YAxis tick={axis} tickLine={false} axisLine={false} width={34} domain={[0, 100]} /><Tooltip contentStyle={tooltip} /><Line type="monotone" dataKey="value" stroke="#0F5F5C" strokeWidth={3} dot={{ r: 4, fill: "#0F5F5C" }} /></LineChart></ChartFrame>;
}

function ChartFrame({ children, height = 288 }: { children: React.ReactElement; height?: number }) {
  return <div className="overflow-x-auto rounded-lg bg-soft/70 p-2" style={{ height }}><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>;
}