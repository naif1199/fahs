import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { Button, SecondaryButton } from "@/components/ui";
import { arDate, arDateTime, importanceLabel, pct, reportStatusLabel } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const REPORT_TITLE = "تقرير فحص مركز التحكم والمراقبة الأمنية";
const SYSTEM_NAME = "الفاحص الذكي";
const SYSTEM_SUBTITLE = "أداة التفتيش الأمنية الذكية";
const GENERATED_AT = new Date();

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

  const inspector = report.task.link.inspector;
  const facility = report.facility;
  const totalItems = report.compliantCount + report.nonCompliantCount;
  const high = report.observations.filter((item) => item.response.checklistItem.importance === "HIGH").length;
  const medium = report.observations.filter((item) => item.response.checklistItem.importance === "MEDIUM").length;
  const low = report.observations.filter((item) => item.response.checklistItem.importance === "LOW").length;
  const executiveState = getExecutiveState(report.complianceRate, report.notesCount, high);
  const priority = getPriority(report.complianceRate, high, medium, report.notesCount);
  const treatmentDays = priority === "عالية" ? "7 أيام عمل" : priority === "متوسطة" ? "15 يوم عمل" : "30 يوم عمل";

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

      <section className="report-page cover-page">
        <div className="cover-accent" />
        <div className="cover-top">
          <ReportBrand large />
          <div className="report-meta-box">
            <MetaLine label="رقم التقرير" value={report.reportNumber} />
            <MetaLine label="حالة التقرير" value={reportStatusLabel(report.status)} strong tone="success" />
            <MetaLine label="تاريخ التقرير" value={arDateTime(report.updatedAt)} />
          </div>
        </div>
        <div className="cover-title-block">
          <p className="eyebrow">تقرير رسمي</p>
          <h1>{REPORT_TITLE}</h1>
          <p className="cover-copy">يوثق هذا التقرير نتائج فحص مركز التحكم والمراقبة الأمنية، ومؤشرات المطابقة، والبنود غير المطابقة، والملاحظات، والإجراءات التصحيحية المقترحة وفق بيانات نظام الفاحص الذكي.</p>
        </div>
        <div className="cover-info-grid">
          <InfoTile label="اسم المنشأة" value={facility?.name} />
          <InfoTile label="المدينة" value={facility?.city} />
          <InfoTile label="نوع المنشأة" value={facility?.facilityType.name ?? facility?.classification} />
          <InfoTile label="اسم الفاحص" value={inspector.name} />
          <InfoTile label="الرقم الوظيفي" value={inspector.employeeNumber} />
        </div>
        <div className="cover-metrics">
          <ComplianceRing value={report.complianceRate} label="نسبة المطابقة" />
          <MetricCard label="عدد البنود المطابقة" value={report.compliantCount} tone="success" />
          <MetricCard label="عدد البنود غير المطابقة" value={report.nonCompliantCount} tone="danger" />
          <MetricCard label="عدد الملاحظات" value={report.notesCount} tone="warning" />
        </div>
      </section>

      <ReportPageFrame page={2}>
        <SectionTitle title="الملخص التنفيذي" />
        <p className="lead-text">يوثق هذا التقرير نتائج فحص مركز التحكم والمراقبة الأمنية للمنشأة، ويعرض مؤشرات المطابقة، والبنود غير المطابقة، والملاحظات، والإجراءات التصحيحية المقترحة وفق البيانات المدخلة في نظام الفاحص الذكي.</p>
        <div className="summary-grid">
          <InfoTile label="الحالة العامة" value={executiveState} tone={executiveState === "مقبول" ? "success" : executiveState === "يحتاج معالجة" ? "warning" : "danger"} />
          <InfoTile label="نسبة المطابقة" value={pct(report.complianceRate)} />
          <InfoTile label="عدد الملاحظات" value={report.notesCount} />
          <InfoTile label="عدد الملاحظات عالية الأهمية" value={high} tone={high > 0 ? "danger" : "success"} />
          <InfoTile label="أولوية المعالجة" value={priority} tone={priority === "عالية" ? "danger" : priority === "متوسطة" ? "warning" : "success"} />
          <InfoTile label="مدة المعالجة المقترحة" value={treatmentDays} />
        </div>
        <div className="executive-note">تعتمد القراءة التنفيذية على نسبة المطابقة وعدد الملاحظات ودرجة أهميتها. وتبقى المعالجة النهائية مرتبطة بما تثبته المنشأة من إجراءات تصحيحية ومستندات داعمة.</div>
      </ReportPageFrame>

      <ReportPageFrame page={3}>
        <SectionTitle title="بيانات المنشأة والفاحص" />
        <div className="data-card-grid">
          <DataCard title="بيانات المنشأة" rows={[["اسم المنشأة", facility?.name], ["المدينة", facility?.city], ["الحي", facility?.district], ["موقع المنشأة", facility?.location], ["نوع المنشأة", facility?.facilityType.name ?? facility?.classification], ["مستوى الحساسية", facility?.securitySensitivity], ["ممثل المنشأة", facility?.representativeName], ["رقم التواصل", facility?.contactNumber]]} />
          <DataCard title="بيانات الفحص" rows={[["رقم التقرير", report.reportNumber], ["تاريخ الزيارة", arDate(facility?.visitDate)], ["وقت الزيارة", `${facility?.startedAt ?? "غير متوفر"} - ${facility?.endedAt ?? "غير متوفر"}`], ["حالة التقرير", reportStatusLabel(report.status)], ["تاريخ الاعتماد", arDateTime(report.approvedAt)]]} />
          <DataCard title="بيانات الفاحص" rows={[["اسم الفاحص", inspector.name], ["الرقم الوظيفي", inspector.employeeNumber], ["الإدارة", inspector.department], ["التوقيع عند الاعتماد", "يعتمد في صفحة الاعتماد"]]} />
        </div>
      </ReportPageFrame>

      <ReportPageFrame page={4}>
        <SectionTitle title="المؤشرات والرسوم البيانية" />
        <div className="indicator-layout">
          <div className="indicator-main"><ComplianceRing value={report.complianceRate} label="دائرة نسبة المطابقة" /></div>
          <div className="mini-metrics">
            <MetricCard label="إجمالي البنود" value={totalItems} />
            <MetricCard label="البنود المطابقة" value={report.compliantCount} tone="success" />
            <MetricCard label="البنود غير المطابقة" value={report.nonCompliantCount} tone="danger" />
            <MetricCard label="الملاحظات" value={report.notesCount} tone="warning" />
          </div>
        </div>
        <div className="charts-grid">
          <ChartPanel title="توزيع البنود حسب نتيجة التقييم"><VerticalBars data={[{ label: "مطابق", value: report.compliantCount, color: "#3F7D5A" }, { label: "غير مطابق", value: report.nonCompliantCount, color: "#A33A2B" }]} max={Math.max(1, report.compliantCount, report.nonCompliantCount)} /></ChartPanel>
          <ChartPanel title="توزيع الملاحظات حسب الأهمية"><HorizontalBars data={[{ label: "عالية", value: high, color: "#A33A2B" }, { label: "متوسطة", value: medium, color: "#B9852D" }, { label: "منخفضة", value: low, color: "#5C918D" }]} max={Math.max(1, high, medium, low)} /></ChartPanel>
        </div>
      </ReportPageFrame>

      <ReportPageFrame page={5}>
        <SectionTitle title="البنود غير المطابقة والملاحظات" />
        <div className="observation-list">
          {report.observations.length ? report.observations.map((observation) => {
            const item = observation.response.checklistItem;
            const attachments = [...observation.response.attachments, ...observation.attachments];
            return (
              <article key={observation.id} className="observation-card">
                <div className="observation-head"><div><span className="item-number">البند {item.itemNumber}</span><h3>{item.mainSection}</h3><p>{item.subCategory}</p></div><span className={`importance-badge ${importanceClass(item.importance)}`}>{importanceLabel(item.importance)}</span></div>
                <div className="field-block requirement-block"><span>نص المتطلب</span><p>{item.requirementText}</p></div>
                <div className="note-grid"><div className="field-block muted-block"><span>ملاحظة الفاحص</span><p>{observation.note || observation.response.inspectorNote || "غير متوفرة"}</p></div><div className="field-block action-block"><span>الإجراءات التصحيحية المقترحة</span><p>{observation.correctiveAction || observation.response.correctiveAction || defaultCorrectiveAction}</p></div></div>
                <div className="reference-grid"><InfoTile label="المرجع النظامي" value={item.regulatoryReference || "غير متوفر"} /><InfoTile label="رقم المادة أو الفقرة" value={item.articleNumber || "غير متوفرة"} /></div>
                {attachments.length ? <div className="attachments-block"><h4>مرفق الفاحص</h4><div className="attachments-grid">{attachments.map((attachment) => <div key={attachment.id} className="attachment-item">{attachment.fileType.startsWith("image/") ? <img src={attachment.fileUrl} alt={attachment.fileName} /> : null}<span>{attachment.fileName}</span></div>)}</div></div> : null}
              </article>
            );
          }) : <EmptyOfficial message="لا توجد بنود غير مطابقة أو ملاحظات مسجلة في هذا التقرير." />}
        </div>
      </ReportPageFrame>

      <ReportPageFrame page={6}>
        <SectionTitle title="التوصيات التصحيحية" />
        <div className="recommendations-wrap"><table className="recommendations-table"><thead><tr><th>رقم البند</th><th>الملاحظة</th><th>الإجراء التصحيحي</th><th>الأولوية</th><th>المهلة المقترحة</th><th>حالة المعالجة</th></tr></thead><tbody>{report.observations.length ? report.observations.map((observation) => { const item = observation.response.checklistItem; const rowPriority = importanceLabel(item.importance); return <tr key={observation.id}><td>{item.itemNumber}</td><td>{observation.note || observation.response.inspectorNote || "غير متوفرة"}</td><td>{observation.correctiveAction || observation.response.correctiveAction || defaultCorrectiveAction}</td><td>{rowPriority}</td><td>{rowPriority === "عالية" ? "7 أيام عمل" : rowPriority === "متوسطة" ? "15 يوم عمل" : "30 يوم عمل"}</td><td>{observation.status === "CLOSED" ? "مغلقة" : observation.status === "IN_PROGRESS" ? "تحت المعالجة" : "مفتوحة"}</td></tr>; }) : <tr><td colSpan={6}>لا توجد توصيات تصحيحية لأن التقرير لا يحتوي على ملاحظات غير مطابقة.</td></tr>}</tbody></table></div>
      </ReportPageFrame>

      <ReportPageFrame page={7}>
        <SectionTitle title="الخاتمة والاعتماد" />
        <p className="lead-text">تم إعداد هذا التقرير بناءً على بيانات الفحص المدخلة في نظام الفاحص الذكي. وتعكس النتائج حالة المطابقة للبنود المطلوبة حسب نوع المنشأة ومستوى الحساسية الأمنية وقت الزيارة.</p>
        <div className="approval-grid"><ApprovalCard title="توقيع الفاحص" rows={[["اسم الفاحص", inspector.name], ["الرقم الوظيفي", inspector.employeeNumber], ["التاريخ", arDate(report.approvedAt ?? report.updatedAt)]]} /><ApprovalCard title="اعتماد المدير" rows={[["الاسم", "غير متوفر"], ["التوقيع", ""], ["التاريخ", arDate(report.approvedAt)]]} /></div>
        <div className="closing-stamp"><span>{SYSTEM_NAME}</span><p>تم توليد التقرير عبر نظام الفاحص الذكي</p></div>
      </ReportPageFrame>
    </main>
  );
}

const defaultCorrectiveAction = "استكمال المتطلب وفق المواصفة المعتمدة، وتزويد الجهة المختصة بما يثبت المعالجة خلال المدة المحددة.";

function ReportBrand({ large = false }: { large?: boolean }) { return <div className={`report-brand ${large ? "brand-large" : ""}`}><img src="/logo-mark.png" alt="شعار الفاحص الذكي" /><div><strong>{SYSTEM_NAME}</strong><span>{SYSTEM_SUBTITLE}</span></div></div>; }
function ReportPageFrame({ children, page }: { children: React.ReactNode; page: number }) { return <section className="report-page inner-page"><header className="report-header"><ReportBrand /><div><strong>{REPORT_TITLE}</strong><span>وثيقة رسمية</span></div></header><div className="report-content">{children}</div><footer className="report-footer"><span>صفحة {page} من 7</span><span>{arDate(GENERATED_AT)}</span><span>تم توليد التقرير عبر نظام الفاحص الذكي</span></footer></section>; }
function SectionTitle({ title }: { title: string }) { return <div className="section-title"><span /><h2>{title}</h2></div>; }
function MetaLine({ label, value, strong = false, tone }: { label: string; value?: string | number | null; strong?: boolean; tone?: "success" | "warning" | "danger" }) { return <div className="meta-line"><span>{label}</span><b className={`${strong ? "strong" : ""} ${tone ? `tone-${tone}` : ""}`}>{value ?? "غير متوفر"}</b></div>; }
function InfoTile({ label, value, tone }: { label: string; value?: string | number | null; tone?: "success" | "warning" | "danger" }) { return <div className={`info-tile ${tone ? `tile-${tone}` : ""}`}><span>{label}</span><strong>{value === null || value === undefined || value === "" ? "غير متوفر" : value}</strong></div>; }
function MetricCard({ label, value, tone }: { label: string; value: string | number; tone?: "success" | "warning" | "danger" }) { return <div className={`metric-card ${tone ? `metric-${tone}` : ""}`}><span>{label}</span><strong>{value}</strong></div>; }
function ComplianceRing({ value, label }: { value: number; label: string }) { const safe = Math.max(0, Math.min(100, Math.round(value))); return <div className="compliance-ring-wrap"><div className="compliance-ring" style={{ background: `conic-gradient(#0F5F5C ${safe * 3.6}deg, #E7E9E4 0deg)` }}><div><strong>{safe}%</strong><span>{label}</span></div></div></div>; }
function DataCard({ title, rows }: { title: string; rows: Array<[string, string | number | null | undefined]> }) { return <div className="data-card"><h3>{title}</h3><div className="data-rows">{rows.map(([label, value]) => <InfoTile key={label} label={label} value={value} />)}</div></div>; }
function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) { return <div className="chart-panel"><h3>{title}</h3>{children}</div>; }
function VerticalBars({ data, max }: { data: Array<{ label: string; value: number; color: string }>; max: number }) { return <div className="vertical-bars">{data.map((item) => <div key={item.label} className="vertical-bar-item"><div className="vertical-track"><span style={{ height: `${Math.max(4, (item.value / max) * 100)}%`, backgroundColor: item.color }} /></div><strong>{item.value}</strong><p>{item.label}</p></div>)}</div>; }
function HorizontalBars({ data, max }: { data: Array<{ label: string; value: number; color: string }>; max: number }) { return <div className="horizontal-bars">{data.map((item) => <div key={item.label} className="horizontal-bar-row"><div className="bar-label"><span>{item.label}</span><strong>{item.value}</strong></div><div className="horizontal-track"><span style={{ width: `${Math.max(4, (item.value / max) * 100)}%`, backgroundColor: item.color }} /></div></div>)}</div>; }
function ApprovalCard({ title, rows }: { title: string; rows: Array<[string, string | number | null | undefined]> }) { return <div className="approval-card"><h3>{title}</h3><div className="signature-box" />{rows.map(([label, value]) => <InfoTile key={label} label={label} value={value} />)}</div>; }
function EmptyOfficial({ message }: { message: string }) { return <div className="empty-official">{message}</div>; }
function getExecutiveState(rate: number, notes: number, high: number) { if (rate >= 85 && high === 0) return "مقبول"; if (rate >= 60 || notes > 0) return "يحتاج معالجة"; return "غير مقبول"; }
function getPriority(rate: number, high: number, medium: number, notes: number) { if (high > 0 || rate < 70) return "عالية"; if (medium > 0 || notes > 0) return "متوسطة"; return "منخفضة"; }
function importanceClass(value: string) { return value === "HIGH" ? "importance-high" : value === "MEDIUM" ? "importance-medium" : "importance-low"; }

const reportCss = `
.report-root{--security:#0F5F5C;--teal:#5C918D;--sand:#C8B27A;--text:#2F3437;--muted:#6B7280;--surface:#F6F7F5;--white:#FFFFFF;--danger:#A33A2B;--success:#3F7D5A;--warning:#B9852D;direction:rtl;color:var(--text);font-family:"Boutros Jazirah Text Light",var(--font-cairo),var(--font-ibm-arabic),Tahoma,sans-serif;font-size:14px;line-height:1.75}.report-page{position:relative;min-height:1120px;margin:0 auto 24px;overflow:hidden;background:var(--white);border:1px solid #E5E7E2;color:var(--text);page-break-after:always}.cover-page{padding:44px}.inner-page{padding:34px 38px 60px}.cover-accent{position:absolute;inset:0 0 auto;height:7px;background:linear-gradient(90deg,var(--security),var(--teal),var(--sand))}.cover-top,.report-header,.report-footer,.observation-head,.bar-label{display:flex;align-items:center;justify-content:space-between;gap:16px}.report-brand{display:flex;align-items:center;gap:10px}.report-brand img{width:42px;height:42px;object-fit:contain}.report-brand strong{display:block;color:var(--security);font-size:16px;font-weight:600}.report-brand span{display:block;color:var(--muted);font-size:14px}.brand-large img{width:70px;height:70px}.report-meta-box{width:280px;border:1px solid #E2E5DE;border-radius:8px;background:var(--surface);padding:12px}.meta-line{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:5px 0;border-bottom:1px solid #E2E5DE}.meta-line:last-child{border-bottom:0}.meta-line span,.info-tile span,.metric-card span{color:var(--muted);font-size:14px}.meta-line b,.info-tile strong,.metric-card strong{color:var(--text);font-size:14px;font-weight:600}.meta-line .strong{font-size:15px}.tone-success,.tile-success strong,.metric-success strong{color:var(--success)!important}.tone-warning,.tile-warning strong,.metric-warning strong{color:var(--warning)!important}.tone-danger,.tile-danger strong,.metric-danger strong{color:var(--danger)!important}.cover-title-block{margin-top:72px;max-width:700px}.eyebrow{margin:0 0 8px;color:var(--sand);font-size:14px;font-weight:600}h1{margin:0;color:var(--security);font-size:16px;font-weight:600;line-height:1.7}.cover-copy,.lead-text{color:var(--muted);font-size:14px;line-height:2}.cover-info-grid,.summary-grid,.reference-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:26px}.cover-metrics{display:grid;grid-template-columns:1.15fr repeat(3,1fr);gap:12px;margin-top:34px;align-items:stretch}.info-tile,.metric-card{border:1px solid #E2E5DE;border-radius:8px;background:var(--surface);padding:10px 12px;min-height:68px}.info-tile strong,.metric-card strong{display:block;margin-top:4px}.metric-card strong{font-size:16px;color:var(--security)}.compliance-ring-wrap{display:grid;place-items:center;border:1px solid #E2E5DE;border-radius:8px;background:var(--surface);padding:12px}.compliance-ring{display:grid;place-items:center;width:142px;height:142px;border-radius:999px}.compliance-ring>div{display:grid;place-items:center;width:104px;height:104px;border-radius:999px;background:var(--white);border:1px solid #E2E5DE;text-align:center}.compliance-ring strong{color:var(--security);font-size:16px;font-weight:600}.compliance-ring span{color:var(--muted);font-size:14px}.report-header{padding-bottom:14px;border-bottom:1px solid #E2E5DE}.report-header>div:last-child{text-align:left}.report-header strong{display:block;color:var(--security);font-size:15px;font-weight:600}.report-header span{color:var(--muted);font-size:14px}.report-content{padding-top:24px}.report-footer{position:absolute;inset:auto 38px 24px;border-top:1px solid #E2E5DE;padding-top:10px;color:var(--muted);font-size:14px}.section-title{display:flex;align-items:center;gap:10px;margin-bottom:18px}.section-title span{width:6px;height:26px;border-radius:999px;background:var(--sand)}.section-title h2{margin:0;color:var(--security);font-size:16px;font-weight:600}.executive-note,.empty-official,.closing-stamp{margin-top:22px;border:1px solid #E2E5DE;border-radius:8px;background:#FAFAF8;padding:14px;color:var(--muted)}.data-card-grid{display:grid;gap:14px}.data-card,.chart-panel,.approval-card{border:1px solid #E2E5DE;border-radius:8px;background:var(--white);padding:14px}.data-card h3,.chart-panel h3,.approval-card h3{margin:0 0 12px;color:var(--security);font-size:15px;font-weight:600}.data-rows{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.indicator-layout{display:grid;grid-template-columns:240px 1fr;gap:16px;align-items:stretch}.indicator-main .compliance-ring-wrap{height:100%}.mini-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.charts-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px}.vertical-bars{display:flex;align-items:end;justify-content:center;gap:34px;height:230px;padding-top:16px}.vertical-bar-item{text-align:center;color:var(--muted);font-size:14px}.vertical-track{display:flex;align-items:end;width:46px;height:150px;margin:0 auto 8px;border-radius:8px;background:var(--surface);overflow:hidden}.vertical-track span{display:block;width:100%;border-radius:8px 8px 0 0}.vertical-bar-item strong{display:block;color:var(--text);font-size:16px}.horizontal-bars{display:grid;gap:18px;padding-top:16px}.horizontal-track{height:14px;border-radius:999px;background:var(--surface);overflow:hidden}.horizontal-track span{display:block;height:100%;border-radius:999px}.observation-list{display:grid;gap:12px}.observation-card{border:1px solid rgba(163,58,43,.22);border-right:5px solid var(--danger);border-radius:8px;padding:14px;page-break-inside:avoid}.observation-head{align-items:flex-start}.item-number{color:var(--danger);font-size:14px;font-weight:600}.observation-head h3{margin:3px 0;color:var(--text);font-size:15px;font-weight:600}.observation-head p{margin:0;color:var(--muted)}.importance-badge{border-radius:999px;padding:4px 10px;font-size:14px;font-weight:600}.importance-high{background:rgba(163,58,43,.09);color:var(--danger)}.importance-medium{background:rgba(185,133,45,.12);color:var(--warning)}.importance-low{background:rgba(92,145,141,.12);color:var(--teal)}.field-block{margin-top:10px;border-radius:8px;padding:10px 12px}.field-block span{display:block;margin-bottom:4px;color:var(--muted);font-size:14px;font-weight:600}.field-block p{margin:0;font-size:14px;color:var(--text);line-height:1.9}.requirement-block{background:var(--surface);border:1px solid #E2E5DE}.note-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.muted-block{background:#FAFAF8;border:1px solid #E2E5DE}.action-block{background:rgba(15,95,92,.05);border:1px solid rgba(15,95,92,.16)}.attachments-block{margin-top:12px}.attachments-block h4{margin:0 0 8px;color:var(--security);font-size:15px;font-weight:600}.attachments-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.attachment-item{border:1px solid #E2E5DE;border-radius:8px;padding:8px;background:var(--surface)}.attachment-item img{display:block;width:100%;max-height:180px;object-fit:contain;border-radius:6px;background:white}.attachment-item span{display:block;margin-top:6px;color:var(--muted);font-size:14px}.recommendations-wrap{overflow:hidden;border:1px solid #E2E5DE;border-radius:8px}.recommendations-table{width:100%;border-collapse:collapse;direction:rtl;font-size:14px}.recommendations-table th{background:var(--surface);color:var(--security);font-weight:600}.recommendations-table th,.recommendations-table td{border-bottom:1px solid #E2E5DE;padding:10px;text-align:right;vertical-align:top}.recommendations-table tr:last-child td{border-bottom:0}.approval-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:24px}.signature-box{height:92px;border:1px dashed #C8CEC7;border-radius:8px;background:var(--surface);margin-bottom:12px}.closing-stamp{text-align:center}.closing-stamp span{display:block;color:var(--security);font-size:16px;font-weight:600}.closing-stamp p{margin:4px 0 0}@page{size:A4;margin:0}@media print{body{background:white!important}.report-root{padding:0!important;max-width:none!important}.report-page{width:210mm;min-height:297mm;margin:0;border:0;page-break-after:always;break-after:page}.report-page:last-child{page-break-after:auto;break-after:auto}.no-print{display:none!important}}
`;