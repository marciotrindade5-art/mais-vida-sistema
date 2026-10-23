import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NAV_ACCESS } from "@/lib/roles";
import { formatCents, formatDate } from "@/lib/format";
import { CATEGORY_LABELS, addMonths, dateOnly, formatMonth, isMonthKey, monthDays, monthKey } from "@/lib/finance";
import { todayKey } from "@/lib/time";
import { Badge, Button, Card, EmptyState, LinkButton, PageHeader, Table } from "@/components/ui";
import { markExpensePaid } from "../actions";
import { FinanceTabs } from "../tabs";

export default async function DespesasPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const session = await requireRole(...NAV_ACCESS["/financeiro/despesas"]);
  const sp = await searchParams;
  const month = isMonthKey(sp.mes) ? sp.mes : monthKey();
  const { first, last } = monthDays(month);
  const today = todayKey();

  // Do mês pelo vencimento, mais as atrasadas de meses anteriores ainda em aberto.
  const expenses = await db.expense.findMany({
    where: { OR: [{ dueDate: { gte: dateOnly(first), lte: dateOnly(last) } }, { paidAt: null, dueDate: { lt: dateOnly(first) } }] },
    orderBy: [{ paidAt: { sort: "asc", nulls: "first" } }, { dueDate: "asc" }],
  });
  const open = expenses.filter((e) => !e.paidAt);
  const paid = expenses.filter((e) => e.paidAt);
  const sum = (list: typeof expenses) => list.reduce((s, e) => s + e.amountCents, 0);

  return (
    <>
      <PageHeader
        title="Despesas"
        subtitle={formatMonth(month)}
        actions={
          <>
            <nav aria-label="Navegar entre meses" className="flex items-center gap-1 rounded-xl bg-linha p-1">
              <Link href={`/financeiro/despesas?mes=${addMonths(month, -1)}`} aria-label="Mês anterior" className="flex size-10 items-center justify-center rounded-lg hover:bg-white">‹</Link>
              <Link href="/financeiro/despesas" className="flex h-10 items-center rounded-lg px-3 hover:bg-white">Este mês</Link>
              <Link href={`/financeiro/despesas?mes=${addMonths(month, 1)}`} aria-label="Próximo mês" className="flex size-10 items-center justify-center rounded-lg hover:bg-white">›</Link>
            </nav>
            <LinkButton href="/financeiro/despesas/nova">Nova despesa</LinkButton>
          </>
        }
      />
      <FinanceTabs role={session.role} current="/financeiro/despesas" />
      <section aria-label="Totais" className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
        <div className="flex flex-col gap-1.5 rounded-[14px] bg-white px-5 py-4">
          <span className="text-sm text-suave">Em aberto</span>
          <span className="text-3xl font-semibold text-alerta">{formatCents(sum(open))}</span>
          <span className="text-[13px] text-suave">{open.length} {open.length === 1 ? "conta" : "contas"}</span>
        </div>
        <div className="flex flex-col gap-1.5 rounded-[14px] bg-white px-5 py-4">
          <span className="text-sm text-suave">Pagas</span>
          <span className="text-3xl font-semibold text-verde">{formatCents(sum(paid))}</span>
          <span className="text-[13px] text-suave">{paid.length} {paid.length === 1 ? "conta" : "contas"}</span>
        </div>
      </section>
      <Card>
        {expenses.length === 0 ? (
          <EmptyState>Nenhuma despesa neste mês.</EmptyState>
        ) : (
          <Table head={["Vencimento", "Descrição", "Categoria", "Valor", "Situação", ""]}>
            {expenses.map((e) => {
              const overdue = !e.paidAt && dateOnly(today) > e.dueDate;
              return (
                <tr key={e.id}>
                  <td className={overdue ? "font-medium text-erro" : ""}>{formatDate(e.dueDate)}</td>
                  <td><Link href={`/financeiro/despesas/${e.id}`} className="font-semibold text-verde hover:underline">{e.description}</Link></td>
                  <td>{CATEGORY_LABELS[e.category]}</td>
                  <td className="whitespace-nowrap font-semibold">{formatCents(e.amountCents)}</td>
                  <td>{e.paidAt ? <Badge tone="ok">Paga em {formatDate(e.paidAt)}</Badge> : <Badge tone="warn">{overdue ? "Atrasada" : "Em aberto"}</Badge>}</td>
                  <td className="text-right">
                    {!e.paidAt && (
                      <form action={markExpensePaid}>
                        <input type="hidden" name="id" value={e.id} />
                        <input type="hidden" name="paidAt" value={today} />
                        <Button type="submit" variant="secondary">Pagar hoje</Button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </>
  );
}
