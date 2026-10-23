const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatCents(cents: number) {
  return brl.format(cents / 100);
}

/** "180,50" ou "180.50" ou "R$ 1.200,00" -> centavos */
export function parseMoneyToCents(value: string): number {
  const clean = value.replace(/[^\d,.-]/g, "");
  if (!clean) return 0;
  const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
  const n = Number(normalized);
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
}

export function centsToInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function formatDate(d: Date | null | undefined) {
  if (!d) return "";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(d);
}

export function dateToInput(d: Date | null | undefined) {
  return d ? d.toISOString().slice(0, 10) : "";
}

export function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}
