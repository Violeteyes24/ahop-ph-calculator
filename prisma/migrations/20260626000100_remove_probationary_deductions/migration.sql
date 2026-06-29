UPDATE "payroll"."PayrollSnapshot"
SET "netPay" = "netPay" + COALESCE("probationaryDeduction", 0);

ALTER TABLE "payroll"."PayrollSnapshot"
DROP COLUMN "probationaryDeduction";

ALTER TABLE "payroll"."EmployeeProfile"
DROP COLUMN "probationaryDeductionPct";
