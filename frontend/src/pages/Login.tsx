import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Atom,
  BadgeCheck,
  BellOff,
  Bot,
  ChevronRight,
  EyeOff,
  Fingerprint,
  GraduationCap,
  KeyRound,
  Radar,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppFooter from "@/components/layout/AppFooter";
import AmbientBackground from "@/components/layout/AmbientBackground";
import { apiPost } from "@/lib/api";
import { beginSession, useSession } from "@/lib/session";
import type { UserProfile } from "@/types";

const BRIEFING = [
  { icon: Fingerprint, title: "Takma kimlik", text: "Gerçek ad-soyad, T.C. kimlik no, adres, telefon veya e-posta istenmez. Kimliğin: Dedektif Kodu + takma ad." },
  { icon: Bot, title: "Dr. Nova protokolü", text: "AI mentor hazır cevap vermez; kanıt ister, gerekçeni sorgular. Kişisel bilgi istemez, senin yerine ödev yazmaz." },
  { icon: EyeOff, title: "Cevaplar gizlidir", text: "Öğrenciler birbirlerinin cevaplarını, rubrik puanlarını veya öğretmen geri bildirimlerini göremez." },
  { icon: BellOff, title: "Reklam yok, takip yok", text: "Reklam, davranışsal profilleme ve gereksiz üçüncü taraf analitik bulunmaz." },
  { icon: Radar, title: "Sentetik veri", text: "Tüm demo öğrenci verileri sentetiktir; gerçek öğrenci verisi kullanılmaz." },
];

export default function Login() {
  const navigate = useNavigate();
  const { data: existing } = useSession();
  const [code, setCode] = useState("");
  const [teacherCode, setTeacherCode] = useState("");
  const [pin, setPin] = useState("");

  const login = useMutation({
    mutationFn: (body: { code: string; pin?: string }) => apiPost<UserProfile>("/auth/login", body),
    onSuccess: async (user) => {
      await beginSession();
      toast.success(`Giriş başarılı — hoş geldin, ${user.nickname ?? user.code}`);
      navigate(user.role === "student" ? "/" : "/pano", { replace: true });
    },
    onError: (err: unknown) => {
      const detail = (err as { body?: { detail?: string } })?.body?.detail;
      toast.error(detail ?? "Giriş yapılamadı.");
    },
  });

  useEffect(() => {
    if (existing) navigate(existing.role === "student" ? "/" : "/pano", { replace: true });
  }, [existing, navigate]);

  return (
    <div className="relative flex min-h-svh flex-col">
      <AmbientBackground />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        {/* title plate */}
        <div className="animate-fade-up text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" aria-hidden />
            <p className="font-mono text-[10px] tracking-[0.3em] text-amber-300">TOP SECRET // BİLİMSEL SORUŞTURMA</p>
          </div>
          <h1 className="mt-4 font-heading text-4xl leading-none text-primary text-glow sm:text-6xl">
            KUANTUM DEDEKTİFLERİ
          </h1>
          <p className="mt-1 font-heading text-xl text-foreground/90 sm:text-2xl">
            BİLİMSEL KIRILMA
            <span className="ml-1 animate-blink text-primary">▊</span>
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:mx-0">
            9. sınıf Kimya için oyunlaştırılmış bilim dedektifliği. Görevin:{" "}
            <em className="text-foreground/90">atomun doğasını anlamaya çalışırken bilimsel modellerin neden değiştiğini keşfetmek</em>{" "}
            — kanıt topla, modelleri sorgula, çıkarım yap. Öğrenme çıktısı:{" "}
            <span className="font-mono text-primary">KİM.9.1.3</span>
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_420px]">
          {/* MISSION BRIEFING panel */}
          <section
            className="hud-frame hud-ticks jigsaw-edge glass glass-cyan animate-fade-up p-6"
            data-testid="privacy-summary-card"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-amber-300" aria-hidden />
              <p className="font-mono text-xs tracking-[0.25em] text-amber-300">GÖREV BRİFİNGİ</p>
              <span className="ml-auto rounded-sm border border-amber-500/30 px-2 py-0.5 font-mono text-[10px] text-amber-200/80">
                DOSYA: KD-9.1.3
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Ajan dosyanı açmadan önce güvenli kullanım kurallarını oku. Bu platform öğrenci mahremiyetini
              teknik olarak korur — sadece metin olarak değil.
            </p>

            <ul className="mt-5 space-y-3">
              {BRIEFING.map(({ icon: Icon, title, text }) => (
                <li key={title} className="hover-lift jigsaw-edge flex items-start gap-3 rounded-lg border border-white/5 bg-black/25 p-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-orange-500/30 bg-orange-500/10">
                    <Icon size={14} className="text-primary" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm text-foreground">{title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-white/5 pt-4">
              <p className="inline-flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                <BadgeCheck size={11} className="text-primary" aria-hidden />
                KVKK ve ilgili mevzuat gözetilerek tasarlanmıştır
              </p>
            </div>
          </section>

          {/* SYSTEM LOGIN TERMINAL */}
          <section
            className="hud-frame hud-ticks jigsaw-edge glass glass-emerald animate-fade-up scanlines p-6"
            data-testid="login-card"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-orange-500/40 bg-orange-500/10">
                <KeyRound size={14} className="text-primary" aria-hidden />
              </span>
              <div>
                <p className="font-mono text-xs tracking-[0.2em] text-primary">SİSTEM GİRİŞ TERMİNALİ</p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  durum: <span className="text-primary">ÇEVRİMİÇİ</span> · şifreleme: aktif
                </p>
              </div>
              <Atom size={18} className="ml-auto animate-orbit-slow text-amber-400/70" aria-hidden />
            </div>

            <Tabs defaultValue="student" className="mt-5">
              <TabsList className="w-full">
                <TabsTrigger value="student" className="flex-1" data-testid="login-tab-student">
                  <UserRound size={14} aria-hidden /> Öğrenci
                </TabsTrigger>
                <TabsTrigger value="teacher" className="flex-1" data-testid="login-tab-teacher">
                  <GraduationCap size={14} aria-hidden /> Öğretmen
                </TabsTrigger>
              </TabsList>

              <TabsContent value="student" className="mt-5">
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    login.mutate({ code });
                  }}
                >
                  <div>
                    <Label htmlFor="student-code" className="font-mono text-[11px] tracking-widest text-muted-foreground">
                      DEDEKTİF KODU
                    </Label>
                    <div className="relative mt-1.5">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-primary/70">
                        &gt;
                      </span>
                      <Input
                        id="student-code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="KD-2048"
                        autoComplete="off"
                        className="pl-7 font-mono tracking-widest"
                        data-testid="login-student-code-input"
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      Şifre gerekmez — kodu okulun verir. Kişisel bilgi toplanmaz.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="jigsaw-btn group relative w-full font-heading tracking-wider"
                    disabled={login.isPending || !code.trim()}
                    data-testid="login-student-submit-button"
                  >
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" aria-hidden />
                    {login.isPending ? "DOĞRULANIYOR…" : "GÖREVE BAŞLA"}
                    <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden />
                  </Button>

                  <div className="rounded-lg border border-white/5 bg-black/30 p-3" data-testid="login-demo-hint">
                    <p className="font-mono text-[10px] tracking-widest text-muted-foreground">DEMO ERİŞİM KODLARI</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {["KD-2048", "KD-2001", "KD-2011"].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCode(c)}
                          className="rounded-md border border-orange-500/25 bg-orange-500/5 px-2 py-1 font-mono text-[11px] text-primary transition-colors hover:border-orange-400/60"
                          data-testid={`login-demo-code-${c}`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      KD-2048 sıfırdan başlar · KD-2001…KD-2029 ilerlemeli dosyalar
                    </p>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="teacher" className="mt-5">
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    login.mutate({ code: teacherCode, pin });
                  }}
                >
                  <div>
                    <Label htmlFor="teacher-code" className="font-mono text-[11px] tracking-widest text-muted-foreground">
                      ÖĞRETMEN KODU
                    </Label>
                    <Input
                      id="teacher-code"
                      value={teacherCode}
                      onChange={(e) => setTeacherCode(e.target.value)}
                      placeholder="OG-1001"
                      autoComplete="off"
                      className="mt-1.5 font-mono tracking-widest"
                      data-testid="login-teacher-code-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="teacher-pin" className="font-mono text-[11px] tracking-widest text-muted-foreground">
                      GÜVENLİK PIN'İ
                    </Label>
                    <Input
                      id="teacher-pin"
                      type="password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="••••"
                      autoComplete="current-password"
                      className="mt-1.5 font-mono tracking-[0.5em]"
                      data-testid="login-teacher-pin-input"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="jigsaw-btn group w-full font-heading tracking-wider"
                    disabled={login.isPending || !teacherCode.trim() || !pin}
                    data-testid="login-teacher-submit-button"
                  >
                    {login.isPending ? "DOĞRULANIYOR…" : "KOMUTA MERKEZİNE GİR"}
                    <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden />
                  </Button>
                  <p className="rounded-lg border border-white/5 bg-black/30 p-3 font-mono text-[10px] text-muted-foreground">
                    DEMO: OG-1001 · PIN 4321
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </section>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
