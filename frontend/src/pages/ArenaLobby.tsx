import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { Copy, Link2, Play, Power, QrCode, RefreshCcw, ScanLine, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiGet, apiPost } from "@/lib/api";
import type { ArenaRoom, ArenaState, OkResponse, UserProfile } from "@/types";
import { HostRoundView, useArenaState } from "@/components/game/ArenaRound";
import { cn } from "@/lib/utils";

// AŞAMA 3.5 — smartboard host lobby: big scannable QR target, room PIN, live joins.
export default function ArenaLobby({ user }: { user: UserProfile }) {
  const qc = useQueryClient();
  const seen = useRef<Set<string>>(new Set());
  const [flashing, setFlashing] = useState<Set<string>>(new Set());

  const room = useQuery({
    queryKey: ["arena-room"],
    queryFn: () => apiGet<ArenaRoom | null>("/arena/current"),
    refetchInterval: 3000,
  });

  const create = useMutation({
    mutationFn: () => apiPost<ArenaRoom>("/arena/create"),
    onSuccess: (r) => {
      seen.current = new Set();
      qc.setQueryData(["arena-room"], r);
      toast.success(`Arena açıldı — ODA PİNİ ${r.pin}`);
    },
    onError: () => toast.error("Arena açılamadı."),
  });

  const demoJoin = useMutation({
    mutationFn: (pin: string) => apiPost<ArenaRoom>(`/arena/${pin}/demo-join`),
    onSuccess: (r) => qc.setQueryData(["arena-room"], r),
    onError: () => toast.error("Demo dedektif eklenemedi."),
  });

  const close = useMutation({
    mutationFn: (pin: string) => apiPost<OkResponse>(`/arena/${pin}/close`),
    onSuccess: () => {
      qc.setQueryData(["arena-room"], null);
      toast.success("Arena kapatıldı.");
    },
  });

  const pin = room.data?.pin ?? "";
  const live = useArenaState(pin, !!pin);
  const startRound = useMutation({
    mutationFn: () => apiPost<ArenaState>(`/arena/${pin}/start`),
    onSuccess: (st) => {
      qc.setQueryData(["arena-state", pin], st);
      toast.success("Tur 1 başladı — dedektifler kanıt sunabilir!");
    },
    onError: (err: unknown) => {
      const detail = (err as { body?: { detail?: string } })?.body?.detail;
      toast.error(detail ?? "Tur başlatılamadı.");
    },
  });

  const data = room.data ?? null;
  const players = data?.players ?? [];
  const joinUrl = useMemo(
    () => (data ? `${window.location.origin}/arena/${data.pin}` : ""),
    [data?.pin],
  );

  // glitch/fade-in animation for newly arriving detectives
  useEffect(() => {
    const fresh = players.filter((p) => !seen.current.has(p.code));
    if (fresh.length === 0) return;
    for (const p of fresh) seen.current.add(p.code);
    setFlashing((prev) => {
      const next = new Set(prev);
      for (const p of fresh) next.add(p.code);
      return next;
    });
    const t = setTimeout(() => setFlashing(new Set()), 1400);
    return () => clearTimeout(t);
  }, [players.length]);

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} kopyalandı.`);
    } catch {
      toast.info(text);
    }
  }

  if (!data) {
    return (
      <div className="hud-frame hud-ticks glass glass-emerald p-8 text-center" data-testid="arena-closed-state">
        <ScanLine size={30} className="mx-auto text-primary" aria-hidden />
        <h1 className="mt-3 font-heading text-3xl text-primary text-glow">KUANTUM ARENASI</h1>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          Canlı oyun modu için bir arena odası aç. Ekranda büyük bir QR kod ve oda PİNİ görünür;
          öğrenciler telefon veya tabletleriyle saniyeler içinde katılır.
        </p>
        <Button
          size="lg"
          className="mt-5 font-heading tracking-wider"
          onClick={() => create.mutate()}
          disabled={create.isPending}
          data-testid="arena-create-button"
        >
          <Power size={16} aria-hidden /> {create.isPending ? "AÇILIYOR…" : "ARENAYI BAŞLAT"}
        </Button>
      </div>
    );
  }

  return (
    <div data-testid="arena-lobby">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs tracking-[0.3em] text-amber-400 text-glow-amber">
            AKILLI TAHTA LOBİSİ // CANLI OYUN MODU
          </p>
          <h1 className="mt-1 font-heading text-3xl text-primary text-glow sm:text-4xl">KUANTUM ARENASI</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {live.data?.status === "open" && (
            <Button
              onClick={() => startRound.mutate()}
              disabled={startRound.isPending || players.length === 0}
              className="jigsaw-btn font-heading tracking-wider"
              data-testid="arena-start-round-button"
            >
              <Play size={15} aria-hidden /> {startRound.isPending ? "BAŞLATILIYOR…" : "TURU BAŞLAT"}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => demoJoin.mutate(data.pin)} disabled={demoJoin.isPending} data-testid="arena-demo-join-button">
            <UserPlus size={14} aria-hidden /> Demo dedektif ekle
          </Button>
          <Button size="sm" variant="outline" onClick={() => create.mutate()} data-testid="arena-new-room-button">
            <RefreshCcw size={14} aria-hidden /> Yeni oda
          </Button>
          <Button size="sm" variant="secondary" onClick={() => close.mutate(data.pin)} data-testid="arena-close-button">
            <Power size={14} aria-hidden /> Arenayı kapat
          </Button>
        </div>
      </header>

      {live.data && live.data.status !== "open" ? (
        <div className="mt-5">
          <HostRoundView pin={data.pin} state={live.data} />
        </div>
      ) : (
      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* scanner target */}
        <section className="hud-frame hud-ticks glass glass-cyan scanlines p-6 text-center" data-testid="arena-qr-panel">
          <p className="font-mono text-[11px] tracking-[0.3em] text-amber-300">TARAYICI HEDEFİ</p>

          <div className="relative mx-auto mt-5 w-fit">
            {/* neon scanner frame */}
            <div className="absolute -inset-5 rounded-2xl border border-amber-400/30 shadow-[0_0_60px_-10px_rgba(255,194,51,0.65)]" aria-hidden />
            <div className="absolute -inset-5 rounded-2xl border border-orange-400/20 animate-pulse-ring" aria-hidden />
            {[
              "left-0 top-0 border-l-4 border-t-4 rounded-tl-lg",
              "right-0 top-0 border-r-4 border-t-4 rounded-tr-lg",
              "left-0 bottom-0 border-l-4 border-b-4 rounded-bl-lg",
              "right-0 bottom-0 border-r-4 border-b-4 rounded-br-lg",
            ].map((pos) => (
              <span key={pos} className={cn("absolute h-10 w-10 border-orange-400/80", pos)} aria-hidden />
            ))}

            <div className="relative overflow-hidden rounded-xl bg-white p-5">
              <QRCode
                value={joinUrl || "https://bilim-kirilma.preview.emergentagent.com"}
                size={232}
                bgColor="#FFFFFF"
                fgColor="#04160F"
                level="M"
                data-testid="arena-qr-code"
              />
              <div className="pointer-events-none absolute inset-x-0 h-10 animate-scan bg-gradient-to-b from-transparent via-orange-500/35 to-transparent" aria-hidden />
            </div>
          </div>

          <p className="mt-6 font-heading text-2xl text-primary text-glow sm:text-3xl" data-testid="arena-scan-cta">
            Arenaya Sızmak İçin Tarat
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Telefonunun kamerasını QR koda tut — dedektif kodunla saniyeler içinde katıl.
          </p>

          <div className="mx-auto mt-6 grid max-w-xl gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-orange-500/25 bg-black/35 p-4">
              <p className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground">ODA PİNİ</p>
              <p className="mt-1 font-mono text-3xl tracking-[0.2em] text-primary" data-testid="arena-room-pin">
                {data.pin}
              </p>
              <Button size="xs" variant="ghost" className="mt-1" onClick={() => copy(data.pin, "Oda PİNİ")} data-testid="arena-copy-pin-button">
                <Copy size={11} aria-hidden /> PIN'i kopyala
              </Button>
            </div>
            <div className="rounded-xl border border-amber-500/25 bg-black/35 p-4">
              <p className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground">KISA BAĞLANTI</p>
              <p className="mt-1 break-all font-mono text-xs text-amber-200" data-testid="arena-join-url">
                {joinUrl.replace(/^https?:\/\//, "")}
              </p>
              <Button size="xs" variant="ghost" className="mt-1" onClick={() => copy(joinUrl, "Bağlantı")} data-testid="arena-copy-link-button">
                <Link2 size={11} aria-hidden /> Bağlantıyı kopyala
              </Button>
            </div>
          </div>

          <p className="mt-4 font-mono text-[10px] text-muted-foreground">
            QR kod yalnızca oda bağlantısını taşır; kişisel veri içermez.
          </p>
        </section>

        {/* connected detectives */}
        <aside className="hud-frame hud-ticks glass glass-emerald p-5" data-testid="arena-players-panel">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] text-primary">
              <Users size={13} aria-hidden /> BAĞLANAN DEDEKTİFLER
            </p>
            <Badge className="font-mono" data-testid="arena-player-count">
              {players.length}
            </Badge>
          </div>

          <div className="mt-4 space-y-2" aria-live="polite">
            {players.length === 0 && (
              <div className="rounded-lg border border-dashed border-white/10 bg-black/25 p-4 text-center" data-testid="arena-players-empty">
                <QrCode size={22} className="mx-auto text-muted-foreground" aria-hidden />
                <p className="mt-2 text-xs text-muted-foreground">
                  Henüz kimse bağlanmadı. QR kodu taratan dedektifler burada anında görünecek.
                </p>
              </div>
            )}
            {players
              .slice()
              .reverse()
              .map((p, i) => (
                <div
                  key={`${p.code}-${i}`}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-2.5 transition-all",
                    flashing.has(p.code)
                      ? "animate-glitch-in border-orange-400/60 bg-orange-500/15"
                      : "animate-fade-up border-white/5 bg-black/25",
                  )}
                  data-testid={`arena-player-${p.code}`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-orange-500/40 bg-orange-500/10 font-mono text-[10px] text-primary">
                    {String(players.length - i).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">{p.nickname ?? "Dedektif"}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{p.code}</p>
                  </div>
                  <span className="ml-auto h-2 w-2 shrink-0 animate-pulse rounded-full bg-orange-400" aria-hidden />
                </div>
              ))}
          </div>

          {players.length > 0 && (
            <p className="mt-3 rounded-lg border border-orange-500/25 bg-primary/5 p-2.5 text-[11px] text-primary" data-testid="arena-start-hint">
              {players.length} dedektif hazır. Yukarıdaki <strong>TURU BAŞLAT</strong> ile 5 turluk
              kanıt yarışmasını aç (bir ders saati).
            </p>
          )}
          <p className="mt-4 border-t border-white/5 pt-3 text-[10px] leading-relaxed text-muted-foreground">
            Lobide yalnızca dedektif kodu ve takma ad görünür. Cevaplar, rubrik puanları ve geri
            bildirimler arenada asla gösterilmez.
          </p>
        </aside>
      </div>
      )}
    </div>
  );
}
