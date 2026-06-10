import Image from "next/image";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-soft ring-1 ring-security/10">
        <Image src="/logo-mark.png" alt="شعار الفاحص الذكي" width={38} height={38} priority />
      </div>
      {!compact ? (
        <div>
          <div className="text-2xl font-black tracking-tight text-security">الفاحص الذكي</div>
          <div className="text-xs font-semibold text-charcoal/70">أداة التفتيش الأمنية الذكية</div>
        </div>
      ) : null}
    </div>
  );
}
