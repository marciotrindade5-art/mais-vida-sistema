"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { FormState } from "@/lib/form";
import { SESSION_COOKIE, sessionMaxAgeSeconds, signSession } from "@/lib/session";

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Informe e-mail e senha." };

  const user = await db.user.findUnique({ where: { email } });
  const ok = user && user.active && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) return { error: "E-mail ou senha incorretos." };

  const token = await signSession({ userId: user.id, name: user.name, role: user.role });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAgeSeconds,
  });
  redirect("/");
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
