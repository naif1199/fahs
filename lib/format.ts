export function pct(value: number) {
  return `${Math.round(value)}%`;
}

export function arDate(value?: Date | string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(new Date(value));
}

export function arDateTime(value?: Date | string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function taskStatusLabel(status: string) {
  return { UNUSED: "غير مستخدمة", IN_PROGRESS: "قيد العمل", COMPLETED: "مكتملة", LATE: "متأخرة", CANCELLED: "ملغاة" }[status] ?? status;
}

export function importanceLabel(status: string) {
  return { HIGH: "عالية", MEDIUM: "متوسطة", LOW: "منخفضة" }[status] ?? status;
}

export function reportStatusLabel(status: string) {
  return { DRAFT: "مسودة", IN_PROGRESS: "قيد العمل", APPROVED: "معتمد", LOCKED: "مقفل" }[status] ?? status;
}
