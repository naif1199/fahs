import { readFileSync } from "node:fs";
import { Prisma } from "@prisma/client";
import { parseCriteriaWorkbook } from "@/lib/excel-import";
import { prisma } from "@/lib/prisma";

const filePath = process.argv[2] ?? "imports/criteria.xlsx.xlsx";

async function main() {
  const preview = parseCriteriaWorkbook(readFileSync(filePath));
  console.log(`Sheets read: ${preview.summary.sheetsRead}`);
  console.log(`Items extracted: ${preview.summary.totalItems}`);
  for (const sheet of preview.sheets) console.log(`${sheet.name}: ${sheet.extractedItems}`);
  if (preview.summary.errors.length) console.log(`Errors: ${preview.summary.errors.join(" | ")}`);

  await prisma.checklistItem.deleteMany({ where: { responses: { none: {} } } });

  const typeNames = Array.from(new Set(preview.items.map((item) => item.facilityType).filter(Boolean))) as string[];
  for (const name of typeNames) {
    await prisma.facilityType.upsert({ where: { name }, update: { isActive: true }, create: { name, defaultSensitivity: "متوسطة", description: "تم إنشاؤه من ملف Excel" } });
  }

  const facilityTypes = await prisma.facilityType.findMany({ where: { name: { in: typeNames } } });
  const typeMap = new Map(facilityTypes.map((type) => [type.name, type.id]));
  const rows = preview.items.map((item) => ({
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

  await prisma.auditLog.create({ data: { operationType: "اعتماد استيراد Excel", actorName: "مدير النظام", description: `تم استيراد ${preview.summary.totalItems} بند من ${filePath}` } });
}

main().finally(async () => prisma.$disconnect());
