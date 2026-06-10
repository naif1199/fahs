import { headers } from "next/headers";
import { AuditStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type AuditInput = {
  operationType: string;
  actorName?: string;
  employeeNumber?: string;
  linkId?: string;
  taskId?: string;
  weekId?: string;
  facilityName?: string;
  description: string;
  status?: AuditStatus;
};

export async function audit(input: AuditInput) {
  const h = await headers();
  await prisma.auditLog.create({
    data: {
      ...input,
      status: input.status ?? AuditStatus.SUCCESS,
      ipAddress: h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? undefined,
      userAgent: h.get("user-agent") ?? undefined
    }
  });
}
