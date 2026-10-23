import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NAV_ACCESS } from "@/lib/roles";
import { formatCents } from "@/lib/format";
import { Card, EmptyState, PageHeader, Table } from "@/components/ui";
import { FinanceTabs } from "../tabs";

export default async function ReceberPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await requireRole(...NAV_ACCESS["/financeiro/receber"]);
  const { q = "" } = await searchParams;

  const open = await db.appointment.findMany({
    where: {
      paymentId: null,
      status: "REALIZADO",
      priceCents: { gt: 0 },
      ...(q ? { patient: { name: { contains: q, mode: "insensitive" } } } : {}),
    },
    select: { patientId: true, priceCents: true, startsAt: true, patient: { select: { name: true } } },
    orderBy: { startsAt: "asc" },
  });

  const byPatient = new Map<string, { name: string; count: number; cents: number; oldest: Date }>();
  for (const a of open) {
    const cur = byPatient.get(a.patientId) ?? { name: a.patient.name, count: 0, cents: 0, oldest: a.startsAt };
    cur.count += 1;
    cur.cents += a.priceCents;
    byPatient.set(a.patientId, cur);
  }
  const rows = [...byPatient.entries()].sort((a, b) => b[1].cents - a[1].cents);
  const total = rows.reduce((s, [, r]) => s + r.cents, 0);
  const days = (d: Date) => Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000));

  return (
    <>
      <PageHeader title="A receber" subtitle={`${formatCents(total)} em sessões realizadas sem pagamento`} />
      <FinanceTabs role={session.role} current="/financeiro/receber" />
      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <form role="search">
            <label htmlFor="q" className="sr-only">Buscar paciente</label>
            <input id="q" name="q" type="search" defaultValue={q} placeholder="Buscar paciente" className="h-11 w-72 max-w-full rounded-[10px] border border-[#c9cbbe] px-3.5" />
          </form>
          <p className="text-sm text-suave">Para receber adiantado (pacote), abra o paciente e marque as próximas sessões.</p>
        </div>
        {rows.length === 0 ? (
          <EmptyState>{q ? "Nenhum paciente com sessões em aberto com esse nome." : "Nenhuma sessão realizada em aberto."}</EmptyState>
        ) : (
          <Table head={["Paciente", "Sessões em aberto", "Valor", "Mais antiga", ""]}>
            {rows.map(([patientId, r]) => (
              <tr key={patientId}>
                <td className="font-semibold">{r.name}</td>
                <td>{r.count}</td>
                <td className="font-semibold">{formatCents(r.cents)}</td>
                <td className={days(r.oldest) > 30 ? "font-medium text-erro" : ""}>
                  {days(r.oldest) === 0 ? "hoje" : `há ${days(r.oldest)} ${days(r.oldest) === 1 ? "dia" : "dias"}`}
                </td>
                <td className="text-right">
                  <Link href={`/financeiro/receber/${patientId}`} className="inline-flex min-h-11 items-center rounded-[10px] border border-verde px-4 font-semibold text-verde hover:bg-creme">
                    Receber
                  </Link>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      <PatientPicker />
    </>
  );
}

async function PatientPicker() {
  const patients = await db.patient.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } });
  if (patients.length === 0) return null;
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-verde">Receber de outro paciente</h2>
      <form action="/financeiro/receber/ir" className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Paciente</span>
          <select name="paciente" required defaultValue="" className="h-11 w-80 max-w-full rounded-[10px] border border-[#c9cbbe] bg-white px-3">
            <option value="" disabled>Escolha...</option>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <button type="submit" className="inline-flex min-h-11 items-center rounded-[10px] bg-verde px-5 font-semibold text-creme hover:bg-verde-escuro">Abrir</button>
      </form>
    </Card>
  );
}
