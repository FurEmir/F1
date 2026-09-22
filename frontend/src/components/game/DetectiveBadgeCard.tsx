import { useMemo, useRef, useState } from "react";
import { Download, IdCard, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BADGES, LEVELS } from "@/lib/missions";
import type { UserProfile } from "@/types";

// Shareable detective identity card. Rendered as inline SVG so it can be downloaded
// as a real image without any extra dependency — and it carries no personal data.
export default function DetectiveBadgeCard({
  user,
  missionsCompleted,
}: {
  user: UserProfile;
  missionsCompleted: number;
}) {
  const [downloading, setDownloading] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const owned = BADGES.filter((b) => user.badges.includes(b.id));
  const nextLevel = LEVELS.find((l) => l.min_xp > user.xp);

  const svgMarkup = useMemo(() => svgRef.current?.outerHTML ?? "", [user.xp, user.badges.length]);

  async function downloadPng() {
    const svg = svgRef.current;
    if (!svg) return;
    setDownloading(true);
    try {
      const xml = new XMLSerializer().serializeToString(svg);
      const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("render"));
        img.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = 1000;
      canvas.height = 600;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("ctx");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const png = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = png;
      a.download = `kuantum-dedektif-${user.code}.png`;
      a.click();
      toast.success("Rozet kartın indirildi.");
    } catch {
      // SVG fallback keeps the feature usable even if canvas export is blocked
      try {
        const xml = new XMLSerializer().serializeToString(svgRef.current!);
        const blob = new Blob([xml], { type: "image/svg+xml" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `kuantum-dedektif-${user.code}.svg`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success("Rozet kartın SVG olarak indirildi.");
      } catch {
        toast.error("Kart indirilemedi.");
      }
    } finally {
      setDownloading(false);
    }
  }

  async function share() {
    const text = `Kuantum Dedektifleri: Bilimsel Kırılma — Dedektif ${user.code} (${user.nickname ?? "—"}) · Seviye ${user.level} · ${user.xp} XP · ${owned.length}/5 rozet`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Dedektif Rozet Kartım", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.success("Kart bilgisi kopyalandı.");
    } catch {
      toast.info("Paylaşım bu tarayıcıda desteklenmiyor.");
    }
  }

  return (
    <section className="hud-frame hud-ticks glass glass-amber p-5" data-testid="detective-badge-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-mono text-xs tracking-widest text-amber-400">
          <IdCard size={14} aria-hidden /> DEDEKTİF ROZET KARTI
        </p>
        <div className="flex gap-2">
          <Button size="xs" variant="outline" onClick={share} data-testid="badge-card-share-button">
            <Share2 size={12} aria-hidden /> Paylaş
          </Button>
          <Button size="xs" onClick={downloadPng} disabled={downloading} data-testid="badge-card-download-button">
            <Download size={12} aria-hidden /> {downloading ? "Hazırlanıyor…" : "PNG indir"}
          </Button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-amber-500/20">
        <svg
          ref={svgRef}
          viewBox="0 0 1000 600"
          xmlns="http://www.w3.org/2000/svg"
          className="block h-auto w-full"
          role="img"
          aria-label={`Dedektif ${user.code} rozet kartı`}
          data-testid="badge-card-svg"
        >
          <defs>
            <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0A0F1A" />
              <stop offset="55%" stopColor="#0B1420" />
              <stop offset="100%" stopColor="#070A11" />
            </linearGradient>
            <radialGradient id="glowA" cx="15%" cy="10%" r="65%">
              <stop offset="0%" stopColor="#FB8B24" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#FB8B24" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="glowB" cx="88%" cy="85%" r="60%">
              <stop offset="0%" stopColor="#FFC233" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#FFC233" stopOpacity="0" />
            </radialGradient>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0 L0 0 0 40" fill="none" stroke="#94A3B8" strokeOpacity="0.08" strokeWidth="1" />
            </pattern>
          </defs>

          <rect width="1000" height="600" fill="url(#bgGrad)" />
          <rect width="1000" height="600" fill="url(#grid)" />
          <rect width="1000" height="600" fill="url(#glowA)" />
          <rect width="1000" height="600" fill="url(#glowB)" />
          <rect x="16" y="16" width="968" height="568" rx="18" fill="none" stroke="#FB8B24" strokeOpacity="0.35" strokeWidth="2" />
          <path d="M16 60 L16 34 Q16 16 34 16 L60 16" fill="none" stroke="#FF6B35" strokeWidth="4" />
          <path d="M984 540 L984 566 Q984 584 966 584 L940 584" fill="none" stroke="#FF6B35" strokeWidth="4" />

          <text x="56" y="78" fill="#FF6B35" fontFamily="monospace" fontSize="17" letterSpacing="7">
            TOP SECRET // DEDEKTİF KİMLİĞİ
          </text>
          <text x="56" y="140" fill="#FB8B24" fontFamily="sans-serif" fontSize="52" fontWeight="700">
            KUANTUM DEDEKTİFLERİ
          </text>
          <text x="56" y="180" fill="#E2E8F0" fontFamily="sans-serif" fontSize="26">
            BİLİMSEL KIRILMA
          </text>

          {/* identity block */}
          <text x="56" y="252" fill="#94A3B8" fontFamily="monospace" fontSize="16" letterSpacing="4">
            DEDEKTİF ID
          </text>
          <text x="56" y="300" fill="#FFC233" fontFamily="monospace" fontSize="44" fontWeight="700">
            {user.code}
          </text>
          <text x="56" y="342" fill="#94A3B8" fontFamily="monospace" fontSize="16" letterSpacing="4">
            TAKMA AD
          </text>
          <text x="56" y="382" fill="#F8FAFC" fontFamily="sans-serif" fontSize="32">
            {user.nickname ?? "—"}
          </text>

          {/* stat strip */}
          <g fontFamily="monospace">
            <rect x="56" y="420" width="200" height="86" rx="10" fill="#111827" fillOpacity="0.8" stroke="#FB8B24" strokeOpacity="0.3" />
            <text x="72" y="448" fill="#94A3B8" fontSize="13" letterSpacing="3">SEVİYE</text>
            <text x="72" y="486" fill="#FB8B24" fontSize="34" fontWeight="700">{user.level}</text>
            <rect x="272" y="420" width="200" height="86" rx="10" fill="#111827" fillOpacity="0.8" stroke="#FFC233" strokeOpacity="0.3" />
            <text x="288" y="448" fill="#94A3B8" fontSize="13" letterSpacing="3">XP</text>
            <text x="288" y="486" fill="#FFC233" fontSize="34" fontWeight="700">{user.xp}</text>
            <rect x="488" y="420" width="200" height="86" rx="10" fill="#111827" fillOpacity="0.8" stroke="#FF6B35" strokeOpacity="0.3" />
            <text x="504" y="448" fill="#94A3B8" fontSize="13" letterSpacing="3">GÖREV</text>
            <text x="504" y="486" fill="#FF6B35" fontSize="34" fontWeight="700">{missionsCompleted}/8</text>
            <rect x="704" y="420" width="240" height="86" rx="10" fill="#111827" fillOpacity="0.8" stroke="#94A3B8" strokeOpacity="0.25" />
            <text x="720" y="448" fill="#94A3B8" fontSize="13" letterSpacing="3">ROZET</text>
            <text x="720" y="486" fill="#F8FAFC" fontSize="34" fontWeight="700">{owned.length}/5</text>
          </g>

          {/* badge icons */}
          <g>
            {BADGES.map((b, i) => {
              const has = user.badges.includes(b.id);
              return (
                <g key={b.id} transform={`translate(${704 + i * 48}, 250)`}>
                  <circle r="20" fill={has ? "#FB8B24" : "#1E293B"} fillOpacity={has ? 0.18 : 0.6} stroke={has ? "#FB8B24" : "#334155"} strokeWidth="1.5" />
                  <text textAnchor="middle" y="7" fontSize="20" opacity={has ? 1 : 0.28}>
                    {b.icon}
                  </text>
                </g>
              );
            })}
            <text x="704" y="205" fill="#94A3B8" fontFamily="monospace" fontSize="14" letterSpacing="3">
              KAZANILAN ROZETLER
            </text>
          </g>

          {/* atom emblem */}
          <g transform="translate(830, 120)" fill="none" strokeWidth="2">
            <circle r="46" stroke="#FB8B24" strokeOpacity="0.5" />
            <ellipse rx="46" ry="18" stroke="#FFC233" strokeOpacity="0.55" />
            <ellipse rx="46" ry="18" stroke="#FF6B35" strokeOpacity="0.45" transform="rotate(60)" />
            <ellipse rx="46" ry="18" stroke="#FFE066" strokeOpacity="0.45" transform="rotate(-60)" />
            <circle r="7" fill="#FB8B24" stroke="none" />
          </g>

          <text x="56" y="552" fill="#64748B" fontFamily="monospace" fontSize="14">
            {user.level_title}
          </text>
          <text x="56" y="575" fill="#475569" fontFamily="monospace" fontSize="12">
            KİM.9.1.3 · Eğitim amaçlı prototip · Kişisel veri içermez
          </text>
        </svg>
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">
        Kart yalnızca dedektif kodun, takma adın ve oyun istatistiklerini içerir — gerçek ad veya
        başka kişisel veri yer almaz.
        {nextLevel && <> Sonraki seviye için {nextLevel.min_xp - user.xp} XP kaldı.</>}
      </p>
    </section>
  );
}
