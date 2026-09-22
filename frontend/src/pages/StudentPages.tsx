import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EvidenceBoardGrid from "@/components/game/EvidenceBoardGrid";
import TechTreeView from "@/components/game/TechTreeView";
import DrNovaChat from "@/components/game/DrNovaChat";
import { RubricResultCard } from "@/components/game/chapters/MoreChapters";
import { apiGet } from "@/lib/api";
import { BADGES, LEVELS } from "@/lib/missions";
import { saveNickname } from "@/lib/session";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import type { MissionStatus, Submission, UserProfile } from "@/types";
import { cn } from "@/lib/utils";

export function EvidenceBoardPage() {
  return (
    <div>
      <h1 className="font-heading text-3xl text-primary text-glow" data-testid="evidence-board-title">Bilimsel Kanıt Panosu</h1>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
        Her bilim insanı için model varsayımını, kanıtını, açıkladığı ve açıklamakta zorlandığı durumu ve
        sonraki değişimi yerleştir. Bir satır doğru tamamlandığında XP kazanırsın.
      </p>
      <div className="mt-6">
        <EvidenceBoardGrid />
      </div>
    </div>
  );
}

export function TechTreePage() {
  const missions = useQuery({ queryKey: ["missions"], queryFn: () => apiGet<MissionStatus[]>("/missions") });
  return (
    <div>
      <h1 className="font-heading text-3xl text-primary text-glow" data-testid="tech-tree-title">Teknoloji Ağacı</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Bilimsel Evrim Ağacı: her düğüm, ilgili kanıt görevi tamamlanınca açılır.
      </p>
      <div className="mt-6">
        <TechTreeView missions={missions.data ?? []} />
      </div>
    </div>
  );
}

export function MentorPage() {
  return (
    <div>
      <h1 className="font-heading text-3xl text-primary text-glow" data-testid="mentor-page-title">AI Mentor — Dr. Nova</h1>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
        Dr. Nova bir bilimsel sorgulama mentorüdür: hazır cevap vermez, seni kanıtla düşünmeye yönlendirir.
        Kişisel bilgi paylaşma; AI'a kimlik verileri gönderilmez.
      </p>
      <div className="mt-6">
        <DrNovaChat />
      </div>
    </div>
  );
}

export function AchievementsPage({ user }: { user: UserProfile }) {
  const missions = useQuery({ queryKey: ["missions"], queryFn: () => apiGet<MissionStatus[]>("/missions") });
  const subs = useQuery({ queryKey: ["my-submissions"], queryFn: () => apiGet<Submission[]>("/assessment/my-submissions") });
  const list = missions.data ?? [];

  return (
    <div>
      <h1 className="font-heading text-3xl text-primary text-glow" data-testid="achievements-title">Başarılar</h1>
      <p className="mt-1 text-sm text-muted-foreground">XP yalnızca doğru cevaba değil; kanıt keşfine, gerekçelendirmeye ve işbirliğine de bağlıdır.</p>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="achievements-badges">
        {BADGES.map((b) => {
          const owned = user.badges.includes(b.id);
          return (
            <div key={b.id} className={cn("rounded-xl border p-4 hover-lift", owned ? "border-primary/40 bg-primary/5 glow-terminal" : "border-border bg-card opacity-60")} data-testid={`achievement-badge-${b.id}`}>
              <p className="text-3xl" aria-hidden>{b.icon}</p>
              <p className="mt-2 font-heading text-base text-foreground">{b.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{b.desc}</p>
              <Badge variant="outline" className="mt-3 text-[10px]">{owned ? "KAZANILDI" : "HENÜZ KAZANILMADI"}</Badge>
            </div>
          );
        })}
      </section>

      <section className="mt-6 hud-frame glass p-4" data-testid="achievements-levels">
        <p className="font-mono text-xs tracking-widest text-amber-400">DEDEKTİF SEVİYELERİ</p>
        <ol className="mt-3 space-y-1.5">
          {LEVELS.map((l) => (
            <li key={l.level} className={cn("flex items-center justify-between rounded-sm px-2 py-1.5 text-sm", user.xp >= l.min_xp ? "bg-primary/10 text-primary" : "text-muted-foreground")}>
              <span>Seviye {l.level} — {l.title}</span>
              <span className="font-mono text-xs">{l.min_xp}+ XP</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-6 hud-frame glass p-4" data-testid="achievements-missions">
        <p className="font-mono text-xs tracking-widest text-amber-400">GÖREV DURUMU</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {list.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-sm border border-border/60 p-2 text-xs">
              <span className="text-foreground/85">{m.code} {m.title}</span>
              <span className={cn("font-mono text-[10px]", m.status === "completed" ? "text-primary" : "text-muted-foreground")}>
                {m.status === "completed" ? "✓" : m.status === "available" ? "açık" : "kilitli"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {(subs.data ?? []).length > 0 && (
        <section className="mt-6" data-testid="achievements-submissions">
          <p className="font-mono text-xs tracking-widest text-amber-400">FİNAL GÖREV DEĞERLENDİRMEM</p>
          <div className="mt-3 space-y-3">
            {(subs.data ?? []).map((s) => (
              <RubricResultCard key={s.id} submission={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export function ProfilePage({ user }: { user: UserProfile }) {
  const [nickname, setNickname] = useState(user.nickname ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await saveNickname(nickname.trim());
      toast.success("Takma adın güncellendi.");
    } catch {
      toast.error("Takma ad kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-3xl text-primary text-glow" data-testid="profile-title">Profil</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Bu platform gerçek ad-soyad kullanmaz. Kimliğin yalnızca dedektif kodun ve takma adından oluşur.
      </p>

      <section className="mt-6 hud-frame glass p-4" data-testid="profile-identity">
        <p className="font-mono text-xs tracking-widest text-amber-400">DEDEKTİF KİMLİĞİ</p>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] text-muted-foreground">Dedektif ID</dt>
            <dd className="font-mono text-lg text-primary" data-testid="profile-code">{user.code}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Sınıf</dt>
            <dd className="font-mono text-lg text-foreground">{user.class_id ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Seviye</dt>
            <dd className="text-sm text-foreground">{user.level} · {user.level_title}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">XP</dt>
            <dd className="font-mono text-sm text-foreground">{user.xp}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-4 hud-frame glass p-4">
        <p className="font-mono text-xs tracking-widest text-amber-400">TAKMA AD</p>
        <div className="mt-3 flex gap-2">
          <Input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={24}
            placeholder="QuantumFox"
            aria-label="Takma ad"
            data-testid="profile-nickname-input"
          />
          <Button onClick={save} disabled={saving || nickname.trim().length < 2} data-testid="profile-nickname-save-button">
            Kaydet
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Gerçek adını yazmana gerek yok — hayal gücünü kullan.
        </p>
      </section>

      <section className="mt-4 hud-frame glass glass-cyan p-4" data-testid="profile-privacy-center">
        <p className="font-mono text-xs tracking-widest text-cyan-300">🔐 GİZLİLİK MERKEZİ</p>
        <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          <li>• Hesabında tutulan temel veriler: dedektif kodu, takma ad, sınıf, XP, rozetler, görev ilerlemesi ve açık uçlu cevapların.</li>
          <li>• T.C. kimlik numarası, adres, telefon, e-posta, doğum tarihi, fotoğraf veya konum bilgisi toplanmaz.</li>
          <li>• AI Mentor kimya öğrenmene yardım eder; cevabını senin yerine yazmaz, kişisel bilgi istemez.</li>
          <li>• Mentor konuşmalarını AI Mentor sayfasındaki “Geçmişi sil” ile dilediğin an silebilirsin.</li>
          <li>• Diğer öğrenciler cevaplarını, rubrik puanlarını ve öğretmen geri bildirimlerini göremez.</li>
        </ul>
        <a href="/gizlilik" className="mt-3 inline-block text-sm text-sky-400 hover:underline" data-testid="profile-privacy-link">
          Ayrıntılı gizlilik metnini oku →
        </a>
      </section>
    </div>
  );
}
