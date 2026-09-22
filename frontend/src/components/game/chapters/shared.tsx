import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import NPCDialogue from "@/components/game/NPCDialogue";
import VoiceBriefing from "@/components/game/VoiceBriefing";
import { apiPost } from "@/lib/api";
import type { MissionContent } from "@/lib/missions";
import type { MissionCompleteResult } from "@/types";
import { cn } from "@/lib/utils";

export function useCompleteTask(missionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { taskKey: string; answers?: Record<string, string> }) =>
      apiPost<MissionCompleteResult>(`/missions/${missionId}/complete`, {
        task_key: vars.taskKey,
        answers: vars.answers ?? {},
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["missions"] });
      qc.invalidateQueries({ queryKey: ["mission-progress", missionId] });
      qc.invalidateQueries({ queryKey: ["session"] });
      if (data.xp_awarded > 0) {
        toast.success(`+${data.xp_awarded} XP — Seviye ${data.level}: ${data.level_title}`, { id: "xp" });
      }
      for (const b of data.badges_awarded) {
        toast(`${b.icon} Yeni rozet: ${b.name}`, { description: b.desc, duration: 6000, id: `badge-${b.id}` });
      }
    },
    onError: () => toast.error("Görev adımı kaydedilemedi, tekrar dene."),
  });
}

export function TaskSection({
  id,
  title,
  done,
  children,
  hint,
}: {
  id: string;
  title: string;
  done: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <section
      className={cn(
        "hud-frame glass rounded-md border p-4 transition-colors",
        done ? "border-primary/40" : "border-border",
      )}
      data-testid={`task-section-${id}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-heading text-base text-foreground">
          {done && <Check size={16} className="text-primary" aria-hidden />}
          {title}
        </h3>
        {done && (
          <span className="rounded-sm bg-primary/15 px-2 py-0.5 font-mono text-[10px] text-primary" data-testid={`task-done-label-${id}`}>
            TAMAMLANDI
          </span>
        )}
      </div>
      {hint && !done && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      <div className={cn("mt-3", done && "opacity-80")}>{children}</div>
    </section>
  );
}

export function EvidenceFileList({
  files,
  onOpenedAll,
  openedLabel,
}: {
  files: MissionContent["evidenceFiles"];
  onOpenedAll?: () => void;
  openedLabel?: string;
}) {
  const [opened, setOpened] = useState<Set<string>>(new Set());

  function handleOpen(id: string, open: boolean) {
    setOpened((prev) => {
      const next = new Set(prev);
      if (open) next.add(id);
      else next.delete(id);
      if (onOpenedAll && next.size === files.length) onOpenedAll();
      return next;
    });
  }

  return (
    <div className="space-y-2" data-testid="evidence-files">
      {files.map((f) => (
        <details
          key={f.id}
          onToggle={(e) => handleOpen(f.id, (e.target as HTMLDetailsElement).open)}
          className="group rounded-lg border border-white/5 bg-black/30 p-3 open:border-amber-500/40 hover-lift"
          data-testid={`evidence-file-${f.id}`}
        >
          <summary className="flex cursor-pointer items-center justify-between gap-2 font-mono text-xs text-amber-400">
            <span>
              {f.title}
              {opened.has(f.id) && <span className="ml-2 text-primary">· incelendi</span>}
            </span>
            <ChevronDown size={14} className="shrink-0 transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          {f.tag && (
            <p className="mt-2 inline-block secret-stamp rounded-none px-2 py-0.5 font-mono text-[10px]">{f.tag}</p>
          )}
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/90">{f.body}</p>
        </details>
      ))}
      {openedLabel && opened.size === files.length && (
        <p className="font-mono text-[11px] text-primary" data-testid="evidence-files-all-opened">{openedLabel}</p>
      )}
    </div>
  );
}

export function ChapterShell({ content, tasksDone = [], children }: { content: MissionContent; tasksDone?: string[]; children: React.ReactNode }) {
  return (
    <div className="space-y-6" data-testid="chapter-shell">
      <header className="hud-frame hud-ticks glass glass-amber p-5" data-testid="chapter-header">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-xs tracking-widest text-amber-400">GÖREV {content.code}</p>
          {(content.scientist || content.year) && (
            <p className="font-mono text-xs text-amber-300">
              {content.scientist}
              {content.year ? ` · ${content.year}` : ""}
            </p>
          )}
        </div>
        <h1 className="mt-2 font-heading text-3xl text-primary text-glow">{content.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{content.subtitle}</p>
        <div className="mt-3">
          <VoiceBriefing
            text={`Görev ${content.code}. ${content.title}. ${content.subtitle}. ${content.story.join(" ")} Görev hedefleri: ${content.objectives.join(". ")}.`}
            label="Sesli brifingi dinle"
          />
        </div>
        <div className="mt-4 space-y-2">
          {content.story.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-foreground/90">
              {p}
            </p>
          ))}
        </div>
        <div className="mt-4 rounded-sm border border-border bg-[#060A10] p-3">
          <p className="font-mono text-[10px] tracking-widest text-amber-300">GÖREV HEDEFLERİ</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
            {content.objectives.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </div>
      </header>

      {content.npc && (
        <NPCSection content={content} tasksDone={tasksDone} />
      )}

      {children}
    </div>
  );
}

function NPCSection({ content, tasksDone }: { content: MissionContent; tasksDone: string[] }) {
  const complete = useCompleteTask(content.id);
  const [fired, setFired] = useState(false);
  const npc = content.npc!;
  const alreadyDone = tasksDone.includes("npc-diyalog");
  return (
    <TaskSection id="npc-diyalog" title="NPC Diyalogu — Sokratik Sorgulama" done={alreadyDone || fired} hint="NPC sana soru sorar; doğru cevabı seçmek yerine gerekçeni kur.">
      <NPCDialogue
        npc={npc}
        onComplete={() => {
          if (fired || alreadyDone) return;
          setFired(true);
          if (npc.name === "Ernest Rutherford") return; // ch4 NPC is part of cikarim flow
          complete.mutate({ taskKey: "npc-diyalog", answers: { npc: npc.name } });
        }}
      />
    </TaskSection>
  );
}

export function OrderChainTask({
  id,
  steps,
  done,
  onComplete,
  resetLabel = "Sıralamayı sıfırla",
}: {
  id: string;
  steps: string[];
  done: boolean;
  onComplete: () => void;
  resetLabel?: string;
}) {
  const [order, setOrder] = useState<number[]>([]);
  const completedRef = useRef(false);
  const correct = order.length === steps.length && order.every((v, i) => v === i);

  useEffect(() => {
    if (correct && !done && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  }, [correct, done, onComplete]);

  function pick(i: number) {
    if (order.includes(i)) return;
    const next = [...order, i];
    setOrder(next);
  }

  return (
    <div data-testid={`order-chain-${id}`}>
      <div className="flex flex-wrap gap-2">
        {steps.map((s, i) => {
          const pos = order.indexOf(i);
          return (
            <button
              key={s}
              onClick={() => pick(i)}
              disabled={pos >= 0 || done}
              className={cn(
                "flex items-center gap-2 rounded-sm border p-2 text-left text-xs transition-colors",
                pos >= 0 ? "border-primary/60 bg-primary/10 text-primary" : "border-border bg-secondary/40 text-foreground/85 hover:border-primary/40",
              )}
              data-testid={`order-step-${id}-${i}`}
            >
              <span className="font-mono text-[10px] text-muted-foreground">{pos >= 0 ? `${pos + 1}.` : "·"}</span>
              {s}
            </button>
          );
        })}
      </div>
      {order.length > 0 && !done && (
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => setOrder([])} data-testid={`order-reset-${id}`}>
          {resetLabel}
        </Button>
      )}
      {order.length > 0 && !correct && (
        <p className="mt-2 text-xs text-amber-400" data-testid={`order-hint-${id}`}>
          Kanıtlar modelleri hangi sırayla zorladı? Bir kez daha düşün.
        </p>
      )}
      {correct && (
        <p className="mt-2 font-mono text-xs text-primary" data-testid={`order-correct-${id}`}>
          ✓ Zincir doğru kuruldu!
        </p>
      )}
    </div>
  );
}
