import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NAV_ACCESS } from "@/lib/roles";
import { formatCents } from "@/lib/format";
import { Badge, Card, EmptyState, LinkButton, PageHeader, Table } from "@/components/ui";

export default async function EspecialidadesPage() {
  await requireRole(...NAV_ACCESS["/especialidades"]);
  const specialties = await db.specialty.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { professionals: true } } } });

  return (
    <>
      <PageHeader title="Especialidades" subtitle={`${specialties.length} cadastradas`} actions={<LinkButton href="/especialidades/novo">Nova especialidade</LinkButton>} />
      <Card>
        {specialties.length === 0 ? (
          <EmptyState>Nenhuma especialidade cadastrada ainda.</EmptyState>
        ) : (
          <Table head={["Especialidade", "Duração", "Valor particular", "Profissionais", "Situação"]}>
            {specialties.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link href={`/especialidades/${s.id}`} className="inline-flex items-center gap-2.5 font-semibold text-verde hover:underline">
                    <span aria-hidden className="size-3 rounded-full" style={{ background: s.color }} />
                    {s.name}
                  </Link>
                </td>
                <td>{s.defaultMinutes} min</td>
                <td>{formatCents(s.defaultPriceCents)}</td>
                <td>{s._count.professionals}</td>
                <td><Badge tone={s.active ? "ok" : "neutral"}>{s.active ? "Ativa" : "Inativa"}</Badge></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
