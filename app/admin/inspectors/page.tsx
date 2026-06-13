import { deleteInspector } from "@/app/actions";
import { InspectorCreateModal } from "@/components/inspector-create-modal";
import { Badge, Button, Card, Field, SecondaryButton, inputClass } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export default async function InspectorsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; department?: string }> }) {
  const params = await searchParams;
  const departments = await prisma.inspector.findMany({ select: { department: true }, distinct: ["department"], orderBy: { department: "asc" } });
  const inspectors = await prisma.inspector.findMany({
    where: {
      ...(params.q ? { OR: [{ name: { contains: params.q } }, { employeeNumber: { contains: params.q } }] } : {}),
      ...(params.status ? { status: params.status as "ACTIVE" | "INACTIVE" } : {}),
      ...(params.department ? { department: params.department } : {})
    },
    orderBy: { createdAt: "desc" }
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div><h1 className="text-3xl font-black text-official">إدارة الفاحصين</h1><p className="mt-2 text-muted">إضافة وتعديل وتعطيل الفاحصين الميدانيين.</p></div>
        <InspectorCreateModal />
      </div>
      <Card>
        <form className="mb-5 flex flex-wrap items-end gap-2">
          <Field label="بحث"><input name="q" defaultValue={params.q ?? ""} className={`${inputClass} w-52`} placeholder="اسم أو رقم وظيفي" /></Field>
          <Field label="القسم"><select name="department" defaultValue={params.department ?? ""} className={`${inputClass} w-48`}><option value="">كل الأقسام</option>{departments.map((item) => item.department ? <option key={item.department} value={item.department}>{item.department}</option> : null)}</select></Field>
          <Field label="الحالة"><select name="status" defaultValue={params.status ?? ""} className={`${inputClass} w-36`}><option value="">كل الحالات</option><option value="ACTIVE">نشط</option><option value="INACTIVE">غير نشط</option></select></Field>
          <Button type="submit" className="min-h-10 px-4 py-2">تطبيق</Button>
          <SecondaryButton href="/admin/inspectors" className="min-h-10 px-4 py-2">مسح</SecondaryButton>
        </form>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-muted"><th className="p-3 text-right">الاسم</th><th className="p-3 text-right">الرقم الوظيفي</th><th className="p-3 text-right">القسم</th><th className="p-3 text-right">الجوال</th><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">إجراء</th></tr></thead><tbody>{inspectors.map((i) => <tr key={i.id} className="border-b last:border-0"><td className="p-3 font-bold">{i.name}</td><td className="p-3">{i.employeeNumber}</td><td className="p-3">{i.department}</td><td className="p-3">{i.mobile ?? "-"}</td><td className="p-3"><Badge tone={i.status === "ACTIVE" ? "success" : "muted"}>{i.status === "ACTIVE" ? "نشط" : "غير نشط"}</Badge></td><td className="p-3"><form action={deleteInspector}><input type="hidden" name="id" value={i.id} /><button className="text-danger font-bold">حذف</button></form></td></tr>)}</tbody></table></div>
      </Card>
    </div>
  );
}
