# Payroll Template Gap Analysis

Source spreadsheet: `for AI payroll work`

Reviewed tabs:
- `Template Source <Month Date>`: meaningful payroll data runs from `A:AX`.
- `Template Payroll <Month Date>`: payroll output runs from `A:Z`.
- `Template Payslip NT`: payslip template without a De Minimis earning row.
- `Template Payslip T`: payslip template with a De Minimis earning row.

## Main Finding

The app previously imported only through source column `AD` (`Absence (Hours)`). The source template continues through `AX`, so the app was missing:

- `Absence Deduction`
- `Tardiness/Undertime (Minutes)`
- `Tardiness/Undertime Deduction`
- `AOT (Minutes)`
- `AOT Pay`
- `Extra OT %`
- regular and special holiday hours/pay
- `CO AHOP`
- `Total AHOP`
- `Salary adjustments/SIL Conversion`
- `Gross Income`
- `SSS`
- `Philhealth`
- `Pagibig`
- `W/Holding Tax`
- `Loans`

Column `O` in the source sheet is labeled `Worked Days (hours)` and the formulas treat it as hours (`O / 8`). The current app stores attendance as whole working days, so this pass preserves the raw source hours and derives days defensively. True hour-level payroll needs a schema phase.

## Payroll Tab Shape

The payroll template headers are:

`CASH`, `Employee Name`, `Position`, `Date of Joining`, `Salary Disbursement Type`, `Basic Pay`, `Leaves`, `OT`, `AOT`, `AH`, `OT %`, `CO AHOP`, `De Minimis`, `Tardiness/Undertime`, `Absence`, `Salary adjustments/SIL Conversion`, `Gross Income`, `SSS`, `Philhealth`, `Pagibig`, `W/Holding Tax`, `Loans`, `Total`, `Net Income`, `Previous Pay Period's YTD AHOP`, `YTD AHOP`.

The app export now uses this order. Fields that are not yet stored in snapshots, such as AOT, holiday pay, OT premium, and withholding tax, remain zero in exported completed payrolls until the schema supports them.

## Payslip Template Difference

The difference between `Template Payslip NT` and `Template Payslip T` is not simply ITR/no ITR. Both include a `W/Holding Tax` deduction row. The practical difference visible in the templates is that `Template Payslip T` includes `De Minimis (Rice, uniform, transport, etc)` in earnings, while `Template Payslip NT` omits that row.

The app now chooses the T-style payslip when `deminimisAmount > 0`; otherwise it renders the NT-style structure.

## Phase 1 Implemented

- Import source columns through `AX`.
- Preserve tardiness deduction, loans, and salary adjustments into draft attendance entries.
- Show worked hours, derived days, tardiness, loans, adjustments, and sheet gross in import preview.
- Reconcile against the source sheet's actual `Gross Income` when present.
- Export payroll CSV in the template payroll column order.
- Render admin and employee payslips with a shared template-like, two-copy layout.

## Phase 2 Recommended

- Add payroll schema fields for taxable status, expected work hours/pay, scheduled work days/pay, worked hours, AOT minutes/pay, holiday hours/pay, OT premium, CO AHOP, total AHOP, withholding tax, and source gross/net.
- Update the payroll formula engine to match the sheet's half-month model and AHOP breakdown.
- Generate `.xlsx` exports with formulas/styles if finance needs a true spreadsheet clone rather than CSV.
- Add source-template fixture tests so future imports catch column drift immediately.
