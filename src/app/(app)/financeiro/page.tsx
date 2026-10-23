import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatCents, formatDate } from "@/lib/format";
import { CATEGORY_LABELS, METHOD_LABELS, addMonths, dateOnly, formatMonth, isMonthKey, monthDays, monthKey } from "@/lib/finance";
import { Badge, Card, EmptyState, LinkButton, PageHeader, Table } from "@/components/ui";
import { FinanceTabs } from "./tabs";

export default async function FinanceiroPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const session = await requireRole("ADMIN", "RECEPCAO", "FINANCEIRO");
  if (session.role === "RECEPCAO") redirect("/financeiro/receber");

  const sp = await searchParams;
  const month = isMonthKey(sp.mes) ? sp.mes : monthKey();
  const { first, last } = monthDays(month);
  const inMonth = { gte: dateOnly(first), lte: dateOnly(last) };

  const [payments, unpaidRealized, expensesPaid, expensesOpen] = await Promise.all([
    db.payment.findMany({
      where: { paidAt: inMonth },
      include: { patient: true, appointments: { include: { specialty: true } } },
      orderBy: { paidAt: "desc" },
    }),
    db.appointment.aggregate({ where: { status: "REALIZADO", paymentId: null, priceCents: { gt: 0 } }, _sum: { priceCents: true }, _count: true }),
    db.expense.findMany({ where: { paidAt: inMonth }, orderBy: { paidAt: "desc" } }),
    db.expense.aggregate({ where: { paidAt: null, dueDate: { lte: dateOnly(last) } }, _sum: { amountCents: true }, _count: true }),
  ]);

  const received = payments.reduce((s, p) => s + p.amountCents, 0);
  const spent = expensesPaid.reduce((s, e) => s + e.amountCents, 0);

  // Distribui cada recebimento entre as especialidades das sessões que ele quitou,
  // proporcionalmente ao valor de cada sessão (descontos se repartem igualmente).
  const bySpecialty = new Map<string, { name: string; color: string; cents: number }>();
  for (const p of payments) {
    const total = p.appointments.reduce((s, a) => s + a.priceCents, 0);
    let allocated = 0;
    p.appointments.forEach((a, i) => {
      const isLast = i === p.appointments.length - 1;
      // A última sessão leva o resto, para a soma bater exatamente com o recebido.
      const share = isLast
        ? p.amountCents - allocated
        : total > 0
          ? Math.floor((p.amountCents * a.priceCents) / total)
          : Math.floor(p.amountCents / p.appointments.length);
      allocated += share;
      const cur = bySpecialty.get(a.specialtyId) ?? { name: a.specialty.name, color: a.specialty.color, cents: 0 };
      cur.cents += share;
      bySpecialty.set(a.specialtyId, cur);
    });
  }
  const specialtyRows = [...bySpecialty.values()].sort((a, b) => b.cents - a.cents);
  const maxSpecialty = specialtyRows[0]?.cents ?? 0;

  const entries = [
    ...payments.map((p) => ({
      key: `p${p.id}`,
      date: p.paidAt,
      description: `${p.appointments.length > 1 ? `${p.appointments.length} sessões` : "Sessão"} · ${p.patient.name}`,
      method: METHOD_LABELS[p.method],
      cents: p.amountCents,
    })),
    ...expensesPaid.map((e) => ({
      key: `e${e.id}`,
      date: e.paidAt!,
      description: `${e.description} (${CATEGORY_LABELS[e.category]})`,
      method: "",
      cents: -e.amountCents,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10);

  return (
    <>
      <PageHeader
        title="Financeiro"
        subtitle={formatMonth(month)}
        actions={
          <>
            <nav aria-label="Navegar entre meses" className="flex items-center gap-1 rounded-xl bg-linha p-1">
              <Link href={`/financeiro?mes=${addMonths(month, -1)}`} aria-label="Mês anterior" className="flex size-10 items-center justify-center rounded-lg hover:bg-white">‹</Link>
              <Link href="/financeiro" className="flex h-10 items-center rounded-lg px-3 hover:bg-white">Este mês</Link>
              <Link href={`/financeiro?mes=${addMonths(month, 1)}`} aria-label="Próximo mês" className="flex size-10 items-center justify-center rounded-lg hover:bg-white">›</Link>
            </nav>
            <LinkButton href="/financeiro/despesas/nova" variant="secondary">Nova despesa</LinkButton>
            <LinkButton href="/financeiro/receber">Registrar recebimento</LinkButton>
          </>
        }
      />
      <FinanceTabs role={session.role} current="/financeiro" />

      <section aria-label="Resumo do mês" className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
        <div className="flex flex-col gap-1.5 rounded-[14px] bg-verde px-5 py-4 text-creme">
          <span className="text-sm text-[#cfd3c2]">Recebido no mês</span>
          <span className="text-3xl font-semibold">{formatCents(received)}</span>
          <span className="text-[13px] text-[#cfd3c2]">{payments.length} {payments.length === 1 ? "recebimento" : "recebimentos"}</span>
        </div>
        <Link href="/financeiro/receber" className="flex flex-col gap-1.5 rounded-[14px] bg-white px-5 py-4 hover:outline-2 hover:outline-salvia">
          <span className="text-sm text-suave">A receber</span>
          <span className="text-3xl font-semibold text-verde">{formatCents(unpaidRealized._sum.priceCents ?? 0)}</span>
          <span className="text-[13px] text-suave">{unpaidRealized._count} {unpaidRealized._count === 1 ? "sessão realizada" : "sessões realizadas"} sem pagamento</span>
        </Link>
        <Link href={`/financeiro/despesas?mes=${month}`} className="flex flex-col gap-1.5 rounded-[14px] bg-white px-5 py-4 hover:outline-2 hover:outline-salvia">
          <span className="text-sm text-suave">Despesas pagas</span>
          <span className="text-3xl font-semibold text-verde">{formatCents(spent)}</span>
          <span className="text-[13px] text-suave">
            {expensesOpen._count > 0 ? `${formatCents(expensesOpen._sum.amountCents ?? 0)} em aberto até o fim do mês` : "nada em aberto até o fim do mês"}
          </span>
        </Link>
        <div className="flex flex-col gap-1.5 rounded-[14px] bg-white px-5 py-4">
          <span className="text-sm text-suave">Saldo do mês</span>
          <span className={`text-3xl font-semibold ${received - spent < 0 ? "text-erro" : "text-verde"}`}>{formatCents(received - spent)}</span>
          <span className="text-[13px] text-suave">recebido menos despesas pagas</span>
        </div>
      </section>

      <div className="flex flex-wrap items-start gap-6">
        <Card className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
          <h2 className="text-lg font-semibold text-verde">Receita por especialidade</h2>
          {specialtyRows.length === 0 ? (
            <EmptyState>Nenhum recebimento neste mês.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-3.5">
              {specialtyRows.map((r) => (
                <li key={r.name} className="flex flex-col gap-1.5">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="inline-flex items-center gap-2"><span aria-hidden className="size-2.5 rounded-full" style={{ background: r.color }} />{r.name}</span>
                    <span className="font-semibold">{formatCents(r.cents)}</span>
                  </div>
                  <div aria-hidden className="h-2.5 rounded-full bg-creme">
                    <div className="h-2.5 rounded-full bg-verde" style={{ width: `${maxSpecialty ? Math.max((r.cents / maxSpecialty) * 100, 2) : 0}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="flex min-w-0 flex-[2_1_480px] flex-col gap-4">
          <h2 className="text-lg font-semibold text-verde">Lançamentos do mês</h2>
          {entries.length === 0 ? (
            <EmptyState>Nenhum lançamento neste mês.</EmptyState>
          ) : (
            <Table head={["Data", "Descrição", "Forma", "Valor"]}>
              {entries.map((e) => (
                <tr key={e.key}>
                  <td>{formatDate(e.date)}</td>
                  <td>{e.description}</td>
                  <td>{e.method ? e.method : <Badge>Despesa</Badge>}</td>
                  <td className={`whitespace-nowrap font-semibold ${e.cents < 0 ? "text-erro" : ""}`}>
                    {e.cents < 0 ? `− ${formatCents(-e.cents)}` : formatCents(e.cents)}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
