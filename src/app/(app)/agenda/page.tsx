import Link from "next/link";
import type { AppointmentStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { currentProfessionalId, requireRole } from "@/lib/auth";
import { CAN_EDIT, NAV_ACCESS, hasRole } from "@/lib/roles";
import { STATUS_LABELS } from "@/lib/agenda";
import { AGENDA_END_HOUR, AGENDA_START_HOUR } from "@/lib/clinic";
import { addDays, dayRange, formatDayLong, formatTime, isDayKey, minutesOfDay, todayKey } from "@/lib/time";
import { Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";

const ROW_MINUTES = 5;
const ROW_PX = 6;
const ROWS = ((AGENDA_END_HOUR - AGENDA_START_HOUR) * 60) / ROW_MINUTES;

function rowOf(date: Date) {
  const m = minutesOfDay(date) - AGENDA_START_HOUR * 60;
  return Math.min(Math.max(Math.round(m / ROW_MINUTES), 0), ROWS) + 2; // linha 1 é o cabeçalho
}

const STATUS_STYLE: Record<AppointmentStatus, string> = {
  AGENDADO: "border-[1.5px] border-dashed border-alerta",
  CONFIRMADO: "",
  REALIZADO: "",
  FALTA: "opacity-70 [&_.nome]:line-through",
  CANCELADO: "hidden",
};

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ data?: string; esp?: string; prof?: string }> }) {
  const session = await requireRole(...NAV_ACCESS["/agenda"]);
  const sp = await searchParams;
  const day = isDayKey(sp.data) ? sp.data : todayKey();
  const canEdit = hasRole(session.role, CAN_EDIT.agenda);

  const ownProfessionalId = session.role === "PROFISSIONAL" ? await currentProfessionalId(session.userId) : null;
  const professionalFilter = session.role === "PROFISSIONAL" ? (ownProfessionalId ?? "nenhum") : sp.prof;

  const { start, end } = dayRange(day);
  const where: Prisma.AppointmentWhereInput = {
    startsAt: { gte: start, lt: end },
    status: { not: "CANCELADO" },
    ...(sp.esp ? { specialtyId: sp.esp } : {}),
    ...(professionalFilter ? { professionalId: professionalFilter } : {}),
  };

  const [appointments, rooms, specialties, professionals] = await Promise.all([
    db.appointment.findMany({ where, include: { patient: true, professional: true, specialty: true }, orderBy: { startsAt: "asc" } }),
    db.room.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.specialty.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    session.role === "PROFISSIONAL" ? Promise.resolve([]) : db.professional.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  // Salas desativadas que ainda têm sessões no dia continuam aparecendo.
  const roomIds = new Set(rooms.map((r) => r.id));
  const extraRoomIds = [...new Set(appointments.map((a) => a.roomId))].filter((id) => !roomIds.has(id));
  const allRooms = extraRoomIds.length ? [...rooms, ...(await db.room.findMany({ where: { id: { in: extraRoomIds } } }))] : rooms;

  const count = (s: AppointmentStatus) => appointments.filter((a) => a.status === s).length;
  const summary = [
    { label: "Sessões no dia", value: appointments.length, tone: "text-verde" },
    { label: "Confirmadas", value: count("CONFIRMADO") + count("REALIZADO"), tone: "text-verde" },
    { label: "A confirmar", value: count("AGENDADO"), tone: "text-alerta" },
    { label: "Faltas", value: count("FALTA"), tone: "text-erro" },
  ];

  const link = (params: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const merged = { data: day, esp: sp.esp, prof: sp.prof, ...params };
    for (const [k, v] of Object.entries(merged)) if (v) q.set(k, v);
    return `/agenda?${q}`;
  };

  const hours = Array.from({ length: AGENDA_END_HOUR - AGENDA_START_HOUR }, (_, i) => AGENDA_START_HOUR + i);

  return (
    <>
      <PageHeader
        title="Agenda"
        subtitle={formatDayLong(day)}
        actions={
          <>
            <nav aria-label="Navegar entre dias" className="flex items-center gap-1 rounded-xl bg-linha p-1">
              <Link href={link({ data: addDays(day, -1) })} aria-label="Dia anterior" className="flex size-10 items-center justify-center rounded-lg hover:bg-white">‹</Link>
              <Link href={link({ data: todayKey() })} className="flex h-10 items-center rounded-lg px-3 hover:bg-white">Hoje</Link>
              <Link href={link({ data: addDays(day, 1) })} aria-label="Próximo dia" className="flex size-10 items-center justify-center rounded-lg hover:bg-white">›</Link>
            </nav>
            <form className="flex">
              <label htmlFor="data" className="sr-only">Ir para a data</label>
              <input id="data" name="data" type="date" defaultValue={day} className="h-11 rounded-[10px] border border-[#c9cbbe] bg-white px-3" />
              {sp.esp && <input type="hidden" name="esp" value={sp.esp} />}
              {sp.prof && <input type="hidden" name="prof" value={sp.prof} />}
              <button type="submit" className="ml-2 h-11 rounded-[10px] px-3 font-semibold text-verde hover:bg-linha">Ir</button>
            </form>
            {canEdit && <LinkButton href={`/agenda/novo?data=${day}`}>Novo agendamento</LinkButton>}
          </>
        }
      />

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
        {allRooms.length === 0 ? (
          <EmptyState>Cadastre as salas para usar a agenda.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <div
              className="grid gap-x-2"
              style={{
                minWidth: 120 + allRooms.length * 170,
                gridTemplateColumns: `56px repeat(${allRooms.length}, minmax(150px, 1fr))`,
                gridTemplateRows: `44px repeat(${ROWS}, ${ROW_PX}px)`,
              }}
            >
              {allRooms.map((r, i) => (
                <div key={r.id} className="self-center truncate font-semibold text-verde" style={{ gridColumn: i + 2, gridRow: 1 }}>
                  {r.name}
                </div>
              ))}
              {hours.map((h, i) => (
                <div key={h} aria-hidden className="border-t border-linha" style={{ gridColumn: `1 / ${allRooms.length + 2}`, gridRow: 2 + i * 12 }} />
              ))}
              {hours.map((h, i) => (
                <div key={`l${h}`} className="pt-1 text-[13px] text-suave" style={{ gridColumn: 1, gridRow: `${2 + i * 12} / span 12` }}>
                  {String(h).padStart(2, "0")}:00
                </div>
              ))}
              {canEdit &&
                allRooms.flatMap((r, ri) =>
                  hours.flatMap((h, hi) =>
                    [0, 30].map((m) => (
                      <Link
                        key={`${r.id}-${h}-${m}`}
                        href={`/agenda/novo?data=${day}&sala=${r.id}&hora=${String(h).padStart(2, "0")}:${m === 0 ? "00" : "30"}`}
                        aria-hidden
                        tabIndex={-1}
                        className="rounded-md hover:bg-creme"
                        style={{ gridColumn: ri + 2, gridRow: `${2 + hi * 12 + m / 5} / span 6` }}
                      />
                    )),
                  ),
                )}
              {appointments.map((a) => {
                const col = allRooms.findIndex((r) => r.id === a.roomId) + 2;
                const rowStart = rowOf(a.startsAt);
                const rowEnd = Math.max(rowOf(a.endsAt), rowStart + 4);
                return (
                  <Link
                    key={a.id}
                    href={`/agenda/${a.id}`}
                    className={`relative z-10 my-0.5 flex flex-col gap-0.5 overflow-hidden rounded-lg px-2.5 py-1.5 text-tinta hover:outline-2 hover:outline-verde ${STATUS_STYLE[a.status]}`}
                    style={{ gridColumn: col, gridRow: `${rowStart} / ${rowEnd}`, background: `color-mix(in srgb, ${a.specialty.color} 16%, white)` }}
                  >
                    <span className="nome truncate text-sm font-semibold">
                      {a.patient.name}
                      {a.status === "AGENDADO" && " · a confirmar"}
                    </span>
                    <span className="truncate text-[13px]" style={{ color: `color-mix(in srgb, ${a.specialty.color} 70%, black)` }}>
                      {formatTime(a.startsAt)}–{formatTime(a.endsAt)} · {a.professional.name}
                    </span>
                    {a.status !== "AGENDADO" && a.status !== "CONFIRMADO" && <span className="text-[13px] font-medium">{STATUS_LABELS[a.status]}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </Card>
      {appointments.length === 0 && allRooms.length > 0 && <p className="text-sm text-suave">Nenhuma sessão neste dia{sp.esp || sp.prof ? " com esses filtros" : ""}.</p>}
    </>
  );
}

function chip(active: boolean) {
  return (
    "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm " +
    (active ? "border-verde bg-verde text-creme" : "border-[#c9cbbe] bg-white text-tinta hover:border-verde")
  );
}
