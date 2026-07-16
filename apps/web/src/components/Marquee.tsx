export function Marquee({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  const track = [...items, ...items];
  return (
    <div className="relative w-full overflow-hidden" style={{ borderTop: "3px solid var(--ink)", borderBottom: "3px solid var(--ink)", background: "#fff" }}>
      <div
        className={`flex w-max gap-3 py-4 ${reverse ? "animate-marquee-reverse" : "animate-marquee"}`}
      >
        {track.map((item, i) => (
          <span key={i} className="flat-badge whitespace-nowrap shrink-0">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
