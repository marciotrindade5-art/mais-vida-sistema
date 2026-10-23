import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { CAN_EDIT } from "@/lib/roles";
import { Card, PageHeader } from "@/components/ui";
import { UserForm } from "../user-form";

export default async function EditarUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(...CAN_EDIT.usuarios);
  const { id } = await params;
  const [user, professionals] = await Promise.all([
    db.user.findUnique({ where: { id } }),
    db.professional.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!user) notFound();
  return (
    <>
      <PageHeader title={user.name} subtitle="Editar usuário" />
      <Card className="max-w-3xl"><UserForm user={user} professionals={professionals} /></Card>
    </>
  );
}
