import Image from "next/image";
import { requireSession } from "@/lib/auth";
import { NAV_ACCESS, ROLE_LABELS } from "@/lib/roles";
import { SidebarNav, type NavItem } from "@/components/sidebar-nav";
import { icons } from "@/components/icons";
import { logout } from "../login/actions";

const NAV: NavItem[] = [
  { href: "/", label: "Início", icon: icons.inicio },
  { href: "/agenda", label: "Agenda", icon: icons.agenda },
  { href: "/agenda/livres", label: "Horários livres", icon: icons.livres },
  { href: "/agenda/mapa", label: "Mapa de disponibilidade", icon: icons.mapa },
  { href: "/salas/ocupacao", label: "Ocupação das salas", icon: icons.ocupacao },
  { href: "/financeiro", label: "Financeiro", icon: icons.financeiro },
  { href: "/pacientes", label: "Pacientes", icon: icons.pacientes },
  { href: "/profissionais", label: "Profissionais", icon: icons.profissionais },
  { href: "/especialidades", label: "Especialidades", icon: icons.especialidades },
  { href: "/planos", label: "Planos de saúde", icon: icons.planos },
  { href: "/salas", label: "Salas", icon: icons.salas },
  { href: "/unidades", label: "Unidades", icon: icons.unidades },
  { href: "/usuarios", label: "Usuários", icon: icons.usuarios },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const items = NAV.filter((item) => NAV_ACCESS[item.href]?.includes(session.role));

  return (
    <div className="flex min-h-screen flex-wrap">
      <nav aria-label="Menu principal" className="flex max-w-full flex-[1_1_232px] flex-col gap-8 bg-verde px-5 py-7 text-creme">
        <Image src="/marca/logo-sobre-verde.svg" alt="Clínica Mais Vida" width={176} height={54} priority />
        <SidebarNav items={items} />
        <div className="mt-auto flex items-center gap-3 border-t border-verde-borda pt-5">
          <div aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-salvia font-semibold text-verde-escuro">
            {session.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-semibold">{session.name}</span>
            <span className="text-[13px] text-[#cfd3c2]">{ROLE_LABELS[session.role]}</span>
          </div>
          <form action={logout}>
            <button type="submit" aria-label="Sair" className="flex size-11 items-center justify-center rounded-[10px] hover:bg-verde-borda">
              {icons.sair}
            </button>
          </form>
        </div>
      </nav>
      <main className="flex min-w-0 flex-[999_1_560px] flex-col gap-6 px-5 py-8 sm:px-10">{children}</main>
    </div>
  );
}
