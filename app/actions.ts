"use server";

import { redirect } from "next /navigation";
import { revalidatePath } from  "next/cache";
import { Prisma, TaskStatus } f rom "@prisma/client";
import { prisma } from  "@/lib/prisma";
import { audit } from "@/lib/ audit";
import { clearAdminCookie, setAdminCo okie, setLinkCookie, verifyAdminPassword } fr om "@/lib/auth";

function str(formData: Form Data, key: string) {
  return String(formData .get(key) ?? "").trim();
}

function makeToke n() {
  return Math.random().toString(36).sli ce(2, 10).toUpperCase();
}

export async func tion adminLogin(_: unknown, formData: FormDat a) {
  const password = str(formData, "passwo rd");
  if (await verifyAdminPassword(passwor d)) {
    await setAdminCookie();
    await a udit({ operationType: "دخول المدير" , actorName: "مدير النظام", descrip tion: "تم تسجيل دخول المدير  بنجاح" });
    redirect("/admin");
  }
   await audit({ operationType: "فشل دخو� � المدير", actorName: "مدير الن� �ام", description: "محاولة دخول � �كلمة مرور غير صحيحة", status : "FAILED" });
  return { error: "رمز ال دخول غير صحيح" };
}

export async  function logoutAdmin() {
  await clearAdminCo okie();
  redirect("/");
}

export async func tion saveInspector(formData: FormData) {
  co nst id = str(formData, "id");
  const data =  {
    name: str(formData, "name"),
    employ eeNumber: str(formData, "employeeNumber"),
     department: str(formData, "department"),
     mobile: str(formData, "mobile") || null,
     email: str(formData, "email") || null,
     status: str(formData, "status") === "INACTIVE " ? "INACTIVE" : "ACTIVE"
  } satisfies Prism a.InspectorUncheckedCreateInput;
  if (id) {
     await prisma.inspector.update({ where: {  id }, data });
    await audit({ operationTyp e: "تعديل فاحص", actorName: "مدي� � النظام", employeeNumber: data.employe eNumber, description: `تم تعديل بيا نات الفاحص ${data.name}` });
  } els e {
    await prisma.inspector.create({ data  });
    await audit({ operationType: "إنش� �ء فاحص", actorName: "مدير النظ� �م", employeeNumber: data.employeeNumber, de scription: `تم إنشاء الفاحص ${da ta.name}` });
  }
  revalidatePath("/admin/in spectors");
}

export async function deleteIn spector(formData: FormData) {
  const id = st r(formData, "id");
  const inspector = await  prisma.inspector.delete({ where: { id } });
   await audit({ operationType: "حذف فاح� �", actorName: "مدير النظام", emplo yeeNumber: inspector.employeeNumber, descript ion: `تم حذف الفاحص ${inspector.na me}` });
  revalidatePath("/admin/inspectors" );
}

export async function saveWeek(formData : FormData) {
  const inspectorIds = formData .getAll("inspectorIds").map(String);
  const  targetTasks = Number(str(formData, "targetTas ks") || "10");
  if (!inspectorIds.length) {
     await audit({ operationType: "إنشاء  أسبوع فحص", actorName: "مدير ال نظام", description: "فشل إصدار ر وابط فحص لعدم اختيار أي ف احص", status: "FAILED" });
    redirect("/ admin/weeks?error=no-inspectors");
  }
  cons t week = await prisma.inspectionWeek.create({ 
    data: { name: str(formData, "name"), sta rtsAt: new Date(str(formData, "startsAt")), e ndsAt: new Date(str(formData, "endsAt")) }
   });

  for (const inspectorId of inspectorIds ) {
    const link = await prisma.weeklyLink. create({ data: { token: makeToken(), verifica tionCode: String(Math.floor(1000 + Math.rando m() * 9000)), targetTasks, inspectorId, weekI d: week.id } });
    await prisma.inspectionT ask.createMany({ data: Array.from({ length: t argetTasks }, (_, index) => ({ number: index  + 1, linkId: link.id, dueAt: week.endsAt }))  });
    await audit({ operationType: "إصد� �ر رابط أسبوعي", actorName: "مد� �ر النظام", linkId: link.id, weekId: w eek.id, description: "تم إصدار راب� � فحص للفاحص" });
  }
  await audit( { operationType: "إنشاء أسبوع فح� �", actorName: "مدير النظام", weekI d: week.id, description: `تم إنشاء أ� �بوع الفحص ${week.name}` });
  revali datePath("/admin/weeks");
}

export async fun ction toggleLink(formData: FormData) {
  cons t id = str(formData, "id");
  const current =  await prisma.weeklyLink.findUniqueOrThrow({  where: { id } });
  await prisma.weeklyLink.u pdate({ where: { id }, data: { status: curren t.status === "ACTIVE" ? "DISABLED" : "ACTIVE"  } });
  await audit({ operationType: current .status === "ACTIVE" ? "تعطيل رابط"  : "إعادة تفعيل رابط", actorName : "مدير النظام", linkId: id, descri ption: "تم تحديث حالة الرابط  الأسبوعي" });
  revalidatePath("/adm in/weeks");
}

export async function regenera teCode(formData: FormData) {
  const id = str (formData, "id");
  await prisma.weeklyLink.u pdate({ where: { id }, data: { verificationCo de: String(Math.floor(1000 + Math.random() *  9000)) } });
  await audit({ operationType: " إعادة توليد رمز التحقق", a ctorName: "مدير النظام", linkId: id , description: "تم توليد رمز تحق ق جديد" });
  revalidatePath("/admin/wee ks");
}

export async function verifyWeeklyLi nk(_: unknown, formData: FormData) {
  const  token = str(formData, "token");
  const name  = str(formData, "name");
  const employeeNumb er = str(formData, "employeeNumber");
  const  verificationCode = str(formData, "verificati onCode");
  const link = await prisma.weeklyL ink.findUnique({ where: { token }, include: {  inspector: true, week: true } });
  await au dit({ operationType: "فتح رابط", actor Name: name, employeeNumber, linkId: link?.id,  weekId: link?.weekId, description: `تم ف� �ح رابط أسبوعي ${token}` });

  if  (!link || link.status !== "ACTIVE" || link.i nspector.name !== name || link.inspector.empl oyeeNumber !== employeeNumber || link.verific ationCode !== verificationCode) {
    await a udit({ operationType: "فشل محاولة ت حقق", actorName: name, employeeNumber, lin kId: link?.id, weekId: link?.weekId, descript ion: "فشل التحقق من بيانات � �لرابط الأسبوعي", status: "FAILE D" });
    return { error: "تعذر التح قق من البيانات. تأكد من ا� �اسم والرقم الوظيفي ورمز  التحقق." };
  }

  await setLinkCookie( token);
  await audit({ operationType: "نج� �ح تحقق", actorName: link.inspector.name , employeeNumber: link.inspector.employeeNumb er, linkId: link.id, weekId: link.weekId, des cription: "تم تحقق الفاحص بنج� �ح" });
  redirect(`/w/${token}/tasks`);
}

 export async function acceptDeclaration(formD ata: FormData) {
  const token = str(formData , "token");
  const link = await prisma.weekl yLink.findUniqueOrThrow({ where: { token }, i nclude: { inspector: true } });
  await prism a.weeklyLink.update({ where: { id: link.id },  data: { acknowledgedAt: new Date() } });
  a wait audit({ operationType: "قبول إقر� �ر الفاحص", actorName: link.inspector. name, employeeNumber: link.inspector.employee Number, linkId: link.id, description: "واف ق الفاحص على الإقرار الأ� �بوعي" });
  revalidatePath(`/w/${token}/ tasks`);
}

export async function startTask(f ormData: FormData) {
  const token = str(form Data, "token");
  const taskId = str(formData , "taskId");
  const task = await prisma.insp ectionTask.update({ where: { id: taskId }, da ta: { status: TaskStatus.IN_PROGRESS, started At: new Date() }, include: { link: { include:  { inspector: true } } } });
  await audit({  operationType: "بدء مهمة", actorName:  task.link.inspector.name, employeeNumber: tas k.link.inspector.employeeNumber, linkId: task .linkId, taskId, description: `تم بدء ا لمهمة رقم ${task.number}` });
  redir ect(`/w/${token}/tasks/${taskId}`);
}

export  async function saveFacilityType(formData: Fo rmData) {
  const id = str(formData, "id");
   const data = { name: str(formData, "name"),  defaultSensitivity: str(formData, "defaultSen sitivity"), description: str(formData, "descr iption") || null, extraRequirements: str(form Data, "extraRequirements") || null, isActive:  str(formData, "isActive") !== "false" };
  i f (id) await prisma.facilityType.update({ whe re: { id }, data });
  else await prisma.faci lityType.create({ data });
  await audit({ op erationType: "تعديل تصنيف منشأ� �", actorName: "مدير النظام", descr iption: `تم حفظ تصنيف المنشأ� � ${data.name}` });
  revalidatePath("/admin/ facility-types");
}

export async function sa veChecklistItem(formData: FormData) {
  const  id = str(formData, "id");
  const data = {
     itemNumber: str(formData, "itemNumber"),
     mainSection: str(formData, "mainSection"), 
    subCategory: str(formData, "subCategory" ),
    requirementText: str(formData, "requir ementText"),
    sensitivityLevel: str(formDa ta, "sensitivityLevel"),
    importance: str( formData, "importance") as "HIGH" | "MEDIUM"  | "LOW",
    requirementStatus: str(formData,  "requirementStatus") as "MANDATORY" | "CONDI TIONAL",
    regulatoryReference: str(formDat a, "regulatoryReference") || null,
    articl eNumber: str(formData, "articleNumber") || nu ll,
    facilityTypeId: str(formData, "facili tyTypeId") || null,
    isActive: str(formDat a, "isActive") !== "false"
  };
  if (id) {
     await prisma.checklistItem.update({ where:  { id }, data });
    await audit({ operation Type: "تعديل معيار", actorName: "م دير النظام", description: `تم تع ديل المعيار ${data.itemNumber}` }); 
  } else {
    await prisma.checklistItem.cr eate({ data });
    await audit({ operationTy pe: "إضافة معيار", actorName: "مد ير النظام", description: `تم إضا فة المعيار ${data.itemNumber}` });
   }
  revalidatePath("/admin/criteria");
}

ex port async function saveSettings(formData: Fo rmData) {
  for (const [key, value] of formDa ta.entries()) {
    await prisma.systemSettin g.upsert({ where: { key }, update: { value: S tring(value) }, create: { key, value: String( value) } });
  }
  await audit({ operationTyp e: "تعديل إعدادات النظام",  actorName: "مدير النظام", descripti on: "تم حفظ إعدادات النظام  العامة" });
  revalidatePath("/admin/se ttings");
}
 