"use client";

import type { Unit } from "@prisma/client";
import { CheckboxField, Field, FormError, LinkButton } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { useFormAction } from "@/lib/use-form-action";
import { saveUnit } from "./actions";

export function UnitForm({ unit }: { unit?: Unit }) {
  const { state, onSubmit, pending } = useFormAction(saveUnit.bind(null, unit?.id ?? null));
  const e = state?.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <FormError message={state?.error} />
      <Field label="Nome" name="name" defaultValue={unit?.name} error={e.name} placeholder="Ex.: Vila" required />
      {unit && <CheckboxField label="Unidade ativa" name="active" defaultChecked={unit.active} />}
      <div className="flex flex-wrap gap-3">
        <SubmitButton pending={pending}>Salvar</SubmitButton>
        <LinkButton href="/unidades" variant="ghost">Cancelar</LinkButton>
      </div>
    </form>
  );
}
