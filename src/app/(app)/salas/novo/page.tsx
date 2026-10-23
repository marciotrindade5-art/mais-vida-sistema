import { requireRole } from "@/lib/auth";
import { CAN_EDIT } from "@/lib/roles";
import { Card, PageHeader } from "@/components/ui";
import { RoomForm } from "../room-form";

export default async function NovaSalaPage() {
  await requireRole(...CAN_EDIT.salas);
  return (
    <>
      <PageHeader title="Nova sala" subtitle="Salas" />
      <Card className="max-w-2xl"><RoomForm /></Card>
    </>
  );
}
