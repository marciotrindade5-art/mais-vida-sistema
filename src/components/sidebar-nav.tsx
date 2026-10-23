"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type NavItem = { href: string; label: string; icon: ReactNode };

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  // O item ativo é o de caminho mais longo que casa com a URL (/salas/ocupacao vence /salas).
  const activeHref = items
    .filter((i) => (i.href === "/" ? pathname === "/" : pathname === i.href || pathname.startsWith(i.href + "/")))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const active = item.href === activeHref;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={
                "flex min-h-11 items-center gap-3 rounded-[10px] px-3.5 py-3 " +
                (active ? "bg-creme font-semibold text-verde" : "text-creme hover:bg-verde-borda")
              }
            >
              {item.icon}
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
