import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [inspectors, tasks, reports, observations] = await Promise.all([
    prisma.inspector.count({ where: { status: "ACTIVE" } }),
    prisma.inspectionTask.findMany(),
    prisma.report.findMany(),
    prisma.observation.count(),
  ]);
  const completed = tasks.filter((task) => task.status === "COMPLETED").length;
  const inProgress = tasks.filter((task) => task.status === "IN_PROGRESS").length;
  const late = tasks.filter((task) => task.status === "LATE").length;
  const avgCompliance = reports.length ? Math.round(reports.reduce((sum, report) => sum + report.complianceRate, 0) / reports.length) : 0;
  const rows = [
    { "المؤشر": "الفاحصون النشطون", "القيمة": inspectors },
    { "المؤشر": "المهام المخصصة", "القيمة": tasks.length },
    { "المؤشر": "المهام المكتملة", "القيمة": completed },
    { "المؤشر": "قيد العمل", "القيمة": inProgress },
    { "المؤشر": "المتأخرة", "القيمة": late },
    { "المؤشر": "إجمالي التقارير", "القيمة": reports.length },
    { "المؤشر": "متوسط المطابقة", "القيمة": `${avgCompliance}%` },
    { "المؤشر": "إجمالي الملاحظات", "القيمة": observations },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "لوحة المعلومات");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return new Response(buffer, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": 'attachment; filename="dashboard-summary.xlsx"' } });
}