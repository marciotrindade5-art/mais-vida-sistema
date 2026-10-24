import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { CAN_EDIT } from "@/lib/roles";
import { Card, PageHeader } from "@/components/ui";
import { RoomForm } from "../room-form";

export default async function EditarSalaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(...CAN_EDIT.salas);
  const { id } = await params;
  const [room, units] = await Promise.all([
    db.room.findUnique({ where: { id } }),
    db.unit.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!room) notFound();
  return (
    <>
      <PageHeader title={room.name} subtitle="Editar sala" />
      <Card className="max-w-2xl"><RoomForm room={room} units={units} /></Card>
    </>
  );
}
