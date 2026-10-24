import { cookies } from "next/headers";
import { db } from "./db";
import { UNIT_COOKIE } from "./unit-cookie";

/** Unidades ativas e a escolhida: a da URL, senão a última usada, senão a primeira em ordem alfabética. */
export async function unitsAndCurrent(param: string | undefined) {
  const units = await db.unit.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  const remembered = (await cookies()).get(UNIT_COOKIE)?.value;
  const current = units.find((u) => u.id === param) ?? units.find((u) => u.id === remembered) ?? units[0] ?? null;
  return { units, current };
}
