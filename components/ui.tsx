import Link from "next/link";
import { clsx } from "clsx";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={clsx("rounded-[28px] border border-white/12 bg-white/[0.065] p-6 shadow-[0_24px_80px_rgba(0,0,0,.24)] backdrop-blur-xl", className)}>{children}</section>;
}

export function StatCard({ label, value, tone = "security" }: { label: string; value: string | number; tone?: "security" | "official" | "success" | "danger" | "warning" }) {
  const tones = { security: "text-white bg-security/30", official: "text-official bg-white/10", success: "text-green-100 bg-success/25", danger: "text-red-100 bg-danger/25", warning: "text-amber-100 bg-warning/25" };
  return (
    <Card className="p-5">
      <div className="text-sm font-semibold text-muted">{label}</div>
      <div className={clsx("mt-4 inline-flex rounded-2xl px-4 py-2 text-3xl font-black", tones[tone])}>{value}</div>
    </Card>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode; href?: string; className?: string };

export function Button({ children, href, className, type = "submit", ...props }: ButtonProps) {
  const classes = clsx("inline-flex min-h-11 items-center justify-center rounded-2xl bg-security px-5 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-[#1F6F6A] print:hidden", className);
  return href ? <Link className={classes} href={href}>{children}</Link> : <button type={type} className={classes} {...props}>{children}</button>;
}

export function SecondaryButton({ children, href, className, type = "button", ...props }: ButtonProps) {
  const classes = clsx("inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/14 bg-white/[0.055] px-5 py-2.5 text-sm font-bold text-white backdrop-blur-xl transition hover:bg-white/10 print:hidden", className);
  return href ? <Link className={classes} href={href}>{children}</Link> : <button type={type} className={classes} {...props}>{children}</button>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-charcoal">{label}</span>{children}</label>;
}

export const inputClass = "w-full rounded-2xl border border-white/12 bg-white/[0.075] px-4 py-3 text-sm text-white shadow-sm outline-none backdrop-blur-xl transition placeholder:text-white/35 focus:border-security focus:ring-security";

export function Badge({ children, tone = "muted" }: { children: React.ReactNode; tone?: "success" | "danger" | "warning" | "security" | "muted" }) {
  const tones = { success: "bg-success/20 text-green-100", danger: "bg-danger/20 text-red-100", warning: "bg-warning/20 text-amber-100", security: "bg-security/25 text-white", muted: "bg-white/10 text-muted" };
  return <span className={clsx("inline-flex rounded-full px-3 py-1 text-xs font-bold", tones[tone])}>{children}</span>;
}
