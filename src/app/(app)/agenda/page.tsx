import Link from "next/link";
import type { AppointmentStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { currentProfessionalId, requireRole } from "@/lib/auth";
import { CAN_EDIT, NAV_ACCESS, hasRole } from "@/lib/roles";
import { AGENDA_END_HOUR, AGENDA_START_HOUR } from "@/lib/clinic";
import { addDays, dayRange, formatDayLong, formatTime, isDayKey, minutesOfDay, minutesToTime, todayKey, weekday } from "@/lib/time";
import { Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { UnitTabs } from "@/components/unit-tabs";
import { LinkPending } from "@/components/link-pending";
import { unitsAndCurrent } from "@/lib/units";

const ROW_MINUTES = 5;
const ROW_PX = 8;
const ROWS = ((AGENDA_END_HOUR - AGENDA_START_HOUR) * 60) / ROW_MINUTES;

function minuteRow(minuteOfDay: number) {
  const m = minuteOfDay - AGENDA_START_HOUR * 60;
  return Math.min(Math.max(Math.round(m / ROW_MINUTES), 0), ROWS) + 2; // linha 1 é o cabeçalho
}

function rowOf(date: Date) {
  return minuteRow(minutesOfDay(date));
}

// Situação ao lado do nome; "confirmado" é o normal e não leva marca.
const STATUS_SUFFIX: Partial<Record<AppointmentStatus, string>> = {
  AGENDADO: "a confirmar",
  REALIZADO: "realizada",
  FALTA: "falta",
};

const STATUS_STYLE: Record<AppointmentStatus, string> = {
  AGENDADO: "border-[1.5px] border-dashed border-alerta",
  CONFIRMADO: "",
  REALIZADO: "",
  FALTA: "opacity-70 [&_.nome]:line-through",
  CANCELADO: "hidden",
};

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ data?: string; esp?: string; prof?: string; unidade?: string }> }) {
  const session = await requireRole(...NAV_ACCESS["/agenda"]);
  const sp = await searchParams;
  const day = isDayKey(sp.data) ? sp.data : todayKey();
  const canEdit = hasRole(session.role, CAN_EDIT.agenda);

  const ownProfessionalId = session.role === "PROFISSIONAL" ? await currentProfessionalId(session.userId) : null;
  const professionalFilter = session.role === "PROFISSIONAL" ? (ownProfessionalId ?? "nenhum") : sp.prof;

  const { units, current: unit } = await unitsAndCurrent(sp.unidade);
  const unitId = unit?.id ?? "nenhuma";

  const { start, end } = dayRange(day);
  const where: Prisma.AppointmentWhereInput = {
    startsAt: { gte: start, lt: end },
    status: { not: "CANCELADO" },
    room: { unitId },
    ...(sp.esp ? { specialtyId: sp.esp } : {}),
    ...(professionalFilter ? { professionalId: professionalFilter } : {}),
  };

  const [appointments, schedules, specialties, professionals] = await Promise.all([
    db.appointment.findMany({ where, include: { patient: true, professional: true, specialty: true, room: true }, orderBy: { startsAt: "asc" } }),
    db.professionalSchedule.findMany({
      where: {
        weekday: weekday(day),
        room: { unitId },
        professional: { active: true, ...(sp.esp ? { specialtyId: sp.esp } : {}) },
        ...(professionalFilter ? { professionalId: professionalFilter } : {}),
      },
      include: { room: true },
      orderBy: { startMinute: "asc" },
    }),
    db.specialty.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    session.role === "PROFISSIONAL" ? Promise.resolve([]) : db.professional.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  // Uma coluna por profissional que atende no dia nesta unidade: pela grade de horários ou por ter sessão marcada.
  const columnIds = new Set([...schedules.map((b) => b.professionalId), ...appointments.map((a) => a.professionalId)]);
  const columns = columnIds.size
    ? await db.professional.findMany({ where: { id: { in: [...columnIds] } }, include: { specialty: true }, orderBy: [{ specialty: { name: "asc" } }, { name: "asc" }] })
    : [];
  const blocksOf = (professionalId: string) => schedules.filter((b) => b.professionalId === professionalId);
  const hasRooms = (await db.room.count({ where: { active: true, unitId } })) > 0;

  const count = (s: AppointmentStatus) => appointments.filter((a) => a.status === s).length;
  const summary = [
    { label: "Sessões no dia", value: appointments.length, tone: "text-verde" },
    { label: "Confirmadas", value: count("CONFIRMADO") + count("REALIZADO"), tone: "text-verde" },
    { label: "A confirmar", value: count("AGENDADO"), tone: "text-alerta" },
    { label: "Faltas", value: count("FALTA"), tone: "text-erro" },
  ];

  const link = (params: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const merged = { data: day, unidade: unit?.id, esp: sp.esp, prof: sp.prof, ...params };
    for (const [k, v] of Object.entries(merged)) if (v) q.set(k, v);
    return `/agenda?${q}`;
  };

  // Pacientes do mesmo atendimento (dupla) aparecem num cartão só.
  const sessions = [...Map.groupBy(appointments, (a) => `${a.professionalId}|${a.roomId}|${a.startsAt.getTime()}|${a.endsAt.getTime()}`).values()];

  const hours = Array.from({ length: AGENDA_END_HOUR - AGENDA_START_HOUR }, (_, i) => AGENDA_START_HOUR + i);

  return (
    <>
      <PageHeader
        title="Agenda"
        subtitle={`${formatDayLong(day)}${unit ? ` · ${unit.name}` : ""}`}
        actions={
          <>
            <nav aria-label="Navegar entre dias" className="flex items-center gap-1 rounded-xl bg-linha p-1">
              <Link href={link({ data: addDays(day, -1) })} aria-label="Dia anterior" className="flex size-10 items-center justify-center rounded-lg hover:bg-white"><LinkPending>‹</LinkPending></Link>
              <Link href={link({ data: todayKey() })} className="flex h-10 items-center rounded-lg px-3 hover:bg-white"><LinkPending>Hoje</LinkPending></Link>
              <Link href={link({ data: addDays(day, 1) })} aria-label="Próximo dia" className="flex size-10 items-center justify-center rounded-lg hover:bg-white"><LinkPending>›</LinkPending></Link>
            </nav>
            <form className="flex">
              <label htmlFor="data" className="sr-only">Ir para a data</label>
              <input id="data" name="data" type="date" defaultValue={day} className="h-11 rounded-[10px] border border-[#c9cbbe] bg-white px-3" />
              {unit && <input type="hidden" name="unidade" value={unit.id} />}
              {sp.esp && <input type="hidden" name="esp" value={sp.esp} />}
              {sp.prof && <input type="hidden" name="prof" value={sp.prof} />}
              <button type="submit" className="ml-2 h-11 rounded-[10px] px-3 font-semibold text-verde hover:bg-linha">Ir</button>
            </form>
            {canEdit && <LinkButton href={`/agenda/novo?data=${day}`}>Novo agendamento</LinkButton>}
          </>
        }
      />

      <UnitTabs units={units} currentId={unit?.id} href={(id) => link({ unidade: id })} />

      <section aria-label="Resumo do dia" className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4">
        {summary.map((s) => (
          <div key={s.label} className="flex flex-col gap-1.5 rounded-[14px] bg-white px-5 py-4">
            <span className="text-sm text-suave">{s.label}</span>
            <span className={`text-3xl font-semibold ${s.tone}`}>{s.value}</span>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Filtrar por especialidade" className="flex flex-wrap gap-2">
          <Link href={link({ esp: undefined })} aria-current={!sp.esp ? "true" : undefined} className={chip(!sp.esp)}>Todas</Link>
          {specialties.map((s) => (
            <Link key={s.id} href={link({ esp: s.id })} aria-current={sp.esp === s.id ? "true" : undefined} className={chip(sp.esp === s.id)}>
              <span aria-hidden className="size-2.5 rounded-full" style={{ background: s.color }} />
              {s.name}
            </Link>
          ))}
        </div>
        {professionals.length > 0 && (
          <form className="ml-auto flex items-center gap-2">
            <input type="hidden" name="data" value={day} />
            {unit && <input type="hidden" name="unidade" value={unit.id} />}
            {sp.esp && <input type="hidden" name="esp" value={sp.esp} />}
            <label htmlFor="prof" className="text-sm text-suave">Profissional</label>
            <select id="prof" name="prof" defaultValue={sp.prof ?? ""} className="h-10 rounded-[10px] border border-[#c9cbbe] bg-white px-3">
              <option value="">Todos</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button type="submit" className="h-10 rounded-[10px] px-3 font-semibold text-verde hover:bg-linha">Filtrar</button>
          </form>
        )}
      </div>

      <Card className="p-4">
        {!hasRooms ? (
          <EmptyState>Cadastre as salas{unit ? ` da unidade ${unit.name}` : ""} para usar a agenda.</EmptyState>
        ) : columns.length === 0 ? (
          <EmptyState>
            Nenhum profissional atende neste dia{sp.esp || sp.prof ? " com esses filtros" : ""}. Defina os dias de cada um em Profissionais → Horários.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <div
              className="grid gap-x-2"
              style={{
                minWidth: 120 + columns.length * 170,
                gridTemplateColumns: `56px repeat(${columns.length}, minmax(150px, 1fr))`,
                gridTemplateRows: `56px repeat(${ROWS}, ${ROW_PX}px)`,
              }}
            >
              {columns.map((p, i) => (
                <div key={p.id} className="flex min-w-0 flex-col justify-center" style={{ gridColumn: i + 2, gridRow: 1 }}>
                  <span className="flex items-center gap-1.5 truncate font-semibold text-verde">
                    <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: p.specialty.color }} />
                    {p.name}
                  </span>
                  <span className="truncate text-[12px] text-suave">
                    {blocksOf(p.id).map((b) => `${minutesToTime(b.startMinute)}–${minutesToTime(b.endMinute)} ${b.room.name}`).join(" · ") || p.specialty.name}
                  </span>
                </div>
              ))}
              {hours.map((h, i) => (
                <div key={h} aria-hidden className="border-t border-linha" style={{ gridColumn: `1 / ${columns.length + 2}`, gridRow: 2 + i * 12 }} />
              ))}
              {hours.map((h, i) => (
                <div key={`l${h}`} className="pt-1 text-[13px] text-suave" style={{ gridColumn: 1, gridRow: `${2 + i * 12} / span 12` }}>
                  {String(h).padStart(2, "0")}:00
                </div>
              ))}
              {columns.flatMap((p, pi) =>
                blocksOf(p.id).map((b) => (
                  // Faixa clara: horário em que o profissional atende (grade).
                  <div
                    key={b.id}
                    aria-hidden
                    className="rounded-md bg-[#f4f5ee]"
                    style={{ gridColumn: pi + 2, gridRow: `${minuteRow(b.startMinute)} / ${minuteRow(b.endMinute)}` }}
                  />
                )),
              )}
              {canEdit &&
                columns.flatMap((p, pi) =>
                  hours.flatMap((h, hi) =>
                    [0, 30].map((m) => {
                      const minute = h * 60 + m;
                      const room = blocksOf(p.id).find((b) => b.startMinute <= minute && minute < b.endMinute)?.roomId;
                      return (
                        <Link
                          key={`${p.id}-${h}-${m}`}
                          href={`/agenda/novo?data=${day}&prof=${p.id}${room ? `&sala=${room}` : ""}&hora=${minutesToTime(minute)}`}
                          aria-hidden
                          tabIndex={-1}
                          className="relative rounded-md hover:bg-creme"
                          style={{ gridColumn: pi + 2, gridRow: `${2 + hi * 12 + m / 5} / span 6` }}
                        />
                      );
                    }),
                  ),
                )}
              {sessions.map((group) => {
                const a = group[0];
                const col = columns.findIndex((p) => p.id === a.professionalId) + 2;
                const rowStart = rowOf(a.startsAt);
                const rowEnd = Math.max(rowOf(a.endsAt), rowStart + 4);
                return (
                  <Link
                    key={a.id}
                    href={`/agenda/${a.id}`}
                    title={group.length > 1 ? `Dupla: ${group.map((g) => g.patient.name).join(" e ")}` : undefined}
                    className={`relative z-10 my-0.5 flex flex-col gap-0.5 overflow-hidden rounded-lg px-2.5 py-1 text-tinta hover:outline-2 hover:outline-verde ${STATUS_STYLE[a.status]}`}
                    style={{ gridColumn: col, gridRow: `${rowStart} / ${rowEnd}`, background: `color-mix(in srgb, ${a.specialty.color} 16%, white)` }}
                  >
                    <span className="truncate text-sm">
                      <span className="nome font-semibold">{group.length > 1 ? group.map((g) => g.patient.name.split(" ")[0]).join(" + ") : a.patient.name}</span>
                      {STATUS_SUFFIX[a.status] && <span className="font-medium"> · {STATUS_SUFFIX[a.status]}</span>}
                    </span>
                    <span className="truncate text-[13px]" style={{ color: `color-mix(in srgb, ${a.specialty.color} 70%, black)` }}>
                      {formatTime(a.startsAt)}–{formatTime(a.endsAt)} · {a.room.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </Card>
      {appointments.length === 0 && columns.length > 0 && <p className="text-sm text-suave">Nenhuma sessão neste dia{sp.esp || sp.prof ? " com esses filtros" : ""}.</p>}
    </>
  );
}

function chip(active: boolean) {
  return (
    "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm " +
    (active ? "border-verde bg-verde text-creme" : "border-[#c9cbbe] bg-white text-tinta hover:border-verde")
  );
}
