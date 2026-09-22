import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronRight, Eye, Flag, Play, Timer, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/lib/api";
import type { ArenaAnswer, ArenaOption, ArenaScore, ArenaState } from "@/types";
import { cn } from "@/lib/utils";

const LETTERS: Record<string, string> = { a: "A", b: "B", c: "C", d: "D" };

export function useArenaState(pin: string, enabled = true) {
  return useQuery({
    queryKey: ["arena-state", pin],
    queryFn: () => apiGet<ArenaState>(`/arena/${pin}/state`),
    refetchInterval: 2500,
    enabled: enabled && !!pin,
    retry: false,
  });
}

export function RoundTimer({ startedAt, seconds }: { startedAt: string | null; seconds: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = useMemo(() => {
    if (!startedAt) return seconds;
    const elapsed = (now - new Date(startedAt).getTime()) / 1000;
    return Math.max(0, Math.round(seconds - elapsed));
  }, [now, startedAt, seconds]);
  const pct = Math.max(0, Math.min(100, (left / seconds) * 100));
  return (
    <div className="w-full" data-testid="arena-round-timer">
      <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Timer size={12} aria-hidden /> KALAN SÜRE
        </span>
        <span className={cn(left <= 15 ? "text-destructive" : "text-primary")}>
          {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full transition-[width] duration-1000", left <= 15 ? "bg-destructive" : "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function Scoreboard({ rows, highlight }: { rows: ArenaState["scoreboard"]; highlight?: string }) {
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className="space-y-1.5" data-testid="arena-scoreboard">
      {rows.length === 0 && <p className="text-xs text-muted-foreground">Henüz puan yok.</p>}
      {rows.slice(0, 10).map((r: ArenaScore) => (
        <div
          key={r.code}
          className={cn(
            "flex items-center gap-3 rounded-lg border p-2.5 transition-colors",
            r.code === highlight ? "border-orange-400/60 bg-primary/10" : "border-white/5 bg-black/25",
          )}
          data-testid={`arena-score-${r.code}`}
        >
          <span className="w-7 shrink-0 text-center font-mono text-sm text-amber-300">
            {r.rank <= 3 ? medals[r.rank - 1] : r.rank}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-foreground">{r.nickname ?? r.code}</p>
            <p className="font-mono text-[10px] text-muted-foreground">
              {r.code} · {r.correct}/{r.answers} doğru kanıt
            </p>
          </div>
          <span className="shrink-0 font-heading text-lg text-primary">{r.score}</span>
        </div>
      ))}
    </div>
  );
}

/** Host-side round controller shown on the smartboard. */
export function HostRoundView({ pin, state }: { pin: string; state: ArenaState }) {
  const qc = useQueryClient();
  const round = state.current_round;
  const finished = state.status === "finished";

  const act = useMutation({
    mutationFn: (action: "reveal" | "next") => apiPost<ArenaState>(`/arena/${pin}/${action}`),
    onSuccess: (s) => {
      qc.setQueryData(["arena-state", pin], s);
      if (s.status === "finished") toast.success("Arena tamamlandı — final sıralaması hazır.");
    },
    onError: () => toast.error("İşlem yapılamadı."),
  });

  if (finished) {
    return (
      <div className="hud-frame hud-ticks glass glass-amber p-6 text-center" data-testid="arena-finished">
        <Trophy size={34} className="mx-auto text-amber-300" aria-hidden />
        <h2 className="mt-3 font-heading text-3xl text-primary text-glow">ARENA TAMAMLANDI</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {state.total_rounds} tur oynandı · {state.players.length} dedektif katıldı
        </p>
        <div className="mx-auto mt-6 max-w-lg text-left">
          <Scoreboard rows={state.scoreboard} />
        </div>
      </div>
    );
  }

  if (!round) return null;
  const revealing = state.status === "reveal";

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <section className="hud-frame hud-ticks jigsaw-edge glass glass-emerald p-6" data-testid="arena-host-round">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-[11px] tracking-[0.3em] text-amber-300 text-glow-amber">
            {round.code} / {state.total_rounds} — {round.scientist}
          </p>
          <Badge variant="outline" className="font-mono text-[10px]">
            {revealing ? "KANIT ÇÖZÜMLEMESİ" : "TUR AÇIK"}
          </Badge>
        </div>
        <h2 className="mt-2 font-heading text-2xl text-primary text-glow sm:text-3xl">{round.title}</h2>
        <p className="mt-3 rounded-lg border border-white/5 bg-black/30 p-3 text-sm text-foreground/85">
          {round.prompt}
        </p>
        <p className="mt-3 font-heading text-lg text-foreground" data-testid="arena-host-question">
          {round.question}
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {round.options.map((o: ArenaOption) => {
            const isCorrect = revealing && round.correct === o.id;
            return (
              <div
                key={o.id}
                className={cn(
                  "flex items-start gap-2 rounded-lg border p-3 text-sm",
                  isCorrect ? "border-orange-400/70 bg-primary/15 text-foreground" : "border-white/5 bg-black/25 text-foreground/80",
                )}
                data-testid={`arena-host-option-${o.id}`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-amber-500/40 font-mono text-[11px] text-amber-300">
                  {LETTERS[o.id] ?? o.id.toUpperCase()}
                </span>
                <span>{o.text}</span>
                {isCorrect && <CheckCircle2 size={15} className="ml-auto shrink-0 text-primary" aria-hidden />}
              </div>
            );
          })}
        </div>

        {!revealing && (
          <div className="mt-4">
            <RoundTimer startedAt={state.round_started_at} seconds={round.seconds} />
          </div>
        )}

        {revealing && (
          <div className="mt-4 rounded-lg border border-orange-500/30 bg-primary/5 p-4" data-testid="arena-host-explanation">
            <p className="font-mono text-[10px] tracking-widest text-primary">KANIT ÇÖZÜMLEMESİ</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/90">{round.explanation}</p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground" data-testid="arena-answers-count">
            <Users size={13} aria-hidden /> Sunulan kanıt: {state.answers_count}/{state.players.length}
          </span>
          <div className="ml-auto flex gap-2">
            {!revealing ? (
              <Button onClick={() => act.mutate("reveal")} disabled={act.isPending} className="jigsaw-btn font-heading" data-testid="arena-reveal-button">
                <Eye size={15} aria-hidden /> KANITI AÇIKLA
              </Button>
            ) : (
              <Button onClick={() => act.mutate("next")} disabled={act.isPending} className="jigsaw-btn font-heading" data-testid="arena-next-button">
                {state.round_index + 1 >= state.total_rounds ? (
                  <>
                    <Flag size={15} aria-hidden /> ARENAYI BİTİR
                  </>
                ) : (
                  <>
                    SONRAKİ TUR <ChevronRight size={15} aria-hidden />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {revealing && state.round_answers.length > 0 && (
          <div className="mt-5" data-testid="arena-host-submissions">
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground">
              DEDEKTİF GEREKÇELERİ (öğrenme kanıtı)
            </p>
            <div className="mt-2 max-h-64 space-y-2 overflow-y-auto pr-1">
              {state.round_answers.map((a: ArenaAnswer, i: number) => (
                <div key={`${a.code}-${i}`} className="rounded-lg border border-white/5 bg-black/25 p-2.5" data-testid={`arena-answer-${a.code}`}>
                  <p className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-amber-300">{a.nickname ?? a.code}</span>
                    <span className={cn(a.correct ? "text-primary" : "text-destructive")}>
                      {LETTERS[a.choice] ?? a.choice} {a.correct ? "✓" : "✗"}
                    </span>
                    <span className="ml-auto text-muted-foreground">+{a.points}</span>
                  </p>
                  {a.justification && (
                    <p className="mt-1 text-[11px] italic leading-snug text-muted-foreground">“{a.justification}”</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <aside className="hud-frame hud-ticks glass glass-cyan p-5" data-testid="arena-host-scoreboard">
        <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] text-amber-300">
          <Trophy size={13} aria-hidden /> DEDEKTİF SIRALAMASI
        </p>
        <div className="mt-4">
          <Scoreboard rows={state.scoreboard} />
        </div>
        <p className="mt-4 border-t border-white/5 pt-3 text-[10px] leading-relaxed text-muted-foreground">
          Sıralama doğru kanıt + gerekçe kalitesi + hız ile hesaplanır. Öğrencilerin açık uçlu
          cevapları yalnızca öğretmen ekranında görünür.
        </p>
      </aside>
    </div>
  );
}

/** Student-side: submit evidence + justification, then see feedback. */
export function PlayerRoundView({ pin, state, myCode }: { pin: string; state: ArenaState; myCode: string }) {
  const qc = useQueryClient();
  const [choice, setChoice] = useState<string | null>(null);
  const [justification, setJustification] = useState("");
  const round = state.current_round;

  useEffect(() => {
    setChoice(null);
    setJustification("");
  }, [state.round_index]);

  const submit = useMutation({
    mutationFn: () => apiPost<ArenaState>(`/arena/${pin}/answer`, { choice, justification }),
    onSuccess: (s) => {
      qc.setQueryData(["arena-state", pin], s);
      toast.success("Kanıtın sunuldu! Öğretmenin açıklamasını bekle.");
    },
    onError: (err: unknown) => {
      const detail = (err as { body?: { detail?: string } })?.body?.detail;
      toast.error(detail ?? "Kanıt sunulamadı.");
    },
  });

  if (state.status === "finished") {
    const mine = state.scoreboard.find((r: ArenaScore) => r.code === myCode);
    return (
      <div className="hud-frame hud-ticks glass glass-amber p-6 text-center" data-testid="arena-player-finished">
        <Trophy size={32} className="mx-auto text-amber-300" aria-hidden />
        <h2 className="mt-3 font-heading text-2xl text-primary text-glow">Arena tamamlandı!</h2>
        {mine && (
          <p className="mt-2 text-sm text-muted-foreground">
            Sıran: <span className="font-mono text-primary">{mine.rank}</span> · Puanın:{" "}
            <span className="font-mono text-primary">{mine.score}</span> · Doğru kanıt: {mine.correct}/{mine.answers}
          </p>
        )}
        <div className="mx-auto mt-5 max-w-sm text-left">
          <Scoreboard rows={state.scoreboard} highlight={myCode} />
        </div>
      </div>
    );
  }

  if (state.status === "open" || !round) {
    return (
      <div className="hud-frame hud-ticks glass glass-emerald p-6 text-center" data-testid="arena-player-waiting">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-orange-500/40">
          <Play size={20} className="animate-pulse text-primary" aria-hidden />
        </span>
        <h2 className="mt-3 font-heading text-xl text-foreground">Turun başlaması bekleniyor</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Akıllı tahtaya bak — öğretmen ilk turu başlattığında soru burada görünecek.
        </p>
        <p className="mt-3 font-mono text-[11px] text-muted-foreground">
          Bağlanan dedektif: {state.players.length} · Oda {state.pin}
        </p>
      </div>
    );
  }

  const answered = !!state.my_answer;
  const revealing = state.status === "reveal";

  return (
    <div className="space-y-4">
      <section className="hud-frame hud-ticks jigsaw-edge glass glass-emerald p-5" data-testid="arena-player-round">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-[11px] tracking-[0.25em] text-amber-300">
            {round.code} / {state.total_rounds}
          </p>
          <Badge variant="outline" className="font-mono text-[10px]">
            {revealing ? "ÇÖZÜMLEME" : answered ? "KANIT SUNULDU" : "SIRA SENDE"}
          </Badge>
        </div>
        <h2 className="mt-2 font-heading text-xl text-primary text-glow">{round.title}</h2>
        <p className="mt-2 rounded-lg border border-white/5 bg-black/30 p-3 text-xs text-foreground/85">{round.prompt}</p>
        <p className="mt-3 text-sm font-medium text-foreground" data-testid="arena-player-question">{round.question}</p>

        {!revealing && !answered && (
          <div className="mt-3">
            <RoundTimer startedAt={state.round_started_at} seconds={round.seconds} />
          </div>
        )}

        <div className="mt-4 space-y-2">
          {round.options.map((o: ArenaOption) => {
            const picked = choice === o.id || state.my_answer?.choice === o.id;
            const isCorrect = revealing && round.correct === o.id;
            return (
              <button
                key={o.id}
                onClick={() => !answered && !revealing && setChoice(o.id)}
                disabled={answered || revealing}
                className={cn(
                  "flex w-full items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all",
                  isCorrect && "border-orange-400/70 bg-primary/15",
                  !isCorrect && picked && "border-amber-400/60 bg-amber-500/10",
                  !isCorrect && !picked && "border-white/5 bg-black/25 hover:border-orange-400/40",
                )}
                data-testid={`arena-option-${o.id}`}
                aria-pressed={picked}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-amber-500/40 font-mono text-[11px] text-amber-300">
                  {LETTERS[o.id] ?? o.id.toUpperCase()}
                </span>
                <span className="text-foreground/90">{o.text}</span>
                {isCorrect && <CheckCircle2 size={15} className="ml-auto shrink-0 text-primary" aria-hidden />}
              </button>
            );
          })}
        </div>

        {!answered && !revealing && (
          <div className="mt-4 space-y-3">
            <div>
              <label htmlFor="arena-justification" className="font-mono text-[10px] tracking-widest text-muted-foreground">
                GEREKÇEN (kanıt → çıkarım) · ek puan
              </label>
              <textarea
                id="arena-justification"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={3}
                maxLength={1200}
                placeholder="Bu kanıt modelin hangi varsayımını zorluyor? Gözlemden çıkarıma nasıl gidiyorsun?"
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 p-2.5 text-sm text-foreground outline-none focus:border-orange-400/60"
                data-testid="arena-justification-input"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                {justification.trim().length}/40 karakter (ek puan için en az 40)
              </p>
            </div>
            <Button
              className="jigsaw-btn w-full font-heading tracking-wider"
              disabled={!choice || submit.isPending}
              onClick={() => submit.mutate()}
              data-testid="arena-submit-answer-button"
            >
              {submit.isPending ? "SUNULUYOR…" : "KANITI SUN"}
            </Button>
          </div>
        )}

        {answered && (
          <div
            className={cn(
              "mt-4 rounded-lg border p-3",
              revealing
                ? state.my_answer?.correct
                  ? "border-orange-400/60 bg-primary/10"
                  : "border-destructive/50 bg-destructive/10"
                : "border-white/10 bg-black/30",
            )}
            data-testid="arena-my-result"
          >
            {revealing ? (
              <>
                <p className="font-heading text-base text-foreground">
                  {state.my_answer?.correct ? "✓ Doğru kanıt!" : "✗ Bu kanıt modeli zorlamıyor"}
                </p>
                <p className="mt-1 font-mono text-xs text-primary">+{state.my_answer?.points ?? 0} puan</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{round.explanation}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Kanıtın kaydedildi. Öğretmen çözümlemeyi açıkladığında sonucu göreceksin.
              </p>
            )}
            {state.my_notes.length > 0 && (
              <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[11px] text-amber-200/85">
                {state.my_notes.map((n: string) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <section className="hud-frame glass glass-cyan p-4">
        <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] text-amber-300">
          <Trophy size={13} aria-hidden /> SIRALAMA
        </p>
        <div className="mt-3">
          <Scoreboard rows={state.scoreboard} highlight={myCode} />
        </div>
      </section>
    </div>
  );
}
