"use client";

import { useActionState } from "react";
import { createRateConfigAction, type SettingsActionState } from "@/app/actions/settings";

const initialState: SettingsActionState = {};

export function SettingsForm() {
  const [state, formAction, isPending] = useActionState(createRateConfigAction, initialState);

  return (
    <form action={formAction} className="rounded-xl border border-[#ddd6ca] bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-[#374151]">Name</label>
          <input
            id="name"
            name="name"
            required
            defaultValue="Handbook v2"
            className="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm outline-none focus:border-[#2f4f3e] focus:ring-1 focus:ring-[#2f4f3e]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="philHealthRate" className="text-sm font-medium text-[#374151]">
            PhilHealth rate (%)
          </label>
          <input
            id="philHealthRate"
            name="philHealthRate"
            type="number"
            step="0.01"
            required
            defaultValue="2.5"
            className="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm outline-none focus:border-[#2f4f3e] focus:ring-1 focus:ring-[#2f4f3e]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="pagIbigEmployeeFixed" className="text-sm font-medium text-[#374151]">
            Pag-IBIG employee (₱)
          </label>
          <input
            id="pagIbigEmployeeFixed"
            name="pagIbigEmployeeFixed"
            type="number"
            step="0.01"
            required
            defaultValue="200"
            className="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm outline-none focus:border-[#2f4f3e] focus:ring-1 focus:ring-[#2f4f3e]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="pagIbigEmployerFixed" className="text-sm font-medium text-[#374151]">
            Pag-IBIG employer (₱)
          </label>
          <input
            id="pagIbigEmployerFixed"
            name="pagIbigEmployerFixed"
            type="number"
            step="0.01"
            required
            defaultValue="200"
            className="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm outline-none focus:border-[#2f4f3e] focus:ring-1 focus:ring-[#2f4f3e]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="effectiveFrom" className="text-sm font-medium text-[#374151]">
            Effective from
          </label>
          <input
            id="effectiveFrom"
            name="effectiveFrom"
            type="date"
            required
            className="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm outline-none focus:border-[#2f4f3e] focus:ring-1 focus:ring-[#2f4f3e]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="effectiveTo" className="text-sm font-medium text-[#374151]">
            Effective to (optional)
          </label>
          <input
            id="effectiveTo"
            name="effectiveTo"
            type="date"
            className="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm outline-none focus:border-[#2f4f3e] focus:ring-1 focus:ring-[#2f4f3e]"
          />
        </div>
      </div>

      {state.error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Rate configuration saved.
        </p>
      ) : null}

      <div className="mt-5">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[#2f4f3e] px-5 py-2 text-sm font-semibold text-white hover:bg-[#274636] disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save configuration"}
        </button>
      </div>
    </form>
  );
}
