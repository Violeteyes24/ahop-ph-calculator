"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  loginAction,
  signInWithGoogleAction,
  type LoginActionState,
} from "@/app/actions/auth";

const initialState: LoginActionState = {};

export function LoginForm({ authError }: { authError?: string }) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const shownError = state.error ?? authError;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Apnea Dynamics Inc.
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            Payroll System
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Finance personnel sign in</p>
        </div>

        <form action={signInWithGoogleAction}>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-input text-xs font-bold">
              G
            </span>
            Continue with Google
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="rounded-lg border border-input px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="you@apneadynamics.org"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="rounded-lg border border-input px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {shownError ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {shownError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="mt-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {isPending ? "Signing in..." : "Sign in with password"}
          </button>
        </form>

        <Link
          href="/calculator"
          className="mt-5 block text-center text-sm font-medium text-primary hover:underline"
        >
          Use the salary calculator as a guest
        </Link>
      </div>
    </main>
  );
}
