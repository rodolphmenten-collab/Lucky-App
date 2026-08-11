/**
 * Pragmatic MVP gate for the internal /admin back-office. Anyone signed in with an
 * email in ADMIN_EMAILS (comma-separated) can access it. This is intentionally simple
 * for a first deploy — swap for a real `platform_admins` table + role check before
 * onboarding a real ops team.
 */
export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowlist = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(email.toLowerCase());
}
