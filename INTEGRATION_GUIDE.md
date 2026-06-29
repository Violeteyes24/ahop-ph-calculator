# Excel Payroll Integration Guide

## Overview

This project now supports importing and processing payroll data from the Excel workbook ("for AI payroll work.xlsx"). The integration spans 3 main components:

### 1. **Excel Importer** (`src/lib/excel-importer.ts`)
Parses Excel payroll source data and maps it to structured TypeScript objects.

**Key Functions:**
- `importExcelPayroll(filePath)` - Reads Excel file and extracts employee payroll data
- `excelEmployeeToPayrollInput()` - Converts Excel row to calculation inputs

**Supports:**
- Employee profiles (name, position, date of joining, salary type)
- Salary details (daily rate, monthly rate, de minimis)
- Work tracking (worked days, scheduled work days, expected hours)
- Compensation elements (AHOP, overtime, leaves, absences)

---

### 2. **Enhanced Payroll Calculations** (`src/lib/ahop.ts`)

**Extended `PayrollInputs` interface:**
```typescript
{
  salaryType: "DAILY" | "MONTHLY"
  dailyRate: number
  monthlyRate: number
  workingDays: number
  baselineDays: number
  // NEW:
  overtimeRegularHours?: number      // RD OT (1x rate)
  overtimeExtendedHours?: number     // Extended OT (1.3x rate)
  silDays?: number                   // Special Incentive Leave
  slHours?: number                   // Sick/Regular Leave
  absenceHours?: number              // Hours absent
  tardinessDeduction?: number        // Deduction for tardiness
  loanDeductions?: number            // Active loan payments
  salaryAdjustments?: number         // One-time adjustments
  previousYtdAhop?: number           // Previous period YTD AHOP
}
```

**Calculation Logic:**
1. Base regular pay (daily × worked days, or monthly rate)
2. AHOP topup (baseline days - worked days) × daily rate, for DAILY salary type only
3. Overtime pay:
   - Regular OT: hours × (daily rate / 8) × 1.0
   - Extended OT: hours × (daily rate / 8) × 1.3
4. Leave pay:
   - SIL: days × daily rate
   - SL: hours × (daily rate / 8)
5. Deductions from gross:
   - Absences: hours × (daily rate / 8) [negative]
   - SSS, Philhealth, Pag-ibig (based on contribution brackets)
   - Tardiness/undertime
   - Loan deductions
6. **YTD AHOP Tracking:** cumulative AHOP across periods

---

### 3. **Payroll Summary & Reporting** (`src/lib/payroll-generator.ts`)

Generates payroll summary matching your Excel template structure.

**Output Includes:**
```
Disbursement Method | Employee Name | Position | ...
CASH/ONLINE         | Sample        | Sample   | ...
```

**Exported Columns:**
- Basic Pay, Leaves, Overtime (Regular & Extended)
- AHOP, De Minimis, Tardiness/Undertime, Absence
- Gross Income
- SSS, Philhealth, Pag-ibig, Withholding Tax, Loans
- Total Deductions, Net Income
- YTD AHOP tracking

**Export Formats:**
- CSV file (`_payroll_summary.csv`)
- Structured in-memory `PayrollSummary` object

---

### 4. **Reconciliation & Validation** (`src/lib/payroll-reconciliation.ts`)

Compares calculated results against Excel source values to identify discrepancies.

**Features:**
- Tolerance-based matching (1% or ₱0.50)
- Per-field reconciliation
- Status classification:
  - `MATCH`: Within tolerance
  - `MINOR_DIFF`: ≤5% difference (rounding)
  - `MAJOR_DIFF`: >5% difference (formula/logic mismatch)

**Report Includes:**
```
SUMMARY
  Total Employees: X
  Matched: Y/X
  Differences Found: Z

DIFFERENCES (grouped by employee)
  Employee Name
    MAJOR: field differences with %age and amount
    MINOR: rounding differences
```

---

## Database Schema Extensions

### EmployeeProfile (New Fields)
```prisma
position                String?           // Job title
salaryCategory          SalaryCategory     // AHOP | NON_AHOP
deminimisAmount         Decimal @default(0)
```

### PayrollSnapshot (New Fields)
```prisma
// Overtime tracking
overtimeRegularHours    Decimal @default(0)
overtimeExtendedHours   Decimal @default(0)
overtimeRegularPay      Decimal @default(0)
overtimeExtendedPay     Decimal @default(0)

// Leave tracking
silDays                 Decimal @default(0)
silPay                  Decimal @default(0)
slHours                 Decimal @default(0)
slPay                   Decimal @default(0)

// Absence tracking
absenceHours            Decimal @default(0)
absencePay              Decimal @default(0)

// Deductions
tardinessDeduction      Decimal @default(0)
loanDeductions          Decimal @default(0)
salaryAdjustments       Decimal @default(0)

// Accumulation
ytdAhop                 Decimal @default(0)
previousYtdAhop         Decimal @default(0)

// Employer contributions (new)
sssEmployer             Decimal @default(0)
philHealthEmployer      Decimal @default(0)
pagIbigEmployer         Decimal @default(0)
```

---

## Usage

### CLI Test Script

```bash
npx tsx src/scripts/test-excel-import.ts <path-to-excel>
```

**Outputs:**
1. Console summary with employee count, period, totals
2. `_payroll_summary.csv` - Payroll data in CSV format
3. `_reconciliation_report.txt` - Detailed comparison vs Excel

### Programmatic Usage

```typescript
import { importExcelPayroll, excelEmployeeToPayrollInput } from "@/lib/excel-importer";
import { calculatePayroll } from "@/lib/ahop";
import { generatePayrollSummary } from "@/lib/payroll-generator";

// 1. Import Excel
const { employees, periodStart, periodEnd } = await importExcelPayroll("file.xlsx");

// 2. Calculate for each employee
const payrolls = new Map();
for (const emp of employees) {
  const input = excelEmployeeToPayrollInput(emp);
  const result = calculatePayroll(input);
  payrolls.set(emp.name, result);
}

// 3. Generate summary
const summary = generatePayrollSummary(employees, payrolls, periodStart, periodEnd);

// 4. Access results
summary.rows.forEach(row => {
  console.log(`${row.employeeName}: ₱${row.netIncome.toFixed(2)}`);
});
```

---

## Excel File Structure

Your workbook contains 5 sheets:

### Template Source <Month Date>
**Master source of truth** for all payroll calculations.

| Column | Field | Type | Example |
|--------|-------|------|---------|
| A | Employee Name | string | Sample |
| B | Position | string | Sample |
| C | Date of Joining | date | 2023-01-01 |
| D | Taxable | string | Yes/No |
| E | Salary Disbursement Type | string | Cash/Online |
| F | Salary Type | string | AHOP/Non-AHOP |
| G | Daily Rate | number | 500.00 |
| H | Monthly Rate | formula | =G*23 |
| ... | ... | ... | ... |
| P | Basic Pay | formula | =IF($D="Yes",...) |
| Q | Expected AHOP | formula | =IF(F="AHOP",...) |
| R-U | Overtime Hours/Pay | number/formula | RD & Extended |
| X-AC | Leave Days/Hours & Pay | number/formula | SIL, SL |
| AD-AG | Absence & Tardiness | number/formula | Deductions |

### Template Payroll <Month Date>
Summary view with aggregated data and payment method breakdown.

### Template Payslip NT / Template Payslip T
Payslip templates (Non-Taxable and Taxable variants) with dynamic lookups.

---

## Integration Roadmap

### ✅ Phase 1: Foundation (Complete)
- [x] Extended Prisma schema
- [x] Excel importer with data mapping
- [x] Enhanced calculation logic
- [x] Payroll summary generation
- [x] Reconciliation framework

### ⏳ Phase 2: UI & Payslips (Next)
- [ ] Build Excel upload UI (drag & drop)
- [ ] Display payroll summary in dashboard
- [ ] Generate payslips matching company branding
- [ ] Batch operations (import month's data)

### ⏳ Phase 3: Advanced Features (Future)
- [ ] YTD projections and comparisons
- [ ] Loan tracking and deductions over time
- [ ] Withholding tax calculation (current system has placeholder)
- [ ] Integration with accounting systems
- [ ] Payroll audit logs and approval workflow

---

## Known Issues & Limitations

1. **Excel Formulas:** Importer reads static values only. Recalculate Excel file before importing to ensure values are populated.
2. **Date Parsing:** Excel date columns may need special handling depending on format.
3. **Withholding Tax:** Not yet implemented (placeholder in code).
4. **Company Contribution AHOP:** Not fully modeled yet.
5. **Region-based Deductions:** Region code exists in schema but not used for different contribution rates.

---

## Testing Against Excel

Run the test script to validate integration:

```bash
npx tsx src/scripts/test-excel-import.ts "for AI payroll work.xlsx"
```

This will:
1. Import all employees from the Excel source sheet
2. Calculate payroll for each
3. Generate summary CSV
4. Produce reconciliation report comparing calculated vs Excel values
5. Identify and categorize differences (major vs rounding)

**Success Criteria:**
- All differences are "MINOR_DIFF" (≤5% or ₱0.50)
- No "MAJOR_DIFF" entries
- Reconciliation report shows clean match

---

## Next Steps

1. **Test with actual data:** Run importer against your real payroll Excel to validate formulas and calculations
2. **Adjust tolerance:** Fine-tune reconciliation tolerance if needed for your specific cases
3. **Build UI:** Create React components for upload and display
4. **Database migration:** When DB is available, run Prisma migration to apply schema changes
5. **Payslip design:** Design payslip layout matching Apnea Dynamics branding
