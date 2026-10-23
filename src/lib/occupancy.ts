import { CLINIC_HOURS } from "./clinic";
import { localToDate, weekday } from "./time";

type Booking = { roomId: string; startsAt: Date; endsAt: Date };

/** Minutos disponíveis da clínica no dia. */
export function openMinutes(day: string) {
  const h = CLINIC_HOURS[weekday(day)];
  return h ? (h.close - h.open) * 60 : 0;
}

/** Minutos ocupados de uma sala no dia, contando só o horário de funcionamento e sem duplicar sobreposições. */
export function bookedMinutes(day: string, roomId: string, bookings: Booking[]) {
  const h = CLINIC_HOURS[weekday(day)];
  if (!h) return 0;
  const open = localToDate(day, `${String(h.open).padStart(2, "0")}:00`).getTime();
  const close = localToDate(day, `${String(h.close).padStart(2, "0")}:00`).getTime();

  const intervals = bookings
    .filter((b) => b.roomId === roomId)
    .map((b) => [Math.max(b.startsAt.getTime(), open), Math.min(b.endsAt.getTime(), close)] as const)
    .filter(([s, e]) => e > s)
    .sort((a, b) => a[0] - b[0]);

  let total = 0;
  let curStart = -1;
  let curEnd = -1;
  for (const [s, e] of intervals) {
    if (s > curEnd) {
      if (curEnd > curStart) total += curEnd - curStart;
      curStart = s;
      curEnd = e;
    } else curEnd = Math.max(curEnd, e);
  }
  if (curEnd > curStart) total += curEnd - curStart;
  return Math.round(total / 60_000);
}
