import { headers } from "next/headers";
import { regenerateCode, saveWeek, toggleLink } from "@/app/actions";
import { Badge, Button, Card, Field, SecondaryButton, inputClass } from "@/components/ui";
import { arDate, taskStatusLabel } from "@/lib/format";
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
      <div><h1 className="text-3xl font-black text-official">إصدار روابط فحص</h1><p className="mt-2 text-muted">أنشئ أسبوع الفحص، اختر الفاحصين، وحدد عدد المهام لإصدار رابط مستقل لكل فاحص.</p></div>
      <Card>
        <form action={saveWeek} className="grid gap-4 md:grid-cols-4">
          <Field label="اسم الأسبوع"><input name="name" className={inputClass} required /></Field>
          <Field label="تاريخ البداية"><input name="startsAt" type="date" className={inputClass} required /></Field>
          <Field label="تاريخ النهاية"><input name="endsAt" type="date" className={inputClass} required /></Field>
          <Field label="عدد المهام لكل فاحص"><input name="targetTasks" type="number" defaultValue={10} className={inputClass} required /></Field>
          <div className="md:col-span-4 rounded-3xl border border-white/10 bg-black/20 p-4 light:bg-white/50">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="font-bold text-charcoal">الفاحصون</div>
              <div className="text-xs font-semibold text-muted">يجب اختيار فاحص واحد على الأقل حتى تظهر الروابط.</div>
            </div>
            {params.error === "no-inspectors" ? <div className="mb-3 rounded-2xl bg-danger/15 p-3 text-sm font-bold text-red-100">لم يتم إصدار روابط لأنك لم تختر أي فاحص.</div> : null}
            <div className="grid gap-3 md:grid-cols-3">
              {inspectors.map((i) => (
                <label key={i.id} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.075] p-3 text-sm font-bold text-charcoal transition hover:border-sand/50 hover:bg-white/12">
                  <input type="checkbox" name="inspectorIds" value={i.id} className="h-5 w-5 rounded border-white/30 bg-white/10 text-security focus:ring-security" />
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
          const tasks = week.links.flatMap((l) => l.tasks);
          return <Card key={week.id}><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black text-official">{week.name}</h2><p className="text-sm text-muted">{arDate(week.startsAt)} إلى {arDate(week.endsAt)} · {week.links.length} فاحص · {tasks.length} مهمة</p></div><Badge tone="security">{week.status}</Badge></div>{week.links.length ? <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-muted"><th className="p-3 text-right">الفاحص</th><th className="p-3 text-right">رابط الفحص</th><th className="p-3 text-right">رمز التحقق</th><th className="p-3 text-right">المهام</th><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">إجراءات</th></tr></thead><tbody>{week.links.map((l) => <tr key={l.id} className="border-b last:border-0"><td className="p-3 font-bold">{l.inspector.name}<br/><span className="text-xs text-muted">{l.inspector.employeeNumber}</span></td><td className="p-3"><code className="rounded-lg bg-black/30 px-2 py-1 text-white">{baseUrl}/w/{l.token}</code></td><td className="p-3 font-black text-security">{l.verificationCode}</td><td className="p-3">{l.tasks.length} · {l.tasks.filter((t) => t.status === "COMPLETED").length} مكتملة</td><td className="p-3"><Badge tone={l.status === "ACTIVE" ? "success" : "danger"}>{l.status}</Badge></td><td className="p-3 flex gap-2"><form action={toggleLink}><input type="hidden" name="id" value={l.id}/><button className="font-bold text-warning">تعطيل/تفعيل</button></form><form action={regenerateCode}><input type="hidden" name="id" value={l.id}/><button className="font-bold text-security">رمز جديد</button></form></td></tr>)}</tbody></table></div> : <div className="rounded-2xl border border-warning/25 bg-warning/10 p-4 text-sm font-bold text-amber-100">لم تصدر روابط لهذا الأسبوع لأنه لا يحتوي على فاحصين. استخدم نموذج إصدار روابط فحص واختر الفاحصين قبل الإرسال.</div>}</Card>;
        })}
      </div>
    </div>
  );
}
