"use client";

import { useActionState } from "react";
import { loginAction, type LoginActionState } from "@/app/actions/auth";

const initialState: LoginActionState = {};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f0e8] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#ddd6ca] bg-white p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5c665f]">
            Apnea Dynamics Inc.
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#1a2e1f]">
            Payroll System
          </h1>
          <p className="mt-1 text-sm text-[#6b7280]">Sign in to your account</p>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-[#374151]">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm outline-none focus:border-[#2f4f3e] focus:ring-1 focus:ring-[#2f4f3e]"
              placeholder="you@apneadynamics.org"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-[#374151]">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm outline-none focus:border-[#2f4f3e] focus:ring-1 focus:ring-[#2f4f3e]"
            />
          </div>

          {state.error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="mt-1 rounded-lg bg-[#2f4f3e] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#274636] disabled:opacity-60"
          >
            {isPending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
