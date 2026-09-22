import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, GripVertical, X } from "lucide-react";
import { apiGet, apiPut } from "@/lib/api";
import { EB_FIELD_LABELS, SCIENTIST_LABELS } from "@/lib/missions";
import type { EvidenceBoardState, EvidenceCardOut } from "@/types";
import { cn } from "@/lib/utils";

const SCIENTISTS = ["dalton", "thomson", "rutherford", "bohr", "chadwick"] as const;
const FIELDS = ["varsayim", "kanit", "acikliyor", "zorlanıyor", "sonraki"] as const;

export default function EvidenceBoardGrid() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);

  const pool = useQuery({ queryKey: ["evidence-pool"], queryFn: () => apiGet<EvidenceCardOut[]>("/evidence-board/pool") });
  const board = useQuery({ queryKey: ["evidence-board"], queryFn: () => apiGet<EvidenceBoardState>("/evidence-board") });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["evidence-board"] });
    qc.invalidateQueries({ queryKey: ["session"] });
    qc.invalidateQueries({ queryKey: ["missions"] });
  };

  const put = useMutation({
    mutationFn: (vars: { scientist: string; field: string; cardId: string | null }) =>
      apiPut<EvidenceBoardState>("/evidence-board", {
        scientist_id: vars.scientist,
        field: vars.field,
        card_id: vars.cardId,
      }),
    onSuccess: (data, vars) => {
      invalidate();
      if (vars.cardId && data.completed_rows.includes(vars.scientist)) {
        toast.success(`${SCIENTIST_LABELS[vars.scientist]} satırı doğru kuruldu! +30 XP`, { id: "eb-row" });
      } else if (vars.cardId) {
        toast("Kart yerleştirildi. Satır tamamlanınca XP kazanacaksın.", { id: "eb-place" });
      }
    },
    onError: () => toast.error("Kart yerleştirilemedi."),
  });

  const placements = board.data?.placements ?? {};
  const placedIds = useMemo(
    () => new Set(Object.values(placements).flatMap((row) => Object.values(row))),
    [placements],
  );
  const freeCards = (pool.data ?? []).filter((c) => !placedIds.has(c.id));

  function placeCard(scientist: string, field: string, cardId: string) {
    setSelected(null);
    put.mutate({ scientist, field, cardId });
  }

  function clearCell(scientist: string, field: string) {
    put.mutate({ scientist, field, cardId: null });
  }

  if (pool.isLoading || board.isLoading) {
    return <p className="font-mono text-sm text-primary" data-testid="evidence-board-loading">KANIT PANOSU YÜKLENİYOR<span className="animate-blink">▊</span></p>;
  }

  const completedRows = board.data?.completed_rows ?? [];

  return (
    <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
      {/* card pool */}
      <aside className="hud-frame glass glass-amber p-4" data-testid="evidence-card-pool">
        <p className="font-mono text-xs tracking-widest text-amber-400">KART HAVUZU ({freeCards.length})</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Bir kartı seç, sonra doğru hücreye tıkla — ya da sürükle bırak.
        </p>
        <div className="mt-3 max-h-[540px] space-y-2 overflow-y-auto pr-1">
          {freeCards.map((c) => (
            <button
              key={c.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/plain", c.id)}
              onClick={() => setSelected(c.id === selected ? null : c.id)}
              className={cn(
                "flex w-full items-start gap-2 rounded-sm border p-2 text-left text-xs leading-snug transition-colors",
                selected === c.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-secondary/40 text-foreground/85 hover:border-primary/40",
              )}
              data-testid={`evidence-card-${c.id}`}
            >
              <GripVertical size={13} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
              <span>{c.text}</span>
            </button>
          ))}
          {freeCards.length === 0 && (
            <p className="text-xs text-primary" data-testid="evidence-pool-empty">Tüm kartlar panoda. Harika iş, dedektif!</p>
          )}
        </div>
      </aside>

      {/* matrix */}
      <div className="overflow-x-auto hud-frame glass p-4" data-testid="evidence-matrix">
        <table className="w-full min-w-[860px] border-collapse text-xs">
          <caption className="sr-only">Bilimsel kanıt panosu: bilim insanları ve model bilgileri</caption>
          <thead>
            <tr>
              <th scope="col" className="w-32 border-b border-border p-2 text-left font-mono text-[11px] text-muted-foreground">
                BİLİM İNSANI
              </th>
              {FIELDS.map((f) => (
                <th key={f} scope="col" className="border-b border-border p-2 text-left font-mono text-[11px] text-amber-400">
                  {EB_FIELD_LABELS[f].toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SCIENTISTS.map((s) => {
              const rowDone = completedRows.includes(s);
              return (
                <tr key={s} className={rowDone ? "bg-primary/5" : undefined}>
                  <th scope="row" className="border-b border-border/60 p-2 text-left align-top">
                    <span className={cn("font-mono text-[12px]", rowDone ? "text-primary" : "text-foreground")}>
                      {rowDone && <Check size={11} className="mr-1 inline" aria-hidden />}
                      {SCIENTIST_LABELS[s]}
                    </span>
                  </th>
                  {FIELDS.map((f) => {
                    const cardId = placements[s]?.[f];
                    const card = (pool.data ?? []).find((c) => c.id === cardId);
                    return (
                      <td key={f} className="border-b border-border/60 p-1 align-top">
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => selected && !cardId && placeCard(s, f, selected)}
                          onKeyDown={(e) => {
                            if ((e.key === "Enter" || e.key === " ") && selected && !cardId) placeCard(s, f, selected);
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const id = e.dataTransfer.getData("text/plain");
                            if (id) placeCard(s, f, id);
                          }}
                          className={cn(
                            "flex min-h-[72px] items-start justify-between gap-1 rounded-sm border p-1.5 transition-colors",
                            cardId
                              ? "border-primary/40 bg-primary/10"
                              : "border-dashed border-border bg-[#1A2234]/60 hover:border-sky-400/60",
                          )}
                          data-testid={`evidence-cell-${s}-${f}`}
                          aria-label={`${SCIENTIST_LABELS[s]} — ${EB_FIELD_LABELS[f]} hücresi`}
                        >
                          {card ? (
                            <>
                              <span className="text-[11px] leading-snug text-foreground/90">{card.text}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearCell(s, f);
                                }}
                                className="shrink-0 text-muted-foreground hover:text-destructive"
                                aria-label="Kartı kaldır"
                                data-testid={`evidence-cell-clear-${s}-${f}`}
                              >
                                <X size={12} aria-hidden />
                              </button>
                            </>
                          ) : (
                            <span className="m-auto text-[10px] text-muted-foreground">+</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-3 font-mono text-[11px] text-muted-foreground" data-testid="evidence-board-progress">
          Tamamlanan satır: {completedRows.length}/5 · Kazanılan XP: {board.data?.xp_earned ?? 0}
        </p>
      </div>
    </div>
  );
}
