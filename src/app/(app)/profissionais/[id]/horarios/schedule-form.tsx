"use client";

import { useRef } from "react";
import { CheckboxField, Field, FormError, SelectField } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { useFormAction } from "@/lib/use-form-action";
import { addScheduleBlock } from "./actions";

const WEEKDAYS = [
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

export function ScheduleForm({
  professionalId,
  rooms,
}: {
  professionalId: string;
  rooms: { id: string; name: string; unitId: string; unitName: string }[];
}) {
  const { state, onSubmit, pending } = useFormAction(addScheduleBlock.bind(null, professionalId));
  const e = state?.fieldErrors ?? {};
  const formRef = useRef<HTMLFormElement>(null);
  const units = [...new Map(rooms.map((r) => [r.unitId, r.unitName])).entries()];

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormError message={state?.error} />
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Dias da semana</span>
        <div className="flex flex-wrap gap-x-4">
          {WEEKDAYS.map((w) => (
            <CheckboxField key={w.value} label={w.label} name="weekdays" value={w.value} />
          ))}
        </div>
        {e.weekdays && <span className="text-sm text-erro">{e.weekdays}</span>}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Das" name="start" type="time" step={300} defaultValue="08:00" error={e.start} required />
        <Field label="Até" name="end" type="time" step={300} defaultValue="12:00" error={e.end} required />
        <SelectField label="Sala" name="roomId" defaultValue="" error={e.roomId} required>
          <option value="" disabled>Escolha...</option>
          {units.map(([unitId, unitName]) => (
            <optgroup key={unitId} label={unitName}>
              {rooms.filter((r) => r.unitId === unitId).map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </optgroup>
          ))}
        </SelectField>
      </div>
      <div>
        <SubmitButton pending={pending}>Adicionar horário</SubmitButton>
      </div>
    </form>
  );
}
