import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { CAN_EDIT, NAV_ACCESS, hasRole } from "@/lib/roles";
import { dayList, freeSlots, loadSchedule } from "@/lib/availability";
import { addDays, formatDayShort, isDayKey, todayKey, weekday } from "@/lib/time";
import { unitsAndCurrent } from "@/lib/units";
import { Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { UnitTabs } from "@/components/unit-tabs";

const DAYS = 7;
const DURATIONS = [30, 40, 45, 50, 60, 90, 120, 180];

export default async function HorariosLivresPage({
  searchParams,
}: {
  searchParams: Promise<{ unidade?: string; esp?: string; prof?: string; data?: string; dur?: string }>;
}) {
  const session = await requireRole(...NAV_ACCESS["/agenda/livres"]);
  const canBook = hasRole(session.role, CAN_EDIT.agenda);
  const sp = await searchParams;
  const { units, current: unit } = await unitsAndCurrent(sp.unidade);
  const from = isDayKey(sp.data) && sp.data >= todayKey() ? sp.data : todayKey();

  const specialties = await db.specialty.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  const specialty = specialties.find((s) => s.id === sp.esp);
  const duration = DURATIONS.includes(Number(sp.dur)) ? Number(sp.dur) : (specialty?.defaultMinutes ?? 50);

  const professionals = unit
    ? await db.professional.findMany({
        where: {
          active: true,
          ...(specialty ? { specialtyId: specialty.id } : {}),
          ...(sp.prof ? { id: sp.prof } : {}),
          schedules: { some: { room: { unitId: unit.id } } },
        },
        include: { specialty: true },
        orderBy: { name: "asc" },
      })
    : [];

  const days = dayList(from, DAYS);
  const data = unit ? await loadSchedule(unit.id, professionals.map((p) => p.id), from, addDays(from, DAYS)) : { blocks: [], bookings: [] };

  const link = (params: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const merged = { unidade: unit?.id, esp: sp.esp, prof: sp.prof, data: from, dur: sp.dur, ...params };
    for (const [k, v] of Object.entries(merged)) if (v) q.set(k, v);
    return `/agenda/livres?${q}`;
  };

  const results = professionals.map((p) => ({
    professional: p,
    days: days
      .map((day) => ({ day, slots: freeSlots(p.id, day, duration, data) }))
      .filter((d) => data.blocks.some((b) => b.professionalId === p.id && b.weekday === weekday(d.day))),
  }));
  const total = results.reduce((s, r) => s + r.days.reduce((x, d) => x + d.slots.length, 0), 0);

  return (
    <>
      <PageHeader
        title="Horários livres"
        subtitle={`${formatDayShort(from)} a ${formatDayShort(addDays(from, DAYS - 1))}${unit ? ` · ${unit.name}` : ""}`}
        actions={
          <nav aria-label="Navegar entre semanas" className="flex items-center gap-1 rounded-xl bg-linha p-1">
            {from > todayKey() && (
              <Link href={link({ data: addDays(from, -DAYS) < todayKey() ? todayKey() : addDays(from, -DAYS) })} aria-label="Semana anterior" className="flex size-10 items-center justify-center rounded-lg hover:bg-white">‹</Link>
            )}
            <Link href={link({ data: undefined })} className="flex h-10 items-center rounded-lg px-3 hover:bg-white">A partir de hoje</Link>
            <Link href={link({ data: addDays(from, DAYS) })} aria-label="Próxima semana" className="flex size-10 items-center justify-center rounded-lg hover:bg-white">›</Link>
          </nav>
        }
      />

      <UnitTabs units={units} currentId={unit?.id} href={(id) => link({ unidade: id, prof: undefined })} />

      <div role="group" aria-label="Especialidade" className="flex flex-wrap gap-2">
        <Link href={link({ esp: undefined, prof: undefined, dur: undefined })} aria-current={!specialty ? "true" : undefined} className={chip(!specialty)}>Todas</Link>
        {specialties.map((s) => (
          <Link key={s.id} href={link({ esp: s.id, prof: undefined, dur: undefined })} aria-current={specialty?.id === s.id ? "true" : undefined} className={chip(specialty?.id === s.id)}>
            <span aria-hidden className="size-2.5 rounded-full" style={{ background: s.color }} />
            {s.name}
          </Link>
        ))}
      </div>

      <form className="flex flex-wrap items-end gap-3">
        {unit && <input type="hidden" name="unidade" value={unit.id} />}
        {sp.esp && <input type="hidden" name="esp" value={sp.esp} />}
        {sp.prof && <input type="hidden" name="prof" value={sp.prof} />}
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-suave">A partir de</span>
          <input name="data" type="date" min={todayKey()} defaultValue={from} className="h-11 rounded-[10px] border border-[#c9cbbe] bg-white px-3" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-suave">Duração da sessão</span>
          <select name="dur" defaultValue={String(duration)} className="h-11 rounded-[10px] border border-[#c9cbbe] bg-white px-3">
            {DURATIONS.map((m) => (
              <option key={m} value={m}>{m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, "0") : ""}`}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="h-11 rounded-[10px] px-4 font-semibold text-verde hover:bg-linha">Atualizar</button>
        {sp.prof && <Link href={link({ prof: undefined })} className="flex h-11 items-center rounded-[10px] px-4 text-verde hover:bg-linha">Ver todos os profissionais</Link>}
      </form>

      {!unit ? (
        <Card><EmptyState>Cadastre as unidades e as salas para ver os horários.</EmptyState></Card>
      ) : results.length === 0 ? (
        <Card>
          <EmptyState>
            Nenhum profissional{specialty ? ` de ${specialty.name}` : ""} com horários na unidade {unit.name}. Defina a grade em Profissionais → Horários.
          </EmptyState>
        </Card>
      ) : (
        <>
          <p className="text-sm text-suave">
            {total} {total === 1 ? "horário livre" : "horários livres"} de {duration} min. {canBook ? "Clique num horário para agendar." : ""}
          </p>
          {results.map(({ professional: p, days: pd }) => (
            <Card key={p.id} className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2.5 text-lg font-semibold text-verde">
                  <span aria-hidden className="size-3 rounded-full" style={{ background: p.specialty.color }} />
                  {p.name}
                  <span className="text-sm font-normal text-suave">{p.specialty.name}</span>
                </h2>
                {!sp.prof && <Link href={link({ prof: p.id })} className="text-sm text-verde hover:underline">Só este profissional</Link>}
              </div>
              <ul className="flex flex-col divide-y divide-linha">
                {pd.map(({ day, slots }) => (
                  <li key={day} className="flex flex-wrap items-start gap-x-4 gap-y-2 py-2.5">
                    <span className="w-24 pt-2 text-sm font-semibold capitalize">{formatDayShort(day)}</span>
                    {slots.length === 0 ? (
                      <span className="pt-2 text-sm text-suave">Agenda cheia</span>
                    ) : (
                      <div className="flex flex-1 flex-wrap gap-2">
                        {slots.map((s) => {
                          const label = (
                            <>
                              <span className="font-semibold">{s.time}</span>
                              <span className="text-[13px] opacity-80">{s.roomName}</span>
                            </>
                          );
                          const cls = "flex min-h-10 items-center gap-2 rounded-[10px] border border-salvia bg-creme px-3";
                          return canBook ? (
                            <Link
                              key={`${s.time}-${s.roomId}`}
                              href={`/agenda/novo?data=${day}&hora=${s.time}&sala=${s.roomId}&prof=${p.id}&dur=${duration}`}
                              className={`${cls} hover:border-verde hover:bg-white`}
                            >
                              {label}
                            </Link>
                          ) : (
                            <span key={`${s.time}-${s.roomId}`} className={cls}>{label}</span>
                          );
                        })}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
          <p className="text-[13px] text-suave">Para pôr um segundo paciente num atendimento já marcado (dupla), abra a sessão na agenda e use “Adicionar 2º paciente”.</p>
          {canBook && <div><LinkButton href={`/agenda/novo?data=${from}`} variant="secondary">Agendar outro horário</LinkButton></div>}
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
