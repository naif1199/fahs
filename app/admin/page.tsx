import Link from "next/link";
import { Activity, AlertTriangle, BarChart3, Building2, CheckCircle2, Clock, Download, FileText, Link2, Percent, RefreshCw, Search, Timer, Users } from "lucide-react";
import { Badge, Button, Card, SecondaryButton, inputClass } from "@/components/ui";
import { BarsChart, DonutChart, HorizontalBarsChart } from "@/components/charts";
import { arDate, arDateTime, pct, reportStatusLabel, taskStatusLabel } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type DashboardFilters = { period?: string; weekId?: string; inspectorId?: string; city?: string; facilityTypeId?: string };

export default async function InformationDashboard({ searchParams }: { searchParams: Promise<DashboardFilters> }) {
  const filters = await searchParams;
  const [inspectors, weeks, facilityTypes, facilities, tasks, links, reports, observations, highResponses, auditLogs] = await Promise.all([
    prisma.inspector.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    prisma.inspectionWeek.findMany({ orderBy: { startsAt: "desc" } }),
    prisma.facilityType.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.facility.findMany({ select: { city: true } }),
    prisma.inspectionTask.findMany({ include: { link: { include: { inspector: true, week: true } }, report: { include: { facility: { include: { facilityType: true } } } } } }),
    prisma.weeklyLink.findMany({ include: { inspector: true, week: true, tasks: true } }),
    prisma.report.findMany({ include: { facility: { include: { facilityType: true } }, task: { include: { link: { include: { inspector: true, week: true } } } }, responses: { include: { checklistItem: true } }, observations: true }, orderBy: { createdAt: "desc" } }),
    prisma.observation.findMany({ include: { response: { include: { checklistItem: true } }, report: { include: { task: { include: { link: true } }, facility: { include: { facilityType: true } } } } } }),
    prisma.inspectionResponse.count({ where: { evaluationStatus: "NON_COMPLIANT", checklistItem: { importance: "HIGH" } } }),
    prisma.auditLog.findMany({ where: { status: "FAILED" }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  const filteredTasks = tasks.filter((task) => matchesTask(task, filters));
  const filteredReports = reports.filter((report) => matchesReport(report, filters));
  const filteredLinks = links.filter((link) => matchesLink(link, filters));
  const filteredObservations = observations.filter((observation) => matchesReport(observation.report, filters));
  const todayReports = filteredReports.filter((report) => isToday(report.approvedAt ?? report.updatedAt));
  const completed = filteredTasks.filter((task) => task.status === "COMPLETED").length;
  const inProgress = filteredTasks.filter((task) => task.status === "IN_PROGRESS").length;
  const late = filteredTasks.filter((task) => task.status === "LATE").length;
  const unusedTasks = filteredTasks.filter((task) => task.status === "UNUSED").length;
  const cancelled = filteredTasks.filter((task) => task.status === "CANCELLED").length;
  const activeLinks = filteredLinks.filter((link) => link.status === "ACTIVE").length;
  const unusedLinks = filteredLinks.filter((link) => !link.acknowledgedAt && link.tasks.every((task) => task.status === "UNUSED")).length;
  const incompleteReports = filteredReports.filter((report) => report.status === "DRAFT" || report.status === "IN_PROGRESS").length;
  const avgCompliance = avg(filteredReports.map((report) => report.complianceRate));
  const highNotes = filteredObservations.filter((observation) => observation.response.checklistItem.importance === "HIGH").length;
  const query = new URLSearchParams(cleanParams(filters)).toString();

  const taskStatusData = [
    { name: "غير مستخدمة", value: unusedTasks },
    { name: "قيد العمل", value: inProgress },
    { name: "مكتملة", value: completed },
    { name: "متأخرة", value: late },
    { name: "ملغاة", value: cancelled },
  ];
  const inspectorCompletion = inspectors.map((inspector) => {
    const inspectorTasks = filteredTasks.filter((task) => task.link.inspectorId === inspector.id);
    return { name: inspector.name, value: ratio(inspectorTasks.filter((task) => task.status === "COMPLETED").length, inspectorTasks.length) };
  }).filter((item) => item.value > 0).sort((a, b) => b.value - a.value).slice(0, 8);
  const byCity = groupCount(filteredReports.map((report) => report.facility?.city ?? "غير محدد")).slice(0, 8);
  const topNonCompliant = topResponses(filteredReports).slice(0, 5);
  const complianceByType = avgByType(filteredReports).slice(0, 8);
  const inspectorRows = inspectors.map((inspector) => buildInspectorRow(inspector, filteredTasks, filteredReports)).sort((a, b) => b.completed - a.completed).slice(0, 5);
  const latestReports = filteredReports.slice(0, 10);

  return <div className="space-y-6">
    <section className="rounded-xl border border-security/10 bg-white/85 p-5 shadow-[0_14px_36px_rgba(18,48,71,.06)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div><p className="text-sm font-bold text-security">الفاحص الذكي</p><h1 className="mt-1 text-2xl font-black text-official">لوحة المعلومات</h1><p className="mt-2 max-w-4xl text-sm leading-7 text-muted">نظرة تشغيلية شاملة على روابط الفحص، المهام، التقارير، الملاحظات، ومستوى الإنجاز.</p></div>
        <div className="flex flex-wrap gap-2"><SecondaryButton href={`/admin?${query}`} className="gap-2"><RefreshCw className="h-4 w-4" /> تحديث البيانات</SecondaryButton><Button href={`/api/admin/dashboard/export?${query}`} className="gap-2"><Download className="h-4 w-4" /> تصدير Excel</Button></div>
      </div>
      <form className="mt-5 grid gap-3 md:grid-cols-5 xl:grid-cols-7">
        <Select name="period" label="الفترة الزمنية" value={filters.period} options={[["", "كل الفترات"], ["week", "آخر 7 أيام"], ["month", "آخر 30 يوم"]]} />
        <Select name="weekId" label="الأسبوع" value={filters.weekId} options={[["", "كل الأسابيع"], ...weeks.map((week) => [week.id, week.name] as [string, string])]} />
        <Select name="inspectorId" label="الفاحص" value={filters.inspectorId} options={[["", "كل الفاحصين"], ...inspectors.map((inspector) => [inspector.id, inspector.name] as [string, string])]} />
        <Select name="city" label="المدينة" value={filters.city} options={[["", "كل المدن"], ...unique(facilities.map((facility) => facility.city)).map((city) => [city, city] as [string, string])]} />
        <Select name="facilityTypeId" label="نوع المنشأة" value={filters.facilityTypeId} options={[["", "كل الأنواع"], ...facilityTypes.map((type) => [type.id, type.name] as [string, string])]} />
        <div className="flex items-end gap-2 md:col-span-2"><Button className="gap-2"><Search className="h-4 w-4" /> تطبيق</Button><SecondaryButton href="/admin">إعادة ضبط</SecondaryButton></div>
      </form>
    </section>

    <Card className="border-security/20 p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div><div className="mb-2 inline-flex items-center gap-2 rounded-full border border-security/15 bg-security/7 px-3 py-1 text-xs font-black text-security"><Link2 className="h-4 w-4" /> الإجراء الأساسي</div><h2 className="text-xl font-black text-official">توليد روابط نموذج الفاحص</h2><p className="mt-2 max-w-3xl text-sm leading-7 text-muted">أنشئ دفعة فحص، اختر الفاحصين، ثم حمّل مسودات البريد EML لإرسال روابط النماذج ورموز التحقق.</p></div>
        <div className="flex flex-wrap gap-3"><Button href="/admin/weeks" className="px-5">توليد الروابط</Button><Button href="/admin/weeks" className="bg-official hover:bg-[#0d2538]">مسودات EML</Button></div>
      </div>
    </Card>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
      <Kpi icon={Users} label="الفاحصون النشطون" value={inspectors.length} />
      <Kpi icon={CalendarIcon} label="الأسابيع النشطة" value={weeks.filter((week) => week.status === "ACTIVE").length} />
      <Kpi icon={Link2} label="روابط نموذج نشطة" value={activeLinks} tone="success" />
      <Kpi icon={ClipboardIcon} label="المهام المخصصة" value={filteredTasks.length} />
      <Kpi icon={CheckCircle2} label="المهام المكتملة" value={completed} tone="success" />
      <Kpi icon={Clock} label="قيد العمل" value={inProgress} tone="warning" />
      <Kpi icon={AlertTriangle} label="المتأخرة" value={late} tone="danger" />
      <Kpi icon={FileText} label="إجمالي التقارير" value={filteredReports.length} />
      <Kpi icon={Percent} label="متوسط المطابقة" value={pct(avgCompliance)} tone="success" />
      <Kpi icon={Activity} label="إجمالي الملاحظات" value={filteredObservations.length} tone="warning" />
      <Kpi icon={AlertTriangle} label="غير مطابق عالي الأهمية" value={highResponses} tone="danger" />
    </div>

    <section><h2 className="mb-3 text-lg font-black text-official">ملخص اليوم</h2><div className="grid gap-4 md:grid-cols-4"><SummaryCard label="مهام تحتاج متابعة" value={late + inProgress} href="/admin/weeks" /><SummaryCard label="تقارير صدرت اليوم" value={todayReports.length} href="/admin/reports" /><SummaryCard label="روابط لم تستخدم بعد" value={unusedLinks} href="/admin/weeks" /><SummaryCard label="ملاحظات عالية الأهمية" value={highNotes} href="/admin/reports" /></div></section>

    <div className="grid gap-6 xl:grid-cols-2"><ChartCard title="توزيع حالات المهام" icon={BarChart3}><DonutChart data={taskStatusData} legend /></ChartCard><ChartCard title="الإنجاز حسب الفاحص" icon={Users}><HorizontalBarsChart data={emptyChart(inspectorCompletion)} percent /></ChartCard></div>
    <div className="grid gap-6 xl:grid-cols-3"><ChartCard title="التقارير حسب المدينة" icon={Building2}><BarsChart data={emptyChart(byCity)} /></ChartCard><ChartCard title="أكثر البنود غير المطابقة" icon={AlertTriangle}><HorizontalBarsChart data={emptyChart(topNonCompliant)} /></ChartCard><ChartCard title="متوسط المطابقة حسب نوع المنشأة" icon={Percent}><HorizontalBarsChart data={emptyChart(complianceByType)} percent height={Math.max(288, complianceByType.length * 48)} /></ChartCard></div>

    <div className="grid gap-6 xl:grid-cols-3"><Card><h2 className="mb-4 text-lg font-black text-official">تحتاج متابعة</h2><div className="grid gap-3"><Followup label="مهام متأخرة" value={late} href="/admin/weeks" tone="danger" /><Followup label="تقارير غير مكتملة" value={incompleteReports} href="/admin/reports" tone="warning" /><Followup label="روابط غير مستخدمة" value={unusedLinks} href="/admin/weeks" /><Followup label="ملاحظات عالية الأهمية" value={highNotes} href="/admin/reports" tone="danger" /><Followup label="محاولات تحقق فاشلة" value={auditLogs.length} href="/admin/audit" tone="warning" /></div></Card><Card className="xl:col-span-2"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black text-official">آخر التقارير</h2><SecondaryButton href="/admin/reports">عرض جميع التقارير</SecondaryButton></div><ReportsTable reports={latestReports} /></Card></div>

    <Card><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black text-official">أداء الفاحصين</h2><SecondaryButton href="/admin/performance">عرض مؤشرات أداء الفاحصين</SecondaryButton></div><InspectorsTable rows={inspectorRows} /></Card>
  </div>;
}

function Select({ label, name, value, options }: { label: string; name: string; value?: string; options: [string, string][] }) { return <label className="block"><span className="mb-2 block text-sm font-bold text-official">{label}</span><select name={name} defaultValue={value ?? ""} className={inputClass}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>; }
function Kpi({ icon: Icon, label, value, tone = "security" }: { icon: typeof Activity; label: string; value: string | number; tone?: "security" | "success" | "warning" | "danger" }) { const colors = { security: "text-security bg-security/7 border-security/15", success: "text-success bg-success/10 border-success/20", warning: "text-warning bg-warning/10 border-warning/20", danger: "text-danger bg-danger/10 border-danger/20" }; return <Card className="p-4 transition hover:-translate-y-0.5 hover:border-security/20"><div className="flex items-start justify-between gap-3"><div><div className="text-sm font-bold text-muted">{label}</div><div className="mt-3 text-2xl font-black text-official">{value}</div></div><span className={`grid h-10 w-10 place-items-center rounded-lg border ${colors[tone]}`}><Icon className="h-5 w-5" /></span></div></Card>; }
function SummaryCard({ label, value, href }: { label: string; value: number; href: string }) { return <Card className="p-4"><div className="text-sm font-bold text-muted">{label}</div><div className="mt-2 text-2xl font-black text-official">{value}</div><Link href={href} className="mt-3 inline-flex text-sm font-bold text-security">عرض التفاصيل</Link></Card>; }
function ChartCard({ title, icon: Icon, children }: { title: string; icon: typeof Activity; children: React.ReactNode }) { return <Card><div className="mb-4 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-security/10 text-security"><Icon className="h-5 w-5" /></span><h2 className="text-base font-black text-official">{title}</h2></div>{children}</Card>; }
function Followup({ label, value, href, tone = "security" }: { label: string; value: number; href: string; tone?: "security" | "warning" | "danger" }) { return <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-soft p-3"><div><div className="text-sm font-bold text-official">{label}</div><Badge tone={tone}>{value}</Badge></div><SecondaryButton href={href} className="min-h-9 px-3">انتقال</SecondaryButton></div>; }
function ReportsTable({ reports }: { reports: any[] }) { if (!reports.length) return <Empty />; return <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead className="bg-soft text-muted"><tr>{["رقم التقرير","اسم المنشأة","الفاحص","المدينة","المطابقة","الملاحظات","الحالة","تاريخ الاعتماد","إجراء"].map((h) => <th key={h} className="p-3 text-right">{h}</th>)}</tr></thead><tbody>{reports.map((report) => <tr key={report.id} className="border-b last:border-0"><td className="p-3 font-bold">{report.reportNumber}</td><td className="p-3">{report.facility?.name ?? "-"}</td><td className="p-3">{report.task?.link?.inspector?.name ?? "-"}</td><td className="p-3">{report.facility?.city ?? "-"}</td><td className="p-3 font-black text-security">{pct(report.complianceRate)}</td><td className="p-3">{report.notesCount}</td><td className="p-3"><Badge tone={report.status === "APPROVED" ? "success" : "warning"}>{reportStatusLabel(report.status)}</Badge></td><td className="p-3">{arDate(report.approvedAt)}</td><td className="p-3"><div className="flex gap-2"><SecondaryButton href={`/reports/${report.id}`} className="min-h-9 px-3">فتح</SecondaryButton><Button href={`/api/reports/${report.id}/pdf`} className="min-h-9 px-3">PDF</Button></div></td></tr>)}</tbody></table></div>; }
function InspectorsTable({ rows }: { rows: any[] }) { if (!rows.length) return <Empty />; return <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-sm"><thead className="bg-soft text-muted"><tr>{["اسم الفاحص","المهام المكتملة","نسبة الإنجاز","متوسط المطابقة","عدد الملاحظات","آخر نشاط"].map((h) => <th key={h} className="p-3 text-right">{h}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b last:border-0"><td className="p-3 font-black text-security">{row.name}</td><td className="p-3">{row.completed}</td><td className="p-3">{pct(row.completionRate)}</td><td className="p-3">{pct(row.avgCompliance)}</td><td className="p-3">{row.notes}</td><td className="p-3">{arDateTime(row.lastActivity)}</td></tr>)}</tbody></table></div>; }
function Empty() { return <div className="rounded-lg border border-slate-200 bg-soft p-4 text-sm font-bold text-muted">لا توجد بيانات ضمن الفلاتر الحالية.</div>; }

function buildInspectorRow(inspector: any, tasks: any[], reports: any[]) { const t = tasks.filter((task) => task.link.inspectorId === inspector.id); const r = reports.filter((report) => report.task?.link?.inspectorId === inspector.id); return { id: inspector.id, name: inspector.name, completed: t.filter((task) => task.status === "COMPLETED").length, completionRate: ratio(t.filter((task) => task.status === "COMPLETED").length, t.length), avgCompliance: avg(r.map((report) => report.complianceRate)), notes: r.reduce((sum, report) => sum + report.notesCount, 0), lastActivity: latestDate([...t.map((task) => task.updatedAt), ...r.map((report) => report.updatedAt)]) }; }
function matchesTask(task: any, f: DashboardFilters) { if (f.inspectorId && task.link.inspectorId !== f.inspectorId) return false; if (f.weekId && task.link.weekId !== f.weekId) return false; if (f.city && task.report?.facility?.city !== f.city) return false; if (f.facilityTypeId && task.report?.facility?.facilityTypeId !== f.facilityTypeId) return false; if (f.period === "week" && !isRecent(task.createdAt, 7)) return false; if (f.period === "month" && !isRecent(task.createdAt, 31)) return false; return true; }
function matchesReport(report: any, f: DashboardFilters) { if (f.inspectorId && report.task?.link?.inspectorId !== f.inspectorId) return false; if (f.weekId && report.task?.link?.weekId !== f.weekId) return false; if (f.city && report.facility?.city !== f.city) return false; if (f.facilityTypeId && report.facility?.facilityTypeId !== f.facilityTypeId) return false; if (f.period === "week" && !isRecent(report.createdAt, 7)) return false; if (f.period === "month" && !isRecent(report.createdAt, 31)) return false; return true; }
function matchesLink(link: any, f: DashboardFilters) { if (f.inspectorId && link.inspectorId !== f.inspectorId) return false; if (f.weekId && link.weekId !== f.weekId) return false; if (f.period === "week" && !isRecent(link.createdAt, 7)) return false; if (f.period === "month" && !isRecent(link.createdAt, 31)) return false; return true; }
function topResponses(reports: any[]) { const map = new Map<string, { name: string; fullName: string; value: number }>(); reports.flatMap((report) => report.responses).filter((response) => response.evaluationStatus === "NON_COMPLIANT").forEach((response) => { const fullName = `${response.checklistItem.itemNumber} - ${response.checklistItem.requirementText}`; const name = truncate(`${response.checklistItem.itemNumber} - ${response.checklistItem.mainSection}`, 24); const current = map.get(response.checklistItemId) ?? { name, fullName, value: 0 }; current.value += 1; map.set(response.checklistItemId, current); }); return [...map.values()].sort((a, b) => b.value - a.value); }
function avgByType(reports: any[]) { const map = new Map<string, number[]>(); reports.forEach((report) => { const name = report.facility?.facilityType?.name ?? report.facility?.classification ?? "غير محدد"; map.set(name, [...(map.get(name) ?? []), report.complianceRate]); }); return [...map.entries()].map(([name, values]) => ({ name: truncate(name, 22), fullName: name, value: Math.round(avg(values)) })).sort((a, b) => b.value - a.value); }
function groupCount(items: string[]) { const map = new Map<string, number>(); items.forEach((item) => map.set(item, (map.get(item) ?? 0) + 1)); return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value); }
function emptyChart(data: any[]) { return data.length ? data : [{ name: "لا توجد بيانات", value: 0 }]; }
function cleanParams(filters: DashboardFilters) { return Object.fromEntries(Object.entries(filters).filter(([, v]) => v)); }
function unique<T>(items: T[]) { return [...new Set(items.filter(Boolean))]; }
function avg(values: number[]) { const safe = values.filter((value) => Number.isFinite(value)); return safe.length ? safe.reduce((sum, value) => sum + value, 0) / safe.length : 0; }
function ratio(part: number, total: number) { return total ? Math.round((part / total) * 100) : 0; }
function isRecent(value: Date | string, days: number) { return Date.now() - new Date(value).valueOf() <= days * 24 * 60 * 60 * 1000; }
function isToday(value?: Date | string | null) { if (!value) return false; const date = new Date(value); const now = new Date(); return date.toDateString() === now.toDateString(); }
function latestDate(values: any[]) { const dates = values.filter(Boolean).map((value) => new Date(value)).filter((date) => !Number.isNaN(date.valueOf())); return dates.length ? new Date(Math.max(...dates.map((date) => date.valueOf()))) : null; }
function truncate(value: string, max: number) { return value.length > max ? `${value.slice(0, max - 1)}…` : value; }
const CalendarIcon = Timer;
const ClipboardIcon = FileText;