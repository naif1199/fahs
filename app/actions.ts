"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { clearAdminCookie, setAdminCookie, setLinkCookie, verifyAdminPassword } from "@/lib/auth";

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function makeToken() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

export async function adminLogin(_: unknown, formData: FormData) {
  const password = str(formData, "password");
  if (await verifyAdminPassword(password)) {
    await setAdminCookie();
    await audit({ operationType: "دخول المدير", actorName: "مدير النظام", description: "تم تسجيل دخول المدير بنجاح" });
    redirect("/admin");
  }
  await audit({ operationType: "فشل دخول المدير", actorName: "مدير النظام", description: "محاولة دخول بكلمة مرور غير صحيحة", status: "FAILED" });
  return { error: "رمز الدخول غير صحيح" };
}

export async function logoutAdmin() {
  await clearAdminCookie();
  redirect("/");
}

export async function saveInspector(formData: FormData) {
  const id = str(formData, "id");
  const data = {
    name: str(formData, "name"),
    employeeNumber: str(formData, "employeeNumber"),
    department: str(formData, "department"),
    mobile: str(formData, "mobile") || null,
    email: str(formData, "email") || null,
    status: str(formData, "status") === "INACTIVE" ? "INACTIVE" : "ACTIVE"
  } satisfies Prisma.InspectorUncheckedCreateInput;
  if (id) {
    await prisma.inspector.update({ where: { id }, data });
    await audit({ operationType: "تعديل فاحص", actorName: "مدير النظام", employeeNumber: data.employeeNumber, description: `تم تعديل بيانات الفاحص ${data.name}` });
  } else {
    await prisma.inspector.create({ data });
    await audit({ operationType: "إنشاء فاحص", actorName: "مدير النظام", employeeNumber: data.employeeNumber, description: `تم إنشاء الفاحص ${data.name}` });
  }
  revalidatePath("/admin/inspectors");
}

export async function deleteInspector(formData: FormData) {
  const id = str(formData, "id");
  const inspector = await prisma.inspector.delete({ where: { id } });
  await audit({ operationType: "حذف فاحص", actorName: "مدير النظام", employeeNumber: inspector.employeeNumber, description: `تم حذف الفاحص ${inspector.name}` });
  revalidatePath("/admin/inspectors");
}

export async function saveWeek(formData: FormData) {
  const inspectorIds = formData.getAll("inspectorIds").map(String);
  const targetTasks = Number(str(formData, "targetTasks") || "10");
  if (!inspectorIds.length) {
    await audit({ operationType: "إنشاء دفعة فحص", actorName: "مدير النظام", description: "فشل إصدار روابط فحص لعدم اختيار أي فاحص", status: "FAILED" });
    redirect("/admin/weeks?error=no-inspectors");
  }
  const week = await prisma.inspectionWeek.create({
    data: { name: str(formData, "name"), startsAt: new Date(str(formData, "startsAt")), endsAt: new Date(str(formData, "endsAt")) }
  });

  for (const inspectorId of inspectorIds) {
    const link = await prisma.weeklyLink.create({ data: { token: makeToken(), verificationCode: String(Math.floor(1000 + Math.random() * 9000)), targetTasks, inspectorId, weekId: week.id } });
    await prisma.inspectionTask.createMany({ data: Array.from({ length: targetTasks }, (_, index) => ({ number: index + 1, linkId: link.id, dueAt: week.endsAt })) });
    await audit({ operationType: "إصدار رابط نموذج فحص", actorName: "مدير النظام", linkId: link.id, weekId: week.id, description: "تم إصدار رابط نموذج فحص للفاحص" });
  }
  await audit({ operationType: "إنشاء دفعة فحص", actorName: "مدير النظام", weekId: week.id, description: `تم إنشاء دفعة الفحص ${week.name}` });
  revalidatePath("/admin/weeks");
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
export async function toggleLink(formData: FormData) {
  const id = str(formData, "id");
  const current = await prisma.weeklyLink.findUniqueOrThrow({ where: { id } });
  await prisma.weeklyLink.update({ where: { id }, data: { status: current.status === "ACTIVE" ? "DISABLED" : "ACTIVE" } });
  await audit({ operationType: current.status === "ACTIVE" ? "تعطيل رابط" : "إعادة تفعيل رابط", actorName: "مدير النظام", linkId: id, description: "تم تحديث حالة رابط نموذج الفاحص" });
  revalidatePath("/admin/weeks");
}

export async function regenerateCode(formData: FormData) {
  const id = str(formData, "id");
  await prisma.weeklyLink.update({ where: { id }, data: { verificationCode: String(Math.floor(1000 + Math.random() * 9000)) } });
  await audit({ operationType: "إعادة توليد رمز التحقق", actorName: "مدير النظام", linkId: id, description: "تم توليد رمز تحقق جديد" });
  revalidatePath("/admin/weeks");
}

export async function verifyWeeklyLink(_: unknown, formData: FormData) {
  const token = str(formData, "token");
  const name = str(formData, "name");
  const employeeNumber = str(formData, "employeeNumber");
  const verificationCode = str(formData, "verificationCode");
  const link = await prisma.weeklyLink.findUnique({ where: { token }, include: { inspector: true, week: true } });
  await audit({ operationType: "فتح رابط", actorName: name, employeeNumber, linkId: link?.id, weekId: link?.weekId, description: `تم فتح رابط أسبوعي ${token}` });

  if (!link || link.status !== "ACTIVE" || link.inspector.name !== name || link.inspector.employeeNumber !== employeeNumber || link.verificationCode !== verificationCode) {
    await audit({ operationType: "فشل محاولة تحقق", actorName: name, employeeNumber, linkId: link?.id, weekId: link?.weekId, description: "فشل التحقق من بيانات الرابط الأسبوعي", status: "FAILED" });
    return { error: "تعذر التحقق من البيانات. تأكد من الاسم والرقم الوظيفي ورمز التحقق." };
  }

  await setLinkCookie(token);
  await audit({ operationType: "نجاح تحقق", actorName: link.inspector.name, employeeNumber: link.inspector.employeeNumber, linkId: link.id, weekId: link.weekId, description: "تم تحقق الفاحص بنجاح" });
  redirect(`/w/${token}/tasks`);
}

export async function acceptDeclaration(formData: FormData) {
  const token = str(formData, "token");
  const link = await prisma.weeklyLink.findUniqueOrThrow({ where: { token }, include: { inspector: true } });
  await prisma.weeklyLink.update({ where: { id: link.id }, data: { acknowledgedAt: new Date() } });
  await audit({ operationType: "قبول إقرار الفاحص", actorName: link.inspector.name, employeeNumber: link.inspector.employeeNumber, linkId: link.id, description: "وافق الفاحص على الإقرار الأسبوعي" });
  revalidatePath(`/w/${token}/tasks`);
}

export async function startTask(formData: FormData) {
  const token = str(formData, "token");
  const taskId = str(formData, "taskId");
  const task = await prisma.inspectionTask.update({ where: { id: taskId }, data: { status: TaskStatus.IN_PROGRESS, startedAt: new Date() }, include: { link: { include: { inspector: true } } } });
  await audit({ operationType: "بدء مهمة", actorName: task.link.inspector.name, employeeNumber: task.link.inspector.employeeNumber, linkId: task.linkId, taskId, description: `تم بدء المهمة رقم ${task.number}` });
  redirect(`/w/${token}/tasks/${taskId}`);
}

export async function saveFacilityType(formData: FormData) {
  const id = str(formData, "id");
  const data = { name: str(formData, "name"), defaultSensitivity: str(formData, "defaultSensitivity"), description: str(formData, "description") || null, extraRequirements: str(formData, "extraRequirements") || null, isActive: str(formData, "isActive") !== "false" };
  if (id) await prisma.facilityType.update({ where: { id }, data });
  else await prisma.facilityType.create({ data });
  await audit({ operationType: "تعديل تصنيف منشأة", actorName: "مدير النظام", description: `تم حفظ تصنيف المنشأة ${data.name}` });
  revalidatePath("/admin/facility-types");
}

export async function saveChecklistItem(formData: FormData) {
  const id = str(formData, "id");
  const data = {
    itemNumber: str(formData, "itemNumber"),
    mainSection: str(formData, "mainSection"),
    subCategory: str(formData, "subCategory"),
    requirementText: str(formData, "requirementText"),
    sensitivityLevel: str(formData, "sensitivityLevel"),
    importance: str(formData, "importance") as "HIGH" | "MEDIUM" | "LOW",
    requirementStatus: str(formData, "requirementStatus") as "MANDATORY" | "CONDITIONAL",
    regulatoryReference: str(formData, "regulatoryReference") || null,
    articleNumber: str(formData, "articleNumber") || null,
    facilityTypeId: str(formData, "facilityTypeId") || null,
    isActive: str(formData, "isActive") !== "false"
  };
  if (id) {
    await prisma.checklistItem.update({ where: { id }, data });
    await audit({ operationType: "تعديل معيار", actorName: "مدير النظام", description: `تم تعديل المعيار ${data.itemNumber}` });
  } else {
    await prisma.checklistItem.create({ data });
    await audit({ operationType: "إضافة معيار", actorName: "مدير النظام", description: `تم إضافة المعيار ${data.itemNumber}` });
  }
  revalidatePath("/admin/criteria");
}

export async function saveSettings(formData: FormData) {
  for (const [key, value] of formData.entries()) {
    await prisma.systemSetting.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) } });
  }
  await audit({ operationType: "تعديل إعدادات النظام", actorName: "مدير النظام", description: "تم حفظ إعدادات النظام العامة" });
  revalidatePath("/admin/settings");
}
