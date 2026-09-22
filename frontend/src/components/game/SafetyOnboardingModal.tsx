import { Button } from "@/components/ui/button";
import { markOnboarded } from "@/lib/session";

// §32 — first-session "Güvenli Oyun Alanı" card: friendly, age-appropriate, never legal-jargon.
export default function SafetyOnboardingModal() {
  async function handleAcknowledge() {
    await markOnboarded();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Güvenli oyun alanı bilgilendirmesi"
      data-testid="safety-onboarding-overlay"
    >
      <div className="w-full max-w-lg hud-frame hud-ticks glass glass-emerald p-6 animate-fade-up">
        <p className="font-mono text-xs text-secondary-foreground/80">🔐 GÜVENLİ OYUN ALANI</p>
        <h2 className="mt-2 font-heading text-2xl text-primary text-glow">Merhaba Bilim Dedektifi!</h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/90">
          <p>Bu platform, 9. sınıf kimya öğrenmeni desteklemek için tasarlanmıştır.</p>
          <p>Burada gereksiz kişisel bilgilerini paylaşmana gerek yoktur.</p>
          <p className="font-medium text-foreground">AI Mentor ile konuşurken:</p>
          <ul className="ml-1 list-disc space-y-1 pl-4 text-muted-foreground">
            <li>Adresini</li>
            <li>Telefon numaranı</li>
            <li>Şifreni</li>
            <li>T.C. kimlik numaranı</li>
            <li>Özel veya kişisel bilgilerini</li>
          </ul>
          <p className="text-muted-foreground">paylaşma.</p>
          <p>
            AI Mentor yalnızca kimya öğrenmene yardımcı olmak için tasarlanmıştır. Oyun içindeki
            cevapların ve öğrenme çalışmaların eğitim amacıyla değerlendirilebilir.
          </p>
          <p className="font-mono text-xs text-primary">Güvenli düşün. Güvenli paylaş. Bilimsel kanıtla ilerle.</p>
        </div>
        <Button
          className="mt-6 w-full"
          onClick={handleAcknowledge}
          data-testid="safety-onboarding-acknowledge-button"
        >
          ANLADIM, OYUNA GEÇ
        </Button>
      </div>
    </div>
  );
}
