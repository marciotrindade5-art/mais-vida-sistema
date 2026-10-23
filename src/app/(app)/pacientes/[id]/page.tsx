import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { CAN_EDIT } from "@/lib/roles";
import { Card, PageHeader } from "@/components/ui";
import { PatientForm } from "../patient-form";

export default async function EditarPacientePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(...CAN_EDIT.pacientes);
  const { id } = await params;
  const patient = await db.patient.findUnique({ where: { id } });
  if (!patient) notFound();
  return (
    <>
      <PageHeader title={patient.name} subtitle="Editar paciente" />
      <Card className="max-w-3xl"><PatientForm patient={patient} /></Card>
    </>
  );
}
