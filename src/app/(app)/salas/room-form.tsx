"use client";

import type { Room } from "@prisma/client";
import { CheckboxField, Field, FormError, LinkButton, SelectField } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { useFormAction } from "@/lib/use-form-action";
import { saveRoom } from "./actions";

export function RoomForm({ room, units }: { room?: Room; units: { id: string; name: string }[] }) {
  const { state, onSubmit, pending } = useFormAction(saveRoom.bind(null, room?.id ?? null));
  const e = state?.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <FormError message={state?.error} />
      <Field label="Nome" name="name" defaultValue={room?.name} error={e.name} placeholder="Ex.: Sala 3 · Sensorial" required />
      <SelectField label="Unidade" name="unitId" defaultValue={room?.unitId ?? (units.length === 1 ? units[0].id : "")} error={e.unitId} required>
        <option value="" disabled>Escolha...</option>
        {units.map((u) => (
          <option key={u.id} value={u.id}>{u.name}</option>
        ))}
      </SelectField>
      <Field label="Descrição" name="description" defaultValue={room?.description ?? ""} hint="Equipamentos, uso preferencial, observações" />
      {room && <CheckboxField label="Sala ativa" name="active" defaultChecked={room.active} />}
      <div className="flex flex-wrap gap-3">
        <SubmitButton pending={pending}>Salvar</SubmitButton>
        <LinkButton href="/salas" variant="ghost">Cancelar</LinkButton>
      </div>
    </form>
  );
}
