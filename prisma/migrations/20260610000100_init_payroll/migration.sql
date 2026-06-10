-- Create the isolated payroll schema. The migration command must use
-- a connection string with schema=payroll so Prisma also stores its
-- _prisma_migrations table in the same schema.
CREATE SCHEMA IF NOT EXISTS "payroll";

-- CreateEnum
CREATE TYPE "SalaryType" AS ENUM ('DAILY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "SalaryCategory" AS ENUM ('AHOP', 'NON_AHOP');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK');

-- CreateEnum
CREATE TYPE "EmploymentStage" AS ENUM ('PROBATIONARY', 'REGULAR');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "PayrollPeriodStatus" AS ENUM ('DRAFT', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PayrollImportStatus" AS ENUM ('PARSED', 'PERSISTED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'EMPLOYEE',
    "employeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeProfile" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "position" TEXT,
    "dateStarted" TIMESTAMP(3) NOT NULL,
    "salaryType" "SalaryType" NOT NULL,
    "salaryCategory" "SalaryCategory" NOT NULL DEFAULT 'AHOP',
    "dailyRate" DECIMAL(65,30),
    "monthlyRate" DECIMAL(65,30),
    "employmentStage" "EmploymentStage" NOT NULL DEFAULT 'PROBATIONARY',
    "probationaryDeductionPct" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'BANK',
    "regionCode" TEXT NOT NULL DEFAULT 'NCR',
    "deminimisAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollPeriod" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "PayrollPeriodStatus" NOT NULL DEFAULT 'DRAFT',
    "baselineDays" INTEGER NOT NULL DEFAULT 23,
    "createdBy" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceEntry" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "workingDays" INTEGER NOT NULL DEFAULT 0,
    "overtimeRegularHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "overtimeExtendedHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "silDays" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "slHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "absenceHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tardinessDeduction" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "loanDeductions" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "salaryAdjustments" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "calculationError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollSnapshot" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "periodId" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "workingDays" INTEGER NOT NULL,
    "baselineDays" INTEGER NOT NULL DEFAULT 23,
    "regularPay" DECIMAL(65,30) NOT NULL,
    "ahopTopup" DECIMAL(65,30) NOT NULL,
    "grossWithAhop" DECIMAL(65,30) NOT NULL,
    "sssEmployee" DECIMAL(65,30) NOT NULL,
    "sssEmployer" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "philHealthEmployee" DECIMAL(65,30) NOT NULL,
    "philHealthEmployer" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "pagIbigEmployee" DECIMAL(65,30) NOT NULL,
    "pagIbigEmployer" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "probationaryDeduction" DECIMAL(65,30) NOT NULL,
    "netPay" DECIMAL(65,30) NOT NULL,
    "overtimeRegularHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "overtimeExtendedHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "overtimeRegularPay" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "overtimeExtendedPay" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "silDays" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "silPay" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "slHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "slPay" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "absenceHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "absencePay" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tardinessDeduction" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "loanDeductions" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "salaryAdjustments" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "ytdAhop" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "previousYtdAhop" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContributionRateConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Handbook v1',
    "philHealthRate" DECIMAL(65,30) NOT NULL DEFAULT 2.5,
    "pagIbigEmployeeFixed" DECIMAL(65,30) NOT NULL DEFAULT 200,
    "pagIbigEmployerFixed" DECIMAL(65,30) NOT NULL DEFAULT 200,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContributionRateConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollImportBatch" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "status" "PayrollImportStatus" NOT NULL DEFAULT 'PARSED',
    "periodId" TEXT,
    "parsedRows" JSONB NOT NULL,
    "warnings" JSONB NOT NULL,
    "reconciliation" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceEntry_periodId_employeeId_key" ON "AttendanceEntry"("periodId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollSnapshot_periodId_employeeId_key" ON "PayrollSnapshot"("periodId", "employeeId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "EmployeeProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceEntry" ADD CONSTRAINT "AttendanceEntry_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "PayrollPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceEntry" ADD CONSTRAINT "AttendanceEntry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollSnapshot" ADD CONSTRAINT "PayrollSnapshot_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollSnapshot" ADD CONSTRAINT "PayrollSnapshot_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "PayrollPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollImportBatch" ADD CONSTRAINT "PayrollImportBatch_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "PayrollPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
