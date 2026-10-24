import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NAV_ACCESS } from "@/lib/roles";
import { formatCents } from "@/lib/format";
import { Badge, Card, EmptyState, LinkButton, PageHeader, Table } from "@/components/ui";

export default async function PlanosPage() {
  await requireRole(...NAV_ACCESS["/planos"]);
  const [plans, specialties] = await Promise.all([
    db.healthPlan.findMany({ orderBy: { name: "asc" }, include: { prices: true, _count: { select: { patients: true } } } }),
    db.specialty.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <PageHeader title="Planos de saúde" subtitle={`${plans.length} cadastrados`} actions={<LinkButton href="/planos/novo">Novo plano</LinkButton>} />
      <Card className="flex flex-col gap-4">
        <p className="text-sm text-suave">
          Pacientes sem plano são atendidos como <strong>particular</strong>, pelo valor definido em cada especialidade.
        </p>
        {plans.length === 0 ? (
          <EmptyState>Nenhum plano cadastrado ainda.</EmptyState>
        ) : (
          <Table head={["Plano", "Pacientes", ...specialties.map((s) => s.name), "Situação"]}>
            {plans.map((p) => (
              <tr key={p.id}>
                <td><Link href={`/planos/${p.id}`} className="font-semibold text-verde hover:underline">{p.name}</Link></td>
                <td>{p._count.patients}</td>
                {specialties.map((s) => {
                  const price = p.prices.find((x) => x.specialtyId === s.id);
                  return <td key={s.id} className="whitespace-nowrap">{price ? formatCents(price.priceCents) : <span className="text-suave">não cobre</span>}</td>;
                })}
                <td><Badge tone={p.active ? "ok" : "neutral"}>{p.active ? "Ativo" : "Inativo"}</Badge></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
