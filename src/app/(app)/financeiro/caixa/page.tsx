import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NAV_ACCESS, onlyParticular } from "@/lib/roles";
import { formatCents } from "@/lib/format";
import { METHOD_LABELS, dateOnly } from "@/lib/finance";
import { addDays, formatDayLong, isDayKey, todayKey } from "@/lib/time";
import { Card, EmptyState, PageHeader, Table } from "@/components/ui";
import { FinanceTabs } from "../tabs";

export default async function CaixaPage({ searchParams }: { searchParams: Promise<{ data?: string }> }) {
  const session = await requireRole(...NAV_ACCESS["/financeiro/caixa"]);
  const sp = await searchParams;
  const day = isDayKey(sp.data) ? sp.data : todayKey();

  const payments = await db.payment.findMany({
    where: {
      paidAt: dateOnly(day),
      ...(onlyParticular(session.role) ? { method: { not: "CONVENIO" }, appointments: { none: { healthPlanId: { not: null } } } } : {}),
    },
    include: { patient: true, createdBy: true, _count: { select: { appointments: true } } },
    orderBy: { createdAt: "asc" },
  });
  const total = payments.reduce((s, p) => s + p.amountCents, 0);
  const byMethod = Object.entries(METHOD_LABELS)
    .map(([method, label]) => ({ label, cents: payments.filter((p) => p.method === method).reduce((s, p) => s + p.amountCents, 0) }))
    .filter((m) => m.cents > 0);

  return (
    <>
      <PageHeader
        title="Caixa do dia"
        subtitle={formatDayLong(day)}
        actions={
          <nav aria-label="Navegar entre dias" className="flex items-center gap-1 rounded-xl bg-linha p-1">
            <Link href={`/financeiro/caixa?data=${addDays(day, -1)}`} aria-label="Dia anterior" className="flex size-10 items-center justify-center rounded-lg hover:bg-white">‹</Link>
            <Link href="/financeiro/caixa" className="flex h-10 items-center rounded-lg px-3 hover:bg-white">Hoje</Link>
            <Link href={`/financeiro/caixa?data=${addDays(day, 1)}`} aria-label="Próximo dia" className="flex size-10 items-center justify-center rounded-lg hover:bg-white">›</Link>
          </nav>
        }
      />
      <FinanceTabs role={session.role} current="/financeiro/caixa" />
      <section aria-label="Totais do dia" className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4">
        <div className="flex flex-col gap-1.5 rounded-[14px] bg-verde px-5 py-4 text-creme">
          <span className="text-sm text-[#cfd3c2]">Total recebido</span>
          <span className="text-3xl font-semibold">{formatCents(total)}</span>
        </div>
        {byMethod.map((m) => (
          <div key={m.label} className="flex flex-col gap-1.5 rounded-[14px] bg-white px-5 py-4">
            <span className="text-sm text-suave">{m.label}</span>
            <span className="text-2xl font-semibold text-verde">{formatCents(m.cents)}</span>
          </div>
        ))}
      </section>
      <Card>
        {payments.length === 0 ? (
          <EmptyState>Nenhum recebimento neste dia.</EmptyState>
        ) : (
          <Table head={["Paciente", "Sessões", "Forma", "Registrado por", "Valor"]}>
            {payments.map((p) => (
              <tr key={p.id}>
                <td className="font-semibold">
                  <Link href={`/financeiro/receber/${p.patientId}`} className="text-verde hover:underline">{p.patient.name}</Link>
                </td>
                <td>{p._count.appointments}</td>
                <td>{METHOD_LABELS[p.method]}</td>
                <td>{p.createdBy?.name ?? ""}</td>
                <td className="font-semibold">{formatCents(p.amountCents)}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
