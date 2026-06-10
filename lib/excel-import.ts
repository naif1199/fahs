import * as XLSX from "xlsx";
import { Importance, RequirementStatus } from "@prisma/client";

export type ParsedCriterion = {
  sourceSheet: string;
  originalRowNumber: number;
  itemNumber: string;
  mainSection: string;
  subSection: string;
  requirementText: string;
  facilityType: string | null;
  securityClassification: string;
  importanceLevel: Importance;
  mandatoryStatus: RequirementStatus;
  regulatoryReference: string | null;
  articleNumber: string | null;
  rawData: Record<string, unknown>;
  isActive: true;
};

export type ImportPreview = {
  sheets: { name: string; rows: number; extractedItems: number }[];
  items: ParsedCriterion[];
  summary: {
    sheetsRead: number;
    totalItems: number;
    itemsWithoutSection: number;
    itemsWithoutFacilityType: number;
    itemsWithoutRegulatoryReference: number;
    errors: string[];
  };
};

const expectedSheets = {
  technical: "المواصفات الفنية",
  operational: "الضوابط التشغيلية",
  classification: "تصنيف المنشآت",
  appendix: "الملاحق والتصنيفات الأمنية"
};

function clean(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeHeader(value: unknown) {
  return clean(value).replace(/[ـ\s/\\|:-]/g, "");
}

function mainSectionForSheet(sheetName: string) {
  if (sheetName.includes("تشغيل")) return expectedSheets.operational;
  if (sheetName.includes("تصنيف المنشآت")) return expectedSheets.classification;
  if (sheetName.includes("ملاحق") || sheetName.includes("تصنيفات")) return expectedSheets.appendix;
  return expectedSheets.technical;
}

function findColumn(headers: unknown[], keys: string[]) {
  const normalized = headers.map(normalizeHeader);
  return normalized.findIndex((header) => keys.some((key) => header.includes(key)));
}

function parseImportance(row: Record<string, unknown>) {
  const text = Object.values(row).map(clean).join(" ");
  if (text.includes("عالية")) return Importance.HIGH;
  if (text.includes("منخفضة")) return Importance.LOW;
  return Importance.MEDIUM;
}

function parseMandatory(row: Record<string, unknown>) {
  const text = Object.values(row).map(clean).join(" ");
  return text.includes("مشروط") ? RequirementStatus.CONDITIONAL : RequirementStatus.MANDATORY;
}

function parseSensitivity(row: Record<string, unknown>) {
  const text = Object.values(row).map(clean).join(" ");
  if (text.includes("عالية")) return "عالية";
  if (text.includes("منخفضة")) return "منخفضة";
  return "متوسطة";
}

export function parseCriteriaWorkbook(buffer: Buffer): ImportPreview {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const sheets: ImportPreview["sheets"] = [];
  const items: ParsedCriterion[] = [];
  const errors: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, defval: "", blankrows: false });
    if (!rows.length) {
      sheets.push({ name: sheetName, rows: 0, extractedItems: 0 });
      continue;
    }

    const headerIndex = rows.findIndex((row) => row.some((cell) => normalizeHeader(cell).includes("البند") || normalizeHeader(cell).includes("متطلب")));
    const headers = rows[headerIndex >= 0 ? headerIndex : 0] ?? [];
    const numberCol = findColumn(headers, ["الرقم", "رقم", "م"]);
    const sectionCol = findColumn(headers, ["القسمالتصنيف", "التصنيف", "القسم"]);
    const requirementCol = findColumn(headers, ["البندالفنيالمتطلبالتشغيلي", "المتطلب", "البند"]);
    const referenceCol = findColumn(headers, ["المرجع", "النظامي"]);
    const articleCol = findColumn(headers, ["المادة", "الفقرة"]);
    const facilityCol = findColumn(headers, ["نوعالمنشأة", "المنشأة"]);
    const sensitivityCol = findColumn(headers, ["الحساسية", "التصنيفالأمني"]);

    if (requirementCol < 0) errors.push(`لم يتم التعرف على عمود المتطلب في الورقة: ${sheetName}`);

    let currentSubSection = "";
    let extractedItems = 0;
    for (let rowIndex = (headerIndex >= 0 ? headerIndex + 1 : 1); rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex] ?? [];
      if (row.every((cell) => clean(cell) === "")) continue;

      const rawData = Object.fromEntries(headers.map((header, index) => [clean(header) || `column_${index + 1}`, row[index] ?? ""]));
      const requirementText = requirementCol >= 0 ? clean(row[requirementCol]) : clean(row.find((cell) => clean(cell).length > 25));
      const sectionText = sectionCol >= 0 ? clean(row[sectionCol]) : currentSubSection;
      const rowHasOnlyTitle = !requirementText && sectionText;
      if (rowHasOnlyTitle) {
        currentSubSection = sectionText;
        continue;
      }
      if (!requirementText) continue;

      currentSubSection = sectionText || currentSubSection;
      const mainSection = mainSectionForSheet(sheetName);
      const facilityType = mainSection === expectedSheets.classification ? (sectionText || null) : facilityCol >= 0 ? clean(row[facilityCol]) || null : null;
      const securityClassification = sensitivityCol >= 0 ? clean(row[sensitivityCol]) || parseSensitivity(rawData) : parseSensitivity(rawData);

      items.push({
        sourceSheet: sheetName,
        originalRowNumber: rowIndex + 1,
        itemNumber: numberCol >= 0 ? clean(row[numberCol]) || String(extractedItems + 1) : String(extractedItems + 1),
        mainSection,
        subSection: currentSubSection || sectionText || mainSection,
        requirementText,
        facilityType,
        securityClassification,
        importanceLevel: parseImportance(rawData),
        mandatoryStatus: parseMandatory(rawData),
        regulatoryReference: referenceCol >= 0 ? clean(row[referenceCol]) || null : null,
        articleNumber: articleCol >= 0 ? clean(row[articleCol]) || null : null,
        rawData,
        isActive: true
      });
      extractedItems += 1;
    }
    sheets.push({ name: sheetName, rows: rows.length, extractedItems });
  }

  return {
    sheets,
    items,
    summary: {
      sheetsRead: workbook.SheetNames.length,
      totalItems: items.length,
      itemsWithoutSection: items.filter((item) => !item.subSection).length,
      itemsWithoutFacilityType: items.filter((item) => !item.facilityType).length,
      itemsWithoutRegulatoryReference: items.filter((item) => !item.regulatoryReference).length,
      errors
    }
  };
}
