import AppFooter from "@/components/layout/AppFooter";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const SECTIONS = [
  {
    id: "islenen-veriler",
    title: "1. Hangi veriler işleniyor?",
    body: [
      "Dedektif Kodu (okul tarafından oluşturulan takma kimlik, örn. KD-2048).",
      "Öğrencinin kendi seçtiği takma ad (örn. QuantumFox).",
      "Oyun ilerlemesi: tamamlanan görev adımları, XP, rozetler, kanıt panosu yerleşimleri.",
      "Açık uçlu cevaplar ve performans görevi metinleri (ölçme kanıtı).",
      "AI Mentor konuşmaları (öğrenme desteği amacıyla; öğrenci dilediği an silebilir).",
      "Teknik oturum çerezi (yalnızca giriş işlevi için; reklam/izleme amacı taşımaz).",
    ],
  },
  {
    id: "neden",
    title: "2. Neden işleniyor?",
    body: [
      "Öğrencinin KİM.9.1.3 öğrenme çıktısına ilişkin ilerlemesini takip etmek.",
      "Biçimlendirici ve performansa dayalı değerlendirme yapmak.",
      "Öğretmene öğrenme kanıtı sunmak ve destek ihtiyacı olan boyutları görünür kılmak.",
      "Oyunlaştırma öğelerini (XP, rozet, teknoloji ağacı) çalıştırmak.",
      "Bu veriler pazarlama, reklam veya profilleme amacıyla KULLANILMAZ.",
    ],
  },
  {
    id: "erisim",
    title: "3. Kimler erişebiliyor?",
    body: [
      "Öğrenci: yalnızca kendi ilerlemesi, cevapları, rozetleri, mentor konuşmaları ve kendisine verilen geri bildirimler.",
      "Öğretmen: yalnızca yetkili olduğu sınıfın öğrenme kanıtları, rubrik sonuçları ve toplulaştırılmış analitikleri.",
      "Yönetici (admin): sistem yönetimi için gerekli teknik erişim.",
      "Erişim kontrolü yalnızca arayüzde değil, sunucu (backend) tarafında rol bazlı olarak da uygulanır.",
      "Öğrenciler birbirlerinin cevaplarını, rubrik puanlarını, öğretmen yorumlarını veya kavram yanılgısı göstergelerini göremez.",
    ],
  },
  {
    id: "ai-rolu",
    title: "4. AI sisteminin rolü",
    body: [
      "AI Mentor (Dr. Nova) Sokratik sorgulama yapar: doğrudan cevap vermez, kanıt ister, gerekçe sorgular.",
      "AI, öğrencinin yerine ödev veya final cevabı yazmaz.",
      "AI öğrenciyi psikolojik olarak profillemez, sağlık/kişilik çıkarımı yapmaz, akademik etiket koymaz.",
      "AI çağrıları yalnızca güvenli sunucu üzerinden yapılır; API anahtarı istemci (tarayıcı) koduna gömülmez.",
      "AI'a gönderilen bağlam görev bilgisi, öğrenme çıktısı, ilgili bilimsel kanıt ve öğrencinin cevabıyla sınırlıdır; kimlik verileri gönderilmez.",
      "Mesajlarda kişisel veriye benzeyen sayı dizileri (telefon/T.C. gibi) kayıttan önce otomatik olarak temizlenir.",
    ],
  },
  {
    id: "cevaplar",
    title: "5. Öğrenci cevapları nasıl kullanılıyor?",
    body: [
      "Açık uçlu cevaplar analitik dereceli puanlama anahtarıyla (rubrik) değerlendirilir.",
      "AI yalnızca ÖN DEĞERLENDİRME üretir: önerilen puan, gerekçe, kullanılan kanıt, olası kavram yanılgısı göstergesi ve gelişim önerisi.",
      "Nihai pedagojik değerlendirme yetkisi öğretmendedir; öğretmen puanı kabul edebilir, değiştirebilir ve kendi geri bildirimini ekleyebilir.",
      "Kavman yanılgıları kesin teşhis olarak sunulmaz; 'olası kavram yanılgısı göstergesi' / 'incelenmesi önerilen cevap örüntüsü' ifadeleri kullanılır.",
    ],
  },
  {
    id: "saklama",
    title: "6. Saklama yaklaşımı",
    body: [
      "Dedektif Kodu — Amaç: giriş — Saklama: [Kurum tarafından belirlenecek saklama süresi]",
      "Oyun ilerlemesi — Amaç: öğrenme takibi — Saklama: [Kurum tarafından belirlenecek saklama süresi]",
      "Açık uçlu cevap — Amaç: ölçme kanıtı — Saklama: [Kurum tarafından belirlenecek saklama süresi]",
      "AI ham sohbeti — Amaç: öğrenme desteği — Saklama: mümkün olduğunca kısa; öğrenci dilediği an silebilir",
      "Rubrik sonucu — Amaç: değerlendirme — Saklama: [Kurum tarafından belirlenecek saklama süresi]",
      "Backend mimarisi silme, anonimleştirme, veri dışa aktarma ve hesap kapatma işlemlerine uygun tasarlanmıştır.",
    ],
  },
  {
    id: "guvenlik",
    title: "7. Veri güvenliği",
    body: [
      "Oturumlar httpOnly çerezle yönetilir; tarayıcı koduna erişilebilir token tutulmaz.",
      "Öğretmen/yönetici girişinde PIN, geri döndürülemez şekilde özetlenerek (hash) saklanır.",
      "Sunucu tarafında girdi doğrulama (Pydantic) ve rol bazlı yetkilendirme uygulanır.",
      "Gizli anahtarlar yalnızca sunucu ortam değişkenlerinde tutulur.",
      "Gerçek okul dağıtımında HTTPS, oran sınırlama (rate limiting) ve kurumsal gizli anahtar yönetimi eklenmelidir.",
    ],
  },
  {
    id: "haklar",
    title: "8. İlgili kişi hakları",
    body: [
      "Kişisel verilerin işlenip işlenmediğini öğrenme ve bilgi talep etme.",
      "İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme.",
      "Yanlış veya eksik verilerin düzeltilmesini isteme.",
      "Şartlar oluştuğunda silinmesini veya yok edilmesini isteme.",
      "İşlemenin hukuka aykırı olması hâlinde zararın giderilmesini talep etme.",
      "Bu haklar, kurumun veri sorumlusu olarak belirleyeceği başvuru yöntemleriyle kullanılır.",
    ],
  },
  {
    id: "kvkk",
    title: "9. KVKK bilgilendirmesi ve veri sorumlusu",
    body: [
      "Bu uygulama KVKK ve ilgili mevzuat gözetilerek tasarlanmıştır. 'KVKK'ya tamamen uygundur' şeklinde hukuki bir garanti verilmemektedir.",
      "Gerçek okul kullanımından önce kurumun veri sorumlusu rolü, hukuki işleme şartları, aydınlatma yükümlülükleri, saklama süreleri, veri aktarımı ve gerekiyorsa veli/öğrenci süreçleri yetkin kişiler tarafından ayrıca doğrulanmalıdır.",
      "[Kurum / Veri Sorumlusu Bilgisi Buraya Eklenecek]",
      "[İletişim / Başvuru Kanalı Buraya Eklenecek]",
    ],
  },
  {
    id: "erisilebilirlik",
    title: "10. Erişilebilirlik",
    body: [
      "Arayüz klavyeyle gezinilebilir; etkileşimli öğeler erişilebilir etiketlere sahiptir.",
      "Mobil ve masaüstü için duyarlı (responsive) düzen kullanılır.",
      "Koyu tema yüksek kontrast gözetilerek seçilmiştir; metin boyutları tarayıcı yakınlaştırmasıyla ölçeklenir.",
      "Simülasyon ve grafiklerdeki bilgiler metin olarak da sunulur (yalnızca renge bağlı anlam kullanılmaz).",
    ],
  },
  {
    id: "icerik-kaynaklari",
    title: "11. İçerik kaynakları ve telif",
    body: [
      "Hologram Arşivi'ndeki oynatıcı prototip amaçlıdır; telifli video/ses içeriği uygulama içinde barındırılmaz.",
      "Her içerik kartında Kaynak / Lisans alanı bulunur.",
      "Gerçek dağıtımda yalnızca açık lisanslı veya kurumun kullanım hakkına sahip olduğu içerikler kullanılmalıdır.",
      "Tarihsel bilimsel içerik (Dalton, Thomson, Rutherford, Bohr, Chadwick ve deneyleri) genel bilimsel bilgi olarak, özgün metinle sunulmuştur.",
    ],
  },
];

export default function Privacy() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <Link to="/giris" className="inline-flex items-center gap-1 text-sm text-amber-300 hover:underline" data-testid="privacy-back-link">
          <ArrowLeft size={14} aria-hidden /> Geri dön
        </Link>
        <h1 className="mt-4 font-heading text-3xl text-primary text-glow" data-testid="privacy-title">
          Gizlilik ve Veri Kullanımı
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Kuantum Dedektifleri: Bilimsel Kırılma — eğitim amacıyla geliştirilmiş prototip. Bu sayfa,
          platformun veri minimizasyonu ve güvenli tasarım (privacy by design) yaklaşımını açıklar.
        </p>

        <div className="mt-8 space-y-6">
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-20 rounded-md border border-border bg-card p-4" data-testid={`privacy-section-${s.id}`}>
              <h2 className="font-heading text-lg text-foreground">{s.title}</h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
                {s.body.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
