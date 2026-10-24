import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NAV_ACCESS } from "@/lib/roles";
import { Badge, Card, EmptyState, LinkButton, PageHeader, Table } from "@/components/ui";

export default async function UnidadesPage() {
  await requireRole(...NAV_ACCESS["/unidades"]);
  const units = await db.unit.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { rooms: true } } } });

  return (
    <>
      <PageHeader title="Unidades" subtitle={`${units.length} cadastradas`} actions={<LinkButton href="/unidades/novo">Nova unidade</LinkButton>} />
      <Card>
        {units.length === 0 ? (
          <EmptyState>Nenhuma unidade cadastrada ainda.</EmptyState>
        ) : (
          <Table head={["Unidade", "Salas", "Situação"]}>
            {units.map((u) => (
              <tr key={u.id}>
                <td><Link href={`/unidades/${u.id}`} className="font-semibold text-verde hover:underline">{u.name}</Link></td>
                <td>{u._count.rooms}</td>
                <td><Badge tone={u.active ? "ok" : "neutral"}>{u.active ? "Ativa" : "Inativa"}</Badge></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
