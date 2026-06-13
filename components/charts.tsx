"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const colors = ["#0F5F5C", "#2F6F69", "#C8B27A", "#5E7F73", "#A33A2B", "#B9852D"];
const axis = { fontSize: 11, fill: "#374151" };
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
          {legend ? <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 11, color: "#374151" }} /> : null}
          <Tooltip contentStyle={tooltip} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarsChart({ data }: { data: ChartDatum[] }) {
  return <ChartFrame minWidth={Math.max(560, data.length * 92)}><BarChart data={data} margin={{ left: 10, right: 12, top: 16, bottom: 22 }}><CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(55,65,81,.16)" /><XAxis dataKey="name" tick={axis} tickLine={false} axisLine={false} interval={0} height={58} tickMargin={12} tickFormatter={shortName} /><YAxis tick={axis} tickLine={false} axisLine={false} width={40} /><Tooltip contentStyle={tooltip} labelFormatter={(label, items) => items?.[0]?.payload?.fullName ?? label} /><Bar dataKey="value" radius={[8, 8, 2, 2]} fill="#0F5F5C" maxBarSize={42} /></BarChart></ChartFrame>;
}

export function HorizontalBarsChart({ data, percent = false, height }: { data: ChartDatum[]; percent?: boolean; height?: number }) {
  return <ChartFrame height={height ?? Math.max(306, data.length * 52)} minWidth={600}><BarChart data={data} layout="vertical" margin={{ left: 16, right: 34, top: 16, bottom: 16 }}><CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="rgba(55,65,81,.14)" /><XAxis type="number" domain={percent ? [0, 100] : undefined} tick={axis} tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => percent ? `${value}%` : `${value}`} /><YAxis type="category" dataKey="name" tick={{ ...axis, textAnchor: "end" }} tickLine={false} axisLine={false} width={132} tickMargin={10} tickFormatter={shortName} /><Tooltip contentStyle={tooltip} labelFormatter={(label, items) => items?.[0]?.payload?.fullName ?? label} formatter={(value) => percent ? [`${value}%`, "القيمة"] : [value, "القيمة"]} /><Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#2F6F69" maxBarSize={26} /></BarChart></ChartFrame>;
}

export function LineTrendChart({ data }: { data: ChartDatum[] }) {
  return <ChartFrame minWidth={560}><LineChart data={data} margin={{ left: 10, right: 18, top: 18, bottom: 20 }}><CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(55,65,81,.14)" /><XAxis dataKey="name" tick={axis} tickLine={false} axisLine={false} tickMargin={10} tickFormatter={shortName} /><YAxis tick={axis} tickLine={false} axisLine={false} width={40} domain={[0, 100]} /><Tooltip contentStyle={tooltip} /><Line type="monotone" dataKey="value" stroke="#0F5F5C" strokeWidth={3} dot={{ r: 4, fill: "#0F5F5C" }} /></LineChart></ChartFrame>;
}

function ChartFrame({ children, height = 306, minWidth = 520 }: { children: React.ReactElement; height?: number; minWidth?: number }) {
  return <div className="overflow-x-auto rounded-lg bg-soft/70 p-3" style={{ height }}><div style={{ minWidth, height: "100%" }}><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div></div>;
}

function shortName(value: unknown) {
  const text = String(value ?? "");
  return text.length > 12 ? `${text.slice(0, 11)}…` : text;
}
