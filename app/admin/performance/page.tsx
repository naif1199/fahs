import Link from "next/link";
import { AlertT riangle, BarChart3, Download, FileText, LineC hart, RotateCcw, Search, Users } from "lucide -react";
import { Badge, Button, Card, Second aryButton, inputClass } from "@/components/ui ";
import { BarsChart, DonutChart, Horizontal BarsChart } from "@/components/charts";
impor t { arDateTime, pct, taskStatusLabel } from " @/lib/format";
import { getPerformanceContext , PerformanceFilters } from "@/lib/performanc e";

export default async function InspectorP erformancePage({ searchParams }: { searchPara ms: Promise<PerformanceFilters> }) {
  const  filters = await searchParams;
  const context  = await getPerformanceContext(filters);
  co nst exportQuery = new URLSearchParams(cleanPa rams(filters)).toString();

  return <div cla ssName="space-y-6">
    <div className="flex  flex-col justify-between gap-4 rounded-xl bor der border-security/10 bg-white/85 p-5 shadow -[0_14px_36px_rgba(18,48,71,.06)] xl:flex-row  xl:items-end">
      <div><p className="text -sm font-bold text-security">مؤشرات أ� �اء الفاحصين</p><h1 className="mt-1  text-2xl font-black text-official">لوحة  قياس أداء الفاحصين</h1><p cla ssName="mt-2 max-w-4xl text-sm leading-7 text -muted">قياس أسبوعي وشهري لل إنتاجية، جودة التوثيق، ا لالتزام التشغيلي، والفا� �لية الرقابية بناءً على ب يانات المهام والتقارير و الملاحظات والمرفقات.</p></d iv>
      <div className="flex flex-wrap gap- 3"><Button href={`/api/admin/performance/expo rt?${exportQuery}`}>تصدير Excel</Button> <SecondaryButton href="/admin/performance" cl assName="gap-2"><RotateCcw className="h-4 w-4 " /> إعادة ضبط</SecondaryButton></div >
    </div>

    <Card><form className="grid  gap-3 md:grid-cols-4 xl:grid-cols-8">
       <Select name="period" label="الفترة ا� �زمنية" value={filters.period} options={ [["", "كل الفترات"], ["week", "آخ� � 7 أيام"], ["month", "آخر 30 يوم"] ]} />
      <Select name="weekId" label="ال أسبوع" value={filters.weekId} options={[ ["", "كل الأسابيع"], ...context.wee ks.map((w) => [w.id, w.name] as [string, stri ng])]} />
      <Field label="الشهر"><in put name="month" type="month" defaultValue={f ilters.month ?? ""} className={inputClass} /> </Field>
      <Select name="inspectorId" lab el="الفاحص" value={filters.inspectorId}  options={[["", "كل الفاحصين"], ... context.inspectors.map((i) => [i.id, i.name]  as [string, string])]} />
      <Select name= "city" label="المدينة" value={filters. city} options={[["", "كل المدن"], ...c ontext.cities.map((city) => [city, city] as [ string, string])]} />
      <Select name="fac ilityTypeId" label="نوع المنشأة" va lue={filters.facilityTypeId} options={[["", " كل الأنواع"], ...context.facilityTyp es.map((t) => [t.id, t.name] as [string, stri ng])]} />
      <Select name="status" label=" حالة المهمة" value={filters.status}  options={[["", "كل الحالات"], ...[" UNUSED", "IN_PROGRESS", "COMPLETED", "LATE",  "CANCELLED"].map((s) => [s, taskStatusLabel(s )] as [string, string])]} />
      <Select na me="sensitivity" label="مستوى الحسا سية" value={filters.sensitivity} options={ [["", "كل المستويات"], ...context. sensitivities.map((s) => [s, s] as [string, s tring])]} />
      <Select name="reportStatus " label="نوع التقرير" value={filter s.reportStatus} options={[["", "كل التق ارير"], ["APPROVED", "معتمد"], ["LOC KED", "مقفل"], ["IN_PROGRESS", "قيد ا لعمل"], ["DRAFT", "مسودة"]]} />
       <Field label="بحث"><input name="q" defau ltValue={filters.q ?? ""} className={inputCla ss} placeholder="اسم أو رقم فاحص"  /></Field>
      <div className="flex items- end gap-2 md:col-span-2"><Button className="g ap-2"><Search className="h-4 w-4" /> تطبي ق الفلاتر</Button><SecondaryButton hr ef="/admin/performance">إعادة ضبط</Se condaryButton></div>
    </form></Card>

     <div className="grid gap-4 sm:grid-cols-2 xl: grid-cols-5">
      <Kpi label="إجمالي  الفاحصين النشطين" value={conte xt.totals.activeInspectors} />
      <Kpi lab el="إجمالي المهام المخصصة"  value={context.totals.assignedTasks} />
       <Kpi label="إجمالي المهام ال� �كتملة" value={context.totals.completedT asks} tone="success" />
      <Kpi label="إ� �مالي المهام المتأخرة" valu e={context.totals.lateTasks} tone="danger" /> 
      <Kpi label="نسبة الإنجاز ا لعامة" value={pct(context.totals.complet ionRate)} tone="success" />
      <Kpi label= "متوسط نسبة المطابقة" value= {pct(context.totals.avgCompliance)} />
       <Kpi label="متوسط الملاحظات ل� �ل تقرير" value={context.totals.avgNote s} tone="warning" />
      <Kpi label="متو سط زمن إصدار التقرير" value= {`${context.totals.avgReportIssueHours} سا� �ة`} />
      <Kpi label="التقارير � �لمعتمدة" value={context.totals.approv edReports} tone="success" />
      <Kpi label ="التقارير غير المكتملة" v alue={context.totals.incompleteReports} tone= "warning" />
    </div>

    <div className=" grid gap-6 xl:grid-cols-3">
      <ChartCard  title="مقارنة أداء الفاحصين " icon={BarChart3}><BarsChart data={context.c harts.overall} /></ChartCard>
      <ChartCar d title="توزيع حالات المهام"  icon={FileText}><DonutChart data={context.cha rts.taskStatus} /></ChartCard>
      <ChartCa rd title="أعلى جودة توثيق" icon= {LineChart}><HorizontalBarsChart data={contex t.charts.documentation} /></ChartCard>
       <ChartCard title="أكثر الفاحصين � �نجازًا" icon={Users}><HorizontalBarsCh art data={context.charts.productivity} /></Ch artCard>
      <ChartCard title="متوسط � �من إنجاز التقرير" icon={LineCh art}><HorizontalBarsChart data={context.chart s.reportHours} /></ChartCard>
      <Card><di v className="mb-4 flex items-center gap-3"><s pan className="grid h-9 w-9 place-items-cente r rounded-lg bg-warning/10 text-warning"><Ale rtTriangle className="h-5 w-5" /></span><h2 c lassName="text-base font-black text-official" >تنبيهات الأداء</h2></div><div c lassName="grid gap-2">{context.alerts.length  ? context.alerts.map((alert, i) => <div key={ i} className="rounded-lg border border-slate- 200 bg-soft p-3"><Badge tone={alert.tone}>{al ert.title}</Badge><p className="mt-2 text-sm  text-muted">{alert.text}</p></div>) : <p clas sName="text-sm text-muted">لا توجد تن بيهات أداء حاليًا.</p>}</div>< /Card>
    </div>

    <Card><div className=" mb-4 flex items-center justify-between gap-3" ><h2 className="text-lg font-black text-offic ial">جدول أداء الفاحصين</h2>< SecondaryButton href={`/admin/performance?${n ew URLSearchParams({ ...cleanParams(filters),  sort: "overallScore", dir: filters.dir === " asc" ? "desc" : "asc" }).toString()}`}>فرز  الأداء</SecondaryButton></div><div cla ssName="overflow-x-auto rounded-xl border bor der-slate-200"><table className="w-full min-w -[1500px] text-sm"><thead className="bg-soft  text-muted"><tr>{["اسم الفاحص","ال رقم الوظيفي","المخصصة","ال مكتملة","الإنجاز","المطاب� �ة","الملاحظات","جودة التو� �يق","الالتزام","الإنتاجية ","الفاعلية","الأداء العام ","التصنيف","آخر نشاط"].map((h)  => <th key={h} className="p-3 text-right">{h }</th>)}</tr></thead><tbody>{context.rows.map ((row) => <tr key={row.id} className="border- b bg-white last:border-0"><td className="p-3  font-black text-security"><Link href={`/admin /performance/${row.id}`}>{row.name}</Link></t d><td className="p-3">{row.employeeNumber}</t d><td className="p-3">{row.assignedTasks}</td ><td className="p-3">{row.completedTasks}</td ><td className="p-3">{pct(row.completionRate) }</td><td className="p-3">{pct(row.avgComplia nce)}</td><td className="p-3">{row.notesCount }</td><td className="p-3">{pct(row.documentat ionQuality)}</td><td className="p-3">{pct(row .operationalCommitment)}</td><td className="p -3">{pct(row.productivity)}</td><td className ="p-3">{pct(row.regulatoryEffectiveness)}</td ><td className="p-3 font-black text-official" >{row.overallScore}</td><td className="p-3">< Badge tone={row.ratingTone}>{row.rating}</Bad ge></td><td className="p-3">{arDateTime(row.l astActivity)}</td></tr>)}</tbody></table></di v></Card>
  </div>;
}

function Field({ label , children }: { label: string; children: Reac t.ReactNode }) { return <label className="blo ck"><span className="mb-2 block text-sm font- bold text-official">{label}</span>{children}< /label>; }
function Select({ label, name, val ue, options }: { label: string; name: string;  value?: string; options: [string, string][]  }) { return <Field label={label}><select name ={name} defaultValue={value ?? ""} className= {inputClass}>{options.map(([v, l]) => <option  key={v} value={v}>{l}</option>)}</select></F ield>; }
function Kpi({ label, value, tone =  "security" }: { label: string; value: string  | number; tone?: "security" | "success" | "wa rning" | "danger" }) { const colors = { secur ity: "text-security border-security/15 bg-sec urity/7", success: "text-success border-succe ss/20 bg-success/10", warning: "text-warning  border-warning/20 bg-warning/10", danger: "te xt-danger border-danger/20 bg-danger/10" }; r eturn <Card className="p-4"><div className="t ext-sm font-bold text-muted">{label}</div><di v className={`mt-3 inline-flex rounded-lg bor der px-3 py-2 text-base font-black ${colors[t one]}`}>{value}</div></Card>; }
function Char tCard({ title, icon: Icon, children }: { titl e: string; icon: typeof BarChart3; children:  React.ReactNode }) { return <Card><div classN ame="mb-4 flex items-center gap-3"><span clas sName="grid h-9 w-9 place-items-center rounde d-lg bg-security/10 text-security"><Icon clas sName="h-5 w-5" /></span><h2 className="text- base font-black text-official">{title}</h2></ div>{children}</Card>; }
function cleanParams (filters: PerformanceFilters) { return Object .fromEntries(Object.entries(filters).filter(( [, v]) => v)); } 