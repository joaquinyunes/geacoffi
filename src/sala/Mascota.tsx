import { useEffect, useState } from 'react'

/** Escribe la frase letra por letra (se monta de nuevo con cada frase). El texto completo queda oculto para lectores de pantalla. */
function Globo({ frase }: { frase: string }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setN((v) => (v >= frase.length ? (clearInterval(id), v) : v + 1)), 22)
    return () => clearInterval(id)
  }, [frase])
  return (
    <div className="globo" role="status">
      <span className="sr-only">{frase}</span>
      <span aria-hidden="true">{frase.slice(0, n)}</span>
    </div>
  )
}

/** Taza con ojo que guía el recorrido, con su globo de diálogo. */
export default function Mascota({ frase }: { frase: string }) {
  return (
    <div className="mascota">
      <Globo key={frase} frase={frase} />
      <svg key={`taza-${frase}`} className="taza" viewBox="0 0 130 150" width="104" height="120" aria-hidden="true">
        <g fill="none" stroke="#17122b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M50 22c-5-6 5-9 0-15M70 22c-5-6 5-9 0-15" strokeWidth="3" />
          <path d="M96 52c26-2 24 22 14 30-5 4-14 5-20 4" strokeWidth="9" stroke="#17122b" />
          <path d="M96 52c26-2 24 22 14 30-5 4-14 5-20 4" strokeWidth="3" stroke="#e5392b" />
          <path d="M28 34h64l-6 54q-3 14-26 14T34 88z" fill="#e5392b" />
          <ellipse cx="60" cy="34" rx="32" ry="9" fill="#ff8a7a" />
          <ellipse cx="60" cy="34" rx="25" ry="5.5" fill="#5a2a14" />
          <ellipse cx="60" cy="68" rx="19" ry="15" fill="#fff" />
          <circle cx="60" cy="68" r="9" fill="#5646d9" />
          <circle cx="60" cy="68" r="4" fill="#17122b" stroke="none" />
          <circle cx="57" cy="65" r="1.8" fill="#fff" stroke="none" />
          <path d="M46 102v14M74 102v14" />
          <path d="M34 124c0-8 14-9 18-4l4 4v6H34z" fill="#5646d9" />
          <path d="M64 124c0-8 14-9 18-4l4 4v6H64z" fill="#5646d9" />
          <path d="M34 134h22M64 134h22" stroke="#fff" strokeWidth="3" />
        </g>
      </svg>
    </div>
  )
}
