import { NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const report = await prisma.report.findUnique({ where: { id: reportId }, include: { task: { include: { link: { include: { inspector: true } } } }, facility: true } });
  if (!report) return new Response("Not found", { status: 404 });
  await audit({ operationType: "تصدير PDF", actorName: report.task.link.inspector.name, employeeNumber: report.task.link.inspector.employeeNumber, linkId: report.task.linkId, taskId: report.taskId, facilityName: report.facility?.name, description: `تم طلب تصدير PDF للتقرير ${report.reportNumber}` });
  return Response.redirect(new URL(`/reports/${reportId}`, process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
}
