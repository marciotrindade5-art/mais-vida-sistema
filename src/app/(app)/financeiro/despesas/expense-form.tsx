"use client";

import type { Expense } from "@prisma/client";
import { Field, FormError, LinkButton, SelectField, TextareaField } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { useFormAction } from "@/lib/use-form-action";
import { centsToInput, dateToInput } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/finance";
import { saveExpense } from "../actions";

export function ExpenseForm({ expense, today }: { expense?: Expense; today: string }) {
  const { state, onSubmit, pending } = useFormAction(saveExpense.bind(null, expense?.id ?? null));
  const e = state?.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <FormError message={state?.error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Descrição" name="description" defaultValue={expense?.description} error={e.description} required className="sm:col-span-2" />
        <SelectField label="Categoria" name="category" defaultValue={expense?.category ?? ""} error={e.category} required>
          <option value="" disabled>Escolha...</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </SelectField>
        <Field label="Valor (R$)" name="amount" inputMode="decimal" defaultValue={expense ? centsToInput(expense.amountCents) : ""} placeholder="0,00" error={e.amount} required />
        <Field label="Vencimento" name="dueDate" type="date" defaultValue={expense ? dateToInput(expense.dueDate) : today} error={e.dueDate} required />
        <Field label="Pago em" name="paidAt" type="date" defaultValue={dateToInput(expense?.paidAt)} error={e.paidAt} hint="Deixe em branco se ainda não foi paga" />
        <TextareaField label="Observações" name="notes" defaultValue={expense?.notes ?? ""} className="sm:col-span-2" />
      </div>
      <div className="flex flex-wrap gap-3">
        <SubmitButton pending={pending}>Salvar</SubmitButton>
        <LinkButton href="/financeiro/despesas" variant="ghost">Cancelar</LinkButton>
      </div>
    </form>
  );
}
