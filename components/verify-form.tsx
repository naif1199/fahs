"use client";

import { useActionState } from "react";
import { verifyWeeklyLink } from "@/app/actions";
import { Button, Field, inputClass } from "@/components/ui";

export function VerifyForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(verifyWeeklyLink, null);
  return <form action={action} className="space-y-4"><input type="hidden" name="token" value={token}/><Field label="اسم الفاحص"><input name="name" className={inputClass} required/></Field><Field label="الرقم الوظيفي"><input name="employeeNumber" className={inputClass} required/></Field><Field label="رمز التحقق الأسبوعي"><input name="verificationCode" className={inputClass} required/></Field>{state?.error ? <div className="rounded-2xl bg-danger/10 p-3 text-sm font-bold text-danger">{state.error}</div> : null}<Button className="w-full">{pending ? "جار التحقق..." : "تحقق وعرض المهام"}</Button></form>;
}
