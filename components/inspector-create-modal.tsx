"use client";

import { useState } from "react";
import { saveInspector } from "@/app/actions";
import { Button, Field, SecondaryButton, inputClass } from "@/components/ui";

export function InspectorCreateModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>إضافة فاحص</Button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="app-card max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[32px] border border-security/15 bg-[#fefae0]/95 p-6 shadow-[0_30px_110px_rgba(40,54,24,.30)]">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-official">إضافة فاحص جديد</h2>
                <p className="mt-1 text-sm text-muted">أدخل بيانات الفاحص وحالة تفعيله في النظام.</p>
              </div>
              <SecondaryButton type="button" onClick={() => setOpen(false)}>إغلاق</SecondaryButton>
            </div>
            <form action={saveInspector} className="grid gap-4 md:grid-cols-3">
              <Field label="اسم الفاحص"><input name="name" className={inputClass} required /></Field>
              <Field label="الرقم الوظيفي"><input name="employeeNumber" className={inputClass} required /></Field>
              <Field label="الإدارة أو القسم"><input name="department" className={inputClass} required /></Field>
              <Field label="رقم الجوال"><input name="mobile" className={inputClass} /></Field>
              <Field label="البريد"><input name="email" type="email" className={inputClass} /></Field>
              <Field label="الحالة"><select name="status" className={inputClass}><option value="ACTIVE">نشط</option><option value="INACTIVE">غير نشط</option></select></Field>
              <div className="flex gap-3 md:col-span-3">
                <Button>حفظ الفاحص</Button>
                <SecondaryButton type="button" onClick={() => setOpen(false)}>إلغاء</SecondaryButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
