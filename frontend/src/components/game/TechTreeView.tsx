import { Link } from "react-router-dom";
import { Atom, Check, Lock, Sparkles } from "lucide-react";
import { SCIENTIST_LABELS } from "@/lib/missions";
import type { MissionStatus } from "@/types";
import { cn } from "@/lib/utils";

// §8 — Scientific Evolution Tree: locked / discoverable / completed nodes, chained by evidence.
const NODES = [
  { scientist: "dalton", mission: "dalton-dosyasi", shift: "Bölünemez küre — kimyasal oranları açıklıyor" },
  { scientist: "thomson", mission: "thomson-izi", shift: "Elektron keşfi — küre içinde gömülü yükler" },
  { scientist: "rutherford", mission: "rutherford-operasyonu", shift: "Boşluk atom + küçük yoğun çekirdek" },
  { scientist: "bohr", mission: "bohr-sirri", shift: "Belirli enerji düzeyleri — çizgi spektrumu" },
  { scientist: "chadwick", mission: "chadwick-dosyasi", shift: "Nötron — çekirdek yapısı tamamlandı" },
];

export default function TechTreeView({ missions }: { missions: MissionStatus[] }) {
  const byMission = new Map(missions.map((m) => [m.id, m]));

  return (
    <div className="mx-auto max-w-2xl" data-testid="tech-tree">
      {NODES.map(({ scientist, mission, shift }, i) => {
        const status = byMission.get(mission)?.status ?? "locked";
        const prevDone = i === 0 ? true : byMission.get(NODES[i - 1].mission)?.status === "completed";
        const state = status === "completed" ? "completed" : prevDone ? "discoverable" : "locked";
        const unlocked = state !== "locked";

        return (
          <div key={scientist}>
            {i > 0 && (
              <div className="flex justify-center py-1" aria-hidden>
                <div
                  className={cn(
                    "h-8 w-px",
                    state === "completed" ? "bg-primary" : "bg-border",
                  )}
                />
              </div>
            )}
            <Link
              to={unlocked ? `/gorevler/${mission}` : "/gorevler"}
              aria-disabled={!unlocked}
              onClick={(e) => {
                if (!unlocked) e.preventDefault();
              }}
              className={cn(
                "group flex items-center gap-4 hud-frame glass rounded-md border p-4 transition-all duration-200 hover-lift",
                state === "completed" && "border-primary/50 bg-primary/5 glow-terminal",
                state === "discoverable" && "border-amber-500/40 bg-[#111827] hover:border-amber-400",
                state === "locked" && "border-border bg-card opacity-60",
              )}
              data-testid={`tech-node-${scientist}`}
            >
              <span
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border",
                  state === "completed" && "border-primary text-primary",
                  state === "discoverable" && "border-amber-500 text-amber-400",
                  state === "locked" && "border-border text-muted-foreground",
                )}
              >
                {state === "completed" ? (
                  <Check size={20} aria-hidden />
                ) : state === "discoverable" ? (
                  <Sparkles size={20} aria-hidden />
                ) : (
                  <Lock size={18} aria-hidden />
                )}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-heading text-lg text-foreground">
                  <Atom size={15} className="text-amber-400" aria-hidden />
                  {SCIENTIST_LABELS[scientist]}
                  <span
                    className={cn(
                      "rounded-sm px-1.5 py-0.5 font-mono text-[10px]",
                      state === "completed" && "bg-primary/15 text-primary",
                      state === "discoverable" && "bg-amber-500/15 text-amber-400",
                      state === "locked" && "bg-secondary text-muted-foreground",
                    )}
                    data-testid={`tech-node-status-${scientist}`}
                  >
                    {state === "completed" ? "TAMAMLANDI" : state === "discoverable" ? "KEŞFEDİLEBİLİR" : "KİLİTLİ"}
                  </span>
                </p>
                <p className="truncate text-xs text-muted-foreground">{shift}</p>
                {byMission.get(mission)?.year && (
                  <p className="mt-0.5 font-mono text-[10px] text-amber-300">{byMission.get(mission)?.year}</p>
                )}
              </div>
            </Link>
          </div>
        );
      })}
      <p className="mt-6 text-center font-mono text-xs text-muted-foreground" data-testid="tech-tree-note">
        Bir sonraki düğüm, ilgili bilimsel kanıt görevi tamamlanınca açılır.
      </p>
    </div>
  );
}
