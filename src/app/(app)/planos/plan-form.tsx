"use client";

import type { HealthPlan } from "@prisma/client";
import { CheckboxField, Field, FormError, LinkButton } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { useFormAction } from "@/lib/use-form-action";
import { centsToInput } from "@/lib/format";
import { saveHealthPlan } from "./actions";

type SpecialtyPrice = { id: string; name: string; color: string; priceCents: number | null };

export function PlanForm({ plan, specialties }: { plan?: HealthPlan; specialties: SpecialtyPrice[] }) {
  const { state, onSubmit, pending } = useFormAction(saveHealthPlan.bind(null, plan?.id ?? null));
  const e = state?.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <FormError message={state?.error} />
      <Field label="Nome do plano" name="name" defaultValue={plan?.name} error={e.name} placeholder="Ex.: Unimed" required />
      <fieldset className="flex flex-col gap-3 rounded-xl border border-linha p-4">
        <legend className="px-1 text-sm font-medium">Valor pago por sessão</legend>
        <p className="text-sm text-suave">Só o administrador e o financeiro veem estes valores. Deixe em branco a especialidade que o plano não cobre.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {specialties.map((s) => (
            <Field
              key={s.id}
              label={s.name}
              name={`price_${s.id}`}
              inputMode="decimal"
              placeholder="Não cobre"
              defaultValue={s.priceCents != null ? centsToInput(s.priceCents) : ""}
              error={e[`price_${s.id}`]}
            />
          ))}
        </div>
      </fieldset>
      {plan && <CheckboxField label="Plano ativo" name="active" defaultChecked={plan.active} />}
      <div className="flex flex-wrap gap-3">
        <SubmitButton pending={pending}>Salvar</SubmitButton>
        <LinkButton href="/planos" variant="ghost">Cancelar</LinkButton>
      </div>
    </form>
  );
}
