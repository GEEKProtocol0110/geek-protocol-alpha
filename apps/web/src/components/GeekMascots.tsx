// Flat, thick-outlined mascot illustrations for the landing page.
// Deliberately solid-fill only (no <linearGradient>/<radialGradient> defs).

const INK = "#14141a";

export function GigaMascot({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 400"
      className={className}
      role="img"
      aria-label="GIGA, the Geek Protocol mascot robot"
    >
      {/* shadow */}
      <ellipse cx="180" cy="378" rx="120" ry="16" fill={INK} opacity="0.12" />

      {/* legs */}
      <rect x="120" y="300" width="34" height="60" rx="10" fill="#fff" stroke={INK} strokeWidth="4" />
      <rect x="206" y="300" width="34" height="60" rx="10" fill="#fff" stroke={INK} strokeWidth="4" />
      <rect x="108" y="352" width="58" height="20" rx="9" fill="#f7941d" stroke={INK} strokeWidth="4" />
      <rect x="194" y="352" width="58" height="20" rx="9" fill="#f7941d" stroke={INK} strokeWidth="4" />

      {/* torso */}
      <rect x="80" y="176" width="200" height="132" rx="26" fill="#f7941d" stroke={INK} strokeWidth="5" />
      <rect x="112" y="204" width="60" height="44" rx="12" fill="#fff7e8" stroke={INK} strokeWidth="4" />
      <rect x="188" y="204" width="60" height="44" rx="12" fill="#fff7e8" stroke={INK} strokeWidth="4" />
      <circle cx="142" cy="226" r="10" fill="#2bb673" stroke={INK} strokeWidth="3" />
      <circle cx="218" cy="226" r="10" fill="#6c3ef5" stroke={INK} strokeWidth="3" />
      <rect x="140" y="266" width="80" height="16" rx="8" fill="#fff7e8" stroke={INK} strokeWidth="3.5" />

      {/* arms */}
      <rect x="46" y="196" width="34" height="88" rx="16" fill="#f7941d" stroke={INK} strokeWidth="5" />
      <rect x="280" y="196" width="34" height="88" rx="16" fill="#f7941d" stroke={INK} strokeWidth="5" />
      <circle cx="63" cy="292" r="17" fill="#fff7e8" stroke={INK} strokeWidth="4" />
      <circle cx="297" cy="292" r="17" fill="#fff7e8" stroke={INK} strokeWidth="4" />

      {/* head */}
      <rect x="100" y="56" width="160" height="120" rx="30" fill="#ffd84d" stroke={INK} strokeWidth="5" />
      <rect x="126" y="86" width="108" height="58" rx="18" fill="#14141a" />
      <circle cx="160" cy="115" r="15" fill="#fff7e8" />
      <circle cx="200" cy="115" r="15" fill="#fff7e8" />
      <circle cx="160" cy="115" r="6" fill={INK} />
      <circle cx="200" cy="115" r="6" fill={INK} />
      <rect x="150" y="152" width="60" height="10" rx="5" fill={INK} opacity="0.85" />

      {/* antenna */}
      <rect x="174" y="24" width="12" height="34" rx="6" fill={INK} />
      <circle cx="180" cy="18" r="14" fill="#f04e3e" stroke={INK} strokeWidth="4" />
    </svg>
  );
}

export function AceMascot({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 400"
      className={className}
      role="img"
      aria-label="A.C.E., the Geek Protocol AI quizmaster"
    >
      <ellipse cx="180" cy="378" rx="120" ry="16" fill={INK} opacity="0.12" />

      {/* legs */}
      <rect x="122" y="298" width="32" height="62" rx="10" fill="#fff" stroke={INK} strokeWidth="4" />
      <rect x="206" y="298" width="32" height="62" rx="10" fill="#fff" stroke={INK} strokeWidth="4" />
      <rect x="110" y="352" width="56" height="20" rx="9" fill="#6c3ef5" stroke={INK} strokeWidth="4" />
      <rect x="194" y="352" width="56" height="20" rx="9" fill="#6c3ef5" stroke={INK} strokeWidth="4" />

      {/* torso: hexagon-ish stacked plates */}
      <rect x="76" y="182" width="208" height="126" rx="28" fill="#6c3ef5" stroke={INK} strokeWidth="5" />
      <rect x="108" y="204" width="144" height="30" rx="10" fill="#eee6ff" stroke={INK} strokeWidth="3.5" />
      <rect x="108" y="244" width="60" height="42" rx="12" fill="#eee6ff" stroke={INK} strokeWidth="3.5" />
      <rect x="192" y="244" width="60" height="42" rx="12" fill="#eee6ff" stroke={INK} strokeWidth="3.5" />
      <circle cx="138" cy="265" r="8" fill="#f7941d" stroke={INK} strokeWidth="2.5" />
      <circle cx="222" cy="265" r="8" fill="#2bb673" stroke={INK} strokeWidth="2.5" />

      {/* arms */}
      <rect x="42" y="198" width="34" height="84" rx="16" fill="#6c3ef5" stroke={INK} strokeWidth="5" />
      <rect x="284" y="198" width="34" height="84" rx="16" fill="#6c3ef5" stroke={INK} strokeWidth="5" />
      <circle cx="59" cy="286" r="16" fill="#eee6ff" stroke={INK} strokeWidth="4" />
      <circle cx="301" cy="286" r="16" fill="#eee6ff" stroke={INK} strokeWidth="4" />

      {/* head: single scanning visor */}
      <rect x="96" y="60" width="168" height="112" rx="32" fill="#eee6ff" stroke={INK} strokeWidth="5" />
      <rect x="120" y="96" width="120" height="42" rx="21" fill="#14141a" />
      <rect x="132" y="112" width="96" height="10" rx="5" fill="#2bb673" />
      <circle cx="180" cy="150" r="5" fill={INK} opacity="0.6" />

      {/* antenna, twin orbs */}
      <rect x="132" y="30" width="10" height="32" rx="5" fill={INK} />
      <rect x="218" y="30" width="10" height="32" rx="5" fill={INK} />
      <circle cx="137" cy="24" r="11" fill="#2bb673" stroke={INK} strokeWidth="3.5" />
      <circle cx="223" cy="24" r="11" fill="#f04e3e" stroke={INK} strokeWidth="3.5" />
    </svg>
  );
}
