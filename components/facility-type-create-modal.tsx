"use client";

import { useState } from "react";
import { saveFacilityType } from "@/app/actions";
import { Button, Field, SecondaryButton, inputClass } from "@/components/ui";

export function FacilityTypeCreateModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>إضافة نوع منشأة</Button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="app-card max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[32px] border border-security/15 bg-[#FFFDF7]/95 p-6 shadow-[0_30px_110px_rgba(38,70,83,.28)]">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-official">إضافة نوع منشأة</h2>
                <p className="mt-1 text-sm text-muted">حدد الحساسية الافتراضية والمتطلبات الإضافية لهذا التصنيف.</p>
              </div>
              <SecondaryButton type="button" onClick={() => setOpen(false)}>إغلاق</SecondaryButton>
            </div>
            <form action={saveFacilityType} className="grid gap-4 md:grid-cols-4">
              <Field label="نوع المنشأة"><input name="name" className={inputClass} required /></Field>
              <Field label="مستوى الحساسية الافتراضي"><select name="defaultSensitivity" className={inputClass}><option>عالية</option><option>متوسطة</option><option>منخفضة</option></select></Field>
              <Field label="الحالة"><select name="isActive" className={inputClass}><option value="true">مفعل</option><option value="false">معطل</option></select></Field>
              <Field label="الوصف"><input name="description" className={inputClass} /></Field>
              <Field label="متطلبات إضافية حسب التصنيف"><textarea name="extraRequirements" className={`${inputClass} min-h-28 md:col-span-4`} /></Field>
              <div className="flex gap-3 md:col-span-4">
                <Button>حفظ نوع المنشأة</Button>
                <SecondaryButton type="button" onClick={() => setOpen(false)}>إلغاء</SecondaryButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
