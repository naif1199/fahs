import { Activity, AlertTriangle, CheckCircle2, ClipboardList, FileText, Percent, Timer, Users } from "lucide-react";
import { Button, Card, StatCard } from "@/components/ui";
import { BarsChart, DonutChart } from "@/components/charts";
import { prisma } from "@/lib/prisma";
import { taskStatusLabel } from "@/lib/format";

export default async function AdminDashboard() {
  const [inspectors, activeWeeks, tasks, reports, observations, highResponses, byStatus, byInspector, byCity, byType] = await Promise.all([
    prisma.inspector.count(),
    prisma.inspectionWeek.count({ where: { status: "ACTIVE" } }),
    prisma.inspectionTask.count(),
    prisma.report.findMany({ include: { task: { include: { link: { include: { inspector: true } } } }, facility: { include: { facilityType: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.observation.count(),
    prisma.inspectionResponse.count({ where: { evaluationStatus: "NON_COMPLIANT", checklistItem: { importance: "HIGH" } } }),
    prisma.inspectionTask.groupBy({ by: ["status"], _count: true }),
    prisma.weeklyLink.findMany({ include: { inspector: true, tasks: true } }),
    prisma.facility.groupBy({ by: ["city"], _count: true }),
    prisma.facilityType.findMany({ include: { _count: { select: { facilities: true } } } })
  ]);
  const completed = await prisma.inspectionTask.count({ where: { status: "COMPLETED" } });
  const inProgress = await prisma.inspectionTask.count({ where: { status: "IN_PROGRESS" } });
  const late = await prisma.inspectionTask.count({ where: { status: "LATE" } });
  const avg = reports.length ? reports.reduce((sum, r) => sum + r.complianceRate, 0) / reports.length : 0;
  const latestReport = reports[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-security/10 bg-white/80 p-5 shadow-[0_14px_36px_rgba(18,48,71,.06)] md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold text-security">الفاحص الذكي</p>
          <h1 className="mt-1 text-2xl font-black text-official">لوحة تحكم المدير</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">متابعة أداء الفاحصين، حالة المهام، تقارير المطابقة، والملاحظات عالية الأهمية من شاشة تشغيلية واحدة.</p>
        </div>
        <div className="grid min-w-64 grid-cols-2 gap-2 text-sm">
          <Mini label="التقارير" value={reports.length} icon={FileText} />
          <Mini label="المطابقة" value={`${Math.round(avg)}%`} icon={Percent} />
        </div>
      </div>

      <Card className="border-security/15 bg-gradient-to-l from-security/5 to-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-security">الأمر الرئيسي</p>
            <h2 className="mt-1 text-lg font-black text-official">توليد رابط تقرير الفاحص</h2>
            <p className="mt-2 text-sm leading-7 text-muted">افتح صفحة التقارير لاختيار التقرير المطلوب، ثم استخدم رابط التقرير الرسمي أو تصدير PDF مباشرة.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href="/admin/reports">إدارة روابط التقارير</Button>
            {latestReport ? <Button href={`/reports/${latestReport.id}`}>فتح آخر تقرير</Button> : null}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="عدد الفاحصين" value={inspectors} />
        <StatCard label="الأسابيع النشطة" value={activeWeeks} tone="official" />
        <StatCard label="المهام المخصصة" value={tasks} />
        <StatCard label="المكتملة" value={completed} tone="success" />
        <StatCard label="قيد العمل" value={inProgress} tone="warning" />
        <StatCard label="المتأخرة" value={late} tone="danger" />
        <StatCard label="إجمالي التقارير" value={reports.length} />
        <StatCard label="متوسط المطابقة" value={`${Math.round(avg)}%`} tone="success" />
        <StatCard label="إجمالي الملاحظات" value={observations} tone="warning" />
        <StatCard label="غير مطابق عالي الأهمية" value={highResponses} tone="danger" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="توزيع حالات المهام" icon={ClipboardList}><DonutChart data={byStatus.map((s) => ({ name: taskStatusLabel(s.status), value: s._count }))} /></ChartCard>
        <ChartCard title="أداء الفاحصين" icon={Users}><BarsChart data={byInspector.map((l) => ({ name: l.inspector.name, value: l.tasks.filter((t) => t.status === "COMPLETED").length }))} /></ChartCard>
        <ChartCard title="التقارير حسب المدينة" icon={Activity}><BarsChart data={byCity.map((c) => ({ name: c.city, value: c._count }))} /></ChartCard>
        <ChartCard title="التقارير حسب نوع المنشأة" icon={CheckCircle2}><BarsChart data={byType.map((t) => ({ name: t.name, value: t._count.facilities }))} /></ChartCard>
      </div>
    </div>
  );
}

function Mini({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Timer }) {
  return <div className="rounded-lg border border-security/10 bg-soft p-3"><Icon className="mb-2 h-4 w-4 text-security" /><div className="text-xs text-muted">{label}</div><div className="text-base font-black text-official">{value}</div></div>;
}

function ChartCard({ title, icon: Icon, children }: { title: string; icon: typeof AlertTriangle; children: React.ReactNode }) {
  return <Card><div className="mb-4 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-security/10 text-security"><Icon className="h-5 w-5" /></span><h2 className="text-base font-black text-official">{title}</h2></div>{children}</Card>;
}