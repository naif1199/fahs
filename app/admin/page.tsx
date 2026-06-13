import Link from "next/link";
import { Activity, AlertTriangle, BarChart3, Building2, CheckCircle2, Clock, FileText, Link2, Percent, RefreshCw } from "lucide-react";
import { Badge, Button, Card, SecondaryButton } from "@/components/ui";
import { ActiveDonutChart, BarsChart, InteractiveAreaChart, RadarDotsChart } from "@/components/charts";
import { arDate, pct, reportStatusLabel } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type DashboardFilters = { period?: string; weekId?: string; inspectorId?: string; city?: string; facilityTypeId?: string };

export default async function InformationDashboard({ searchParams }: { searchParams: Promise<DashboardFilters> }) {
  const filters = await searchParams;
  const [tasks, links, reports, observations, auditLogs] = await Promise.all([
    prisma.inspectionTask.findMany({ include: { link: { include: { inspector: true, week: true } }, report: { include: { facility: { include: { facilityType: true } } } } } }),
    prisma.weeklyLink.findMany({ include: { inspector: true, week: true, tasks: true } }),
    prisma.report.findMany({ include: { facility: { include: { facilityType: true } }, task: { include: { link: { include: { inspector: true, week: true } } } }, responses: { include: { checklistItem: true } }, observations: true }, orderBy: { createdAt: "desc" } }),
    prisma.observation.findMany({ include: { response: { include: { checklistItem: true } }, report: { include: { task: { include: { link: true } }, facility: { include: { facilityType: true } } } } } }),
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
  const byCity = groupCount(filteredReports.map((report) => report.facility?.city ?? "غير محدد")).slice(0, 8);
  const topNonCompliant = topResponses(filteredReports).slice(0, 5);
  const complianceByType = avgByType(filteredReports).slice(0, 8);
  const latestReports = filteredReports.slice(0, 10);

  return <div className="space-y-6">
    <div className="flex justify-end"><SecondaryButton href={`/admin?${query}`} className="gap-2"><RefreshCw className="h-4 w-4" /> تحديث البيانات</SecondaryButton></div>

    <Card className="border-security/20 p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div><div className="mb-2 inline-flex items-center gap-2 rounded-full border border-security/15 bg-security/7 px-3 py-1 text-xs font-black text-security"><Link2 className="h-4 w-4" /> الإجراء الأساسي</div><h2 className="text-xl font-black text-official">توليد روابط نموذج الفاحص</h2><p className="mt-2 max-w-3xl text-sm leading-7 text-muted">أنشئ دفعة فحص، اختر الفاحصين، ثم حمّل مسودات البريد EML لإرسال روابط النماذج ورموز التحقق.</p></div>
        <div className="flex flex-wrap gap-3"><Button href="/admin/weeks" className="px-5">توليد الروابط</Button><Button href="/admin/weeks" className="bg-official hover:bg-[#005f73]">مسودات EML</Button></div>
      </div>
    </Card>

    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <Kpi icon={Link2} label="روابط نموذج نشطة" value={activeLinks} href="/admin/weeks" tone="success" />
      <Kpi icon={ClipboardIcon} label="المهام المخصصة" value={filteredTasks.length} href="/admin/weeks" />
      <Kpi icon={CheckCircle2} label="المهام المكتملة" value={completed} href="/admin/reports" tone="success" />
      <Kpi icon={Clock} label="قيد العمل" value={inProgress} href="/admin/weeks" tone="warning" />
      <Kpi icon={FileText} label="إجمالي التقارير" value={filteredReports.length} href="/admin/reports" />
      <Kpi icon={Percent} label="متوسط المطابقة" value={pct(avgCompliance)} href="/admin/reports" tone="success" />
    </div>

    <section><h2 className="mb-3 text-lg font-black text-official">ملخص اليوم</h2><div className="grid gap-4 md:grid-cols-4"><SummaryCard label="مهام تحتاج متابعة" value={late + inProgress} href="/admin/weeks" /><SummaryCard label="تقارير صدرت اليوم" value={todayReports.length} href="/admin/reports" /><SummaryCard label="روابط لم تستخدم بعد" value={unusedLinks} href="/admin/weeks" /><SummaryCard label="ملاحظات عالية الأهمية" value={highNotes} href="/admin/reports" /></div></section>

    <div className="grid gap-6 xl:grid-cols-6">
      <ChartCard title="توزيع حالات المهام" icon={BarChart3} href="/admin/weeks" className="xl:col-span-2"><ActiveDonutChart data={taskStatusData} /></ChartCard>
      <ChartCard title="التقارير حسب المدينة" icon={Building2} href="/admin/reports" className="xl:col-span-4"><InteractiveAreaChart data={emptyChart(byCity)} /></ChartCard>
      <ChartCard title="متوسط المطابقة حسب نوع المنشأة" icon={Percent} href="/admin/facility-types" className="xl:col-span-3"><RadarDotsChart data={emptyChart(complianceByType)} /></ChartCard>
      <ChartCard title="أكثر البنود غير المطابقة" icon={AlertTriangle} href="/admin/reports" className="xl:col-span-3"><BarsChart data={emptyChart(topNonCompliant)} /></ChartCard>
    </div>

    <div className="grid gap-6 xl:grid-cols-3"><Card><h2 className="mb-4 text-lg font-black text-official">تحتاج متابعة</h2><div className="grid gap-3"><Followup label="مهام متأخرة" value={late} href="/admin/weeks" tone="danger" /><Followup label="تقارير غير مكتملة" value={incompleteReports} href="/admin/reports" tone="warning" /><Followup label="روابط غير مستخدمة" value={unusedLinks} href="/admin/weeks" /><Followup label="ملاحظات عالية الأهمية" value={highNotes} href="/admin/reports" tone="danger" /><Followup label="محاولات تحقق فاشلة" value={auditLogs.length} href="/admin/audit" tone="warning" /></div></Card><Card className="xl:col-span-2"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black text-official">آخر التقارير</h2><SecondaryButton href="/admin/reports">عرض جميع التقارير</SecondaryButton></div><ReportsTable reports={latestReports} /></Card></div>

  </div>;
}

function Kpi({ icon: Icon, label, value, href, tone = "security" }: { icon: typeof Activity; label: string; value: string | number; href: string; tone?: "security" | "success" | "warning" | "danger" }) { const colors = { security: "text-security from-security/12 border-security/15", success: "text-success from-success/14 border-success/20", warning: "text-warning from-warning/16 border-warning/20", danger: "text-danger from-danger/14 border-danger/20" }; return <Link href={href} className={`app-card group relative overflow-hidden rounded-xl border bg-gradient-to-l to-white p-3.5 shadow-[0_14px_36px_rgba(0,18,25,.10)] transition hover:-translate-y-0.5 hover:border-security/30 ${colors[tone]}`}><div className="absolute inset-y-3 right-0 w-1 rounded-l-full bg-current opacity-70" /><div className="flex min-h-11 items-center justify-between gap-4 pr-3"><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-lg bg-white/70"><Icon className="h-4 w-4" /></span><div className="text-sm text-muted">{label}</div></div><div className="text-xl font-black text-official transition group-hover:text-security">{value}</div></div></Link>; }
function SummaryCard({ label, value, href }: { label: string; value: number; href: string }) { return <Card className="p-4"><div className="text-sm font-bold text-muted">{label}</div><div className="mt-2 text-2xl font-black text-official">{value}</div><Link href={href} className="mt-3 inline-flex text-sm font-bold text-security">عرض التفاصيل</Link></Card>; }
function ChartCard({ title, icon: Icon, children, href, className }: { title: string; icon: typeof Activity; children: React.ReactNode; href: string; className?: string }) { return <Link href={href} className={`block ${className ?? ""}`}><Card className="group overflow-hidden transition hover:-translate-y-0.5 hover:border-security/25"><div className="mb-4 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-security/10 text-security"><Icon className="h-5 w-5" /></span><h2 className="text-base font-black text-official">{title}</h2><span className="mr-auto text-xs text-muted opacity-0 transition group-hover:opacity-100">انتقال للتفاصيل</span></div>{children}</Card></Link>; }
function Followup({ label, value, href, tone = "security" }: { label: string; value: number; href: string; tone?: "security" | "warning" | "danger" }) { return <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-soft p-3"><div><div className="text-sm font-bold text-official">{label}</div><Badge tone={tone}>{value}</Badge></div><SecondaryButton href={href} className="min-h-9 px-3">انتقال</SecondaryButton></div>; }
function ReportsTable({ reports }: { reports: any[] }) { if (!reports.length) return <Empty />; return <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead className="bg-soft text-muted"><tr>{["رقم التقرير","اسم المنشأة","الفاحص","المدينة","المطابقة","الملاحظات","الحالة","تاريخ الاعتماد","إجراء"].map((h) => <th key={h} className="p-3 text-right">{h}</th>)}</tr></thead><tbody>{reports.map((report) => <tr key={report.id} className="border-b last:border-0"><td className="p-3 font-bold">{report.reportNumber}</td><td className="p-3">{report.facility?.name ?? "-"}</td><td className="p-3">{report.task?.link?.inspector?.name ?? "-"}</td><td className="p-3">{report.facility?.city ?? "-"}</td><td className="p-3 font-black text-security">{pct(report.complianceRate)}</td><td className="p-3">{report.notesCount}</td><td className="p-3"><Badge tone={report.status === "APPROVED" ? "success" : "warning"}>{reportStatusLabel(report.status)}</Badge></td><td className="p-3">{arDate(report.approvedAt)}</td><td className="p-3"><div className="flex gap-2"><SecondaryButton href={`/reports/${report.id}`} className="min-h-9 px-3">فتح</SecondaryButton><Button href={`/api/reports/${report.id}/pdf`} className="min-h-9 px-3">PDF</Button></div></td></tr>)}</tbody></table></div>; }
function Empty() { return <div className="rounded-lg border border-slate-200 bg-soft p-4 text-sm font-bold text-muted">لا توجد بيانات ضمن الفلاتر الحالية.</div>; }

function matchesTask(task: any, f: DashboardFilters) { if (f.inspectorId && task.link.inspectorId !== f.inspectorId) return false; if (f.weekId && task.link.weekId !== f.weekId) return false; if (f.city && task.report?.facility?.city !== f.city) return false; if (f.facilityTypeId && task.report?.facility?.facilityTypeId !== f.facilityTypeId) return false; if (f.period === "week" && !isRecent(task.createdAt, 7)) return false; if (f.period === "month" && !isRecent(task.createdAt, 31)) return false; return true; }
function matchesReport(report: any, f: DashboardFilters) { if (f.inspectorId && report.task?.link?.inspectorId !== f.inspectorId) return false; if (f.weekId && report.task?.link?.weekId !== f.weekId) return false; if (f.city && report.facility?.city !== f.city) return false; if (f.facilityTypeId && report.facility?.facilityTypeId !== f.facilityTypeId) return false; if (f.period === "week" && !isRecent(report.createdAt, 7)) return false; if (f.period === "month" && !isRecent(report.createdAt, 31)) return false; return true; }
function matchesLink(link: any, f: DashboardFilters) { if (f.inspectorId && link.inspectorId !== f.inspectorId) return false; if (f.weekId && link.weekId !== f.weekId) return false; if (f.period === "week" && !isRecent(link.createdAt, 7)) return false; if (f.period === "month" && !isRecent(link.createdAt, 31)) return false; return true; }
function topResponses(reports: any[]) { const map = new Map<string, { name: string; fullName: string; value: number }>(); reports.flatMap((report) => report.responses).filter((response) => response.evaluationStatus === "NON_COMPLIANT").forEach((response) => { const fullName = `${response.checklistItem.itemNumber} - ${response.checklistItem.requirementText}`; const name = truncate(`${response.checklistItem.itemNumber} - ${response.checklistItem.mainSection}`, 24); const current = map.get(response.checklistItemId) ?? { name, fullName, value: 0 }; current.value += 1; map.set(response.checklistItemId, current); }); return [...map.values()].sort((a, b) => b.value - a.value); }
function avgByType(reports: any[]) { const map = new Map<string, number[]>(); reports.forEach((report) => { const name = report.facility?.facilityType?.name ?? report.facility?.classification ?? "غير محدد"; map.set(name, [...(map.get(name) ?? []), report.complianceRate]); }); return [...map.entries()].map(([name, values]) => ({ name: truncate(name, 22), fullName: name, value: Math.round(avg(values)) })).sort((a, b) => b.value - a.value); }
function groupCount(items: string[]) { const map = new Map<string, number>(); items.forEach((item) => map.set(item, (map.get(item) ?? 0) + 1)); return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value); }
function emptyChart(data: any[]) { return data.length ? data : [{ name: "لا توجد بيانات", value: 0 }]; }
function cleanParams(filters: DashboardFilters) { return Object.fromEntries(Object.entries(filters).filter(([, v]) => v)); }
function avg(values: number[]) { const safe = values.filter((value) => Number.isFinite(value)); return safe.length ? safe.reduce((sum, value) => sum + value, 0) / safe.length : 0; }
function isRecent(value: Date | string, days: number) { return Date.now() - new Date(value).valueOf() <= days * 24 * 60 * 60 * 1000; }
function isToday(value?: Date | string | null) { if (!value) return false; const date = new Date(value); const now = new Date(); return date.toDateString() === now.toDateString(); }
function truncate(value: string, max: number) { return value.length > max ? `${value.slice(0, max - 1)}…` : value; }
const ClipboardIcon = FileText;
