import Link from "next/link";
import { redire ct } from "next/navigation";
import { BarChar t3, CalendarDays, FileText, ListChecks, Scrol lText, Settings, ShieldCheck, Users } from "l ucide-react";
import { logoutAdmin } from "@/ app/actions";
import { Logo } from "@/compone nts/logo";
import { ThemeToggle } from "@/com ponents/theme-toggle";
import { isAdmin } fro m "@/lib/auth";

const nav = [
  ["لوحة � �لتحكم", "/admin", BarChart3],
  ["ال� �احصون", "/admin/inspectors", Users],
   ["روابط نموذج الفاحص", "/admi n/weeks", CalendarDays],
  ["التقارير ", "/admin/reports", FileText],
  ["سجل ا لتدقيق", "/admin/audit", ScrollText],
   ["المعايير", "/admin/criteria", List Checks],
  ["تصنيف المنشآت", "/ad min/facility-types", ShieldCheck],
  ["الإ عدادات", "/admin/settings", Settings]
]  as const;

export default async function Adm inLayout({ children }: { children: React.Reac tNode }) {
  if (!(await isAdmin())) redirect ("/");
  return (
    <div className="admin-s hell min-h-screen">
      <aside className="a dmin-sidebar fixed right-0 top-0 z-20 hidden  h-screen w-72 border-l p-4 lg:block">
         <Logo sidebar />
        <div className="mt- 4"><ThemeToggle /></div>
        <nav classNa me="mt-6 grid gap-1.5" aria-label="التنق ل الإداري">
          {nav.map(([labe l, href, Icon]) => (
            <Link key={h ref} href={href} className="group flex min-h- 11 items-center gap-3 rounded-lg border borde r-transparent px-3 text-sm font-bold text-mut ed transition hover:border-security/15 hover: bg-security/7 hover:text-official focus-visib le:outline-none focus-visible:ring-2 focus-vi sible:ring-security/25">
              <Icon  size={18} className="text-security transition  group-hover:text-security" />
               {label}
            </Link>
          ))}
         </nav>
        <form action={logoutAdmin } className="absolute bottom-4 left-4 right-4 "><button className="ui-button w-full rounded -lg border border-danger/20 bg-danger/10 px-4  py-3 text-sm font-bold text-danger transitio n hover:bg-danger/15 active:scale-[.98]">تس جيل الخروج</button></form>
      </a side>
      <header className="admin-header s ticky top-0 z-10 border-b p-4 lg:hidden"><Log o /><div className="mt-3"><ThemeToggle /></di v></header>
      <main className="p-4 lg:mr- 72 lg:p-6 xl:p-8">{children}</main>
    </div >
  );
} 