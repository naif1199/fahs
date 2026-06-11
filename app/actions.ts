"use server";

import { redirect } from "next  /navigation";
import { revalidatePath } from   "next/cache";
import { Prisma, TaskStatus }  f rom "@prisma/client";
import { prisma } fr om  "@/lib/prisma";
import { audit } from "@/ lib/ audit";
import { clearAdminCookie, setAd minCo okie, setLinkCookie, verifyAdminPasswor d } fr om "@/lib/auth";

function str(formDat a: Form Data, key: string) {
  return String( formData .get(key) ?? "").trim();
}

function  makeToke n() {
  return Math.random().toStri ng(36).sli ce(2, 10).toUpperCase();
}

export  async func tion adminLogin(_: unknown, formD ata: FormDat a) {
  const password = str(form Data, "passwo rd");
  if (await verifyAdminPa ssword(passwor d)) {
    await setAdminCookie ();
    await a udit({ operationType: "دخو ل المدير" , actorName: "مدير ال� �ظام", descrip tion: "تم تسجيل دخ ول المدير  بنجاح" });
    redire ct("/admin");
  }
   await audit({ operationT ype: "فشل دخو� � المدير", act orName: "مدير الن� �ام", descrip tion: "محاولة دخول � �كلمة  مرور غير صحيحة", status : "FAILED " });
  return { error: "رمز ال دخول  غير صحيح" };
}

export async  functio n logoutAdmin() {
  await clearAdminCo okie() ;
  redirect("/");
}

export async func tion  saveInspector(formData: FormData) {
  co nst  id = str(formData, "id");
  const data =  {
     name: str(formData, "name"),
    employ ee Number: str(formData, "employeeNumber"),
      department: str(formData, "department"),
      mobile: str(formData, "mobile") || null,
      email: str(formData, "email") || null,
      status: str(formData, "status") === "INACTI VE " ? "INACTIVE" : "ACTIVE"
  } satisfies Pr ism a.InspectorUncheckedCreateInput;
  if (id ) {
     await prisma.inspector.update({ wher e: {  id }, data });
    await audit({ operat ionTyp e: "تعديل فاحص", actorName: " مدي� � النظام", employeeNumber:  data.employe eNumber, description: `تم تع ديل بيا نات الفاحص ${data.name }` });
  } els e {
    await prisma.inspector .create({ data  });
    await audit({ operati onType: "إنش� �ء فاحص", actorName : "مدير النظ� �م", employeeNumbe r: data.employeeNumber, de scription: `تم � �نشاء الفاحص ${da ta.name}` });
  } 
  revalidatePath("/admin/in spectors");
}

e xport async function deleteIn spector(formDat a: FormData) {
  const id = st r(formData, "i d");
  const inspector = await  prisma.inspec tor.delete({ where: { id } });
   await audit ({ operationType: "حذف فاح� �", act orName: "مدير النظام", emplo yeeNum ber: inspector.employeeNumber, descript ion:  `تم حذف الفاحص ${inspector.na me}`  });
  revalidatePath("/admin/inspectors" );
 }

export async function saveWeek(formData :  FormData) {
  const inspectorIds = formData . getAll("inspectorIds").map(String);
  const   targetTasks = Number(str(formData, "targetTas  ks") || "10");
  if (!inspectorIds.length) { 
     await audit({ operationType: "إنشا� �  أسبوع فحص", actorName: "مدير � �ل نظام", description: "فشل إصدا� � ر وابط فحص لعدم اختيار أ ي ف احص", status: "FAILED" });
    redir ect("/ admin/weeks?error=no-inspectors");
  } 
  cons t week = await prisma.inspectionWeek. create({ 
    data: { name: str(formData, "na me"), sta rtsAt: new Date(str(formData, "star tsAt")), e ndsAt: new Date(str(formData, "end sAt")) }
   });

  for (const inspectorId of  inspectorIds ) {
    const link = await prism a.weeklyLink. create({ data: { token: makeTok en(), verifica tionCode: String(Math.floor(10 00 + Math.rando m() * 9000)), targetTasks, in spectorId, weekI d: week.id } });
    await p risma.inspectionT ask.createMany({ data: Arra y.from({ length: t argetTasks }, (_, index) = > ({ number: index  + 1, linkId: link.id, due At: week.endsAt }))  });
    await audit({ op erationType: "إصد� �ر رابط أسب وعي", actorName: "مد� �ر النظا م", linkId: link.id, weekId: w eek.id, descr iption: "تم إصدار راب� � فحص  للفاحص" });
  }
  await audit( { opera tionType: "إنشاء أسبوع فح� �" , actorName: "مدير النظام", weekI d : week.id, description: `تم إنشاء أ� � �بوع الفحص ${week.name}` });
  re vali datePath("/admin/weeks");
}

export asyn c fun ction toggleLink(formData: FormData) {
   cons t id = str(formData, "id");
  const cu rrent =  await prisma.weeklyLink.findUniqueOr Throw({  where: { id } });
  await prisma.wee klyLink.u pdate({ where: { id }, data: { stat us: curren t.status === "ACTIVE" ? "DISABLED"  : "ACTIVE"  } });
  await audit({ operationT ype: current .status === "ACTIVE" ? "تعطي ل رابط"  : "إعادة تفعيل راب ط", actorName : "مدير النظام", lin kId: id, descri ption: "تم تحديث حا� �ة الرابط  الأسبوعي" });
  rev alidatePath("/adm in/weeks");
}

export async  function regenera teCode(formData: FormData)  {
  const id = str (formData, "id");
  await  prisma.weeklyLink.u pdate({ where: { id }, d ata: { verificationCo de: String(Math.floor(1 000 + Math.random() *  9000)) } });
  await a udit({ operationType: " إعادة توليد  رمز التحقق", a ctorName: "مدير  النظام", linkId: id , description: "ت� � توليد رمز تحق ق جديد" });
   revalidatePath("/admin/wee ks");
}

export a sync function verifyWeeklyLi nk(_: unknown, f ormData: FormData) {
  const  token = str(for mData, "token");
  const name  = str(formData , "name");
  const employeeNumb er = str(form Data, "employeeNumber");
  const  verificatio nCode = str(formData, "verificati onCode");
   const link = await prisma.weeklyL ink.findUn ique({ where: { token }, include: {  inspecto r: true, week: true } });
  await au dit({ op erationType: "فتح رابط", actor Name: n ame, employeeNumber, linkId: link?.id,  weekI d: link?.weekId, description: `تم ف� � ح رابط أسبوعي ${token}` });

  if   (!link || link.status !== "ACTIVE" || link.i  nspector.name !== name || link.inspector.emp l oyeeNumber !== employeeNumber || link.verif ic ationCode !== verificationCode) {
    awai t a udit({ operationType: "فشل محاول� � ت حقق", actorName: name, employeeNumber , lin kId: link?.id, weekId: link?.weekId, de script ion: "فشل التحقق من بيا� �ات � �لرابط الأسبوعي", st atus: "FAILE D" });
    return { error: "تع ذر التح قق من البيانات. ت� �كد من ا� �اسم والرقم ال� �ظيفي ورمز  التحقق." };
  }

   await setLinkCookie( token);
  await audit({  operationType: "نج� �ح تحقق", acto rName: link.inspector.name , employeeNumber:  link.inspector.employeeNumb er, linkId: link. id, weekId: link.weekId, des cription: "تم  تحقق الفاحص بنج� �ح" });
   redirect(`/w/${token}/tasks`);
}

 export asy nc function acceptDeclaration(formD ata: Form Data) {
  const token = str(formData , "token ");
  const link = await prisma.weekl yLink.f indUniqueOrThrow({ where: { token }, i nclude : { inspector: true } });
  await prism a.wee klyLink.update({ where: { id: link.id },  dat a: { acknowledgedAt: new Date() } });
  a wai t audit({ operationType: "قبول إقر�  �ر الفاحص", actorName: link.inspecto r. name, employeeNumber: link.inspector.emplo yee Number, linkId: link.id, description: "و اف ق الفاحص على الإقرار ا لأ� �بوعي" });
  revalidatePath(`/w /${token}/ tasks`);
}

export async function  startTask(f ormData: FormData) {
  const toke n = str(form Data, "token");
  const taskId =  str(formData , "taskId");
  const task = awa it prisma.insp ectionTask.update({ where: { i d: taskId }, da ta: { status: TaskStatus.IN_P ROGRESS, started At: new Date() }, include: {  link: { include:  { inspector: true } } } }) ;
  await audit({  operationType: "بدء م� �مة", actorName:  task.link.inspector.name,  employeeNumber: tas k.link.inspector.employe eNumber, linkId: task .linkId, taskId, descri ption: `تم بدء ا لمهمة رقم ${ta sk.number}` });
  redir ect(`/w/${token}/task s/${taskId}`);
}

export  async function save FacilityType(formData: Fo rmData) {
  const i d = str(formData, "id");
   const data = { na me: str(formData, "name"),  defaultSensitivit y: str(formData, "defaultSen sitivity"), desc ription: str(formData, "descr iption") || nul l, extraRequirements: str(form Data, "extraRe quirements") || null, isActive:  str(formData , "isActive") !== "false" };
  i f (id) await  prisma.facilityType.update({ whe re: { id },  data });
  else await prisma.faci lityType.c reate({ data });
  await audit({ op erationTy pe: "تعديل تصنيف منشأ� �",  actorName: "مدير النظام", descr ipt ion: `تم حفظ تصنيف المنشأ�  � ${data.name}` });
  revalidatePath("/admi n/ facility-types");
}

export async function  sa veChecklistItem(formData: FormData) {
  c onst  id = str(formData, "id");
  const data  = {
     itemNumber: str(formData, "itemNumbe r"),
     mainSection: str(formData, "mainSec tion"), 
    subCategory: str(formData, "subC ategory" ),
    requirementText: str(formData , "requir ementText"),
    sensitivityLevel:  str(formDa ta, "sensitivityLevel"),
    impor tance: str( formData, "importance") as "HIGH"  | "MEDIUM"  | "LOW",
    requirementStatus:  str(formData,  "requirementStatus") as "MANDA TORY" | "CONDI TIONAL",
    regulatoryReferen ce: str(formDat a, "regulatoryReference") ||  null,
    articl eNumber: str(formData, "arti cleNumber") || nu ll,
    facilityTypeId: str (formData, "facili tyTypeId") || null,
    is Active: str(formDat a, "isActive") !== "false "
  };
  if (id) {
     await prisma.checklis tItem.update({ where:  { id }, data });
    a wait audit({ operation Type: "تعديل مع يار", actorName: "م دير النظام",  description: `تم تع ديل المعيا� � ${data.itemNumber}` }); 
  } else {
    awa it prisma.checklistItem.cr eate({ data });
     await audit({ operationTy pe: "إضافة � �عيار", actorName: "مد ير النظا� �", description: `تم إضا فة المعي ار ${data.itemNumber}` });
   }
  revalidat ePath("/admin/criteria");
}

ex port async fu nction saveSettings(formData: Fo rmData) {
   for (const [key, value] of formDa ta.entries( )) {
    await prisma.systemSettin g.upsert({  where: { key }, update: { value: S tring(val ue) }, create: { key, value: String( value) }  });
  }
  await audit({ operationTyp e: "ت� �ديل إعدادات النظام",  actorN ame: "مدير النظام", descripti on: " تم حفظ إعدادات النظام  ال عامة" });
  revalidatePath("/admin/se tti ngs");
}
   
export async function deleteEmptyWeek(formData: FormData) {
  const id = str(formData, "id");
  const week = await prisma.inspectionWeek.findUnique({ where: { id }, include: { links: true } });
  if (!week || week.links.length) {
    await audit({ operationType: "حذف دفعة فحص", actorName: "مدير النظام", weekId: id, description: "تم رفض حذف دفعة فحص لأنها غير فارغة", status: "FAILED" });
    revalidatePath("/admin/weeks");
    return;
  }
  await prisma.inspectionWeek.delete({ where: { id } });
  await audit({ operationType: "حذف دفعة فحص", actorName: "مدير النظام", weekId: id, description: `تم حذف دفعة الفحص غير المكتملة ${week.name}` });
  revalidatePath("/admin/weeks");
  revalidatePath("/admin");
  revalidatePath("/admin/performance");
}