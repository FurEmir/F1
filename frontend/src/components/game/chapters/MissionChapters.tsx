import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChapterShell, EvidenceFileList, OrderChainTask, TaskSection, useCompleteTask } from "./shared";
import type { MissionContent } from "@/lib/missions";

const PROBES = [
  { id: "terazi", tool: " hassas Terazi", icon: "⚖️", obs: "Sandık ağırlık gösteriyor: içinde kütle var." },
  { id: "miknatis", tool: "Mıknatıs kılıf", icon: "🧲", obs: "Kutunun bir yüzü mıknatısa hafifçe çekiliyor: metal parçalar olabilir." },
  { id: "ses", tool: "Akustik prob", icon: "🔊", obs: "Hafifçe sallanınca içten tok sesler geliyor: parçalar birbirine dokunuyor." },
  { id: "isi", tool: "Isı sensörü", icon: "🌡️", obs: "Bir yüz ötekinden sıcak: içeride enerji açığa çıkan bir bölge olabilir." },
];

// B01 — Karanlık Kutu: indirect evidence → student's own initial model (no correct model is shown).
export default function DarkBox({ content, tasksDone }: { content: MissionContent; tasksDone: string[] }) {
  const complete = useCompleteTask(content.id);
  const [probes, setProbes] = useState<string[]>([]);
  const [model, setModel] = useState("");
  const gozlemDone = tasksDone.includes("gozlem");
  const modelDone = tasksDone.includes("ilk-model");

  function toggleProbe(id: string) {
    setProbes((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  return (
    <ChapterShell content={content}>
      <TaskSection
        id="gozlem"
        title="Adım 1 — Kutuyu dolaylı kanıtla incele"
        done={gozlemDone}
        hint="En az üç ölçüm aracını kullan; kutuyu açmaya çalışmak yok."
      >
        {!gozlemDone && (
          <>
            <div className="flex flex-wrap gap-2">
              {PROBES.map((p) => (
                <Button
                  key={p.id}
                  size="sm"
                  variant={probes.includes(p.id) ? "default" : "outline"}
                  onClick={() => toggleProbe(p.id)}
                  data-testid={`darkbox-probe-${p.id}`}
                >
                  {p.icon} {p.tool}
                </Button>
              ))}
            </div>
            <div className="mt-3 space-y-1.5">
              {probes.map((id) => {
                const p = PROBES.find((x) => x.id === id)!;
                return (
                  <p key={id} className="rounded-sm border border-cyan-500/25 bg-[#060A10] p-2 font-mono text-xs text-cyan-200" data-testid={`darkbox-observation-${id}`}>
                    ▸ {p.obs}
                  </p>
                );
              })}
              {probes.length >= 3 && (
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={() => complete.mutate({ taskKey: "gozlem", answers: { probes: probes.join(",") } })}
                  data-testid="darkbox-complete-observation-button"
                >
                  Gözlem raporunu kaydet
                </Button>
              )}
            </div>
          </>
        )}
        {gozlemDone && (
          <p className="font-mono text-xs text-primary" data-testid="darkbox-gozlem-done">
            ✓ Gözlem raporu kaydedildi. (Kanıt, modelden önce gelir.)
          </p>
        )}
      </TaskSection>

      <TaskSection
        id="ilk-model"
        title="Adım 2 — İlk modelini kur"
        done={modelDone}
        hint="Bu bölümde 'doğru' model gösterilmez; senin çıkarımın değerlidir."
      >
        {!modelDone ? (
          <div className="space-y-3">
            <Textarea
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Gözlemlerine göre kutunun içindeki yapıyı tanımla: Ne şekil? Ne malzeme? Nereden biliyorsun?"
              rows={4}
              maxLength={600}
              data-testid="darkbox-model-input"
              aria-label="İlk model açıklaması"
            />
            <Button
              size="sm"
              disabled={model.trim().length < 20}
              onClick={() => {
                complete.mutate({ taskKey: "ilk-model", answers: { model: model.trim() } });
                toast.success("İlk modelin kaydedildi. Bilim insanları da atomu böyle modelledi — göremeden.", { id: "darkbox-model" });
              }}
              data-testid="darkbox-model-submit-button"
            >
              Modeli gönder
            </Button>
          </div>
        ) : (
          <p className="font-mono text-xs text-primary" data-testid="darkbox-model-done">
            ✓ İlk modelin kaydedildi. Dalton'un modeliyle kıyaslamaya hazır mısın? (B02)
          </p>
        )}
      </TaskSection>
    </ChapterShell>
  );
}

// B02 — Dalton Dosyası: evidence files + inference about historical rationality.
export function DaltonFile({ content, tasksDone }: { content: MissionContent; tasksDone: string[] }) {
  const complete = useCompleteTask(content.id);
  const [choice, setChoice] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const filesDone = tasksDone.includes("dosya-inceleme");
  const cikarimDone = tasksDone.includes("cikarim");
  const firedRef = { current: filesDone };

  return (
    <ChapterShell content={content}>
      <TaskSection id="dosya-inceleme" title="Adım 1 — Kanıt dosyalarını incele" done={filesDone} hint="Dört dosyanın tamamını aç.">
        <EvidenceFileList
          files={content.evidenceFiles}
          openedLabel="✓ Tüm dosyalar incelendi — kanıt tablosu şimdi daha anlamlı olacak."
          onOpenedAll={() => {
            if (firedRef.current) return;
            firedRef.current = true;
            complete.mutate({ taskKey: "dosya-inceleme" });
          }}
        />
      </TaskSection>

      <TaskSection id="cikarim" title="Adım 2 — Çıkarım: Model rasyonel miydi?" done={cikarimDone}>
        {!cikarimDone ? (
          <div className="space-y-3">
            <p className="text-sm text-foreground/90">
              Dalton'un modeli, bugünkü bilgimizle “eksik” — ama şu soruyu cevapla: <em>Dönemin kanıtlarına göre bu model rasyonel miydi?</em>
            </p>
            <div className="grid gap-2">
              {[
                { id: "evet", text: "Evet — eldeki tüm kanıtları (korunum, sabit oran) açıklıyordu." },
                { id: "hayir", text: "Hayır — atom bölünemez değildir, o yüzden model değersizdi." },
                { id: "kismen", text: "Kısmen — ama bilim insanları daha o dönemde bunu bilmeliydi." },
              ].map((o) => (
                <Button key={o.id} size="sm" variant={choice === o.id ? "default" : "outline"} className="justify-start text-left" onClick={() => setChoice(o.id)} data-testid={`dalton-choice-${o.id}`}>
                  {o.text}
                </Button>
              ))}
            </div>
            {choice === "evet" && (
              <p className="rounded-sm border border-primary/30 bg-primary/5 p-2 text-xs text-primary" data-testid="dalton-feedback">
                Doğru muhakeme: bir bilimsel model, mevcut kanıtlar ve dönemin bilgisi doğrultusunda rasyoneldir. Yeni kanıt gelince gelişir.
              </p>
            )}
            {choice && choice !== "evet" && (
              <p className="rounded-sm border border-amber-500/30 bg-amber-500/5 p-2 text-xs text-amber-300" data-testid="dalton-feedback">
                Dikkat: bir modeli yalnızca bugün bildiklerimizle “yanlış/değersiz” diye değerlendirmek yanıltıcı olur. Dalton'un döneminde hangi kanıtlar mevcuttu?
              </p>
            )}
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Gerekçeni yaz: hangi dosyadaki kanıt, hangi varsayımı destekliyordu?"
              rows={3}
              maxLength={600}
              data-testid="dalton-reason-input"
              aria-label="Gerekçe"
            />
            <Button
              size="sm"
              disabled={!choice || reason.trim().length < 15}
              onClick={() => complete.mutate({ taskKey: "cikarim", answers: { secim: choice ?? "", gerekce: reason.trim() } })}
              data-testid="dalton-cikarim-submit-button"
            >
              Çıkarımı raporla
            </Button>
          </div>
        ) : (
          <p className="font-mono text-xs text-primary" data-testid="dalton-cikarim-done">
            ✓ Çıkarım kaydedildi. Bir sonraki kanıt 1897'den gelecek: Thomson'un İzi.
          </p>
        )}
      </TaskSection>
    </ChapterShell>
  );
}

// B03 — Thomson'un İzi: NPC dialogue + change-chain ordering.
const CHAIN_STEPS = [
  "Dalton modeli: atom bölünemez küredir",
  "Yeni kanıt: katot ışınları negatif, çok hafif parçacıklar gösterdi",
  "Açıklama yetersizliği: bölünemez küre, elektronu açıklayamıyor",
  "Model değişimi: Thomson — pozitif küre içinde elektronlar",
];

export function ThomsonTrace({ content, tasksDone }: { content: MissionContent; tasksDone: string[] }) {
  const complete = useCompleteTask(content.id);
  const zincirDone = tasksDone.includes("zincir");
  const npcDone = tasksDone.includes("npc-diyalog");

  return (
    <ChapterShell content={content}>
      <TaskSection id="dosya" title="Kanıt dosyaları" done={npcDone || zincirDone || tasksDone.length > 0}>
        <EvidenceFileList files={content.evidenceFiles} />
      </TaskSection>

      <TaskSection id="zincir" title="Kanıt zinciri — model neden değişti?" done={zincirDone} hint="Adımları kanıt sırasına göre tıkla.">
        <OrderChainTask
          id="thomson"
          steps={CHAIN_STEPS}
          done={zincirDone}
          onComplete={() => complete.mutate({ taskKey: "zincir" })}
        />
      </TaskSection>
    </ChapterShell>
  );
}
