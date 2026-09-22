import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Radio, ScanLine, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiGet, apiPost } from "@/lib/api";
import type { ArenaJoinResult, ArenaRoom, UserProfile } from "@/types";
import { PlayerRoundView, useArenaState } from "@/components/game/ArenaRound";

// Student-side QR landing: /arena/:pin — auto-joins the hosted room, then waits for the host.
export default function ArenaJoin({ user }: { user: UserProfile }) {
  const { pin = "" } = useParams();

  const join = useMutation({
    mutationFn: () => apiPost<ArenaJoinResult>(`/arena/${pin}/join`),
  });

  const lobby = useQuery({
    queryKey: ["arena-lobby", pin],
    queryFn: () => apiGet<ArenaRoom>(`/arena/${pin}/lobby`),
    refetchInterval: 4000,
    retry: false,
  });

  useEffect(() => {
    if (pin) join.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const failed = join.isError || lobby.isError;
  const count = lobby.data?.players.length ?? 0;
  const live = useArenaState(pin, join.isSuccess && !failed);

  // once the host starts, the student plays the round in-place
  if (join.isSuccess && !failed && live.data && live.data.status !== "open") {
    return (
      <div className="mx-auto max-w-xl" data-testid="arena-join">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-[11px] tracking-[0.25em] text-amber-300">ARENA · ODA {pin}</p>
          <p className="font-mono text-[11px] text-muted-foreground">{user.code}</p>
        </div>
        <PlayerRoundView pin={pin} state={live.data} myCode={user.code} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl" data-testid="arena-join">
      <div className="hud-frame hud-ticks glass glass-emerald p-6 text-center">
        <p className="font-mono text-[11px] tracking-[0.3em] text-amber-400">ARENA BAĞLANTISI</p>

        {join.isPending && (
          <div className="mt-6" data-testid="arena-join-pending">
            <Loader2 size={28} className="mx-auto animate-spin text-primary" aria-hidden />
            <p className="mt-3 font-heading text-xl text-foreground">Arenaya sızılıyor…</p>
          </div>
        )}

        {failed && (
          <div className="mt-6" data-testid="arena-join-error">
            <ScanLine size={28} className="mx-auto text-destructive" aria-hidden />
            <p className="mt-3 font-heading text-xl text-foreground">Oda bulunamadı</p>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-mono text-primary">{pin}</span> PIN'li arena kapalı veya hiç açılmamış.
              Akıllı tahtadaki güncel QR kodu tekrar tarat.
            </p>
            <Link to="/">
              <Button variant="outline" size="sm" className="mt-4" data-testid="arena-join-home-button">
                Görev merkezine dön
              </Button>
            </Link>
          </div>
        )}

        {join.isSuccess && !failed && (
          <div className="mt-6 animate-fade-up" data-testid="arena-join-success">
            <CheckCircle2 size={34} className="mx-auto text-primary" aria-hidden />
            <p className="mt-3 font-heading text-2xl text-primary text-glow">Arenadasın, dedektif!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {join.data?.already_joined ? "Zaten bu odaya bağlıydın." : "Bağlantın akıllı tahtada göründü."}
            </p>

            <div className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-3">
              <div className="rounded-xl border border-orange-500/25 bg-black/35 p-3">
                <p className="font-mono text-[10px] tracking-widest text-muted-foreground">ODA</p>
                <p className="mt-1 font-mono text-lg text-primary" data-testid="arena-join-pin">{pin}</p>
              </div>
              <div className="rounded-xl border border-amber-500/25 bg-black/35 p-3">
                <p className="font-mono text-[10px] tracking-widest text-muted-foreground">DEDEKTİF</p>
                <p className="mt-1 font-mono text-lg text-amber-200">{user.code}</p>
              </div>
            </div>

            <p className="mt-5 flex items-center justify-center gap-2 font-mono text-xs text-muted-foreground" data-testid="arena-join-count">
              <Users size={13} aria-hidden /> Bağlanan dedektif: {count}
              <Radio size={12} className="animate-pulse text-primary" aria-hidden />
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Öğretmenin başlatmasını bekle. Bu sırada görev dosyalarına göz atabilirsin.
            </p>
            <Link to="/gorevler">
              <Button size="sm" className="mt-4" data-testid="arena-join-missions-button">
                Görev dosyalarına git
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
