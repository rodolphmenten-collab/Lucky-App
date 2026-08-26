import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const INTENTION_HINT: Record<string, Record<string, string>> = {
  en: {
    dating: 'They matched under "Dating" — keep it warm, a little playful, low-pressure.',
    business: 'They matched under "Business" — keep it professional but friendly, curious about their work.',
    social: 'They matched under "Social" — keep it casual and easygoing.',
    looking: 'They matched with no strong stated intention — keep it light and open-ended.',
  },
  fr: {
    dating: 'Ils se sont matchés sous "Dating" — ton chaleureux, un peu joueur, sans pression.',
    business: 'Ils se sont matchés sous "Business" — ton professionnel mais amical, curieux de son travail.',
    social: 'Ils se sont matchés sous "Social" — ton décontracté et simple.',
    looking: "Ils se sont matchés sans intention marquée — ton léger et ouvert.",
  },
  es: {
    dating: 'Coincidieron en "Citas" — tono cálido, un poco juguetón, sin presión.',
    business: 'Coincidieron en "Negocios" — tono profesional pero cercano, con curiosidad por su trabajo.',
    social: 'Coincidieron en "Social" — tono relajado y sencillo.',
    looking: 'Coincidieron sin una intención marcada — tono ligero y abierto.',
  },
};

const LANG_NAME: Record<string, string> = { en: 'English', fr: 'French', es: 'Spanish' };

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { matchId, lang } = await request.json();
  if (!matchId) return NextResponse.json({ error: 'Missing matchId' }, { status: 400 });

  const safeLang = ['en', 'fr', 'es'].includes(lang) ? lang : 'en';

  const { data: match } = await supabase
    .from('matches')
    .select('id, user_a, user_b, venues(name, type)')
    .eq('id', matchId)
    .maybeSingle();

  if (!match || (match.user_a !== user.id && match.user_b !== user.id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const otherId = match.user_a === user.id ? match.user_b : match.user_a;
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, first_name, intentions')
    .in('id', [user.id, otherId]);

  const me = profiles?.find((p) => p.id === user.id);
  const other = profiles?.find((p) => p.id === otherId);
  const shared = (me?.intentions ?? []).find((i: string) => (other?.intentions ?? []).includes(i)) ?? 'looking';

  const venueName = (match as any).venues?.name ?? 'the venue';
  const hint = INTENTION_HINT[safeLang][shared] ?? INTENTION_HINT[safeLang].looking;

  const prompt = `You are helping someone write a first message to a person they just matched with on Lucky, an app that connects people physically present at the same venue.

Venue: ${venueName}
Other person's first name: ${other?.first_name ?? 'there'}
Context: ${hint}

Write exactly ONE short, natural opening message (max 20 words) they could send right now, in ${LANG_NAME[safeLang]}. No quotation marks, no preamble, no options — just the message text itself, ready to send.`;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Icebreaker suggestions are not configured yet.' }, { status: 501 });
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 100,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Anthropic API error:', errText);
      return NextResponse.json({ error: 'Could not generate a suggestion right now.' }, { status: 502 });
    }

    const data = await res.json();
    const suggestion = data.content?.find((c: any) => c.type === 'text')?.text?.trim() ?? '';

    return NextResponse.json({ suggestion });
  } catch (err) {
    console.error('Icebreaker generation failed:', err);
    return NextResponse.json({ error: 'Could not generate a suggestion right now.' }, { status: 500 });
  }
}
