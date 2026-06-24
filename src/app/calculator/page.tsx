"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { calculatePayroll, HANDBOOK_REFERENCE, type SalaryType } from "@/lib/ahop";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function toPeso(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}

type IconKind = "profile" | "inputs" | "review" | "regular" | "ahop" | "deductions" | "net";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: IconKind;
}

interface GlossaryTerm {
  term: string;
  meaning: string;
  icon: IconKind;
}

interface FormulaSlide {
  id: string;
  title: string;
  formula: string;
  explanation: string;
  exampleLines: string[];
}

function TutorialIcon({ kind }: { kind: IconKind }) {
  if (kind === "profile") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.8 19.3c1.8-3 4-4.2 6.2-4.2s4.4 1.2 6.2 4.2" />
      </svg>
    );
  }

  if (kind === "inputs") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h16" />
        <circle cx="9" cy="6" r="1.8" />
        <circle cx="15" cy="12" r="1.8" />
        <circle cx="11" cy="18" r="1.8" />
      </svg>
    );
  }

  if (kind === "review") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 20h16" />
        <rect x="6" y="11" width="3" height="7" rx="0.5" />
        <rect x="11" y="8" width="3" height="10" rx="0.5" />
        <rect x="16" y="5" width="3" height="13" rx="0.5" />
      </svg>
    );
  }

  if (kind === "regular") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3.5" y="6" width="17" height="12" rx="2" />
        <path d="M3.5 10h17" />
        <path d="M8 14h3" />
      </svg>
    );
  }

  if (kind === "ahop") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 4v16" />
        <path d="M6 10l6-6 6 6" />
        <path d="M8 18h8" />
      </svg>
    );
  }

  if (kind === "deductions") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 6h16" />
        <path d="M7 12h10" />
        <path d="M10 18h4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12h16" />
      <path d="M12 4v16" />
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

export default function Home() {
  const [salaryType, setSalaryType] = useState<SalaryType>("DAILY");
  const [fullName, setFullName] = useState("");
  const [dateStarted, setDateStarted] = useState("2026-01-01");
  const [dailyRate, setDailyRate] = useState(500);
  const [monthlyRate, setMonthlyRate] = useState(11000);
  const [workingDays, setWorkingDays] = useState(22);
  const [baselineDays, setBaselineDays] = useState(23);
  const [probationaryDeductionPct, setProbationaryDeductionPct] = useState(0);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isFormulaTutorialOpen, setIsFormulaTutorialOpen] = useState(false);
  const [formulaStepIndex, setFormulaStepIndex] = useState(0);

  const result = useMemo(
    () =>
      calculatePayroll({
        salaryType,
        dailyRate,
        monthlyRate,
        workingDays,
        baselineDays,
        probationaryDeductionPct,
      }),
    [salaryType, dailyRate, monthlyRate, workingDays, baselineDays, probationaryDeductionPct],
  );

  const tutorialSteps: TutorialStep[] = [
    {
      id: "step-1",
      title: "Set your profile",
      description: "Add your name, date started, and salary type so the calculator understands your setup.",
      icon: "profile",
    },
    {
      id: "step-2",
      title: "Enter pay inputs",
      description: "Input daily or monthly rate, working days, and baseline days based on your handbook.",
      icon: "inputs",
    },
    {
      id: "step-3",
      title: "Review your breakdown",
      description: "Check regular pay, AHOP top-up, deductions, and net pay in one summary.",
      icon: "review",
    },
  ];

  const glossary: GlossaryTerm[] = [
    {
      term: "Regular Pay",
      meaning: "Your base pay for the period from your daily or monthly salary settings.",
      icon: "regular",
    },
    {
      term: "AHOP Top-up",
      meaning: "Extra pay added when daily period earnings are below your baseline target.",
      icon: "ahop",
    },
    {
      term: "Deductions",
      meaning: "Amounts removed from gross pay such as SSS, PhilHealth, Pag-IBIG, and probationary deductions.",
      icon: "deductions",
    },
    {
      term: "Net Pay",
      meaning: "The amount you actually receive after all employee deductions.",
      icon: "net",
    },
  ];

  const ahopDays = salaryType === "DAILY" ? Math.max(0, baselineDays - workingDays) : 0;
  const totalEmployeeDeductions =
    result.sssEmployee + result.philHealthEmployee + result.pagIbigEmployee + result.probationaryDeduction;

  const teachingSummary =
    result.ahopTopup > 0
      ? `AHOP added ${toPeso(result.ahopTopup)} because this period has ${ahopDays} fewer day(s) than your baseline.`
      : "No AHOP top-up was needed this period because regular pay already met the baseline.";

  const sampleFormulaResult = calculatePayroll({
    salaryType: "DAILY",
    dailyRate: 500,
    monthlyRate: 11000,
    workingDays: 22,
    baselineDays: 23,
    probationaryDeductionPct: 0,
  });

  const formulaSlides: FormulaSlide[] = [
    {
      id: "formula-1",
      title: "Regular pay (no AHOP)",
      formula: "Regular Pay = Daily Rate x Working Days",
      explanation: "This is your normal pay before AHOP adds anything.",
      exampleLines: [
        `If daily rate is ${toPeso(500)} and working days are 22:`,
        `${toPeso(500)} x 22 = ${toPeso(11000)}`,
      ],
    },
    {
      id: "formula-2",
      title: "AHOP add-on",
      formula: "AHOP Top-up = (Baseline Days - Working Days) x Daily Rate",
      explanation: "AHOP fills the gap when you worked fewer days than baseline.",
      exampleLines: [
        "Baseline is 23 days and you worked 22 days, so the gap is 1 day.",
        `AHOP = 1 x ${toPeso(500)} = ${toPeso(500)}`,
      ],
    },
    {
      id: "formula-3",
      title: "Pay with AHOP",
      formula: "Gross With AHOP = Regular Pay + AHOP Top-up",
      explanation: "After adding AHOP, this is the gross amount before deductions.",
      exampleLines: [
        `${toPeso(11000)} + ${toPeso(500)} = ${toPeso(11500)}`,
        `So with AHOP, pay goes from ${toPeso(11000)} to ${toPeso(11500)}.`,
      ],
    },
    {
      id: "formula-4",
      title: "Take-home pay",
      formula: "Net Pay = Gross With AHOP - (SSS EE + PhilHealth EE + Pag-IBIG EE + Probationary Deduction)",
      explanation: "Take-home pay is what is left after required deductions.",
      exampleLines: [
        `Sample deductions: SSS ${toPeso(sampleFormulaResult.sssEmployee)}, PhilHealth ${toPeso(sampleFormulaResult.philHealthEmployee)}, Pag-IBIG ${toPeso(sampleFormulaResult.pagIbigEmployee)}.`,
        `${toPeso(sampleFormulaResult.grossWithAhop)} - (${toPeso(sampleFormulaResult.sssEmployee)} + ${toPeso(sampleFormulaResult.philHealthEmployee)} + ${toPeso(sampleFormulaResult.pagIbigEmployee)} + ${toPeso(sampleFormulaResult.probationaryDeduction)}) = ${toPeso(sampleFormulaResult.netPay)}`,
      ],
    },
  ];

  const activeFormulaSlide = formulaSlides[formulaStepIndex];

  useEffect(() => {
    if (!isTutorialOpen && !isFormulaTutorialOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsTutorialOpen(false);
        setIsFormulaTutorialOpen(false);
        return;
      }

      if (isFormulaTutorialOpen && event.key === "ArrowRight") {
        setFormulaStepIndex((previous) => Math.min(previous + 1, formulaSlides.length - 1));
      }

      if (isFormulaTutorialOpen && event.key === "ArrowLeft") {
        setFormulaStepIndex((previous) => Math.max(previous - 1, 0));
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isTutorialOpen, isFormulaTutorialOpen, formulaSlides.length]);

  function openFormulaTutorial(): void {
    setFormulaStepIndex(0);
    setIsFormulaTutorialOpen(true);
  }

  function applyHandbookSample(): void {
    setFullName("Juan Dela Cruz");
    setDateStarted("2026-01-01");
    setSalaryType("DAILY");
    setDailyRate(500);
    setMonthlyRate(11000);
    setWorkingDays(22);
    setBaselineDays(23);
    setProbationaryDeductionPct(0);
    setIsTutorialOpen(false);
    setIsFormulaTutorialOpen(false);
  }

  return (
    <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 overflow-hidden px-4 py-6 sm:px-6 lg:px-8 print-main">
      <div aria-hidden className="print-exclude pointer-events-none absolute -left-16 -top-24 h-56 w-56 rounded-full bg-[#f4eee4] blur-2xl" />
      <div aria-hidden className="print-exclude pointer-events-none absolute -right-10 top-24 h-48 w-48 rounded-full bg-[#e7efe8] blur-2xl" />

      <section className="print-exclude surface enter-up rounded-2xl p-5 sm:p-8">
        <Badge variant="secondary" className="font-mono text-xs uppercase tracking-[0.12em]">
          AHOP PH v1
        </Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Payroll Snapshot: Regular vs With AHOP</h1>
        <p className="caption mt-3 max-w-3xl text-sm leading-7 sm:text-base text-black">
          This calculator follows your handbook policy for daily wage with Accumulated Holiday and Overtime Pay (AHOP),
          bi-monthly payout timing, and mandatory SSS, PhilHealth, and Pag-IBIG deductions.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsTutorialOpen(true)}
            className="quick-tutorial-button inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
          >
            <TutorialIcon kind="review" />
            Start Quick Tutorial
          </button>
          <button
            type="button"
            onClick={applyHandbookSample}
            className="rounded-xl border border-[#c9c2b7] bg-white px-4 py-2 text-sm font-medium hover:bg-[#f7f4ef]"
          >
            Try handbook sample
          </button>
          <button
            type="button"
            onClick={openFormulaTutorial}
            className="rounded-xl border border-[#2f4f3e] bg-[#edf3ee] px-4 py-2 text-sm font-semibold text-[#254235] hover:bg-[#e3ede5]"
          >
            Formula Walkthrough
          </button>
          <Link
            href="/login"
            className="rounded-xl border border-[#c9c2b7] bg-white px-4 py-2 text-sm font-semibold text-[#254235] hover:bg-[#f7f4ef]"
          >
            Finance sign in
          </Link>
        </div>
      </section>

      <section className="print-exclude stagger-children grid gap-6 lg:grid-cols-2">
        <Card className="surface">
          <CardHeader>
            <CardTitle>Employee Inputs</CardTitle>
            <CardDescription>Date started, pay basis, and probationary deductions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2 grid gap-1.5">
                <Label htmlFor="employee-name">Employee Name</Label>
                <Input
                  id="employee-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Juan Dela Cruz"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="date-started">Date Started</Label>
                <Input
                  id="date-started"
                  type="date"
                  value={dateStarted}
                  onChange={(e) => setDateStarted(e.target.value)}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="salary-type">Salary Type</Label>
                <Select value={salaryType} onValueChange={(value) => setSalaryType(value as SalaryType)}>
                  <SelectTrigger id="salary-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="daily-rate">Daily Rate</Label>
                <Input
                  id="daily-rate"
                  type="number"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(Number(e.target.value) || 0)}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="monthly-rate">Monthly Rate</Label>
                <Input
                  id="monthly-rate"
                  type="number"
                  value={monthlyRate}
                  onChange={(e) => setMonthlyRate(Number(e.target.value) || 0)}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="working-days">Working Days (Current Period)</Label>
                <Input
                  id="working-days"
                  type="number"
                  value={workingDays}
                  onChange={(e) => setWorkingDays(Number(e.target.value) || 0)}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="baseline-days">Baseline Days</Label>
                <Input
                  id="baseline-days"
                  type="number"
                  value={baselineDays}
                  onChange={(e) => setBaselineDays(Number(e.target.value) || 1)}
                />
              </div>

              <div className="sm:col-span-2 grid gap-1.5">
                <Label htmlFor="probation-pct">Probationary Deduction (%)</Label>
                <Input
                  id="probation-pct"
                  type="number"
                  step="0.01"
                  value={probationaryDeductionPct}
                  onChange={(e) => setProbationaryDeductionPct(Number(e.target.value) || 0)}
                />
              </div>
            </div>
            <p className="caption mt-4 text-xs">
              Notes: Pay schedule follows handbook windows: 26th-10th paid on 15th, 11th-25th paid on last day of month.
              Payment method is cash or direct bank only.
            </p>
          </CardContent>
        </Card>

        <Card className="surface">
          <CardHeader>
            <CardTitle>Computed Breakdown</CardTitle>
            <CardDescription>Automatic split for regular pay, AHOP top-up, and statutory deductions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between rounded-md bg-[#f4eee4] px-3 py-2">
                <span>Regular Pay</span>
                <strong>{toPeso(result.regularPay)}</strong>
              </div>
              <div className="flex items-center justify-between rounded-md bg-[#f2e2d5] px-3 py-2">
                <span>AHOP Top-up</span>
                <strong>{toPeso(result.ahopTopup)}</strong>
              </div>
              <div className="flex items-center justify-between rounded-md bg-[#ebf3ed] px-3 py-2 text-base">
                <span>Gross With AHOP</span>
                <strong>{toPeso(result.grossWithAhop)}</strong>
              </div>
            </div>

            <h3 className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-[#5c665f]">Employee Deductions</h3>
            <div className="mt-3 grid gap-2 text-sm">
              <div className="flex items-center justify-between"><span>SSS (EE)</span><span>{toPeso(result.sssEmployee)}</span></div>
              <div className="flex items-center justify-between"><span>PhilHealth (EE)</span><span>{toPeso(result.philHealthEmployee)}</span></div>
              <div className="flex items-center justify-between"><span>Pag-IBIG (EE)</span><span>{toPeso(result.pagIbigEmployee)}</span></div>
              <div className="flex items-center justify-between"><span>Probationary Deduction</span><span>{toPeso(result.probationaryDeduction)}</span></div>
              <Separator className="my-1" />
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Net Pay</span>
                <span>{toPeso(result.netPay)}</span>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-[#f6f1e8] p-3 text-sm leading-6">
              <p className="font-medium">Plain-language summary</p>
              <p className="mt-1">{teachingSummary}</p>
              <p className="mt-2">
                Your take-home pay is <strong>{toPeso(result.netPay)}</strong> after employee deductions of <strong>{toPeso(totalEmployeeDeductions)}</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsTutorialOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#d4cebf] bg-white px-3 py-1.5 text-xs font-medium hover:bg-[#f7f4ef]"
            >
              <TutorialIcon kind="inputs" />
              Open quick tutorial and terms
            </button>

            <h3 className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-[#5c665f]">Employer Share</h3>
            <div className="mt-3 grid gap-2 text-sm">
              <div className="flex items-center justify-between"><span>SSS (ER)</span><span>{toPeso(result.sssEmployer)}</span></div>
              <div className="flex items-center justify-between"><span>PhilHealth (ER)</span><span>{toPeso(result.philHealthEmployer)}</span></div>
              <div className="flex items-center justify-between"><span>Pag-IBIG (ER)</span><span>{toPeso(result.pagIbigEmployer)}</span></div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="print-exclude stagger-children grid gap-6 lg:grid-cols-2">
        <Card className="surface">
          <CardHeader>
            <CardTitle>Annual Projection (v1)</CardTitle>
            <CardDescription>
              v1 uses fixed 259 working days for annual regular projection and baseline days x 12 for annual with AHOP.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-0 grid gap-3 text-sm">
              <div className="flex items-center justify-between rounded-md bg-[#f4eee4] px-3 py-2">
                <span>Projected Annual Regular</span>
                <strong>{toPeso(result.annualRegularProjection)}</strong>
              </div>
              <div className="flex items-center justify-between rounded-md bg-[#f2e2d5] px-3 py-2">
                <span>Projected Annual With AHOP</span>
                <strong>{toPeso(result.annualWithAhopProjection)}</strong>
              </div>
            </div>
            <p className="caption mt-3 text-xs">
              Employee: {fullName || "(not set)"} • Date Started: {dateStarted}
            </p>
          </CardContent>
        </Card>

        <Card className="surface">
          <CardHeader>
            <CardTitle>Handbook Reference Fixtures</CardTitle>
            <CardDescription>Used for quick manual validation while building the calculator flow.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-0 text-sm">
              <p>
                Monthly sample: {toPeso(HANDBOOK_REFERENCE.monthlyExample.regularDaily)} regular vs{" "}
                {toPeso(HANDBOOK_REFERENCE.monthlyExample.withAhop)} with AHOP.
              </p>
              <p className="mt-1">
                Annual sample: {toPeso(HANDBOOK_REFERENCE.annualExample.regularDaily)} regular vs{" "}
                {toPeso(HANDBOOK_REFERENCE.annualExample.withAhop)} with AHOP.
              </p>
            </div>
            <div className="mt-4 overflow-x-auto rounded-md border">
              <Table>
                <TableHeader className="bg-[#f4eee4]">
                  <TableRow>
                    <TableHead>Gross + AHOP</TableHead>
                    <TableHead>SSS ER/EE</TableHead>
                    <TableHead>PhilHealth ER/EE</TableHead>
                    <TableHead>Pag-IBIG ER/EE</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {HANDBOOK_REFERENCE.deductionExamples.map((row) => (
                    <TableRow key={row.gross}>
                      <TableCell>{toPeso(row.gross)}</TableCell>
                      <TableCell>{toPeso(row.sssEmployer)} / {toPeso(row.sssEmployee)}</TableCell>
                      <TableCell>{toPeso(row.philHealthEmployer)} / {toPeso(row.philHealthEmployee)}</TableCell>
                      <TableCell>{toPeso(row.pagIbigEmployer)} / {toPeso(row.pagIbigEmployee)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      {isTutorialOpen ? (
        <div className="print-exclude tutorial-overlay" role="presentation" onClick={() => setIsTutorialOpen(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-tutorial-title"
            className="tutorial-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-4">
              <div>
                <p className="caption text-xs uppercase tracking-[0.14em]">Quick Tutorial</p>
                <h2 id="quick-tutorial-title" className="mt-1 text-xl font-semibold">3 simple steps + term definitions</h2>
                <p className="caption mt-1 text-sm">Use this once, then you are ready to use the calculator confidently.</p>
              </div>
              <button
                type="button"
                aria-label="Close tutorial"
                onClick={() => setIsTutorialOpen(false)}
                className="rounded-md border border-[#d7d0c4] px-2 py-1 text-sm hover:bg-[#f6f2ea]"
              >
                X
              </button>
            </header>

            <div className="mt-5 grid gap-3">
              {tutorialSteps.map((step, index) => (
                <article key={step.id} className="tutorial-step">
                  <div className="tutorial-step-icon">
                    <TutorialIcon kind={step.icon} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Step {index + 1}: {step.title}</p>
                    <p className="caption mt-1 text-sm">{step.description}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#5c665f]">Definition of terms</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {glossary.map((item) => (
                  <article key={item.term} className="term-item">
                    <div className="term-item-icon">
                      <TutorialIcon kind={item.icon} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{item.term}</p>
                      <p className="caption text-sm">{item.meaning}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <footer className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={applyHandbookSample}
                className="quick-tutorial-button inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
              >
                Try sample values now
              </button>
              <button
                type="button"
                onClick={() => setIsTutorialOpen(false)}
                className="rounded-xl border border-[#c9c2b7] bg-white px-4 py-2 text-sm font-medium hover:bg-[#f7f4ef]"
              >
                Close tutorial
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {isFormulaTutorialOpen ? (
        <div className="print-exclude tutorial-overlay" role="presentation" onClick={() => setIsFormulaTutorialOpen(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="formula-tutorial-title"
            className="tutorial-modal formula-tutorial-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-4">
              <div>
                <p className="caption text-xs uppercase tracking-[0.14em]">Formula Walkthrough</p>
                <h2 id="formula-tutorial-title" className="mt-1 text-xl font-semibold">Step-by-step AHOP calculator tutorial</h2>
                <p className="caption mt-1 text-sm">Example uses daily rate {toPeso(500)}, working days 22, baseline days 23.</p>
              </div>
              <button
                type="button"
                aria-label="Close formula tutorial"
                onClick={() => setIsFormulaTutorialOpen(false)}
                className="rounded-md border border-[#d7d0c4] px-2 py-1 text-sm hover:bg-[#f6f2ea]"
              >
                X
              </button>
            </header>

            <div className="mt-4 rounded-lg border border-[#ddd5c8] bg-[#fbf8f2] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#4e5d52]">
              Step {formulaStepIndex + 1} of {formulaSlides.length}
            </div>

            <article className="formula-slide mt-4">
              <h3 className="text-base font-semibold">{activeFormulaSlide.title}</h3>
              <p className="caption mt-2 text-sm">{activeFormulaSlide.explanation}</p>

              <div className="formula-equation mt-3 rounded-xl p-3">
                <p className="font-mono text-sm">{activeFormulaSlide.formula}</p>
              </div>

              <div className="formula-example mt-3 rounded-xl p-3 text-sm">
                {activeFormulaSlide.exampleLines.map((line) => (
                  <p key={line} className="leading-6">{line}</p>
                ))}
              </div>
            </article>

            <footer className="mt-6 flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormulaStepIndex((previous) => Math.max(previous - 1, 0))}
                  disabled={formulaStepIndex === 0}
                  className="rounded-xl border border-[#c9c2b7] bg-white px-3 py-2 text-sm font-medium hover:bg-[#f7f4ef] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  onClick={() => setFormulaStepIndex((previous) => Math.min(previous + 1, formulaSlides.length - 1))}
                  disabled={formulaStepIndex === formulaSlides.length - 1}
                  className="rounded-xl border border-[#c9c2b7] bg-white px-3 py-2 text-sm font-medium hover:bg-[#f7f4ef] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next →
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={applyHandbookSample}
                  className="quick-tutorial-button inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold"
                >
                  Try sample now
                </button>
                <button
                  type="button"
                  onClick={() => setIsFormulaTutorialOpen(false)}
                  className="rounded-xl border border-[#c9c2b7] bg-white px-3 py-2 text-sm font-medium hover:bg-[#f7f4ef]"
                >
                  Close
                </button>
              </div>
            </footer>
          </section>
        </div>
      ) : null}

    </main>
  );
}
