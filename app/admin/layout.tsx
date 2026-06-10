import Link from "next/link";
import { redire ct } from "next/navigation";
import { BarChar t3, CalendarDays, ClipboardCheck, FileText, L istChecks, ScrollText, Settings, ShieldCheck,  Users } from "lucide-react";
import { logout Admin } from "@/app/actions";
import { Logo }  from "@/components/logo";
import { ThemeTogg le } from "@/components/theme-toggle";
import  { isAdmin } from "@/lib/auth";

const nav =  [
  ["لوحة التحكم", "/admin", BarCh art3],
  ["الفاحصون", "/admin/inspect ors", Users],
  ["أسابيع الفحص", " /admin/weeks", CalendarDays],
  ["التقا� �ير", "/admin/reports", FileText],
  ["سج ل التدقيق", "/admin/audit", ScrollTex t],
  ["المعايير", "/admin/criteria",  ListChecks],
  ["تصنيف المنشآت",  "/admin/facility-types", ShieldCheck],
  ["� �لإعدادات", "/admin/settings", Settin gs]
];

export default async function AdminLa yout({ children }: { children: React.ReactNod e }) {
  if (!(await isAdmin())) redirect("/" );
  return (
    <div className="admin-shell  min-h-screen">
      <aside className="admin -sidebar fixed right-0 top-0 z-20 hidden h-sc reen w-72 border-l p-4 lg:block">
        <Lo go sidebar />
        <div className="mt-4">< ThemeToggle /></div>
        <nav className=" mt-6 grid gap-1.5" aria-label="التنقل � �لإداري">
          {nav.map(([label, h ref, Icon]) => {
            const NavIcon =  Icon as typeof BarChart3;
            return  <Link key={href as string} href={href as stri ng} className="group flex min-h-11 items-cent er gap-3 rounded-lg border border-transparent  px-3 text-sm font-bold text-muted transition  hover:border-security/15 hover:bg-security/7  hover:text-official focus-visible:outline-no ne focus-visible:ring-2 focus-visible:ring-se curity/25"><NavIcon size={18} className="text -security transition group-hover:text-securit y" />{label as string}</Link>;
          })}
         </nav>
        <form action={logoutAd min} className="absolute bottom-4 left-4 righ t-4"><button className="ui-button w-full roun ded-lg border border-danger/20 bg-danger/10 p x-4 py-3 text-sm font-bold text-danger transi tion hover:bg-danger/15 active:scale-[.98]">� �سجيل الخروج</button></form>
       </aside>
      <header className="admin-heade r sticky top-0 z-10 border-b p-4 lg:hidden">< Logo /><div className="mt-3"><ThemeToggle />< /div></header>
      <main className="p-4 lg: mr-72 lg:p-6 xl:p-8">{children}</main>
    </ div>
  );
} 