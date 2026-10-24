-- DropIndex
DROP INDEX "Room_name_key";

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "healthPlanId" TEXT;

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "cardNumber" TEXT,
ADD COLUMN     "healthPlanId" TEXT;


-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- As duas unidades da clínica; salas que já existiam ficam na Vila.
INSERT INTO "Unit" ("id", "name", "updatedAt") VALUES ('unidade_vila', 'Vila', CURRENT_TIMESTAMP), ('unidade_aterrado', 'Aterrado', CURRENT_TIMESTAMP);

ALTER TABLE "Room" ADD COLUMN "unitId" TEXT;
UPDATE "Room" SET "unitId" = 'unidade_vila';
ALTER TABLE "Room" ALTER COLUMN "unitId" SET NOT NULL;

-- CreateTable
CREATE TABLE "HealthPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanPrice" (
    "healthPlanId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,

    CONSTRAINT "PlanPrice_pkey" PRIMARY KEY ("healthPlanId","specialtyId")
);

-- CreateTable
CREATE TABLE "ProfessionalSchedule" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,

    CONSTRAINT "ProfessionalSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Unit_name_key" ON "Unit"("name");

-- CreateIndex
CREATE UNIQUE INDEX "HealthPlan_name_key" ON "HealthPlan"("name");

-- CreateIndex
CREATE INDEX "ProfessionalSchedule_professionalId_idx" ON "ProfessionalSchedule"("professionalId");

-- CreateIndex
CREATE INDEX "ProfessionalSchedule_roomId_weekday_idx" ON "ProfessionalSchedule"("roomId", "weekday");

-- CreateIndex
CREATE UNIQUE INDEX "Room_unitId_name_key" ON "Room"("unitId", "name");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_healthPlanId_fkey" FOREIGN KEY ("healthPlanId") REFERENCES "HealthPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanPrice" ADD CONSTRAINT "PlanPrice_healthPlanId_fkey" FOREIGN KEY ("healthPlanId") REFERENCES "HealthPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanPrice" ADD CONSTRAINT "PlanPrice_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalSchedule" ADD CONSTRAINT "ProfessionalSchedule_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalSchedule" ADD CONSTRAINT "ProfessionalSchedule_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_healthPlanId_fkey" FOREIGN KEY ("healthPlanId") REFERENCES "HealthPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

