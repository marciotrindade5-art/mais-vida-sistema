import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NAV_ACCESS } from "@/lib/roles";
import { OCCUPYING } from "@/lib/agenda";
import { bookedMinutes, openMinutes } from "@/lib/occupancy";
import { addDays, dayRange, formatDayShort, isDayKey, mondayOf, todayKey } from "@/lib/time";
import { Card, EmptyState, PageHeader } from "@/components/ui";

// Escala da sálvia ao verde da marca; o texto troca de cor para manter o contraste.
const SCALE = [
  { min: 0, bg: "#f2f1ec", fg: "#1c2a20" },
  { min: 25, bg: "#d6dac4", fg: "#1c2a20" },
  { min: 50, bg: "#939b72", fg: "#142619" },
  { min: 75, bg: "#5c7255", fg: "#ffffff" },
  { min: 90, bg: "#24412d", fg: "#ffffff" },
];

function cellColors(pct: number) {
  return [...SCALE].reverse().find((s) => pct >= s.min) ?? SCALE[0];
}

function pct(booked: number, available: number) {
  return available > 0 ? Math.round((booked / available) * 100) : 0;
}

export default async function OcupacaoPage({ searchParams }: { searchParams: Promise<{ semana?: string }> }) {
  await requireRole(...NAV_ACCESS["/salas/ocupacao"]);
  const sp = await searchParams;
  const monday = mondayOf(isDayKey(sp.semana) ? sp.semana : todayKey());
  const days = Array.from({ length: 6 }, (_, i) => addDays(monday, i)).filter((d) => openMinutes(d) > 0);

  const [rooms, bookings] = await Promise.all([
    db.room.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.appointment.findMany({
      where: { status: { in: OCCUPYING }, startsAt: { gte: dayRange(monday).start, lt: dayRange(addDays(monday, 7)).start } },
      select: { roomId: true, startsAt: true, endsAt: true },
    }),
  ]);

  const rows = rooms.map((room) => {
    const cells = days.map((day) => {
      const booked = bookedMinutes(day, room.id, bookings);
      return { day, booked, available: openMinutes(day) };
    });
    const booked = cells.reduce((s, c) => s + c.booked, 0);
    const available = cells.reduce((s, c) => s + c.available, 0);
    return { room, cells, booked, available, pct: pct(booked, available) };
  });

  const totalBooked = rows.reduce((s, r) => s + r.booked, 0);
  const totalAvailable = rows.reduce((s, r) => s + r.available, 0);
  const busiest = [...rows].sort((a, b) => b.pct - a.pct)[0];
  const freeHours = Math.round((totalAvailable - totalBooked) / 60);
  const fmtRange = `${formatDayShort(monday)} a ${formatDayShort(days[days.length - 1] ?? monday)}`;

  return (
    <>
      <PageHeader
        title="Ocupação das salas"
        subtitle={`Semana de ${fmtRange}`}
        actions={
          <nav aria-label="Navegar entre semanas" className="flex items-center gap-1 rounded-xl bg-linha p-1">
            <Link href={`/salas/ocupacao?semana=${addDays(monday, -7)}`} aria-label="Semana anterior" className="flex size-10 items-center justify-center rounded-lg hover:bg-white">‹</Link>
            <Link href="/salas/ocupacao" className="flex h-10 items-center rounded-lg px-3 hover:bg-white">Esta semana</Link>
            <Link href={`/salas/ocupacao?semana=${addDays(monday, 7)}`} aria-label="Próxima semana" className="flex size-10 items-center justify-center rounded-lg hover:bg-white">›</Link>
          </nav>
        }
      />

      {rooms.length === 0 ? (
        <Card><EmptyState>Cadastre as salas para ver a ocupação.</EmptyState></Card>
      ) : (
        <>
          <section aria-label="Resumo da semana" className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            <div className="flex flex-col gap-1.5 rounded-[14px] bg-verde px-5 py-4 text-creme">
              <span className="text-sm text-[#cfd3c2]">Ocupação média</span>
              <span className="text-3xl font-semibold">{pct(totalBooked, totalAvailable)}%</span>
              <span className="text-[13px] text-[#cfd3c2]">das horas de funcionamento</span>
            </div>
            <div className="flex flex-col gap-1.5 rounded-[14px] bg-white px-5 py-4">
              <span className="text-sm text-suave">Sala mais ocupada</span>
              <span className="text-2xl font-semibold text-verde">{busiest.pct > 0 ? busiest.room.name : "Nenhuma"}</span>
              {busiest.pct > 0 && <span className="text-[13px] text-suave">{busiest.pct}% da semana</span>}
            </div>
            <div className="flex flex-col gap-1.5 rounded-[14px] bg-white px-5 py-4">
              <span className="text-sm text-suave">Horas livres na semana</span>
              <span className="text-2xl font-semibold text-verde">{freeHours} h</span>
              <span className="text-[13px] text-suave">somando todas as salas</span>
            </div>
          </section>

          <Card className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-verde">Ocupação por sala e dia</h2>
              <div aria-hidden className="flex items-center gap-2 text-[13px] text-suave">
                <span>0%</span>
                {SCALE.map((s) => <span key={s.min} className="h-3.5 w-5 rounded" style={{ background: s.bg }} />)}
                <span>100%</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-separate border-spacing-1.5 text-sm">
                <thead>
                  <tr>
                    <th scope="col" className="px-2 text-left font-medium text-suave">Sala</th>
                    {days.map((d) => (
                      <th key={d} scope="col" className="font-medium capitalize text-suave">
                        <Link href={`/agenda?data=${d}`} className="hover:text-verde hover:underline">{formatDayShort(d)}</Link>
                      </th>
                    ))}
                    <th scope="col" className="font-semibold text-verde">Semana</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.room.id}>
                      <th scope="row" className="px-2 text-left font-semibold">{r.room.name}</th>
                      {r.cells.map((c) => {
                        const p = pct(c.booked, c.available);
                        const colors = cellColors(p);
                        return (
                          <td key={c.day} className="h-12 rounded-lg text-center" style={{ background: colors.bg, color: colors.fg }}>
                            {p}%
                          </td>
                        );
                      })}
                      <td className="text-center font-semibold text-verde">{r.pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[13px] text-suave">Considera seg. a sex. das 8h às 19h e sáb. das 8h às 13h. Sessões canceladas não contam.</p>
          </Card>
        </>
      )}
    </>
  );
}
