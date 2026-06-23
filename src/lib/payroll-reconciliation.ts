import { PayrollResult } from "./ahop";
import { ExcelEmployeeRow } from "./excel-importer";

export interface ReconciliationDifference {
  employeeName: string;
  field: string;
  excelValue: number;
  calculatedValue: number;
  difference: number;
  percentDifference: number;
  status: "MATCH" | "MINOR_DIFF" | "MAJOR_DIFF";
}

export interface ReconciliationReport {
  periodStart: Date;
  periodEnd: Date;
  totalEmployees: number;
  matchedEmployees: number;
  employeesWithDifferences: number;
  differences: ReconciliationDifference[];
  summary: {
    grossIncomeDifference: number;
    netPayDifference: number;
    totalDifferences: number;
  };
}

const TOLERANCE_PCT = 0.01; // 1% tolerance for rounding differences
const TOLERANCE_ABS = 0.5; // 0.50 absolute tolerance

function calculateStatus(difference: number, percentDifference: number): "MATCH" | "MINOR_DIFF" | "MAJOR_DIFF" {
  if (Math.abs(difference) <= TOLERANCE_ABS && Math.abs(percentDifference) <= TOLERANCE_PCT) {
    return "MATCH";
  }
  if (Math.abs(percentDifference) <= 5) {
    return "MINOR_DIFF";
  }
  return "MAJOR_DIFF";
}

function trackDifference(
  differences: ReconciliationDifference[],
  employeeName: string,
  field: string,
  excelValue: number,
  calculatedValue: number
) {
  const difference = calculatedValue - excelValue;
  const percentDifference = excelValue !== 0 ? (difference / excelValue) * 100 : 0;

  differences.push({
    employeeName,
    field,
    excelValue,
    calculatedValue,
    difference,
    percentDifference,
    status: calculateStatus(difference, percentDifference),
  });
}

function hasSheetValue(value: number | undefined): boolean {
  return value !== undefined && Number.isFinite(value) && value !== 0;
}

export function reconcilePayroll(
  employees: ExcelEmployeeRow[],
  calculatedPayrolls: Map<string, PayrollResult>,
  periodStart: Date,
  periodEnd: Date
): ReconciliationReport {
  const differences: ReconciliationDifference[] = [];
  let matchedEmployees = 0;
  let grossIncomeDifference = 0;
  let netPayDifference = 0;

  for (const employee of employees) {
    const calculated = calculatedPayrolls.get(employee.name);
    if (!calculated) continue;

    const employeeDifferences: ReconciliationDifference[] = [];

    // Basic pay reconciliation
    if (Math.abs(calculated.regularPay - employee.basicPay) > TOLERANCE_ABS) {
      trackDifference(
        employeeDifferences,
        employee.name,
        "basicPay",
        employee.basicPay,
        calculated.regularPay
      );
    }

    // Expected AHOP reconciliation
    if (Math.abs(calculated.ahopTopup - employee.expectedAhop) > TOLERANCE_ABS) {
      trackDifference(
        employeeDifferences,
        employee.name,
        "ahop",
        employee.expectedAhop,
        calculated.ahopTopup
      );
    }

    // Overtime reconciliation
    if (Math.abs(calculated.overtimeRegularPay - employee.rdOtPay) > TOLERANCE_ABS) {
      trackDifference(
        employeeDifferences,
        employee.name,
        "rdOtPay",
        employee.rdOtPay,
        calculated.overtimeRegularPay
      );
    }

    if (Math.abs(calculated.overtimeExtendedPay - employee.extendedOtPay) > TOLERANCE_ABS) {
      trackDifference(
        employeeDifferences,
        employee.name,
        "extendedOtPay",
        employee.extendedOtPay,
        calculated.overtimeExtendedPay
      );
    }

    // Leave reconciliation
    if (Math.abs(calculated.silPay - employee.silPay) > TOLERANCE_ABS) {
      trackDifference(employeeDifferences, employee.name, "silPay", employee.silPay, calculated.silPay);
    }

    if (Math.abs(calculated.slPay - employee.slPay) > TOLERANCE_ABS) {
      trackDifference(employeeDifferences, employee.name, "slPay", employee.slPay, calculated.slPay);
    }

    // Total gross income reconciliation. Prefer the template's AS Gross Income when parsed.
    const excelGrossTotal = hasSheetValue(employee.grossIncome)
      ? employee.grossIncome
      : employee.basicPay + employee.rdOtPay + employee.extendedOtPay + employee.silPay + employee.slPay;
    if (Math.abs(calculated.grossWithAhop - excelGrossTotal) > TOLERANCE_ABS) {
      trackDifference(
        employeeDifferences,
        employee.name,
        "grossIncome",
        excelGrossTotal,
        calculated.grossWithAhop
      );
      grossIncomeDifference += calculated.grossWithAhop - excelGrossTotal;
    }

    if (hasSheetValue(employee.tardinessDeduction)) {
      const excelTardinessDeduction = Math.abs(employee.tardinessDeduction);
      if (Math.abs(calculated.tardinessDeduction - excelTardinessDeduction) > TOLERANCE_ABS) {
        trackDifference(
          employeeDifferences,
          employee.name,
          "tardinessDeduction",
          excelTardinessDeduction,
          calculated.tardinessDeduction
        );
      }
    }

    if (hasSheetValue(employee.loans) && Math.abs(calculated.loanDeductions - Math.abs(employee.loans)) > TOLERANCE_ABS) {
      trackDifference(
        employeeDifferences,
        employee.name,
        "loans",
        Math.abs(employee.loans),
        calculated.loanDeductions
      );
    }

    const excelDeductions =
      (employee.sss || 0) +
      (employee.philHealth || 0) +
      (employee.pagIbig || 0) +
      (employee.withholdingTax || 0) +
      (employee.loans || 0);
    if (hasSheetValue(excelDeductions)) {
      const calculatedDeductions =
        calculated.sssEmployee +
        calculated.philHealthEmployee +
        calculated.pagIbigEmployee +
        calculated.loanDeductions;
      if (Math.abs(calculatedDeductions - excelDeductions) > TOLERANCE_ABS) {
        trackDifference(
          employeeDifferences,
          employee.name,
          "statutoryAndLoanDeductions",
          excelDeductions,
          calculatedDeductions
        );
      }
    }

    const excelNetPay = excelGrossTotal + (employee.salaryAdjustments || 0) - excelDeductions;
    if (hasSheetValue(employee.grossIncome) && Math.abs(calculated.netPay - excelNetPay) > TOLERANCE_ABS) {
      trackDifference(employeeDifferences, employee.name, "netPay", excelNetPay, calculated.netPay);
      netPayDifference += calculated.netPay - excelNetPay;
    }

    if (employeeDifferences.length === 0) {
      matchedEmployees++;
    } else {
      differences.push(...employeeDifferences);
    }

    if (!hasSheetValue(employee.grossIncome)) {
      netPayDifference += calculated.netPay;
    }
  }

  return {
    periodStart,
    periodEnd,
    totalEmployees: employees.length,
    matchedEmployees,
    employeesWithDifferences: employees.length - matchedEmployees,
    differences,
    summary: {
      grossIncomeDifference,
      netPayDifference,
      totalDifferences: differences.length,
    },
  };
}

export function generateReconciliationReport(report: ReconciliationReport): string {
  let output = "";
  output += "PAYROLL RECONCILIATION REPORT\n";
  output += "==============================\n";

  const startStr = report.periodStart && !isNaN(report.periodStart.getTime())
    ? report.periodStart.toISOString().split("T")[0]
    : "Unknown";
  const endStr = report.periodEnd && !isNaN(report.periodEnd.getTime())
    ? report.periodEnd.toISOString().split("T")[0]
    : "Unknown";

  output += `Period: ${startStr} to ${endStr}\n\n`;

  output += "SUMMARY\n";
  output += `Total Employees: ${report.totalEmployees}\n`;
  output += `Matched Employees: ${report.matchedEmployees}\n`;
  output += `Employees with Differences: ${report.employeesWithDifferences}\n`;
  output += `Total Differences Found: ${report.summary.totalDifferences}\n\n`;

  if (report.differences.length > 0) {
    output += "DIFFERENCES\n";
    output += "-------------------------------------------\n";

    // Group by employee
    const byEmployee = new Map<string, ReconciliationDifference[]>();
    for (const diff of report.differences) {
      if (!byEmployee.has(diff.employeeName)) {
        byEmployee.set(diff.employeeName, []);
      }
      byEmployee.get(diff.employeeName)!.push(diff);
    }

    for (const [name, diffs] of byEmployee.entries()) {
      const majorDiffs = diffs.filter((d) => d.status === "MAJOR_DIFF");
      const minorDiffs = diffs.filter((d) => d.status === "MINOR_DIFF");

      output += `\n${name}\n`;
      if (majorDiffs.length > 0) {
        output += "  MAJOR DIFFERENCES:\n";
        for (const diff of majorDiffs) {
          output += `    ${diff.field}: Excel=${diff.excelValue.toFixed(2)}, Calculated=${diff.calculatedValue.toFixed(
            2
          )}, Diff=${diff.difference.toFixed(2)} (${diff.percentDifference.toFixed(2)}%)\n`;
        }
      }
      if (minorDiffs.length > 0) {
        output += "  Minor Differences (rounding):\n";
        for (const diff of minorDiffs) {
          output += `    ${diff.field}: ${diff.difference.toFixed(2)}\n`;
        }
      }
    }
  } else {
    output += "✓ All employees reconciled successfully!\n";
  }

  return output;
}
