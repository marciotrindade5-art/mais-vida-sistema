"use client";

import { useState } from "react";
import { CheckboxField, Field, FormError, LinkButton, SelectField, TextareaField } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { useFormAction } from "@/lib/use-form-action";
import { centsToInput } from "@/lib/format";
import { saveAppointment } from "./actions";

type Option = { id: string; name: string };
type ProfessionalOption = Option & { specialtyName: string; defaultMinutes: number };
type RoomOption = Option & { unitId: string; unitName: string };

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

const DURATIONS = [30, 40, 45, 50, 60, 90, 120, 180];

function durationLabel(min: number) {
  if (min < 60) return `${min} minutos`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h${m ? String(m).padStart(2, "0") : ""}`;
}

export function AppointmentForm({
  id,
  defaults,
  patients,
  professionals,
  rooms,
  canSetPrice,
  joinSession,
}: {
  id?: string;
  defaults: AppointmentDefaults;
  patients: Option[];
  professionals: ProfessionalOption[];
  rooms: RoomOption[];
  canSetPrice: boolean;
  /** Veio de "adicionar segundo paciente" numa sessão já marcada. */
  joinSession?: boolean;
}) {
  const { state, onSubmit, pending } = useFormAction(saveAppointment.bind(null, id ?? null));
  const e = state?.fieldErrors ?? {};

  const initialProfessional = professionals.find((p) => p.id === defaults.professionalId);
  const [duration, setDuration] = useState(String(defaults.duration ?? initialProfessional?.defaultMinutes ?? 50));
  const [date, setDate] = useState(defaults.date);
  const [repeat, setRepeat] = useState<"none" | "weekly">("none");
  const [dupla, setDupla] = useState(!!joinSession);
  const startWeekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  const durations = DURATIONS.includes(Number(duration)) ? DURATIONS : [...DURATIONS, Number(duration)].sort((a, b) => a - b);

  const units = [...new Map(rooms.map((r) => [r.unitId, r.unitName])).entries()];

  function onProfessionalChange(professionalId: string) {
    const p = professionals.find((x) => x.id === professionalId);
    if (p) setDuration(String(p.defaultMinutes));
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
        {!id && (
          <div className="flex flex-col gap-2 sm:col-span-2">
            <CheckboxField label="Atendimento em dupla (2 pacientes juntos)" name="dupla" checked={dupla} onChange={(ev) => setDupla(ev.target.checked)} />
            {dupla && joinSession && (
              <p className="text-sm text-suave">O paciente escolhido entra no atendimento que já está marcado neste horário.</p>
            )}
            {dupla && !joinSession && (
              <SelectField label="Segundo paciente" name="patientId2" defaultValue="" error={e.patientId2} hint="Deixe em branco para juntar a um atendimento já marcado neste horário">
                <option value="" disabled>Escolha...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </SelectField>
            )}
          </div>
        )}
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
          {units.map(([unitId, unitName]) => (
            <optgroup key={unitId} label={unitName}>
              {rooms.filter((r) => r.unitId === unitId).map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </optgroup>
          ))}
        </SelectField>
        <Field label="Data" name="date" type="date" value={date} onChange={(ev) => setDate(ev.target.value)} error={e.date} required />
        <Field label="Horário" name="time" type="time" step={300} defaultValue={defaults.time ?? ""} error={e.time} required />
        <SelectField label="Duração" name="duration" value={duration} onChange={(ev) => setDuration(ev.target.value)} error={e.duration} required>
          {durations.map((m) => (
            <option key={m} value={m}>{durationLabel(m)}</option>
          ))}
        </SelectField>
        {canSetPrice && (
          <Field
            label="Valor da sessão (R$)"
            name="price"
            inputMode="decimal"
            defaultValue={defaults.priceCents != null ? centsToInput(defaults.priceCents) : ""}
            placeholder="Pela tabela"
            hint="Em branco, usa a tabela do plano ou o valor particular"
            error={e.price}
          />
        )}
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
