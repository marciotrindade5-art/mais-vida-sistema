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
  especialidades: ["ADMIN"],
  salas: ["ADMIN"],
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
  "/salas": ["ADMIN", "RECEPCAO"],
  "/salas/ocupacao": ["ADMIN", "RECEPCAO", "FINANCEIRO"],
  "/usuarios": ["ADMIN"],
  // Recepção entra no financeiro direto pelos recebimentos.
  "/financeiro": ["ADMIN", "RECEPCAO", "FINANCEIRO"],
  "/financeiro/receber": ["ADMIN", "RECEPCAO", "FINANCEIRO"],
  "/financeiro/caixa": ["ADMIN", "RECEPCAO", "FINANCEIRO"],
  "/financeiro/despesas": ["ADMIN", "FINANCEIRO"],
  "/financeiro/repasses": ["ADMIN", "FINANCEIRO"],
};

export function hasRole(role: Role, allowed: readonly Role[]) {
  return allowed.includes(role);
}
