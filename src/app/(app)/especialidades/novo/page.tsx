import { requireRole } from "@/lib/auth";
import { CAN_EDIT } from "@/lib/roles";
import { Card, PageHeader } from "@/components/ui";
import { SpecialtyForm } from "../specialty-form";

export default async function NovaEspecialidadePage() {
  await requireRole(...CAN_EDIT.especialidades);
  return (
    <>
      <PageHeader title="Nova especialidade" subtitle="Especialidades" />
      <Card className="max-w-2xl"><SpecialtyForm /></Card>
    </>
  );
}
