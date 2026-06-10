"use client";

import { useState, useTransition } from "react";
import { Card, Button, SecondaryButton, inputClass, Badge } from "@/components/ui";
import type { ImportPreview } from "@/lib/excel-import";

export function CriteriaImportPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  async function previewFile() {
    if (!file) return setMessage("اختر ملف Excel أولًا");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/criteria/import/preview", { method: "POST", body: form });
    const data = await res.json();
    if (!data.ok) return setMessage(data.error ?? "تعذرت المعاينة");
    setPreview(data.preview);
    setMessage("تمت قراءة الملف. راجع النتائج قبل الاعتماد.");
  }

  async function commitImport() {
    if (!preview) return;
    const res = await fetch("/api/criteria/import/commit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: preview.items, replaceExisting: true })
    });
    const data = await res.json();
    if (!data.ok) return setMessage(data.error ?? "تعذر اعتماد الاستيراد");
    setMessage(`تم اعتماد الاستيراد وحفظ ${data.imported} بند.`);
    window.location.reload();
  }

  return (
    <Card>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-official">استيراد ملف Excel</h2>
          <p className="mt-1 text-sm text-muted">المعاينة لا تحفظ البيانات نهائيًا حتى تضغط اعتماد الاستيراد.</p>
        </div>
        <Badge tone="security">مصدر رسمي للمعايير</Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_auto_auto_auto]">
        <input className={inputClass} type="file" accept=".xlsx,.xls" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        <Button type="button" className="bg-official" onClick={() => startTransition(previewFile)}>معاينة البيانات</Button>
        <Button type="button" className="bg-success disabled:opacity-40" onClick={() => startTransition(commitImport)} disabled={!preview}>اعتماد الاستيراد</Button>
        <SecondaryButton type="button" onClick={() => { setPreview(null); setFile(null); setMessage("تم إلغاء الاستيراد."); }}>إلغاء الاستيراد</SecondaryButton>
      </div>
      {message ? <div className="mt-4 rounded-2xl bg-soft p-3 text-sm font-bold text-security">{isPending ? "جار التنفيذ... " : ""}{message}</div> : null}
      {preview ? (
        <div className="mt-6 space-y-5">
          <div className="grid gap-3 md:grid-cols-5">
            <Metric label="الأوراق المقروءة" value={preview.summary.sheetsRead} />
            <Metric label="إجمالي البنود" value={preview.summary.totalItems} />
            <Metric label="بدون قسم" value={preview.summary.itemsWithoutSection} />
            <Metric label="بدون نوع منشأة" value={preview.summary.itemsWithoutFacilityType} />
            <Metric label="بدون مرجع نظامي" value={preview.summary.itemsWithoutRegulatoryReference} />
          </div>
          <div className="overflow-x-auto rounded-3xl border border-slate-200">
            <table className="w-full text-sm"><thead><tr className="border-b bg-soft text-muted"><th className="p-3 text-right">الورقة</th><th className="p-3 text-right">عدد الصفوف</th><th className="p-3 text-right">البنود المستخرجة</th></tr></thead><tbody>{preview.sheets.map((sheet) => <tr key={sheet.name} className="border-b last:border-0"><td className="p-3 font-bold">{sheet.name}</td><td className="p-3">{sheet.rows}</td><td className="p-3 text-security font-black">{sheet.extractedItems}</td></tr>)}</tbody></table>
          </div>
          {preview.summary.errors.length ? <div className="rounded-2xl bg-danger/10 p-4 text-sm font-bold text-danger">{preview.summary.errors.join("، ")}</div> : null}
          <div className="max-h-96 overflow-auto rounded-3xl border border-slate-200">
            <table className="w-full text-xs"><thead><tr className="sticky top-0 border-b bg-white text-muted"><th className="p-3 text-right">الصف</th><th className="p-3 text-right">الورقة</th><th className="p-3 text-right">القسم</th><th className="p-3 text-right">التصنيف</th><th className="p-3 text-right">نص المتطلب</th><th className="p-3 text-right">نوع المنشأة</th></tr></thead><tbody>{preview.items.slice(0, 150).map((item, index) => <tr key={`${item.sourceSheet}-${item.originalRowNumber}-${index}`} className="border-b last:border-0"><td className="p-3">{item.originalRowNumber}</td><td className="p-3">{item.sourceSheet}</td><td className="p-3">{item.mainSection}</td><td className="p-3">{item.subSection}</td><td className="p-3 leading-6">{item.requirementText}</td><td className="p-3">{item.facilityType ?? "-"}</td></tr>)}</tbody></table>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl bg-soft p-4"><div className="text-xs font-bold text-muted">{label}</div><div className="mt-1 text-2xl font-black text-security">{value}</div></div>;
}
