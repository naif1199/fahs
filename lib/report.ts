import { EvaluationStatus, ReportStatus, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function recalculateReport(reportId: string) {
  const responses = await prisma.inspectionResponse.findMany({ where: { reportId } });
  const compliantCount = responses.filter((r) => r.evaluationStatus === EvaluationStatus.COMPLIANT).length;
  const nonCompliantCount = responses.filter((r) => r.evaluationStatus === EvaluationStatus.NON_COMPLIANT).length;
  const total = compliantCount + nonCompliantCount;
  const complianceRate = total ? (compliantCount / total) * 100 : 0;
  const notesCount = nonCompliantCount;
  return prisma.report.update({ where: { id: reportId }, data: { compliantCount, nonCompliantCount, notesCount, complianceRate } });
}

export async function getOrCreateReport(taskId: string) {
  const existing = await prisma.report.findUnique({ where: { taskId } });
  if (existing) return existing;
  const count = await prisma.report.count();
  await prisma.inspectionTask.update({ where: { id: taskId }, data: { status: TaskStatus.IN_PROGRESS, startedAt: new Date() } });
  return prisma.report.create({ data: { taskId, reportNumber: `FAHS-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`, status: ReportStatus.IN_PROGRESS } });
}
