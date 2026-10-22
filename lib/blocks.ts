import { createServiceClient } from '@/lib/supabase/server';

/**
 * Identifiants des personnes avec lesquelles tout lien est coupé.
 *
 * Le blocage vaut dans les deux sens : celle qui bloque ne doit plus voir la
 * personne, et la personne bloquée ne doit plus pouvoir l'atteindre. Comme la
 * politique RLS ne laisse chacun lire que les blocages qu'il a lui-même posés,
 * la lecture passe par le client de service — sinon la moitié du blocage, celle
 * qui protège réellement, resterait invisible.
 *
 * À n'appeler que côté serveur.
 */
export async function blockedUserIds(userId: string): Promise<Set<string>> {
  const service = createServiceClient();
  const { data } = await service
    .from('blocks')
    .select('blocker_id, blocked_id')
    .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);

  const ids = new Set<string>();
  for (const b of data ?? []) {
    ids.add(b.blocker_id === userId ? b.blocked_id : b.blocker_id);
  }
  return ids;
}

export async function isBlockedBetween(a: string, b: string): Promise<boolean> {
  const service = createServiceClient();
  const { data } = await service
    .from('blocks')
    .select('id')
    .or(`and(blocker_id.eq.${a},blocked_id.eq.${b}),and(blocker_id.eq.${b},blocked_id.eq.${a})`)
    .limit(1);
  return (data ?? []).length > 0;
}
