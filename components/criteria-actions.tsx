"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { FacilityType, Importance, RequirementStatus } from "@prisma/client";
import { deleteChecklistItem, saveChecklistItem } from "@/app/actions";
import { Button, Field, SecondaryButton, inputClass } from "@/components/ui";

type CriteriaActionItem = {
  id: string;
  itemNumber: string;
  mainSection: string;
  subCategory: string;
  requirementText: string;
  sensitivityLevel: string;
  importance: Importance;
  requirementStatus: RequirementStatus;
  regulatoryReference: string | null;
  articleNumber: string | null;
  facilityTypeId: string | null;
  isActive: boolean;
};

export function CriteriaActions({ item, facilityTypes }: { item: CriteriaActionItem; facilityTypes: FacilityType[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => setOpen(true)} className="grid h-8 w-8 place-items-center rounded-lg border border-security/20 bg-security/10 text-security transition hover:bg-security/15" title="تعديل المعيار" aria-label="تعديل المعيار"><Pencil className="h-4 w-4" /></button>
      <form action={deleteChecklistItem}>
        <input type="hidden" name="id" value={item.id} />
        <button className="grid h-8 w-8 place-items-center rounded-lg border border-danger/20 bg-danger/10 text-danger transition hover:bg-danger/15" title="حذف المعيار" aria-label="حذف المعيار"><Trash2 className="h-4 w-4" /></button>
      </form>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="app-card max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[32px] border border-security/15 bg-[#F8FAF8]/95 p-6 shadow-[0_30px_110px_rgba(18,48,71,.30)]">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-official">تعديل معيار</h2>
                <p className="mt-1 text-sm text-muted">حدّث بيانات المعيار وحالة تفعيله.</p>
              </div>
              <SecondaryButton type="button" onClick={() => setOpen(false)}>إغلاق</SecondaryButton>
            </div>
            <form action={saveChecklistItem} className="grid gap-4 md:grid-cols-3">
              <input type="hidden" name="id" value={item.id} />
              <Field label="رقم البند"><input name="itemNumber" defaultValue={item.itemNumber} className={inputClass} required /></Field>
              <Field label="القسم الرئيسي"><select name="mainSection" defaultValue={item.mainSection} className={inputClass}><option>المواصفات الفنية</option><option>الضوابط التشغيلية</option><option>تصنيف المنشآت</option><option>الملاحق والتصنيفات الأمنية</option></select></Field>
              <Field label="التصنيف الفرعي"><input name="subCategory" defaultValue={item.subCategory} className={inputClass} required /></Field>
              <Field label="نوع المنشأة"><select name="facilityTypeId" defaultValue={item.facilityTypeId ?? ""} className={inputClass}><option value="">عام</option>{facilityTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></Field>
              <Field label="مستوى الحساسية"><select name="sensitivityLevel" defaultValue={item.sensitivityLevel} className={inputClass}><option>عالية</option><option>متوسطة</option><option>منخفضة</option></select></Field>
              <Field label="درجة الأهمية"><select name="importance" defaultValue={item.importance} className={inputClass}><option value="HIGH">عالية</option><option value="MEDIUM">متوسطة</option><option value="LOW">منخفضة</option></select></Field>
              <Field label="حالة الإلزام"><select name="requirementStatus" defaultValue={item.requirementStatus} className={inputClass}><option value="MANDATORY">إلزامي</option><option value="CONDITIONAL">مشروط</option></select></Field>
              <Field label="حالة التفعيل"><select name="isActive" defaultValue={item.isActive ? "true" : "false"} className={inputClass}><option value="true">مفعل</option><option value="false">معطل</option></select></Field>
              <Field label="المرجع النظامي"><input name="regulatoryReference" defaultValue={item.regulatoryReference ?? ""} className={inputClass} /></Field>
              <Field label="رقم المادة أو الفقرة"><input name="articleNumber" defaultValue={item.articleNumber ?? ""} className={inputClass} /></Field>
              <Field label="نص المتطلب"><textarea name="requirementText" defaultValue={item.requirementText} className={`${inputClass} min-h-32 md:col-span-3`} required /></Field>
              <div className="flex gap-3 md:col-span-3">
                <Button>حفظ التعديل</Button>
                <SecondaryButton type="button" onClick={() => setOpen(false)}>إلغاء</SecondaryButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
