/** Cielo nocturno determinista: estrellas blancas + acentos dorados. */
function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rnd = seeded(20260615);

interface Star {
  x: number;
  y: number;
  size: number;
  o: number;
  duration: number;
  delay: number;
  gold: boolean;
}

export const STARS: Star[] = Array.from({ length: 150 }, () => {
  const gold = rnd() > 0.9;
  return {
    x: rnd() * 100,
    y: rnd() * 100,
    size: gold ? 2.4 + rnd() * 1.6 : 0.9 + rnd() * 1.5,
    o: gold ? 0.7 + rnd() * 0.3 : 0.2 + rnd() * 0.55,
    duration: 3.5 + rnd() * 6.5,
    delay: rnd() * 8,
    gold,
  };
});

export function Starfield() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {STARS.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            background: s.gold ? "#f2a93b" : "#f7f4fc",
            boxShadow: s.gold ? "0 0 7px 1px rgba(242,169,59,0.75)" : "0 0 4px rgba(247,244,252,0.55)",
            animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
            ["--o" as string]: s.o,
          }}
        />
      ))}

      {/* cruz de brillo en las estrellas doradas más grandes */}
      {STARS.filter((s) => s.gold).slice(0, 9).map((s, i) => (
        <span
          key={`g-${i}`}
          className="absolute"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            animation: `twinkle ${s.duration * 1.3}s ease-in-out ${s.delay}s infinite`,
            ["--o" as string]: 0.55,
          }}
        >
          <span className="absolute h-[1px] w-[13px] -translate-x-1/2 -translate-y-1/2 bg-gold-400/70" />
          <span className="absolute h-[13px] w-[1px] -translate-x-1/2 -translate-y-1/2 bg-gold-400/70" />
        </span>
      ))}

      {/* estrella fugaz ocasional */}
      <span
        className="absolute top-[16%] left-[8%] h-[1.5px] w-[110px] rounded-full bg-gradient-to-r from-transparent via-mist-100/80 to-transparent"
        style={{ animation: "shootStar 14s ease-in 6s infinite" }}
      />
      <span
        className="absolute top-[38%] left-[54%] h-[1.5px] w-[80px] rounded-full bg-gradient-to-r from-transparent via-gold-300/70 to-transparent"
        style={{ animation: "shootStar 19s ease-in 12s infinite" }}
      />
    </div>
  );
}
