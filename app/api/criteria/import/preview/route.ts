import { NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { parseCriteriaWorkbook } from "@/lib/excel-import";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return Response.json({ ok: false, error: "لم يتم إرفاق ملف Excel" }, { status: 400 });
  const buffer = Buffer.from(await file.arrayBuffer());
  const preview = parseCriteriaWorkbook(buffer);
  await audit({ operationType: "معاينة استيراد Excel", actorName: "مدير النظام", description: `تمت معاينة ملف Excel للمعايير: ${file.name}` });
  return Response.json({ ok: true, preview });
}
