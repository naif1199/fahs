import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAdmin } from "@/app/actions";
import { Logo } from "@/components/logo";
import { isAdmin } from "@/lib/auth";

const nav = [
  ["لوحة التحكم", "/admin"],
  ["الفاحصون", "/admin/inspectors"],
  ["أسابيع الفحص", "/admin/weeks"],
  ["التقارير", "/admin/reports"],
  ["سجل التدقيق", "/admin/audit"],
  ["المعايير", "/admin/criteria"],
  ["تصنيف المنشآت", "/admin/facility-types"],
  ["الإعدادات", "/admin/settings"]
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/");
  return (
    <div className="min-h-screen">
      <aside className="fixed right-0 top-0 z-20 hidden h-screen w-72 border-l border-slate-200 bg-white/90 p-5 backdrop-blur lg:block">
        <Logo />
        <nav className="mt-8 grid gap-2">
          {nav.map(([label, href]) => <Link key={href} href={href} className="rounded-2xl px-4 py-3 text-sm font-bold text-charcoal hover:bg-security/8 hover:text-security">{label}</Link>)}
        </nav>
        <form action={logoutAdmin} className="absolute bottom-5 left-5 right-5"><button className="w-full rounded-2xl border border-danger/20 px-4 py-3 text-sm font-bold text-danger">تسجيل الخروج</button></form>
      </aside>
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/85 p-4 backdrop-blur lg:hidden"><Logo /></header>
      <main className="p-4 lg:mr-72 lg:p-8">{children}</main>
    </div>
  );
}
