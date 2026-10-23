import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { db } from "./db";
import { SESSION_COOKIE, verifySession } from "./session";

export async function getSession() {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Garante que o usuário logado tem um dos perfis; senão volta ao início. */
export async function requireRole(...roles: Role[]) {
  const session = await requireSession();
  if (!roles.includes(session.role)) redirect("/");
  return session;
}

/** Profissional vinculado ao usuário logado (perfil Profissional). */
export async function currentProfessionalId(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { professionalId: true } });
  return user?.professionalId ?? null;
}
