import { redirect } from "next/navigation";
import { VerifyForm } from "@/components/verify-form";
import { Logo } from "@/components/logo";
import { Card } from "@/components/ui";
import { hasLinkCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function WeeklyLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (await hasLinkCookie(token)) redirect(`/w/${token}/tasks`);
  const link = await prisma.weeklyLink.findUnique({ where: { token }, include: { week: true } });
  return <main className="grid min-h-screen place-items-center p-6"><Card className="w-full max-w-xl p-8"><div className="mb-8 flex justify-center"><Logo /></div><h1 className="text-center text-2xl font-black text-official">التحقق من رابط الفحص الأسبوعي</h1><p className="mb-6 mt-3 text-center text-sm leading-7 text-muted">{link ? `الأسبوع: ${link.week.name}` : "الرابط غير معروف أو غير مفعل"}</p>{link ? <VerifyForm token={token}/> : null}</Card></main>;
}
