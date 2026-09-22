import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import { MISSIONS } from "@/lib/missions";
import DarkBox, { DaltonFile, ThomsonTrace } from "@/components/game/chapters/MissionChapters";
import { BohrSecret, ChadwickFile, FinalTask, JigsawBoard, RutherfordOp } from "@/components/game/chapters/MoreChapters";
import type { MissionStatus } from "@/types";
import { cn } from "@/lib/utils";

const JIGSAW_CONTENT = {
  id: "jigsaw",
  code: "OP",
  title: "Jigsaw: Ayrılıp-Birleşme Operasyonu",
  subtitle: "Her uzman bir parça getirir; nihai açıklama ancak birlikte tamamlanır",
  scientist: null,
  year: null,
  story: [
    "Görev merkezi dört uzman masası kurdu. Her masa yalnızca kendi bilim insanının kanıt dosyasını inceler.",
    "Sen bir uzman masası seçip notlarını çıkaracaksın. Sonra ana gruba döneceksin: diğer uzmanların notları seninle birleşecek.",
    "Ana görev: “Atom teorilerinin neden zaman içinde değiştiğini birlikte açıklayın.”",
  ],
  objectives: [
    "Bir uzman rolünde derinleşmek",
    "Diğer uzmanların kanıtlarını birleştirmek",
    "Ortak sentez raporu oluşturmak",
  ],
  evidenceFiles: [],
  npc: null,
};

const FINAL_CONTENT = {
  id: "bilimsel-kirilma",
  code: "FINAL",
  title: "BİLİMSEL KIRILMA",
  subtitle: "Final görev / çıkış bileti",
  scientist: null,
  year: null,
  story: [
    "Son dosya masanda. Tüm kanıtları topladın; şimdi bir bilim dedektifi gibi karşı-olgusal akıl yürütme yapacaksın.",
    "Cevabın analitik rubrik üzerinden AI ön değerlendirmesine alınacak ve öğretmen paneline iletilecek. Nihai değerlendirme öğretmenindir.",
  ],
  objectives: [
    "Bilimsel bilginin değişebilirliğini gerekçelendirmek",
    "Kanıt-model ilişkisini kurmak",
    "Tarihsel gelişimle nedensel akıl yürütme yapmak",
  ],
  evidenceFiles: [],
  npc: null,
};

export default function Missions() {
  const { missionId } = useParams();
  const missions = useQuery({ queryKey: ["missions"], queryFn: () => apiGet<MissionStatus[]>("/missions") });
  const progress = useQuery({
    queryKey: ["mission-progress", missionId],
    queryFn: () => apiGet<{ tasks: { task_key: string }[] }>(`/missions/${missionId}/progress`),
    enabled: !!missionId,
  });

  const list = missions.data ?? [];

  if (!missionId) {
    return (
      <div>
        <h1 className="font-heading text-3xl text-primary text-glow" data-testid="missions-title">Görev Dosyaları</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dosyalar sırayla açılır: her görev, bir sonraki modelin kanıtını hazırlar.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {list.map((m) => (
            <Link
              key={m.id}
              to={m.status === "locked" ? "#" : `/gorevler/${m.id}`}
              onClick={(e) => m.status === "locked" && e.preventDefault()}
              className={cn(
                "hud-frame jigsaw-edge glass rounded-md border p-4 transition-all duration-200 hover-lift",
                m.status === "completed" && "border-primary/40 bg-primary/5",
                m.status === "available" && "border-amber-500/40 bg-card hover:border-amber-400",
                m.status === "locked" && "border-border bg-card opacity-60",
              )}
              data-testid={`mission-card-${m.id}`}
            >
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs text-amber-400">GÖREV {m.code}</p>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {m.status === "completed" ? "TAMAMLANDI" : m.status === "available" ? "AÇIK" : "KİLİTLİ"}
                </span>
              </div>
              <p className="mt-2 flex items-center gap-2 font-heading text-lg text-foreground">
                {m.title}
                {m.status === "locked" && <Lock size={13} className="text-muted-foreground" aria-hidden />}
              </p>
              {m.scientist && <p className="text-xs text-amber-300">{m.scientist} · {m.year}</p>}
              <p className="mt-2 font-mono text-[11px] text-muted-foreground">{m.xp_earned}/{m.xp_total} XP</p>
            </Link>
          ))}
          {list.length === 0 && (
            <p className="text-sm text-muted-foreground" data-testid="missions-empty">Görevler yüklenemedi.</p>
          )}
        </div>
      </div>
    );
  }

  const status = list.find((m) => m.id === missionId);
  const tasksDone = (progress.data?.tasks ?? []).map((t) => t.task_key);

  if (status && status.status === "locked") {
    return (
      <div className="hud-frame glass p-6 text-center" data-testid="mission-locked">
        <Lock size={24} className="mx-auto text-muted-foreground" aria-hidden />
        <p className="mt-2 font-heading text-lg text-foreground">Bu dosya henüz kilitli</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Önceki görevin kanıtlarını tamamladığında açılır.
        </p>
        <Link to="/gorevler">
          <Button variant="outline" size="sm" className="mt-4" data-testid="mission-locked-back-button">
            <ArrowLeft size={14} aria-hidden /> Görev listesine dön
          </Button>
        </Link>
      </div>
    );
  }

  const content = MISSIONS.find((m) => m.id === missionId);

  return (
    <div>
      <Link to="/gorevler" className="mb-4 inline-flex items-center gap-1 text-sm text-amber-300 hover:underline" data-testid="mission-back-link">
        <ArrowLeft size={14} aria-hidden /> Görev listesi
      </Link>

      {missionId === "karanlik-kutu" && content && <DarkBox content={content} tasksDone={tasksDone} />}
      {missionId === "dalton-dosyasi" && content && <DaltonFile content={content} tasksDone={tasksDone} />}
      {missionId === "thomson-izi" && content && <ThomsonTrace content={content} tasksDone={tasksDone} />}
      {missionId === "rutherford-operasyonu" && content && <RutherfordOp content={content} tasksDone={tasksDone} />}
      {missionId === "bohr-sirri" && content && <BohrSecret content={content} tasksDone={tasksDone} />}
      {missionId === "chadwick-dosyasi" && content && <ChadwickFile content={content} tasksDone={tasksDone} />}
      {missionId === "jigsaw" && <JigsawBoard content={JIGSAW_CONTENT} tasksDone={tasksDone} />}
      {missionId === "bilimsel-kirilma" && <FinalTask content={FINAL_CONTENT} tasksDone={tasksDone} />}
    </div>
  );
}
