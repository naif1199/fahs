import Link from "next/link";
import { AlertTriangle, BarChart3, FileText, LineChart, Search, Users } from "lucide-react";
import { Badge, Button, Card, SecondaryButton, inputClass } from "@/components/ui";
import { BarsChart, DonutChart, HorizontalBarsChart } from "@/components/charts";
import { arDateTime, pct, taskStatusLabel } from "@/lib/format";
import { getPerformanceContext, PerformanceFilters } from "@/lib/performance";

export default async function InspectorPerformancePage({ searchParams }: { searchParams: Promise<PerformanceFilters> }) {
  const filters = await searchParams;
  const context = await getPerformanceContext(filters);

  return <div className="space-y-6">
    <Card><form className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
      <Select name="period" label="الفترة الزمنية" value={filters.period} options={[["", "كل الفترات"], ["week", "آخر 7 أيام"], ["month", "آخر 30 يوم"]]} />
      <Select name="weekId" label="دفعة الفحص" value={filters.weekId} options={[["", "كل الدفعات"], ...context.weeks.filter((w) => w.links.length > 0).map((w) => [w.id, w.name] as [string, string])]} />
      <Field label="الشهر"><input name="month" type="month" defaultValue={filters.month ?? ""} className={inputClass} /></Field>
      <Select name="inspectorId" label="الفاحص" value={filters.inspectorId} options={[["", "كل الفاحصين"], ...context.inspectors.map((i) => [i.id, i.name] as [string, string])]} />
      <Select name="city" label="المدينة" value={filters.city} options={[["", "كل المدن"], ...context.cities.map((city) => [city, city] as [string, string])]} />
      <Select name="facilityTypeId" label="نوع المنشأة" value={filters.facilityTypeId} options={[["", "كل الأنواع"], ...context.facilityTypes.map((t) => [t.id, t.name] as [string, string])]} />
      <Select name="status" label="حالة المهمة" value={filters.status} options={[["", "كل الحالات"], ...["UNUSED", "IN_PROGRESS", "COMPLETED", "LATE", "CANCELLED"].map((s) => [s, taskStatusLabel(s)] as [string, string])]} />
      <Select name="sensitivity" label="مستوى الحساسية" value={filters.sensitivity} options={[["", "كل المستويات"], ...context.sensitivities.map((s) => [s, s] as [string, string])]} />
      <Select name="reportStatus" label="نوع التقرير" value={filters.reportStatus} options={[["", "كل التقارير"], ["APPROVED", "معتمد"], ["LOCKED", "مقفل"], ["IN_PROGRESS", "قيد العمل"], ["DRAFT", "مسودة"]]} />
      <Field label="بحث"><input name="q" defaultValue={filters.q ?? ""} className={inputClass} placeholder="اسم أو رقم فاحص" /></Field>
      <div className="flex items-end gap-2 md:col-span-2"><Button className="gap-2"><Search className="h-4 w-4" /> تطبيق الفلاتر</Button><SecondaryButton href="/admin/performance">إعادة ضبط</SecondaryButton></div>
    </form></Card>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <Kpi label="إجمالي الفاحصين النشطين" value={context.totals.activeInspectors} />
      <Kpi label="إجمالي المهام المخصصة" value={context.totals.assignedTasks} />
      <Kpi label="إجمالي المهام المكتملة" value={context.totals.completedTasks} tone="success" />
      <Kpi label="إجمالي المهام المتأخرة" value={context.totals.lateTasks} tone="danger" />
      <Kpi label="نسبة الإنجاز العامة" value={pct(context.totals.completionRate)} tone="success" />
      <Kpi label="متوسط نسبة المطابقة" value={pct(context.totals.avgCompliance)} />
      <Kpi label="متوسط الملاحظات لكل تقرير" value={context.totals.avgNotes} tone="warning" />
      <Kpi label="متوسط زمن إصدار التقرير" value={`${context.totals.avgReportIssueHours} ساعة`} />
      <Kpi label="التقارير المعتمدة" value={context.totals.approvedReports} tone="success" />
      <Kpi label="التقارير غير المكتملة" value={context.totals.incompleteReports} tone="warning" />
    </div>

    <div className="grid gap-6 xl:grid-cols-3">
      <ChartCard title="مقارنة أداء الفاحصين" icon={BarChart3}><BarsChart data={context.charts.overall} /></ChartCard>
      <ChartCard title="توزيع حالات المهام" icon={FileText}><DonutChart data={context.charts.taskStatus} /></ChartCard>
      <ChartCard title="أعلى جودة توثيق" icon={LineChart}><HorizontalBarsChart data={context.charts.documentation} percent /></ChartCard>
      <ChartCard title="أكثر الفاحصين إنجازًا" icon={Users}><HorizontalBarsChart data={context.charts.productivity} percent /></ChartCard>
      <ChartCard title="متوسط زمن إنجاز التقرير" icon={LineChart}><HorizontalBarsChart data={context.charts.reportHours} /></ChartCard>
      <Card><div className="mb-4 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-warning/10 text-warning"><AlertTriangle className="h-5 w-5" /></span><h2 className="text-base font-black text-official">تنبيهات الأداء</h2></div><div className="grid gap-2">{context.alerts.length ? context.alerts.map((alert, i) => <div key={i} className="rounded-lg border border-slate-200 bg-soft p-3"><Badge tone={alert.tone}>{alert.title}</Badge><p className="mt-2 text-sm text-muted">{alert.text}</p></div>) : <p className="text-sm text-muted">لا توجد تنبيهات أداء حاليًا.</p>}</div></Card>
    </div>

    <Card><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-black text-official">جدول أداء الفاحصين</h2><SecondaryButton href={`/admin/performance?${new URLSearchParams({ ...cleanParams(filters), sort: "overallScore", dir: filters.dir === "asc" ? "desc" : "asc" }).toString()}`}>فرز الأداء</SecondaryButton></div><div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[1500px] text-sm"><thead className="bg-soft text-muted"><tr>{["اسم الفاحص","الرقم الوظيفي","المخصصة","المكتملة","الإنجاز","المطابقة","الملاحظات","جودة التوثيق","الالتزام","الإنتاجية","الفاعلية","الأداء العام","التصنيف","آخر نشاط"].map((h) => <th key={h} className="p-3 text-right">{h}</th>)}</tr></thead><tbody>{context.rows.map((row) => <tr key={row.id} className="border-b bg-white last:border-0"><td className="p-3 font-black text-security"><Link href={`/admin/performance/${row.id}`}>{row.name}</Link></td><td className="p-3">{row.employeeNumber}</td><td className="p-3">{row.assignedTasks}</td><td className="p-3">{row.completedTasks}</td><td className="p-3">{pct(row.completionRate)}</td><td className="p-3">{pct(row.avgCompliance)}</td><td className="p-3">{row.notesCount}</td><td className="p-3">{pct(row.documentationQuality)}</td><td className="p-3">{pct(row.operationalCommitment)}</td><td className="p-3">{pct(row.productivity)}</td><td className="p-3">{pct(row.regulatoryEffectiveness)}</td><td className="p-3 font-black text-official">{row.overallScore}</td><td className="p-3"><Badge tone={row.ratingTone}>{row.rating}</Badge></td><td className="p-3">{arDateTime(row.lastActivity)}</td></tr>)}</tbody></table></div></Card>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-sm font-bold text-official">{label}</span>{children}</label>; }
function Select({ label, name, value, options }: { label: string; name: string; value?: string; options: [string, string][] }) { return <Field label={label}><select name={name} defaultValue={value ?? ""} className={inputClass}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>; }
function Kpi({ label, value, tone = "security" }: { label: string; value: string | number; tone?: "security" | "success" | "warning" | "danger" }) { const colors = { security: "text-security border-security/15 bg-security/7", success: "text-success border-success/20 bg-success/10", warning: "text-warning border-warning/20 bg-warning/10", danger: "text-danger border-danger/20 bg-danger/10" }; return <Card className="p-4"><div className="text-sm font-bold text-muted">{label}</div><div className={`mt-3 inline-flex rounded-lg border px-3 py-2 text-base font-black ${colors[tone]}`}>{value}</div></Card>; }
function ChartCard({ title, icon: Icon, children }: { title: string; icon: typeof BarChart3; children: React.ReactNode }) { return <Card><div className="mb-4 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-security/10 text-security"><Icon className="h-5 w-5" /></span><h2 className="text-base font-black text-official">{title}</h2></div>{children}</Card>; }
function cleanParams(filters: PerformanceFilters) { return Object.fromEntries(Object.entries(filters).filter(([, v]) => v)); }
