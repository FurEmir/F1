import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Award, Lock, ScrollText, Sparkles, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiGet } from "@/lib/api";
import { BADGES, LEVELS, OUTCOME_LABELS } from "@/lib/missions";
import type { LeaderboardState, MissionStatus, UserProfile } from "@/types";
import { cn } from "@/lib/utils";

function outcomeFor(missionsDone: number, finalDone: boolean): string {
  const score = missionsDone * 12 + (finalDone ? 40 : 0);
  if (score >= 100) return "ileri";
  if (score >= 68) return "yeterli";
  if (score >= 30) return "gelisiyor";
  return "baslangic";
}

export default function Dashboard({ user }: { user: UserProfile }) {
  const missions = useQuery({ queryKey: ["missions"], queryFn: () => apiGet<MissionStatus[]>("/missions") });
  const leaderboard = useQuery({ queryKey: ["leaderboard"], queryFn: () => apiGet<LeaderboardState>("/leaderboard") });

  const list = missions.data ?? [];
  const core = list.filter((m) => !["jigsaw", "bilimsel-kirilma"].includes(m.id));
  const completed = list.filter((m) => m.status === "completed");
  const finalDone = list.find((m) => m.id === "bilimsel-kirilma")?.status === "completed";
  const nextMission = list.find((m) => m.status === "available");
  const nextLevel = LEVELS.find((l) => l.min_xp > user.xp);
  const currentLevel = [...LEVELS].reverse().find((l) => user.xp >= l.min_xp) ?? LEVELS[0];
  const levelPct = nextLevel
    ? ((user.xp - currentLevel.min_xp) / (nextLevel.min_xp - currentLevel.min_xp)) * 100
    : 100;
  const outcome = outcomeFor(core.filter((m) => m.status === "completed").length, finalDone);

  return (
    <div className="space-y-6">
      {/* hero */}
      <section className="relative overflow-hidden hud-frame hud-ticks glass glass-emerald p-6 scanlines" data-testid="dashboard-hero">
        <div className="relative z-10">
          <p className="font-mono text-xs tracking-[0.3em] text-amber-400">
            GÖREV MERKEZİ // DEDEKTİF {user.code}
          </p>
          <h1 className="mt-2 font-heading text-3xl text-primary text-glow sm:text-4xl">
            Merhaba, {user.nickname ?? "Dedektif"}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Görevin: <em>“Atomun doğasını anlamaya çalışırken bilimsel modellerin neden değiştiğini keşfet.”</em>
            {" "}Bir filin farklı bölümlerine dokunanlar farklı şeyler anlatıyorsa, bilim insanları
            göremedikleri atom hakkında nasıl bilgi sahibi olabildi? Kanıtlarla ilerle.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {nextMission ? (
              <Link to={`/gorevler/${nextMission.id}`}>
                <Button data-testid="dashboard-continue-button">
                  <Target size={15} aria-hidden /> Son göreve devam: {nextMission.code} {nextMission.title}
                </Button>
              </Link>
            ) : (
              <Link to="/gorevler">
                <Button data-testid="dashboard-continue-button">
                  <Target size={15} aria-hidden /> Görev dosyalarını aç
                </Button>
              </Link>
            )}
            <Link to="/gizlilik">
              <Button variant="outline" data-testid="dashboard-privacy-center-button">
                🔐 Gizlilik Merkezi
              </Button>
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full border border-cyan-500/20 animate-float-y" aria-hidden>
          <div className="m-6 h-36 w-36 rounded-full border border-primary/25" />
        </div>
      </section>

      {/* stats */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="dashboard-stats">
        <StatCard label="DEDEKTİF SEVİYESİ" value={`${user.level}`} sub={user.level_title} testid="stat-level" icon={<TrendingUp size={14} />} />
        <StatCard label="XP" value={user.xp.toLocaleString("tr-TR")} sub={nextLevel ? `Sonraki seviye: ${nextLevel.min_xp} XP` : "En yüksek seviye"} testid="stat-xp" icon={<Sparkles size={14} />} />
        <StatCard label="TAMAMLANAN GÖREV" value={`${completed.length}/${list.length}`} sub="Görev dosyası" testid="stat-missions" icon={<ScrollText size={14} />} />
        <StatCard label="ROZETLER" value={`${user.badges.length}/5`} sub="Kazanılan rozet" testid="stat-badges" icon={<Award size={14} />} />
      </section>

      {/* level progress */}
      <section className="hud-frame glass p-4 hover-lift" data-testid="dashboard-level-progress">
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs tracking-widest text-muted-foreground">BİLİMSEL İLERLEME</p>
          <p className="font-mono text-xs text-primary">{Math.round(levelPct)}%</p>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400 transition-[width] duration-700" style={{ width: `${Math.min(100, levelPct)}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {currentLevel.title}
          {nextLevel && <> → sonraki: {nextLevel.title}</>}
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* mission list */}
        <section className="hud-frame glass p-4 hover-lift" data-testid="dashboard-missions">
          <p className="font-mono text-xs tracking-widest text-amber-400">GÖREV DOSYALARI</p>
          <div className="mt-3 space-y-2">
            {list.map((m) => (
              <Link
                key={m.id}
                to={m.status === "locked" ? "/gorevler" : `/gorevler/${m.id}`}
                onClick={(e) => m.status === "locked" && e.preventDefault()}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg border p-3 transition-all duration-200 hover-lift",
                  m.status === "completed" && "border-primary/40 bg-primary/5",
                  m.status === "available" && "border-amber-500/40 hover:border-amber-400",
                  m.status === "locked" && "border-border opacity-60",
                )}
                data-testid={`dashboard-mission-${m.id}`}
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm text-foreground">
                    <span className="font-mono text-[10px] text-muted-foreground">{m.code}</span>
                    {m.title}
                    {m.status === "locked" && <Lock size={11} className="text-muted-foreground" aria-hidden />}
                  </p>
                  {m.scientist && <p className="truncate text-[11px] text-muted-foreground">{m.scientist} · {m.year}</p>}
                </div>
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                  {m.xp_earned}/{m.xp_total} XP
                </span>
              </Link>
            ))}
            {list.length === 0 && (
              <p className="text-sm text-muted-foreground" data-testid="dashboard-missions-empty">
                Görev listesi yüklenemedi. Bağlantın döndüğünde tekrar denenecek.
              </p>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          {/* learning outcome */}
          <section className="hud-frame glass glass-cyan p-4" data-testid="dashboard-outcome">
            <p className="font-mono text-xs tracking-widest text-cyan-300">ÖĞRENME ÇIKTISI</p>
            <p className="mt-2 font-mono text-sm text-primary">KİM.9.1.3</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Atom teorilerindeki varsayımları kullanarak bilimsel bilginin değişebilirliğine ilişkin
              çıkarım yapabilme.
            </p>
            <Badge className="mt-3" variant="outline" data-testid="dashboard-outcome-level">
              {OUTCOME_LABELS[outcome]}
            </Badge>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Bu gösterge bir not değildir; hangi boyutta desteğe ihtiyaç duyduğunu gösterir.
            </p>
          </section>

          {/* badges */}
          <section className="hud-frame glass p-4 hover-lift" data-testid="dashboard-badges">
            <p className="font-mono text-xs tracking-widest text-amber-400">ROZETLER</p>
            <div className="mt-3 space-y-2">
              {BADGES.map((b) => {
                const owned = user.badges.includes(b.id);
                return (
                  <div key={b.id} className={cn("flex items-start gap-2 rounded-sm border p-2", owned ? "border-primary/40 bg-primary/5" : "border-border opacity-55")} data-testid={`dashboard-badge-${b.id}`}>
                    <span className="text-lg" aria-hidden>{b.icon}</span>
                    <div>
                      <p className="text-xs text-foreground">{b.name}</p>
                      <p className="text-[10px] text-muted-foreground">{b.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* leaderboard (privacy-safe) */}
          <section className="hud-frame glass p-4 hover-lift" data-testid="dashboard-leaderboard">
            <p className="font-mono text-xs tracking-widest text-muted-foreground">SINIF İÇİ SIRALAMA</p>
            {leaderboard.data?.enabled === false && (
              <p className="mt-2 text-xs text-muted-foreground" data-testid="leaderboard-disabled">
                Öğretmen sıralamayı kapattı.
              </p>
            )}
            {leaderboard.data?.enabled && (
              <>
                <ol className="mt-2 space-y-1">
                  {leaderboard.data.entries.slice(0, 5).map((e) => (
                    <li key={e.code} className={cn("flex items-center justify-between rounded-sm px-2 py-1 text-xs", e.code === user.code ? "bg-primary/10 text-primary" : "text-muted-foreground")}>
                      <span>
                        {e.rank}. {e.nickname ?? e.code}
                      </span>
                      <span className="font-mono">{e.xp} XP</span>
                    </li>
                  ))}
                </ol>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Yalnızca Dedektif XP gösterilir. Cevaplar, rubrik puanları ve geri bildirimler gizlidir.
                </p>
              </>
            )}
            {!leaderboard.data && (
              <p className="mt-2 text-xs text-muted-foreground">Sıralama şu an görüntülenemiyor.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  testid,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  testid: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="hud-frame glass p-4 hover-lift" data-testid={testid}>
      <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </p>
      <p className="mt-2 font-heading text-2xl text-foreground">{value}</p>
      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}
