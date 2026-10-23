import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NAV_ACCESS } from "@/lib/roles";
import { formatCents } from "@/lib/format";
import { addMonths, formatMonth, isMonthKey, monthKey, repasseCents } from "@/lib/finance";
import { dayRange } from "@/lib/time";
import { Badge, Button, Card, EmptyState, PageHeader, Table } from "@/components/ui";
import { launchRepasse } from "../actions";
import { FinanceTabs } from "../tabs";

export default async function RepassesPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const session = await requireRole(...NAV_ACCESS["/financeiro/repasses"]);
  const sp = await searchParams;
  const month = isMonthKey(sp.mes) ? sp.mes : monthKey();
  const start = dayRange(`${month}-01`).start;
  const end = dayRange(`${addMonths(month, 1)}-01`).start;

  const [professionals, sessions, launched] = await Promise.all([
    db.professional.findMany({ orderBy: { name: "asc" }, include: { specialty: true } }),
    db.appointment.findMany({ where: { status: "REALIZADO", startsAt: { gte: start, lt: end } }, select: { professionalId: true, priceCents: true } }),
    db.expense.findMany({ where: { category: "REPASSE", period: month } }),
  ]);

  const rows = professionals
    .map((p) => {
      const own = sessions.filter((s) => s.professionalId === p.id);
      return {
        professional: p,
        count: own.length,
        billed: own.reduce((s, a) => s + a.priceCents, 0),
        repasse: own.reduce((s, a) => s + repasseCents(p, a.priceCents), 0),
        expense: launched.find((e) => e.professionalId === p.id),
      };
    })
    .filter((r) => r.count > 0 || r.expense);
  const totalRepasse = rows.reduce((s, r) => s + r.repasse, 0);
  const totalBilled = rows.reduce((s, r) => s + r.billed, 0);

  return (
    <>
      <PageHeader
        title="Repasses"
        subtitle={`${formatMonth(month)} · sessões realizadas`}
        actions={
          <nav aria-label="Navegar entre meses" className="flex items-center gap-1 rounded-xl bg-linha p-1">
            <Link href={`/financeiro/repasses?mes=${addMonths(month, -1)}`} aria-label="Mês anterior" className="flex size-10 items-center justify-center rounded-lg hover:bg-white">‹</Link>
            <Link href="/financeiro/repasses" className="flex h-10 items-center rounded-lg px-3 hover:bg-white">Este mês</Link>
            <Link href={`/financeiro/repasses?mes=${addMonths(month, 1)}`} aria-label="Próximo mês" className="flex size-10 items-center justify-center rounded-lg hover:bg-white">›</Link>
          </nav>
        }
      />
      <FinanceTabs role={session.role} current="/financeiro/repasses" />
      <section aria-label="Totais" className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
        <div className="flex flex-col gap-1.5 rounded-[14px] bg-white px-5 py-4">
          <span className="text-sm text-suave">Faturado em sessões</span>
          <span className="text-3xl font-semibold text-verde">{formatCents(totalBilled)}</span>
        </div>
        <div className="flex flex-col gap-1.5 rounded-[14px] bg-white px-5 py-4">
          <span className="text-sm text-suave">Total de repasses</span>
          <span className="text-3xl font-semibold text-verde">{formatCents(totalRepasse)}</span>
        </div>
        <div className="flex flex-col gap-1.5 rounded-[14px] bg-verde px-5 py-4 text-creme">
          <span className="text-sm text-[#cfd3c2]">Fica para a clínica</span>
          <span className="text-3xl font-semibold">{formatCents(totalBilled - totalRepasse)}</span>
        </div>
      </section>
      <Card>
        {rows.length === 0 ? (
          <EmptyState>Nenhuma sessão realizada neste mês.</EmptyState>
        ) : (
          <Table head={["Profissional", "Regra", "Sessões", "Faturado", "Repasse", ""]}>
            {rows.map((r) => (
              <tr key={r.professional.id}>
                <td>
                  <span className="font-semibold">{r.professional.name}</span>
                  <span className="block text-sm text-suave">{r.professional.specialty.name}</span>
                </td>
                <td>{r.professional.repasseTipo === "PERCENTUAL" ? `${r.professional.repasseValor}%` : `${formatCents(r.professional.repasseValor)} / sessão`}</td>
                <td>{r.count}</td>
                <td>{formatCents(r.billed)}</td>
                <td className="font-semibold">{formatCents(r.repasse)}</td>
                <td className="text-right">
                  {r.expense ? (
                    <Link href={`/financeiro/despesas/${r.expense.id}`}>
                      <Badge tone={r.expense.paidAt ? "ok" : "warn"}>{r.expense.paidAt ? "Pago" : `Lançado: ${formatCents(r.expense.amountCents)}`}</Badge>
                    </Link>
                  ) : (
                    r.repasse > 0 && (
                      <form action={launchRepasse}>
                        <input type="hidden" name="professionalId" value={r.professional.id} />
                        <input type="hidden" name="month" value={month} />
                        <Button type="submit" variant="secondary">Lançar como despesa</Button>
                      </form>
                    )
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
        <p className="mt-4 text-[13px] text-suave">O repasse é calculado sobre o valor de cada sessão realizada no mês, pela regra do cadastro do profissional. Ao lançar, a despesa vence no dia 5 do mês seguinte.</p>
      </Card>
    </>
  );
}
