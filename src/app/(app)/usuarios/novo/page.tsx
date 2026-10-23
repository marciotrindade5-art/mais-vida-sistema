import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { CAN_EDIT } from "@/lib/roles";
import { Card, PageHeader } from "@/components/ui";
import { UserForm } from "../user-form";

export default async function NovoUsuarioPage() {
  await requireRole(...CAN_EDIT.usuarios);
  const professionals = await db.professional.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } });
  return (
    <>
      <PageHeader title="Novo usuário" subtitle="Usuários" />
      <Card className="max-w-3xl"><UserForm professionals={professionals} /></Card>
    </>
  );
}
