"use client";

import { useState } from "react";
import type { FacilityType } from "@prisma/client";
import { saveChecklistItem } from "@/app/actions";
import { Button, Field, SecondaryButton, inputClass } from "@/components/ui";

export function CriteriaCreateModal({ facilityTypes }: { facilityTypes: FacilityType[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>إضافة معيار</Button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="app-card max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[32px] border border-white/12 bg-[#0B1B1D]/95 p-6 shadow-[0_30px_110px_rgba(0,0,0,.45)]">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-official">إضافة معيار جديد</h2>
                <p className="mt-1 text-sm text-muted">أدخل بيانات المعيار واربطه بنوع المنشأة ومستوى الحساسية.</p>
              </div>
              <SecondaryButton type="button" onClick={() => setOpen(false)}>إغلاق</SecondaryButton>
            </div>
            <form action={saveChecklistItem} className="grid gap-4 md:grid-cols-3">
              <Field label="رقم البند"><input name="itemNumber" className={inputClass} required /></Field>
              <Field label="القسم الرئيسي"><select name="mainSection" className={inputClass}><option>المواصفات الفنية</option><option>الضوابط التشغيلية</option><option>تصنيف المنشآت</option><option>الملاحق والتصنيفات الأمنية</option></select></Field>
              <Field label="التصنيف الفرعي"><input name="subCategory" className={inputClass} required /></Field>
              <Field label="نوع المنشأة"><select name="facilityTypeId" className={inputClass}><option value="">عام</option>{facilityTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></Field>
              <Field label="مستوى الحساسية"><select name="sensitivityLevel" className={inputClass}><option>عالية</option><option>متوسطة</option><option>منخفضة</option></select></Field>
              <Field label="درجة الأهمية"><select name="importance" className={inputClass}><option value="HIGH">عالية</option><option value="MEDIUM">متوسطة</option><option value="LOW">منخفضة</option></select></Field>
              <Field label="حالة الإلزام"><select name="requirementStatus" className={inputClass}><option value="MANDATORY">إلزامي</option><option value="CONDITIONAL">مشروط</option></select></Field>
              <Field label="المرجع النظامي"><input name="regulatoryReference" className={inputClass} /></Field>
              <Field label="رقم المادة أو الفقرة"><input name="articleNumber" className={inputClass} /></Field>
              <Field label="نص المتطلب"><textarea name="requirementText" className={`${inputClass} min-h-32 md:col-span-3`} required /></Field>
              <div className="flex gap-3 md:col-span-3">
                <Button>حفظ المعيار</Button>
                <SecondaryButton type="button" onClick={() => setOpen(false)}>إلغاء</SecondaryButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
