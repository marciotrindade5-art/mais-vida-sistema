import { db } from "./db";
import { OCCUPYING } from "./agenda";
import { addDays, dayRange, localToDate, minutesToTime, weekday } from "./time";

type Booking = { professionalId: string; roomId: string; startsAt: Date; endsAt: Date };
type Block = { professionalId: string; roomId: string; roomName: string; weekday: number; startMinute: number; endMinute: number };

export type FreeSlot = {
  day: string;
  time: string;
  roomId: string;
  roomName: string;
};

/** Grade e sessões dos profissionais numa unidade, entre os dias informados (fim exclusivo). */
export async function loadSchedule(unitId: string, professionalIds: string[], from: string, to: string) {
  const [schedules, bookings] = await Promise.all([
    db.professionalSchedule.findMany({
      where: { professionalId: { in: professionalIds }, room: { unitId, active: true } },
      include: { room: true },
      orderBy: [{ weekday: "asc" }, { startMinute: "asc" }],
    }),
    db.appointment.findMany({
      where: {
        status: { in: OCCUPYING },
        startsAt: { gte: dayRange(from).start, lt: dayRange(to).start },
        // Sessões do profissional em qualquer unidade e de qualquer um nas salas desta unidade.
        OR: [{ professionalId: { in: professionalIds } }, { room: { unitId } }],
      },
      select: { professionalId: true, roomId: true, startsAt: true, endsAt: true },
    }),
  ]);
  const blocks: Block[] = schedules.map((s) => ({
    professionalId: s.professionalId,
    roomId: s.roomId,
    roomName: s.room.name,
    weekday: s.weekday,
    startMinute: s.startMinute,
    endMinute: s.endMinute,
  }));
  return { blocks, bookings };
}

function overlapping(bookings: Booking[], start: Date, end: Date) {
  return bookings.filter((b) => b.startsAt < end && b.endsAt > start);
}

/** Horários livres de um profissional no dia, dentro da grade dele, com a duração pedida. */
export function freeSlots(professionalId: string, day: string, duration: number, data: { blocks: Block[]; bookings: Booking[] }, now = new Date()) {
  const out: FreeSlot[] = [];
  const own = data.bookings.filter((b) => b.professionalId === professionalId);
  for (const block of data.blocks.filter((b) => b.professionalId === professionalId && b.weekday === weekday(day))) {
    const roomOthers = data.bookings.filter((b) => b.roomId === block.roomId && b.professionalId !== professionalId);
    let t = block.startMinute;
    while (t + duration <= block.endMinute) {
      const start = localToDate(day, minutesToTime(t));
      const end = new Date(start.getTime() + duration * 60_000);
      const clash = [...overlapping(own, start, end), ...overlapping(roomOthers, start, end)];
      if (clash.length === 0) {
        if (start > now) out.push({ day, time: minutesToTime(t), roomId: block.roomId, roomName: block.roomName });
        t += duration;
      } else {
        // Pula para o fim da sessão que ocupa o horário.
        const until = Math.max(...clash.map((b) => b.endsAt.getTime()));
        t = Math.max(t + 5, Math.ceil((until - localToDate(day, "00:00").getTime()) / 60_000));
      }
    }
  }
  return out;
}

/** Minutos na grade e minutos já ocupados por sessões dentro dela, por profissional e dia. */
export function scheduleUsage(professionalId: string, day: string, data: { blocks: Block[]; bookings: Booking[] }) {
  const blocks = data.blocks.filter((b) => b.professionalId === professionalId && b.weekday === weekday(day));
  const midnight = localToDate(day, "00:00").getTime();
  const own = data.bookings
    .filter((b) => b.professionalId === professionalId && b.startsAt < new Date(midnight + 86_400_000) && b.endsAt.getTime() > midnight)
    .map((b) => [(b.startsAt.getTime() - midnight) / 60_000, (b.endsAt.getTime() - midnight) / 60_000] as const);

  let scheduled = 0;
  let booked = 0;
  for (const block of blocks) {
    scheduled += block.endMinute - block.startMinute;
    const parts = own
      .map(([s, e]) => [Math.max(s, block.startMinute), Math.min(e, block.endMinute)] as const)
      .filter(([s, e]) => e > s)
      .sort((a, b) => a[0] - b[0]);
    let curS = -1;
    let curE = -1;
    for (const [s, e] of parts) {
      if (s > curE) {
        if (curE > curS) booked += curE - curS;
        curS = s;
        curE = e;
      } else curE = Math.max(curE, e);
    }
    if (curE > curS) booked += curE - curS;
  }
  return { blocks, scheduled, booked: Math.round(booked) };
}

export function dayList(from: string, count: number) {
  return Array.from({ length: count }, (_, i) => addDays(from, i));
}
