import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { CAN_EDIT, NAV_ACCESS, hasRole } from "@/lib/roles";
import { formatCents, formatDate } from "@/lib/format";
import { METHOD_LABELS } from "@/lib/finance";
import { addDays, dayKey, dayRange, formatDayShort, formatTime, todayKey } from "@/lib/time";
import { Card, EmptyState, LinkButton, PageHeader, Table } from "@/components/ui";
import { ConfirmButton } from "@/components/confirm-button";
import { deletePayment } from "../../actions";
import { PaymentForm } from "./payment-form";

const ADVANCE_DAYS = 60;

export default async function ReceberPacientePage({ params, searchParams }: { params: Promise<{ patientId: string }>; searchParams: Promise<{ ok?: string }> }) {
  const session = await requireRole(...NAV_ACCESS["/financeiro/receber"]);
  const { patientId } = await params;
  const { ok } = await searchParams;
  const patient = await db.patient.findUnique({ where: { id: patientId } });
  if (!patient) notFound();

  const today = todayKey();
  const limit = dayRange(addDays(today, ADVANCE_DAYS)).end;
  const [sessions, payments] = await Promise.all([
    db.appointment.findMany({
      where: {
        patientId,
        paymentId: null,
        priceCents: { gt: 0 },
        OR: [{ status: "REALIZADO" }, { status: { in: ["AGENDADO", "CONFIRMADO"] }, startsAt: { lte: limit } }],
      },
      include: { professional: true, specialty: true },
      orderBy: { startsAt: "asc" },
    }),
    db.payment.findMany({ where: { patientId }, include: { _count: { select: { appointments: true } } }, orderBy: { paidAt: "desc" }, take: 10 }),
  ]);
  const canDelete = hasRole(session.role, CAN_EDIT.despesas);

  return (
    <>
      <PageHeader title={patient.name} subtitle="Registrar recebimento" actions={<LinkButton href="/financeiro/receber" variant="ghost">Voltar</LinkButton>} />
      {ok && <p role="status" className="max-w-3xl rounded-[10px] bg-[#e4eee4] px-4 py-3 text-[#2d5738]">Recebimento registrado.</p>}
      <Card className="max-w-3xl">
        {sessions.length === 0 ? (
          <EmptyState>Nenhuma sessão em aberto para este paciente.</EmptyState>
        ) : (
          <PaymentForm
            key={sessions.map((s) => s.id).join()}
            patientId={patient.id}
            today={today}
            sessions={sessions.map((s) => ({
              id: s.id,
              realized: s.status === "REALIZADO",
              label: `${formatDayShort(dayKey(s.startsAt))} às ${formatTime(s.startsAt)}`,
              detail: `${s.specialty.name} · ${s.professional.name}`,
              priceCents: s.priceCents,
            }))}
          />
        )}
      </Card>
      <Card className="flex max-w-3xl flex-col gap-4">
        <h2 className="text-lg font-semibold text-verde">Últimos recebimentos</h2>
        {payments.length === 0 ? (
          <EmptyState>Nenhum recebimento registrado.</EmptyState>
        ) : (
          <Table head={["Data", "Forma", "Sessões", "Valor", ...(canDelete ? [""] : [])]}>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{formatDate(p.paidAt)}</td>
                <td>{METHOD_LABELS[p.method]}</td>
                <td>{p._count.appointments}</td>
                <td className="font-semibold">{formatCents(p.amountCents)}</td>
                {canDelete && (
                  <td className="text-right">
                    <form action={deletePayment}>
                      <input type="hidden" name="id" value={p.id} />
                      <ConfirmButton message="Estornar este recebimento? As sessões voltam a ficar em aberto.">Estornar</ConfirmButton>
                    </form>
                  </td>
                )}
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
