"use client";

import { useState } from "react";
import { CheckboxField, Field, FormError, LinkButton, SelectField, TextareaField } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { useFormAction } from "@/lib/use-form-action";
import { centsToInput } from "@/lib/format";
import { saveAppointment } from "./actions";

type Option = { id: string; name: string };
type ProfessionalOption = Option & { specialtyName: string; defaultMinutes: number; defaultPriceCents: number };

export type AppointmentDefaults = {
  patientId?: string;
  professionalId?: string;
  roomId?: string;
  date: string;
  time?: string;
  duration?: number;
  priceCents?: number;
  notes?: string | null;
};

const WEEKDAYS = [
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

export function AppointmentForm({
  id,
  defaults,
  patients,
  professionals,
  rooms,
}: {
  id?: string;
  defaults: AppointmentDefaults;
  patients: Option[];
  professionals: ProfessionalOption[];
  rooms: Option[];
}) {
  const { state, onSubmit, pending } = useFormAction(saveAppointment.bind(null, id ?? null));
  const e = state?.fieldErrors ?? {};

  const initialProfessional = professionals.find((p) => p.id === defaults.professionalId);
  const [duration, setDuration] = useState(String(defaults.duration ?? initialProfessional?.defaultMinutes ?? 50));
  const [price, setPrice] = useState(
    defaults.priceCents != null ? centsToInput(defaults.priceCents) : initialProfessional ? centsToInput(initialProfessional.defaultPriceCents) : "",
  );
  const [date, setDate] = useState(defaults.date);
  const [repeat, setRepeat] = useState<"none" | "weekly">("none");
  const startWeekday = new Date(`${date}T12:00:00Z`).getUTCDay();

  function onProfessionalChange(professionalId: string) {
    const p = professionals.find((x) => x.id === professionalId);
    if (!p) return;
    setDuration(String(p.defaultMinutes));
    setPrice(centsToInput(p.defaultPriceCents));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <FormError message={state?.error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Paciente" name="patientId" defaultValue={defaults.patientId ?? ""} error={e.patientId} required className="sm:col-span-2">
          <option value="" disabled>Escolha...</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </SelectField>
        <SelectField
          label="Profissional"
          name="professionalId"
          defaultValue={defaults.professionalId ?? ""}
          onChange={(ev) => onProfessionalChange(ev.target.value)}
          error={e.professionalId}
          required
        >
          <option value="" disabled>Escolha...</option>
          {professionals.map((p) => (
            <option key={p.id} value={p.id}>{p.name} · {p.specialtyName}</option>
          ))}
        </SelectField>
        <SelectField label="Sala" name="roomId" defaultValue={defaults.roomId ?? ""} error={e.roomId} required>
          <option value="" disabled>Escolha...</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </SelectField>
        <Field label="Data" name="date" type="date" value={date} onChange={(ev) => setDate(ev.target.value)} error={e.date} required />
        <Field label="Horário" name="time" type="time" step={300} defaultValue={defaults.time ?? ""} error={e.time} required />
        <Field label="Duração (minutos)" name="duration" type="number" min={10} step={5} value={duration} onChange={(ev) => setDuration(ev.target.value)} error={e.duration} required />
        <Field label="Valor da sessão (R$)" name="price" inputMode="decimal" value={price} onChange={(ev) => setPrice(ev.target.value)} placeholder="0,00" error={e.price} />
        <TextareaField label="Observações" name="notes" defaultValue={defaults.notes ?? ""} className="sm:col-span-2" />
      </div>

      {!id && (
        <fieldset className="flex flex-col gap-3 rounded-xl border border-linha p-4">
          <legend className="px-1 text-sm font-medium">Repetição</legend>
          <div className="flex flex-wrap gap-x-6">
            <label className="flex min-h-11 items-center gap-2">
              <input type="radio" name="repeat" value="none" checked={repeat === "none"} onChange={() => setRepeat("none")} className="size-5 accent-verde" />
              Sessão única
            </label>
            <label className="flex min-h-11 items-center gap-2">
              <input type="radio" name="repeat" value="weekly" checked={repeat === "weekly"} onChange={() => setRepeat("weekly")} className="size-5 accent-verde" />
              Toda semana
            </label>
          </div>
          {repeat === "weekly" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Dias da semana</span>
                <div className="flex flex-wrap gap-x-4" key={startWeekday}>
                  {WEEKDAYS.map((w) => (
                    <CheckboxField key={w.value} label={w.label} name="weekdays" value={w.value} defaultChecked={w.value === startWeekday} />
                  ))}
                </div>
                {e.weekdays && <span className="text-sm text-erro">{e.weekdays}</span>}
              </div>
              <Field label="Repetir até" name="until" type="date" min={date} error={e.until} required className="max-w-xs" hint="Máximo de 1 ano" />
            </div>
          )}
        </fieldset>
      )}

      <div className="flex flex-wrap gap-3">
        <SubmitButton pending={pending}>{id ? "Salvar alterações" : "Agendar"}</SubmitButton>
        <LinkButton href={`/agenda?data=${date}`} variant="ghost">Cancelar</LinkButton>
      </div>
    </form>
  );
}
