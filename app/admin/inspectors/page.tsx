import { deleteInspector, saveInspector } from "@/app/actions";
import { Badge, Button, Card, Field, SecondaryButton, inputClass } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export default async function InspectorsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const params = await searchParams;
  const inspectors = await prisma.inspector.findMany({
    where: { name: { contains: params.q ?? "" }, ...(params.status ? { status: params.status as "ACTIVE" | "INACTIVE" } : {}) },
    orderBy: { createdAt: "desc" }
  });
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-black text-official">إدارة الفاحصين</h1><p className="mt-2 text-muted">إضافة وتعديل وتعطيل الفاحصين الميدانيين.</p></div>
      <Card>
        <form action={saveInspector} className="grid gap-4 md:grid-cols-3">
          <Field label="اسم الفاحص"><input name="name" className={inputClass} required /></Field>
          <Field label="الرقم الوظيفي"><input name="employeeNumber" className={inputClass} required /></Field>
          <Field label="الإدارة أو القسم"><input name="department" className={inputClass} required /></Field>
          <Field label="رقم الجوال"><input name="mobile" className={inputClass} /></Field>
          <Field label="البريد"><input name="email" type="email" className={inputClass} /></Field>
          <Field label="الحالة"><select name="status" className={inputClass}><option value="ACTIVE">نشط</option><option value="INACTIVE">غير نشط</option></select></Field>
          <Button className="md:col-span-3">إضافة فاحص</Button>
        </form>
      </Card>
      <Card>
        <form className="mb-5 flex flex-wrap gap-3"><input name="q" className={inputClass + " max-w-sm"} placeholder="بحث باسم الفاحص" /><select name="status" className={inputClass + " max-w-xs"}><option value="">كل الحالات</option><option value="ACTIVE">نشط</option><option value="INACTIVE">غير نشط</option></select><SecondaryButton type="submit">بحث</SecondaryButton></form>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-muted"><th className="p-3 text-right">الاسم</th><th className="p-3 text-right">الرقم الوظيفي</th><th className="p-3 text-right">القسم</th><th className="p-3 text-right">الجوال</th><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">إجراء</th></tr></thead><tbody>{inspectors.map((i) => <tr key={i.id} className="border-b last:border-0"><td className="p-3 font-bold">{i.name}</td><td className="p-3">{i.employeeNumber}</td><td className="p-3">{i.department}</td><td className="p-3">{i.mobile ?? "-"}</td><td className="p-3"><Badge tone={i.status === "ACTIVE" ? "success" : "muted"}>{i.status === "ACTIVE" ? "نشط" : "غير نشط"}</Badge></td><td className="p-3"><form action={deleteInspector}><input type="hidden" name="id" value={i.id} /><button className="text-danger font-bold">حذف</button></form></td></tr>)}</tbody></table></div>
      </Card>
    </div>
  );
}
