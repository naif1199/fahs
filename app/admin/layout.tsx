import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, CalendarDays, FileText, Gauge, ListChecks, ScrollText, Settings, ShieldCheck, Users } from "lucide-react";
import { logoutAdmin } from "@/app/actions";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { isAdmin } from "@/lib/auth";

const nav = [
  ["لوحة التحكم", "/admin", BarChart3],
  ["الفاحصون", "/admin/inspectors", Users],
  ["روابط نموذج الفاحص", "/admin/weeks", CalendarDays],
  ["مؤشرات أداء الفاحصين", "/admin/performance", Gauge],
  ["التقارير", "/admin/reports", FileText],
  ["سجل التدقيق", "/admin/audit", ScrollText],
  ["المعايير", "/admin/criteria", ListChecks],
  ["تصنيف المنشآت", "/admin/facility-types", ShieldCheck],
  ["الإعدادات", "/admin/settings", Settings]
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/");
  return (
    <div className="admin-shell min-h-screen">
      <aside className="admin-sidebar fixed right-0 top-0 z-20 hidden h-screen w-72 border-l p-4 lg:block">
        <Logo sidebar />
        <div className="mt-4"><ThemeToggle /></div>
        <nav className="mt-6 grid gap-1.5" aria-label="التنقل الإداري">
          {nav.map(([label, href, Icon]) => (
            <Link key={href} href={href} className="group flex min-h-11 items-center gap-3 rounded-lg border border-transparent px-3 text-sm font-bold text-muted transition hover:border-security/15 hover:bg-security/7 hover:text-official focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-security/25">
              <Icon size={18} className="text-security transition group-hover:text-security" />
              {label}
            </Link>
          ))}
        </nav>
        <form action={logoutAdmin} className="absolute bottom-4 left-4 right-4"><button className="ui-button w-full rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm font-bold text-danger transition hover:bg-danger/15 active:scale-[.98]">تسجيل الخروج</button></form>
      </aside>
      <header className="admin-header sticky top-0 z-10 border-b p-4 lg:hidden"><Logo /><div className="mt-3"><ThemeToggle /></div></header>
      <main className="p-4 lg:mr-72 lg:p-6 xl:p-8">{children}</main>
    </div>
  );
}