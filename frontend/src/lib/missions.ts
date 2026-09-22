// Static narrative content for the missions (single source in the client; progress + XP live on the backend).

export interface EvidenceFile {
  id: string;
  title: string;
  body: string;
  tag?: string;
}

export interface NpcOption {
  text: string;
  feedback: string;
}

export interface NpcTurn {
  question: string;
  options: NpcOption[];
}

export interface NpcScript {
  name: string;
  role: string;
  emoji: string;
  turns: NpcTurn[];
  closing: string;
}

export interface MissionContent {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  scientist: string | null;
  year: string | null;
  story: string[];
  objectives: string[];
  evidenceFiles: EvidenceFile[];
  npc: NpcScript | null;
}

export const LEVELS = [
  { level: 1, min_xp: 0, title: "Stajyer Dedektif (Karanlık Kutu)" },
  { level: 2, min_xp: 250, title: "Madde Araştırmacısı (Dalton)" },
  { level: 3, min_xp: 550, title: "Yük Kaşifi (Thomson)" },
  { level: 4, min_xp: 950, title: "Çekirdek Operatörü (Rutherford)" },
  { level: 5, min_xp: 1400, title: "Kuantum Yörünge Dedektifi (Bohr)" },
  { level: 6, min_xp: 2000, title: "Baş Kuantum Müfettişi (Chadwick & Modern)" },
];

export const BADGES = [
  { id: "kanit-avcisi", icon: "🔬", name: "Kanıt Avcısı", desc: "İlk bilimsel kanıt dosyasını tamamladı." },
  { id: "model-sorgulayici", icon: "🧠", name: "Model Sorgulayıcı", desc: "Bir modelin sınırını kanıtla açıkladı." },
  { id: "bilim-dedektifi", icon: "🕵️", name: "Bilim Dedektifi", desc: "Atom teorilerinin değişimini doğru ilişkilendirdi." },
  { id: "bilim-ekibi", icon: "🤝", name: "Bilim Ekibi", desc: "Jigsaw görevini tamamladı." },
  { id: "bilimsel-dusunur", icon: "⚛️", name: "Bilimsel Düşünür", desc: "Final görevinde güçlü sentez oluşturdu." },
];

export const SCIENTIST_LABELS: Record<string, string> = {
  dalton: "John Dalton",
  thomson: "J. J. Thomson",
  rutherford: "Ernest Rutherford",
  bohr: "Niels Bohr",
  chadwick: "James Chadwick",
};

export const EB_FIELD_LABELS: Record<string, string> = {
  varsayim: "Model Varsayımı",
  kanit: "Kanıt",
  acikliyor: "Açıklayabildiği",
  "zorlanıyor": "Zorlandığı Durum",
  sonraki: "Sonraki Değişim",
};

export const MISSIONS: MissionContent[] = [
  {
    id: "karanlik-kutu",
    code: "B01",
    title: "Karanlık Kutu",
    subtitle: "Görmediğin şeyi nasıl modelleyebilirsin?",
    scientist: null,
    year: null,
    story: [
      "Zaman yolcu dedektif, hoş geldin. Görev merkezi sana mühürlü bir sandık gönderdi: içinde ne olduğunu kimse bilmiyor.",
      "Kutunun kapağı mühürlü — açamıyorsun. Ama elinde ölçüm aletleri var. Bilim insanları atomu da tam böyle inceledi: doğrudan göremeden, yalnızca dolaylı kanıtlarla.",
      "Önce gözlemle, sonra kendi ilk modelini kur. Bu bölümde 'doğru' bir cevap yok — senin modelin, senin çıkarımın.",
    ],
    objectives: [
      "Dolaylı kanıtla çalışmayı deneyimlemek",
      "Bilimsel model kavramına giriş yapmak",
      "Merak ve bilişsel çatışma oluşturmak",
    ],
    evidenceFiles: [
      {
        id: "kb-talimat",
        title: "Görev Talimatı // MÜHÜRLÜ SANDIK",
        tag: "TOP SECRET",
        body: "Sandığın kapağı mühürlü. Elindeki tarayıcı yalnızca dolaylı ölçüm yapar: ağırlık, manyetik tepki, ses yansıması, ısı emilimi. Hiçbir alet kutuyu açamaz. İçindeki yapıyı, yalnızca bu dolaylı kanıtlardan hareketle modelle.",
      },
      {
        id: "kb-not",
        title: "Bilim Notu // ADALET ÜZERİNE",
        body: "Bilim insanlarının atom hakkında bilgi sahibi olması da bunun gibi: kimse atomu doğrudan göremedi. Herkes kendi gözlemlerinden bir 'model' kurdu. Körlerin fili anekdotundaki gibi, her gözlemci farklı bir parçayı hisseder — bilim, parçaları kanıtlarla birleştirme disiplinidir.",
      },
    ],
    npc: null,
  },
  {
    id: "dalton-dosyasi",
    code: "B02",
    title: "Dalton Dosyası",
    subtitle: "Dosya no: 1803 — Modası geçmiş mi, rasyonel mi?",
    scientist: "John Dalton",
    year: "1803",
    story: [
      "Zaman makinesi 1803'e ayarlandı. Manchester sisli; bir öğretmen, madde üzerine radical bir fikir yazıyor.",
      "Dalton'un atomu: bölünemeyen küreler. Bugün biliyoruz ki atom çekirdek ve elektronlardan oluşuyor — ama dosyayı bugünün bilgisiyle değil, dönemin kanıtlarıyla okumanı istiyoruz.",
      "Pedagojik uyarı: Dalton'un modelini 'yanlış' olarak damgalamak kolay. Dedektifin görevi şu soruyu cevaplamak: Bu model, o dönemin kanıtlarıyla rasyonel miydi?",
    ],
    objectives: [
      "Dalton'un varsayımlarını keşfetmek",
      "Modelin neyi açıkladığını belirlemek",
      "Dönemin bilimsel bağlamını anlamak",
    ],
    evidenceFiles: [
      {
        id: "da-1",
        title: "Dosya 1 // DALTON'UN VARSAYIMLARI (1803)",
        tag: "KANIT DOSYASI",
        body: "1) Madde, bölünemeyen küresel atomlardan oluşur. 2) Aynı elementin tüm atomları birbirinin aynıdır. 3) Farklı elementlerin atomları farklı kütleleredir. 4) Bileşikler, atomların basit oranlarla birleşmesinden oluşur. 5) Kimyasal tepkimeler atomların yeniden dizilmesidir.",
      },
      {
        id: "da-2",
        title: "Dosya 2 // KÜTLE KORUNUMU — LAVOISIER",
        tag: "GÖZLEM KAYDI",
        body: "Kapalı kapta yapılan tepkimelerde toplam kütle değişmiyor. Tepkime öncesi ve sonrası tartım aynı. Bu gözlem, maddenin 'parçalanıp kaybolmayan' birimler halinde olduğu fikrini destekliyor.",
      },
      {
        id: "da-3",
        title: "Dosya 3 // SABİT ORAN YASASI — PROUST",
        tag: "GÖZLEM KAYDI",
        body: "Su her zaman %11 hidrojen, %89 kütle ile oksijenden oluşuyor. Bakır oksit her örneklerde aynı oranlarda. Oranların sabit olması, elementlerin 'birim' birimlerden birleştiği fikrine güçlü destek veriyor.",
      },
      {
        id: "da-4",
        title: "Dosya 4 // DÖNEMİN BAĞLAMI",
        tag: "BAĞLAM",
        body: "1803: Mikroskoplar basit, elektrik devreleri yeni keşfediliyor, atomu 'içinden görme' hiçbir aracı yok. Elektrik iletkenliği, yük, katot ışınları henüz bilinmiyor. Dalton'un modeli bu bağlamda eldeki TÜM kanıtları açıklıyordu.",
      },
    ],
    npc: null,
  },
  {
    id: "thomson-izi",
    code: "B03",
    title: "Thomson'un İzi",
    subtitle: "Bölünemez kürenin içinden bir parçacık çıktı",
    scientist: "J. J. Thomson",
    year: "1897",
    story: [
      "Zaman makinesi 1897, Cavendish Laboratuvarı. Cam bir tüpün içinde yeşilimsi bir ışık ve manyetik alanda sapan bir ışın.",
      "Problem dosyan: Eğer atom tamamen bölünemez ve iç yapısız bir küre olsaydı, elektronun keşfi nasıl açıklanabilirdi?",
      "NPC J. J. Thomson karşında. Ama dikkat: sana bilgi vermek yerine sana soru soracak.",
    ],
    objectives: [
      "Katot ışını kanıtlarını incelemek",
      "Dalton → yeni kanıt → açıklama yetersizliği → model değişimi zincirini kurmak",
      "Sokratik diyalogla gerekçelendirme yapmak",
    ],
    evidenceFiles: [
      {
        id: "th-1",
        title: "Dosya 1 // KATOT IŞINI TÜPÜ GÖZLEMLERİ",
        tag: "DENEY KAYDI",
        body: "Işın, pozitif plakaya doğru sapan bir davranış gösteriyor: negatif yüklü. Manyetik alanda da sapyor. Farklı metal katotlarla ve farklı gazlarla aynı sonuç: bu ışınlar maddeden bağımsız, evrensel parçacıklar.",
      },
      {
        id: "th-2",
        title: "Dosya 2 // KÜTLE / YÖN ÖLÇÜMÜ",
        tag: "ÖLÇÜM KAYDI",
        body: "Parçacığın kütlesi, hidrojen atomunun ~1/1836'sı. Atomdan çok daha hafif bir birim: 'elektron'. Dalton'un bölünemez küresinin İÇİNDEN çıkan ilk parçacık.",
      },
    ],
    npc: {
      name: "J. J. Thomson",
      role: "Cavendish Laboratuvarı, 1897",
      emoji: "🧑‍🔬",
      turns: [
        {
          question:
            "Dedektif, tüpteki ışın manyetik alandan saptı. Bu sapma, ışınların doğası hakkında sana ne söylüyor?",
          options: [
            {
              text: "Işınlar yüklü parçacıklardır.",
              feedback:
                "Keskin bir gözlem! Peki sapmanın yönü, yükün işareti hakkında ne diyor? Ve bu parçacığın kütlesi atomla karşılaştırılınca ne çıkıyor?",
            },
            {
              text: "Işınlar sıradan ışıktır.",
              feedback:
                "İlginç bir hipotez. Ama ışık, manyetik alandan bu kadar sapan bir davranış gösterir miydi? Gözleminle hipotezini bir kez daha karşılaştır.",
            },
            {
              text: "Tüp arızalıdır.",
              feedback:
                "Ekipmanı da şüphelenmek dedektiflik! Ama farklı tüplerde, farklı metallerle aynı sapma var. Şimdi hangi açıklama kanıtları daha iyi açıklıyor?",
            },
          ],
        },
        {
          question:
            "Şimdi asıl soru: atom bölünemez bir küre olsaydı, bu negatif parçacık İÇİNDEN nasıl çıkmış olabilirdi?",
          options: [
            {
              text: "Çıkamazdı — demek ki atom bölünemez olamaz.",
              feedback:
                "Zinciri kurdun: kanıt (katot ışınları) → eski açıklamanın yetersizliği → yeni model ihtiyacı. Peki yeni modelde pozitif yük nerede olmalı? Dosyayı kapatırken bunu düşün.",
            },
            {
              text: "Parçacık atomun dışından geldi.",
              feedback:
                "Yaratıcı bir çıkış! Ama ölçümler ışının tüpün içindeki metalden geldiğini gösteriyor. Kanıt seni model değişikliğine itiyor mu?",
            },
            {
              text: "Dalton yanlışmış, değersiz bir modeldi.",
              feedback:
                "Dikkat: bir modeli bugünkü bilgilerle 'değersiz' diye değerlendirmek yanıltıcı olabilir. Dalton'un döneminde hangi kanıtlar vardı? Model, KENDİ kanıt çerçevesi içinde rasyonel miydi?",
            },
          ],
        },
      ],
      closing:
        "İşte dedektiflik budur: kanıt, açıklama yetersizliği ve model değişimi zincirini kendin kurdun. Şimdi zinciri panoya yerleştir.",
    },
  },
  {
    id: "rutherford-operasyonu",
    code: "B04",
    title: "Rutherford Operasyonu",
    subtitle: "Altın levha: 1/8000'in sır verdiği operasyon",
    scientist: "Ernest Rutherford",
    year: "1911",
    story: [
      "Operasyon karargâhı, 1911. Karşında altın levha ve alfa parçacık topu var. Bu bölümün ana dedektiflik görevi: veriyi kendin incele.",
      "Deneyi ateşle, dedektör ekranındaki desenleri izle, gözlemlerini kanıt panosuna yerleştir ve çıkarımını raporla.",
      "Unutma: bilim insanları da modeli değiştirmeye bu gözlemler zorladı.",
    ],
    objectives: [
      "Altın levha deneyi verisini incelemek",
      "Gözlemleri kanıt panosuna yerleştirmek",
      "Gözlem → çıkarım akıl yürütmesi yapmak",
    ],
    evidenceFiles: [
      {
        id: "ru-1",
        title: "Dosya 1 // DENEY DÜZENEĞİ",
        tag: "ŞEMA",
        body: "Radyoaktif kaynak ince bir deliğe alfa parçacıkları gönderiyor. Parçacıklar çok ince bir altın levhaya çarpıyor; etrafındaki dedektör ekranı her vuruşu parıltıyla kaydediyor. Thomson modeline göre hepsi düz geçmeliydi.",
      },
      {
        id: "ru-2",
        title: "Dosya 2 // RAPOR NOTU",
        tag: "GÖZLEM",
        body: "Rutherford: 'Bu, bir paraşüt kâğıdına top mermisi atıp geri döndüğünü görmek kadar inanılmazdı.' Sekizbinden biri levhadan geri dönüyordu. Sen de simülasyonda bu oranı doğrula.",
      },
    ],
    npc: {
      name: "Ernest Rutherford",
      role: "Manchester, 1911",
      emoji: "🧔",
      turns: [
        {
          question:
            "Dedektif, deneyi gördün. 'Atom güneş sistemi gibidir' diyorsun — bu benzetmenin sana hangi özelliği açıklamada yardımcı olduğunu düşünüyorsun? Peki elektronların hareketini gerçekten böyle bir yörüngeyle açıklabildiğimize dair elimizde ne tür bir kanıt var?",
          options: [
            {
              text: "Benzetme çekirdeğin küçüklüğünü anlatıyor; elektron yörüngesi için kanıt yok.",
              feedback:
                "Ayrımı yapabilmişsin: modelin güçlü olduğu yer ve kanıtsız kalan yer. Bu ayrım bir sonraki bölümde Bohr'un kapısını açacak.",
            },
            {
              text: "Atom tam olarak güneş sistemidir.",
              feedback:
                "Bekle dedektif: bu benzetme çekirdeğin küçüklüğünü anlatıyor ama elektronun kesin yörüngesini gösteren kanıtımız yok. Model ile kanıt arasındaki çizgiyi koruyalım.",
            },
            {
              text: "Bilmiyorum.",
              feedback:
                "Dürüst bir cevap — bilimin motoru 'bilmiyorum'dur. Şunu birlikte yapalım: ekranlarda hangi ÜÇ gözlem deseni var? Onları panoya yerleştirince çıkarım kendiliğinden gelecek.",
            },
          ],
        },
      ],
      closing:
        "Gözlemlerini panoya yerleştir ve çıkarım raporunu yaz. Veri, konuşmaktan daha güçlüdür.",
    },
  },
  {
    id: "bohr-sirri",
    code: "B05",
    title: "Bohr'un Sırrı",
    subtitle: "Kesikli çizgilerin fısıltısı",
    scientist: "Niels Bohr",
    year: "1913",
    story: [
      "Zaman makinesi 1913, Kopenhag. Karşında bir prizma ve hidrojen lambasının tuhaf imzası: sürekli bir gökkuşağı değil, yalnızca birkaç kesikli çizgi.",
      "Ana soru: Rutherford modeli, elektronların enerji durumları ve çizgi spektrumlarıyla ilgili gözlemleri açıklamakta neden yetersiz kalıyor?",
      "NPC Niels Bohr sana sorular soracak; cevap yine senden gelecek.",
    ],
    objectives: [
      "Rutherford modelinin açıklama sınırını fark etmek",
      "Çizgi spektrumu kanıtını yorumlamak",
      "Kanıt → açıklama ihtiyacı → yeni varsayım zincirini kurmak",
    ],
    evidenceFiles: [
      {
        id: "bo-1",
        title: "Dosya 1 // HİDROJEN ÇİZGİ SPEKTRUMU",
        tag: "SPEKTROSKOPİ KAYDI",
        body: "Hidrojen gazı ısıtıldığında (veya elektrikle uyarıldığında) yalnızca belirli dalga boylarında ışınım yayar: kırmızı 656 nm, mavi-yeşil 486 nm, mavi 434 nm, mor 410 nm. Sürekli spektrum yok — kesikli çizgiler var.",
      },
      {
        id: "bo-2",
        title: "Dosya 2 // KLASİK FİZİK KILAVUZU",
        tag: "UYARI",
        body: "Klasik fiziğe göre dairesel hareket yapan yüklü elektron enerji yaymalı VE çekirdeğe düşmeli. Ama atomlar kararlı ve spektrum kesikli. Model, gözlemleri açıklamak için yeni bir varsayıma muhtaç.",
      },
    ],
    npc: {
      name: "Niels Bohr",
      role: "Kopenhag, 1913",
      emoji: "🧑‍🎓",
      turns: [
        {
          question:
            "Dedektif, Rutherford'un atomunda elektron çekirdek çevresinde döner. Ama hidrojen yalnızca BELLİ renklerde ışınım yayıyor. Bu kesikli çizgiler, elektronun enerjisi hakkında ne düşünmene yol açıyor?",
          options: [
            {
              text: "Elektron her enerji değerinde olabilir.",
              feedback:
                "Ama o zaman spektrum sürekli olurdu, değil mi? Kesikli çizgiler, enerjinin 'sürekli' değil 'adımlı' olabileceğini ima ediyor.",
            },
            {
              text: "Elektron yalnızca belirli enerji değerlerinde bulunabilir.",
              feedback:
                "Tam sırası! Kanıt (kesikli çizgiler) → açıklama ihtiyacı → yeni varsayım (enerji düzeyleri). Zincirin son halkası: bu varsayım Rutherford modeline ne ekledi?",
            },
            {
              text: "Spektrum deneyi hatalı ölçülmüştür.",
              feedback:
                "Şüphe dedektifin işidir ama bu çizgiler yıllardır tekrarlanabiliyor. Tekrarlanabilir gözlem güçlü kanıttır. Çizgileri açıklamaya çalışalım.",
            },
          ],
        },
      ],
      closing:
        "Şimdi Rutherford modelinin açıkladıklarını ve açıklamakta zorlandıklarını ayır. Zorlandıkları, yeni varsayımın doğduğu yerdir.",
    },
  },
  {
    id: "chadwick-dosyasi",
    code: "B06",
    title: "Chadwick Dosyası",
    subtitle: "Nötron: eksik parçayı tamamla",
    scientist: "James Chadwick",
    year: "1932",
    story: [
      "Zaman makinesi 1932, Cavendish. Berilyum hedefine alfa parçacıkları gönderiliyor ve gizemli, yük taşmayan bir ışınım çıkıyor.",
      "Kütlenin muhasebesi tutmuyor: atom kütlesi, proton+elektron toplamından fazla. Bu 'gizli kütle' nerede?",
      "Bu bölümde zinciri KENDİN kuracaksın: hazır bir zaman çizelgesi yok, kanıt parçalarını doğru sıraya sen yerleştireceksin.",
    ],
    objectives: [
      "Nötronun keşif kanıtını incelemek",
      "Dalton → Thomson → Rutherford → Bohr → Chadwick zincirini sıralamak",
      "Her adımın model değişimini gerekçelendirmek",
    ],
    evidenceFiles: [
      {
        id: "ch-1",
        title: "Dosya 1 // BERİLYUM DENEYİ (1932)",
        tag: "DENEY KAYDI",
        body: "Berilyuma alfa parçacıkları gönderildiğinde yüksek enerjili bir ışınım çıkıyor. Bu ışınım elektrik alandan sapmıyor: yüksüz. Kömür ve parafin blokları üzerinden ölçülen parçacık kütlesi, protonunkine çok yakın.",
      },
      {
        id: "ch-2",
        title: "Dosya 2 // KÜTLE MUHASEBESİ",
        tag: "HESAP KAYDI",
        body: "Helyum: 2 proton, 2 elektron — ama kütle 4 birim. Eksik 2 birim. Çekirdekte yüksüz ama kütleli parçacıklar olmalı: NÖTRON. Model artık çekirdek yapısını da açıklıyor; izotoplar da anlam kazanıyor.",
      },
    ],
    npc: {
      name: "James Chadwick",
      role: "Cavendish, 1932",
      emoji: "🧑‍🔬",
      turns: [
        {
          question:
            "Dedektif, atomun kütlesi proton ve elektron toplamından büyük çıkıyor. Elektriksel olarak nötr bir ışınım berilyumdan çıkıyor. Sence bu ışınım, çekirdekte hangi parçacığın varlığını ima ediyor?",
          options: [
            {
              text: "Yüksüz ama kütleli bir parçacık: nötron.",
              feedback:
                "Kütle muhasebesi kapandı! Atom modelinin son parçası yerleşti. Şimdi tüm zinciri sırayla kur: kanıtlar modelleri hangi sırada değiştirdi?",
            },
            {
              text: "Yeni bir tür elektron.",
              feedback:
                "Ama bu ışınımın kütlesi elektronunkinden binlerce kat büyük. Elektron fikri kütleyi açıklayamıyor; başka ne olabilir?",
            },
            {
              text: "Ölçüm hatası olabilir.",
              feedback:
                "Şüphe faydalıdır ama ölçümler farklı hedeflerle tekrarlanıyor. Kanıtın işaret ettiği açıklamayı kurmayı dene.",
            },
          ],
        },
      ],
      closing:
        "Zinciri sıraladığında şunu fark edeceksin: her model, öncekini 'yanlış' değil, yeni kanıtla 'geliştirilmiş' hale getirdi.",
    },
  },
];

// ---- Jigsaw peer notes: the other three experts' contributions ("arkadaş dosyaları")
export const JIGSAW_EXPERTS = [
  { id: "dalton", label: "Uzman 1 — Dalton", emoji: "⚪", scientist: "John Dalton" },
  { id: "thomson", label: "Uzman 2 — Thomson", emoji: "🟢", scientist: "J. J. Thomson" },
  { id: "rutherford", label: "Uzman 3 — Rutherford", emoji: "🟡", scientist: "Ernest Rutherford" },
  { id: "bohr", label: "Uzman 4 — Bohr", emoji: "🔵", scientist: "Niels Bohr" },
];

export const JIGSAW_FIELDS = [
  { id: "varsayim", label: "Temel varsayımlar" },
  { id: "kanit", label: "Kullanılan kanıtlar" },
  { id: "acikliyor", label: "Modelin açıkladıkları" },
  { id: "zorlanıyor", label: "Zorlandığı durumlar" },
];

export const JIGSAW_PEER_NOTES: Record<string, Record<string, string>> = {
  dalton: {
    varsayim: "Maddeler bölünemeyen küresel atomlardan oluşur; aynı elementin atomları aynıdır.",
    kanit: "Kütle korunumu ve sabit oran yasaları.",
    acikliyor: "Kimyasal tepkimelerde oranların sabitliğini açıklar.",
    "zorlanıyor": "Atomun iç yapısını ve elektrik olaylarını açıklamaz.",
  },
  thomson: {
    varsayim: "Pozitif küre içinde gömülü elektronlar (üzümlü kek).",
    kanit: "Katot ışını deneyleri: negatif, çok hafif parçacıklar.",
    acikliyor: "Elektronun varlığını ve atomun nötrlüğünü açıklar.",
    "zorlanıyor": "Alfa parçacıklarının geri saçılmasını açıklamaz.",
  },
  rutherford: {
    varsayim: "Küçük, yoğun, pozitif çekirdek; atom çoğunlukla boşluk.",
    kanit: "Altın levha deneyi: az sayıda büyük açılı geri saçılma.",
    acikliyor: "Büyük açılı saçılmayı ve boşluk yapısını açıklar.",
    "zorlanıyor": "Elektron kararlılığını ve çizgi spektrumları açıklamaz.",
  },
  bohr: {
    varsayim: "Elektronlar belirli enerji düzeylerinde bulunur.",
    kanit: "Hidrojenin kesikli çizgi spektrumu.",
    acikliyor: "Hidrojen spektrumunu ve elektron kararlılığını açıklar.",
    "zorlanıyor": "Çok elektronlu atomları ve kesin yörünge varsayımını açıklamaz.",
  },
};

// ---- Hologram archive (mock playback — no copyrighted media is hosted)
export interface HologramItem {
  id: string;
  title: string;
  scientist: string;
  experiment: string;
  description: string;
  source: string;
  license: string;
  duration: string;
  seconds: number;
}

export const HOLOGRAM_ITEMS: HologramItem[] = [
  {
    id: "h1",
    title: "Rutherford Altın Levha Deneyi — Simülasyon",
    scientist: "Ernest Rutherford",
    experiment: "Alfa saçılması (1911)",
    description: "Alfa parçacıklarının altın levhadan geçişini ve nadir geri saçılmayı gösteren simülasyon kaydı.",
    source: "Prototip simülasyon kaydı (yer tutucu)",
    license: "Prototip — kurum lisansıyla gerçek içerik eklenecek",
    duration: "02:15",
    seconds: 135,
  },
  {
    id: "h2",
    title: "Katot Işını Tüpü — Deney Kaydı",
    scientist: "J. J. Thomson",
    experiment: "Katot ışınları (1897)",
    description: "Işınların elektrik ve manyetik alanda sapmasıyla elektronun keşfinin temel gözlemleri.",
    source: "Prototip simülasyon kaydı (yer tutucu)",
    license: "Prototip — kurum lisansıyla gerçek içerik eklenecek",
    duration: "01:48",
    seconds: 108,
  },
  {
    id: "h3",
    title: "Dalton'un Atom Modeli — Animasyon",
    scientist: "John Dalton",
    experiment: "Model görselleştirmesi (1803)",
    description: "Bölünemez küre modelinin temel varsayımları ve dönemin kanıtlarıyla bağları.",
    source: "Prototip animasyonu (yer tutucu)",
    license: "Prototip — açık lisanslı içerikle değiştirilecek",
    duration: "01:20",
    seconds: 80,
  },
  {
    id: "h4",
    title: "Hidrojen Çizgi Spektrumu — Görsel Veri",
    scientist: "Niels Bohr",
    experiment: "Spektroskopi (1913)",
    description: "Kesikli çizgilerin ve enerji düzeyleri arası geçişlerin görsel açıklaması.",
    source: "Prototip görsel verisi (yer tutucu)",
    license: "Prototip — açık lisanslı içerikle değiştirilecek",
    duration: "01:55",
    seconds: 115,
  },
  {
    id: "h5",
    title: "Nötronun Keşfi — Deney Anlatımı",
    scientist: "James Chadwick",
    experiment: "Berilyum deneyi (1932)",
    description: "Yüksüz ışınımın ölçümü ve kütle muhasebesinin nötronla kapanışı.",
    source: "Prototip anlatım kaydı (yer tutucu)",
    license: "Prototip — kurum lisansıyla gerçek içerik eklenecek",
    duration: "02:40",
    seconds: 160,
  },
  {
    id: "h6",
    title: "Kuantum Modeline Giriş — Orbital Kavramı",
    scientist: "Modern kuantum mekaniği",
    experiment: "Kavramsal giriş",
    description: "Yörünge yerine olasılıksal orbital: bilimsel bilginin değişebilirliğinin güncel örneği.",
    source: "Prototip anlatım kaydı (yer tutucu)",
    license: "Prototip — açık lisanslı içerikle değiştirilecek",
    duration: "03:05",
    seconds: 185,
  },
];

// ---- final task
export const FINAL_PROMPT =
  "Rutherford'un Altın Levha Deneyi hiç yapılmasaydı atom teorilerinin gelişimi nasıl etkilenebilirdi?";

export const RUBRIC_INFO = [
  { key: "nature", label: "Bilimin Doğası", max: 3 },
  { key: "conceptual", label: "Kavramsal Doğruluk", max: 3 },
  { key: "synthesis", label: "Sentez / Değerlendirme", max: 4 },
];

export const OUTCOME_LABELS: Record<string, string> = {
  baslangic: "Başlangıç",
  gelisiyor: "Gelişiyor",
  yeterli: "Yeterli kanıt",
  ileri: "İleri düzey",
};
