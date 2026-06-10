import { notFound } from "next/navigation";
import { Logo } from "@/components/logo";
import { PrintButton } from "@/components/print-button";
import { Badge, Button, Card, SecondaryButton } from "@/components/ui";
import { arDate, arDateTime, importanceLabel, pct, reportStatusLabel } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function ReportPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      facility: { include: { facilityType: true } },
      task: { include: { link: { include: { inspector: true, week: true } } } },
      observations: { include: { response: { include: { checklistItem: true, attachments: true } } } }
    }
  });
  if (!report) notFound();

  const high = report.observations.filter((o) => o.response.checklistItem.importance === "HIGH").length;
  const medium = report.observations.filter((o) => o.response.checklistItem.importance === "MEDIUM").length;
  const low = report.observations.filter((o) => o.response.checklistItem.importance === "LOW").length;

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 lg:p-8 print:max-w-none print:p-0">
      <div className="no-print flex justify-between gap-3">
        <SecondaryButton href="/admin/reports">رجوع للتقارير</SecondaryButton>
        <div className="flex gap-3">
          <Button href={`/api/reports/${report.id}/pdf`}>تسجيل تصدير PDF</Button>
          <PrintButton />
        </div>
      </div>

      <section className="relative overflow-hidden rounded-[34px] bg-white p-10 shadow-card print:rounded-none print:shadow-none">
        <div className="absolute inset-x-0 top-0 h-3 bg-gradient-to-l from-security via-sand to-official" />
        <div className="flex flex-wrap items-start justify-between gap-6">
          <Logo />
          <div className="text-left">
            <div className="text-sm text-muted">رقم التقرير</div>
            <div className="text-2xl font-black text-official">{report.reportNumber}</div>
            <Badge tone={report.status === "APPROVED" ? "success" : "warning"}>{reportStatusLabel(report.status)}</Badge>
          </div>
        </div>
        <div className="mt-16 max-w-3xl">
          <h1 className="text-4xl font-black leading-tight text-official">تقرير فحص مركز التحكم والمراقبة الأمنية</h1>
          <p className="mt-5 text-lg leading-9 text-muted">تقرير رسمي يوثق نتائج فحص المنشأة ومؤشرات المطابقة والبنود غير المطابقة والإجراءات التصحيحية المقترحة.</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-4">
          <Metric label="نسبة المطابقة" value={pct(report.complianceRate)} />
          <Metric label="مطابق" value={report.compliantCount} />
          <Metric label="غير مطابق" value={report.nonCompliantCount} />
          <Metric label="الملاحظات" value={report.notesCount} />
        </div>
      </section>

      <Card className="print-card">
        <h2 className="mb-4 text-2xl font-black text-official">بيانات المنشأة والفاحص</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Info label="اسم المنشأة" value={report.facility?.name} />
          <Info label="المدينة" value={report.facility?.city} />
          <Info label="نوع المنشأة" value={report.facility?.facilityType.name} />
          <Info label="مستوى الحساسية" value={report.facility?.securitySensitivity} />
          <Info label="ممثل المنشأة" value={report.facility?.representativeName} />
          <Info label="تاريخ الزيارة" value={arDate(report.facility?.visitDate)} />
          <Info label="وقت الزيارة" value={`${report.facility?.startedAt ?? "-"} - ${report.facility?.endedAt ?? "-"}`} />
          <Info label="الفاحص" value={report.task.link.inspector.name} />
          <Info label="الرقم الوظيفي" value={report.task.link.inspector.employeeNumber} />
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="print-card">
          <h2 className="mb-6 text-xl font-black text-official">رسم نسبة المطابقة</h2>
          <div className="h-8 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-security" style={{ width: `${Math.min(100, report.complianceRate)}%` }} /></div>
          <div className="mt-4 text-4xl font-black text-security">{pct(report.complianceRate)}</div>
        </Card>
        <Card className="print-card">
          <h2 className="mb-4 text-xl font-black text-official">توزيع الملاحظات حسب الأهمية</h2>
          <div className="space-y-3">
            <Bar label="عالية" value={high} color="#B42318" total={Math.max(1, report.notesCount)} />
            <Bar label="متوسطة" value={medium} color="#C47F17" total={Math.max(1, report.notesCount)} />
            <Bar label="منخفضة" value={low} color="#64748B" total={Math.max(1, report.notesCount)} />
          </div>
        </Card>
      </div>

      <Card className="print-card">
        <h2 className="mb-4 text-2xl font-black text-official">البنود غير المطابقة والملاحظات</h2>
        <div className="grid gap-4">
          {report.observations.length ? report.observations.map((o) => (
            <div key={o.id} className="rounded-3xl border border-danger/15 p-4">
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge tone="danger">البند {o.response.checklistItem.itemNumber}</Badge>
                <Badge tone={o.response.checklistItem.importance === "HIGH" ? "danger" : "warning"}>{importanceLabel(o.response.checklistItem.importance)}</Badge>
                <span className="text-sm font-bold text-muted">{o.response.checklistItem.mainSection} · {o.response.checklistItem.subCategory}</span>
              </div>
              <p className="font-bold leading-8">{o.response.checklistItem.requirementText}</p>
              <p className="mt-2 text-sm text-muted">المرجع: {o.response.checklistItem.regulatoryReference ?? "-"} · المادة: {o.response.checklistItem.articleNumber ?? "-"}</p>
              <p className="mt-3"><b>ملاحظة الفاحص:</b> {o.note}</p>
              <p className="mt-2"><b>الإجراء التصحيحي المقترح:</b> {o.correctiveAction ?? "-"}</p>
              {o.response.attachments.length ? <p className="mt-2 text-sm text-security">المرفقات: {o.response.attachments.map((a) => a.fileName).join("، ")}</p> : null}
            </div>
          )) : <p className="text-muted">لا توجد بنود غير مطابقة.</p>}
        </div>
      </Card>

      <Card className="print-card">
        <h2 className="mb-4 text-2xl font-black text-official">الخاتمة والاعتماد</h2>
        <p className="leading-8 text-muted">تم إعداد هذا التقرير بناءً على بيانات الفحص المدخلة في نظام الفاحص الذكي. تعتمد النتائج على البنود المطلوبة حسب نوع المنشأة ومستوى الحساسية الأمنية.</p>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 p-6"><div className="font-bold text-muted">توقيع الفاحص</div><div className="mt-12 border-t pt-3">{report.task.link.inspector.name}</div></div>
          <div className="rounded-3xl border border-slate-200 p-6"><div className="font-bold text-muted">اعتماد المدير</div><div className="mt-12 border-t pt-3">التاريخ: {arDateTime(report.approvedAt)}</div></div>
        </div>
      </Card>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-3xl bg-soft p-5"><div className="text-sm font-bold text-muted">{label}</div><div className="mt-2 text-3xl font-black text-security">{value}</div></div>;
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return <div className="rounded-2xl bg-soft p-4"><div className="text-xs font-bold text-muted">{label}</div><div className="mt-1 font-black text-charcoal">{value ?? "-"}</div></div>;
}

function Bar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  return <div><div className="mb-1 flex justify-between text-sm font-bold"><span>{label}</span><span>{value}</span></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full" style={{ backgroundColor: color, width: `${(value / total) * 100}%` }} /></div></div>;
}
