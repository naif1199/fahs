import { redirect } from "next/navigation";
import { InspectionForm } from "@/components/inspection-form";
import { hasLinkCookie } from "@/lib/auth";
import { getOrCreateReport } from "@/lib/report";
import { prisma } from "@/lib/prisma";

export default async function InspectionTaskPage({ params }: { params: Promise<{ token: string; taskId: string }> }) {
  const { token, taskId } = await params;
  if (!(await hasLinkCookie(token))) redirect(`/w/${token}`);
  const task = await prisma.inspectionTask.findUniqueOrThrow({ where: { id: taskId }, include: { link: { include: { inspector: true, week: true } } } });
  if (task.link.token !== token) redirect(`/w/${token}/tasks`);
  const report = await getOrCreateReport(taskId);
  const [types, items, fullReport] = await Promise.all([
    prisma.facilityType.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.checklistItem.findMany({ where: { isActive: true }, include: { facilityType: true }, orderBy: { itemNumber: "asc" } }),
    prisma.report.findUnique({ where: { id: report.id }, include: { facility: true, responses: { include: { checklistItem: true, attachments: true } } } })
  ]);
  return <InspectionForm token={token} task={task} report={fullReport!} facilityTypes={types} checklistItems={items} />;
}
