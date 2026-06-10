import { headers } from "next/headers";
import { Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { regenerateCode, saveWeek, toggleLink } from "@/app/actions";
import { Badge, Button, Card, Field, SecondaryButton, inputClass } from "@/components/ui";
import { arDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function WeeksPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const [inspectors, weeks] = await Promise.all([
    prisma.inspector.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    prisma.inspectionWeek.findMany({ include: { links: { include: { inspector: true, tasks: true } } }, orderBy: { createdAt: "desc" } })
  ]);
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${protocol}://${host}`;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-security/10 bg-white/85 p-5 shadow-[0_14px_36px_rgba(18,48,71,.06)]">
        <p className="text-sm font-bold text-security">إدارة الروابط الأسبوعية</p>
        <h1 className="mt-1 text-2xl font-black text-official">إصدار روابط فحص</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">أنشئ أسبوع الفحص، اختر الفاحصين، ثم صدّر روابطهم كمسودات بريد رسمية بصيغة EML جاهزة للمراجعة والإرسال.</p>
      </div>

      <Card>
        <form action={saveWeek} className="grid gap-4 md:grid-cols-4">
          <Field label="اسم الأسبوع"><input name="name" className={inputClass} required /></Field>
          <Field label="تاريخ البداية"><input name="startsAt" type="date" className={inputClass} required /></Field>
          <Field label="تاريخ النهاية"><input name="endsAt" type="date" className={inputClass} required /></Field>
          <Field label="عدد المهام لكل فاحص"><input name="targetTasks" type="number" min={1} defaultValue={10} className={inputClass} required /></Field>
          <div className="md:col-span-4 rounded-xl border border-security/10 bg-soft p-4">
            <div className="mb-3 flex flex-col justify-between gap-2 md:flex-row md:items-center">
              <div className="font-bold text-official">الفاحصون</div>
              <div className="text-xs font-semibold text-muted">اختر فاحصًا واحدًا على الأقل حتى تظهر الروابط بعد الإصدار.</div>
            </div>
            {params.error === "no-inspectors" ? <div className="mb-3 rounded-lg border border-danger/20 bg-danger/10 p-3 text-sm font-bold text-danger">لم يتم إصدار روابط لأنك لم تختر أي فاحص.</div> : null}
            <div className="grid gap-3 md:grid-cols-3">
              {inspectors.map((i) => (
                <label key={i.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm font-bold text-official transition hover:border-security/25 hover:bg-security/5">
                  <input type="checkbox" name="inspectorIds" value={i.id} className="h-5 w-5 rounded border-slate-300 text-security focus:ring-security" />
                  <span>{i.name} - {i.employeeNumber}</span>
                </label>
              ))}
            </div>
          </div>
          <Button className="md:col-span-4">إصدار روابط فحص</Button>
        </form>
      </Card>

      <div className="grid gap-5">
        {weeks.map((week) => {
          const tasks = week.links.flatMap((link) => link.tasks);
          return (
            <Card key={week.id}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-official">{week.name}</h2>
                  <p className="text-sm text-muted">{arDate(week.startsAt)} إلى {arDate(week.endsAt)} · {week.links.length} فاحص · {tasks.length} مهمة</p>
                </div>
                <Badge tone="security">{week.status}</Badge>
              </div>
              {week.links.length ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[980px] text-sm">
                    <thead className="bg-soft"><tr className="border-b text-muted"><th className="p-3 text-right">الفاحص</th><th className="p-3 text-right">رابط الفحص</th><th className="p-3 text-right">رمز التحقق</th><th className="p-3 text-right">المهام</th><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">إرسال الرابط</th><th className="p-3 text-right">إجراءات</th></tr></thead>
                    <tbody>
                      {week.links.map((link) => {
                        const url = `${baseUrl}/w/${link.token}`;
                        return (
                          <tr key={link.id} className="border-b bg-white last:border-0">
                            <td className="p-3 font-bold text-official">{link.inspector.name}<br /><span className="text-xs text-muted">{link.inspector.employeeNumber}</span></td>
                            <td className="p-3"><code className="rounded-md px-2 py-1 text-xs" dir="ltr">{url}</code></td>
                            <td className="p-3 font-black text-security">{link.verificationCode}</td>
                            <td className="p-3 text-muted">{link.tasks.length} · {link.tasks.filter((task) => task.status === "COMPLETED").length} مكتملة</td>
                            <td className="p-3"><Badge tone={link.status === "ACTIVE" ? "success" : "danger"}>{link.status === "ACTIVE" ? "نشط" : "غير نشط"}</Badge></td>
                            <td className="p-3">
                              <a className="ui-button inline-flex min-h-10 items-center gap-2 rounded-lg border border-security/20 bg-security/10 px-3 text-sm font-bold text-security transition hover:bg-security/15" href={buildEmlHref({ to: link.inspector.email ?? "", inspectorName: link.inspector.name, weekName: week.name, url, code: link.verificationCode })} download={`fahs-${link.inspector.employeeNumber}-${week.id}.eml`}>
                                <Mail className="h-4 w-4" /> مسودة EML
                              </a>
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-2">
                                <form action={toggleLink}><input type="hidden" name="id" value={link.id} /><button className="ui-button rounded-lg border border-warning/20 bg-warning/10 px-3 py-2 text-sm font-bold text-warning">تعطيل/تفعيل</button></form>
                                <form action={regenerateCode}><input type="hidden" name="id" value={link.id} /><button className="ui-button inline-flex items-center gap-2 rounded-lg border border-security/20 bg-white px-3 py-2 text-sm font-bold text-security"><RefreshCw className="h-4 w-4" /> رمز جديد</button></form>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-lg border border-warning/25 bg-warning/10 p-4 text-sm font-bold text-warning">لم تصدر روابط لهذا الأسبوع لأنه لا يحتوي على فاحصين. استخدم نموذج إصدار روابط فحص واختر الفاحصين قبل الإرسال.</div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function buildEmlHref({ to, inspectorName, weekName, url, code }: { to: string; inspectorName: string; weekName: string; url: string; code: string }) {
  const subject = `رابط فحص أسبوعي - ${weekName}`;
  const body = [
    `سعادة الفاحص/ ${inspectorName}`,
    "",
    "نأمل الدخول إلى رابط الفحص الأسبوعي واستكمال المهام المسندة لكم عبر نظام الفاحص الذكي.",
    "",
    `الأسبوع: ${weekName}`,
    `رابط الفحص: ${url}`,
    `رمز التحقق: ${code}`,
    "",
    "يرجى عدم مشاركة الرابط أو رمز التحقق مع أي طرف غير مخول.",
    "",
    "مع التحية،",
    "نظام الفاحص الذكي"
  ].join("\r\n");
  const eml = [`To: ${to}`, `Subject: ${encodeMailHeader(subject)}`, "MIME-Version: 1.0", "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: 8bit", "", body].join("\r\n");
  return `data:message/rfc822;charset=utf-8,${encodeURIComponent(eml)}`;
}

function encodeMailHeader(value: string) {
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}