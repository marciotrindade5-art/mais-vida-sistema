import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Especialidades atendidas pela clínica, com as cores usadas na agenda.
const SPECIALTIES = [
  { name: "Psicologia", color: "#4a5a8c" },
  { name: "Fonoaudiologia", color: "#a0643a" },
  { name: "Terapia Ocupacional", color: "#3f7a4f" },
  { name: "Nutrição", color: "#8a7a2a" },
  { name: "Atendimento convencional", color: "#6e5480" },
  { name: "ABA", color: "#2f6670", defaultMinutes: 180 },
];

async function main() {
  // Só no banco vazio: a clínica renomeia e cria as suas, e o seed roda a cada deploy.
  if ((await db.specialty.count()) === 0) {
    await db.specialty.createMany({ data: SPECIALTIES });
  }

  const email = (process.env.ADMIN_EMAIL ?? "admin@maisvida.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const existing = await db.user.findUnique({ where: { email } });
  if (!existing) {
    if (!password || password.length < 8) {
      throw new Error("Defina ADMIN_PASSWORD (mínimo de 8 caracteres) para criar o primeiro administrador.");
    }
    await db.user.create({
      data: { name: "Administrador", email, role: "ADMIN", passwordHash: await bcrypt.hash(password, 10) },
    });
    console.log(`Administrador criado: ${email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
