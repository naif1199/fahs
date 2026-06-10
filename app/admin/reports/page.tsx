import { Badge, Button, Card, SecondaryButton, inputClass } from "@/components/ui";
import { arDate, pct, reportStatusLabel } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const reports = await prisma.report.findMany({ include: { facility: { include: { facilityType: true } }, task: { include: { link: { include: { inspector: true, week: true } } } } }, orderBy: { createdAt: "desc" } });
  const filtered = reports.filter((r) => !params.q || r.facility?.name.includes(params.q) || r.task?.link?.inspector?.name.includes(params.q));
  const latestReport = filtered[0];

  return <div className="space-y-6">
    <div><h1 className="text-3xl font-black text-official">التقارير</h1><p className="mt-2 text-muted">إنشاء وفتح روابط تقارير الفاحصين وتصدير ملفات PDF الرسمية من مكان واحد.</p></div>
    <Card className="border-security/15 bg-security/5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><p className="text-sm font-bold text-security">رابط تقرير الفاحص</p><h2 className="mt-1 text-lg font-black text-official">الأمر الرئيسي للتقارير</h2><p className="mt-2 text-sm leading-7 text-muted">اختر التقرير من الجدول، ثم افتح رابط التقرير الرسمي أو سجل تصدير PDF. الرابط هو المسار الرسمي الذي يمكن إرساله أو طباعته.</p></div>
        <div className="flex flex-wrap gap-3">{latestReport ? <Button href={`/reports/${latestReport.id}`}>فتح أحدث رابط تقرير</Button> : null}<SecondaryButton href="/admin/weeks">روابط الفاحصين</SecondaryButton></div>
      </div>
    </Card>
    <Card>
      <form className="mb-5 flex gap-3"><input name="q" className={inputClass + " max-w-sm"} placeholder="بحث باسم المنشأة أو الفاحص"/><SecondaryButton type="submit">بحث</SecondaryButton></form>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-muted"><th className="p-3 text-right">رقم التقرير</th><th className="p-3 text-right">المنشأة</th><th className="p-3 text-right">المدينة</th><th className="p-3 text-right">نوع المنشأة</th><th className="p-3 text-right">الفاحص</th><th className="p-3 text-right">تاريخ الزيارة</th><th className="p-3 text-right">المطابقة</th><th className="p-3 text-right">الملاحظات</th><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">رابط التقرير</th><th className="p-3 text-right">PDF</th></tr></thead><tbody>{filtered.map((r) => <tr key={r.id} className="border-b last:border-0"><td className="p-3 font-bold">{r.reportNumber}</td><td className="p-3">{r.facility?.name ?? "-"}</td><td className="p-3">{r.facility?.city ?? "-"}</td><td className="p-3">{r.facility?.facilityType.name ?? "-"}</td><td className="p-3">{r.task?.link?.inspector?.name ?? "-"}<br/><span className="text-xs text-muted">{r.task?.link?.inspector?.employeeNumber ?? "-"}</span></td><td className="p-3">{arDate(r.facility?.visitDate)}</td><td className="p-3 font-black text-security">{pct(r.complianceRate)}</td><td className="p-3">{r.notesCount}</td><td className="p-3"><Badge tone={r.status === "APPROVED" ? "success" : "warning"}>{reportStatusLabel(r.status)}</Badge></td><td className="p-3"><Button href={`/reports/${r.id}`} className="min-h-9 px-3">فتح الرابط</Button></td><td className="p-3"><SecondaryButton href={`/api/reports/${r.id}/pdf`} className="min-h-9 px-3">تصدير</SecondaryButton></td></tr>)}</tbody></table></div>
    </Card>
  </div>;
}