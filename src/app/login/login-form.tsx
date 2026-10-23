"use client";

import { Field, FormError } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { useFormAction } from "@/lib/use-form-action";
import { login } from "./actions";

export function LoginForm() {
  const { state, onSubmit, pending } = useFormAction(login);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormError message={state?.error} />
      <Field label="E-mail" name="email" type="email" autoComplete="username" required />
      <Field label="Senha" name="password" type="password" autoComplete="current-password" required />
      <SubmitButton pending={pending} pendingText="Entrando...">Entrar</SubmitButton>
    </form>
  );
}
