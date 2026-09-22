import { Link } from "react-router-dom";
import { Accessibility, BadgeCheck, FileText, Library, ShieldCheck } from "lucide-react";

const LINKS = [
  {
    to: "/gizlilik",
    icon: ShieldCheck,
    title: "Gizlilik ve Veri Kullanımı",
    desc: "Hangi veriler işleniyor, kimler erişiyor",
    testid: "footer-privacy-link",
  },
  {
    to: "/gizlilik#kvkk",
    icon: FileText,
    title: "KVKK Bilgilendirmesi",
    desc: "Veri sorumlusu ve ilgili kişi hakları",
    testid: "footer-kvkk-link",
  },
  {
    to: "/gizlilik#erisilebilirlik",
    icon: Accessibility,
    title: "Erişilebilirlik",
    desc: "Klavye, kontrast ve duyarlı kullanım",
    testid: "footer-accessibility-link",
  },
  {
    to: "/gizlilik#icerik-kaynaklari",
    icon: Library,
    title: "İçerik Kaynakları",
    desc: "Simülasyon lisansları ve telif notları",
    testid: "footer-sources-link",
  },
];

// HUD-styled footer, matching the login briefing panel language (no flat text list).
export default function AppFooter() {
  return (
    <footer className="relative mt-16 border-t border-white/5 bg-[#070A11]/70 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" aria-hidden />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.35fr]">
          {/* identity plate */}
          <div className="hud-frame glass p-5">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-orange-500/40 bg-orange-500/10 font-mono text-[11px] text-primary">
                KD
              </span>
              <p className="font-heading text-sm tracking-wide text-primary text-glow">
                KUANTUM DEDEKTİFLERİ: BİLİMSEL KIRILMA
              </p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Eğitim amacıyla geliştirilmiş prototiptir. Türkiye Yüzyılı Maarif Modeli 9. sınıf Kimya
              programı, 1. Tema <span className="text-foreground/80">ETKİLEŞİM</span> ve{" "}
              <span className="font-mono text-primary">KİM.9.1.3</span> öğrenme çıktısıyla uyumludur.
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-orange-500/25 bg-orange-500/5 px-2.5 py-1 font-mono text-[10px] text-muted-foreground">
              <BadgeCheck size={11} className="text-primary" aria-hidden />
              KVKK ve ilgili mevzuat gözetilerek tasarlanmıştır
            </p>
          </div>

          {/* briefing-style link grid */}
          <nav className="hud-frame glass glass-cyan p-5" aria-label="Bilgi bağlantıları">
            <p className="font-mono text-[11px] tracking-[0.25em] text-amber-300">BİLGİ DOSYALARI</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {LINKS.map(({ to, icon: Icon, title, desc, testid }) => (
                <Link
                  key={testid}
                  to={to}
                  data-testid={testid}
                  className="hover-lift jigsaw-edge group flex items-start gap-3 rounded-lg border border-white/5 bg-black/25 p-3 hover:border-amber-400/40"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-amber-500/30 bg-amber-500/10">
                    <Icon size={14} className="text-amber-300" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm text-foreground group-hover:text-amber-200">{title}</span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{desc}</span>
                  </span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </footer>
  );
}
