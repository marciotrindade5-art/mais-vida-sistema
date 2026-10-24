import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] px-5 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde disabled:opacity-60";
const buttonVariants = {
  primary: "bg-verde text-creme hover:bg-verde-escuro",
  secondary: "border border-verde bg-white text-verde hover:bg-creme",
  ghost: "text-verde hover:bg-linha",
};

type Variant = keyof typeof buttonVariants;

export function Button({ variant = "primary", className, ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={cx(buttonBase, buttonVariants[variant], className)} {...props} />;
}

export function LinkButton({ variant = "primary", className, ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cx(buttonBase, buttonVariants[variant], className)} {...props} />;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        {subtitle && <span className="text-sm text-suave">{subtitle}</span>}
        <h1 className="font-titulo text-4xl text-verde">{title}</h1>
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </header>
  );
}

export function Card({ className, ...props }: ComponentProps<"section">) {
  return <section className={cx("rounded-2xl bg-white p-6", className)} {...props} />;
}

const inputClass =
  "h-11 w-full rounded-[10px] border border-[#c9cbbe] bg-white px-3.5 text-tinta placeholder:text-suave focus:border-verde focus:outline-2 focus:outline-verde/30";

export function Field({
  label,
  name,
  error,
  hint,
  className,
  ...props
}: ComponentProps<"input"> & { label: string; name: string; error?: string; hint?: string }) {
  return (
    <label className={cx("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-medium">{label}</span>
      <input name={name} className={inputClass} aria-invalid={!!error || undefined} {...props} />
      {hint && !error && <span className="text-xs text-suave">{hint}</span>}
      {error && <span className="text-sm text-erro">{error}</span>}
    </label>
  );
}

export function SelectField({
  label,
  name,
  error,
  hint,
  children,
  className,
  ...props
}: ComponentProps<"select"> & { label: string; name: string; error?: string; hint?: string }) {
  return (
    <label className={cx("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-medium">{label}</span>
      <select name={name} className={inputClass} aria-invalid={!!error || undefined} {...props}>
        {children}
      </select>
      {hint && !error && <span className="text-xs text-suave">{hint}</span>}
      {error && <span className="text-sm text-erro">{error}</span>}
    </label>
  );
}

export function TextareaField({
  label,
  name,
  className,
  ...props
}: ComponentProps<"textarea"> & { label: string; name: string }) {
  return (
    <label className={cx("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-medium">{label}</span>
      <textarea
        name={name}
        rows={3}
        className="w-full rounded-[10px] border border-[#c9cbbe] bg-white px-3.5 py-2.5 text-tinta focus:border-verde focus:outline-2 focus:outline-verde/30"
        {...props}
      />
    </label>
  );
}

export function CheckboxField({ label, name, ...props }: ComponentProps<"input"> & { label: string; name: string }) {
  return (
    <label className="flex min-h-11 items-center gap-3">
      <input type="checkbox" name={name} className="size-5 accent-verde" {...props} />
      <span>{label}</span>
    </label>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "ok" | "neutral" | "warn"; children: ReactNode }) {
  const tones = {
    ok: "bg-[#e4eee4] text-[#2d5738]",
    neutral: "bg-linha text-suave",
    warn: "bg-[#f1eed9] text-[#5e531b]",
  };
  return <span className={cx("inline-block rounded-xl px-2.5 py-1 text-sm font-medium", tones[tone])}>{children}</span>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="py-10 text-center text-suave">{children}</p>;
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-[10px] bg-[#f6e3e0] px-4 py-3 text-sm text-[#7a2e23]">
      {message}
    </p>
  );
}

/** Tabela simples com rolagem horizontal no celular. */
export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-[15px]">
        <thead>
          <tr className="text-left text-suave">
            {head.map((h) => (
              <th key={h} scope="col" className="border-b border-linha px-3 py-2 font-medium first:pl-0">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_td]:border-b [&_td]:border-[#eeede6] [&_td]:px-3 [&_td]:py-3 [&_td:first-child]:pl-0">
          {children}
        </tbody>
      </table>
    </div>
  );
}
