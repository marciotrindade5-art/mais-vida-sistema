import { notFound } from "next/navigation";
import type { AppointmentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { currentProfessionalId, requireRole } from "@/lib/auth";
import { CAN_EDIT, NAV_ACCESS, hasRole } from "@/lib/roles";
import { STATUS_LABELS } from "@/lib/agenda";
import { formatCents } from "@/lib/format";
import { dayKey, formatDayLong, formatTime, minutesOfDay } from "@/lib/time";
import { Badge, Button, Card, LinkButton, PageHeader } from "@/components/ui";
import { AppointmentForm } from "../appointment-form";
import { appointmentOptions } from "../options";
import { setAppointmentStatus } from "../actions";

const TONE: Record<AppointmentStatus, "ok" | "neutral" | "warn"> = {
  AGENDADO: "warn",
  CONFIRMADO: "ok",
  REALIZADO: "ok",
  FALTA: "neutral",
  CANCELADO: "neutral",
};

function StatusButton({ id, status, label, variant = "secondary", scope }: { id: string; status: AppointmentStatus; label: string; variant?: "primary" | "secondary" | "ghost"; scope?: "following" }) {
  return (
    <form action={setAppointmentStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      {scope && <input type="hidden" name="scope" value={scope} />}
      <Button type="submit" variant={variant}>{label}</Button>
    </form>
  );
}

export default async function AgendamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(...NAV_ACCESS["/agenda"]);
  const { id } = await params;
  const a = await db.appointment.findUnique({ where: { id }, include: { patient: true, professional: true, specialty: true, room: true } });
  if (!a) notFound();

  const canEdit = hasRole(session.role, CAN_EDIT.agenda);
  const isOwn = session.role === "PROFISSIONAL" && (await currentProfessionalId(session.userId)) === a.professionalId;
  if (session.role === "PROFISSIONAL" && !isOwn) notFound();

  const day = dayKey(a.startsAt);
  const open = a.status === "AGENDADO" || a.status === "CONFIRMADO";
  const seriesCount = a.seriesId
    ? await db.appointment.count({ where: { seriesId: a.seriesId, startsAt: { gte: a.startsAt }, status: { in: ["AGENDADO", "CONFIRMADO"] } } })
    : 0;
  const options = canEdit && open ? await appointmentOptions(a) : null;
  const time = minutesOfDay(a.startsAt);

  return (
    <>
      <PageHeader
        title={a.patient.name}
        subtitle={`${formatDayLong(day)} · ${formatTime(a.startsAt)} às ${formatTime(a.endsAt)}`}
        actions={<LinkButton href={`/agenda?data=${day}`} variant="ghost">Voltar para a agenda</LinkButton>}
      />
      <Card className="flex max-w-3xl flex-col gap-5">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div><dt className="text-sm text-suave">Situação</dt><dd className="mt-1"><Badge tone={TONE[a.status]}>{STATUS_LABELS[a.status]}</Badge></dd></div>
          <div><dt className="text-sm text-suave">Profissional</dt><dd className="mt-1 font-medium">{a.professional.name} · {a.specialty.name}</dd></div>
          <div><dt className="text-sm text-suave">Sala</dt><dd className="mt-1 font-medium">{a.room.name}</dd></div>
          {hasRole(session.role, ["ADMIN", "RECEPCAO", "FINANCEIRO"]) && (
            <div><dt className="text-sm text-suave">Valor</dt><dd className="mt-1 font-medium">{formatCents(a.priceCents)}</dd></div>
          )}
          {a.seriesId && (
            <div>
              <dt className="text-sm text-suave">Recorrência</dt>
              <dd className="mt-1 font-medium">Sessão semanal{open ? ` (${seriesCount} em aberto a partir desta)` : ""}</dd>
            </div>
          )}
          {a.notes && <div className="sm:col-span-2"><dt className="text-sm text-suave">Observações</dt><dd className="mt-1 whitespace-pre-line">{a.notes}</dd></div>}
        </dl>
        {open && (canEdit || isOwn) && (
          <div className="flex flex-wrap gap-3 border-t border-linha pt-5">
            {canEdit && a.status === "AGENDADO" && <StatusButton id={a.id} status="CONFIRMADO" label="Confirmar presença" variant="primary" />}
            <StatusButton id={a.id} status="REALIZADO" label="Marcar como realizada" variant={a.status === "CONFIRMADO" ? "primary" : "secondary"} />
            <StatusButton id={a.id} status="FALTA" label="Registrar falta" />
            {canEdit && <StatusButton id={a.id} status="CANCELADO" label="Cancelar sessão" variant="ghost" />}
            {canEdit && seriesCount > 1 && <StatusButton id={a.id} status="CANCELADO" scope="following" label={`Cancelar esta e as próximas (${seriesCount})`} variant="ghost" />}
          </div>
        )}
      </Card>

      {options && (
        <Card className="max-w-3xl">
          <h2 className="mb-4 text-lg font-semibold text-verde">Remarcar ou alterar</h2>
          <AppointmentForm
            id={a.id}
            {...options}
            defaults={{
              patientId: a.patientId,
              professionalId: a.professionalId,
              roomId: a.roomId,
              date: day,
              time: `${String(Math.floor(time / 60)).padStart(2, "0")}:${String(time % 60).padStart(2, "0")}`,
              duration: Math.round((a.endsAt.getTime() - a.startsAt.getTime()) / 60_000),
              priceCents: a.priceCents,
              notes: a.notes,
            }}
          />
        </Card>
      )}
    </>
  );
}
