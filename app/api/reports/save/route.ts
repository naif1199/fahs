import { EvaluationStatus, ReportStatus, TaskStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { recalculateReport } from "@/lib/report";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const report = await prisma.report.findUnique({ where: { id: body.reportId }, include: { task: { include: { link: { include: { inspector: true } } } } } });
  if (!report || report.status === ReportStatus.APPROVED || report.status === ReportStatus.LOCKED) return Response.json({ ok: false, error: "التقرير مقفل ولا يمكن تعديله" }, { status: 400 });
  const f = body.facility ?? {};
  const facility = await prisma.facility.upsert({
    where: { id: report.facilityId ?? "__none__" },
    update: { name: f.name, location: f.location, city: f.city, district: f.district, classification: f.classification, securitySensitivity: f.securitySensitivity, representativeName: f.representativeName, contactNumber: f.contactNumber, visitDate: new Date(f.visitDate), startedAt: f.startedAt, endedAt: f.endedAt, generalNotes: f.generalNotes || null, facilityTypeId: f.facilityTypeId },
    create: { name: f.name, location: f.location, city: f.city, district: f.district, classification: f.classification, securitySensitivity: f.securitySensitivity, representativeName: f.representativeName, contactNumber: f.contactNumber, visitDate: new Date(f.visitDate), startedAt: f.startedAt, endedAt: f.endedAt, generalNotes: f.generalNotes || null, facilityTypeId: f.facilityTypeId }
  });
  await prisma.report.update({ where: { id: report.id }, data: { facilityId: facility.id, status: body.approve ? ReportStatus.APPROVED : ReportStatus.IN_PROGRESS, approvedAt: body.approve ? new Date() : null } });
  for (const r of body.responses ?? []) {
    const response = await prisma.inspectionResponse.upsert({
      where: { reportId_checklistItemId: { reportId: report.id, checklistItemId: r.checklistItemId } },
      update: { evaluationStatus: r.status as EvaluationStatus, inspectorNote: r.note || null, correctiveAction: r.correctiveAction || null },
      create: { reportId: report.id, checklistItemId: r.checklistItemId, evaluationStatus: r.status as EvaluationStatus, inspectorNote: r.note || null, correctiveAction: r.correctiveAction || null }
    });
    if (r.status === "NON_COMPLIANT") {
      await prisma.observation.upsert({ where: { responseId: response.id }, update: { note: r.note || "غير مطابق", correctiveAction: r.correctiveAction || null }, create: { reportId: report.id, responseId: response.id, note: r.note || "غير مطابق", correctiveAction: r.correctiveAction || null } });
      await audit({ operationType: "اختيار غير مطابق", actorName: report.task.link.inspector.name, employeeNumber: report.task.link.inspector.employeeNumber, linkId: report.task.linkId, taskId: report.taskId, facilityName: facility.name, description: "تم تسجيل بند غير مطابق" });
      if (r.attachmentName) await prisma.attachment.create({ data: { reportId: report.id, responseId: response.id, fileName: r.attachmentName, fileType: "uploaded", fileUrl: `/uploads/${r.attachmentName}` } });
    } else {
      await prisma.observation.deleteMany({ where: { responseId: response.id } });
      await audit({ operationType: "اختيار مطابق", actorName: report.task.link.inspector.name, employeeNumber: report.task.link.inspector.employeeNumber, linkId: report.task.linkId, taskId: report.taskId, facilityName: facility.name, description: "تم تسجيل بند مطابق" });
    }
  }
  await recalculateReport(report.id);
  if (body.approve) await prisma.inspectionTask.update({ where: { id: report.taskId }, data: { status: TaskStatus.COMPLETED, completedAt: new Date() } });
  await audit({ operationType: body.approve ? "اعتماد تقرير" : "حفظ مسودة", actorName: report.task.link.inspector.name, employeeNumber: report.task.link.inspector.employeeNumber, linkId: report.task.linkId, taskId: report.taskId, facilityName: facility.name, description: body.approve ? "تم اعتماد التقرير وقفل المهمة" : "تم حفظ بيانات النموذج كمسودة" });
  return Response.json({ ok: true });
}
