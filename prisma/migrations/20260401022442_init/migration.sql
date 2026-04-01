-- CreateTable
CREATE TABLE "EmployeeProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "dateStarted" DATETIME NOT NULL,
    "salaryType" TEXT NOT NULL,
    "dailyRate" DECIMAL,
    "monthlyRate" DECIMAL,
    "employmentStage" TEXT NOT NULL DEFAULT 'PROBATIONARY',
    "probationaryDeductionPct" DECIMAL NOT NULL DEFAULT 0,
    "paymentMethod" TEXT NOT NULL DEFAULT 'BANK',
    "regionCode" TEXT NOT NULL DEFAULT 'NCR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PayrollSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "workingDays" INTEGER NOT NULL,
    "baselineDays" INTEGER NOT NULL DEFAULT 23,
    "regularPay" DECIMAL NOT NULL,
    "ahopTopup" DECIMAL NOT NULL,
    "grossWithAhop" DECIMAL NOT NULL,
    "sssEmployee" DECIMAL NOT NULL,
    "philHealthEmployee" DECIMAL NOT NULL,
    "pagIbigEmployee" DECIMAL NOT NULL,
    "probationaryDeduction" DECIMAL NOT NULL,
    "netPay" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PayrollSnapshot_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "EmployeeProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContributionRateConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT 'Handbook v1',
    "philHealthRate" DECIMAL NOT NULL DEFAULT 2.5,
    "pagIbigEmployeeFixed" DECIMAL NOT NULL DEFAULT 200,
    "pagIbigEmployerFixed" DECIMAL NOT NULL DEFAULT 200,
    "effectiveFrom" DATETIME NOT NULL,
    "effectiveTo" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
