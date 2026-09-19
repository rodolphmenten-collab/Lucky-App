// Codes courts montrés au bar. Alphabet sans caractères ambigus (0/O, 1/I/L)
// pour qu'un code lu à voix haute ou de travers reste lisible.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export function generateLuckyCode(prefix: 'L' | 'B' = 'L'): string {
  let body = '';
  for (let i = 0; i < 4; i++) {
    body += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `${prefix}-${body}`;
}

export function formatPrice(cents: number): string {
  return `${(cents / 100).toFixed(2).replace('.', ',')} €`;
}

/**
 * Insère une ligne en régénérant le code tant que l'unicité est violée.
 * Le volume est faible, quatre tentatives suffisent très largement.
 */
export async function insertWithUniqueCode<T>(
  table: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service: any,
  row: Record<string, unknown>,
  prefix: 'L' | 'B' = 'L',
  attempts = 4
): Promise<{ data: T | null; error: { message: string } | null }> {
  for (let i = 0; i < attempts; i++) {
    const { data, error } = await service
      .from(table)
      .insert({ ...row, code: generateLuckyCode(prefix) })
      .select()
      .single();

    if (!error) return { data: data as T, error: null };
    // 23505 = unique_violation : on retente avec un autre code
    if (error.code !== '23505') return { data: null, error };
  }
  return { data: null, error: { message: 'Impossible de générer un code unique' } };
}
