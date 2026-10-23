"use client";

import type { Patient } from "@prisma/client";
import { CheckboxField, Field, FormError, LinkButton, TextareaField } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { useFormAction } from "@/lib/use-form-action";
import { dateToInput } from "@/lib/format";
import { savePatient } from "./actions";

export function PatientForm({ patient }: { patient?: Patient }) {
  const { state, onSubmit, pending } = useFormAction(savePatient.bind(null, patient?.id ?? null));
  const e = state?.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <FormError message={state?.error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome completo" name="name" defaultValue={patient?.name} error={e.name} required className="sm:col-span-2" />
        <Field label="Data de nascimento" name="birthDate" type="date" defaultValue={dateToInput(patient?.birthDate)} error={e.birthDate} />
        <Field label="CPF" name="cpf" inputMode="numeric" defaultValue={patient?.cpf ?? ""} error={e.cpf} />
        <Field label="Telefone" name="phone" type="tel" defaultValue={patient?.phone ?? ""} error={e.phone} />
        <Field label="E-mail" name="email" type="email" defaultValue={patient?.email ?? ""} error={e.email} />
        <Field label="Responsável" name="guardianName" defaultValue={patient?.guardianName ?? ""} hint="Para pacientes menores de idade" />
        <Field label="Telefone do responsável" name="guardianPhone" type="tel" defaultValue={patient?.guardianPhone ?? ""} />
        <TextareaField label="Observações" name="notes" defaultValue={patient?.notes ?? ""} className="sm:col-span-2" />
        {patient && <CheckboxField label="Paciente ativo" name="active" defaultChecked={patient.active} />}
      </div>
      <div className="flex flex-wrap gap-3">
        <SubmitButton pending={pending}>Salvar</SubmitButton>
        <LinkButton href="/pacientes" variant="ghost">Cancelar</LinkButton>
      </div>
    </form>
  );
}
