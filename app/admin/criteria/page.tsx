import Link from "next/link";
import { Prisma } from "@prisma/client";
import { CriteriaCreateModal } from "@/components/criteria-create-modal";
import { CriteriaImportPanel } from "@/components/criteria-import-panel";
import { Badge, Card, SecondaryButton, inputClass } from "@/components/ui";
import { importanceLabel } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const tabs = [
  { key: "all", label: "جميع المعايير" },
  { key: "المواصفات الفنية والمبادئ", label: "المواصفات الفنية والمبادئ" },
  { key: "الضوابط التشغيلية", label: "الضوابط التشغيلية" },
  { key: "تصنيف المنشآت", label: "تصنيف المنشآت" },
  { key: "الملاحق والتصنيفات", label: "الملاحق والتصنيفات" }
];

function qs(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  return `?${search.toString()}`;
}

export default async function CriteriaPage({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string; facilityTypeId?: string; importance?: string; sensitivity?: string; active?: string }> }) {
  const params = await searchParams;
  const activeTab = params.tab ?? "all";

  const where: Prisma.ChecklistItemWhereInput = {
    ...(activeTab !== "all" ? { sourceSheet: activeTab } : {}),
    ...(params.facilityTypeId ? { facilityTypeId: params.facilityTypeId } : {}),
    ...(params.importance ? { importance: params.importance as "HIGH" | "MEDIUM" | "LOW" } : {}),
    ...(params.sensitivity ? { sensitivityLevel: params.sensitivity } : {}),
    ...(params.active === "true" ? { isActive: true } : params.active === "false" ? { isActive: false } : {}),
    ...(params.q ? { OR: [{ requirementText: { contains: params.q } }, { subCategory: { contains: params.q } }, { itemNumber: { contains: params.q } }, { regulatoryReference: { contains: params.q } }] } : {})
  };

  const [items, total, facilityTypes, sheetCounts] = await Promise.all([
    prisma.checklistItem.findMany({ where, include: { facilityType: true }, orderBy: [{ sourceSheet: "asc" }, { originalRowNumber: "asc" }, { createdAt: "desc" }], take: 300 }),
    prisma.checklistItem.count({ where }),
    prisma.facilityType.findMany({ orderBy: { name: "asc" } }),
    prisma.checklistItem.groupBy({ by: ["sourceSheet"], _count: true })
  ]);

  const countMap = new Map(sheetCounts.map((item) => [item.sourceSheet ?? "يدوي", item._count]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-official">إدارة المعايير</h1>
          <p className="mt-2 text-muted">استيراد، تبويب، بحث، وتعديل معايير الفحص حسب مصدرها وتصنيفها.</p>
        </div>
        <CriteriaCreateModal facilityTypes={facilityTypes} />
      </div>

      <CriteriaImportPanel />

      <Card>
        <div className="mb-5 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            const count = tab.key === "all" ? sheetCounts.reduce((sum, item) => sum + item._count, 0) : countMap.get(tab.key) ?? 0;
            return <Link key={tab.key} href={`/admin/criteria${qs({ ...params, tab: tab.key })}`} className={`rounded-2xl border px-4 py-2 text-sm font-bold transition ${active ? "border-sand/50 bg-sand/20 text-white" : "border-white/12 bg-white/[0.055] text-muted hover:bg-white/10 hover:text-white"}`}>{tab.label} <span className="text-xs opacity-70">({count})</span></Link>;
          })}
        </div>

        <form className="grid gap-3 md:grid-cols-6">
          <input type="hidden" name="tab" value={activeTab} />
          <input name="q" defaultValue={params.q ?? ""} className={`${inputClass} md:col-span-2`} placeholder="بحث في رقم البند أو نص المتطلب أو المرجع" />
          <select name="facilityTypeId" defaultValue={params.facilityTypeId ?? ""} className={inputClass}><option value="">كل أنواع المنشآت</option>{facilityTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select>
          <select name="importance" defaultValue={params.importance ?? ""} className={inputClass}><option value="">كل درجات الأهمية</option><option value="HIGH">عالية</option><option value="MEDIUM">متوسطة</option><option value="LOW">منخفضة</option></select>
          <select name="sensitivity" defaultValue={params.sensitivity ?? ""} className={inputClass}><option value="">كل مستويات الحساسية</option><option>عالية</option><option>متوسطة</option><option>منخفضة</option></select>
          <select name="active" defaultValue={params.active ?? ""} className={inputClass}><option value="">كل الحالات</option><option value="true">مفعل</option><option value="false">معطل</option></select>
          <div className="flex gap-2 md:col-span-6">
            <button className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-security px-5 py-2.5 text-sm font-bold text-white">تطبيق الفلاتر</button>
            <SecondaryButton href={`/admin/criteria${qs({ tab: activeTab })}`}>مسح الفلاتر</SecondaryButton>
            <SecondaryButton href="/api/criteria/export?format=json">تصدير JSON</SecondaryButton>
            <SecondaryButton href="/api/criteria/export?format=xlsx">تصدير Excel</SecondaryButton>
          </div>
        </form>
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black text-official">نتائج المعايير</h2>
          <div className="text-sm font-bold text-muted">المعروض {items.length} من {total} معيار</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-muted"><th className="p-3 text-right">المصدر</th><th className="p-3 text-right">البند</th><th className="p-3 text-right">القسم</th><th className="p-3 text-right">نص المتطلب</th><th className="p-3 text-right">نوع المنشأة</th><th className="p-3 text-right">الحساسية</th><th className="p-3 text-right">الأهمية</th><th className="p-3 text-right">المرجع</th><th className="p-3 text-right">الحالة</th></tr></thead>
            <tbody>
              {items.map((item) => <tr key={item.id} className="border-b last:border-0"><td className="p-3 text-xs text-muted">{item.sourceSheet ?? "يدوي"}<br />{item.originalRowNumber ? `صف ${item.originalRowNumber}` : ""}</td><td className="p-3 font-black text-sand">{item.itemNumber}</td><td className="p-3">{item.mainSection}<br /><span className="text-xs text-muted">{item.subCategory}</span></td><td className="max-w-2xl p-3 leading-7">{item.requirementText}</td><td className="p-3">{item.facilityType?.name ?? "عام"}</td><td className="p-3">{item.sensitivityLevel}</td><td className="p-3"><Badge tone={item.importance === "HIGH" ? "danger" : item.importance === "MEDIUM" ? "warning" : "muted"}>{importanceLabel(item.importance)}</Badge></td><td className="p-3 text-xs text-muted">{item.regulatoryReference ?? "-"}<br />{item.articleNumber ?? ""}</td><td className="p-3"><Badge tone={item.isActive ? "success" : "muted"}>{item.isActive ? "مفعل" : "معطل"}</Badge></td></tr>)}
              {!items.length ? <tr><td colSpan={9} className="p-8 text-center text-muted">لا توجد نتائج مطابقة للفلاتر الحالية.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
