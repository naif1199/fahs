import { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const items = await prisma.checklistItem.findMany({ include: { facilityType: true } });
  const rows = items.map((i) => ({ id: i.id, sourceSheet: i.sourceSheet ?? "", originalRowNumber: i.originalRowNumber ?? "", "رقم البند": i.itemNumber, "القسم الرئيسي": i.mainSection, "التصنيف الفرعي": i.subCategory, "نص المتطلب": i.requirementText, "نوع المنشأة": i.facilityType?.name ?? "", "مستوى الحساسية": i.sensitivityLevel, "درجة الأهمية": i.importance, "حالة الإلزام": i.requirementStatus, "المرجع النظامي": i.regulatoryReference ?? "", "رقم المادة": i.articleNumber ?? "", rawData: JSON.stringify(i.rawData ?? {}) }));
  if (request.nextUrl.searchParams.get("format") === "xlsx") {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "المواصفات الفنية والمبادئ");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.filter((r) => String(r["القسم الرئيسي"]).includes("الضوابط"))), "الضوابط التشغيلية");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "تصنيف المنشآت");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.filter((r) => String(r["القسم الرئيسي"]).includes("الملاحق"))), "الملاحق والتصنيفات");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new Response(buffer, { headers: { "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "content-disposition": "attachment; filename=fahs-criteria.xlsx" } });
  }
  return Response.json(rows);
}
