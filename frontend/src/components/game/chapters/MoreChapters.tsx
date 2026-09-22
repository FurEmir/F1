import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { apiPost } from "@/lib/api";
import { ChapterShell, EvidenceFileList, OrderChainTask, TaskSection, useCompleteTask } from "./shared";
import RutherfordSim from "@/components/game/RutherfordSim";
import { FINAL_PROMPT, JIGSAW_EXPERTS, JIGSAW_FIELDS, JIGSAW_PEER_NOTES } from "@/lib/missions";
import type { MissionContent } from "@/lib/missions";
import type { Submission } from "@/types";
import { cn } from "@/lib/utils";

// B04 — Rutherford Operasyonu: simulation + evidence placement + inference.
export function RutherfordOp({ content, tasksDone }: { content: MissionContent; tasksDone: string[] }) {
  const complete = useCompleteTask(content.id);
  const [inference, setInference] = useState("");
  const simDone = tasksDone.includes("simulasyon");
  const evidenceDone = tasksDone.includes("kanit-panosu");
  const cikarimDone = tasksDone.includes("cikarim");

  return (
    <ChapterShell content={content} tasksDone={tasksDone}>
      <TaskSection id="simulasyon" title="Adım 1 — Deneyi çalıştır ve veriyi izle" done={simDone}>
        <RutherfordSim
          simDone={simDone}
          evidenceDone={evidenceDone}
          onSimComplete={() => complete.mutate({ taskKey: "simulasyon" })}
          onEvidencePlaced={() => complete.mutate({ taskKey: "kanit-panosu" })}
        />
      </TaskSection>

      <TaskSection id="cikarim" title="Adım 2 — Çıkarım: gözlemler ne düşündürüyor?" done={cikarimDone} hint="Önce Rutherford'un sorusunu cevapla (yukarıdaki diyalog), sonra raporunu yaz.">
        {!cikarimDone ? (
          <div className="space-y-3">
            <p className="text-sm text-foreground/90">
              “Bu gözlemler atomun yapısı hakkında ne düşündürüyor?” — Kanıtlardan çıkarıma giden cümleni kur.
            </p>
            <Textarea
              value={inference}
              onChange={(e) => setInference(e.target.value)}
              placeholder="Örnek düşünme sırası: çoğunluğun düz geçmesi ne gösterir? Geri dönen 1/8000 neyi gerektirir?"
              rows={4}
              maxLength={800}
              data-testid="rutherford-inference-input"
              aria-label="Rutherford çıkarımı"
            />
            <Button
              size="sm"
              disabled={inference.trim().length < 20}
              onClick={() => {
                complete.mutate({ taskKey: "cikarim", answers: { inference: inference.trim() } });
              }}
              data-testid="rutherford-cikarim-submit-button"
            >
              Çıkarımı raporla
            </Button>
          </div>
        ) : (
          <p className="font-mono text-xs text-primary">✓ Çıkarım kaydedildi. Bohr'un sırrı: kesikli çizgiler (B05).</p>
        )}
      </TaskSection>
    </ChapterShell>
  );
}

// B05 — Bohr'un Sırrı: categorize Rutherford limits + explanation.
const SORT_ITEMS = [
  { id: "s1", text: "Büyük açılı alfa saçılması", bucket: "acikliyor" },
  { id: "s2", text: "Atomun çoğunlukla boşluk olması", bucket: "acikliyor" },
  { id: "s3", text: "Elektronların çekirdeğe düşmemesi", bucket: "zorlanıyor" },
  { id: "s4", text: "Hidrojenin kesikli çizgi spektrumu", bucket: "zorlanıyor" },
  { id: "s5", text: "Pozitif yükün merkezde toplanması", bucket: "acikliyor" },
  { id: "s6", text: "Isınan maddenin yalnızca belirli renklerde ışınması", bucket: "zorlanıyor" },
];

export function BohrSecret({ content, tasksDone }: { content: MissionContent; tasksDone: string[] }) {
  const complete = useCompleteTask(content.id);
  const [assign, setAssign] = useState<Record<string, string>>({});
  const [explanation, setExplanation] = useState("");
  const aciklamaDone = tasksDone.includes("aciklama");
  const allAssigned = SORT_ITEMS.every((i) => assign[i.id]);
  const allCorrect = allAssigned && SORT_ITEMS.every((i) => assign[i.id] === i.bucket);

  return (
    <ChapterShell content={content} tasksDone={tasksDone}>
      <TaskSection id="dosya" title="Kanıt dosyaları" done={tasksDone.length > 0}>
        <EvidenceFileList files={content.evidenceFiles} />
      </TaskSection>

      <TaskSection id="aciklama" title="Sınır analizi + yeni varsayım" done={aciklamaDone} hint="Her ifadeyi doğru kovaya ayır, sonra yeni varsayımı gerekçelendir.">
        {!aciklamaDone ? (
          <div className="space-y-4">
            <div className="space-y-2">
              {SORT_ITEMS.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center gap-2 rounded-sm border border-border bg-secondary/40 p-2" data-testid={`bohr-item-${item.id}`}>
                  <span className="flex-1 text-xs text-foreground/85">{item.text}</span>
                  <div className="flex gap-1">
                    <Button size="xs" variant={assign[item.id] === "acikliyor" ? "default" : "outline"} onClick={() => setAssign((a) => ({ ...a, [item.id]: "acikliyor" }))} data-testid={`bohr-item-${item.id}-acikliyor`}>
                      Açıklıyor
                    </Button>
                    <Button size="xs" variant={assign[item.id] === "zorlanıyor" ? "destructive" : "outline"} onClick={() => setAssign((a) => ({ ...a, [item.id]: "zorlanıyor" }))} data-testid={`bohr-item-${item.id}-zorlaniyor`}>
                      Zorlanıyor
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {allAssigned && !allCorrect && (
              <p className="text-xs text-amber-400" data-testid="bohr-sort-hint">
                Bazı ayırımlar kanıtlarla çelişiyor — dosya 2'yi (klasik fizik kılavuzu) tekrar oku.
              </p>
            )}
            <Textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Kanıt → açıklama ihtiyacı → yeni varsayım zincirini yaz: Bohr, Rutherford modeline neyi ekledi?"
              rows={3}
              maxLength={600}
              data-testid="bohr-explanation-input"
              aria-label="Bohr açıklaması"
            />
            <Button
              size="sm"
              disabled={!allCorrect || explanation.trim().length < 15}
              onClick={() => {
                complete.mutate({ taskKey: "aciklama", answers: { aciklama: explanation.trim() } });
              }}
              data-testid="bohr-aciklama-submit-button"
            >
              Analizi raporla
            </Button>
          </div>
        ) : (
          <p className="font-mono text-xs text-primary">✓ Sınır analizi tamam. Son dosya: Chadwick (B06).</p>
        )}
      </TaskSection>
    </ChapterShell>
  );
}

// B06 — Chadwick Dosyası: build the evolution chain yourself.
const CHAIN = [
  "Dalton: sabit oranlar → bölünemez küre",
  "Thomson: katot ışınları → elektron, gömülü model",
  "Rutherford: geri saçılma → küçük yoğun çekirdek, boşluk atom",
  "Bohr: kesikli spektrum → belirli enerji düzeyleri",
  "Chadwick: kütle fazlası + yüksüz ışınım → nötron",
];

export function ChadwickFile({ content, tasksDone }: { content: MissionContent; tasksDone: string[] }) {
  const complete = useCompleteTask(content.id);
  const [match, setMatch] = useState("");
  const siralamaDone = tasksDone.includes("siralama");
  const zincirDone = tasksDone.includes("zincir");

  return (
    <ChapterShell content={content} tasksDone={tasksDone}>
      <TaskSection id="dosya" title="Kanıt dosyaları" done={tasksDone.length > 0}>
        <EvidenceFileList files={content.evidenceFiles} />
      </TaskSection>

      <TaskSection id="siralama" title="Zaman çizelgesi hazır verilmeyecek — zinciri sen kur" done={siralamaDone} hint="Kanıt parçalarını model değişiminin gerçekleştiği sıraya diz.">
        <OrderChainTask id="chadwick" steps={CHAIN} done={siralamaDone} onComplete={() => complete.mutate({ taskKey: "siralama" })} />
      </TaskSection>

      <TaskSection id="zincir" title="Her adımın değişimi ne zorunlu kıldı?" done={zincirDone}>
        {!zincirDone ? (
          <div className="space-y-3">
            <p className="text-sm text-foreground/90">
              Soru: Chadwick'in nötron keşfi, atom modelinde “model değişimi” mi “model tamamlaması” mı? Gerekçelendir.
            </p>
            <div className="grid gap-2">
              {[
                { id: "tamamlama", text: "Tamamlama — çekirdeğin eksik kütlesini açıkladı; atomun ana resmi değişmedi." },
                { id: "degisim", text: "Değişim — modelin tüm çerçevesi yeniden yazıldı." },
              ].map((o) => (
                <Button key={o.id} size="sm" variant={match === o.id ? "default" : "outline"} className="justify-start text-left" onClick={() => setMatch(o.id)} data-testid={`chadwick-choice-${o.id}`}>
                  {o.text}
                </Button>
              ))}
            </div>
            <Button
              size="sm"
              disabled={!match}
              onClick={() => complete.mutate({ taskKey: "zincir", answers: { secim: match } })}
              data-testid="chadwick-zincir-submit-button"
            >
              Zinciri tamamla
            </Button>
          </div>
        ) : (
          <p className="font-mono text-xs text-primary">
            ✓ Gelişim zinciri kuruldu: Dalton → Thomson → Rutherford → Bohr → Chadwick. Final görevi açıldı.
          </p>
        )}
      </TaskSection>
    </ChapterShell>
  );
}

// FINAL — Bilimsel Kırılma: open-ended essay + AI analytic rubric pre-assessment.
export function FinalTask({ content }: { content: MissionContent; tasksDone: string[] }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [result, setResult] = useState<Submission | null>(null);

  const mySubs = qc.getQueryData<Submission[]>(["my-submissions"]);

  const submit = useMutation({
    mutationFn: () => apiPost<Submission>("/assessment/score", { text: text.trim() }),
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ["my-submissions"] });
      qc.invalidateQueries({ queryKey: ["missions"] });
      qc.invalidateQueries({ queryKey: ["session"] });
      toast.success("Cevabın AI ön değerlendirmesinden geçti ve öğretmen paneline iletildi.", { id: "final" });
    },
    onError: () => toast.error("Değerlendirilemedi — metnin en az 20 karakter olmalı."),
  });

  const last = result ?? mySubs?.[0] ?? null;

  return (
    <ChapterShell content={content}>
      <TaskSection id="gonderim" title="Final Görev — Bilimsel Kırılma" done={!!last} hint={FINAL_PROMPT}>
        {!last ? (
          <div className="space-y-3">
            <p className="text-sm text-foreground/90">{FINAL_PROMPT}</p>
            <p className="font-mono text-[11px] text-muted-foreground">
              Değerlendirme: Bilimsel bilginin değişebilirliği · kanıt-model ilişkisi · tarihsel gelişim · nedensel akıl yürütme.
              AI cevabını öğrencinin yerine yazmaz; yalnızca rubrikle ön puanlama yapar.
            </p>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={7}
              maxLength={6000}
              placeholder="Cevabını buraya yaz… (en az 40 karakter)"
              data-testid="final-essay-input"
              aria-label="Final cevabı"
            />
            <Button
              size="sm"
              disabled={text.trim().length < 40 || submit.isPending}
              onClick={() => submit.mutate()}
              data-testid="final-essay-submit-button"
            >
              {submit.isPending ? "Değerlendiriliyor…" : "Gönder ve ön değerlendirme al"}
            </Button>
          </div>
        ) : (
          <RubricResultCard submission={last} />
        )}
      </TaskSection>
    </ChapterShell>
  );
}

export function RubricResultCard({ submission }: { submission: Submission }) {
  const ai = submission.ai;
  if (!ai) return null;
  return (
    <div className="space-y-3 hud-frame glass glass-cyan p-4" data-testid="rubric-result">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs tracking-widest text-cyan-300">AI ÖN DEĞERLENDİRMESİ</p>
        <Badge variant="outline" className="border-amber-500/50 text-amber-400">
          Öğretmen nihai değerlendirmeyi yapar
        </Badge>
      </div>
      <div className="grid gap-2 sm:grid-cols-3" data-testid="rubric-scores">
        {[
          { label: "Bilimin Doğası", value: ai.nature, max: 3 },
          { label: "Kavramsal Doğruluk", value: ai.conceptual, max: 3 },
          { label: "Sentez / Değerlendirme", value: ai.synthesis, max: 4 },
        ].map((r) => (
          <div key={r.label} className="rounded-sm border border-border bg-card/70 p-3">
            <p className="font-mono text-[10px] text-muted-foreground">{r.label.toUpperCase()}</p>
            <p className="mt-1 font-heading text-2xl text-primary">
              {r.value}
              <span className="text-sm text-muted-foreground">/{r.max}</span>
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(r.value / r.max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="font-heading text-lg text-amber-400" data-testid="rubric-total">
        Toplam öneri: {ai.total}/10
      </p>
      <p className="text-sm leading-relaxed text-foreground/90" data-testid="rubric-rationale">{ai.rationale}</p>
      {ai.suggestions.length > 0 && (
        <div>
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground">GELİŞİM ÖNERİLERİ</p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
            {ai.suggestions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {ai.misconceptions.length > 0 && (
        <div className="rounded-sm border border-amber-500/30 bg-amber-500/5 p-3" data-testid="rubric-misconceptions">
          <p className="font-mono text-[10px] tracking-widest text-amber-400">OLASI KAVRAM YANILGISI GÖSTERGESİ</p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-amber-200/90">
            {ai.misconceptions.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Bu bir teşhis değildir; öğretmenin incelemesine sunulur.
          </p>
        </div>
      )}
      {submission.teacher && (
        <div className="rounded-sm border border-primary/40 bg-primary/5 p-3" data-testid="rubric-teacher-review">
          <p className="font-mono text-[10px] tracking-widest text-primary">ÖĞRETMEN DEĞERLENDİRMESİ</p>
          <p className="mt-1 text-sm text-foreground">
            {submission.teacher.total}/10 {submission.teacher.accepted ? "(AI puanı kabul edildi)" : "(öğretmen puanı)"}
          </p>
          {submission.teacher.feedback && <p className="mt-1 text-xs text-muted-foreground">{submission.teacher.feedback}</p>}
        </div>
      )}
    </div>
  );
}

// JIGSAW — expert groups + assembly synthesis.
export function JigsawBoard({ content, tasksDone }: { content: MissionContent; tasksDone: string[] }) {
  const complete = useCompleteTask(content.id);
  const [expert, setExpert] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [synthesis, setSynthesis] = useState("");
  const uzmanDone = tasksDone.includes("uzman-notu");
  const sentezDone = tasksDone.includes("sentez");

  return (
    <ChapterShell content={content}>
      <TaskSection id="uzman-notu" title="Aşama 1 — Uzman grubuna katıl" done={uzmanDone} hint="Sadece kendi uzmanınla ilgili kanıt dosyasını çalışırsın; diğerleri 'arkadaş dosyası' olarak gelir.">
        {!uzmanDone ? (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              {JIGSAW_EXPERTS.map((e) => (
                <Button
                  key={e.id}
                  size="sm"
                  variant={expert === e.id ? "default" : "outline"}
                  onClick={() => setExpert(e.id)}
                  data-testid={`jigsaw-expert-${e.id}`}
                >
                  {e.emoji} {e.label}
                </Button>
              ))}
            </div>
            {expert && (
              <div className="space-y-2 animate-fade-up" data-testid="jigsaw-notes-form">
                {JIGSAW_FIELDS.map((f) => (
                  <div key={f.id}>
                    <label className="font-mono text-[10px] tracking-widest text-muted-foreground" htmlFor={`jigsaw-${f.id}`}>
                      {f.label.toUpperCase()}
                    </label>
                    <Textarea
                      id={`jigsaw-${f.id}`}
                      value={notes[f.id] ?? ""}
                      onChange={(e) => setNotes((n) => ({ ...n, [f.id]: e.target.value }))}
                      rows={2}
                      maxLength={400}
                      className="mt-1"
                      data-testid={`jigsaw-note-${f.id}`}
                      aria-label={f.label}
                    />
                  </div>
                ))}
                <Button
                  size="sm"
                  disabled={JIGSAW_FIELDS.some((f) => (notes[f.id] ?? "").trim().length < 8)}
                  onClick={() => {
                    complete.mutate({
                      taskKey: "uzman-notu",
                      answers: { expert_role: expert ?? "", ...Object.fromEntries(JIGSAW_FIELDS.map((f) => [f.id, (notes[f.id] ?? "").trim()])) },
                    });
                    toast.success("Uzman notun kaydedildi. Şimdi ana gruba dön.", { id: "jigsaw-notes" });
                  }}
                  data-testid="jigsaw-notes-submit-button"
                >
                  Uzman notunu kaydet
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="font-mono text-xs text-primary">✓ Uzman notu kaydedildi.</p>
        )}
      </TaskSection>

      <TaskSection id="sentez" title="Aşama 2 — Ana grup: birlikte sentez" done={sentezDone} hint="Ana görev: 'Atom teorilerinin neden zaman içinde değiştiğini açıklayın.'">
        {!sentezDone ? (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2" data-testid="jigsaw-peer-notes">
              {JIGSAW_EXPERTS.map((e) => {
                const peer = JIGSAW_PEER_NOTES[e.id];
                const isMine = uzmanDone && true; // own notes + peer briefs side by side
                return (
                  <div key={e.id} className={cn("rounded-sm border p-3 text-xs", isMine ? "border-cyan-500/30 bg-[#0B1420]" : "border-border bg-card/60")}>
                    <p className="font-mono text-[10px] text-cyan-300">{e.emoji} {e.label}</p>
                    <ul className="mt-1 space-y-0.5 text-muted-foreground">
                      {JIGSAW_FIELDS.map((f) => (
                        <li key={f.id}>
                          <span className="text-foreground/80">{f.label}:</span> {peer[f.id]}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
            <Textarea
              value={synthesis}
              onChange={(e) => setSynthesis(e.target.value)}
              placeholder="Grup sentezinizi yazın: her uzmanın getirdiği bilgiyi birleştirin…"
              rows={4}
              maxLength={800}
              data-testid="jigsaw-synthesis-input"
              aria-label="Grup sentezi"
            />
            <Button
              size="sm"
              disabled={synthesis.trim().length < 40}
              onClick={() => complete.mutate({ taskKey: "sentez", answers: { synthesis: synthesis.trim() } })}
              data-testid="jigsaw-synthesis-submit-button"
            >
              Sentezi gönder
            </Button>
          </div>
        ) : (
          <p className="font-mono text-xs text-primary">✓ Sentez tamamlandı — Bilim Ekibi rozetini kazandın.</p>
        )}
      </TaskSection>
    </ChapterShell>
  );
}
