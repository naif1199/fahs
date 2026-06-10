import Link from "next/link";
import { clsx } from "clsx";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={clsx("rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-card", className)}>{children}</section>;
}

export function StatCard({ label, value, tone = "security" }: { label: string; value: string | number; tone?: "security" | "official" | "success" | "danger" | "warning" }) {
  const tones = { security: "text-security bg-security/8", official: "text-official bg-official/8", success: "text-success bg-success/8", danger: "text-danger bg-danger/8", warning: "text-warning bg-warning/10" };
  return (
    <Card className="p-5">
      <div className="text-sm font-semibold text-muted">{label}</div>
      <div className={clsx("mt-4 inline-flex rounded-2xl px-4 py-2 text-3xl font-black", tones[tone])}>{value}</div>
    </Card>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode; href?: string; className?: string };

export function Button({ children, href, className, type = "submit", ...props }: ButtonProps) {
  const classes = clsx("inline-flex min-h-11 items-center justify-center rounded-2xl bg-security px-5 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-official print:hidden", className);
  return href ? <Link className={classes} href={href}>{children}</Link> : <button type={type} className={classes} {...props}>{children}</button>;
}

export function SecondaryButton({ children, href, className, type = "button", ...props }: ButtonProps) {
  const classes = clsx("inline-flex min-h-11 items-center justify-center rounded-2xl border border-security/20 bg-white px-5 py-2.5 text-sm font-bold text-security transition hover:bg-security/5 print:hidden", className);
  return href ? <Link className={classes} href={href}>{children}</Link> : <button type={type} className={classes} {...props}>{children}</button>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-charcoal">{label}</span>{children}</label>;
}

export const inputClass = "w-full rounded-2xl border-slate-200 bg-white px-4 py-3 text-sm text-charcoal shadow-sm outline-none transition focus:border-security focus:ring-security";

export function Badge({ children, tone = "muted" }: { children: React.ReactNode; tone?: "success" | "danger" | "warning" | "security" | "muted" }) {
  const tones = { success: "bg-success/10 text-success", danger: "bg-danger/10 text-danger", warning: "bg-warning/10 text-warning", security: "bg-security/10 text-security", muted: "bg-slate-100 text-muted" };
  return <span className={clsx("inline-flex rounded-full px-3 py-1 text-xs font-bold", tones[tone])}>{children}</span>;
}
