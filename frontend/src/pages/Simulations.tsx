import { useState } from "react";
import { Link } from "react-router-dom";
import { Atom, ExternalLink, Maximize2, Radio, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SIMULATIONS } from "@/lib/simulations";
import { cn } from "@/lib/utils";

const ACCENT = {
  emerald: { glass: "glass-emerald", text: "text-primary", dot: "bg-emerald-400" },
  cyan: { glass: "glass-cyan", text: "text-cyan-300", dot: "bg-cyan-400" },
  amber: { glass: "glass-amber", text: "text-amber-400", dot: "bg-amber-400" },
} as const;

export default function Simulations() {
  const [active, setActive] = useState(SIMULATIONS[0]);
  const accent = ACCENT[active.accent];

  return (
    <div>
      <header className="animate-fade-up">
        <p className="font-mono text-xs tracking-[0.3em] text-amber-400 text-glow-amber">
          DENEY KONSOLU // CANLI SİMÜLASYON BAĞLANTISI
        </p>
        <h1 className="mt-2 font-heading text-3xl text-primary text-glow sm:text-4xl" data-testid="simulations-title">
          SİMÜLASYONLAR
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Doğrudan gözlemlenemeyen atom yapısını etkileşimli simülasyonlarla incele. Aşağıdaki deneyler
          PhET Interactive Simulations üzerinden <strong className="text-foreground">canlı olarak</strong> gömülüdür —
          pasif video değil, kendin çalıştırdığın gerçek deney düzenekleridir.
        </p>
      </header>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_360px]">
        {/* live console */}
        <section className={cn("hud-frame hud-ticks glass overflow-hidden", accent.glass)} data-testid="simulation-console">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 px-5 py-3">
            <div className="flex items-center gap-2">
              <span className={cn("h-2 w-2 animate-pulse rounded-full", accent.dot)} aria-hidden />
              <p className="font-mono text-[11px] tracking-widest text-muted-foreground">
                CANLI DENEY — {active.experiment.toUpperCase()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a href={active.src} target="_blank" rel="noopener noreferrer">
                <Button size="xs" variant="outline" data-testid="simulation-fullscreen-button">
                  <Maximize2 size={12} aria-hidden /> Tam ekran aç
                </Button>
              </a>
              {active.missionId && (
                <Link to={`/gorevler/${active.missionId}`}>
                  <Button size="xs" data-testid="simulation-goto-mission-button">
                    <Target size={12} aria-hidden /> İlgili göreve git
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="px-5 pt-4">
            <h2 className={cn("font-heading text-xl", accent.text)} data-testid="simulation-active-title">
              {active.title}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {active.scientist} · {active.duration}
            </p>
          </div>

          {/* the embedded interactive simulation */}
          <div className="relative m-5 overflow-hidden rounded-xl border border-teal-500/30 bg-black/60 glow-holo">
            <iframe
              key={active.id}
              src={active.src}
              title={active.title}
              width="100%"
              height="600"
              scrolling="no"
              allowFullScreen
              loading="lazy"
              className="block h-[420px] w-full rounded-xl sm:h-[520px] lg:h-[600px]"
              data-testid={`simulation-iframe-${active.id}`}
            />
          </div>

          {/* Socratic inquiry prompt */}
          <div className="mx-5 mb-5 rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-4" data-testid="simulation-inquiry">
            <p className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-primary">
              <Radio size={12} aria-hidden /> DEDEKTİF SORUSU
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">{active.inquiry}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Gözlemini not al, sonra Kanıt Panosu'na yerleştir veya Dr. Nova ile tartış.
            </p>
          </div>

          <div className="mx-5 mb-5 rounded-lg border border-white/5 bg-black/30 p-3">
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground">KAYNAK / LİSANS</p>
            <p className="mt-1 text-[11px] text-foreground/80">{active.source}</p>
            <p className="text-[11px] text-amber-400/80">{active.license}</p>
            <a
              href="https://phet.colorado.edu"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-[11px] text-sky-400 hover:underline"
              data-testid="simulation-source-link"
            >
              phet.colorado.edu <ExternalLink size={10} aria-hidden />
            </a>
          </div>
        </section>

        {/* mission-style selector */}
        <aside className="space-y-3" data-testid="simulation-list">
          <p className="font-mono text-[11px] tracking-widest text-muted-foreground">DENEY SEÇ ({SIMULATIONS.length})</p>
          {SIMULATIONS.map((s) => {
            const a = ACCENT[s.accent];
            const selected = s.id === active.id;
            return (
              <button
                key={s.id}
                onClick={() => setActive(s)}
                className={cn(
                  "hover-lift w-full rounded-xl p-4 text-left glass",
                  selected ? a.glass : "border-white/5 hover:border-white/15",
                )}
                data-testid={`simulation-card-${s.id}`}
                aria-pressed={selected}
              >
                <div className="flex items-start gap-2">
                  <Atom size={15} className={cn("mt-0.5 shrink-0", a.text)} aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm leading-snug text-foreground">{s.title}</p>
                    <p className={cn("mt-0.5 text-[11px]", a.text)}>{s.scientist} · {s.experiment}</p>
                    <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{s.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">⏱ {s.duration}</Badge>
                      {selected && (
                        <Badge className="text-[10px]" data-testid={`simulation-active-badge-${s.id}`}>
                          KONSOLDA
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
          <p className="rounded-lg border border-white/5 bg-black/30 p-3 text-[10px] leading-relaxed text-muted-foreground">
            Telifli içerik uygulama içinde barındırılmaz; simülasyonlar açık lisanslı (CC-BY) kaynaktan
            canlı olarak gömülür. Her kartta kaynak ve lisans bilgisi yer alır.
          </p>
        </aside>
      </div>
    </div>
  );
}
