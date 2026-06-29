UPDATE "payroll"."ContributionRateConfig"
SET
  "pagIbigEmployeeFixed" = 100,
  "pagIbigEmployerFixed" = 100
WHERE
  "name" = 'Handbook v1'
  AND "pagIbigEmployeeFixed" = 200
  AND "pagIbigEmployerFixed" = 200;

ALTER TABLE "payroll"."ContributionRateConfig"
ALTER COLUMN "pagIbigEmployeeFixed" SET DEFAULT 100,
ALTER COLUMN "pagIbigEmployerFixed" SET DEFAULT 100;
