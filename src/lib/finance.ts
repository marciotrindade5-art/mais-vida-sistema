import type { ExpenseCategory, PaymentMethod, Professional } from "@prisma/client";
import { addDays, todayKey } from "./time";

export const METHOD_LABELS: Record<PaymentMethod, string> = {
  PIX: "Pix",
  DINHEIRO: "Dinheiro",
  CARTAO_CREDITO: "Cartão de crédito",
  CARTAO_DEBITO: "Cartão de débito",
  TRANSFERENCIA: "Transferência",
  BOLETO: "Boleto",
  CONVENIO: "Convênio",
};

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  ALUGUEL: "Aluguel",
  SALARIOS: "Salários",
  REPASSE: "Repasse a profissional",
  MATERIAIS: "Materiais",
  IMPOSTOS: "Impostos",
  SERVICOS: "Serviços",
  MANUTENCAO: "Manutenção",
  OUTROS: "Outros",
};

/** "2026-10" */
export function monthKey(day = todayKey()) {
  return day.slice(0, 7);
}

export function isMonthKey(v: string | undefined): v is string {
  return !!v && /^\d{4}-(0[1-9]|1[0-2])$/.test(v);
}

export function addMonths(month: string, n: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

/** Primeiro e último dia (YYYY-MM-DD) do mês. */
export function monthDays(month: string) {
  const first = `${month}-01`;
  const last = addDays(`${addMonths(month, 1)}-01`, -1);
  return { first, last };
}

/** Datas para campos @db.Date (meia-noite UTC). */
export function dateOnly(day: string) {
  return new Date(`${day}T00:00:00Z`);
}

export function formatMonth(month: string) {
  const s = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", month: "long", year: "numeric" }).format(dateOnly(`${month}-01`));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Valor do repasse de uma sessão para o profissional, em centavos. */
export function repasseCents(professional: Pick<Professional, "repasseTipo" | "repasseValor">, sessionPriceCents: number) {
  return professional.repasseTipo === "PERCENTUAL"
    ? Math.round((sessionPriceCents * professional.repasseValor) / 100)
    : professional.repasseValor;
}
