import { cookies } from 'next/headers';

const COOKIE_NAME = 'lucky_admin_view_venue';

export function getAdminViewingVenueId(): string | null {
  return cookies().get(COOKIE_NAME)?.value ?? null;
}

export const ADMIN_VIEW_COOKIE_NAME = COOKIE_NAME;
