import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { CAN_EDIT } from "@/lib/roles";
import { Card, LinkButton, PageHeader } from "@/components/ui";
import { ProfessionalForm } from "../professional-form";

export default async function EditarProfissionalPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(...CAN_EDIT.profissionais);
  const { id } = await params;
  const [professional, specialties] = await Promise.all([
    db.professional.findUnique({ where: { id } }),
    db.specialty.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!professional) notFound();
  return (
    <>
      <PageHeader title={professional.name} subtitle="Editar profissional" actions={<LinkButton href={`/profissionais/${professional.id}/horarios`} variant="secondary">Horários de atendimento</LinkButton>} />
      <Card className="max-w-3xl"><ProfessionalForm professional={professional} specialties={specialties} /></Card>
    </>
  );
}
