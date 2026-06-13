import { FacilityTypeCreateModal } from "@/components/facility-type-create-modal";
import { Badge, Button, Card, Field, SecondaryButton, inputClass } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export default async function FacilityTypesPage({ searchParams }: { searchParams: Promise<{ q?: string; sensitivity?: string; active?: string }> }) {
  const params = await searchParams;
  const types = await prisma.facilityType.findMany({
    where: {
      ...(params.q ? { OR: [{ name: { contains: params.q } }, { description: { contains: params.q } }, { extraRequirements: { contains: params.q } }] } : {}),
      ...(params.sensitivity ? { defaultSensitivity: params.sensitivity } : {}),
      ...(params.active ? { isActive: params.active === "true" } : {})
    },
    include: { _count: { select: { checklistItems: true, facilities: true } } },
    orderBy: { name: "asc" }
  });

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
      <div><h1 className="text-3xl font-black text-official">إدارة تصنيف المنشآت</h1><p className="mt-2 text-muted">ربط أنواع المنشآت بالحساسية والمتطلبات الإضافية والمعايير.</p></div>
      <FacilityTypeCreateModal />
    </div>

    <Card>
      <form className="mb-5 flex flex-wrap items-end gap-2">
        <Field label="بحث"><input name="q" defaultValue={params.q ?? ""} className={`${inputClass} w-52`} placeholder="نوع أو وصف" /></Field>
        <Field label="الحساسية"><select name="sensitivity" defaultValue={params.sensitivity ?? ""} className={`${inputClass} w-40`}><option value="">كل المستويات</option><option>عالية</option><option>متوسطة</option><option>منخفضة</option></select></Field>
        <Field label="الحالة"><select name="active" defaultValue={params.active ?? ""} className={`${inputClass} w-36`}><option value="">كل الحالات</option><option value="true">مفعل</option><option value="false">معطل</option></select></Field>
        <Button type="submit" className="min-h-10 px-4 py-2">تطبيق</Button>
        <SecondaryButton href="/admin/facility-types" className="min-h-10 px-4 py-2">مسح</SecondaryButton>
      </form>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-muted"><th className="p-3 text-right">نوع المنشأة</th><th className="p-3 text-right">الحساسية</th><th className="p-3 text-right">المعايير</th><th className="p-3 text-right">التقارير</th><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">متطلبات إضافية</th></tr></thead><tbody>{types.map((t) => <tr key={t.id} className="border-b last:border-0"><td className="p-3 font-bold">{t.name}</td><td className="p-3">{t.defaultSensitivity}</td><td className="p-3">{t._count.checklistItems}</td><td className="p-3">{t._count.facilities}</td><td className="p-3"><Badge tone={t.isActive ? "success" : "muted"}>{t.isActive ? "مفعل" : "معطل"}</Badge></td><td className="p-3">{t.extraRequirements ?? "-"}</td></tr>)}</tbody></table></div>
    </Card>
  </div>;
}
