export function Waveform({ progress, playing }: { progress: number; playing: boolean }) {
  // 48 prętów, deterministycznie wysokie
  const bars = Array.from({ length: 48 }, (_, i) => {
    const seed = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    return 0.25 + Math.abs(seed) * 0.75;
  });
  return (
    <div className="flex items-center gap-[2px] h-12 w-full">
      {bars.map((h, i) => {
        const filled = i / bars.length <= progress;
        return (
          <div
            key={i}
            className={`flex-1 rounded-full transition-colors ${filled ? "bg-primary" : "bg-hairline"}`}
            style={{
              height: `${h * 100}%`,
              transform: playing && filled ? `scaleY(${0.85 + (i % 4) * 0.05})` : undefined,
              transition: "background-color 80ms, transform 200ms",
            }}
          />
        );
      })}
    </div>
  );
}
