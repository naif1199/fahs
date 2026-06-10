import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, CalendarDays, ClipboardCheck, FileText, ListChecks, ScrollText, Settings, ShieldCheck, Users } from "lucide-react";
import { logoutAdmin } from "@/app/actions";
import { Logo } from "@/components/logo";
import { isAdmin } from "@/lib/auth";

const nav = [
  ["لوحة التحكم", "/admin", BarChart3],
  ["الفاحصون", "/admin/inspectors", Users],
  ["أسابيع الفحص", "/admin/weeks", CalendarDays],
  ["التقارير", "/admin/reports", FileText],
  ["سجل التدقيق", "/admin/audit", ScrollText],
  ["المعايير", "/admin/criteria", ListChecks],
  ["تصنيف المنشآت", "/admin/facility-types", ShieldCheck],
  ["الإعدادات", "/admin/settings", Settings]
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/");
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_8%,rgba(216,198,163,.12),transparent_28rem),radial-gradient(circle_at_90%_0%,rgba(15,95,92,.22),transparent_26rem),linear-gradient(135deg,#071111_0%,#0B1B1D_52%,#123047_100%)]">
      <aside className="fixed right-0 top-0 z-20 hidden h-screen w-80 border-l border-white/10 bg-[#071111]/75 p-5 shadow-[0_0_80px_rgba(0,0,0,.35)] backdrop-blur-2xl lg:block">
        <Logo sidebar />
        <nav className="mt-8 grid gap-2">
          {nav.map(([label, href, Icon]) => {
            const NavIcon = Icon as typeof BarChart3;
            return <Link key={href as string} href={href as string} className="group flex items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm font-bold text-muted transition hover:border-white/10 hover:bg-white/[0.065] hover:text-white"><NavIcon size={18} className="text-sand transition group-hover:text-white" />{label as string}</Link>;
          })}
        </nav>
        <form action={logoutAdmin} className="absolute bottom-5 left-5 right-5"><button className="w-full rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm font-bold text-red-100 transition hover:bg-danger/20">تسجيل الخروج</button></form>
      </aside>
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#071111]/80 p-4 backdrop-blur-xl lg:hidden"><Logo /></header>
      <main className="p-4 lg:mr-80 lg:p-8">{children}</main>
    </div>
  );
}
