import Link from "next/link";
import type { Role } from "@prisma/client";
import { NAV_ACCESS } from "@/lib/roles";

const TABS = [
  { href: "/financeiro", label: "Resumo" },
  { href: "/financeiro/receber", label: "A receber" },
  { href: "/financeiro/caixa", label: "Caixa do dia" },
  { href: "/financeiro/despesas", label: "Despesas" },
  { href: "/financeiro/repasses", label: "Repasses" },
];

export function FinanceTabs({ role, current }: { role: Role; current: string }) {
  const visible = TABS.filter((t) => t.href === "/financeiro" ? role === "ADMIN" || role === "FINANCEIRO" : NAV_ACCESS[t.href]?.includes(role));
  return (
    <nav aria-label="Seções do financeiro" className="flex flex-wrap gap-1 rounded-xl bg-linha p-1 self-start">
      {visible.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.href === current ? "page" : undefined}
          className={"flex min-h-10 items-center rounded-lg px-4 " + (t.href === current ? "bg-white font-semibold text-verde" : "hover:bg-white/60")}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
