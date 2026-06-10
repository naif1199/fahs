import { redirect } from "next/navigation";
import { acceptDeclaration, startTask } from "@/app/actions";
import { Logo } from "@/components/logo";
import { Badge, Button, Card, SecondaryButton } from "@/components/ui";
import { arDate, taskStatusLabel } from "@/lib/format";
import { hasLinkCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function TasksPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await hasLinkCookie(token))) redirect(`/w/${token}`);
  const link = await prisma.weeklyLink.findUniqueOrThrow({ where: { token }, include: { inspector: true, week: true, tasks: { include: { report: true }, orderBy: { number: "asc" } } } });
  const completed = link.tasks.filter((t) => t.status === "COMPLETED").length;
  const remaining = link.tasks.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED").length;
  const progress = link.tasks.length ? Math.round((completed / link.tasks.length) * 100) : 0;
  const declaration = (await prisma.systemSetting.findUnique({ where: { key: "inspectorDeclaration" } }))?.value;
  return <main className="mx-auto max-w-7xl space-y-6 p-4 lg:p-8"><div className="flex flex-wrap items-center justify-between gap-4"><Logo/><SecondaryButton href={`/w/${token}`}>تغيير بيانات التحقق</SecondaryButton></div><Card><div className="grid gap-4 md:grid-cols-4"><div><div className="text-sm text-muted">الفاحص</div><div className="text-xl font-black text-official">{link.inspector.name}</div><div className="text-sm text-muted">{link.inspector.employeeNumber}</div></div><div><div className="text-sm text-muted">الأسبوع</div><div className="font-bold">{link.week.name}</div><div className="text-sm text-muted">{arDate(link.week.startsAt)} - {arDate(link.week.endsAt)}</div></div><div><div className="text-sm text-muted">المستهدف / المكتمل / المتبقي</div><div className="text-xl font-black text-security">{link.targetTasks} / {completed} / {remaining}</div></div><div><div className="text-sm text-muted">نسبة الإنجاز</div><div className="text-3xl font-black text-success">{progress}%</div></div></div></Card>{!link.acknowledgedAt ? <Card className="border-sand bg-sand/15"><h2 className="text-xl font-black text-official">إقرار الفاحص</h2><p className="mt-3 leading-8 text-charcoal">{declaration}</p><form action={acceptDeclaration} className="mt-5"><input type="hidden" name="token" value={token}/><Button>أوافق وأبدأ الفحص</Button></form></Card> : null}<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{link.tasks.map((task) => <Card key={task.id} className="p-5"><div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-black text-official">المهمة رقم {task.number}</h3><Badge tone={task.status === "COMPLETED" ? "success" : task.status === "IN_PROGRESS" ? "warning" : "muted"}>{taskStatusLabel(task.status)}</Badge></div>{task.status === "UNUSED" ? <form action={startTask}><input type="hidden" name="token" value={token}/><input type="hidden" name="taskId" value={task.id}/><Button className="w-full" type="submit">بدء فحص جديد</Button></form> : task.status === "IN_PROGRESS" ? <Button href={`/w/${token}/tasks/${task.id}`} className="w-full">استكمال الفحص</Button> : task.report ? <Button href={`/reports/${task.report.id}`} className="w-full">عرض التقرير</Button> : null}</Card>)}</div></main>;
}
