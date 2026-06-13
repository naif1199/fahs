"use client";

import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const colors = ["#0F5F5C", "#5C918D", "#C8B27A", "#3F7D5A", "#A33A2B", "#B9852D"];
const axis = { fontSize: 11, fill: "#123047" };
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
          {legend ? <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 11, color: "#123047" }} /> : null}
          <Tooltip contentStyle={tooltip} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarsChart({ data }: { data: ChartDatum[] }) {
  return <ChartFrame minWidth={Math.max(560, data.length * 92)}><BarChart data={data} margin={{ left: 10, right: 12, top: 16, bottom: 22 }}><CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(18,48,71,.12)" /><XAxis dataKey="name" tick={axis} tickLine={false} axisLine={false} interval={0} height={58} tickMargin={12} tickFormatter={shortName} /><YAxis tick={axis} tickLine={false} axisLine={false} width={40} /><Tooltip contentStyle={tooltip} labelFormatter={(label, items) => items?.[0]?.payload?.fullName ?? label} /><Bar dataKey="value" radius={[8, 8, 2, 2]} fill="#0F5F5C" maxBarSize={42} /></BarChart></ChartFrame>;
}

export function RadarDotsChart({ data }: { data: ChartDatum[] }) {
  const chartData = [...data].sort((a, b) => b.value - a.value).slice(0, 8).map((item) => ({ ...item, name: shortName(item.name) }));
  return <ChartFrame height={360} scroll={false}><RadarChart data={chartData} margin={{ left: 18, right: 18, top: 18, bottom: 18 }}><PolarGrid gridType="polygon" stroke="rgba(18,48,71,.14)" /><PolarAngleAxis dataKey="name" tick={{ ...axis, fontSize: 12 }} /><PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} /><Tooltip contentStyle={tooltip} labelFormatter={(label, items) => items?.[0]?.payload?.fullName ?? label} formatter={(value) => [`${value}%`, "جودة التوثيق"]} /><Radar dataKey="value" stroke="#0F5F5C" fill="#0F5F5C" fillOpacity={0.20} strokeWidth={3} dot={{ r: 4, fill: "#C8B27A", stroke: "#123047", strokeWidth: 1.5 }} /></RadarChart></ChartFrame>;
}

export function ActiveDonutChart({ data }: { data: ChartDatum[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const chartData = [...data].sort((a, b) => b.value - a.value).slice(0, 6);
  const active = chartData[activeIndex] ?? chartData[0];

  return <div className="h-[360px] rounded-lg bg-soft/70 p-3"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chartData} dataKey="value" nameKey="name" innerRadius={74} outerRadius={108} paddingAngle={3} stroke="#F8FAF8" strokeWidth={2} onMouseEnter={(_, index) => setActiveIndex(index)}>{chartData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} opacity={i === activeIndex ? 1 : 0.58} stroke={i === activeIndex ? "#123047" : "#F8FAF8"} strokeWidth={i === activeIndex ? 3 : 2} />)}</Pie><text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" fill="#123047" fontSize={15}>{shortName(active?.name)}</text><text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" fill="#0F5F5C" fontSize={22} fontWeight={600}>{active ? `${active.value}%` : "-"}</text><Legend verticalAlign="bottom" height={42} iconType="circle" wrapperStyle={{ fontSize: 11, color: "#123047" }} formatter={(value) => shortName(value)} /><Tooltip contentStyle={tooltip} formatter={(value) => [`${value}%`, "الإنتاجية"]} /></PieChart></ResponsiveContainer></div>;
}

export function InteractiveAreaChart({ data }: { data: ChartDatum[] }) {
  const chartData = data.map((item) => ({ ...item, name: shortName(item.name) }));
  return <ChartFrame height={360} minWidth={Math.max(680, chartData.length * 96)}><AreaChart data={chartData} margin={{ left: 10, right: 18, top: 18, bottom: 22 }}><defs><linearGradient id="reportHoursArea" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#C8B27A" stopOpacity={0.42} /><stop offset="92%" stopColor="#C8B27A" stopOpacity={0.05} /></linearGradient></defs><CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(18,48,71,.11)" /><XAxis dataKey="name" tick={axis} tickLine={false} axisLine={false} interval={0} height={58} tickMargin={12} /><YAxis tick={axis} tickLine={false} axisLine={false} width={42} tickFormatter={(value) => `${value}`} /><Tooltip contentStyle={tooltip} labelFormatter={(label, items) => items?.[0]?.payload?.fullName ?? label} formatter={(value) => [`${value} ساعة`, "متوسط الزمن"]} /><Area type="monotone" dataKey="value" stroke="#A33A2B" strokeWidth={3} fill="url(#reportHoursArea)" activeDot={{ r: 6, fill: "#C8B27A", stroke: "#123047", strokeWidth: 2 }} /></AreaChart></ChartFrame>;
}

export function HorizontalBarsChart({ data, percent = false, height }: { data: ChartDatum[]; percent?: boolean; height?: number }) {
  return <ChartFrame height={height ?? Math.max(306, data.length * 52)} minWidth={600}><BarChart data={data} layout="vertical" margin={{ left: 16, right: 34, top: 16, bottom: 16 }}><CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="rgba(18,48,71,.11)" /><XAxis type="number" domain={percent ? [0, 100] : undefined} tick={axis} tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => percent ? `${value}%` : `${value}`} /><YAxis type="category" dataKey="name" tick={{ ...axis, textAnchor: "end" }} tickLine={false} axisLine={false} width={132} tickMargin={10} tickFormatter={shortName} /><Tooltip contentStyle={tooltip} labelFormatter={(label, items) => items?.[0]?.payload?.fullName ?? label} formatter={(value) => percent ? [`${value}%`, "القيمة"] : [value, "القيمة"]} /><Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#0F5F5C" maxBarSize={26} /></BarChart></ChartFrame>;
}

export function LineTrendChart({ data }: { data: ChartDatum[] }) {
  return <ChartFrame minWidth={560}><LineChart data={data} margin={{ left: 10, right: 18, top: 18, bottom: 20 }}><CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(18,48,71,.11)" /><XAxis dataKey="name" tick={axis} tickLine={false} axisLine={false} tickMargin={10} tickFormatter={shortName} /><YAxis tick={axis} tickLine={false} axisLine={false} width={40} domain={[0, 100]} /><Tooltip contentStyle={tooltip} /><Line type="monotone" dataKey="value" stroke="#0F5F5C" strokeWidth={3} dot={{ r: 4, fill: "#0F5F5C" }} /></LineChart></ChartFrame>;
}

function ChartFrame({ children, height = 306, minWidth = 520, scroll = true }: { children: React.ReactElement; height?: number; minWidth?: number; scroll?: boolean }) {
  return <div className={`${scroll ? "overflow-x-auto" : "overflow-hidden"} rounded-lg bg-soft/70 p-3`} style={{ height }}><div style={{ minWidth: scroll ? minWidth : "100%", height: "100%" }}><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div></div>;
}

function shortName(value: unknown) {
  const text = String(value ?? "");
  return text.length > 12 ? `${text.slice(0, 11)}…` : text;
}
