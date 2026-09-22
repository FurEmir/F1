import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Crosshair, Zap } from "lucide-react";

// §B04 — interactive gold-foil chamber: fire alphas, watch the detection screen, place observations.
interface VolleyResult {
  straight: number;
  small: number;
  back: number;
}

const OBSERVATIONS = [
  { id: "obs-mostly-straight", label: "Parçacıkların büyük çoğunluğu levhadan düz geçti" },
  { id: "obs-small-deflection", label: "Bazı parçacıklar levha içinde küçük açılarla saptı" },
  { id: "obs-back-scatter", label: "Az sayıda parçacık (~1/8000) büyük açıyla geri döndü" },
];

export default function RutherfordSim({
  simDone,
  evidenceDone,
  onSimComplete,
  onEvidencePlaced,
}: {
  simDone: boolean;
  evidenceDone: boolean;
  onSimComplete: () => void;
  onEvidencePlaced: () => void;
}) {
  const [counts, setCounts] = useState<VolleyResult>({ straight: 0, small: 0, back: 0 });
  const [total, setTotal] = useState(0);
  const [particles, setParticles] = useState<{ id: number; angle: number; back: boolean; small: boolean }[]>([]);
  const [placed, setPlaced] = useState<string[]>([]);
  const seq = useRef(0);

  function fire(volume: number) {
    // proportion per 8000: ~7986 straight, ~13 small deflection, ~1 back
    const unit = volume / 8000;
    const back = Math.floor(unit * (Math.random() < 0.5 ? 1 : 1)) > 0 ? Math.max(0, Math.round(unit)) : 0;
    const small = Math.max(0, Math.round(unit * 13 * (0.8 + Math.random() * 0.4)));
    const straight = volume - back - small;
    const result = { straight, small, back };
    setCounts((c) => ({ straight: c.straight + straight, small: c.small + small, back: c.back + back }));
    setTotal((t) => t + volume);

    // animated visible sample (~8 dots)
    const dots = Array.from({ length: 8 }).map(() => {
      seq.current += 1;
      const roll = Math.random();
      return {
        id: seq.current,
        angle: roll < 0.125 ? (Math.random() * 30 + 130) : (Math.random() * 24 - 12),
        back: false,
        small: roll >= 0.125 && roll < 0.3,
      };
    });
    if (volume >= 8000 && Math.random() < 0.9) {
      seq.current += 1;
      dots.push({ id: seq.current, angle: 150 + Math.random() * 20, back: true, small: false });
    }
    setParticles((p) => [...p, ...dots]);
    setTimeout(() => {
      setParticles((p) => p.filter((d) => !dots.some((dot) => dot.id === d.id)));
    }, 1400);

    const newTotal = total + volume;
    if (newTotal >= 8000 && !simDone) {
      onSimComplete();
      toast.success("Tarama tamamlandı: 8000 alfa parçacığı izlendi. Gözlemleri panoya yerleştir.", {
        id: "sim-complete",
      });
    } else {
      toast.info(`${volume.toLocaleString("tr-TR")} parçacık gönderildi`, { id: "volley" });
    }
  }

  const canPlace = total >= 8000;

  function place(obsId: string) {
    if (!canPlace) {
      toast.warning("Önce en az 8000 parçacıklık taramayı çalıştır.");
      return;
    }
    if (placed.includes(obsId)) return;
    const next = [...placed, obsId];
    setPlaced(next);
    if (next.length === OBSERVATIONS.length) onEvidencePlaced();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="hud-frame hud-ticks glass glass-cyan p-4 scanlines" data-testid="rutherford-chamber">
        <p className="font-mono text-xs tracking-widest text-amber-300">SAÇILMA ODASI // ALTIN LEVHA DENEYİ</p>
        <div className="relative mt-4 h-56 overflow-hidden rounded-sm border border-amber-500/20 bg-black/60">
          {/* alpha source */}
          <div className="absolute left-2 top-1/2 -translate-y-1/2 rounded-sm border border-amber-500/60 px-2 py-1 font-mono text-[10px] text-amber-400">
            α KAYNAK
          </div>
          {/* gold foil */}
          <div className="absolute left-1/2 top-1/2 h-40 w-1 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-300" aria-hidden />
          <span className="absolute left-1/2 top-2 -translate-x-1/2 font-mono text-[10px] text-amber-300">Au levha</span>
          {/* detector arc */}
          <div className="absolute inset-2 rounded-full border border-primary/20" aria-hidden />

          {particles.map((p) => (
            <span
              key={p.id}
              className="absolute left-4 top-1/2 h-1.5 w-1.5 rounded-full bg-primary"
              style={{
                animation: `fade-up 1.3s ease-out forwards`,
                transform: `translateY(-50%)`,
                ["--travel" as string]: "1",
              }}
              ref={(el) => {
                if (!el) return;
                const parent = el.parentElement;
                if (!parent) return;
                const w = parent.clientWidth - 24;
                const rad = (p.angle * Math.PI) / 180;
                const dx = Math.cos(rad) * w;
                const dy = Math.sin(rad) * w;
                el.animate(
                  [
                    { transform: "translate(0, -50%)" },
                    { transform: `translate(${dx}px, ${dy - 0}px)` },
                  ],
                  { duration: 1200, easing: "ease-out", fill: "forwards" },
                );
              }}
              aria-hidden
            />
          ))}

          {!simDone && (
            <p className="absolute bottom-2 right-3 font-mono text-[10px] text-muted-foreground" data-testid="rutherford-shot-counter">
              Toplam parçacık: {total.toLocaleString("tr-TR")} / 8.000
            </p>
          )}
          {simDone && (
            <p className="absolute bottom-2 right-3 flex items-center gap-1 font-mono text-[10px] text-primary" data-testid="rutherford-sim-done-label">
              <Check size={12} aria-hidden /> Tarama tamamlandı
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => fire(100)} data-testid="rutherford-fire-100-button">
            <Zap size={14} aria-hidden /> Alfa ışını gönder (×100)
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fire(8000 - total > 0 ? 8000 - total : 0)}
            disabled={total >= 8000}
            data-testid="rutherford-scan-all-button"
          >
            <Crosshair size={14} aria-hidden /> Kütle taraması (kalanını ×8.000'e tamamla)
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center" data-testid="rutherford-counters">
          <div className="rounded-sm border border-border bg-secondary/50 p-2">
            <p className="font-mono text-lg text-primary" data-testid="counter-straight">{counts.straight.toLocaleString("tr-TR")}</p>
            <p className="text-[11px] text-muted-foreground">düz geçen</p>
          </div>
          <div className="rounded-sm border border-border bg-secondary/50 p-2">
            <p className="font-mono text-lg text-amber-400" data-testid="counter-small">{counts.small.toLocaleString("tr-TR")}</p>
            <p className="text-[11px] text-muted-foreground">küçük sapma</p>
          </div>
          <div className="rounded-sm border border-border bg-secondary/50 p-2">
            <p className="font-mono text-lg text-red-400" data-testid="counter-back">{counts.back.toLocaleString("tr-TR")}</p>
            <p className="text-[11px] text-muted-foreground">geri yansıyan</p>
          </div>
        </div>
      </div>

      <div className="hud-frame glass glass-amber p-4" data-testid="rutherford-evidence-mini-board">
        <p className="font-mono text-xs tracking-widest text-amber-400">KANIT PANOSU — GÖZLEMLER</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Gözlem kartlarını sürükleyip panoya bırakın veya tıklayarak yerleştirin.
        </p>
        <div className="mt-3 space-y-2">
          {OBSERVATIONS.map((o) => {
            const isPlaced = placed.includes(o.id);
            return (
              <button
                key={o.id}
                onClick={() => place(o.id)}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", o.id)}
                onDrop={(e) => {
                  e.preventDefault();
                  place(e.dataTransfer.getData("text/plain") || o.id);
                }}
                onDragOver={(e) => e.preventDefault()}
                className={`flex w-full items-center gap-2 rounded-sm border p-2 text-left text-xs transition-colors ${
                  isPlaced
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-border bg-secondary/40 text-foreground/80 hover:border-primary/40"
                }`}
                data-testid={`observation-chip-${o.id}`}
              >
                {isPlaced ? <Check size={13} aria-hidden /> : <Crosshair size={13} aria-hidden />}
                {o.label}
              </button>
            );
          })}
        </div>
        {evidenceDone && (
          <p className="mt-3 font-mono text-[11px] text-primary" data-testid="rutherford-evidence-done-label">
            ✓ Tüm gözlemler panoda
          </p>
        )}
      </div>
    </div>
  );
}
