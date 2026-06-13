"use client";

import { useActionState } from "react";
import { adminLogin } from "@/app/actions";
import { Button, Field, inputClass } from "@/components/ui";

export function LoginForm({ cinematic = false }: { cinematic?: boolean }) {
  const [state, action, pending] = useActionState(adminLogin, null);
  if (cinematic) {
    return (
      <form action={action} className="w-full max-w-md space-y-5" dir="rtl">
        <label className="block">
          <span className="mb-3 block text-center text-lg font-semibold text-white md:text-xl">رمز دخول مدير النظام</span>
          <input
            className="liquid-glass w-full rounded-full px-6 py-4 text-center text-xl font-semibold tracking-[.35em] text-white outline-none placeholder:text-white/35 focus:ring-2 focus:ring-white/25 md:py-5 md:text-2xl"
            name="password"
            type="password"
            placeholder="أدخل كلمة المرور"
            required
          />
        </label>
        {state?.error ? <div className="rounded-2xl bg-red-500/15 p-3 text-sm font-semibold text-red-100">{state.error}</div> : null}
        <button className="inline-flex w-full items-center justify-center rounded-full bg-white px-8 py-4 text-lg font-bold text-[#001219] shadow-[0_18px_45px_rgba(0,0,0,.24)] transition-colors hover:bg-[#e9d8a6] md:py-5 md:text-xl" type="submit">
          {pending ? "جار التحقق..." : "دخول لوحة التحكم"}
        </button>
      </form>
    );
  }
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
