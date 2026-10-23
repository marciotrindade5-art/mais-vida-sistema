import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { CAN_EDIT, NAV_ACCESS, hasRole } from "@/lib/roles";
import { formatCents } from "@/lib/format";
import { Badge, Card, EmptyState, LinkButton, PageHeader, Table } from "@/components/ui";

export default async function ProfissionaisPage() {
  const session = await requireRole(...NAV_ACCESS["/profissionais"]);
  const canEdit = hasRole(session.role, CAN_EDIT.profissionais);
  const showRepasse = hasRole(session.role, ["ADMIN", "FINANCEIRO"]);
  const professionals = await db.professional.findMany({ orderBy: { name: "asc" }, include: { specialty: true } });

  return (
    <>
      <PageHeader
        title="Profissionais"
        subtitle={`${professionals.length} cadastrados`}
        actions={canEdit && <LinkButton href="/profissionais/novo">Novo profissional</LinkButton>}
      />
      <Card>
        {professionals.length === 0 ? (
          <EmptyState>Nenhum profissional cadastrado ainda.</EmptyState>
        ) : (
          <Table head={["Nome", "Especialidade", "Registro", "Telefone", ...(showRepasse ? ["Repasse"] : []), "Situação"]}>
            {professionals.map((p) => (
              <tr key={p.id}>
                <td>
                  {canEdit ? <Link href={`/profissionais/${p.id}`} className="font-semibold text-verde hover:underline">{p.name}</Link> : <span className="font-semibold">{p.name}</span>}
                </td>
                <td>
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden className="size-2.5 rounded-full" style={{ background: p.specialty.color }} />
                    {p.specialty.name}
                  </span>
                </td>
                <td>{p.registration ?? ""}</td>
                <td>{p.phone ?? ""}</td>
                {showRepasse && <td>{p.repasseTipo === "PERCENTUAL" ? `${p.repasseValor}%` : `${formatCents(p.repasseValor)} / sessão`}</td>}
                <td><Badge tone={p.active ? "ok" : "neutral"}>{p.active ? "Ativo" : "Inativo"}</Badge></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
