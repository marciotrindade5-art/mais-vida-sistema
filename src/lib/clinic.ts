/** Horário de funcionamento usado na agenda e no cálculo de ocupação das salas. */
export const CLINIC_HOURS: Record<number, { open: number; close: number } | undefined> = {
  // 0 = domingo ... 6 = sábado
  1: { open: 8, close: 19 },
  2: { open: 8, close: 19 },
  3: { open: 8, close: 19 },
  4: { open: 8, close: 19 },
  5: { open: 8, close: 19 },
  6: { open: 8, close: 13 },
};

/** Faixa de horas exibida na grade da agenda. */
export const AGENDA_START_HOUR = 7;
export const AGENDA_END_HOUR = 20;
export const SLOT_MINUTES = 30;
