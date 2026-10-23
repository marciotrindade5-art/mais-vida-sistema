"use client";

import { useState } from "react";
import type { Professional, Role, User } from "@prisma/client";
import { CheckboxField, Field, FormError, LinkButton, SelectField } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { useFormAction } from "@/lib/use-form-action";
import { ROLE_LABELS } from "@/lib/roles";
import { saveUser } from "./actions";

export function UserForm({ user, professionals }: { user?: User; professionals: Pick<Professional, "id" | "name">[] }) {
  const { state, onSubmit, pending } = useFormAction(saveUser.bind(null, user?.id ?? null));
  const [role, setRole] = useState<Role | "">(user?.role ?? "");
  const e = state?.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <FormError message={state?.error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" name="name" defaultValue={user?.name} error={e.name} required />
        <Field label="E-mail de acesso" name="email" type="email" defaultValue={user?.email} error={e.email} required />
        <SelectField label="Perfil" name="role" value={role} onChange={(ev) => setRole(ev.target.value as Role)} error={e.role} required>
          <option value="" disabled>Escolha...</option>
          {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </SelectField>
        {role === "PROFISSIONAL" && (
          <SelectField label="Profissional vinculado" name="professionalId" defaultValue={user?.professionalId ?? ""} error={e.professionalId} required>
            <option value="" disabled>Escolha...</option>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </SelectField>
        )}
        <Field
          label={user ? "Nova senha" : "Senha inicial"}
          name="password"
          type="password"
          autoComplete="new-password"
          error={e.password}
          hint={user ? "Deixe em branco para manter a senha atual" : "Mínimo de 8 caracteres"}
          required={!user}
        />
      </div>
      {user && <CheckboxField label="Usuário ativo" name="active" defaultChecked={user.active} />}
      <div className="flex flex-wrap gap-3">
        <SubmitButton pending={pending}>Salvar</SubmitButton>
        <LinkButton href="/usuarios" variant="ghost">Cancelar</LinkButton>
      </div>
    </form>
  );
}
