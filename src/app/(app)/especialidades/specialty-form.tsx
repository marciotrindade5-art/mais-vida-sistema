"use client";

import type { Specialty } from "@prisma/client";
import { CheckboxField, Field, FormError, LinkButton } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { useFormAction } from "@/lib/use-form-action";
import { centsToInput } from "@/lib/format";
import { saveSpecialty } from "./actions";

export function SpecialtyForm({ specialty }: { specialty?: Specialty }) {
  const { state, onSubmit, pending } = useFormAction(saveSpecialty.bind(null, specialty?.id ?? null));
  const e = state?.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <FormError message={state?.error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" name="name" defaultValue={specialty?.name} error={e.name} required className="sm:col-span-2" />
        <Field label="Duração padrão (minutos)" name="defaultMinutes" type="number" min={10} step={5} defaultValue={specialty?.defaultMinutes ?? 50} error={e.defaultMinutes} required />
        <Field label="Valor da sessão particular (R$)" name="defaultPrice" inputMode="decimal" defaultValue={specialty ? centsToInput(specialty.defaultPriceCents) : ""} placeholder="0,00" error={e.defaultPrice} />
        <Field label="Cor na agenda" name="color" type="color" defaultValue={specialty?.color ?? "#939b72"} error={e.color} className="[&_input]:p-1" />
      </div>
      {specialty && <CheckboxField label="Especialidade ativa" name="active" defaultChecked={specialty.active} />}
      <div className="flex flex-wrap gap-3">
        <SubmitButton pending={pending}>Salvar</SubmitButton>
        <LinkButton href="/especialidades" variant="ghost">Cancelar</LinkButton>
      </div>
    </form>
  );
}
