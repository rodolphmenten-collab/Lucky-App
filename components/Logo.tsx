/**
 * Cinq pétales, un par intention : dating, business, social, avec des amis,
 * juste curieux.
 *
 * Quatre pétales en croix formaient un quatre-feuilles — la lecture exacte du
 * motif d'une grande maison de maroquinerie, dont la marque est protégée
 * au-delà de ses propres classes. Cinq pétales à 72° suppriment cette symétrie
 * et le rapprochement avec elle, sans rien changer à l'esprit du dessin.
 *
 * Les couleurs sont celles des puces d'intention affichées sur les profils :
 * le logo dit littéralement ce que fait le produit.
 */

const PETALES = [
  { couleur: '#E84FA0', angle: 0 },   // dating
  { couleur: '#4C7DB0', angle: 72 },  // business
  { couleur: '#4CAF7D', angle: 144 }, // social
  { couleur: '#8B6FC9', angle: 216 }, // avec des amis
  { couleur: '#C9A46A', angle: 288 }, // juste curieux
];

export function Logo({ size = 40, showWordmark = false }: { size?: number; showWordmark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="70" fill="none" stroke="#C9A46A" strokeWidth="1.5" opacity="0.4" />
        <circle cx="100" cy="100" r="52" fill="none" stroke="#C9A46A" strokeWidth="2.5" opacity="0.75" />
        <g transform="translate(100,100)">
          {PETALES.map((p) => (
            <path
              key={p.angle}
              d="M0,0 Q -10,-10 0,-24 Q 10,-10 0,0 Z"
              fill={p.couleur}
              transform={`rotate(${p.angle})`}
            />
          ))}
        </g>
      </svg>
      {showWordmark && <span className="font-display text-2xl font-bold tracking-tight text-bone">Lucky</span>}
    </div>
  );
}
