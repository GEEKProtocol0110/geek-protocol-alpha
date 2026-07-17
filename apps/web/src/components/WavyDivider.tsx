// A flat wavy section-transition edge, filled with the color of the section
// that follows it. Sits at the bottom of a colored band.

export function WavyDivider({ fill, flip = false }: { fill: string; flip?: boolean }) {
  return (
    <div className={`w-full leading-[0] ${flip ? "rotate-180" : ""}`} aria-hidden="true">
      <svg
        viewBox="0 0 1440 80"
        className="w-full h-[48px] md:h-[72px] block"
        preserveAspectRatio="none"
      >
        <path
          className="wave-path"
          d="M0,32 C 180,80 360,0 540,24 C 720,48 900,80 1080,56 C 1260,32 1350,16 1440,32 L1440,80 L0,80 Z"
          fill={fill}
        />
      </svg>
    </div>
  );
}
