import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { CAN_EDIT } from "@/lib/roles";
import { WEEKDAY_NAMES, minutesToTime } from "@/lib/time";
import { Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { ConfirmButton } from "@/components/confirm-button";
import { ScheduleForm } from "./schedule-form";
import { removeScheduleBlock } from "./actions";

export default async function HorariosProfissionalPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(...CAN_EDIT.grade);
  const { id } = await params;
  const [professional, rooms] = await Promise.all([
    db.professional.findUnique({
      where: { id },
      include: {
        specialty: true,
        schedules: { include: { room: { include: { unit: true } } }, orderBy: [{ weekday: "asc" }, { startMinute: "asc" }] },
      },
    }),
    db.room.findMany({ where: { active: true }, orderBy: [{ unit: { name: "asc" } }, { name: "asc" }], include: { unit: true } }),
  ]);
  if (!professional) notFound();

  const byDay = [1, 2, 3, 4, 5, 6, 0]
    .map((wd) => ({ wd, blocks: professional.schedules.filter((s) => s.weekday === wd) }))
    .filter((d) => d.blocks.length > 0);
  const weeklyMinutes = professional.schedules.reduce((s, b) => s + b.endMinute - b.startMinute, 0);

  return (
    <>
      <PageHeader
        title={professional.name}
        subtitle={`Horários de atendimento · ${professional.specialty.name}`}
        actions={<LinkButton href="/profissionais" variant="ghost">Voltar</LinkButton>}
      />
      <Card className="flex max-w-3xl flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-verde">Semana do profissional</h2>
          {weeklyMinutes > 0 && <span className="text-sm text-suave">{Math.round((weeklyMinutes / 60) * 10) / 10} h por semana</span>}
        </div>
        {byDay.length === 0 ? (
          <EmptyState>Nenhum horário cadastrado. Adicione abaixo os dias e horários em que este profissional atende.</EmptyState>
        ) : (
          <ul className="flex flex-col divide-y divide-linha">
            {byDay.map((d) => (
              <li key={d.wd} className="flex flex-wrap items-start gap-x-6 gap-y-2 py-3">
                <span className="w-24 font-semibold">{WEEKDAY_NAMES[d.wd]}</span>
                <ul className="flex flex-1 flex-col gap-2">
                  {d.blocks.map((b) => (
                    <li key={b.id} className="flex flex-wrap items-center justify-between gap-3">
                      <span>
                        <span className="font-medium">{minutesToTime(b.startMinute)} às {minutesToTime(b.endMinute)}</span>
                        <span className="text-suave"> · {b.room.name} · {b.room.unit.name}</span>
                      </span>
                      <form action={removeScheduleBlock}>
                        <input type="hidden" name="id" value={b.id} />
                        <ConfirmButton message="Remover este horário da grade?">Remover</ConfirmButton>
                      </form>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card className="max-w-3xl">
        <h2 className="mb-4 text-lg font-semibold text-verde">Adicionar horário</h2>
        {rooms.length === 0 ? (
          <EmptyState>Cadastre as salas antes de montar a grade.</EmptyState>
        ) : (
          <ScheduleForm professionalId={professional.id} rooms={rooms.map((r) => ({ id: r.id, name: r.name, unitId: r.unitId, unitName: r.unit.name }))} />
        )}
      </Card>
    </>
  );
}
