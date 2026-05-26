import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

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
    "Disbursement Method",
    "Employee Name",
    "Position",
    "Date of Joining",
    "Basic Pay",
    "Leaves",
    "Overtime (Regular)",
    "Overtime (Extended)",
    "Another OT",
    "Accumulated Holiday",
    "OT %",
    "CO AHOP",
    "De Minimis",
    "Tardiness/Undertime",
    "Absence",
    "Salary Adjustments",
    "Gross Income",
    "SSS",
    "Philhealth",
    "Pag-ibig",
    "Withholding Tax",
    "Loans",
    "Total Deductions",
    "Net Income",
    "Previous YTD AHOP",
    "YTD AHOP",
  ];

  const rows = period.snapshots.map((snap) => {
    const emp = snap.employee;
    const totalDeductions =
      Number(snap.sssEmployee) +
      Number(snap.philHealthEmployee) +
      Number(snap.pagIbigEmployee) +
      Number(snap.probationaryDeduction) +
      Number(snap.tardinessDeduction) +
      Number(snap.loanDeductions);

    return [
      emp.paymentMethod,
      emp.fullName,
      emp.position ?? "",
      emp.dateStarted.toISOString().split("T")[0],
      Number(snap.regularPay).toFixed(2),
      (Number(snap.silPay) + Number(snap.slPay)).toFixed(2),
      Number(snap.overtimeRegularPay).toFixed(2),
      Number(snap.overtimeExtendedPay).toFixed(2),
      "0.00",
      Number(snap.ahopTopup).toFixed(2),
      Number(snap.overtimeRegularPay) > 0 ? "100" : "0",
      "0.00",
      Number(emp.deminimisAmount).toFixed(2),
      Number(snap.tardinessDeduction).toFixed(2),
      (-Number(snap.absencePay)).toFixed(2),
      Number(snap.salaryAdjustments).toFixed(2),
      Number(snap.grossWithAhop).toFixed(2),
      Number(snap.sssEmployee).toFixed(2),
      Number(snap.philHealthEmployee).toFixed(2),
      Number(snap.pagIbigEmployee).toFixed(2),
      "0.00",
      Number(snap.loanDeductions).toFixed(2),
      totalDeductions.toFixed(2),
      Number(snap.netPay).toFixed(2),
      Number(snap.previousYtdAhop).toFixed(2),
      Number(snap.ytdAhop).toFixed(2),
    ].join(",");
  });

  const periodStartStr = period.periodStart.toISOString().split("T")[0];
  const periodEndStr = period.periodEnd.toISOString().split("T")[0];
  const totalGross = period.snapshots.reduce((s, snap) => s + Number(snap.grossWithAhop), 0);
  const totalDed = period.snapshots.reduce(
    (s, snap) =>
      s +
      Number(snap.sssEmployee) +
      Number(snap.philHealthEmployee) +
      Number(snap.pagIbigEmployee) +
      Number(snap.probationaryDeduction) +
      Number(snap.tardinessDeduction) +
      Number(snap.loanDeductions),
    0
  );
  const totalNet = period.snapshots.reduce((s, snap) => s + Number(snap.netPay), 0);

  const csv = [
    headers.join(","),
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
