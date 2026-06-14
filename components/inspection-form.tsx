"use client";

import { useMemo, useState, useTransition } from "react";
import type { ChecklistItem, Facility, FacilityType, InspectionResponse, InspectionTask } from "@prisma/client";
import { Logo } from "@/components/logo";
import { Badge, Button, Card, Field, SecondaryButton, inputClass } from "@/components/ui";
import { importanceLabel } from "@/lib/format";

type ResponseWithItem = InspectionResponse & { checklistItem: ChecklistItem; attachments: { fileName: string; fileUrl: string }[] };
type ReportData = { id: string; status: string; facility: Facility | null; responses: ResponseWithItem[] };
type FormItem = ChecklistItem & { facilityType: FacilityType | null };
type DraftResponse = { status?: "COMPLIANT" | "NON_COMPLIANT"; note?: string; correctiveAction?: string; attachmentName?: string };

export function InspectionForm({ token, task, report, facilityTypes, checklistItems }: { token: string; task: InspectionTask & { link: { inspector: { name: string; employeeNumber: string }; week: { name: string } } }; report: ReportData; facilityTypes: FacilityType[]; checklistItems: FormItem[] }) {
  const [facilityTypeId, setFacilityTypeId] = useState(report.facility?.facilityTypeId ?? facilityTypes[0]?.id ?? "");
  const [sensitivity, setSensitivity] = useState(report.facility?.securitySensitivity ?? facilityTypes[0]?.defaultSensitivity ?? "متوسطة");
  const [responses, setResponses] = useState<Record<string, DraftResponse>>(() => Object.fromEntries(report.responses.map((r) => [r.checklistItemId, { status: r.evaluationStatus, note: r.inspectorNote ?? "", correctiveAction: r.correctiveAction ?? "", attachmentName: r.attachments[0]?.fileName }])));
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const selectedType = facilityTypes.find((t) => t.id === facilityTypeId);
  const visibleItems = useMemo(() => checklistItems.filter((i) => (!i.facilityTypeId || i.facilityTypeId === facilityTypeId) && (i.sensitivityLevel === sensitivity || sensitivity === "عالية")), [checklistItems, facilityTypeId, sensitivity]);
  const sections = useMemo(() => {
    const grouped = new Map<string, FormItem[]>();
    visibleItems.forEach((item) => {
      const key = item.sourceSheet || item.mainSection || "معايير الفحص";
      grouped.set(key, [...(grouped.get(key) ?? []), item]);
    });
    return [...grouped.entries()].map(([title, items], index) => ({ title: `${index + 2}: ${title}`, items }));
  }, [visibleItems]);
  const nonCompliant = visibleItems.filter((i) => responses[i.id]?.status === "NON_COMPLIANT");
  const compliantCount = visibleItems.filter((i) => responses[i.id]?.status === "COMPLIANT").length;
  const totalAnswered = compliantCount + nonCompliant.length;
  const complianceRate = totalAnswered ? Math.round((compliantCount / totalAnswered) * 100) : 0;
  const completed = totalAnswered === visibleItems.length && visibleItems.length > 0;

  function update(id: string, next: DraftResponse) {
    setResponses((current) => ({ ...current, [id]: { ...current[id], ...next } }));
  }

  async function submit(formData: FormData, approve = false) {
    setMessage("");
    const payload = {
      reportId: report.id,
      taskId: task.id,
      approve,
      facility: Object.fromEntries(formData.entries()),
      responses: visibleItems.map((item) => ({ checklistItemId: item.id, ...responses[item.id] })).filter((r) => r.status)
    };
    const res = await fetch("/api/reports/save", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!data.ok) return setMessage(data.error ?? "تعذر الحفظ");
    setMessage(approve ? "تم اعتماد التقرير وقفل المهمة." : "تم حفظ المسودة داخل النظام.");
    if (approve) window.location.href = `/reports/${report.id}`;
  }

  return (
    <main className="mx-auto max-w-7xl p-4 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><Logo /><SecondaryButton href={`/w/${token}/tasks`}>رجوع إلى مهامي</SecondaryButton></div>
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <form action={(fd) => startTransition(() => submit(fd, false))} className="space-y-6">
          <Card><h1 className="text-2xl font-black text-official">نموذج فحص مركز التحكم والمراقبة الأمنية</h1><p className="mt-2 text-muted">المهمة رقم {task.number} · {task.link.inspector.name} · {task.link.week.name}</p></Card>
          <Card>
            <h2 className="mb-4 text-xl font-black text-official">أولًا: بيانات المنشأة</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="اسم المنشأة"><input name="name" defaultValue={report.facility?.name ?? ""} className={inputClass} required /></Field>
              <Field label="موقع المنشأة"><input name="location" defaultValue={report.facility?.location ?? ""} className={inputClass} required /></Field>
              <Field label="المدينة"><input name="city" defaultValue={report.facility?.city ?? ""} className={inputClass} required /></Field>
              <Field label="الحي"><input name="district" defaultValue={report.facility?.district ?? ""} className={inputClass} required /></Field>
              <Field label="نوع المنشأة"><select name="facilityTypeId" value={facilityTypeId} onChange={(e) => { setFacilityTypeId(e.target.value); setSensitivity(facilityTypes.find((t) => t.id === e.target.value)?.defaultSensitivity ?? "متوسطة"); }} className={inputClass}>{facilityTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
              <Field label="تصنيف المنشأة"><input name="classification" defaultValue={report.facility?.classification ?? selectedType?.name ?? ""} className={inputClass} /></Field>
              <Field label="مستوى الحساسية الأمنية"><select name="securitySensitivity" value={sensitivity} onChange={(e) => setSensitivity(e.target.value)} className={inputClass}><option>عالية</option><option>متوسطة</option><option>منخفضة</option></select></Field>
              <Field label="اسم ممثل المنشأة"><input name="representativeName" defaultValue={report.facility?.representativeName ?? ""} className={inputClass} required /></Field>
              <Field label="رقم التواصل"><input name="contactNumber" defaultValue={report.facility?.contactNumber ?? ""} className={inputClass} required /></Field>
              <Field label="تاريخ الزيارة"><input name="visitDate" type="date" defaultValue={report.facility?.visitDate ? new Date(report.facility.visitDate).toISOString().slice(0, 10) : ""} className={inputClass} required /></Field>
              <Field label="وقت بداية الفحص"><input name="startedAt" type="time" defaultValue={report.facility?.startedAt ?? ""} className={inputClass} required /></Field>
              <Field label="وقت نهاية الفحص"><input name="endedAt" type="time" defaultValue={report.facility?.endedAt ?? ""} className={inputClass} required /></Field>
              <Field label="ملاحظات عامة"><textarea name="generalNotes" defaultValue={report.facility?.generalNotes ?? ""} className={inputClass + " md:col-span-3"} /></Field>
            </div>
          </Card>

          {sections.map((section) => <ChecklistSection key={section.title} title={section.title} items={section.items} responses={responses} update={update} />)}

          <Card>
            <h2 className="mb-4 text-xl font-black text-official">سادسًا: الملاحظات التلقائية</h2>
            <div className="grid gap-4">
              {nonCompliant.length ? nonCompliant.map((item) => <ObservationPreview key={item.id} item={item} response={responses[item.id]} />) : <p className="text-muted">لا توجد ملاحظات حتى الآن.</p>}
            </div>
          </Card>

          <Card>
            <div className="flex flex-wrap gap-3">
              <Button type="submit">حفظ كمسودة</Button>
              <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-security/20 bg-white px-5 py-2.5 text-sm font-bold text-security">استكمال لاحقًا</button>
               <button type="button" className="inline-flex min-h-11 items-center rounded-2xl bg-success px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40" onClick={(e) => { const form = e.currentTarget.closest("form"); if (form) startTransition(() => submit(new FormData(form), true)); }} disabled={!completed}>اعتماد هذا الفحص</button>
              <SecondaryButton href={`/reports/${report.id}`}>تصدير PDF / طباعة التقرير</SecondaryButton>
              {message ? <span className="self-center text-sm font-bold text-security">{message}</span> : null}
              {isPending ? <span className="self-center text-sm text-muted">جار الحفظ...</span> : null}
              {!completed ? <span className="self-center text-sm text-muted">اعتماد هذا الفحص يتطلب إكمال بنود هذه المهمة فقط.</span> : null}
            </div>
          </Card>
        </form>

        <aside className="xl:sticky xl:top-8 xl:self-start">
          <Card className="print-card"><h2 className="text-xl font-black text-official">ملخص هذا الفحص</h2><p className="mt-2 text-sm text-muted">كل مهمة تصدر تقريرًا مستقلًا وتعتمد منفصلة عن بقية المهام.</p><div className="mt-5 grid gap-3 text-sm"><Summary label="إجمالي البنود" value={visibleItems.length} /><Summary label="عدد البنود المطابقة" value={compliantCount} /><Summary label="عدد البنود غير المطابقة" value={nonCompliant.length} /><Summary label="نسبة المطابقة" value={`${complianceRate}%`} /><Summary label="عدد الملاحظات" value={nonCompliant.length} /><Summary label="ملاحظات عالية الأهمية" value={nonCompliant.filter((i) => i.importance === "HIGH").length} /><Summary label="حالة النموذج" value={completed ? "مكتمل" : totalAnswered ? "قيد العمل" : "غير مكتمل"} /><Summary label="البنود المتبقية" value={visibleItems.length - totalAnswered} /></div></Card>
        </aside>
      </div>
    </main>
  );
}

function ChecklistSection({ title, items, responses, update }: { title: string; items: FormItem[]; responses: Record<string, DraftResponse>; update: (id: string, next: DraftResponse) => void }) {
  return <Card><h2 className="mb-4 text-xl font-black text-official">{title}</h2><div className="grid gap-4">{items.map((item) => <div key={item.id} className="rounded-3xl border border-slate-200 bg-soft/60 p-4"><div className="mb-3 flex flex-wrap items-center gap-2"><Badge tone="security">{item.itemNumber}</Badge><Badge tone={item.importance === "HIGH" ? "danger" : item.importance === "MEDIUM" ? "warning" : "muted"}>{importanceLabel(item.importance)}</Badge><span className="text-sm font-bold text-muted">{item.subCategory}</span></div><p className="mb-4 font-bold leading-8 text-charcoal">{item.requirementText}</p><div className="flex flex-wrap gap-3"><label className="flex cursor-pointer items-center gap-2 rounded-2xl bg-white px-4 py-3 font-bold"><input type="radio" checked={responses[item.id]?.status === "COMPLIANT"} onChange={() => update(item.id, { status: "COMPLIANT", note: "", correctiveAction: "" })} />مطابق</label><label className="flex cursor-pointer items-center gap-2 rounded-2xl bg-white px-4 py-3 font-bold"><input type="radio" checked={responses[item.id]?.status === "NON_COMPLIANT"} onChange={() => update(item.id, { status: "NON_COMPLIANT" })} />غير مطابق</label></div>{responses[item.id]?.status === "NON_COMPLIANT" ? <div className="mt-4 grid gap-3 md:grid-cols-2"><Field label="ملاحظة الفاحص"><textarea value={responses[item.id]?.note ?? ""} onChange={(e) => update(item.id, { note: e.target.value })} className={inputClass} /></Field><Field label="الإجراء التصحيحي المقترح"><textarea value={responses[item.id]?.correctiveAction ?? ""} onChange={(e) => update(item.id, { correctiveAction: e.target.value })} className={inputClass} /></Field><Field label="رفع صورة أو مرفق اختياري"><input type="file" accept="image/*,.pdf" className={inputClass} onChange={(e) => update(item.id, { attachmentName: e.target.files?.[0]?.name })} /></Field>{responses[item.id]?.attachmentName ? <div className="self-end text-sm font-bold text-security">تم اختيار: {responses[item.id]?.attachmentName}</div> : null}</div> : null}<div className="mt-3 text-xs text-muted">المرجع النظامي: {item.regulatoryReference ?? "-"} · المادة: {item.articleNumber ?? "-"}</div></div>)}</div></Card>;
}

function ObservationPreview({ item, response }: { item: FormItem; response?: DraftResponse }) {
  return <div className="rounded-3xl border border-danger/15 bg-danger/5 p-4"><div className="mb-2 flex flex-wrap items-center gap-2"><Badge tone="danger">البند {item.itemNumber}</Badge><Badge tone={item.importance === "HIGH" ? "danger" : "warning"}>{importanceLabel(item.importance)}</Badge><span className="text-sm font-bold text-muted">{item.mainSection} · {item.subCategory}</span></div><p className="font-bold leading-8">{item.requirementText}</p><p className="mt-2 text-sm text-muted">المرجع: {item.regulatoryReference ?? "-"} · المادة: {item.articleNumber ?? "-"}</p><p className="mt-3 text-sm"><b>ملاحظة الفاحص:</b> {response?.note || "لم يتم إدخال ملاحظة"}</p><p className="mt-2 text-sm"><b>الإجراء التصحيحي:</b> {response?.correctiveAction || "-"}</p><p className="mt-2 text-xs text-muted">حالة المعالجة: مفتوحة</p></div>;
}

function Summary({ label, value }: { label: string; value: string | number }) {
  return <div className="flex items-center justify-between rounded-2xl bg-soft px-4 py-3"><span className="font-bold text-muted">{label}</span><span className="text-lg font-black text-security">{value}</span></div>;
}
