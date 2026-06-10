import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { Button, SecondaryButton } from "@/components/ui";
import { arDate, arDateTime, importanceLabel, pct, reportStatusLabel } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const REPORT_TITLE = "تقرير فحص مركز التحكم والمراقبة الأمنية";
const SYSTEM_NAME = "الفاحص الذكي";
const SYSTEM_SUBTITLE = "أداة التفتيش الأمنية الذكية";
const GENERATED_AT = new Date();
const defaultCorrectiveAction = "استكمال المتطلب وفق المواصفة المعتمدة، وتزويد الجهة المختصة بما يثبت المعالجة خلال المدة المحددة.";

export default async function ReportPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      facility: { include: { facilityType: true } },
      task: { include: { link: { include: { inspector: true, week: true } } } },
      observations: {
        include: {
          attachments: true,
          response: { include: { checklistItem: true, attachments: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!report) notFound();

  const task = report.task;
  const link = task?.link;
  const inspector = link?.inspector;
  const facility = report.facility;
  const totalItems = report.compliantCount + report.nonCompliantCount;
  const results = report.observations;

  return (
    <main className="report-root mx-auto max-w-5xl p-4 lg:p-8 print:max-w-none print:p-0">
      <div className="no-print mb-4 flex justify-between gap-3">
        <SecondaryButton href="/admin/reports">رجوع للتقارير</SecondaryButton>
        <div className="flex gap-3">
          <Button href={`/api/reports/${report.id}/pdf`}>تسجيل تصدير PDF</Button>
          <PrintButton />
        </div>
      </div>
      <style>{reportCss}</style>
      <section className="report-sheet">
        <header className="report-cover">
          <div className="brand-line">
            <ReportBrand />
            <div className="report-state">
              <span>رقم التقرير</span>
              <strong>{report.reportNumber}</strong>
              <em>{reportStatusLabel(report.status)}</em>
            </div>
          </div>
          <div className="title-row">
            <div>
              <p>تقرير نتائج الفحص</p>
              <h1>{REPORT_TITLE}</h1>
            </div>
            <ComplianceBadge value={report.complianceRate} />
          </div>
        </header>
        <section className="summary-band" aria-label="ملخص نتائج النموذج">
          <Metric label="إجمالي البنود" value={totalItems} />
          <Metric label="مطابق" value={report.compliantCount} tone="success" />
          <Metric label="غير مطابق" value={report.nonCompliantCount} tone="danger" />
          <Metric label="الملاحظات" value={report.notesCount} tone="warning" />
        </section>
        <section className="section-block">
          <SectionTitle title="بيانات الفحص" />
          <div className="info-grid compact">
            <Info label="اسم المنشأة" value={facility?.name} />
            <Info label="المدينة" value={facility?.city} />
            <Info label="نوع المنشأة" value={facility?.facilityType.name ?? facility?.classification} />
            <Info label="تاريخ الزيارة" value={arDate(facility?.visitDate)} />
            <Info label="وقت الزيارة" value={`${facility?.startedAt ?? "غير متوفر"} - ${facility?.endedAt ?? "غير متوفر"}`} />
            <Info label="أسبوع الفحص" value={link?.week?.name} />
            <Info label="اسم الفاحص" value={inspector?.name} />
            <Info label="الرقم الوظيفي" value={inspector?.employeeNumber} />
            <Info label="تاريخ توليد التقرير" value={arDateTime(GENERATED_AT)} />
          </div>
        </section>
        <section className="section-block">
          <SectionTitle title="نتائج النموذج المسجلة بواسطة الفاحص" />
          {results.length ? (
            <div className="result-list">
              {results.map((observation) => {
                const item = observation.response.checklistItem;
                const attachments = [...observation.response.attachments, ...observation.attachments];
                return (
                  <article key={observation.id} className="result-card">
                    <div className="result-head">
                      <div><span>البند {item.itemNumber}</span><h2>{item.mainSection}</h2><p>{item.subCategory}</p></div>
                      <div className="badges"><b className="status-badge">غير مطابق</b><b className={`importance-badge ${importanceClass(item.importance)}`}>{importanceLabel(item.importance)}</b></div>
                    </div>
                    <div className="field-box requirement"><span>نص المتطلب</span><p>{item.requirementText}</p></div>
                    <div className="two-columns">
                      <div className="field-box note"><span>ملاحظة الفاحص</span><p>{observation.note || observation.response.inspectorNote || "غير متوفرة"}</p></div>
                      <div className="field-box action"><span>الإجراء التصحيحي المقترح</span><p>{observation.correctiveAction || observation.response.correctiveAction || defaultCorrectiveAction}</p></div>
                    </div>
                    <div className="info-grid references">
                      <Info label="المرجع النظامي" value={item.regulatoryReference || "غير متوفر"} />
                      <Info label="رقم المادة أو الفقرة" value={item.articleNumber || "غير متوفرة"} />
                      <Info label="حالة المعالجة" value={observationStatusLabel(observation.status)} />
                    </div>
                    {attachments.length ? <div className="attachments-block"><h3>مرفقات الفاحص</h3><div className="attachments-grid">{attachments.map((attachment) => <div key={attachment.id} className="attachment-item">{attachment.fileType.startsWith("image/") ? <img src={attachment.fileUrl} alt={attachment.fileName} /> : null}<span>{attachment.fileName}</span></div>)}</div></div> : null}
                  </article>
                );
              })}
            </div>
          ) : <div className="empty-state">لا توجد بنود غير مطابقة أو ملاحظات مسجلة في هذا التقرير.</div>}
        </section>
        <footer className="report-footer"><span>تم توليد التقرير عبر نظام الفاحص الذكي</span><span>{arDate(GENERATED_AT)}</span></footer>
      </section>
    </main>
  );
}

function ReportBrand() { return <div className="report-brand"><img src="/logo-mark.png" alt="شعار الفاحص الذكي" /><div><strong>{SYSTEM_NAME}</strong><span>{SYSTEM_SUBTITLE}</span></div></div>; }
function SectionTitle({ title }: { title: string }) { return <div className="section-title"><span /><h2>{title}</h2></div>; }
function Metric({ label, value, tone }: { label: string; value: string | number; tone?: "success" | "warning" | "danger" }) { return <div className={`metric-card ${tone ? `metric-${tone}` : ""}`}><span>{label}</span><strong>{value}</strong></div>; }
function Info({ label, value }: { label: string; value?: string | number | null }) { const display = value === null || value === undefined || value === "" ? "غير متوفر" : value; return <div className="info-item"><span>{label}</span><strong>{display}</strong></div>; }
function ComplianceBadge({ value }: { value: number }) { return <div className="compliance-badge"><span>نسبة المطابقة</span><strong>{pct(value)}</strong></div>; }
function observationStatusLabel(status: string) { if (status === "CLOSED") return "مغلقة"; if (status === "IN_PROGRESS") return "تحت المعالجة"; return "مفتوحة"; }
function importanceClass(value: string) { if (value === "HIGH") return "importance-high"; if (value === "MEDIUM") return "importance-medium"; return "importance-low"; }

const reportCss = `
.report-root{--security:#0F5F5C;--teal:#5C918D;--sand:#C8B27A;--text:#2F3437;--muted:#6B7280;--surface:#F6F7F5;--line:#E2E5DE;--danger:#A33A2B;--success:#3F7D5A;--warning:#B9852D;direction:rtl;color:var(--text);font-family:"Boutros Jazirah Text Light",var(--font-cairo),var(--font-ibm-arabic),Tahoma,sans-serif;font-size:14px;line-height:1.75}.report-sheet{background:#fff;border:1px solid var(--line);border-radius:10px;overflow:hidden}.report-cover{padding:28px 34px 22px;border-top:6px solid var(--security);background:linear-gradient(180deg,#fff 0%,#FAFAF8 100%)}.brand-line,.title-row,.summary-band,.result-head,.report-footer{display:flex;align-items:center;justify-content:space-between;gap:16px}.report-brand{display:flex;align-items:center;gap:10px}.report-brand img{width:46px;height:46px;object-fit:contain}.report-brand strong{display:block;color:var(--security);font-size:16px;font-weight:600}.report-brand span,.report-state span,.metric-card span,.info-item span,.field-box span,.report-footer{color:var(--muted);font-size:14px}.report-state{min-width:210px;border:1px solid var(--line);border-radius:8px;background:#fff;padding:10px 12px}.report-state strong{display:block;margin-top:2px;color:var(--text);font-size:14px;font-weight:600}.report-state em{display:inline-block;margin-top:6px;color:var(--success);font-style:normal;font-size:14px;font-weight:600}.title-row{margin-top:26px;align-items:flex-end}.title-row p{margin:0 0 6px;color:var(--sand);font-size:14px;font-weight:600}.title-row h1{margin:0;color:var(--security);font-size:16px;font-weight:600;line-height:1.7}.compliance-badge{min-width:132px;border:1px solid rgba(15,95,92,.18);border-radius:8px;background:rgba(15,95,92,.05);padding:10px 12px;text-align:center}.compliance-badge span{display:block;color:var(--muted);font-size:14px}.compliance-badge strong{display:block;color:var(--security);font-size:16px;font-weight:700}.summary-band{padding:14px 34px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--surface)}.metric-card{flex:1;border:1px solid var(--line);border-radius:8px;background:#fff;padding:10px 12px}.metric-card strong{display:block;margin-top:2px;color:var(--security);font-size:16px;font-weight:700}.metric-success strong{color:var(--success)}.metric-danger strong{color:var(--danger)}.metric-warning strong{color:var(--warning)}.section-block{padding:22px 34px;border-bottom:1px solid var(--line)}.section-title{display:flex;align-items:center;gap:10px;margin-bottom:14px}.section-title span{width:5px;height:24px;border-radius:999px;background:var(--sand)}.section-title h2{margin:0;color:var(--security);font-size:16px;font-weight:600}.info-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.info-item{border:1px solid var(--line);border-radius:8px;background:#fff;padding:9px 11px;min-height:60px}.info-item strong{display:block;margin-top:3px;color:var(--text);font-size:14px;font-weight:600;overflow-wrap:anywhere}.result-list{display:grid;gap:12px}.result-card{border:1px solid rgba(163,58,43,.22);border-right:4px solid var(--danger);border-radius:8px;background:#fff;padding:14px;break-inside:avoid;page-break-inside:avoid}.result-head{align-items:flex-start}.result-head span{color:var(--danger);font-size:14px;font-weight:600}.result-head h2{margin:3px 0;color:var(--text);font-size:15px;font-weight:600}.result-head p{margin:0;color:var(--muted);font-size:14px}.badges{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px}.status-badge,.importance-badge{border-radius:999px;padding:4px 9px;font-size:14px;font-weight:600}.status-badge{background:rgba(163,58,43,.08);color:var(--danger)}.importance-high{background:rgba(163,58,43,.09);color:var(--danger)}.importance-medium{background:rgba(185,133,45,.12);color:var(--warning)}.importance-low{background:rgba(92,145,141,.12);color:var(--teal)}.field-box{margin-top:10px;border-radius:8px;padding:10px 12px}.field-box span{display:block;margin-bottom:4px;font-weight:600}.field-box p{margin:0;color:var(--text);font-size:14px;line-height:1.9}.requirement{background:var(--surface);border:1px solid var(--line)}.two-columns{display:grid;grid-template-columns:1fr 1fr;gap:10px}.note{background:#FAFAF8;border:1px solid var(--line)}.action{background:rgba(15,95,92,.05);border:1px solid rgba(15,95,92,.16)}.references{margin-top:10px}.attachments-block{margin-top:12px}.attachments-block h3{margin:0 0 8px;color:var(--security);font-size:15px;font-weight:600}.attachments-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.attachment-item{border:1px solid var(--line);border-radius:8px;background:var(--surface);padding:8px}.attachment-item img{display:block;width:100%;max-height:170px;object-fit:contain;border-radius:6px;background:white}.attachment-item span{display:block;margin-top:6px;color:var(--muted);font-size:14px;overflow-wrap:anywhere}.empty-state{border:1px solid var(--line);border-radius:8px;background:var(--surface);padding:18px;color:var(--muted);text-align:center}.report-footer{padding:14px 34px;background:#fff}.no-print{direction:rtl}@page{size:A4;margin:12mm}@media print{body{background:#fff!important}.report-root{padding:0!important;max-width:none!important}.report-sheet{border:0;border-radius:0}.no-print{display:none!important}.report-cover,.section-block,.summary-band,.report-footer{padding-right:0;padding-left:0}.result-card{break-inside:avoid;page-break-inside:avoid}}@media(max-width:760px){.brand-line,.title-row,.summary-band,.result-head,.report-footer{align-items:stretch;flex-direction:column}.info-grid,.two-columns,.attachments-grid{grid-template-columns:1fr}.report-state{min-width:0}.section-block,.report-cover,.summary-band,.report-footer{padding-right:18px;padding-left:18px}}
`;