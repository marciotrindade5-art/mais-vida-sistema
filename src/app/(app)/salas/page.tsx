import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { CAN_EDIT, NAV_ACCESS, hasRole } from "@/lib/roles";
import { Badge, Card, EmptyState, LinkButton, PageHeader, Table } from "@/components/ui";

export default async function SalasPage() {
  const session = await requireRole(...NAV_ACCESS["/salas"]);
  const canEdit = hasRole(session.role, CAN_EDIT.salas);
  const rooms = await db.room.findMany({ orderBy: [{ unit: { name: "asc" } }, { name: "asc" }], include: { unit: true } });

  return (
    <>
      <PageHeader title="Salas" subtitle={`${rooms.length} cadastradas`} actions={canEdit && <LinkButton href="/salas/novo">Nova sala</LinkButton>} />
      <Card>
        {rooms.length === 0 ? (
          <EmptyState>Nenhuma sala cadastrada ainda.</EmptyState>
        ) : (
          <Table head={["Sala", "Unidade", "Descrição", "Situação"]}>
            {rooms.map((r) => (
              <tr key={r.id}>
                <td>
                  {canEdit ? <Link href={`/salas/${r.id}`} className="font-semibold text-verde hover:underline">{r.name}</Link> : <span className="font-semibold">{r.name}</span>}
                </td>
                <td>{r.unit.name}</td>
                <td>{r.description ?? ""}</td>
                <td><Badge tone={r.active ? "ok" : "neutral"}>{r.active ? "Ativa" : "Inativa"}</Badge></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
