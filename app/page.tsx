import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { Card } from "@/components/ui";
import { LoginForm } from "@/components/login-form";
import { isAdmin } from "@/lib/auth";

export default async function HomePage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(216,198,163,.28),transparent_28rem),linear-gradient(135deg,#f7faf9_0%,#edf4f3_45%,#e8efef_100%)]" />
      <div className="absolute inset-0 opacity-[.08] [background-image:linear-gradient(135deg,#0F5F5C_25%,transparent_25%),linear-gradient(225deg,#123047_25%,transparent_25%)] [background-size:42px_42px]" />
      <Card className="relative w-full max-w-2xl overflow-hidden border-white/80 bg-white/92 p-8 shadow-[0_28px_90px_rgba(18,48,71,.14)] backdrop-blur md:p-10">
        <div className="absolute inset-x-0 top-0 h-3 bg-gradient-to-l from-security via-sand to-official" />
        <div className="mb-8 pt-4">
          <Logo hero />
        </div>
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black text-official md:text-5xl">الفاحص الذكي</h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-muted md:text-lg">مواصفات وتعليمات مراكز التحكم والمراقبة الأمنية في المنشآت</p>
        </div>
        <LoginForm />
      </Card>
    </main>
  );
}
