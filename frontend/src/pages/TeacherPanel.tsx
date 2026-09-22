import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { AlertTriangle, BarChart3, CheckSquare, LayoutDashboard, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiGet, apiPatch } from "@/lib/api";
import { OUTCOME_LABELS, RUBRIC_INFO } from "@/lib/missions";
import type {
  MisconceptionReport,
  OkResponse,
  Submission,
  TeacherOverview,
  TeacherSettings,
  TeacherStudentDetail,
  TeacherStudentRow,
  UserProfile,
} from "@/types";
import { cn } from "@/lib/utils";

const CHART_COLORS = ["#10B981", "#F59E0B", "#06B6D4", "#38BDF8", "#EF4444"];

export default function TeacherPanel({ user }: { user: UserProfile }) {
  const overview = useQuery({ queryKey: ["teacher-overview"], queryFn: () => apiGet<TeacherOverview>("/teacher/overview") });
  const students = useQuery({ queryKey: ["teacher-students"], queryFn: () => apiGet<TeacherStudentRow[]>("/teacher/students") });
  const misconceptions = useQuery({ queryKey: ["teacher-misconceptions"], queryFn: () => apiGet<MisconceptionReport>("/teacher/misconceptions") });
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  const o = overview.data;

  return (
    <div>
      <header>
        <p className="font-mono text-xs tracking-[0.3em] text-amber-400">ÖĞRETMEN KOMUTA MERKEZİ</p>
        <h1 className="mt-1 font-heading text-3xl text-primary text-glow" data-testid="teacher-title">
          Öğretmen Paneli
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Yalnızca eğitimsel olarak gerekli veriler gösterilir. Gerçek ad, cihaz, konum veya davranışsal
          izleme verisi tutulmaz; tüm demo verileri sentetiktir.
        </p>
      </header>

      <Tabs defaultValue="dashboard" className="mt-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="dashboard" data-testid="teacher-nav-overview">
            <LayoutDashboard size={14} aria-hidden /> Genel Bakış
          </TabsTrigger>
          <TabsTrigger value="students" data-testid="teacher-nav-students">
            <Users size={14} aria-hidden /> Sınıflarım & Öğrenciler
          </TabsTrigger>
          <TabsTrigger value="misconceptions" data-testid="teacher-nav-radar">
            <AlertTriangle size={14} aria-hidden /> Kavram Yanılgısı Radarı
          </TabsTrigger>
          <TabsTrigger value="rubric" data-testid="teacher-nav-rubric">
            <CheckSquare size={14} aria-hidden /> Rubrik & AI Değerlendirme
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="teacher-nav-analytics">
            <BarChart3 size={14} aria-hidden /> Öğrenme Analitiği
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="teacher-nav-settings">
            <Settings size={14} aria-hidden /> Ayarlar
          </TabsTrigger>
        </TabsList>

        {/* ---------------- overview ---------------- */}
        <TabsContent value="dashboard" className="mt-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="teacher-stats">
            <Stat label="TOPLAM ÖĞRENCİ" value={o?.total_students ?? "—"} testid="teacher-stat-total" />
            <Stat label="AKTİF ÖĞRENCİ (7 GÜN)" value={o?.active_students ?? "—"} testid="teacher-stat-active" />
            <Stat label="GÖREV TAMAMLAMA ORANI" value={o ? `${o.mission_completion_rate}%` : "—"} testid="teacher-stat-completion" />
            <Stat label="AI ÖN DEĞERLENDİRME" value={o?.ai_assessment_count ?? "—"} testid="teacher-stat-ai" />
            <Stat label="ÖĞRETMEN İNCELEMESİ" value={o?.teacher_reviewed_count ?? "—"} testid="teacher-stat-reviewed" />
            <Stat label="SINIF" value={user.class_id ?? "9-A"} testid="teacher-stat-class" />
          </div>

          <section className="mt-4 hud-frame glass glass-cyan p-4" data-testid="teacher-outcome-card">
            <p className="font-mono text-xs tracking-widest text-cyan-300">ÖĞRENME ÇIKTISI — {o?.kim_code ?? "KİM.9.1.3"}</p>
            <p className="mt-1 text-sm text-foreground/90">{o?.kim_text}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-4">
              {(o?.outcome_distribution ?? []).map((d, i) => (
                <div key={d.key} className="rounded-lg border border-white/5 bg-black/30 p-3" data-testid={`teacher-outcome-${d.key}`}>
                  <p className="font-mono text-[10px] text-muted-foreground">{d.label.toUpperCase()}</p>
                  <p className="mt-1 font-heading text-2xl" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>
                    {d.count}
                  </p>
                  <p className="text-[10px] text-muted-foreground">öğrenci</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground">
              Bu göstergeler not değildir; öğrencinin hangi boyutta desteğe ihtiyaç duyduğunu gösterir.
            </p>
          </section>

          <section className="mt-4 hud-frame glass p-4" data-testid="teacher-mission-chart">
            <p className="font-mono text-xs tracking-widest text-amber-400">GÖREV BAZLI TAMAMLAMA</p>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={o?.mission_completion ?? []} margin={{ left: -18, right: 8, bottom: 4 }}>
                  <CartesianGrid stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="code" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: 8, fontSize: 12 }}
                    formatter={(value: number) => [`${value} öğrenci`, "Tamamlayan"]}
                    labelFormatter={(label: string) => {
                      const m = (o?.mission_completion ?? []).find((x) => x.code === label);
                      return m?.title ?? label;
                    }}
                  />
                  <Bar dataKey="completed" radius={[4, 4, 0, 0]}>
                    {(o?.mission_completion ?? []).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </TabsContent>

        {/* ---------------- students ---------------- */}
        <TabsContent value="students" className="mt-5">
          <section className="hud-frame glass p-4" data-testid="teacher-students-table">
            <p className="font-mono text-xs tracking-widest text-amber-400">
              SINIF {user.class_id ?? "9-A"} — ÖĞRENCİLER (takma kimlikle)
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dedektif ID</TableHead>
                  <TableHead>Takma ad</TableHead>
                  <TableHead>XP</TableHead>
                  <TableHead>Görev</TableHead>
                  <TableHead>Rozet</TableHead>
                  <TableHead>Öğrenme çıktısı</TableHead>
                  <TableHead>İncele</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(students.data ?? []).map((s) => (
                  <TableRow key={s.id} data-testid={`teacher-student-row-${s.code}`}>
                    <TableCell className="font-mono text-xs text-primary">{s.code}</TableCell>
                    <TableCell className="text-xs">{s.nickname ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{s.xp}</TableCell>
                    <TableCell className="font-mono text-xs">{s.missions_completed}/6</TableCell>
                    <TableCell className="font-mono text-xs">{s.badges}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{OUTCOME_LABELS[s.outcome] ?? s.outcome}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="xs" variant="outline" onClick={() => setSelectedStudent(s.id)} data-testid={`teacher-student-open-${s.code}`}>
                        Cevapları aç
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {(students.data ?? []).length === 0 && (
              <p className="mt-3 text-sm text-muted-foreground" data-testid="teacher-students-empty">Öğrenci verisi yüklenemedi.</p>
            )}
          </section>

          {selectedStudent && <StudentDetail studentId={selectedStudent} onClose={() => setSelectedStudent(null)} />}
        </TabsContent>

        {/* ---------------- misconceptions ---------------- */}
        <TabsContent value="misconceptions" className="mt-5">
          <section className="hud-frame glass glass-amber p-4" data-testid="teacher-misconception-radar">
            <p className="font-mono text-xs tracking-widest text-amber-400">KAVRAM YANILGISI RADARI</p>
            <p className="mt-1 text-xs text-muted-foreground">{misconceptions.data?.note}</p>
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={(misconceptions.data?.indicators ?? []).map((i) => ({ label: i.label.split(" ").slice(0, 3).join(" "), percent: i.percent }))}>
                  <PolarGrid stroke="#1E293B" />
                  <PolarAngleAxis dataKey="label" stroke="#94A3B8" fontSize={10} />
                  <PolarRadiusAxis stroke="#1E293B" fontSize={10} domain={[0, 100]} />
                  <Radar dataKey="percent" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
                  <Tooltip
                    contentStyle={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: 8, fontSize: 12 }}
                    formatter={(value: number) => [`%${value}`, "Sınıf oranı"]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="mt-4 grid gap-3 md:grid-cols-2" data-testid="teacher-misconception-cards">
            {(misconceptions.data?.indicators ?? []).map((ind) => (
              <div key={ind.key} className="hud-frame glass p-4" data-testid={`misconception-card-${ind.key}`}>
                <p className="flex items-start gap-2 text-sm text-foreground">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-400" aria-hidden />
                  Olası kavram yanılgısı göstergesi: {ind.label}
                </p>
                <p className="mt-2 font-heading text-2xl text-amber-400">
                  {ind.count} / {misconceptions.data?.class_size ?? 0}
                  <span className="ml-2 text-sm text-muted-foreground">%{ind.percent}</span>
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${ind.percent}%` }} />
                </div>
                {ind.samples.length > 0 && (
                  <div className="mt-3">
                    <p className="font-mono text-[10px] tracking-widest text-muted-foreground">İNCELENMESİ ÖNERİLEN CEVAP ÖRÜNTÜLERİ</p>
                    <ul className="mt-1 space-y-1">
                      {ind.samples.map((s, i) => (
                        <li key={i} className="rounded-sm border border-border/60 bg-secondary/30 p-2 text-[11px] text-muted-foreground">
                          <span className="font-mono text-primary">{s.code}</span> · {s.source}
                          <p className="mt-0.5 italic text-foreground/80">“{s.excerpt}…”</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Kesin teşhis değildir; pedagojik değerlendirme öğretmene aittir.
                </p>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ---------------- rubric ---------------- */}
        <TabsContent value="rubric" className="mt-5">
          <RubricQueue />
        </TabsContent>

        {/* ---------------- analytics ---------------- */}
        <TabsContent value="analytics" className="mt-5">
          <section className="hud-frame glass p-4" data-testid="teacher-analytics">
            <p className="font-mono text-xs tracking-widest text-amber-400">ÖĞRENME ANALİTİĞİ (TOPLULAŞTIRILMIŞ)</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Veri minimizasyonu gereği sınıf düzeyinde toplulaştırılmış gösterimler kullanılır.
            </p>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={o?.outcome_distribution ?? []} margin={{ left: -18, right: 8 }}>
                  <CartesianGrid stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: 8, fontSize: 12 }}
                    formatter={(value: number) => [`${value} öğrenci`, "KİM.9.1.3"]}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {(o?.outcome_distribution ?? []).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {(misconceptions.data?.indicators ?? []).slice(0, 2).map((ind) => (
              <p key={ind.key} className="mt-3 rounded-sm border border-amber-500/25 bg-amber-500/5 p-3 text-xs text-amber-200/90">
                “Sınıfın %{ind.percent} kadarında {ind.label.toLowerCase()} konusunda ek destek gerekebilir.” — öğretmenin
                incelemesine sunulan öğrenme kanıtıdır, kesin teşhis değildir.
              </p>
            ))}
          </section>
        </TabsContent>

        {/* ---------------- settings ---------------- */}
        <TabsContent value="settings" className="mt-5">
          <LeaderboardSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value, testid }: { label: string; value: string | number; testid: string }) {
  return (
    <div className="hud-frame glass p-4" data-testid={testid}>
      <p className="font-mono text-[10px] tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 font-heading text-2xl text-foreground">{value}</p>
    </div>
  );
}

function StudentDetail({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const detail = useQuery({
    queryKey: ["teacher-student", studentId],
    queryFn: () => apiGet<TeacherStudentDetail>(`/teacher/students/${studentId}`),
  });
  const d = detail.data;

  return (
    <section className="mt-4 hud-frame glass glass-cyan p-4" data-testid="teacher-student-detail">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs tracking-widest text-cyan-300">ÖĞRENCİ CEVAP ANALİZİ</p>
          <p className="mt-1 font-mono text-lg text-primary">{d?.code ?? "…"} · {d?.nickname ?? ""}</p>
          <p className="text-[11px] text-muted-foreground">
            XP {d?.xp ?? 0} · Tamamlanan görev {d?.missions_completed.length ?? 0} · Öğrenme çıktısı:{" "}
            {d ? OUTCOME_LABELS[d.outcome] ?? d.outcome : "—"}
          </p>
        </div>
        <Button size="xs" variant="ghost" onClick={onClose} data-testid="teacher-student-detail-close">Kapat</Button>
      </div>

      {(d?.submissions ?? []).length === 0 && (
        <p className="mt-3 text-xs text-muted-foreground" data-testid="teacher-student-no-submissions">
          Bu öğrencinin henüz final görev cevabı yok.
        </p>
      )}
      <div className="mt-3 space-y-3">
        {(d?.submissions ?? []).map((s) => (
          <SubmissionReviewCard key={s.id} submission={s} studentId={studentId} />
        ))}
      </div>

      {(d?.open_answers ?? []).length > 0 && (
        <div className="mt-4">
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground">GÖREV İÇİ AÇIK UÇLU CEVAPLAR</p>
          <div className="mt-2 space-y-2">
            {(d?.open_answers ?? []).map((a, i) => (
              <div key={i} className="rounded-sm border border-border bg-card/60 p-2 text-[11px]">
                <p className="font-mono text-primary">{a.mission_id} / {a.task_key}</p>
                {Object.entries(a.answers).map(([k, v]) => (
                  <p key={k} className="mt-0.5 text-muted-foreground">
                    <span className="text-foreground/70">{k}:</span> {v}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function SubmissionReviewCard({ submission, studentId }: { submission: Submission; studentId?: string }) {
  const qc = useQueryClient();
  const ai = submission.ai;
  const [nature, setNature] = useState(submission.teacher?.nature ?? ai?.nature ?? 0);
  const [conceptual, setConceptual] = useState(submission.teacher?.conceptual ?? ai?.conceptual ?? 0);
  const [synthesis, setSynthesis] = useState(submission.teacher?.synthesis ?? ai?.synthesis ?? 0);
  const [feedback, setFeedback] = useState(submission.teacher?.feedback ?? "");
  const [overriding, setOverriding] = useState(false);

  const review = useMutation({
    mutationFn: (action: "accept" | "override") =>
      apiPatch<OkResponse>(`/teacher/submissions/${submission.id}`, {
        action,
        nature,
        conceptual,
        synthesis,
        feedback,
      }),
    onSuccess: (_d, action) => {
      qc.invalidateQueries({ queryKey: ["teacher-student", studentId] });
      qc.invalidateQueries({ queryKey: ["teacher-overview"] });
      qc.invalidateQueries({ queryKey: ["teacher-submissions"] });
      toast.success(action === "accept" ? "AI ön değerlendirmesi kabul edildi." : "Öğretmen puanı kaydedildi.");
      setOverriding(false);
    },
    onError: () => toast.error("Değerlendirme kaydedilemedi."),
  });

  if (!ai) return null;

  return (
    <div className="hud-frame glass p-4" data-testid={`submission-review-${submission.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[11px] text-primary">{submission.code} · {submission.nickname ?? "—"}</p>
        <Badge variant="outline" className={cn("text-[10px]", submission.teacher ? "border-primary/50 text-primary" : "border-amber-500/50 text-amber-400")}>
          {submission.teacher ? "ÖĞRETMEN İNCELEDİ" : "AI ÖN DEĞERLENDİRMESİ BEKLEMEDE"}
        </Badge>
      </div>

      <p className="mt-2 font-mono text-[10px] tracking-widest text-muted-foreground">GÖREV SORUSU</p>
      <p className="text-[11px] text-muted-foreground">{submission.prompt}</p>

      <p className="mt-3 font-mono text-[10px] tracking-widest text-muted-foreground">ÖĞRENCİ CEVABI</p>
      <p className="mt-1 rounded-sm border border-border/60 bg-secondary/30 p-3 text-sm leading-relaxed text-foreground/90" data-testid={`submission-text-${submission.id}`}>
        {submission.text}
      </p>

      <div className="mt-3 rounded-sm border border-cyan-500/25 bg-[#0B1420] p-3">
        <p className="font-mono text-[10px] tracking-widest text-cyan-300">AI ÖN DEĞERLENDİRMESİ (öneri)</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <p className="text-xs text-muted-foreground">Bilimin Doğası: <span className="font-mono text-foreground">{ai.nature}/3</span></p>
          <p className="text-xs text-muted-foreground">Kavramsal Doğruluk: <span className="font-mono text-foreground">{ai.conceptual}/3</span></p>
          <p className="text-xs text-muted-foreground">Sentez: <span className="font-mono text-foreground">{ai.synthesis}/4</span></p>
        </div>
        <p className="mt-2 font-heading text-lg text-amber-400" data-testid={`submission-ai-total-${submission.id}`}>
          Toplam öneri: {ai.total}/10
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{ai.rationale}</p>
        {ai.misconceptions.length > 0 && (
          <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[11px] text-amber-200/90">
            {ai.misconceptions.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[10px] text-muted-foreground">
          AI puanı kesin not değildir; nihai pedagojik değerlendirme öğretmene aittir.
        </p>
      </div>

      {submission.teacher && !overriding ? (
        <div className="mt-3 rounded-sm border border-primary/40 bg-primary/5 p-3" data-testid={`submission-teacher-review-${submission.id}`}>
          <p className="font-mono text-[10px] tracking-widest text-primary">ÖĞRETMEN DEĞERLENDİRMESİ</p>
          <p className="mt-1 text-sm text-foreground">
            {submission.teacher.total}/10 {submission.teacher.accepted ? "(AI puanı kabul edildi)" : "(öğretmen puanı)"}
          </p>
          {submission.teacher.feedback && <p className="mt-1 text-xs text-muted-foreground">{submission.teacher.feedback}</p>}
          <Button size="xs" variant="outline" className="mt-2" onClick={() => setOverriding(true)} data-testid={`submission-reopen-${submission.id}`}>
            Değerlendirmeyi güncelle
          </Button>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {overriding && (
            <div className="grid gap-2 sm:grid-cols-3" data-testid={`submission-override-inputs-${submission.id}`}>
              {[
                { key: "nature", label: "Bilimin Doğası (0-3)", value: nature, set: setNature, max: 3 },
                { key: "conceptual", label: "Kavramsal (0-3)", value: conceptual, set: setConceptual, max: 3 },
                { key: "synthesis", label: "Sentez (0-4)", value: synthesis, set: setSynthesis, max: 4 },
              ].map((f) => (
                <div key={f.key}>
                  <label className="font-mono text-[10px] text-muted-foreground" htmlFor={`${submission.id}-${f.key}`}>
                    {f.label}
                  </label>
                  <Input
                    id={`${submission.id}-${f.key}`}
                    type="number"
                    min={0}
                    max={f.max}
                    value={f.value}
                    onChange={(e) => f.set(Math.max(0, Math.min(f.max, Number(e.target.value))))}
                    className="mt-1 font-mono"
                    data-testid={`submission-score-${f.key}-${submission.id}`}
                  />
                </div>
              ))}
            </div>
          )}
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Geri bildirim ekle (öğrenciye görünür)"
            data-testid={`submission-feedback-${submission.id}`}
            aria-label="Öğretmen geri bildirimi"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => review.mutate("accept")}
              disabled={review.isPending}
              data-testid={`submission-accept-${submission.id}`}
            >
              AI puanını kabul et
            </Button>
            {!overriding ? (
              <Button size="sm" variant="outline" onClick={() => setOverriding(true)} data-testid={`submission-override-toggle-${submission.id}`}>
                Puana müdahale et
              </Button>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => review.mutate("override")}
                disabled={review.isPending}
                data-testid={`submission-override-save-${submission.id}`}
              >
                Öğretmen puanını kaydet ({nature + conceptual + synthesis}/10)
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RubricQueue() {
  const students = useQuery({ queryKey: ["teacher-students"], queryFn: () => apiGet<TeacherStudentRow[]>("/teacher/students") });
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div>
      <section className="hud-frame glass p-4" data-testid="teacher-rubric-info">
        <p className="font-mono text-xs tracking-widest text-amber-400">ANALİTİK DERECELİ PUANLAMA ANAHTARI (10 PUAN)</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {RUBRIC_INFO.map((r) => (
            <div key={r.key} className="rounded-sm border border-border/60 bg-secondary/30 p-3">
              <p className="text-sm text-foreground">{r.label}</p>
              <p className="font-mono text-xs text-primary">0–{r.max} puan</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          AI yalnızca ön değerlendirme üretir: önerilen puan, gerekçe, kullanılan kanıt, olası kavram yanılgısı
          göstergesi ve gelişim önerisi. Nihai değerlendirme öğretmenindir.
        </p>
      </section>

      <section className="mt-4 hud-frame glass p-4" data-testid="teacher-rubric-queue">
        <p className="font-mono text-xs tracking-widest text-amber-400">DEĞERLENDİRME KUYRUĞU</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Bir öğrenciyi açarak final görev cevabını ve AI ön değerlendirmesini inceleyin.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(students.data ?? []).map((s) => (
            <Button
              key={s.id}
              size="xs"
              variant={openId === s.id ? "default" : "outline"}
              onClick={() => setOpenId(s.id === openId ? null : s.id)}
              data-testid={`rubric-student-${s.code}`}
            >
              {s.code}
            </Button>
          ))}
        </div>
        {openId && <StudentDetail studentId={openId} onClose={() => setOpenId(null)} />}
      </section>
    </div>
  );
}

function LeaderboardSettings() {
  const qc = useQueryClient();
  const settings = useQuery({ queryKey: ["teacher-settings"], queryFn: () => apiGet<TeacherSettings>("/teacher/settings") });
  const update = useMutation({
    mutationFn: (enabled: boolean) => apiPatch<OkResponse>("/teacher/settings", { leaderboard_enabled: enabled }),
    onSuccess: (_d, enabled) => {
      qc.invalidateQueries({ queryKey: ["teacher-settings"] });
      qc.invalidateQueries({ queryKey: ["teacher-overview"] });
      toast.success(enabled ? "Sınıf içi sıralama açıldı." : "Sınıf içi sıralama kapatıldı.");
    },
    onError: () => toast.error("Ayar kaydedilemedi."),
  });

  const enabled = settings.data?.leaderboard_enabled ?? true;

  return (
    <section className="max-w-2xl hud-frame glass p-4" data-testid="teacher-settings">
      <p className="font-mono text-xs tracking-widest text-amber-400">AYARLAR</p>
      <div className="mt-4 flex items-start gap-3 rounded-sm border border-border/60 bg-secondary/30 p-3">
        <Checkbox
          checked={enabled}
          onCheckedChange={(v) => update.mutate(!!v)}
          id="leaderboard-toggle"
          data-testid="teacher-leaderboard-toggle"
        />
        <div>
          <label htmlFor="leaderboard-toggle" className="text-sm text-foreground">
            Sınıf içi sıralamayı (leaderboard) öğrencilere göster
          </label>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Sıralama yalnızca Dedektif XP gösterir. Öğrenciler birbirlerinin cevaplarını, rubrik puanlarını,
            öğretmen yorumlarını veya kavram yanılgısı göstergelerini göremez. “En başarısız öğrenciler” gibi
            sıralamalar üretilmez.
          </p>
        </div>
      </div>
      <div className="mt-4 rounded-sm border border-cyan-500/25 bg-[#0B1420] p-3">
        <p className="font-mono text-[10px] tracking-widest text-cyan-300">VERİ YAKLAŞIMI</p>
        <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
          <li>• Panelde yalnızca eğitimsel olarak gerekli veriler gösterilir.</li>
          <li>• Cihaz bilgisi, konum, davranışsal izleme ve reklam profili tutulmaz.</li>
          <li>• Saklama süresi: [Kurum tarafından belirlenecek saklama süresi]</li>
          <li>• Tüm demo öğrenci verileri sentetiktir.</li>
        </ul>
      </div>
    </section>
  );
}
