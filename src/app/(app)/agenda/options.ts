import { db } from "@/lib/db";

/** Listas usadas no formulário de agendamento. */
export async function appointmentOptions(include?: { patientId?: string; professionalId?: string; roomId?: string }) {
  const [patients, professionals, rooms] = await Promise.all([
    db.patient.findMany({
      where: { OR: [{ active: true }, { id: include?.patientId ?? "" }] },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.professional.findMany({
      where: { OR: [{ active: true }, { id: include?.professionalId ?? "" }] },
      orderBy: { name: "asc" },
      include: { specialty: true },
    }),
    db.room.findMany({
      where: { OR: [{ active: true }, { id: include?.roomId ?? "" }] },
      orderBy: [{ unit: { name: "asc" } }, { name: "asc" }],
      select: { id: true, name: true, unit: { select: { id: true, name: true } } },
    }),
  ]);
  return {
    patients,
    rooms: rooms.map((r) => ({ id: r.id, name: r.name, unitId: r.unit.id, unitName: r.unit.name })),
    professionals: professionals.map((p) => ({
      id: p.id,
      name: p.name,
      specialtyName: p.specialty.name,
      defaultMinutes: p.specialty.defaultMinutes,
    })),
  };
}
