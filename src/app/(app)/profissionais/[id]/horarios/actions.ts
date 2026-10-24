"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { CAN_EDIT } from "@/lib/roles";
import { formObject, zodFieldErrors, type FormState } from "@/lib/form";
import { WEEKDAY_NAMES, minutesToTime, timeToMinutes } from "@/lib/time";

const schema = z.object({
  roomId: z.string({ error: "Escolha a sala." }),
  start: z.string({ error: "Informe o início." }).regex(/^\d{2}:\d{2}$/, "Horário inválido."),
  end: z.string({ error: "Informe o fim." }).regex(/^\d{2}:\d{2}$/, "Horário inválido."),
});

export async function addScheduleBlock(professionalId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole(...CAN_EDIT.grade);
  const parsed = schema.safeParse(formObject(formData));
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };
  const weekdays = formData.getAll("weekdays").map(Number).filter((n) => n >= 0 && n <= 6);
  if (weekdays.length === 0) return { fieldErrors: { weekdays: "Marque pelo menos um dia da semana." } };

  const startMinute = timeToMinutes(parsed.data.start);
  const endMinute = timeToMinutes(parsed.data.end);
  if (endMinute <= startMinute) return { fieldErrors: { end: "O fim precisa ser depois do início." } };
  const { roomId } = parsed.data;

  // Não pode sobrepor outro bloco do mesmo profissional, nem outro profissional na mesma sala.
  const clashes = await db.professionalSchedule.findMany({
    where: {
      weekday: { in: weekdays },
      startMinute: { lt: endMinute },
      endMinute: { gt: startMinute },
      OR: [{ professionalId }, { roomId }],
    },
    include: { professional: true, room: true },
    orderBy: [{ weekday: "asc" }, { startMinute: "asc" }],
  });
  if (clashes.length > 0) {
    const c = clashes[0];
    const when = `${WEEKDAY_NAMES[c.weekday]}, ${minutesToTime(c.startMinute)} às ${minutesToTime(c.endMinute)}`;
    return {
      error:
        c.professionalId === professionalId
          ? `Já existe um horário neste período: ${when} (${c.room.name}).`
          : `${c.room.name} já está com ${c.professional.name} em ${when}.`,
    };
  }

  await db.professionalSchedule.createMany({ data: weekdays.map((weekday) => ({ professionalId, roomId, weekday, startMinute, endMinute })) });
  revalidatePath(`/profissionais/${professionalId}/horarios`);
  return undefined;
}

export async function removeScheduleBlock(formData: FormData) {
  await requireRole(...CAN_EDIT.grade);
  const id = String(formData.get("id"));
  const block = await db.professionalSchedule.delete({ where: { id } });
  revalidatePath(`/profissionais/${block.professionalId}/horarios`);
}
