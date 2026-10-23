"use client";

import { useState } from "react";
import { Field, FormError, SelectField, TextareaField } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { useFormAction } from "@/lib/use-form-action";
import { centsToInput, formatCents } from "@/lib/format";
import { METHOD_LABELS } from "@/lib/finance";
import { registerPayment } from "../../actions";

type Session = { id: string; label: string; detail: string; priceCents: number; realized: boolean };

export function PaymentForm({ patientId, sessions, today }: { patientId: string; sessions: Session[]; today: string }) {
  const { state, onSubmit, pending } = useFormAction(registerPayment.bind(null, patientId));
  const e = state?.fieldErrors ?? {};
  const [checked, setChecked] = useState<Set<string>>(() => new Set(sessions.filter((s) => s.realized).map((s) => s.id)));
  const total = sessions.filter((s) => checked.has(s.id)).reduce((s, x) => s + x.priceCents, 0);
  const [amount, setAmount] = useState<string | null>(null); // null = acompanha o total marcado

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const realized = sessions.filter((s) => s.realized);
  const upcoming = sessions.filter((s) => !s.realized);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <FormError message={state?.error} />
      {[
        { title: "Sessões realizadas em aberto", items: realized },
        { title: "Sessões ainda não realizadas (pagamento adiantado)", items: upcoming },
      ].map(
        (group) =>
          group.items.length > 0 && (
            <fieldset key={group.title} className="flex flex-col gap-1">
              <legend className="mb-2 text-sm font-medium">{group.title}</legend>
              {group.items.map((s) => (
                <label key={s.id} className="flex min-h-11 items-center gap-3 rounded-lg px-2 hover:bg-creme">
                  <input type="checkbox" name="appointmentIds" value={s.id} checked={checked.has(s.id)} onChange={() => toggle(s.id)} className="size-5 accent-verde" />
                  <span className="flex-1">
                    <span className="font-medium">{s.label}</span> <span className="text-sm text-suave">{s.detail}</span>
                  </span>
                  <span className="font-semibold">{formatCents(s.priceCents)}</span>
                </label>
              ))}
            </fieldset>
          ),
      )}
      <div className="flex items-center justify-between rounded-xl bg-creme px-4 py-3">
        <span>{checked.size} {checked.size === 1 ? "sessão marcada" : "sessões marcadas"}</span>
        <span className="text-lg font-semibold text-verde">{formatCents(total)}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField label="Forma de pagamento" name="method" defaultValue="" error={e.method} required>
          <option value="" disabled>Escolha...</option>
          {Object.entries(METHOD_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </SelectField>
        <Field label="Data do pagamento" name="paidAt" type="date" defaultValue={today} max={today} error={e.paidAt} required />
        <Field
          label="Valor recebido (R$)"
          name="amount"
          inputMode="decimal"
          value={amount ?? centsToInput(total)}
          onChange={(ev) => setAmount(ev.target.value)}
          error={e.amount}
          hint="Altere se houve desconto"
          required
        />
        <TextareaField label="Observações" name="notes" className="sm:col-span-3" />
      </div>
      <div>
        <SubmitButton pending={pending} pendingText="Registrando...">Registrar recebimento</SubmitButton>
      </div>
    </form>
  );
}
