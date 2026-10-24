import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { CAN_EDIT } from "@/lib/roles";
import { Card, PageHeader } from "@/components/ui";
import { UnitForm } from "../unit-form";

export default async function EditarUnidadePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(...CAN_EDIT.unidades);
  const { id } = await params;
  const unit = await db.unit.findUnique({ where: { id } });
  if (!unit) notFound();
  return (
    <>
      <PageHeader title={unit.name} subtitle="Editar unidade" />
      <Card className="max-w-2xl"><UnitForm unit={unit} /></Card>
    </>
  );
}
