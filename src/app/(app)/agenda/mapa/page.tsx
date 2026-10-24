import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NAV_ACCESS } from "@/lib/roles";
import { loadSchedule, scheduleUsage } from "@/lib/availability";
import { addDays, formatDayShort, isDayKey, minutesToTime, mondayOf, todayKey } from "@/lib/time";
import { unitsAndCurrent } from "@/lib/units";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { UnitTabs } from "@/components/unit-tabs";

function hours(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h && m ? `${h}h${String(m).padStart(2, "0")}` : h ? `${h}h` : `${m}min`;
}

// Quanto mais livre, mais clara a célula; cheia fica no verde da marca.
function cellColors(freePct: number) {
  if (freePct >= 75) return { bg: "#eef1e4", fg: "#1c2a20" };
  if (freePct >= 40) return { bg: "#d6dac4", fg: "#1c2a20" };
  if (freePct > 0) return { bg: "#939b72", fg: "#142619" };
  return { bg: "#24412d", fg: "#ffffff" };
}

export default async function MapaPage({ searchParams }: { searchParams: Promise<{ semana?: string; unidade?: string; esp?: string }> }) {
  await requireRole(...NAV_ACCESS["/agenda/mapa"]);
  const sp = await searchParams;
  const { units, current: unit } = await unitsAndCurrent(sp.unidade);
  const monday = mondayOf(isDayKey(sp.semana) ? sp.semana : todayKey());
  const days = Array.from({ length: 6 }, (_, i) => addDays(monday, i));

  const specialties = await db.specialty.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  const professionals = unit
    ? await db.professional.findMany({
        where: { active: true, schedules: { some: { room: { unitId: unit.id } } }, ...(sp.esp ? { specialtyId: sp.esp } : {}) },
        include: { specialty: true },
        orderBy: [{ specialty: { name: "asc" } }, { name: "asc" }],
      })
    : [];
  const data = unit ? await loadSchedule(unit.id, professionals.map((p) => p.id), monday, addDays(monday, 7)) : { blocks: [], bookings: [] };

  const rows = professionals.map((p) => {
    const cells = days.map((day) => ({ day, ...scheduleUsage(p.id, day, data) }));
    return { p, cells, scheduled: cells.reduce((s, c) => s + c.scheduled, 0), booked: cells.reduce((s, c) => s + c.booked, 0) };
  });
  const totalScheduled = rows.reduce((s, r) => s + r.scheduled, 0);
  const totalBooked = rows.reduce((s, r) => s + r.booked, 0);
  const visibleDays = days.filter((d) => rows.some((r) => r.cells.find((c) => c.day === d)!.scheduled > 0));

  const link = (params: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ semana: monday, unidade: unit?.id, esp: sp.esp, ...params })) if (v) q.set(k, v);
    return `/agenda/mapa?${q}`;
  };

  return (
    <>
      <PageHeader
        title="Mapa de disponibilidade"
        subtitle={`Semana de ${formatDayShort(monday)} a ${formatDayShort(days[5])}${unit ? ` · ${unit.name}` : ""}`}
        actions={
          <nav aria-label="Navegar entre semanas" className="flex items-center gap-1 rounded-xl bg-linha p-1">
            <Link href={link({ semana: addDays(monday, -7) })} aria-label="Semana anterior" className="flex size-10 items-center justify-center rounded-lg hover:bg-white">‹</Link>
            <Link href={link({ semana: undefined })} className="flex h-10 items-center rounded-lg px-3 hover:bg-white">Esta semana</Link>
            <Link href={link({ semana: addDays(monday, 7) })} aria-label="Próxima semana" className="flex size-10 items-center justify-center rounded-lg hover:bg-white">›</Link>
          </nav>
        }
      />

      <UnitTabs units={units} currentId={unit?.id} href={(id) => link({ unidade: id })} />

      <div role="group" aria-label="Especialidade" className="flex flex-wrap gap-2">
        <Link href={link({ esp: undefined })} aria-current={!sp.esp ? "true" : undefined} className={chip(!sp.esp)}>Todas</Link>
        {specialties.map((s) => (
          <Link key={s.id} href={link({ esp: s.id })} aria-current={sp.esp === s.id ? "true" : undefined} className={chip(sp.esp === s.id)}>
            <span aria-hidden className="size-2.5 rounded-full" style={{ background: s.color }} />
            {s.name}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <Card><EmptyState>Nenhum profissional com horários definidos{unit ? ` na unidade ${unit.name}` : ""}. Defina a grade em Profissionais → Horários.</EmptyState></Card>
      ) : (
        <>
          <section aria-label="Resumo da semana" className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            <div className="flex flex-col gap-1.5 rounded-[14px] bg-verde px-5 py-4 text-creme">
              <span className="text-sm text-[#cfd3c2]">Horas livres na semana</span>
              <span className="text-3xl font-semibold">{hours(Math.max(totalScheduled - totalBooked, 0))}</span>
              <span className="text-[13px] text-[#cfd3c2]">dentro da grade dos profissionais</span>
            </div>
            <div className="flex flex-col gap-1.5 rounded-[14px] bg-white px-5 py-4">
              <span className="text-sm text-suave">Horas na grade</span>
              <span className="text-3xl font-semibold text-verde">{hours(totalScheduled)}</span>
              <span className="text-[13px] text-suave">{rows.length} {rows.length === 1 ? "profissional" : "profissionais"}</span>
            </div>
            <div className="flex flex-col gap-1.5 rounded-[14px] bg-white px-5 py-4">
              <span className="text-sm text-suave">Ocupação da grade</span>
              <span className="text-3xl font-semibold text-verde">{totalScheduled ? Math.round((totalBooked / totalScheduled) * 100) : 0}%</span>
              <span className="text-[13px] text-suave">horas com sessão marcada</span>
            </div>
          </section>

          <Card className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-verde">Profissionais por dia</h2>
              <div aria-hidden className="flex items-center gap-2 text-[13px] text-suave">
                <span>livre</span>
                {[90, 50, 10, 0].map((v) => <span key={v} className="h-3.5 w-5 rounded" style={{ background: cellColors(v).bg }} />)}
                <span>cheio</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-separate border-spacing-1.5 text-sm">
                <thead>
                  <tr>
                    <th scope="col" className="px-2 text-left font-medium text-suave">Profissional</th>
                    {visibleDays.map((d) => (
                      <th key={d} scope="col" className="font-medium capitalize text-suave">{formatDayShort(d)}</th>
                    ))}
                    <th scope="col" className="font-semibold text-verde">Livre na semana</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.p.id}>
                      <th scope="row" className="px-2 text-left align-middle">
                        <span className="flex items-center gap-2 font-semibold">
                          <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: r.p.specialty.color }} />
                          {r.p.name}
                        </span>
                        <span className="text-[13px] font-normal text-suave">{r.p.specialty.name}</span>
                      </th>
                      {visibleDays.map((day) => {
                        const c = r.cells.find((x) => x.day === day)!;
                        if (c.scheduled === 0) return <td key={day} className="rounded-lg bg-[#f7f6f1] text-center text-suave">—</td>;
                        const free = Math.max(c.scheduled - c.booked, 0);
                        const colors = cellColors((free / c.scheduled) * 100);
                        return (
                          <td key={day} className="rounded-lg p-0" style={{ background: colors.bg, color: colors.fg }}>
                            <Link href={`/agenda/livres?unidade=${unit!.id}&esp=${r.p.specialtyId}&prof=${r.p.id}&data=${day < todayKey() ? todayKey() : day}`} className="flex h-full flex-col gap-0.5 px-2.5 py-2 hover:underline">
                              <span className="font-semibold">{free > 0 ? `${hours(free)} livres` : "Cheio"}</span>
                              <span className="text-[12px] opacity-85">
                                {c.blocks.map((b) => `${minutesToTime(b.startMinute)}–${minutesToTime(b.endMinute)} ${b.roomName}`).join(" · ")}
                              </span>
                            </Link>
                          </td>
                        );
                      })}
                      <td className="text-center font-semibold text-verde">{hours(Math.max(r.scheduled - r.booked, 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[13px] text-suave">Clique num dia para ver os horários livres e agendar.</p>
          </Card>
        </>
      )}
    </>
  );
}

function chip(active: boolean) {
  return (
    "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm " +
    (active ? "border-verde bg-verde text-creme" : "border-[#c9cbbe] bg-white text-tinta hover:border-verde")
  );
}
