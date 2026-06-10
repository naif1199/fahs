import { EvaluationStatus, Importance, PrismaClient, ReportStatus, TaskStatus } from "@prisma/client";

const prisma = new PrismaClient();

const inspectors = [
  { name: "محمد سعيد", employeeNumber: "91001", department: "الرقابة الميدانية", city: "الرياض", facilityType: "القطاع الحكومي (الوزارات والهيئات)", facility: "مركز خدمات الرياض" },
  { name: "علي حسن", employeeNumber: "91002", department: "عمليات التفتيش", city: "جدة", facilityType: "المجمعات التجارية ومراكز التسوق", facility: "مجمع الساحل التجاري" },
  { name: "سعد مضحي", employeeNumber: "91003", department: "المتابعة الأمنية", city: "الدمام", facilityType: "المنشآت النفطية والبتروكيميائية", facility: "منشأة الخليج للطاقة" }
];

function token(index: number) {
  return `DEMO${index}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

async function main() {
  const startsAt = new Date("2026-06-21T00:00:00.000Z");
  const endsAt = new Date("2026-06-25T23:59:59.000Z");
  const week = await prisma.inspectionWeek.create({
    data: { name: "أسبوع تقارير تجريبية", startsAt, endsAt, status: "ACTIVE" }
  });

  for (const [index, demo] of inspectors.entries()) {
    const inspector = await prisma.inspector.upsert({
      where: { employeeNumber: demo.employeeNumber },
      update: { name: demo.name, department: demo.department, status: "ACTIVE" },
      create: { name: demo.name, employeeNumber: demo.employeeNumber, department: demo.department, mobile: `05000000${index + 1}`, email: `demo${index + 1}@fahs.local` }
    });

    const facilityType = await prisma.facilityType.findUnique({ where: { name: demo.facilityType } });
    if (!facilityType) throw new Error(`Facility type not found: ${demo.facilityType}`);

    const link = await prisma.weeklyLink.create({
      data: { token: token(index + 1), verificationCode: `${2468 + index}`, targetTasks: 1, inspectorId: inspector.id, weekId: week.id, acknowledgedAt: new Date() }
    });

    const task = await prisma.inspectionTask.create({
      data: { number: 1, status: TaskStatus.COMPLETED, startedAt: new Date("2026-06-22T06:00:00.000Z"), completedAt: new Date("2026-06-22T08:00:00.000Z"), dueAt: endsAt, linkId: link.id }
    });

    const facility = await prisma.facility.create({
      data: {
        name: demo.facility,
        location: `${demo.city} - موقع تجريبي`,
        city: demo.city,
        district: index === 0 ? "الملز" : index === 1 ? "الشاطئ" : "الصناعية",
        classification: demo.facilityType,
        securitySensitivity: index === 2 ? "عالية" : "متوسطة",
        representativeName: "ممثل المنشأة",
        contactNumber: `01100000${index + 1}`,
        visitDate: new Date("2026-06-22T00:00:00.000Z"),
        startedAt: "09:00",
        endedAt: "11:00",
        generalNotes: "تقرير تجريبي معتمد لاختبار شكل التقرير والمؤشرات.",
        facilityTypeId: facilityType.id
      }
    });

    const reportNumber = `DEMO-${new Date().getFullYear()}-${String(index + 1).padStart(3, "0")}`;
    const report = await prisma.report.create({
      data: { reportNumber, taskId: task.id, facilityId: facility.id, status: ReportStatus.APPROVED, approvedAt: new Date(), complianceRate: 0 }
    });

    const items = await prisma.checklistItem.findMany({
      where: { isActive: true, OR: [{ facilityTypeId: facilityType.id }, { facilityTypeId: null }] },
      orderBy: [{ sourceSheet: "asc" }, { originalRowNumber: "asc" }],
      take: 18
    });

    let compliantCount = 0;
    let nonCompliantCount = 0;
    for (const [itemIndex, item] of items.entries()) {
      const isNonCompliant = itemIndex % (index + 4) === 0;
      const response = await prisma.inspectionResponse.create({
        data: {
          reportId: report.id,
          checklistItemId: item.id,
          evaluationStatus: isNonCompliant ? EvaluationStatus.NON_COMPLIANT : EvaluationStatus.COMPLIANT,
          inspectorNote: isNonCompliant ? "تم رصد عدم اكتمال تطبيق المتطلب أثناء الفحص الميداني." : null,
          correctiveAction: isNonCompliant ? "استكمال المتطلب وتزويد الإدارة بما يثبت المعالجة خلال مدة لا تتجاوز 15 يومًا." : null
        }
      });

      if (isNonCompliant) {
        nonCompliantCount += 1;
        await prisma.observation.create({
          data: {
            reportId: report.id,
            responseId: response.id,
            note: "تم رصد عدم اكتمال تطبيق المتطلب أثناء الفحص الميداني.",
            correctiveAction: "استكمال المتطلب وتزويد الإدارة بما يثبت المعالجة خلال مدة لا تتجاوز 15 يومًا.",
            status: "OPEN"
          }
        });
      } else {
        compliantCount += 1;
      }
    }

    const total = compliantCount + nonCompliantCount;
    await prisma.report.update({
      where: { id: report.id },
      data: { compliantCount, nonCompliantCount, notesCount: nonCompliantCount, complianceRate: total ? (compliantCount / total) * 100 : 0 }
    });
  }

  await prisma.auditLog.create({
    data: { operationType: "إنشاء بيانات تجريبية", actorName: "مدير النظام", description: "تم إنشاء 3 فاحصين تجريبيين مع تقارير معتمدة لاختبار النظام" }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
