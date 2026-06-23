import { LoginForm } from "./login-form";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  google_not_configured: "Google sign-in is not configured for this deployment yet.",
  google_sign_in_failed: "Google sign-in could not be completed. Please try again.",
  google_identity_unverified: "Google did not return a verified email address.",
  missing_oauth_code: "Google sign-in returned without an authorization code.",
  not_internal_email: "Use your @apneadynamics.org Google account to sign in.",
  not_authorized_finance:
    "This Google account is not authorized for finance access. Ask an administrator to add the email first.",
};

function getAuthError(error: string | string[] | undefined): string | undefined {
  const value = Array.isArray(error) ? error[0] : error;
  if (!value) return undefined;
  return AUTH_ERROR_MESSAGES[value] ?? AUTH_ERROR_MESSAGES.google_sign_in_failed;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const params = await searchParams;

  return <LoginForm authError={getAuthError(params.error)} />;
}
