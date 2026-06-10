import Image from "next/image";

export function Logo({ compact = false, hero = false, sidebar = false }: { compact?: boolean; hero?: boolean; sidebar?: boolean }) {
  if (hero) {
    return (
      <div className="flex justify-center">
        <Image
          src="/logo-mark.png"
          alt="شعار الفاحص الذكي"
          width={520}
          height={180}
          className="h-auto w-full max-w-[360px] object-contain md:max-w-[440px]"
          priority
        />
      </div>
    );
  }

  if (sidebar) {
    return (
      <div className="rounded-[28px] border border-white/12 bg-white/[0.075] p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,.12)] backdrop-blur-xl">
        <Image src="/logo-mark.png" alt="شعار الفاحص الذكي" width={260} height={110} className="h-auto w-full object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,.35)]" priority />
        <div className="mt-3 text-center text-xs font-semibold text-muted">منصة التفتيش الأمنية الذكية</div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative grid h-12 w-12 place-items-center rounded-2xl bg-white/10 shadow-soft ring-1 ring-white/10">
        <Image src="/logo-mark.png" alt="شعار الفاحص الذكي" width={38} height={38} priority />
      </div>
      {!compact ? (
        <div>
          <div className="text-2xl font-black tracking-tight text-security">الفاحص الذكي</div>
          <div className="text-xs font-semibold text-muted">أداة التفتيش الأمنية الذكية</div>
        </div>
      ) : null}
    </div>
  );
}
