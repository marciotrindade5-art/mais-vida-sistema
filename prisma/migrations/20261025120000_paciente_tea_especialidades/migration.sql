-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "tea" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "_PatientToSpecialty" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PatientToSpecialty_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PatientToSpecialty_B_index" ON "_PatientToSpecialty"("B");

-- AddForeignKey
ALTER TABLE "_PatientToSpecialty" ADD CONSTRAINT "_PatientToSpecialty_A_fkey" FOREIGN KEY ("A") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PatientToSpecialty" ADD CONSTRAINT "_PatientToSpecialty_B_fkey" FOREIGN KEY ("B") REFERENCES "Specialty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

