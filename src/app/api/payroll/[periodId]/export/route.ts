import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ periodId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { periodId } = await params;

  const period = await prisma.payrollPeriod.findUnique({
    where: { id: periodId },
    include: {
      snapshots: {
        orderBy: { employee: { fullName: "asc" } },
        include: {
          employee: {
            select: {
              fullName: true,
              position: true,
              dateStarted: true,
              paymentMethod: true,
              deminimisAmount: true,
            },
          },
        },
      },
    },
  });

  if (!period) {
    return NextResponse.json({ error: "Period not found" }, { status: 404 });
  }

  const headers = [
    "CASH",
    "Employee Name",
    "Position",
    "Date of Joining",
    "Salary Disbursement Type",
    "Basic Pay",
    "Leaves",
    "OT",
    "AOT",
    "AH",
    "OT %",
    "CO AHOP",
    "De Minimis",
    "Tardiness/Undertime",
    "Absence",
    "Salary adjustments/SIL Conversion",
    "Gross Income",
    "SSS",
    "Philhealth",
    "Pagibig",
    "W/Holding Tax",
    "Loans",
    "Total",
    "Net Income",
    "Previous Pay Period's YTD AHOP",
    "YTD AHOP",
  ];

  const rows = period.snapshots.map((snap) => {
    const emp = snap.employee;
    const deMinimisBiMonthly = Number(snap.deMinimisPay);
    const tardinessUndertime = -Math.abs(Number(snap.tardinessDeduction));
    const absence = Number(snap.absenceDeduction) || -Math.abs(Number(snap.absencePay));
    const totalDeductions =
      Number(snap.sssEmployee) +
      Number(snap.philHealthEmployee) +
      Number(snap.pagIbigEmployee) +
      Number(snap.withholdingTax) +
      Number(snap.loanDeductions);
    const grossIncome = Number(snap.grossWithAhop);
    const netIncome = grossIncome + Number(snap.salaryAdjustments) - totalDeductions;

    return [
      emp.paymentMethod === "CASH" ? "CASH" : "",
      emp.fullName,
      emp.position ?? "",
      emp.dateStarted.toISOString().split("T")[0],
      emp.paymentMethod === "CASH" ? "Cash" : "Online",
      Number(snap.regularPay).toFixed(2),
      Number(snap.totalLeavesPay).toFixed(2),
      Number(snap.otTotalPay).toFixed(2),
      Number(snap.aotPay).toFixed(2),
      Number(snap.totalHolidayPay).toFixed(2),
      Number(snap.extraOtPremium).toFixed(2),
      Number(snap.coAhop).toFixed(2),
      deMinimisBiMonthly.toFixed(2),
      tardinessUndertime.toFixed(2),
      absence.toFixed(2),
      Number(snap.salaryAdjustments).toFixed(2),
      grossIncome.toFixed(2),
      Number(snap.sssEmployee).toFixed(2),
      Number(snap.philHealthEmployee).toFixed(2),
      Number(snap.pagIbigEmployee).toFixed(2),
      Number(snap.withholdingTax).toFixed(2),
      Number(snap.loanDeductions).toFixed(2),
      totalDeductions.toFixed(2),
      netIncome.toFixed(2),
      Number(snap.previousYtdAhop).toFixed(2),
      Number(snap.ytdAhop).toFixed(2),
    ].map(csvCell).join(",");
  });

  const periodStartStr = period.periodStart.toISOString().split("T")[0];
  const periodEndStr = period.periodEnd.toISOString().split("T")[0];
  const totalGross = period.snapshots.reduce((sum, snap) => sum + Number(snap.grossWithAhop), 0);
  const totalDed = period.snapshots.reduce(
    (sum, snap) =>
      sum +
      Number(snap.sssEmployee) +
      Number(snap.philHealthEmployee) +
      Number(snap.pagIbigEmployee) +
      Number(snap.withholdingTax) +
      Number(snap.loanDeductions),
    0
  );
  const totalNet = period.snapshots.reduce((sum, snap) => {
    const totalDeductions =
      Number(snap.sssEmployee) +
      Number(snap.philHealthEmployee) +
      Number(snap.pagIbigEmployee) +
      Number(snap.withholdingTax) +
      Number(snap.loanDeductions);
    return sum + Number(snap.grossWithAhop) + Number(snap.salaryAdjustments) - totalDeductions;
  }, 0);

  const csv = [
    headers.map(csvCell).join(","),
    ...rows,
    "",
    `Period: ${periodStartStr} to ${periodEndStr}`,
    `Total Rows: ${period.snapshots.length}`,
    `Total Gross Income: ${totalGross.toFixed(2)}`,
    `Total Deductions: ${totalDed.toFixed(2)}`,
    `Total Net Income: ${totalNet.toFixed(2)}`,
  ].join("\n");

  const filename = `payroll_${period.label.replace(/[^a-z0-9]/gi, "_")}_${periodStartStr}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
