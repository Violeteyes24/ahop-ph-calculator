export const INTERNAL_EMAIL_DOMAIN = "@apneadynamics.org";

export function isInternalEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(INTERNAL_EMAIL_DOMAIN);
}
