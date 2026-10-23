"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import type { FormState } from "./form";

/**
 * Envia o formulário para a server action sem o reset automático do React 19,
 * que apagaria o que o usuário digitou quando a validação falha.
 */
export function useFormAction(action: (prev: FormState, formData: FormData) => Promise<FormState>) {
  const [state, dispatch, pending] = useActionState(action, undefined);
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  }
  return { state, onSubmit, pending };
}
