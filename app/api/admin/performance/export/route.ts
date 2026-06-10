import * as XLSX from "xlsx";
import { getPerformanceContext } from "@/lib/performance";

export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const context = await getPerformanceContext(params);
  const rows = context.rows.map((row) => ({
    "اسم الفاحص": row.name,
    "الرقم الوظيفي": row.employeeNumber,
    "المهام المخصصة": row.assignedTasks,
    "المهام المكتملة": row.completedTasks,
    "المهام قيد العمل": row.inProgressTasks,
    "المهام المتأخرة": row.lateTasks,
    "نسبة الإنجاز": row.completionRate,
    "التقارير المعتمدة": row.approvedReports,
    "متوسط المطابقة": row.avgCompliance,
    "غير مطابق مكتشف": row.nonCompliantItems,
    "الملاحظات": row.notesCount,
    "المرفقات": row.attachmentsCount,
    "متوسط زمن الفحص": row.avgInspectionHours,
    "متوسط زمن إصدار التقرير": row.avgReportIssueHours,
    "حفظ المسودات": row.draftSaves,
    "تعديلات التقرير": row.reportEdits,
    "محاولات تحقق فاشلة": row.failedVerifications,
    "جودة التوثيق": row.documentationQuality,
    "الالتزام التشغيلي": row.operationalCommitment,
    "الإنتاجية": row.productivity,
    "الفاعلية الرقابية": row.regulatoryEffectiveness,
    "مؤشر الأداء العام": row.overallScore,
    "تصنيف الأداء": row.rating,
    "آخر نشاط": row.lastActivity?.toISOString() ?? "",
  }));
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, "مؤشرات الأداء");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return new Response(buffer, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="inspector-performance.xlsx"` } });
}