import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { CAN_EDIT } from "@/lib/roles";
import { Card, PageHeader } from "@/components/ui";
import { RoomForm } from "../room-form";

export default async function NovaSalaPage() {
  await requireRole(...CAN_EDIT.salas);
  const units = await db.unit.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } });
  return (
    <>
      <PageHeader title="Nova sala" subtitle="Salas" />
      <Card className="max-w-2xl"><RoomForm units={units} /></Card>
    </>
  );
}
