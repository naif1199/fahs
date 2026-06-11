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

  const link = report.task?.link;
  const inspector = link?.inspector;
  const facility = report.facility;
  const totalItems = report.compliantCount + report.nonCompliantCount;
  const observations = report.observations;
  const highNotes = observations.filter((observation) => observation.response.checklistItem.importance === "HIGH").length;

  return (
    <main className="report-root mx-auto max-w-5xl p-4 lg:p-8 print:max-w-none print:p-0">
      <div className="no-print mb-4 flex justify-between gap-3">
        <SecondaryButton href="/admin/reports">رجوع للتقارير</SecondaryButton>
        <div className="flex gap-3">
          <Button href={`/api/reports/${report.id}/pdf`}>تصدير PDF</Button>
          <PrintButton />
        </div>
      </div>
      <style>{reportCss}</style>
      <article className="report-sheet">
        <header className="official-header">
          <div className="brand-block">
            <img src="/logo-mark.png" alt="شعار الفاحص الذكي" />
            <div>
              <strong>{SYSTEM_NAME}</strong>
              <span>{SYSTEM_SUBTITLE}</span>
            </div>
          </div>
          <div className="header-copy">
            <p>تقرير رسمي</p>
            <h1>{REPORT_TITLE}</h1>
            <div className="report-meta-line">
              <span>{report.reportNumber}</span>
              <span>{reportStatusLabel(report.status)}</span>
              <span>{arDate(GENERATED_AT)}</span>
            </div>
          </div>
          <div className="score-seal">
            <span>نسبة المطابقة</span>
            <strong>{pct(report.complianceRate)}</strong>
          </div>
        </header>

        <section className="kpi-strip" aria-label="ملخص التقرير">
          <Metric label="إجمالي البنود" value={totalItems} />
          <Metric label="مطابق" value={report.compliantCount} tone="success" />
          <Metric label="غير مطابق" value={report.nonCompliantCount} tone="danger" />
          <Metric label="الملاحظات" value={report.notesCount} tone="warning" />
          <Metric label="عالية الأهمية" value={highNotes} tone="danger" />
        </section>

        <section className="compact-section">
          <SectionTitle title="بيانات المنشأة والفحص" />
          <div className="data-matrix">
            <Info label="اسم المنشأة" value={facility?.name} />
            <Info label="المدينة" value={facility?.city} />
            <Info label="نوع المنشأة" value={facility?.facilityType?.name ?? facility?.classification} />
            <Info label="مستوى الحساسية" value={facility?.securitySensitivity} />
            <Info label="تاريخ الزيارة" value={arDate(facility?.visitDate)} />
            <Info label="وقت الزيارة" value={`${facility?.startedAt ?? "غير متوفر"} - ${facility?.endedAt ?? "غير متوفر"}`} />
            <Info label="دفعة الفحص" value={link?.week?.name} />
            <Info label="اسم الفاحص" value={inspector?.name} />
            <Info label="الرقم الوظيفي" value={inspector?.employeeNumber} />
            <Info label="تاريخ التوليد" value={arDateTime(GENERATED_AT)} />
          </div>
        </section>

        <section className="compact-section results-section">
          <SectionTitle title="نتائج نموذج الفاحص" />
          {observations.length ? (
            <table className="results-table">
              <thead>
                <tr>
                  <th>البند</th>
                  <th>القسم والتصنيف</th>
                  <th>الأهمية</th>
                  <th>المتطلب</th>
                  <th>ملاحظة الفاحص</th>
                  <th>الإجراء التصحيحي المقترح</th>
                  <th>المرجع</th>
                </tr>
              </thead>
              <tbody>
                {observations.map((observation) => {
                  const item = observation.response.checklistItem;
                  return (
                    <tr key={observation.id}>
                      <td><strong>{item.itemNumber}</strong><span>غير مطابق</span></td>
                      <td><strong>{item.mainSection}</strong><span>{item.subCategory}</span></td>
                      <td><b className={`importance-pill ${importanceClass(item.importance)}`}>{importanceLabel(item.importance)}</b></td>
                      <td>{item.requirementText}</td>
                      <td>{observation.note || observation.response.inspectorNote || "غير متوفرة"}</td>
                      <td>{observation.correctiveAction || observation.response.correctiveAction || defaultCorrectiveAction}</td>
                      <td><strong>{item.regulatoryReference || "غير متوفر"}</strong><span>{item.articleNumber || "غير متوفرة"}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">لا توجد بنود غير مطابقة أو ملاحظات مسجلة في هذا التقرير.</div>
          )}
        </section>

        <Attachments observations={observations} />

        <footer className="approval-footer">
          <p>تم إعداد هذا التقرير بناءً على بيانات الفحص المدخلة في نظام الفاحص الذكي، وتعكس النتائج حالة المطابقة وقت الزيارة.</p>
          <div className="signatures">
            <Info label="توقيع الفاحص" value={inspector?.name} />
            <Info label="الرقم الوظيفي" value={inspector?.employeeNumber} />
            <Info label="تاريخ التقرير" value={arDate(GENERATED_AT)} />
          </div>
          <small>تم توليد التقرير عبر نظام الفاحص الذكي</small>
        </footer>
      </article>
    </main>
  );
}

function Attachments({ observations }: { observations: any[] }) {
  const items = observations.flatMap((observation) => [...observation.response.attachments, ...observation.attachments].map((attachment) => ({ ...attachment, itemNumber: observation.response.checklistItem.itemNumber })));
  if (!items.length) return null;
  return (
    <section className="compact-section attachment-section">
      <SectionTitle title="مرفقات الفاحص" />
      <div className="attachment-grid">
        {items.map((attachment) => (
          <div key={attachment.id} className="attachment-card">
            <span>البند {attachment.itemNumber}</span>
            {attachment.fileType.startsWith("image/") ? <img src={attachment.fileUrl} alt={attachment.fileName} /> : null}
            <strong>{attachment.fileName}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionTitle({ title }: { title: string }) { return <div className="section-title"><span /> <h2>{title}</h2></div>; }
function Metric({ label, value, tone }: { label: string; value: string | number; tone?: "success" | "warning" | "danger" }) { return <div className={`metric ${tone ? `metric-${tone}` : ""}`}><span>{label}</span><strong>{value}</strong></div>; }
function Info({ label, value }: { label: string; value?: string | number | null }) { const display = value === null || value === undefined || value === "" ? "غير متوفر" : value; return <div className="info-pair"><span>{label}</span><strong>{display}</strong></div>; }
function importanceClass(value: string) { if (value === "HIGH") return "importance-high"; if (value === "MEDIUM") return "importance-medium"; return "importance-low"; }

const reportCss = `
.report-root{--security:#0F5F5C;--teal:#5C918D;--sand:#C8B27A;--text:#2F3437;--muted:#6B7280;--surface:#F6F7F5;--warm:#FEFEFC;--line:#DDE3DD;--danger:#A33A2B;--success:#3F7D5A;--warning:#B9852D;direction:rtl;color:var(--text);font-family:"Boutros Jazirah Text Light",var(--font-cairo),var(--font-ibm-arabic),Tahoma,sans-serif;font-size:14px;line-height:1.55}.report-sheet{background:var(--warm);border:1px solid var(--line);border-radius:8px;overflow:hidden}.official-header{display:grid;grid-template-columns:210px 1fr 128px;gap:18px;align-items:center;padding:18px 22px 16px;border-top:5px solid var(--security);border-bottom:1px solid var(--line);background:#fff}.brand-block{display:flex;align-items:center;gap:12px}.brand-block img{width:82px;height:82px;object-fit:contain}.brand-block strong{display:block;color:var(--security);font-size:16px;font-weight:800}.brand-block span,.header-copy p,.report-meta-line,.metric span,.info-pair span,.results-table span,.approval-footer small{color:var(--muted);font-size:12.5px}.header-copy{text-align:center}.header-copy p{margin:0 0 4px;color:var(--sand);font-weight:700}.header-copy h1{margin:0;color:var(--security);font-size:16px;font-weight:800;line-height:1.7}.report-meta-line{display:flex;justify-content:center;gap:10px;margin-top:7px}.report-meta-line span{border:1px solid var(--line);border-radius:999px;padding:3px 10px;background:var(--surface)}.score-seal{border:1px solid rgba(15,95,92,.22);border-radius:999px;background:rgba(15,95,92,.06);aspect-ratio:1;display:grid;place-content:center;text-align:center}.score-seal span{color:var(--muted);font-size:12px}.score-seal strong{color:var(--security);font-size:16px;font-weight:900}.kpi-strip{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;padding:10px 22px;background:var(--surface);border-bottom:1px solid var(--line)}.metric{border:1px solid var(--line);border-radius:7px;background:#fff;padding:7px 9px}.metric strong{display:block;margin-top:1px;color:var(--security);font-size:16px;font-weight:900}.metric-success strong{color:var(--success)}.metric-danger strong{color:var(--danger)}.metric-warning strong{color:var(--warning)}.compact-section{padding:13px 22px;border-bottom:1px solid var(--line)}.section-title{display:flex;align-items:center;gap:8px;margin-bottom:9px}.section-title span{width:22px;height:3px;border-radius:999px;background:var(--sand)}.section-title h2{margin:0;color:var(--security);font-size:15px;font-weight:800}.data-matrix{display:grid;grid-template-columns:repeat(2,1fr);border:1px solid var(--line);border-bottom:0;border-left:0;background:#fff}.info-pair{display:grid;grid-template-columns:120px 1fr;gap:8px;align-items:start;min-height:34px;padding:7px 9px;border-bottom:1px solid var(--line);border-left:1px solid var(--line)}.info-pair strong{font-size:13.5px;font-weight:800;overflow-wrap:anywhere}.results-table{width:100%;border-collapse:collapse;table-layout:fixed;background:#fff;border:1px solid var(--line)}.results-table th{background:#EEF2EF;color:var(--security);font-size:12.5px;font-weight:900;padding:7px 6px;border:1px solid var(--line);text-align:right}.results-table td{vertical-align:top;color:var(--text);font-size:12.5px;line-height:1.55;padding:7px 6px;border:1px solid var(--line);overflow-wrap:anywhere}.results-table th:nth-child(1){width:7%}.results-table th:nth-child(2){width:14%}.results-table th:nth-child(3){width:9%}.results-table th:nth-child(4){width:22%}.results-table th:nth-child(5){width:16%}.results-table th:nth-child(6){width:22%}.results-table th:nth-child(7){width:10%}.results-table td strong{display:block;font-weight:900}.importance-pill{display:inline-block;border-radius:999px;padding:3px 7px;font-size:12px;font-weight:900}.importance-high{background:rgba(163,58,43,.09);color:var(--danger)}.importance-medium{background:rgba(185,133,45,.13);color:var(--warning)}.importance-low{background:rgba(92,145,141,.13);color:var(--teal)}.empty-state{border:1px solid var(--line);border-radius:7px;background:#fff;padding:14px;text-align:center;color:var(--muted)}.attachment-section{break-before:auto}.attachment-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.attachment-card{border:1px solid var(--line);border-radius:7px;background:#fff;padding:7px}.attachment-card img{display:block;width:100%;max-height:118px;object-fit:contain;border-radius:5px;background:var(--surface)}.attachment-card span,.attachment-card strong{display:block;font-size:12px;overflow-wrap:anywhere}.attachment-card span{color:var(--danger);font-weight:800}.attachment-card strong{margin-top:4px;color:var(--muted)}.approval-footer{padding:11px 22px 14px;background:#fff}.approval-footer p{margin:0 0 9px;color:var(--text);font-size:13px}.signatures{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--line);border-right:1px solid var(--line)}.signatures .info-pair{grid-template-columns:90px 1fr;border-right:0;border-top:0}.approval-footer small{display:block;margin-top:8px;text-align:center}.no-print{direction:rtl}@page{size:A4;margin:9mm}@media print{html,body{background:#fff!important}.report-root{padding:0!important;max-width:none!important;font-size:12.5px;line-height:1.45}.report-sheet{border:0;border-radius:0}.no-print{display:none!important}.official-header{padding:0 0 9px;grid-template-columns:190px 1fr 112px}.brand-block img{width:74px;height:74px}.compact-section{padding:9px 0}.kpi-strip{padding:8px 0}.approval-footer{padding:9px 0 0}.results-table tr{break-inside:avoid;page-break-inside:avoid}.results-table th,.results-table td{font-size:11.6px;padding:5px 5px}.data-matrix{grid-template-columns:repeat(2,1fr)}.info-pair{min-height:30px;padding:5px 7px}.attachment-card img{max-height:95px}}@media(max-width:760px){.official-header{grid-template-columns:1fr;text-align:center}.brand-block{justify-content:center}.kpi-strip{grid-template-columns:repeat(2,1fr)}.data-matrix,.signatures{grid-template-columns:1fr}.results-table{display:block;overflow-x:auto;white-space:normal}.report-meta-line{flex-wrap:wrap}.score-seal{width:120px;margin:auto}.info-pair{grid-template-columns:105px 1fr}.attachment-grid{grid-template-columns:1fr}}
`;