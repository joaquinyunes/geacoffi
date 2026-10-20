/** Logo GeaCofi: rana en trazo oliva sobre crema, sosteniendo una taza. */
export default function Logo({ size = 38 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label="Logo de GeaCofi">
      <circle cx="50" cy="50" r="48" fill="#f1e7d8" />
      <g fill="none" stroke="#46531c" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 44c-5-9 2-19 11-14 5-3 25-3 30 0 9-5 16 5 11 14" />
        <path d="M26 46c0 12 10 20 24 20s24-8 24-20" />
        <path d="M33 38h10M57 38h10" />
        <path d="M40 55c6 3 14 3 20 0" />
        <path d="M36 72c-4 8 4 14 14 14s18-6 14-14" />
        <path d="M40 68h20v6c0 4-4 7-10 7s-10-3-10-7z" fill="#f1e7d8" />
        <path d="M46 62c-2-3 2-4 0-7M54 62c-2-3 2-4 0-7" strokeWidth="2.2" />
      </g>
    </svg>
  )
}
