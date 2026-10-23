import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isPlatformAdminEmail } from '@/lib/admin';
import { preparerContrat, manquantsLucky } from '@/lib/contrat';
import { construireContratPdf } from '@/lib/contratPdf';
import { envoyerPourSignature, ErreurSignature, signatureConfiguree } from '@/lib/yousign';

export const dynamic = 'force-dynamic';

/** Coupe « Jean-Marc Dubois » en prénom / nom, Yousign demandant les deux. */
function couper(nomComplet: string): { prenom: string; nom: string } {
  const parts = nomComplet.trim().split(/\s+/);
  if (parts.length === 1) return { prenom: parts[0], nom: parts[0] };
  return { prenom: parts[0], nom: parts.slice(1).join(' ') };
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await isPlatformAdminEmail(user.email))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  if (!signatureConfiguree()) {
    return NextResponse.json(
      { error: "La signature électronique n'est pas configurée sur ce déploiement." },
      { status: 503 }
    );
  }

  const { id } = await request.json().catch(() => ({ id: null }));
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const service = createServiceClient();
  const { data: c } = await service.from('crm_venues').select('*').eq('id', id).maybeSingle();
  if (!c) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  // On refait la vérification ici et pas seulement dans l'écran : un contrat
  // incomplet parti chez le signataire ne se rattrape qu'en l'annulant devant
  // le client.
  const k = preparerContrat(c);
  const trous = [...k.manquants, ...manquantsLucky()];
  if (trous.length > 0) {
    return NextResponse.json(
      { error: `Contrat incomplet : il manque ${trous.join(', ')}.` },
      { status: 400 }
    );
  }

  const email = (c.contact_email ?? '').trim();
  if (!email) {
    return NextResponse.json(
      { error: "Aucune adresse e-mail de contact sur la fiche : c'est là que part la demande de signature." },
      { status: 400 }
    );
  }

  try {
    const pdf = await construireContratPdf(c);
    const { prenom, nom } = couper(c.signer_name);
    const envoi = await envoyerPourSignature(pdf, `Contrat Lucky — ${c.name}`, { prenom, nom, email });

    await service
      .from('crm_venues')
      .update({ contract_sent_at: new Date().toISOString() })
      .eq('id', id);

    return NextResponse.json({ ok: true, email, bacASable: envoi.environnementBacASable });
  } catch (e) {
    const message =
      e instanceof ErreurSignature ? e.message : "L'envoi a échoué. Le contrat n'est pas parti.";
    console.error('[contrat/envoyer]', e);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
