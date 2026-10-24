import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { CAN_EDIT } from "@/lib/roles";
import { Card, PageHeader } from "@/components/ui";
import { PlanForm } from "../plan-form";

export default async function NovoPlanoPage() {
  await requireRole(...CAN_EDIT.planos);
  const specialties = await db.specialty.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  return (
    <>
      <PageHeader title="Novo plano" subtitle="Planos de saúde" />
      <Card className="max-w-3xl">
        <PlanForm specialties={specialties.map((s) => ({ id: s.id, name: s.name, color: s.color, priceCents: null }))} />
      </Card>
    </>
  );
}
