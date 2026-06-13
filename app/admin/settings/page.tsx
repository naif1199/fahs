import { saveSettings } from "@/app/actions";
import { CriteriaImportPanel } from "@/components/criteria-import-panel";
import { Button, Card, Field, SecondaryButton, inputClass } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const settings = Object.fromEntries((await prisma.systemSetting.findMany()).map((s) => [s.key, s.value]));
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-official">إعدادات النظام</h1>
        <p className="mt-2 text-muted">إدارة إعدادات النظام العامة واستيراد ملف المعايير الرسمي.</p>
      </div>

      <CriteriaImportPanel />

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
