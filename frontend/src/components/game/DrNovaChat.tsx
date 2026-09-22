import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Lock, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiDelete, apiGet, streamSSE } from "@/lib/api";
import type { MentorMessage } from "@/types";

const SUGGESTIONS = [
  "Rutherford atomun çoğunun boşluk olduğunu nereden anladı?",
  "Atom Güneş sistemi gibidir demiştim, doğru mu?",
  "Dalton'un modeli neden değişti?",
  "Rutherford deneyini açıkla.",
];

export default function DrNovaChat() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [local, setLocal] = useState<MentorMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const history = useQuery({
    queryKey: ["mentor-history"],
    queryFn: () => apiGet<MentorMessage[]>("/mentor/history"),
  });

  const messages = [...(history.data ?? []), ...local];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, streaming]);

  const clear = useMutation({
    mutationFn: () => apiDelete<{ ok: boolean }>("/mentor/history"),
    onSuccess: () => {
      setLocal([]);
      qc.invalidateQueries({ queryKey: ["mentor-history"] });
      toast.success("Konuşma geçmişi silindi.");
    },
  });

  async function send(text: string) {
    const message = text.trim();
    if (!message || streaming) return;
    setDraft("");
    setStreaming(true);
    const stamp = new Date().toISOString();
    setLocal((l) => [
      ...l,
      { id: `s-${Date.now()}`, role: "student", text: message, created_at: stamp },
      { id: `m-${Date.now()}`, role: "mentor", text: "", created_at: stamp },
    ]);
    try {
      await streamSSE("/mentor/chat", { message }, (delta) => {
        setLocal((l) => {
          const copy = [...l];
          const last = copy[copy.length - 1];
          if (last?.role === "mentor") last.text += delta;
          return copy;
        });
      });
      qc.invalidateQueries({ queryKey: ["mentor-history"] });
      setLocal([]);
    } catch {
      toast.error("Dr. Nova'ya ulaşılamadı. Bağlantını kontrol edip tekrar dene.");
      setLocal([]);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="flex h-[calc(100svh-220px)] min-h-[480px] flex-col hud-frame hud-ticks glass glass-cyan" data-testid="mentor-chat">
      <div className="flex items-center justify-between border-b border-amber-500/20 px-4 py-3">
        <div>
          <p className="font-heading text-base text-primary text-glow" data-testid="mentor-title">Dr. Nova — Bilimsel Sorgulama Mentoru</p>
          <p className="font-mono text-[11px] text-muted-foreground">
            Doğrudan cevap vermem; sana sorular sorarım. Kanıtla ilerle.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => clear.mutate()}
          disabled={clear.isPending}
          data-testid="mentor-clear-history-button"
          aria-label="Konuşma geçmişini sil"
        >
          <Trash2 size={14} aria-hidden /> Geçmişi sil
        </Button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4" data-testid="mentor-messages" aria-live="polite">
        {messages.length === 0 && (
          <div className="rounded-sm border border-border bg-card/60 p-4 text-sm text-muted-foreground" data-testid="mentor-empty-state">
            <p className="font-mono text-xs text-amber-300">DR. NOVA PROTOKOLÜ</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Sana hazır cevap vermem — sorularla düşündürürüm.</li>
              <li>Kanıtını ister, gerekçeni sorgularım.</li>
              <li>Kimya ve bilim tarihi dışına çıkmam; kişisel bilgi istemem.</li>
              <li>Konuşmalarını dilediğin an silebilirsin (yukarıdaki buton).</li>
            </ul>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={`${m.id}-${i}`}
            className={`max-w-[85%] rounded-md border p-3 text-sm leading-relaxed ${
              m.role === "student"
                ? "ml-auto border-primary/30 bg-primary/10"
                : "border-amber-500/25 bg-[#0B1420]"
            }`}
            data-testid={`mentor-message-${m.role}`}
          >
            <p className="mb-1 font-mono text-[10px] text-muted-foreground">
              {m.role === "student" ? "SEN" : "DR. NOVA"}
            </p>
            <p className="whitespace-pre-wrap text-foreground/90">
              {m.text}
              {m.role === "mentor" && streaming && i === messages.length - 1 && (
                <span className="animate-blink text-primary">▊</span>
              )}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-amber-500/20 p-3">
        <div className="mb-2 flex flex-wrap gap-1.5" data-testid="mentor-suggestions">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={streaming}
              className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
              data-testid={`mentor-suggestion-${SUGGESTIONS.indexOf(s)}`}
            >
              {s}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Dr. Nova'ya sorunu yaz… (kişisel bilgi paylaşma)"
            maxLength={2000}
            aria-label="Mentora mesaj"
            data-testid="mentor-input"
          />
          <Button type="submit" disabled={streaming || !draft.trim()} data-testid="mentor-send-button" aria-label="Gönder">
            <Send size={15} aria-hidden />
          </Button>
        </form>
        <p className="mt-2 flex items-center gap-1 font-mono text-[10px] text-muted-foreground" data-testid="mentor-privacy-note">
          <Lock size={10} aria-hidden />
          Konuşmalar yalnızca öğrenme desteği için tutulur; dilediğin an silabilirsin. Kişisel veri gönderme.
        </p>
      </div>
    </div>
  );
}
