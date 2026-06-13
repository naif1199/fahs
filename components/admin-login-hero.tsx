"use client";

import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/login-form";

export function AdminLoginHero({ className = "" }: { className?: string }) {
  return (
    <main className={`grid min-h-screen place-items-center bg-[radial-gradient(circle_at_16%_12%,rgba(238,155,0,.18),transparent_24rem),radial-gradient(circle_at_84%_0%,rgba(10,147,150,.20),transparent_28rem),linear-gradient(135deg,rgba(233,216,166,.82),rgba(148,210,189,.32))] p-5 text-official ${className}`} dir="rtl">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-security/15 bg-white shadow-[0_24px_70px_rgba(0,18,25,.14)] lg:grid-cols-[1fr_420px]">
        <div className="flex min-h-[520px] flex-col justify-between bg-soft p-8 lg:p-10">
          <div>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-security/15 bg-white px-3 py-1.5 text-sm font-bold text-security">
              <ShieldCheck className="h-4 w-4" /> منصة تفتيش أمنية
            </div>
            <Image src="/logo-mark.png" alt="شعار الفاحص الذكي" width={620} height={220} priority className="h-auto w-full max-w-xl object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-official">الفاحص الذكي</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">أداة التفتيش الأمنية الذكية لإدارة روابط الفحص، نماذج التقييم، التقارير، وسجل التدقيق ضمن تجربة رسمية هادئة ومهيأة للاستخدام اليومي.</p>
          </div>
        </div>
        <div className="flex items-center p-6 lg:p-8">
          <div className="w-full">
            <div className="mb-6">
              <p className="text-sm font-bold text-security">دخول الإدارة</p>
              <h2 className="mt-1 text-xl font-black text-official">لوحة تحكم النظام</h2>
              <p className="mt-2 text-sm leading-7 text-muted">أدخل رمز مدير النظام للمتابعة إلى لوحة التحكم.</p>
            </div>
            <LoginForm />
          </div>
        </div>
      </section>
    </main>
  );
}
