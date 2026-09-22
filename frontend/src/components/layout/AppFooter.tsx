import { Link } from "react-router-dom";

// Every page carries the prototype notice + privacy links; wording never claims legal compliance.
export default function AppFooter() {
  return (
    <footer className="relative mt-16 border-t border-white/5 bg-[#070A11]/70 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-mono text-sm text-primary text-glow">KUANTUM DEDEKTİFLERİ: BİLİMSEL KIRILMA</p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Eğitim amacıyla geliştirilmiş prototiptir. Türkiye Yüzyılı Maarif Modeli 9. sınıf Kimya
              (KİM.9.1.3) öğrenme çıktısıyla uyumludur.
            </p>
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              KVKK ve ilgili mevzuat gözetilerek tasarlanmıştır.
            </p>
          </div>
          <nav className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm" aria-label="Bilgi bağlantıları">
            <Link className="text-sky-400 hover:text-sky-300 hover:underline" to="/gizlilik" data-testid="footer-privacy-link">
              Gizlilik ve Veri Kullanımı
            </Link>
            <Link className="text-sky-400 hover:text-sky-300 hover:underline" to="/gizlilik#kvkk" data-testid="footer-kvkk-link">
              KVKK Bilgilendirmesi
            </Link>
            <Link className="text-sky-400 hover:text-sky-300 hover:underline" to="/gizlilik#erisilebilirlik" data-testid="footer-accessibility-link">
              Erişilebilirlik
            </Link>
            <Link className="text-sky-400 hover:text-sky-300 hover:underline" to="/gizlilik#icerik-kaynaklari" data-testid="footer-sources-link">
              İçerik Kaynakları
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
