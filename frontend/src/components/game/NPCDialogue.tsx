import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { NpcScript } from "@/lib/missions";

// NPC scientists never lecture — they answer with questions (Socratic dialogue, §9).
export default function NPCDialogue({ npc, onComplete }: { npc: NpcScript; onComplete?: () => void }) {
  const [turnIdx, setTurnIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const turn = npc.turns[turnIdx];
  const option = turn?.options.find((o) => o.text === chosen);

  function choose(text: string) {
    setChosen(text);
  }

  function next() {
    setChosen(null);
    if (turnIdx + 1 < npc.turns.length) {
      setTurnIdx((i) => i + 1);
    } else {
      setFinished(true);
      onComplete?.();
    }
  }

  if (finished) {
    return (
      <div className="hud-frame glass glass-cyan p-4" data-testid="npc-dialogue-closing">
        <p className="font-mono text-xs text-cyan-300">
          {npc.emoji} {npc.name} — kapanış notu
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground/90">{npc.closing}</p>
      </div>
    );
  }

  return (
    <div className="hud-frame glass glass-cyan p-4" data-testid="npc-dialogue">
      <p className="font-mono text-xs text-cyan-300">
        {npc.emoji} {npc.name} · {npc.role}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-foreground" data-testid="npc-dialogue-question">
        “{turn.question}”
      </p>

      {!chosen && (
        <div className="mt-4 grid gap-2" role="group" aria-label="NPC yanıt seçenekleri">
          {turn.options.map((o) => (
            <Button
              key={o.text}
              variant="outline"
              size="sm"
              className="justify-start text-left"
              onClick={() => choose(o.text)}
              data-testid={`npc-option-${turn.options.indexOf(o)}`}
            >
              {o.text}
            </Button>
          ))}
        </div>
      )}

      {option && (
        <div className="mt-4 rounded-sm border border-primary/30 bg-primary/5 p-3 animate-fade-up" data-testid="npc-dialogue-feedback">
          <p className="text-sm leading-relaxed text-foreground/90">“{option.feedback}”</p>
          <Button size="sm" className="mt-3" onClick={next} data-testid="npc-dialogue-continue-button">
            {turnIdx + 1 < npc.turns.length ? "Devam et" : "Diyaloğu tamamla"}
          </Button>
        </div>
      )}
    </div>
  );
}
