import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isPlatformAdminEmail } from '@/lib/admin';

export const dynamic = 'force-dynamic';

/**
 * Export des bons d'un établissement, en CSV.
 *
 * Deux détails qui décident si le fichier est exploitable ou non :
 *  - séparateur « ; » et BOM UTF-8, parce qu'Excel en configuration française
 *    ouvre un CSV à virgules sur une seule colonne et mange les accents sans
 *    le BOM. Le but est que le patron double-clique et voie son tableau.
 *  - montants en euros avec une virgule décimale, pour qu'Excel les traite
 *    comme des nombres et non comme du texte — sinon aucune somme n'est
 *    possible, ce qui est précisément l'usage attendu.
 *
 * Aucune donnée personnelle : le lieu a besoin des montants et des codes pour
 * recouper sa caisse, pas de l'identité de ses clients.
 */
const COLUMNS = [
  'Date',
  'Heure',
  'Code',
  'Article',
  'Prix carte (EUR)',
  'Remise (%)',
  'Encaisse (EUR)',
  'Etat',
  'Confirme le',
];

interface OrderRow {
  code: string;
  item_name: string;
  price_cents: number;
  discount_percent: number | null;
  net_price_cents: number | null;
  status: string;
  created_at: string;
  served_at: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  served: 'Servi',
  cancelled: 'Annule',
};

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response('Not authenticated', { status: 401 });

  const url = new URL(request.url);
  const venueId = url.searchParams.get('venueId');
  if (!venueId) return new Response('Missing venueId', { status: 400 });

  const service = createServiceClient();

  const [{ data: ownerRow }, isPlatformAdmin] = await Promise.all([
    service.from('venue_admins').select('id').eq('venue_id', venueId).eq('user_id', user.id).maybeSingle(),
    isPlatformAdminEmail(user.email),
  ]);

  if (!ownerRow && !isPlatformAdmin) {
    return new Response('Not authorized for this venue', { status: 403 });
  }

  const { data: venue } = await service
    .from('venues')
    .select('slug, name')
    .eq('id', venueId)
    .maybeSingle();
  if (!venue) return new Response('Venue not found', { status: 404 });

  // Bornes optionnelles : l'export complet reste le défaut, mais un patron qui
  // clôture un mois doit pouvoir ne sortir que ce mois-là.
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  let query = service
    .from('lucky_orders')
    .select('code, item_name, price_cents, discount_percent, net_price_cents, status, created_at, served_at')
    .eq('venue_id', venueId)
    .order('created_at', { ascending: false });

  if (from) query = query.gte('created_at', new Date(from).toISOString());
  if (to) {
    // Borne haute inclusive : « jusqu'au 31 » doit contenir le 31 en entier.
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    query = query.lte('created_at', end.toISOString());
  }

  const { data, error } = await query;
  if (error) return new Response(`Export impossible : ${error.message}`, { status: 500 });

  const rows = (data ?? []).map((o: OrderRow) => [
    formatDate(o.created_at),
    formatTime(o.created_at),
    o.code,
    o.item_name,
    euros(o.price_cents),
    String(o.discount_percent ?? 0),
    euros(o.net_price_cents ?? o.price_cents),
    STATUS_LABELS[o.status] ?? o.status,
    o.served_at ? `${formatDate(o.served_at)} ${formatTime(o.served_at)}` : '',
  ]);

  const csv =
    '﻿' +
    [COLUMNS, ...rows].map((line) => line.map(escapeCell).join(';')).join('\r\n') +
    '\r\n';

  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `lucky-bons-${venue.slug}-${stamp}.csv`;

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

function euros(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Un nom d'article contenant « ; » ou un guillemet casserait la colonne — et
 * une cellule commençant par =, +, - ou @ est interprétée comme une formule
 * par Excel, ce qui est un vecteur d'injection connu puisque les noms viennent
 * de la carte saisie par le lieu.
 */
function escapeCell(value: string): string {
  const raw = value ?? '';
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}
