import { saveSettings } from "@/app/actions";
import { CriteriaImportPanel } from "@/components/criteria-import-panel";
import { Button, Card, Field, SecondaryButton, inputClass } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const [systemSettings, weeks, inspectors, facilityTypes, facilities] = await Promise.all([
    prisma.systemSetting.findMany(),
    prisma.inspectionWeek.findMany({ include: { links: true }, orderBy: { startsAt: "desc" } }),
    prisma.inspector.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    prisma.facilityType.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.facility.findMany({ select: { city: true } })
  ]);
  const settings = Object.fromEntries(systemSettings.map((s) => [s.key, s.value]));
  const cities = [...new Set(facilities.map((facility) => facility.city).filter(Boolean))];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-official">إعدادات النظام</h1>
        <p className="mt-2 text-muted">إدارة إعدادات النظام العامة واستيراد ملف المعايير الرسمي.</p>
      </div>

      <CriteriaImportPanel />

      <Card>
        <div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
          <div>
            <p className="text-sm text-security">الفاحص الذكي</p>
            <h2 className="mt-1 text-2xl text-official">لوحة المعلومات</h2>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-muted">نظرة تشغيلية شاملة على روابط الفحص، المهام، التقارير، الملاحظات، ومستوى الإنجاز.</p>
          </div>
          <Button href="/api/admin/dashboard/export">تصدير Excel</Button>
        </div>
        <form action="/admin" className="grid gap-3 md:grid-cols-5 xl:grid-cols-7">
          <DashboardSelect name="period" label="الفترة الزمنية" options={[["", "كل الفترات"], ["week", "آخر 7 أيام"], ["month", "آخر 30 يوم"]]} />
          <DashboardSelect name="weekId" label="دفعة الفحص" options={[["", "كل الدفعات"], ...weeks.filter((week) => week.links.length > 0).map((week) => [week.id, week.name] as [string, string])]} />
          <DashboardSelect name="inspectorId" label="الفاحص" options={[["", "كل الفاحصين"], ...inspectors.map((inspector) => [inspector.id, inspector.name] as [string, string])]} />
          <DashboardSelect name="city" label="المدينة" options={[["", "كل المدن"], ...cities.map((city) => [city, city] as [string, string])]} />
          <DashboardSelect name="facilityTypeId" label="نوع المنشأة" options={[["", "كل الأنواع"], ...facilityTypes.map((type) => [type.id, type.name] as [string, string])]} />
          <div className="flex items-end gap-2 md:col-span-2"><Button>تطبيق على لوحة المعلومات</Button><SecondaryButton href="/admin">فتح بدون فلاتر</SecondaryButton></div>
        </form>
      </Card>

      <Card>
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div>
            <p className="text-sm text-security">مؤشرات أداء الفاحصين</p>
            <h2 className="mt-1 text-2xl text-official">لوحة قياس أداء الفاحصين</h2>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-muted">قياس أسبوعي وشهري للإنتاجية، جودة التوثيق، الالتزام التشغيلي، والفاعلية الرقابية بناءً على بيانات المهام والتقارير والملاحظات والمرفقات.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href="/api/admin/performance/export">تصدير Excel</Button>
            <SecondaryButton href="/admin/performance">فتح لوحة الأداء</SecondaryButton>
          </div>
        </div>
      </Card>

      <Card>
        <form action={saveSettings} className="grid gap-4 md:grid-cols-2">
          <Field label="اسم النظام"><input name="systemName" defaultValue={settings.systemName} className={inputClass} /></Field>
          <Field label="العنوان الرسمي"><input name="officialTitle" defaultValue={settings.officialTitle} className={inputClass} /></Field>
          <Field label="بيانات الجهة"><input name="entityName" defaultValue={settings.entityName} className={inputClass} /></Field>
          <Field label="مدة صلاحية الرابط الأسبوعي"><input name="weeklyLinkValidityDays" defaultValue={settings.weeklyLinkValidityDays} className={inputClass} /></Field>
          <Field label="عدد المهام الافتراضي"><input name="defaultTasksPerInspector" defaultValue={settings.defaultTasksPerInspector} className={inputClass} /></Field>
          <Field label="تفعيل الطباعة"><select name="enablePrint" defaultValue={settings.enablePrint} className={inputClass}><option value="true">مفعل</option><option value="false">معطل</option></select></Field>
          <Field label="تفعيل PDF"><select name="enablePdf" defaultValue={settings.enablePdf} className={inputClass}><option value="true">مفعل</option><option value="false">معطل</option></select></Field>
          <Field label="نص إقرار الفاحص"><textarea name="inspectorDeclaration" defaultValue={settings.inspectorDeclaration} className={inputClass + " md:col-span-2"} /></Field>
          <Button className="md:col-span-2">حفظ الإعدادات</Button>
        </form>
      </Card>
    </div>
  );
}

function DashboardSelect({ label, name, options }: { label: string; name: string; options: [string, string][] }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-official">{label}</span><select name={name} className={inputClass}>{options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>;
}
