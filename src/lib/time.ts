/**
 * A clínica funciona no horário de Brasília (UTC−3, sem horário de verão desde 2019).
 * Datas são gravadas em UTC e convertidas aqui.
 */
export const CLINIC_TZ = "America/Sao_Paulo";
const OFFSET = "-03:00";

/** "2026-10-23" + "14:30" -> Date (UTC) */
export function localToDate(day: string, time: string) {
  return new Date(`${day}T${time}:00${OFFSET}`);
}

/** Dia local (YYYY-MM-DD) de um instante. */
export function dayKey(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: CLINIC_TZ }).format(d);
}

export function todayKey() {
  return dayKey(new Date());
}

/** Início e fim (exclusivo) do dia local, em UTC. */
export function dayRange(day: string) {
  const start = localToDate(day, "00:00");
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

export function addDays(day: string, n: number) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** 0 = domingo ... 6 = sábado */
export function weekday(day: string) {
  return new Date(`${day}T12:00:00Z`).getUTCDay();
}

/** Segunda-feira da semana do dia. */
export function mondayOf(day: string) {
  const wd = weekday(day);
  return addDays(day, wd === 0 ? -6 : 1 - wd);
}

export function isDayKey(v: string | undefined): v is string {
  return !!v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(`${v}T12:00:00Z`).getTime());
}

/** Minutos desde a meia-noite local. */
export function minutesOfDay(d: Date) {
  const [h, m] = new Intl.DateTimeFormat("en-GB", { timeZone: CLINIC_TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .format(d)
    .split(":")
    .map(Number);
  return h * 60 + m;
}

export function formatTime(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: CLINIC_TZ, hour: "2-digit", minute: "2-digit" }).format(d);
}

export function formatDayLong(day: string) {
  const s = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }).format(
    new Date(`${day}T12:00:00Z`),
  );
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatDayShort(day: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", weekday: "short", day: "2-digit", month: "2-digit" }).format(
    new Date(`${day}T12:00:00Z`),
  );
}
