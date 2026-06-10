import Link from "next/link";
import { clsx } from "clsx";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={clsx("app-card rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_14px_36px_rgba(18,48,71,.07)]", className)}>{children}</section>;
}

export function StatCard({ label, value, tone = "security" }: { label: string; value: string | number; tone?: "security" | "official" | "success" | "danger" | "warning" }) {
  const tones = {
    security: "border-security/15 bg-security/7 text-security",
    official: "border-slate-200 bg-slate-50 text-official",
    success: "border-success/20 bg-success/10 text-success",
    danger: "border-danger/20 bg-danger/10 text-danger",
    warning: "border-warning/20 bg-warning/10 text-warning",
  };
  return (
    <Card className="stat-card p-4">
      <div className="text-sm font-semibold text-muted">{label}</div>
      <div className={clsx("mt-3 inline-flex min-w-16 justify-center rounded-lg border px-3 py-2 text-base font-black", tones[tone])}>{value}</div>
    </Card>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode; href?: string; className?: string };

export function Button({ children, href, className, type = "submit", ...props }: ButtonProps) {
  const classes = clsx("ui-button inline-flex min-h-11 items-center justify-center rounded-lg bg-security px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(15,95,92,.16)] transition-[background-color,box-shadow,transform] duration-150 ease-out hover:bg-[#0b4f4c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-security/35 active:scale-[.98] disabled:pointer-events-none disabled:opacity-50 print:hidden", className);
  return href ? <Link className={classes} href={href}>{children}</Link> : <button type={type} className={classes} {...props}>{children}</button>;
}

export function SecondaryButton({ children, href, className, type = "button", ...props }: ButtonProps) {
  const classes = clsx("ui-button inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-official shadow-sm transition-[background-color,border-color,transform] duration-150 ease-out hover:border-security/25 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-security/25 active:scale-[.98] disabled:pointer-events-none disabled:opacity-50 print:hidden", className);
  return href ? <Link className={classes} href={href}>{children}</Link> : <button type={type} className={classes} {...props}>{children}</button>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-official">{label}</span>{children}</label>;
}

export const inputClass = "app-input w-full min-h-11 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-official shadow-sm outline-none transition placeholder:text-slate-400 focus:border-security focus:ring-2 focus:ring-security/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-muted";

export function Badge({ children, tone = "muted" }: { children: React.ReactNode; tone?: "success" | "danger" | "warning" | "security" | "muted" }) {
  const tones = {
    success: "border-success/20 bg-success/10 text-success",
    danger: "border-danger/20 bg-danger/10 text-danger",
    warning: "border-warning/20 bg-warning/10 text-warning",
    security: "border-security/20 bg-security/10 text-security",
    muted: "border-slate-200 bg-slate-100 text-muted",
  };
  return <span className={clsx("inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold", tones[tone])}>{children}</span>;
}