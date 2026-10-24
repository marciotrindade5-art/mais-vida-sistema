import { db } from "./db";

/**
 * Valor da sessão pela tabela: o plano do paciente paga o valor combinado para a especialidade;
 * particular, ou plano que não cobre a especialidade, vira sessão particular pelo valor da especialidade.
 */
export async function sessionPrice(patientId: string, specialtyId: string) {
  const patient = await db.patient.findUnique({
    where: { id: patientId },
    select: { healthPlanId: true, healthPlan: { select: { prices: { where: { specialtyId } } } } },
  });
  const planPrice = patient?.healthPlan?.prices[0]?.priceCents;
  if (patient?.healthPlanId && planPrice != null) return { priceCents: planPrice, healthPlanId: patient.healthPlanId };
  const specialty = await db.specialty.findUnique({ where: { id: specialtyId }, select: { defaultPriceCents: true } });
  return { priceCents: specialty?.defaultPriceCents ?? 0, healthPlanId: null };
}
