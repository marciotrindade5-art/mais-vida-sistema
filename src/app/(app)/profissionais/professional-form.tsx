"use client";

import { useState } from "react";
import type { Professional, RepasseTipo, Specialty } from "@prisma/client";
import { CheckboxField, Field, FormError, LinkButton, SelectField } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { useFormAction } from "@/lib/use-form-action";
import { centsToInput } from "@/lib/format";
import { saveProfessional } from "./actions";

export function ProfessionalForm({ professional, specialties }: { professional?: Professional; specialties: Pick<Specialty, "id" | "name">[] }) {
  const { state, onSubmit, pending } = useFormAction(saveProfessional.bind(null, professional?.id ?? null));
  const [tipo, setTipo] = useState<RepasseTipo>(professional?.repasseTipo ?? "PERCENTUAL");
  const e = state?.fieldErrors ?? {};
  const valorInicial = professional
    ? professional.repasseTipo === "PERCENTUAL"
      ? String(professional.repasseValor)
      : centsToInput(professional.repasseValor)
    : "";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <FormError message={state?.error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" name="name" defaultValue={professional?.name} error={e.name} required className="sm:col-span-2" />
        <SelectField label="Especialidade" name="specialtyId" defaultValue={professional?.specialtyId ?? ""} error={e.specialtyId} required>
          <option value="" disabled>Escolha...</option>
          {specialties.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </SelectField>
        <Field label="Registro no conselho" name="registration" defaultValue={professional?.registration ?? ""} placeholder="CRP, CRFa, CREFITO, CRN..." />
        <Field label="Telefone" name="phone" type="tel" defaultValue={professional?.phone ?? ""} />
        <Field label="E-mail" name="email" type="email" defaultValue={professional?.email ?? ""} error={e.email} />
        <SelectField label="Tipo de repasse" name="repasseTipo" value={tipo} onChange={(ev) => setTipo(ev.target.value as RepasseTipo)}>
          <option value="PERCENTUAL">Percentual do valor da sessão</option>
          <option value="FIXO_POR_SESSAO">Valor fixo por sessão</option>
        </SelectField>
        <Field
          key={tipo}
          label={tipo === "PERCENTUAL" ? "Repasse (%)" : "Repasse por sessão (R$)"}
          name="repasseValor"
          inputMode="decimal"
          defaultValue={tipo === professional?.repasseTipo ? valorInicial : ""}
          placeholder={tipo === "PERCENTUAL" ? "Ex.: 60" : "0,00"}
          error={e.repasseValor}
          required
        />
      </div>
      {professional && <CheckboxField label="Profissional ativo" name="active" defaultChecked={professional.active} />}
      <div className="flex flex-wrap gap-3">
        <SubmitButton pending={pending}>Salvar</SubmitButton>
        <LinkButton href="/profissionais" variant="ghost">Cancelar</LinkButton>
      </div>
    </form>
  );
}
