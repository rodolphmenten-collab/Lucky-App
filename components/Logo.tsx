export function Logo({ size = 40, showWordmark = false }: { size?: number; showWordmark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="70" fill="none" stroke="#C9A46A" strokeWidth="1.5" opacity="0.4" />
        <circle cx="100" cy="100" r="52" fill="none" stroke="#C9A46A" strokeWidth="2.5" opacity="0.75" />
        <g transform="translate(100,100)">
          <path d="M0,0 Q -11,-10 0,-24 Q 11,-10 0,0 Z" fill="#C9A46A" transform="rotate(0)" />
          <path d="M0,0 Q -11,-10 0,-24 Q 11,-10 0,0 Z" fill="#C9A46A" transform="rotate(90)" />
          <path d="M0,0 Q -11,-10 0,-24 Q 11,-10 0,0 Z" fill="#C9A46A" transform="rotate(180)" />
          <path d="M0,0 Q -11,-10 0,-24 Q 11,-10 0,0 Z" fill="#C9A46A" transform="rotate(270)" />
        </g>
      </svg>
      {showWordmark && <span className="font-display text-2xl font-bold tracking-tight text-bone">Lucky</span>}
    </div>
  );
}
