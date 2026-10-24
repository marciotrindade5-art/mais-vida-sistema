import { requireRole } from "@/lib/auth";
import { CAN_EDIT } from "@/lib/roles";
import { Card, PageHeader } from "@/components/ui";
import { UnitForm } from "../unit-form";

export default async function NovaUnidadePage() {
  await requireRole(...CAN_EDIT.unidades);
  return (
    <>
      <PageHeader title="Nova unidade" subtitle="Unidades" />
      <Card className="max-w-2xl"><UnitForm /></Card>
    </>
  );
}
