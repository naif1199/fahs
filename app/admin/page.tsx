import { Card, StatCard } from "@/components/ui";
import { BarsChart, DonutChart } from "@/components/charts";
import { prisma } from "@/lib/prisma";
import { taskStatusLabel } from "@/lib/format";

export default async function AdminDashboard() {
  const [inspectors, activeWeeks, tasks, reports, observations, highResponses, byStatus, byInspector, byCity, byType] = await Promise.all([
    prisma.inspector.count(),
    prisma.inspectionWeek.count({ where: { status: "ACTIVE" } }),
    prisma.inspectionTask.count(),
    prisma.report.findMany({ include: { task: { include: { link: { include: { inspector: true } } } }, facility: { include: { facilityType: true } } } }),
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
  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-black text-official">لوحة تحكم المدير</h1><p className="mt-2 text-muted">متابعة الأداء والمؤشرات وسجل الفحص الأسبوعي.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="عدد الفاحصين" value={inspectors} /><StatCard label="الأسابيع النشطة" value={activeWeeks} tone="official" /><StatCard label="المهام المخصصة" value={tasks} /><StatCard label="المكتملة" value={completed} tone="success" /><StatCard label="قيد العمل" value={inProgress} tone="warning" />
        <StatCard label="المتأخرة" value={late} tone="danger" /><StatCard label="إجمالي التقارير" value={reports.length} /><StatCard label="متوسط المطابقة" value={`${Math.round(avg)}%`} tone="success" /><StatCard label="إجمالي الملاحظات" value={observations} tone="warning" /><StatCard label="غير مطابق عالي الأهمية" value={highResponses} tone="danger" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card><h2 className="mb-4 text-xl font-black text-official">توزيع حالات المهام</h2><DonutChart data={byStatus.map((s) => ({ name: taskStatusLabel(s.status), value: s._count }))} /></Card>
        <Card><h2 className="mb-4 text-xl font-black text-official">أداء الفاحصين</h2><BarsChart data={byInspector.map((l) => ({ name: l.inspector.name, value: l.tasks.filter((t) => t.status === "COMPLETED").length }))} /></Card>
        <Card><h2 className="mb-4 text-xl font-black text-official">التقارير حسب المدينة</h2><BarsChart data={byCity.map((c) => ({ name: c.city, value: c._count }))} /></Card>
        <Card><h2 className="mb-4 text-xl font-black text-official">التقارير حسب نوع المنشأة</h2><BarsChart data={byType.map((t) => ({ name: t.name, value: t._count.facilities }))} /></Card>
      </div>
    </div>
  );
}
