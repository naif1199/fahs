import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { Card } from "@/components/ui";
import { LoginForm } from "@/components/login-form";
import { isAdmin } from "@/lib/auth";

export default async function HomePage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="absolute inset-0 soft-pattern opacity-70" />
      <Card className="relative w-full max-w-xl overflow-hidden p-8">
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-l from-security via-sand to-official" />
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-official">الفاحص الذكي</h1>
          <p className="mt-3 text-sm leading-7 text-muted">مواصفات وتعليمات مراكز التحكم والمراقبة الأمنية في المنشآت</p>
        </div>
        <LoginForm />
      </Card>
    </main>
  );
}
