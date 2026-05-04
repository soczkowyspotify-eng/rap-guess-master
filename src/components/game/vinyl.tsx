import { motion } from "framer-motion";

export function Vinyl({ spinning, cover, size = 280 }: { spinning?: boolean; cover?: string; size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* outer glow / rim — sprawia że płyta odkleja się od tła w obu motywach */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          boxShadow:
            "0 0 0 1px color-mix(in oklab, var(--ink) 18%, transparent), 0 30px 60px -30px color-mix(in oklab, var(--primary) 55%, transparent), 0 10px 30px -10px oklch(0 0 0 / 0.5)",
        }}
      />
      <motion.div
        animate={{ rotate: spinning ? 360 : 0 }}
        transition={spinning
          ? { duration: 4, repeat: Infinity, ease: "linear" }
          : { duration: 0.6, ease: "easeOut" }}
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, var(--vinyl) 38%, color-mix(in oklab, var(--vinyl) 70%, white 12%) 39%, var(--vinyl) 40%, color-mix(in oklab, var(--vinyl) 75%, white 10%) 55%, var(--vinyl) 56%, color-mix(in oklab, var(--vinyl) 78%, white 8%) 75%, var(--vinyl) 76%)",
          boxShadow: "var(--shadow-lift), inset 0 0 60px oklch(0 0 0 / 0.55), inset 0 0 0 1px oklch(1 0 0 / 0.04)",
        }}
      >
        {/* groove rings */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="absolute inset-0 rounded-full border" style={{
            margin: `${10 + i * 6}%`,
            borderColor: "oklch(1 0 0 / 0.07)",
          }} />
        ))}
        {/* center label */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden"
             style={{ width: "32%", height: "32%", boxShadow: "0 0 0 4px oklch(0 0 0 / 0.4)" }}>
          {cover ? (
            <img src={cover} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-vinyl" />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
