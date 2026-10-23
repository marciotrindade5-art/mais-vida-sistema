import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { CAN_EDIT } from "@/lib/roles";
import { Card, PageHeader } from "@/components/ui";
import { SpecialtyForm } from "../specialty-form";

export default async function EditarEspecialidadePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(...CAN_EDIT.especialidades);
  const { id } = await params;
  const specialty = await db.specialty.findUnique({ where: { id } });
  if (!specialty) notFound();
  return (
    <>
      <PageHeader title={specialty.name} subtitle="Editar especialidade" />
      <Card className="max-w-2xl"><SpecialtyForm specialty={specialty} /></Card>
    </>
  );
}
