import { headers } from "next/headers";
import { ExternalLink, Mail, RefreshCw, Trash2 } from "lucide-react";
import { deleteEmptyWeek, regenerateCode, saveWeek, toggleLink } from "@/app/actions";
import { Badge, Button, Card, Field, inputClass } from "@/components/ui";
import { arDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function WeeksPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const [inspectors, weeks] = await Promise.all([
    prisma.inspector.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    prisma.inspectionWeek.findMany({ include: { links: { include: { inspector: true, tasks: true } } }, orderBy: { createdAt: "desc" } })
  ]);
  const issuedBatches = weeks.filter((week) => week.links.length > 0);
  const emptyBatches = weeks.filter((week) => week.links.length === 0);
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${protocol}://${host}`;
  const activeLinks = issuedBatches.flatMap((week) => week.links).filter((link) => link.status === "ACTIVE").length;

  return <div className="space-y-6">
    <div className="rounded-xl border border-security/15 bg-gradient-to-l from-security/10 to-[#e9d8a6] p-5 shadow-[0_14px_36px_rgba(0,18,25,.10)]">
      <p className="text-sm font-bold text-security">الإجراء الرئيسي للمدير</p>
      <h1 className="mt-1 text-2xl font-black text-official">دفعات روابط نموذج الفاحص</h1>
      <p className="mt-2 max-w-4xl text-sm leading-7 text-muted">دفعة الفحص هي مجموعة روابط نموذج تصدر لفاحصين محددين خلال فترة عمل واضحة. لا يتم إنشاء دفعة تشغيلية إلا عند اختيار فاحص واحد على الأقل.</p>
    </div>

    <Card className="border-security/15">
      <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-center">
        <div><h2 className="text-lg font-black text-official">إنشاء دفعة فحص جديدة</h2><p className="mt-1 text-sm text-muted">اختر الفاحصين أولًا. سيصدر النظام رابط نموذج مستقل ورمز تحقق لكل فاحص داخل الدفعة.</p></div>
        <Badge tone="security">{activeLinks} رابط نشط</Badge>
      </div>
      <form action={saveWeek} className="grid gap-4 md:grid-cols-4">
        <Field label="اسم دفعة الفحص"><input name="name" className={inputClass} required /></Field>
        <Field label="تاريخ البداية"><input name="startsAt" type="date" className={inputClass} required /></Field>
        <Field label="تاريخ النهاية"><input name="endsAt" type="date" className={inputClass} required /></Field>
        <Field label="عدد المهام لكل فاحص"><input name="targetTasks" type="number" min={1} defaultValue={10} className={inputClass} required /></Field>
        <div className="md:col-span-4 rounded-xl border border-security/10 bg-soft p-4">
          <div className="mb-3 flex flex-col justify-between gap-2 md:flex-row md:items-center"><div className="font-bold text-official">الفاحصون المستلمون للرابط</div><div className="text-xs font-semibold text-muted">اختيار الفاحصين شرط لتوليد الروابط وإدخال الدفعة في المؤشرات.</div></div>
          {params.error === "no-inspectors" ? <div className="mb-3 rounded-lg border border-danger/20 bg-danger/10 p-3 text-sm font-bold text-danger">لم يتم إنشاء الدفعة. يجب اختيار فاحص واحد على الأقل قبل توليد روابط نموذج الفاحص.</div> : null}
          <div className="grid gap-3 md:grid-cols-3">{inspectors.map((i) => <label key={i.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm font-bold text-official transition hover:border-security/25 hover:bg-security/5"><input type="checkbox" name="inspectorIds" value={i.id} className="h-5 w-5 rounded border-slate-300 text-security focus:ring-security" /><span>{i.name} - {i.employeeNumber}</span></label>)}</div>
        </div>
        <Button className="md:col-span-4">توليد روابط نموذج الفاحص</Button>
      </form>
    </Card>

    <section className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-black text-official">دفعات الفحص الصادرة</h2><span className="text-sm font-bold text-muted">{issuedBatches.length} دفعة</span></div>
      <div className="grid gap-5">{issuedBatches.length ? issuedBatches.map((week) => <BatchCard key={week.id} week={week} baseUrl={baseUrl} />) : <Card><div className="rounded-lg border border-slate-200 bg-soft p-4 text-sm font-bold text-muted">لا توجد دفعات روابط صادرة حتى الآن. أنشئ دفعة واختر الفاحصين لتظهر هنا.</div></Card>}</div>
    </section>

    {emptyBatches.length ? <section className="space-y-4"><div><h2 className="text-lg font-black text-official">دفعات غير مكتملة</h2><p className="mt-1 text-sm text-muted">هذه سجلات بلا فاحصين ولا روابط. لا تدخل في المؤشرات التشغيلية ويمكن حذفها بأمان.</p></div><div className="grid gap-3">{emptyBatches.map((week) => <Card key={week.id} className="p-4"><div className="flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><div className="font-black text-official">{week.name}</div><div className="text-sm text-muted">{arDate(week.startsAt)} إلى {arDate(week.endsAt)} · لا توجد روابط نموذج</div></div><form action={deleteEmptyWeek}><input type="hidden" name="id" value={week.id} /><button className="ui-button inline-flex items-center gap-2 rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm font-bold text-danger"><Trash2 className="h-4 w-4" /> حذف السجل</button></form></div></Card>)}</div></section> : null}
  </div>;
}

function BatchCard({ week, baseUrl }: { week: any; baseUrl: string }) {
  const tasks = week.links.flatMap((link: any) => link.tasks);
  return <Card><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black text-official">{week.name}</h2><p className="text-sm text-muted">{arDate(week.startsAt)} إلى {arDate(week.endsAt)} · {week.links.length} رابط نموذج · {tasks.length} مهمة</p></div><Badge tone="security">{week.status}</Badge></div><div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[1080px] text-sm"><thead className="bg-soft"><tr className="border-b text-muted"><th className="p-3 text-right">الفاحص</th><th className="p-3 text-right">رابط نموذج الفحص</th><th className="p-3 text-right">رمز التحقق</th><th className="p-3 text-right">المهام</th><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">الإرسال</th><th className="p-3 text-right">إجراءات</th></tr></thead><tbody>{week.links.map((link: any) => { const url = `${baseUrl}/w/${link.token}`; return <tr key={link.id} className="border-b bg-white last:border-0"><td className="p-3 font-bold text-official">{link.inspector.name}<br /><span className="text-xs text-muted">{link.inspector.employeeNumber}</span></td><td className="p-3"><code className="rounded-md px-2 py-1 text-xs" dir="ltr">{url}</code><div className="mt-2"><a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-security"><ExternalLink className="h-3.5 w-3.5" /> فتح النموذج</a></div></td><td className="p-3 font-black text-security">{link.verificationCode}</td><td className="p-3 text-muted">{link.tasks.length} · {link.tasks.filter((task: any) => task.status === "COMPLETED").length} مكتملة</td><td className="p-3"><Badge tone={link.status === "ACTIVE" ? "success" : "danger"}>{link.status === "ACTIVE" ? "نشط" : "غير نشط"}</Badge></td><td className="p-3"><a className="ui-button inline-flex min-h-10 items-center gap-2 rounded-lg border border-security/20 bg-security px-3 text-sm font-bold text-white transition hover:bg-[#0a9396]" href={buildEmlHref({ to: link.inspector.email ?? "", inspectorName: link.inspector.name, batchName: week.name, url, code: link.verificationCode })} download={`fahs-inspection-form-${link.inspector.employeeNumber}-${week.id}.eml`}><Mail className="h-4 w-4" /> مسودة بريد EML</a></td><td className="p-3"><div className="flex flex-wrap gap-2"><form action={toggleLink}><input type="hidden" name="id" value={link.id} /><button className="ui-button rounded-lg border border-warning/20 bg-warning/10 px-3 py-2 text-sm font-bold text-warning">تعطيل/تفعيل</button></form><form action={regenerateCode}><input type="hidden" name="id" value={link.id} /><button className="ui-button inline-flex items-center gap-2 rounded-lg border border-security/20 bg-white px-3 py-2 text-sm font-bold text-security"><RefreshCw className="h-4 w-4" /> رمز جديد</button></form></div></td></tr>; })}</tbody></table></div></Card>;
}

function buildEmlHref({ to, inspectorName, batchName, url, code }: { to: string; inspectorName: string; batchName: string; url: string; code: string }) {
  const subject = `رابط نموذج الفحص - ${batchName}`;
  const body = [`سعادة الفاحص/ ${inspectorName}`, "", "نأمل الدخول إلى رابط نموذج الفحص واستكمال فحص المنشأة والمهام المسندة لكم عبر نظام الفاحص الذكي.", "", `دفعة الفحص: ${batchName}`, `رابط نموذج الفحص: ${url}`, `رمز التحقق: ${code}`, "", "بعد إكمال النموذج سيتم حفظ النتائج وتوليد التقرير المرتبط بالفحص داخل النظام.", "يرجى عدم مشاركة الرابط أو رمز التحقق مع أي طرف غير مخول.", "", "مع التحية،", "نظام الفاحص الذكي"].join("\r\n");
  const eml = [`To: ${to}`, `Subject: ${encodeMailHeader(subject)}`, "MIME-Version: 1.0", "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: 8bit", "", body].join("\r\n");
  return `data:message/rfc822;charset=utf-8,${encodeURIComponent(eml)}`;
}
function encodeMailHeader(value: string) { return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`; }
