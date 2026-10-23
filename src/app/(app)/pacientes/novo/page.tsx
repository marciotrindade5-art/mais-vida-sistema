import { requireRole } from "@/lib/auth";
import { CAN_EDIT } from "@/lib/roles";
import { Card, PageHeader } from "@/components/ui";
import { PatientForm } from "../patient-form";

export default async function NovoPacientePage() {
  await requireRole(...CAN_EDIT.pacientes);
  return (
    <>
      <PageHeader title="Novo paciente" subtitle="Pacientes" />
      <Card className="max-w-3xl"><PatientForm /></Card>
    </>
  );
}
