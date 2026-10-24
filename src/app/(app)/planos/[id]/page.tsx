import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { CAN_EDIT } from "@/lib/roles";
import { Card, PageHeader } from "@/components/ui";
import { PlanForm } from "../plan-form";

export default async function EditarPlanoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(...CAN_EDIT.planos);
  const { id } = await params;
  const [plan, specialties] = await Promise.all([
    db.healthPlan.findUnique({ where: { id }, include: { prices: true } }),
    db.specialty.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!plan) notFound();
  // Especialidades inativas só aparecem se o plano já tiver valor para elas.
  const rows = specialties
    .map((s) => ({ id: s.id, name: s.name, color: s.color, active: s.active, priceCents: plan.prices.find((p) => p.specialtyId === s.id)?.priceCents ?? null }))
    .filter((s) => s.active || s.priceCents != null);
  return (
    <>
      <PageHeader title={plan.name} subtitle="Editar plano" />
      <Card className="max-w-3xl"><PlanForm plan={plan} specialties={rows} /></Card>
    </>
  );
}
