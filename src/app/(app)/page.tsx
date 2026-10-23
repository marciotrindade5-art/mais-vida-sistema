import Link from "next/link";
import { db } from "@/lib/db";
import { currentProfessionalId, requireSession } from "@/lib/auth";
import { dayRange, todayKey } from "@/lib/time";
import { NAV_ACCESS } from "@/lib/roles";
import { PageHeader } from "@/components/ui";

export default async function InicioPage() {
  const session = await requireSession();
  const today = dayRange(todayKey());
  const ownProfessionalId = session.role === "PROFISSIONAL" ? ((await currentProfessionalId(session.userId)) ?? "nenhum") : undefined;
  const [sessoesHoje, pacientes, profissionais, salas, especialidades] = await Promise.all([
    db.appointment.count({
      where: { startsAt: { gte: today.start, lt: today.end }, status: { not: "CANCELADO" }, professionalId: ownProfessionalId },
    }),
    db.patient.count({ where: { active: true } }),
    db.professional.count({ where: { active: true } }),
    db.room.count({ where: { active: true } }),
    db.specialty.count({ where: { active: true } }),
  ]);

  const cards = [
    { href: "/agenda", label: session.role === "PROFISSIONAL" ? "Suas sessões hoje" : "Sessões hoje", value: sessoesHoje },
    { href: "/pacientes", label: "Pacientes ativos", value: pacientes },
    { href: "/profissionais", label: "Profissionais", value: profissionais },
    { href: "/salas", label: "Salas", value: salas },
    { href: "/especialidades", label: "Especialidades", value: especialidades },
  ].filter((c) => NAV_ACCESS[c.href]?.includes(session.role));

  const hoje = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Sao_Paulo" }).format(new Date());

  return (
    <>
      <PageHeader title={`Olá, ${session.name.split(" ")[0]}`} subtitle={hoje.charAt(0).toUpperCase() + hoje.slice(1)} />
      <section aria-label="Resumo" className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="flex flex-col gap-1.5 rounded-[14px] bg-white px-5 py-4 hover:outline-2 hover:outline-salvia">
            <span className="text-sm text-suave">{c.label}</span>
            <span className="text-3xl font-semibold text-verde">{c.value}</span>
          </Link>
        ))}
      </section>
    </>
  );
}
