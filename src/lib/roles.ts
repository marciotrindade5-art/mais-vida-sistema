import type { Role } from "@prisma/client";

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  RECEPCAO: "Recepção",
  PROFISSIONAL: "Profissional",
  FINANCEIRO: "Financeiro",
};

/** Quem pode editar cada cadastro. */
export const CAN_EDIT = {
  pacientes: ["ADMIN", "RECEPCAO"],
  profissionais: ["ADMIN"],
  // Grade semanal de horários de cada profissional
  grade: ["ADMIN", "RECEPCAO"],
  especialidades: ["ADMIN"],
  salas: ["ADMIN"],
  unidades: ["ADMIN"],
  planos: ["ADMIN", "FINANCEIRO"],
  usuarios: ["ADMIN"],
  agenda: ["ADMIN", "RECEPCAO"],
  recebimentos: ["ADMIN", "RECEPCAO", "FINANCEIRO"],
  despesas: ["ADMIN", "FINANCEIRO"],
} satisfies Record<string, Role[]>;

/** Quem vê cada item do menu. */
export const NAV_ACCESS: Record<string, Role[]> = {
  "/": ["ADMIN", "RECEPCAO", "PROFISSIONAL", "FINANCEIRO"],
  "/agenda": ["ADMIN", "RECEPCAO", "PROFISSIONAL", "FINANCEIRO"],
  "/pacientes": ["ADMIN", "RECEPCAO", "PROFISSIONAL"],
  "/profissionais": ["ADMIN", "RECEPCAO", "FINANCEIRO"],
  "/especialidades": ["ADMIN"],
  "/agenda/livres": ["ADMIN", "RECEPCAO", "FINANCEIRO"],
  "/agenda/mapa": ["ADMIN", "RECEPCAO", "FINANCEIRO"],
  "/salas": ["ADMIN", "RECEPCAO"],
  "/unidades": ["ADMIN"],
  "/planos": ["ADMIN", "FINANCEIRO"],
  "/salas/ocupacao": ["ADMIN", "RECEPCAO", "FINANCEIRO"],
  "/usuarios": ["ADMIN"],
  // Recepção entra no financeiro direto pelos recebimentos.
  "/financeiro": ["ADMIN", "RECEPCAO", "FINANCEIRO"],
  "/financeiro/receber": ["ADMIN", "RECEPCAO", "FINANCEIRO"],
  "/financeiro/caixa": ["ADMIN", "RECEPCAO", "FINANCEIRO"],
  "/financeiro/despesas": ["ADMIN", "FINANCEIRO"],
  "/financeiro/repasses": ["ADMIN", "FINANCEIRO"],
};

/**
 * Quem vê valores de sessão, preços dos planos e repasses.
 * A recepção só vê o valor das sessões particulares, na hora de receber.
 */
export const SEE_PRICES: Role[] = ["ADMIN", "FINANCEIRO"];

/** A recepção só lida com sessões particulares no financeiro; as de plano ficam com o administrador e o financeiro. */
export function onlyParticular(role: Role) {
  return !SEE_PRICES.includes(role);
}

export function hasRole(role: Role, allowed: readonly Role[]) {
  return allowed.includes(role);
}
