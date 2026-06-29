"use client";

import { useActionState } from "react";
import { updateEmployeeAction, type EmployeeActionState } from "@/app/actions/employees";
import { EmployeeFormFields } from "../../new/page";
import Link from "next/link";

const initialState: EmployeeActionState = {};

interface Defaults {
  fullName: string;
  position: string;
  dateStarted: string;
  salaryType: string;
  salaryCategory: string;
  dailyRate: string;
  monthlyRate: string;
  employmentStage: string;
  paymentMethod: string;
  deminimisAmount: string;
}

export function EditEmployeeForm({ id, defaults }: { id: string; defaults: Defaults }) {
  const boundAction = updateEmployeeAction.bind(null, id);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="rounded-xl border border-border bg-card p-6">
      <EmployeeFormFields defaults={defaults} />

      <div className="mt-6 border-t border-border pt-6">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Change password (optional)</h3>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="text"
            minLength={8}
            className="rounded-lg border border-input px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="Leave blank to keep current password"
          />
        </div>
      </div>

      {state.error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
        <Link
          href={`/admin/employees/${id}`}
          className="rounded-lg border border-input px-5 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
