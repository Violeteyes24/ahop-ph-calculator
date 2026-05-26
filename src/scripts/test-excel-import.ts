import { importExcelPayroll, excelEmployeeToPayrollInput } from "@/lib/excel-importer";
import { calculatePayroll } from "@/lib/ahop";
import { generatePayrollSummary, exportPayrollToCSV } from "@/lib/payroll-generator";
import { reconcilePayroll, generateReconciliationReport } from "@/lib/payroll-reconciliation";
import * as fs from "fs";

async function main() {
  const excelPath = process.argv[2];

  if (!excelPath) {
    console.error("Usage: npx tsx src/scripts/test-excel-import.ts <path-to-excel>");
    process.exit(1);
  }

  console.log(`📂 Importing payroll data from: ${excelPath}\n`);

  try {
    // Step 1: Import Excel data
    const excelData = await importExcelPayroll(excelPath);
    console.log(`✓ Imported ${excelData.employees.length} employees`);

    // Safety check for dates
    const startStr = excelData.periodStart && !isNaN(excelData.periodStart.getTime())
      ? excelData.periodStart.toISOString().split("T")[0]
      : "Invalid Date";
    const endStr = excelData.periodEnd && !isNaN(excelData.periodEnd.getTime())
      ? excelData.periodEnd.toISOString().split("T")[0]
      : "Invalid Date";

    console.log(`  Period: ${startStr} to ${endStr}\n`);

    // Step 2: Calculate payroll for each employee
    const calculatedPayrolls = new Map();
    const errors: string[] = [];

    for (const employee of excelData.employees) {
      try {
        const input = excelEmployeeToPayrollInput(employee);
        const result = calculatePayroll(input);
        calculatedPayrolls.set(employee.name, result);
      } catch (error) {
        errors.push(`${employee.name}: ${error}`);
      }
    }

    console.log(`✓ Calculated payroll for ${calculatedPayrolls.size} employees`);
    if (errors.length > 0) {
      console.log(`⚠ ${errors.length} errors during calculation:`);
      errors.forEach((e) => console.log(`  - ${e}`));
    }
    console.log();

    // Step 3: Generate payroll summary
    const summary = generatePayrollSummary(
      excelData.employees,
      calculatedPayrolls,
      excelData.periodStart,
      excelData.periodEnd
    );

    console.log("📊 PAYROLL SUMMARY");
    console.log("==================");
    console.log(`Total Employees: ${summary.totalRows}`);
    console.log(`Total Gross Income: ₱${summary.totalGrossIncome.toFixed(2)}`);
    console.log(`Total Deductions: ₱${summary.totalDeductions.toFixed(2)}`);
    console.log(`Total Net Income: ₱${summary.totalNetIncome.toFixed(2)}\n`);

    // Step 4: Reconcile with Excel
    const report = reconcilePayroll(
      excelData.employees,
      calculatedPayrolls,
      excelData.periodStart,
      excelData.periodEnd
    );

    console.log("✓ Reconciliation complete");
    console.log(`  Matched: ${report.matchedEmployees}/${report.totalEmployees} employees`);
    console.log(`  Differences found: ${report.differences.length}\n`);

    // Step 5: Export results
    const csv = exportPayrollToCSV(summary);
    const csvPath = excelPath.replace(".xlsx", "_payroll_summary.csv");
    fs.writeFileSync(csvPath, csv);
    console.log(`📄 Exported payroll summary to: ${csvPath}`);

    const reconciliationText = generateReconciliationReport(report);
    const reportPath = excelPath.replace(".xlsx", "_reconciliation_report.txt");
    fs.writeFileSync(reportPath, reconciliationText);
    console.log(`📄 Exported reconciliation report to: ${reportPath}\n`);

    // Print sample records
    console.log("📋 SAMPLE RECORDS (first 3 employees)");
    console.log("=====================================");
    for (let i = 0; i < Math.min(3, summary.rows.length); i++) {
      const row = summary.rows[i];
      console.log(
        `\n${i + 1}. ${row.employeeName} (${row.position})`
      );
      console.log(`   Gross Income: ₱${row.grossIncome.toFixed(2)}`);
      console.log(`   Net Income: ₱${row.netIncome.toFixed(2)}`);
      console.log(`   AHOP: ₱${row.accumulatedHoliday.toFixed(2)}`);
      console.log(`   YTD AHOP: ₱${row.ytdAhop.toFixed(2)}`);
    }

    console.log("\n✓ Import and processing complete!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();
