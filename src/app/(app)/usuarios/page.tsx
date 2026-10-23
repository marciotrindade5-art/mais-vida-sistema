import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NAV_ACCESS, ROLE_LABELS } from "@/lib/roles";
import { Badge, Card, LinkButton, PageHeader, Table } from "@/components/ui";

export default async function UsuariosPage() {
  await requireRole(...NAV_ACCESS["/usuarios"]);
  const users = await db.user.findMany({ orderBy: { name: "asc" }, include: { professional: true } });

  return (
    <>
      <PageHeader title="Usuários" subtitle="Quem acessa o sistema" actions={<LinkButton href="/usuarios/novo">Novo usuário</LinkButton>} />
      <Card>
        <Table head={["Nome", "E-mail", "Perfil", "Situação"]}>
          {users.map((u) => (
            <tr key={u.id}>
              <td><Link href={`/usuarios/${u.id}`} className="font-semibold text-verde hover:underline">{u.name}</Link></td>
              <td>{u.email}</td>
              <td>{ROLE_LABELS[u.role]}{u.professional ? ` · ${u.professional.name}` : ""}</td>
              <td><Badge tone={u.active ? "ok" : "neutral"}>{u.active ? "Ativo" : "Inativo"}</Badge></td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
