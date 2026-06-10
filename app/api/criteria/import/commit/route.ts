import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { audit } from "@/lib/audit";
import { ParsedCriterion } from "@/lib/excel-import";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json() as { items?: ParsedCriterion[]; replaceExisting?: boolean };
  const items = body.items ?? [];
  if (!items.length) return Response.json({ ok: false, error: "لا توجد بنود لاعتمادها" }, { status: 400 });

  if (body.replaceExisting !== false) {
    await prisma.checklistItem.deleteMany({ where: { responses: { none: {} } } });
  }

  const typeNames = Array.from(new Set(items.map((item) => item.facilityType).filter(Boolean))) as string[];
  for (const name of typeNames) {
    await prisma.facilityType.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, defaultSensitivity: "متوسطة", description: "تم إنشاؤه من ملف Excel" }
    });
  }

  const facilityTypes = await prisma.facilityType.findMany({ where: { name: { in: typeNames } } });
  const typeMap = new Map(facilityTypes.map((type) => [type.name, type.id]));
  const rows = items.map((item) => ({
    sourceSheet: item.sourceSheet,
    originalRowNumber: item.originalRowNumber,
    itemNumber: item.itemNumber,
    mainSection: item.mainSection,
    subCategory: item.subSection,
    requirementText: item.requirementText,
    sensitivityLevel: item.securityClassification || "متوسطة",
    importance: item.importanceLevel,
    requirementStatus: item.mandatoryStatus,
    regulatoryReference: item.regulatoryReference,
    articleNumber: item.articleNumber,
    rawData: item.rawData as Prisma.InputJsonValue,
    importedAt: new Date(),
    isActive: true,
    facilityTypeId: item.facilityType ? typeMap.get(item.facilityType) ?? null : null
  }));

  for (let index = 0; index < rows.length; index += 100) {
    await prisma.checklistItem.createMany({ data: rows.slice(index, index + 100) });
  }

  await audit({ operationType: "اعتماد استيراد Excel", actorName: "مدير النظام", description: `تم اعتماد استيراد ${items.length} بند من ملف Excel` });
  return Response.json({ ok: true, imported: items.length });
}
