import { regenerateCode, saveWeek, toggleLink } from "@/app/actions";
import { Badge, Button, Card, Field, SecondaryButton, inputClass } from "@/components/ui";
import { arDate, taskStatusLabel } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function WeeksPage() {
  const [inspectors, weeks] = await Promise.all([
    prisma.inspector.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    prisma.inspectionWeek.findMany({ include: { links: { include: { inspector: true, tasks: true } } }, orderBy: { createdAt: "desc" } })
  ]);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-black text-official">إدارة أسابيع الفحص</h1><p className="mt-2 text-muted">إنشاء الأسابيع وإصدار الروابط الأسبوعية ورموز التحقق.</p></div>
      <Card>
        <form action={saveWeek} className="grid gap-4 md:grid-cols-4">
          <Field label="اسم الأسبوع"><input name="name" className={inputClass} required /></Field>
          <Field label="تاريخ البداية"><input name="startsAt" type="date" className={inputClass} required /></Field>
          <Field label="تاريخ النهاية"><input name="endsAt" type="date" className={inputClass} required /></Field>
          <Field label="عدد المهام لكل فاحص"><input name="targetTasks" type="number" defaultValue={10} className={inputClass} required /></Field>
          <div className="md:col-span-4 rounded-3xl bg-soft p-4"><div className="mb-3 font-bold">الفاحصون</div><div className="grid gap-3 md:grid-cols-3">{inspectors.map((i) => <label key={i.id} className="flex items-center gap-2 rounded-2xl bg-white p-3 text-sm font-bold"><input type="checkbox" name="inspectorIds" value={i.id} />{i.name} - {i.employeeNumber}</label>)}</div></div>
          <Button className="md:col-span-4">إنشاء أسبوع وإصدار الروابط</Button>
        </form>
      </Card>
      <div className="grid gap-5">
        {weeks.map((week) => {
          const tasks = week.links.flatMap((l) => l.tasks);
          return <Card key={week.id}><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black text-official">{week.name}</h2><p className="text-sm text-muted">{arDate(week.startsAt)} إلى {arDate(week.endsAt)} · {week.links.length} فاحص · {tasks.length} مهمة</p></div><Badge tone="security">{week.status}</Badge></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-muted"><th className="p-3 text-right">الفاحص</th><th className="p-3 text-right">الرابط</th><th className="p-3 text-right">رمز التحقق</th><th className="p-3 text-right">المهام</th><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">إجراءات</th></tr></thead><tbody>{week.links.map((l) => <tr key={l.id} className="border-b last:border-0"><td className="p-3 font-bold">{l.inspector.name}<br/><span className="text-xs text-muted">{l.inspector.employeeNumber}</span></td><td className="p-3"><code className="rounded-lg bg-soft px-2 py-1">{baseUrl}/w/{l.token}</code></td><td className="p-3 font-black text-security">{l.verificationCode}</td><td className="p-3">{l.tasks.length} · {l.tasks.filter((t) => t.status === "COMPLETED").length} مكتملة</td><td className="p-3"><Badge tone={l.status === "ACTIVE" ? "success" : "danger"}>{l.status}</Badge></td><td className="p-3 flex gap-2"><form action={toggleLink}><input type="hidden" name="id" value={l.id}/><button className="font-bold text-warning">تعطيل/تفعيل</button></form><form action={regenerateCode}><input type="hidden" name="id" value={l.id}/><button className="font-bold text-security">رمز جديد</button></form></td></tr>)}</tbody></table></div></Card>;
        })}
      </div>
    </div>
  );
}
