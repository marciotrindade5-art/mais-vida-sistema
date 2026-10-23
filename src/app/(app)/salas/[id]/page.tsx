import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { CAN_EDIT } from "@/lib/roles";
import { Card, PageHeader } from "@/components/ui";
import { RoomForm } from "../room-form";

export default async function EditarSalaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(...CAN_EDIT.salas);
  const { id } = await params;
  const room = await db.room.findUnique({ where: { id } });
  if (!room) notFound();
  return (
    <>
      <PageHeader title={room.name} subtitle="Editar sala" />
      <Card className="max-w-2xl"><RoomForm room={room} /></Card>
    </>
  );
}
