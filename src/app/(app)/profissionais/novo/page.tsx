import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { CAN_EDIT } from "@/lib/roles";
import { Card, PageHeader } from "@/components/ui";
import { ProfessionalForm } from "../professional-form";

export default async function NovoProfissionalPage() {
  await requireRole(...CAN_EDIT.profissionais);
  const specialties = await db.specialty.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } });
  return (
    <>
      <PageHeader title="Novo profissional" subtitle="Profissionais" />
      <Card className="max-w-3xl"><ProfessionalForm specialties={specialties} /></Card>
    </>
  );
}
