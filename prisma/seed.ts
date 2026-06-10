import { PrismaClient, Importance, RequirementStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const facilityTypes = [
  "قطاع حكومي",
  "منشأة نفطية أو بتروكيميائية",
  "منشأة طاقة أو تحلية",
  "مرفق إيواء سياحي",
  "مجمع تجاري",
  "بنك أو مؤسسة مالية",
  "مبنى أو مجمع سكني",
  "مسجد أو جامع",
  "ناد أو ملعب رياضي",
  "منشأة ترفيهية",
  "منشأة صحية أو مستشفى",
  "مستودع تجاري",
  "محطة وقود أو غاز",
  "منشأة تعليمية",
  "منشأة غذائية",
  "وسائل نقل عام",
  "فعالية أو مهرجان",
  "نشاط اقتصادي أو تجاري",
  "متحف أو موقع تاريخي"
];

const sections = [
  { section: "المواصفات الفنية والمبادئ", sub: "الكاميرات والتغطية", text: "تغطية جميع المداخل والمخارج بكاميرات واضحة تعمل على مدار الساعة.", importance: Importance.HIGH },
  { section: "المواصفات الفنية والمبادئ", sub: "جودة التسجيل", text: "توفير جودة تصوير مناسبة للتعرف على الأشخاص ولوحات المركبات عند الحاجة.", importance: Importance.HIGH },
  { section: "المواصفات الفنية والمبادئ", sub: "الحفظ والتخزين", text: "توفر سعة تخزين كافية للتسجيلات وفق مدة الاحتفاظ المعتمدة.", importance: Importance.MEDIUM },
  { section: "الضوابط التشغيلية", sub: "تشغيل مركز المراقبة", text: "وجود مشغلين مؤهلين لمتابعة مركز المراقبة خلال ساعات التشغيل المعتمدة.", importance: Importance.HIGH },
  { section: "الضوابط التشغيلية", sub: "سجلات البلاغات", text: "توثيق البلاغات والحوادث والإجراءات المتخذة في سجل مستقل.", importance: Importance.MEDIUM },
  { section: "الضوابط التشغيلية", sub: "إدارة الصلاحيات", text: "حصر صلاحيات الدخول إلى التسجيلات والأنظمة على المخولين فقط.", importance: Importance.HIGH },
  { section: "الضوابط التشغيلية", sub: "التعامل مع الأعطال", text: "وجود إجراء واضح للتعامل مع أعطال الأنظمة والكاميرات ومتابعة إصلاحها.", importance: Importance.MEDIUM },
  { section: "الملاحق والتصنيفات", sub: "المستندات والتراخيص", text: "توفر التصاريح والتراخيص والمستندات الداعمة عند الفحص.", importance: Importance.LOW },
  { section: "الملاحق والتصنيفات", sub: "الخرائط", text: "توفر مخطط يوضح مواقع الكاميرات ونطاق التغطية داخل المنشأة.", importance: Importance.MEDIUM },
  { section: "الملاحق والتصنيفات", sub: "سرية التسجيلات", text: "حفظ التسجيلات في بيئة آمنة تمنع النسخ أو الاطلاع غير المصرح.", importance: Importance.HIGH }
];

function token() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

async function main() {
  await prisma.systemSetting.upsert({
    where: { key: "adminPasswordHash" },
    update: {},
    create: { key: "adminPasswordHash", value: await bcrypt.hash(process.env.ADMIN_PASSWORD ?? "123456", 10) }
  });

  const settings = [
    ["systemName", "الفاحص الذكي"],
    ["officialTitle", "مواصفات وتعليمات مراكز التحكم والمراقبة الأمنية في المنشآت"],
    ["entityName", "إدارة التفتيش الأمني"],
    ["weeklyLinkValidityDays", "7"],
    ["defaultTasksPerInspector", "10"],
    ["enablePrint", "true"],
    ["enablePdf", "true"],
    ["inspectorDeclaration", "أقر بأنني الفاحص المكلف بهذه المهام، وأن جميع البيانات المدخلة تمت بناءً على فحص ميداني للمنشأة، وأتحمل مسؤولية دقة المعلومات والملاحظات المسجلة."]
  ];

  for (const [key, value] of settings) {
    await prisma.systemSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  for (const name of ["عالية", "متوسطة", "منخفضة"]) {
    await prisma.securityClassification.upsert({ where: { name }, update: {}, create: { name } });
  }

  for (const name of facilityTypes) {
    await prisma.facilityType.upsert({
      where: { name },
      update: {},
      create: { name, defaultSensitivity: name.includes("نفطية") || name.includes("طاقة") || name.includes("بنك") ? "عالية" : "متوسطة" }
    });
  }

  const allTypes = await prisma.facilityType.findMany();
  if ((await prisma.checklistItem.count()) === 0) {
    let itemIndex = 1;
    for (const type of allTypes) {
      for (const section of sections) {
        await prisma.checklistItem.create({
          data: {
            itemNumber: `${itemIndex}`.padStart(3, "0"),
            mainSection: section.section,
            subCategory: section.sub,
            requirementText: section.text,
            sensitivityLevel: type.defaultSensitivity,
            importance: section.importance,
            requirementStatus: RequirementStatus.MANDATORY,
            regulatoryReference: "مواصفات وتعليمات مراكز التحكم والمراقبة الأمنية",
            articleNumber: `م-${itemIndex}`,
            facilityTypeId: type.id
          }
        });
        itemIndex += 1;
      }
    }
  }

  const inspector = await prisma.inspector.upsert({
    where: { employeeNumber: "12345" },
    update: {},
    create: { name: "أحمد محمد", employeeNumber: "12345", department: "إدارة الرقابة الميدانية", mobile: "0500000000", email: "ahmad@example.com" }
  });

  const startsAt = new Date("2026-06-16T00:00:00.000Z");
  const endsAt = new Date("2026-06-20T23:59:59.000Z");
  if ((await prisma.weeklyLink.count({ where: { inspectorId: inspector.id } })) === 0) {
    const week = await prisma.inspectionWeek.create({ data: { name: "أسبوع 16 إلى 20 يونيو", startsAt, endsAt } });
    const weeklyLink = await prisma.weeklyLink.create({
      data: { token: token(), verificationCode: "2468", targetTasks: 10, inspectorId: inspector.id, weekId: week.id }
    });
    await prisma.inspectionTask.createMany({ data: Array.from({ length: 10 }, (_, index) => ({ number: index + 1, linkId: weeklyLink.id, dueAt: endsAt })) });
  }

  await prisma.auditLog.create({
    data: { operationType: "تهيئة النظام", actorName: "النظام", description: "تم إنشاء البيانات التجريبية الأولية", status: "SUCCESS" }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
