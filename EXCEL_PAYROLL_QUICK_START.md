# Excel Payroll Integration - Quick Start

## What Was Built

A complete payroll import and calculation system that integrates your Excel workbook with the AHOP calculator app.

**4 new modules:**
1. **Excel Importer** - Reads Excel, maps to TypeScript objects
2. **Enhanced Calculations** - Supports OT, leaves, absences, YTD tracking
3. **Payroll Summary Generator** - Produces CSV reports matching Excel template
4. **Reconciliation Engine** - Validates calculations against Excel source

---

## Files Changed/Created

### Schema
- `prisma/schema.prisma` - Extended with 20+ new fields for OT, leaves, deductions, YTD

### New Modules
- `src/lib/excel-importer.ts` (130 lines) - Parse Excel files
- `src/lib/payroll-generator.ts` (160 lines) - Generate summaries & CSV
- `src/lib/payroll-reconciliation.ts` (180 lines) - Validate calculations

### Enhanced Calculation
- `src/lib/ahop.ts` - Extended `PayrollInputs` & `PayrollResult` interfaces, added OT/leave logic

### Testing
- `src/scripts/test-excel-import.ts` - CLI tool to test integration

### Documentation
- `INTEGRATION_GUIDE.md` - Full integration spec & roadmap
- `EXCEL_PAYROLL_QUICK_START.md` - This file

---

## Test the Integration Right Now

```bash
npx tsx src/scripts/test-excel-import.ts "for AI payroll work.xlsx"
```

**Output:**
- Console log with summary
- `for AI payroll work_payroll_summary.csv` - Employee payroll data
- `for AI payroll work_reconciliation_report.txt` - Validation report

---

## Excel Column Mapping

The importer expects this structure (Template Source <Month Date> sheet):

| Col | Header | Type | Notes |
|-----|--------|------|-------|
| A | Employee Name | string | Required |
| B | Position | string | |
| C | Date of Joining | date | |
| F | Salary Type | string | AHOP or other |
| G | Daily Rate | number | Required for DAILY salary |
| H | Monthly Rate | number | Can be formula |
| O | Worked Days (hours) | number | Hours actually worked |
| P | Basic Pay | number | Calculated field |
| Q | Expected AHOP | number | AHOP topup amount |
| R | RD OT (Hours) | number | Regular OT hours (1x rate) |
| S | RD OT Pay | number | Calculated field |
| T | Extended OT (Hours) | number | Extended OT hours (1.3x rate) |
| U | Extended OT Pay | number | Calculated field |
| X | SIL (Days) | number | Special Incentive Leave days |
| Y | SIL Pay | number | Calculated field |
| Z | SL (Hours) | number | Sick/Regular Leave hours |
| AA | SL Pay | number | Calculated field |
| AD | Absence (Hours) | number | Absence hours |
| AF | Tardiness/Undertime (Minutes) | number | Tardiness minutes |

**Note:** The importer reads **static values** only. If your Excel uses formulas, make sure to:
1. Open the file in Excel
2. Press Ctrl+Shift+F9 to recalculate all formulas
3. Save the file
4. Then import

---

## Calculation Rules

### Regular Pay
- If DAILY salary: `worked days × daily rate`
- If MONTHLY: `monthly rate` (as-is)

### AHOP (Allowance for Hazard, OT, Other Pay)
- DAILY only: `(baseline days - worked days) × daily rate`
- Baseline = 23 days (configurable)
- Set to 0 for MONTHLY salary type

### Overtime
- **RD OT (Regular Duty):** `hours × hourly rate × 1.0`
- **Extended OT:** `hours × hourly rate × 1.3`
- Hourly rate = daily rate ÷ 8

### Leaves
- **SIL (Special Incentive Leave):** `days × daily rate`
- **SL (Sick/Regular Leave):** `hours × hourly rate`

### Absences
- **Absence Deduction:** `-(hours × hourly rate)`
- Subtracted from gross

### Gross Income Calculation
```
Gross = Regular Pay + AHOP + RD OT + Extended OT + SIL + SL - Absences
```

### Deductions (from Gross)
1. SSS - Based on contribution brackets (₱575-₱700 for employees)
2. Philhealth - 2.5% of gross
3. Pag-ibig - Fixed ₱200
4. Probationary Deduction - If applicable
5. Tardiness/Undertime - Custom deduction
6. Loans - Active loan payments
7. Salary Adjustments - One-time adjustments (can be positive or negative)

### Net Pay
```
Net = Gross - (SSS + Philhealth + Pag-ibig + Probationary + Tardiness + Loans)
    + Salary Adjustments (if positive)
```

### YTD AHOP
```
YTD AHOP = Previous Period YTD + Current Period AHOP
```

---

## Example Walkthrough

**Sample Employee (from Excel):**
- Daily Rate: ₱500
- Worked Days: 20 (out of 23 baseline)
- RD OT Hours: 2
- SIL Days: 0
- SL Hours: 0
- Absence Hours: 0

**Calculations:**
1. Regular Pay = 20 × 500 = ₱10,000
2. AHOP = (23 - 20) × 500 = ₱1,500
3. RD OT = 2 × (500/8) × 1.0 = ₱125
4. Gross = 10,000 + 1,500 + 125 = ₱11,625
5. SSS = ₱625 (from ₱11,625 bracket)
6. Philhealth = 11,625 × 0.025 = ₱290.63
7. Pag-ibig = ₱200
8. Total Deductions = 625 + 290.63 + 200 = ₱1,115.63
9. Net = 11,625 - 1,115.63 = ₱10,509.37

---

## Reconciliation

The system compares calculated results to Excel values:

**Tolerance Rules:**
- **MATCH:** Difference ≤ ₱0.50 AND ≤ 1% difference
- **MINOR_DIFF:** Difference ≤ 5% (typically rounding)
- **MAJOR_DIFF:** Difference > 5% (formula mismatch)

**Example Report:**
```
Employee: Sample
  MAJOR DIFFERENCES:
    basicPay: Excel=5000.00, Calculated=40000.00, Diff=35000.00 (700.00%)
```

This indicates the calculation method differs from Excel's formula. Adjust tolerance or formula as needed.

---

## What's Next?

### Immediate (Recommended)
1. Run test script on your actual Excel file
2. Review reconciliation report for any MAJOR_DIFF
3. Adjust formulas in Excel or calculation code as needed

### Short Term (This week)
1. Build React upload UI for Excel files
2. Display payroll summary in dashboard
3. Add payslip PDF generation

### Medium Term (Next 2 weeks)
1. Wire up database migration (when PostgreSQL is ready)
2. Save imported payroll to database
3. Add employee management UI (add/edit/delete)
4. Batch operations (import multiple months)

### Long Term (Future)
1. Withholding tax calculation
2. Region-based contribution rates
3. Loan tracking across periods
4. Audit logs and approval workflow

---

## Troubleshooting

### Issue: "Sheet 'Template Source <Month Date>' not found"
**Solution:** Make sure your Excel file is named correctly and the sheet name matches exactly (including spaces).

### Issue: Reconciliation shows MAJOR_DIFF for all fields
**Solution:** 
1. Open Excel file and recalculate formulas (Ctrl+Shift+F9)
2. Save file
3. Re-run import
4. Check that column mappings in importer match your Excel structure

### Issue: "Invalid time value" error
**Solution:** Date columns in Excel may be formatted incorrectly. Ensure dates are in YYYY-MM-DD format or Excel serial date numbers.

### Issue: Calculations don't match Excel
**Solution:**
1. Check the reconciliation report for which fields differ
2. Compare Excel formulas (press Ctrl+` to show formulas) with calculation logic in `src/lib/ahop.ts`
3. Adjust either Excel formulas or TypeScript calculation as needed

---

## API Reference

### `importExcelPayroll(filePath: string): Promise<ExcelPayrollData>`
Reads Excel file and returns parsed employee data.

```typescript
const { employees, periodStart, periodEnd } = await importExcelPayroll("file.xlsx");
```

### `calculatePayroll(input: PayrollInputs): PayrollResult`
Calculates payroll for single employee.

```typescript
const result = calculatePayroll({
  salaryType: "DAILY",
  dailyRate: 500,
  monthlyRate: 11500,
  workingDays: 20,
  baselineDays: 23,
  overtimeRegularHours: 2,
  silDays: 0,
  // ... other fields
});
```

### `generatePayrollSummary(...): PayrollSummary`
Creates summary of payrolls for all employees with totals.

### `reconcilePayroll(...): ReconciliationReport`
Compares calculated values against Excel source data.

### `exportPayrollToCSV(summary: PayrollSummary): string`
Generates CSV export of payroll summary.

---

## Key Files to Review

1. **Logic:** `src/lib/ahop.ts` - Core calculation formulas
2. **Import:** `src/lib/excel-importer.ts` - Column mapping
3. **Schema:** `prisma/schema.prisma` - Database structure
4. **Testing:** `src/scripts/test-excel-import.ts` - Integration test

---

## Questions?

Refer to:
- `INTEGRATION_GUIDE.md` - Full technical documentation
- `src/lib/*.ts` - Source code with comments
- Reconciliation report - Identifies specific mismatches
