import { Activity, AlertTriangle, CheckCircle2, ClipboardList, FileText, Link2, Mail, Percent, Timer, Users } from "lucide-react";
import { Button, Card, StatCard } from "@/components/ui";
import { BarsChart, DonutChart } from "@/components/charts";
import { prisma } from "@/lib/prisma";
import { taskStatusLabel } from "@/lib/format";

export default async function AdminDashboard() {
  const [inspectors, activeWeeks, tasks, reports, observations, highResponses, activeLinks, byStatus, byInspector, byCity, byType] = await Promise.all([
    prisma.inspector.count(),
    prisma.inspectionWeek.count({ where: { status: "ACTIVE" } }),
    prisma.inspectionTask.count(),
    prisma.report.findMany({ include: { task: { include: { link: { include: { inspector: true } } } }, facility: { include: { facilityType: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.observation.count(),
    prisma.inspectionResponse.count({ where: { evaluationStatus: "NON_COMPLIANT", checklistItem: { importance: "HIGH" } } }),
    prisma.weeklyLink.count({ where: { status: "ACTIVE" } }),
    prisma.inspectionTask.groupBy({ by: ["status"], _count: true }),
    prisma.weeklyLink.findMany({ include: { inspector: true, tasks: true } }),
    prisma.facility.groupBy({ by: ["city"], _count: true }),
    prisma.facilityType.findMany({ include: { _count: { select: { facilities: true } } } })
  ]);
  const completed = await prisma.inspectionTask.count({ where: { status: "COMPLETED" } });
  const inProgress = await prisma.inspectionTask.count({ where: { status: "IN_PROGRESS" } });
  const late = await prisma.inspectionTask.count({ where: { status: "LATE" } });
  const avg = reports.length ? reports.reduce((sum, r) => sum + r.complianceRate, 0) / reports.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-security/10 bg-white/80 p-5 shadow-[0_14px_36px_rgba(18,48,71,.06)] md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold text-security">الفاحص الذكي</p>
          <h1 className="mt-1 text-2xl font-black text-official">لوحة تحكم المدير</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">ابدأ من توليد روابط نموذج الفاحص، ثم تابع المهام والتقارير الناتجة عن تعبئة النموذج.</p>
        </div>
        <div className="grid min-w-64 grid-cols-2 gap-2 text-sm">
          <Mini label="روابط نشطة" value={activeLinks} icon={Link2} />
          <Mini label="التقارير" value={reports.length} icon={FileText} />
        </div>
      </div>

      <Card className="border-security/20 bg-gradient-to-l from-security/8 to-white p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-security/15 bg-white px-3 py-1 text-xs font-black text-security"><Link2 className="h-4 w-4" /> الإجراء الأساسي</div>
            <h2 className="text-xl font-black text-official">توليد روابط نموذج الفاحص وإرسالها</h2>
            <p className="mt-2 text-sm leading-7 text-muted">هذا هو مدخل عملية الفحص: اختر أسبوع الفحص والفاحصين، يصدر النظام رابطًا خاصًا لكل فاحص مع رمز تحقق، ثم حمّل مسودة بريد EML جاهزة للإرسال.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[460px]">
            <Step icon={Link2} label="إصدار الروابط" />
            <Step icon={Mail} label="تنزيل EML" />
            <Step icon={CheckCircle2} label="استلام التقرير" />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button href="/admin/weeks" className="px-5">توليد روابط نموذج الفاحص</Button>
          <Button href="/admin/inspectors" className="bg-official hover:bg-[#0d2538]">إدارة الفاحصين</Button>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="عدد الفاحصين" value={inspectors} />
        <StatCard label="الأسابيع النشطة" value={activeWeeks} tone="official" />
        <StatCard label="روابط نموذج نشطة" value={activeLinks} tone="success" />
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

function Step({ label, icon: Icon }: { label: string; icon: typeof Link2 }) {
  return <div className="rounded-lg border border-security/10 bg-white p-3 text-center"><Icon className="mx-auto mb-2 h-5 w-5 text-security" /><div className="text-sm font-black text-official">{label}</div></div>;
}

function ChartCard({ title, icon: Icon, children }: { title: string; icon: typeof AlertTriangle; children: React.ReactNode }) {
  return <Card><div className="mb-4 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-security/10 text-security"><Icon className="h-5 w-5" /></span><h2 className="text-base font-black text-official">{title}</h2></div>{children}</Card>;
}