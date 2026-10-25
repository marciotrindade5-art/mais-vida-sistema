-- Planos usados pela clínica.
INSERT INTO "HealthPlan" ("id", "name", "updatedAt") VALUES
  ('plano_unimed', 'Unimed', CURRENT_TIMESTAMP),
  ('plano_amil', 'Amil', CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

-- Por enquanto só a unidade Aterrado funciona: as salas da Vila passam para o Aterrado
-- e a Vila fica inativa (pode ser reativada em Unidades).
UPDATE "Room" r SET "unitId" = 'unidade_aterrado', "updatedAt" = CURRENT_TIMESTAMP
WHERE r."unitId" = 'unidade_vila'
  AND EXISTS (SELECT 1 FROM "Unit" WHERE "id" = 'unidade_aterrado')
  AND NOT EXISTS (SELECT 1 FROM "Room" o WHERE o."unitId" = 'unidade_aterrado' AND o."name" = r."name");
UPDATE "Unit" SET "active" = false, "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'unidade_vila' AND NOT EXISTS (SELECT 1 FROM "Room" WHERE "unitId" = 'unidade_vila' AND "active");

-- Remove as especialidades padrão que o seed recriou em 24/10, depois que a clínica
-- já tinha cadastrado as suas. Só apaga as que não estão em uso.
DELETE FROM "Specialty" s
WHERE s."id" IN ('cmvn1p36s0000nz4pmf1za0od', 'cmvn1p3wg0001nz4pkymjekaj', 'cmvn1p4ch0002nz4pac7ockmq',
                 'cmvn1p5bt0004nz4pkk11r1x2', 'cmvn1p5rt0005nz4pggc3se80')
  AND NOT EXISTS (SELECT 1 FROM "Appointment" a WHERE a."specialtyId" = s."id")
  AND NOT EXISTS (SELECT 1 FROM "Professional" p WHERE p."specialtyId" = s."id")
  AND NOT EXISTS (SELECT 1 FROM "PlanPrice" pp WHERE pp."specialtyId" = s."id");
