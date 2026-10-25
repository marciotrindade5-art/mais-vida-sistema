"use client";

import type { Patient } from "@prisma/client";
import { useState } from "react";
import { CheckboxField, Field, FormError, LinkButton, SelectField, TextareaField } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { useFormAction } from "@/lib/use-form-action";
import { dateToInput } from "@/lib/format";
import { savePatient } from "./actions";

type Option = { id: string; name: string };

export function PatientForm({
  patient,
  plans,
  specialties,
}: {
  patient?: Patient & { specialties: { id: string }[] };
  plans: Option[];
  specialties: Option[];
}) {
  const { state, onSubmit, pending } = useFormAction(savePatient.bind(null, patient?.id ?? null));
  const e = state?.fieldErrors ?? {};
  const [planId, setPlanId] = useState(patient?.healthPlanId ?? "");
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
        <SelectField label="Atendimento" name="healthPlanId" value={planId} onChange={(ev) => setPlanId(ev.target.value)} error={e.healthPlanId}>
          <option value="">Particular</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </SelectField>
        <Field
          label="Número da carteirinha"
          name="cardNumber"
          inputMode="numeric"
          defaultValue={patient?.cardNumber ?? ""}
          error={e.cardNumber}
          required={!!planId}
          hint={planId ? undefined : "Obrigatório para pacientes de plano"}
        />
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 font-medium">Paciente TEA?</legend>
          <div className="flex gap-6">
            <label className="flex min-h-11 items-center gap-2">
              <input type="radio" name="tea" value="sim" defaultChecked={patient?.tea === true} className="size-5 accent-verde" />
              Sim
            </label>
            <label className="flex min-h-11 items-center gap-2">
              <input type="radio" name="tea" value="nao" defaultChecked={!patient?.tea} className="size-5 accent-verde" />
              Não
            </label>
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-1 sm:col-span-2">
          <legend className="mb-1 font-medium">Especialidades que faz</legend>
          <div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
            {specialties.map((sp) => (
              <CheckboxField
                key={sp.id}
                label={sp.name}
                name="specialtyIds"
                value={sp.id}
                defaultChecked={patient?.specialties.some((x) => x.id === sp.id)}
              />
            ))}
          </div>
        </fieldset>
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
