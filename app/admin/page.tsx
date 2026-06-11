import Link from "next/link";
import { Activi ty, AlertTriangle, BarChart3, Building2, Chec kCircle2, Clock, Download, FileText, Link2, P ercent, RefreshCw, Search, Timer, Users } fro m "lucide-react";
import { Badge, Button, Car d, SecondaryButton, inputClass } from "@/comp onents/ui";
import { BarsChart, DonutChart, H orizontalBarsChart } from "@/components/chart s";
import { arDate, arDateTime, pct, reportS tatusLabel, taskStatusLabel } from "@/lib/for mat";
import { prisma } from "@/lib/prisma";
 
type DashboardFilters = { period?: string; w eekId?: string; inspectorId?: string; city?:  string; facilityTypeId?: string };

export de fault async function InformationDashboard({ s earchParams }: { searchParams: Promise<Dashbo ardFilters> }) {
  const filters = await sear chParams;
  const [inspectors, weeks, facilit yTypes, facilities, tasks, links, reports, ob servations, highResponses, auditLogs] = await  Promise.all([
    prisma.inspector.findMany( { where: { status: "ACTIVE" }, orderBy: { nam e: "asc" } }),
    prisma.inspectionWeek.find Many({ orderBy: { startsAt: "desc" } }),
     prisma.facilityType.findMany({ where: { isAct ive: true }, orderBy: { name: "asc" } }),
     prisma.facility.findMany({ select: { city: t rue } }),
    prisma.inspectionTask.findMany( { include: { link: { include: { inspector: tr ue, week: true } }, report: { include: { faci lity: { include: { facilityType: true } } } }  } }),
    prisma.weeklyLink.findMany({ inclu de: { inspector: true, week: true, tasks: tru e } }),
    prisma.report.findMany({ include:  { facility: { include: { facilityType: true  } }, task: { include: { link: { include: { in spector: true, week: true } } } }, responses:  { include: { checklistItem: true } }, observ ations: true }, orderBy: { createdAt: "desc"  } }),
    prisma.observation.findMany({ inclu de: { response: { include: { checklistItem: t rue } }, report: { include: { task: { include : { link: true } }, facility: { include: { fa cilityType: true } } } } } }),
    prisma.ins pectionResponse.count({ where: { evaluationSt atus: "NON_COMPLIANT", checklistItem: { impor tance: "HIGH" } } }),
    prisma.auditLog.fin dMany({ where: { status: "FAILED" }, orderBy:  { createdAt: "desc" }, take: 20 }),
  ]);

   const filteredTasks = tasks.filter((task) =>  matchesTask(task, filters));
  const filtere dReports = reports.filter((report) => matches Report(report, filters));
  const filteredLin ks = links.filter((link) => matchesLink(link,  filters));
  const filteredObservations = ob servations.filter((observation) => matchesRep ort(observation.report, filters));
  const to dayReports = filteredReports.filter((report)  => isToday(report.approvedAt ?? report.update dAt));
  const completed = filteredTasks.filt er((task) => task.status === "COMPLETED").len gth;
  const inProgress = filteredTasks.filte r((task) => task.status === "IN_PROGRESS").le ngth;
  const late = filteredTasks.filter((ta sk) => task.status === "LATE").length;
  cons t unusedTasks = filteredTasks.filter((task) = > task.status === "UNUSED").length;
  const c ancelled = filteredTasks.filter((task) => tas k.status === "CANCELLED").length;
  const act iveLinks = filteredLinks.filter((link) => lin k.status === "ACTIVE").length;
  const unused Links = filteredLinks.filter((link) => !link. acknowledgedAt && link.tasks.every((task) =>  task.status === "UNUSED")).length;
  const in completeReports = filteredReports.filter((rep ort) => report.status === "DRAFT" || report.s tatus === "IN_PROGRESS").length;
  const avgC ompliance = avg(filteredReports.map((report)  => report.complianceRate));
  const highNotes  = filteredObservations.filter((observation)  => observation.response.checklistItem.importa nce === "HIGH").length;
  const query = new U RLSearchParams(cleanParams(filters)).toString ();

  const taskStatusData = [
    { name: " غير مستخدمة", value: unusedTasks }, 
    { name: "قيد العمل", value: inPr ogress },
    { name: "مكتملة", value:  completed },
    { name: "متأخرة", valu e: late },
    { name: "ملغاة", value: c ancelled },
  ];
  const inspectorCompletion  = inspectors.map((inspector) => {
    const i nspectorTasks = filteredTasks.filter((task) = > task.link.inspectorId === inspector.id);
     return { name: inspector.name, value: ratio (inspectorTasks.filter((task) => task.status  === "COMPLETED").length, inspectorTasks.lengt h) };
  }).filter((item) => item.value > 0).s ort((a, b) => b.value - a.value).slice(0, 8); 
  const byCity = groupCount(filteredReports. map((report) => report.facility?.city ?? "غ� �ر محدد")).slice(0, 8);
  const topNonCo mpliant = topResponses(filteredReports).slice (0, 5);
  const complianceByType = avgByType( filteredReports).slice(0, 8);
  const inspect orRows = inspectors.map((inspector) => buildI nspectorRow(inspector, filteredTasks, filtere dReports)).sort((a, b) => b.completed - a.com pleted).slice(0, 5);
  const latestReports =  filteredReports.slice(0, 10);

  return <div  className="space-y-6">
    <section className ="rounded-xl border border-security/10 bg-whi te/85 p-5 shadow-[0_14px_36px_rgba(18,48,71,. 06)]">
      <div className="flex flex-col ga p-4 xl:flex-row xl:items-start xl:justify-bet ween">
        <div><p className="text-sm fon t-bold text-security">الفاحص الذكي </p><h1 className="mt-1 text-2xl font-black t ext-official">لوحة المعلومات</h1 ><p className="mt-2 max-w-4xl text-sm leading -7 text-muted">نظرة تشغيلية شام لة على روابط الفحص، المه� �م، التقارير، الملاحظات،  ومستوى الإنجاز.</p></div>
         <div className="flex flex-wrap gap-2"><Sec ondaryButton href={`/admin?${query}`} classNa me="gap-2"><RefreshCw className="h-4 w-4" />  تحديث البيانات</SecondaryButton> <Button href={`/api/admin/dashboard/export?${ query}`} className="gap-2"><Download classNam e="h-4 w-4" /> تصدير Excel</Button></div >
      </div>
      <form className="mt-5 gr id gap-3 md:grid-cols-5 xl:grid-cols-7">
         <Select name="period" label="الفترة  الزمنية" value={filters.period} optio ns={[["", "كل الفترات"], ["week", "� �خر 7 أيام"], ["month", "آخر 30 يو م"]]} />
        <Select name="weekId" label ="الأسبوع" value={filters.weekId} opti ons={[["", "كل الأسابيع"], ...weeks .map((week) => [week.id, week.name] as [strin g, string])]} />
        <Select name="inspec torId" label="الفاحص" value={filters.in spectorId} options={[["", "كل الفاحص� �ن"], ...inspectors.map((inspector) => [insp ector.id, inspector.name] as [string, string] )]} />
        <Select name="city" label="ا� �مدينة" value={filters.city} options={[[ "", "كل المدن"], ...unique(facilities. map((facility) => facility.city)).map((city)  => [city, city] as [string, string])]} />
         <Select name="facilityTypeId" label="ن� �ع المنشأة" value={filters.facilityTy peId} options={[["", "كل الأنواع"],  ...facilityTypes.map((type) => [type.id, type .name] as [string, string])]} />
        <div  className="flex items-end gap-2 md:col-span- 2"><Button className="gap-2"><Search classNam e="h-4 w-4" /> تطبيق</Button><SecondaryB utton href="/admin">إعادة ضبط</Second aryButton></div>
      </form>
    </section> 

    <Card className="border-security/20 p-5 ">
      <div className="flex flex-col gap-4  xl:flex-row xl:items-center xl:justify-betwee n">
        <div><div className="mb-2 inline- flex items-center gap-2 rounded-full border b order-security/15 bg-security/7 px-3 py-1 tex t-xs font-black text-security"><Link2 classNa me="h-4 w-4" /> الإجراء الأساسي </div><h2 className="text-xl font-black text- official">توليد روابط نموذج ا لفاحص</h2><p className="mt-2 max-w-3xl t ext-sm leading-7 text-muted">أنشئ دفع� � فحص، اختر الفاحصين، ثم � �مّل مسودات البريد EML لإر� �ال روابط النماذج ورموز ا لتحقق.</p></div>
        <div className= "flex flex-wrap gap-3"><Button href="/admin/w eeks" className="px-5">توليد الروا� �ط</Button><Button href="/admin/weeks" class Name="bg-official hover:bg-[#0d2538]">مسو� �ات EML</Button></div>
      </div>
    </C ard>

    <div className="grid gap-4 sm:grid- cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid -cols-6">
      <Kpi icon={Users} label="ال فاحصون النشطون" value={inspector s.length} />
      <Kpi icon={CalendarIcon} l abel="الأسابيع النشطة" value={w eeks.filter((week) => week.status === "ACTIVE ").length} />
      <Kpi icon={Link2} label=" روابط نموذج نشطة" value={active Links} tone="success" />
      <Kpi icon={Cli pboardIcon} label="المهام المخصص� �" value={filteredTasks.length} />
      <Kpi  icon={CheckCircle2} label="المهام ال مكتملة" value={completed} tone="success " />
      <Kpi icon={Clock} label="قيد ا لعمل" value={inProgress} tone="warning" / >
      <Kpi icon={AlertTriangle} label="ال متأخرة" value={late} tone="danger" />
       <Kpi icon={FileText} label="إجمالي  التقارير" value={filteredReports.len gth} />
      <Kpi icon={Percent} label="مت وسط المطابقة" value={pct(avgCompli ance)} tone="success" />
      <Kpi icon={Act ivity} label="إجمالي الملاحظات " value={filteredObservations.length} tone="w arning" />
      <Kpi icon={AlertTriangle} la bel="غير مطابق عالي الأهمي� �" value={highResponses} tone="danger" />
     </div>

    <section><h2 className="mb-3 tex t-lg font-black text-official">ملخص ال� �وم</h2><div className="grid gap-4 md:grid- cols-4"><SummaryCard label="مهام تحتا ج متابعة" value={late + inProgress} hr ef="/admin/weeks" /><SummaryCard label="تق� �رير صدرت اليوم" value={todayRepo rts.length} href="/admin/reports" /><SummaryC ard label="روابط لم تستخدم بع� �" value={unusedLinks} href="/admin/weeks" /> <SummaryCard label="ملاحظات عالية  الأهمية" value={highNotes} href="/adm in/reports" /></div></section>

    <div clas sName="grid gap-6 xl:grid-cols-2"><ChartCard  title="توزيع حالات المهام" ic on={BarChart3}><DonutChart data={taskStatusDa ta} legend /></ChartCard><ChartCard title="ا لإنجاز حسب الفاحص" icon={Users }><HorizontalBarsChart data={emptyChart(inspe ctorCompletion)} percent /></ChartCard></div> 
    <div className="grid gap-6 xl:grid-cols- 3"><ChartCard title="التقارير حسب  المدينة" icon={Building2}><BarsChart d ata={emptyChart(byCity)} /></ChartCard><Chart Card title="أكثر البنود غير ال مطابقة" icon={AlertTriangle}><Horizonta lBarsChart data={emptyChart(topNonCompliant)}  /></ChartCard><ChartCard title="متوسط � �لمطابقة حسب نوع المنشأة"  icon={Percent}><HorizontalBarsChart data={em ptyChart(complianceByType)} percent height={M ath.max(288, complianceByType.length * 48)} / ></ChartCard></div>

    <div className="grid  gap-6 xl:grid-cols-3"><Card><h2 className="m b-4 text-lg font-black text-official">تحت� �ج متابعة</h2><div className="grid gap -3"><Followup label="مهام متأخرة" v alue={late} href="/admin/weeks" tone="danger"  /><Followup label="تقارير غير مك� �ملة" value={incompleteReports} href="/adm in/reports" tone="warning" /><Followup label= "روابط غير مستخدمة" value={unu sedLinks} href="/admin/weeks" /><Followup lab el="ملاحظات عالية الأهمية"  value={highNotes} href="/admin/reports" tone ="danger" /><Followup label="محاولات � �حقق فاشلة" value={auditLogs.length}  href="/admin/audit" tone="warning" /></div></ Card><Card className="xl:col-span-2"><div cla ssName="mb-4 flex items-center justify-betwee n"><h2 className="text-lg font-black text-off icial">آخر التقارير</h2><Secondary Button href="/admin/reports">عرض جميع  التقارير</SecondaryButton></div><Repo rtsTable reports={latestReports} /></Card></d iv>

    <Card><div className="mb-4 flex item s-center justify-between"><h2 className="text -lg font-black text-official">أداء الف احصين</h2><SecondaryButton href="/admin/ performance">عرض مؤشرات أداء ا� �فاحصين</SecondaryButton></div><Inspect orsTable rows={inspectorRows} /></Card>
  </d iv>;
}

function Select({ label, name, value,  options }: { label: string; name: string; va lue?: string; options: [string, string][] })  { return <label className="block"><span class Name="mb-2 block text-sm font-bold text-offic ial">{label}</span><select name={name} defaul tValue={value ?? ""} className={inputClass}>{ options.map(([v, l]) => <option key={v} value ={v}>{l}</option>)}</select></label>; }
funct ion Kpi({ icon: Icon, label, value, tone = "s ecurity" }: { icon: typeof Activity; label: s tring; value: string | number; tone?: "securi ty" | "success" | "warning" | "danger" }) { c onst colors = { security: "text-security bg-s ecurity/7 border-security/15", success: "text -success bg-success/10 border-success/20", wa rning: "text-warning bg-warning/10 border-war ning/20", danger: "text-danger bg-danger/10 b order-danger/20" }; return <Card className="p -4 transition hover:-translate-y-0.5 hover:bo rder-security/20"><div className="flex items- start justify-between gap-3"><div><div classN ame="text-sm font-bold text-muted">{label}</d iv><div className="mt-3 text-2xl font-black t ext-official">{value}</div></div><span classN ame={`grid h-10 w-10 place-items-center round ed-lg border ${colors[tone]}`}><Icon classNam e="h-5 w-5" /></span></div></Card>; }
functio n SummaryCard({ label, value, href }: { label : string; value: number; href: string }) { re turn <Card className="p-4"><div className="te xt-sm font-bold text-muted">{label}</div><div  className="mt-2 text-2xl font-black text-off icial">{value}</div><Link href={href} classNa me="mt-3 inline-flex text-sm font-bold text-s ecurity">عرض التفاصيل</Link></Card >; }
function ChartCard({ title, icon: Icon,  children }: { title: string; icon: typeof Act ivity; children: React.ReactNode }) { return  <Card><div className="mb-4 flex items-center  gap-3"><span className="grid h-9 w-9 place-it ems-center rounded-lg bg-security/10 text-sec urity"><Icon className="h-5 w-5" /></span><h2  className="text-base font-black text-officia l">{title}</h2></div>{children}</Card>; }
fun ction Followup({ label, value, href, tone = " security" }: { label: string; value: number;  href: string; tone?: "security" | "warning" |  "danger" }) { return <div className="flex it ems-center justify-between rounded-lg border  border-slate-200 bg-soft p-3"><div><div class Name="text-sm font-bold text-official">{label }</div><Badge tone={tone}>{value}</Badge></di v><SecondaryButton href={href} className="min -h-9 px-3">انتقال</SecondaryButton></di v>; }
function ReportsTable({ reports }: { re ports: any[] }) { if (!reports.length) return  <Empty />; return <div className="overflow-x -auto"><table className="w-full min-w-[900px]  text-sm"><thead className="bg-soft text-mute d"><tr>{["رقم التقرير","اسم ال منشأة","الفاحص","المدينة"," المطابقة","الملاحظات","ال� �الة","تاريخ الاعتماد","إج� �اء"].map((h) => <th key={h} className="p-3  text-right">{h}</th>)}</tr></thead><tbody>{r eports.map((report) => <tr key={report.id} cl assName="border-b last:border-0"><td classNam e="p-3 font-bold">{report.reportNumber}</td>< td className="p-3">{report.facility?.name ??  "-"}</td><td className="p-3">{report.task?.li nk?.inspector?.name ?? "-"}</td><td className ="p-3">{report.facility?.city ?? "-"}</td><td  className="p-3 font-black text-security">{pc t(report.complianceRate)}</td><td className=" p-3">{report.notesCount}</td><td className="p -3"><Badge tone={report.status === "APPROVED"  ? "success" : "warning"}>{reportStatusLabel( report.status)}</Badge></td><td className="p- 3">{arDate(report.approvedAt)}</td><td classN ame="p-3"><div className="flex gap-2"><Second aryButton href={`/reports/${report.id}`} clas sName="min-h-9 px-3">فتح</SecondaryButton> <Button href={`/api/reports/${report.id}/pdf` } className="min-h-9 px-3">PDF</Button></div> </td></tr>)}</tbody></table></div>; }
functio n InspectorsTable({ rows }: { rows: any[] })  { if (!rows.length) return <Empty />; return  <div className="overflow-x-auto"><table class Name="w-full min-w-[820px] text-sm"><thead cl assName="bg-soft text-muted"><tr>{["اسم ا لفاحص","المهام المكتملة"," نسبة الإنجاز","متوسط المط ابقة","عدد الملاحظات","آخر  نشاط"].map((h) => <th key={h} className= "p-3 text-right">{h}</th>)}</tr></thead><tbod y>{rows.map((row) => <tr key={row.id} classNa me="border-b last:border-0"><td className="p- 3 font-black text-security">{row.name}</td><t d className="p-3">{row.completed}</td><td cla ssName="p-3">{pct(row.completionRate)}</td><t d className="p-3">{pct(row.avgCompliance)}</t d><td className="p-3">{row.notes}</td><td cla ssName="p-3">{arDateTime(row.lastActivity)}</ td></tr>)}</tbody></table></div>; }
function  Empty() { return <div className="rounded-lg b order border-slate-200 bg-soft p-4 text-sm fo nt-bold text-muted">لا توجد بيانا� � ضمن الفلاتر الحالية.</div> ; }

function buildInspectorRow(inspector: an y, tasks: any[], reports: any[]) { const t =  tasks.filter((task) => task.link.inspectorId  === inspector.id); const r = reports.filter(( report) => report.task?.link?.inspectorId ===  inspector.id); return { id: inspector.id, na me: inspector.name, completed: t.filter((task ) => task.status === "COMPLETED").length, com pletionRate: ratio(t.filter((task) => task.st atus === "COMPLETED").length, t.length), avgC ompliance: avg(r.map((report) => report.compl ianceRate)), notes: r.reduce((sum, report) =>  sum + report.notesCount, 0), lastActivity: l atestDate([...t.map((task) => task.updatedAt) , ...r.map((report) => report.updatedAt)]) };  }
function matchesTask(task: any, f: Dashboa rdFilters) { if (f.inspectorId && task.link.i nspectorId !== f.inspectorId) return false; i f (f.weekId && task.link.weekId !== f.weekId)  return false; if (f.city && task.report?.fac ility?.city !== f.city) return false; if (f.f acilityTypeId && task.report?.facility?.facil ityTypeId !== f.facilityTypeId) return false;  if (f.period === "week" && !isRecent(task.cr eatedAt, 7)) return false; if (f.period === " month" && !isRecent(task.createdAt, 31)) retu rn false; return true; }
function matchesRepo rt(report: any, f: DashboardFilters) { if (f. inspectorId && report.task?.link?.inspectorId  !== f.inspectorId) return false; if (f.weekI d && report.task?.link?.weekId !== f.weekId)  return false; if (f.city && report.facility?. city !== f.city) return false; if (f.facility TypeId && report.facility?.facilityTypeId !==  f.facilityTypeId) return false; if (f.period  === "week" && !isRecent(report.createdAt, 7) ) return false; if (f.period === "month" && ! isRecent(report.createdAt, 31)) return false;  return true; }
function matchesLink(link: an y, f: DashboardFilters) { if (f.inspectorId & & link.inspectorId !== f.inspectorId) return  false; if (f.weekId && link.weekId !== f.week Id) return false; if (f.period === "week" &&  !isRecent(link.createdAt, 7)) return false; i f (f.period === "month" && !isRecent(link.cre atedAt, 31)) return false; return true; }
fun ction topResponses(reports: any[]) { const ma p = new Map<string, { name: string; fullName:  string; value: number }>(); reports.flatMap( (report) => report.responses).filter((respons e) => response.evaluationStatus === "NON_COMP LIANT").forEach((response) => { const fullNam e = `${response.checklistItem.itemNumber} - $ {response.checklistItem.requirementText}`; co nst name = truncate(`${response.checklistItem .itemNumber} - ${response.checklistItem.mainS ection}`, 24); const current = map.get(respon se.checklistItemId) ?? { name, fullName, valu e: 0 }; current.value += 1; map.set(response. checklistItemId, current); }); return [...map .values()].sort((a, b) => b.value - a.value);  }
function avgByType(reports: any[]) { const  map = new Map<string, number[]>(); reports.f orEach((report) => { const name = report.faci lity?.facilityType?.name ?? report.facility?. classification ?? "غير محدد"; map.set( name, [...(map.get(name) ?? []), report.compl ianceRate]); }); return [...map.entries()].ma p(([name, values]) => ({ name: truncate(name,  22), fullName: name, value: Math.round(avg(v alues)) })).sort((a, b) => b.value - a.value) ; }
function groupCount(items: string[]) { co nst map = new Map<string, number>(); items.fo rEach((item) => map.set(item, (map.get(item)  ?? 0) + 1)); return [...map.entries()].map(([ name, value]) => ({ name, value })).sort((a,  b) => b.value - a.value); }
function emptyCha rt(data: any[]) { return data.length ? data :  [{ name: "لا توجد بيانات", value : 0 }]; }
function cleanParams(filters: Dashb oardFilters) { return Object.fromEntries(Obje ct.entries(filters).filter(([, v]) => v)); }
 function unique<T>(items: T[]) { return [...n ew Set(items.filter(Boolean))]; }
function av g(values: number[]) { const safe = values.fil ter((value) => Number.isFinite(value)); retur n safe.length ? safe.reduce((sum, value) => s um + value, 0) / safe.length : 0; }
function  ratio(part: number, total: number) { return t otal ? Math.round((part / total) * 100) : 0;  }
function isRecent(value: Date | string, day s: number) { return Date.now() - new Date(val ue).valueOf() <= days * 24 * 60 * 60 * 1000;  }
function isToday(value?: Date | string | nu ll) { if (!value) return false; const date =  new Date(value); const now = new Date(); retu rn date.toDateString() === now.toDateString() ; }
function latestDate(values: any[]) { cons t dates = values.filter(Boolean).map((value)  => new Date(value)).filter((date) => !Number. isNaN(date.valueOf())); return dates.length ?  new Date(Math.max(...dates.map((date) => dat e.valueOf()))) : null; }
function truncate(va lue: string, max: number) { return value.leng th > max ? `${value.slice(0, max - 1)}…` :  value; }
const CalendarIcon = Timer;
const Cl ipboardIcon = FileText; 