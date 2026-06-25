"use client";

import { useActionState } from "react";
import {
  importPayrollWorkbookAction,
  type ImportPayrollActionState,
} from "@/app/actions/import-payroll";

const initialState: ImportPayrollActionState = {};

export function PayrollImportForm() {
  const [state, formAction, isPending] = useActionState(importPayrollWorkbookAction, initialState);

  return (
    <form action={formAction} className="rounded-xl border border-border bg-card p-6">
      <div className="grid gap-4">
        <div>
          <label htmlFor="file" className="text-sm font-medium text-foreground">
            Excel workbook
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept=".xlsx,.xls"
            required
            className="mt-2 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary hover:file:bg-accent/80"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            The workbook must include the Template Source &lt;Month Date&gt; sheet.
          </p>
        </div>

        {state.error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        ) : null}

        <div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {isPending ? "Parsing workbook..." : "Preview import"}
          </button>
        </div>
      </div>
    </form>
  );
}
