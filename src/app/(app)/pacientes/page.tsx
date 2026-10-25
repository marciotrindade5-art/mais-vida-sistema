import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { CAN_EDIT, NAV_ACCESS, hasRole } from "@/lib/roles";
import { formatDate } from "@/lib/format";
import { Badge, Card, EmptyState, LinkButton, PageHeader, Table } from "@/components/ui";

export default async function PacientesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await requireRole(...NAV_ACCESS["/pacientes"]);
  const { q = "" } = await searchParams;
  const canEdit = hasRole(session.role, CAN_EDIT.pacientes);

  const where: Prisma.PatientWhereInput = q
    ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { cpf: { contains: q.replace(/\D/g, "") || q } }, { cardNumber: { contains: q } }] }
    : {};
  const patients = await db.patient.findMany({ where, orderBy: { name: "asc" }, take: 200, include: { healthPlan: true, specialties: { select: { name: true }, orderBy: { name: "asc" } } } });

  return (
    <>
      <PageHeader
        title="Pacientes"
        subtitle={`${patients.length} ${patients.length === 1 ? "paciente" : "pacientes"}`}
        actions={canEdit && <LinkButton href="/pacientes/novo">Novo paciente</LinkButton>}
      />
      <Card className="flex flex-col gap-4">
        <form role="search" className="flex flex-wrap gap-3">
          <label htmlFor="q" className="sr-only">Buscar por nome, CPF ou carteirinha</label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Buscar por nome, CPF ou carteirinha"
            className="h-11 w-full max-w-sm rounded-[10px] border border-[#c9cbbe] px-3.5"
          />
        </form>
        {patients.length === 0 ? (
          <EmptyState>{q ? "Nenhum paciente encontrado." : "Nenhum paciente cadastrado ainda."}</EmptyState>
        ) : (
          <Table head={["Nome", "Nascimento", "Telefone", "Atendimento", "Especialidades", "Responsável", "Situação"]}>
            {patients.map((p) => (
              <tr key={p.id}>
                <td>
                  {canEdit ? (
                    <Link href={`/pacientes/${p.id}`} className="font-semibold text-verde hover:underline">{p.name}</Link>
                  ) : (
                    <span className="font-semibold">{p.name}</span>
                  )}
                  {p.tea && <span className="ml-2"><Badge tone="warn">TEA</Badge></span>}
                </td>
                <td>{formatDate(p.birthDate)}</td>
                <td>{p.phone ?? p.guardianPhone ?? ""}</td>
                <td>{p.healthPlan ? `${p.healthPlan.name}${p.cardNumber ? ` · ${p.cardNumber}` : ""}` : "Particular"}</td>
                <td>{p.specialties.map((s) => s.name).join(", ")}</td>
                <td>{p.guardianName ?? ""}</td>
                <td><Badge tone={p.active ? "ok" : "neutral"}>{p.active ? "Ativo" : "Inativo"}</Badge></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
