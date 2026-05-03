import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Infinity as Inf, Disc3, ArrowRight } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Vinyl } from "@/components/game/vinyl";
import { allSongs, albums } from "@/lib/game-data";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RAP GUESSER — zgaduj polskie rapowe tracki" },
      { name: "description", content: "Daily, Endless i tryb Album. Zgaduj polski rap po krótkich samplach." },
    ],
  }),
  component: Index,
});

const MODES = [
  { to: "/daily", label: "Daily", desc: "Jeden track dziennie. Ten sam dla wszystkich.", icon: Calendar },
  { to: "/endless", label: "Endless", desc: "Bez końca. Ile trafień pod rząd?", icon: Inf },
  { to: "/albums", label: "Albumy", desc: "Wybierz album, zgadnij każdy track.", icon: Disc3 },
] as const;

function Index() {
  const total = allSongs().length;
  const albCount = albums().length;
  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Hero */}
        <section className="grid md:grid-cols-2 gap-8 md:gap-12 items-center py-10 sm:py-16 md:py-24">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="text-xs font-mono uppercase tracking-[0.3em] text-ink-muted mb-6"
            >
              Polski rap · Edycja 2026
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="font-display text-4xl sm:text-5xl md:text-7xl leading-[0.95] tracking-tight"
            >
              Zgadnij<br/>z <span className="text-primary">pół sekundy</span>.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
              className="mt-6 text-lg text-ink-muted max-w-md"
            >
              Krótki sample, sześć prób, żadnej okładki. Trafisz?
              {" "}<span className="text-ink">{total}</span> tracków,
              {" "}<span className="text-ink">{albCount}</span> albumów.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="mt-10 flex flex-wrap gap-3"
            >
              <Link to="/daily" className="inline-flex items-center gap-2 px-6 h-12 rounded-full bg-ink text-paper font-medium hover:opacity-90 transition">
                Zagraj dzisiejsze <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/endless" className="inline-flex items-center gap-2 px-6 h-12 rounded-full border border-hairline hover:border-ink transition">
                Endless
              </Link>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -12 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex justify-center order-first md:order-last"
          >
            <div className="sm:hidden"><Vinyl spinning size={240} /></div>
            <div className="hidden sm:block"><Vinyl spinning size={360} /></div>
          </motion.div>
        </section>

        {/* Modes */}
        <section className="py-12 sm:py-16 border-t border-hairline">
          <div className="flex items-end justify-between mb-6 sm:mb-10">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl">Tryby gry</h2>
            <span className="text-xs font-mono text-ink-muted">03 / TRYBY</span>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {MODES.map((m, i) => (
              <Link
                key={m.to}
                to={m.to}
                className="group relative bg-card border border-hairline rounded-3xl p-7 hover:border-ink transition-all hover:-translate-y-1 hover:shadow-lift"
              >
                <div className="flex items-start justify-between mb-12">
                  <m.icon className="h-7 w-7 text-primary" />
                  <span className="text-xs font-mono text-ink-muted">0{i+1}</span>
                </div>
                <h3 className="font-display text-2xl mb-2">{m.label}</h3>
                <p className="text-sm text-ink-muted">{m.desc}</p>
                <ArrowRight className="absolute bottom-6 right-6 h-5 w-5 opacity-0 group-hover:opacity-100 group-hover:-translate-x-0 -translate-x-2 transition" />
              </Link>
            ))}
          </div>
        </section>

        <footer className="py-12 border-t border-hairline mt-16 flex justify-between text-xs font-mono text-ink-muted">
          <span>RAP GUESSER · v2</span>
          <span>{total} tracków · {albCount} albumów</span>
        </footer>
      </main>
    </div>
  );
}
