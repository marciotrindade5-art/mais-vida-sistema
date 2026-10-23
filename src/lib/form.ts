import type { z } from "zod";

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
} | undefined;

/** Lê campos de texto do FormData; vazio vira undefined. */
export function formObject(formData: FormData) {
  const out: Record<string, string | undefined> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    out[key] = trimmed === "" ? undefined : trimmed;
  }
  return out;
}

export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

export function isUniqueViolation(e: unknown) {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002";
}
