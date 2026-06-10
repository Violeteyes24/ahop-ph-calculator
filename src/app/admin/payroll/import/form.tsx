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
    <form action={formAction} className="rounded-xl border border-[#ddd6ca] bg-white p-6">
      <div className="grid gap-4">
        <div>
          <label htmlFor="file" className="text-sm font-medium text-[#374151]">
            Excel workbook
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept=".xlsx,.xls"
            required
            className="mt-2 block w-full rounded-lg border border-[#d1d5db] bg-white px-3 py-2 text-sm text-[#374151] file:mr-3 file:rounded-md file:border-0 file:bg-[#edf3ee] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#2f4f3e] hover:file:bg-[#dce9df]"
          />
          <p className="mt-2 text-xs text-[#9ca3af]">
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
            className="rounded-lg bg-[#2f4f3e] px-5 py-2 text-sm font-semibold text-white hover:bg-[#274636] disabled:opacity-60"
          >
            {isPending ? "Parsing workbook..." : "Preview import"}
          </button>
        </div>
      </div>
    </form>
  );
}
