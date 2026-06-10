"use client";

export function PrintButton() {
  return (
    <button
      className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-security/20 bg-white px-5 py-2.5 text-sm font-bold text-security print:hidden"
      onClick={() => window.print()}
    >
      طباعة التقرير
    </button>
  );
}
