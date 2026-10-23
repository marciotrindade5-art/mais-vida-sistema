import { requireRole } from "@/lib/auth";
import { CAN_EDIT } from "@/lib/roles";
import { isDayKey, todayKey } from "@/lib/time";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { AppointmentForm } from "../appointment-form";
import { appointmentOptions } from "../options";

export default async function NovoAgendamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string; sala?: string; hora?: string; paciente?: string }>;
}) {
  await requireRole(...CAN_EDIT.agenda);
  const sp = await searchParams;
  const options = await appointmentOptions();
  const missing = [
    options.patients.length === 0 && "pacientes",
    options.professionals.length === 0 && "profissionais",
    options.rooms.length === 0 && "salas",
  ].filter(Boolean);

  return (
    <>
      <PageHeader title="Novo agendamento" subtitle="Agenda" />
      <Card className="max-w-3xl">
        {missing.length > 0 ? (
          <EmptyState>Antes de agendar, cadastre {missing.join(" e ")}.</EmptyState>
        ) : (
          <AppointmentForm
            {...options}
            defaults={{
              date: isDayKey(sp.data) ? sp.data : todayKey(),
              time: sp.hora && /^\d{2}:\d{2}$/.test(sp.hora) ? sp.hora : undefined,
              roomId: sp.sala,
              patientId: sp.paciente,
            }}
          />
        )}
      </Card>
    </>
  );
}
