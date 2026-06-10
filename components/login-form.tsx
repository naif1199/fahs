"use client";

import { useActionState } from "react";
import { adminLogin } from "@/app/actions";
import { Button, Field, inputClass } from "@/components/ui";

export function LoginForm() {
  const [state, action, pending] = useActionState(adminLogin, null);
  return (
    <form action={action} className="space-y-5">
      <Field label="رمز دخول مدير النظام">
        <input className={inputClass} name="password" type="password" placeholder="أدخل كلمة المرور" required />
      </Field>
      {state?.error ? <div className="rounded-2xl bg-danger/10 p-3 text-sm font-bold text-danger">{state.error}</div> : null}
      <Button className="w-full" type="submit">{pending ? "جار التحقق..." : "دخول لوحة التحكم"}</Button>
    </form>
  );
}
