// PhET interactive simulations — embedded live (iframe), not passive media.
// PhET sims are freely available under CC-BY; we embed from phet.colorado.edu and host nothing.
export interface SimulationItem {
  id: string;
  title: string;
  scientist: string;
  experiment: string;
  description: string;
  inquiry: string;
  src: string;
  source: string;
  license: string;
  duration: string;
  missionId: string | null;
  accent: "emerald" | "cyan" | "amber";
}

export const SIMULATIONS: SimulationItem[] = [
  {
    id: "rutherford",
    title: "Rutherford Altın Levha Deneyi — Saçılma Simülasyonu",
    scientist: "Ernest Rutherford",
    experiment: "Alfa saçılması (1911)",
    description:
      "Alfa parçacıklarını altın folyoya gönder. Çoğunun düz geçtiğini, az sayısının büyük açıyla saptığını kendin gözlemle.",
    inquiry:
      "Parçacıkların çoğu düz geçiyorsa atomun hacminin büyük kısmı hakkında ne söylersin? Geri dönen az sayıdaki parçacık neyi zorunlu kılıyor?",
    src: "https://phet.colorado.edu/sims/html/rutherford-scattering/latest/rutherford-scattering_all.html",
    source: "PhET Interactive Simulations, University of Colorado Boulder",
    license: "CC-BY 4.0 · phet.colorado.edu üzerinden gömülü (yeniden barındırılmıyor)",
    duration: "~8 dk etkileşim",
    missionId: "rutherford-operasyonu",
    accent: "emerald",
  },
  {
    id: "hydrogen-models",
    title: "Hidrojen Atom Modelleri — Model Karşılaştırma",
    scientist: "Bohr, Schrödinger, de Broglie",
    experiment: "Çizgi spektrumu / model deneyi (1913+)",
    description:
      "Aynı deneyi farklı atom modellerine uygula: Bilardo topu, gezegen, Bohr, de Broglie ve kuantum modeli aynı gözlemi açıklıyor mu?",
    inquiry:
      "Hangi model spektrum çizgilerini açıklayabiliyor, hangisi zorlanıyor? Bu, modellerin neden değiştiği hakkında ne söylüyor?",
    src: "https://phet.colorado.edu/sims/html/models-of-the-hydrogen-atom/latest/models-of-the-hydrogen-atom_all.html",
    source: "PhET Interactive Simulations, University of Colorado Boulder",
    license: "CC-BY 4.0 · phet.colorado.edu üzerinden gömülü (yeniden barındırılmıyor)",
    duration: "~10 dk etkileşim",
    missionId: "bohr-sirri",
    accent: "cyan",
  },
  {
    id: "build-an-atom",
    title: "Atom İnşa Et — Proton, Nötron, Elektron",
    scientist: "James Chadwick (nötron)",
    experiment: "Çekirdek yapısı ve kütle muhasebesi (1932)",
    description:
      "Çekirdeğe proton ve nötron ekle, elektron yerleştir. Kütle numarası, yük ve kararlılık nasıl değişiyor?",
    inquiry:
      "Kütle numarası proton sayısından fazlaysa çekirdekte başka ne olmalı? Nötronu çıkardığında model neyi açıklayamıyor?",
    src: "https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_all.html",
    source: "PhET Interactive Simulations, University of Colorado Boulder",
    license: "CC-BY 4.0 · phet.colorado.edu üzerinden gömülü (yeniden barındırılmıyor)",
    duration: "~7 dk etkileşim",
    missionId: "chadwick-dosyasi",
    accent: "amber",
  },
  {
    id: "isotopes",
    title: "İzotoplar ve Atom Kütlesi — Dalton'un Varsayımı Testi",
    scientist: "John Dalton",
    experiment: "Sabit oranlar / atom kütlesi (1803)",
    description:
      "Dalton “aynı elementin tüm atomları birbirinin aynıdır” demişti. İzotopları inceleyip bu varsayımı test et.",
    inquiry:
      "Aynı elementin farklı kütleli atomları varsa Dalton'un varsayımına ne olur? Bu, modelin dönemi için rasyonel olmasını değersiz kılar mı?",
    src: "https://phet.colorado.edu/sims/html/isotopes-and-atomic-mass/latest/isotopes-and-atomic-mass_all.html",
    source: "PhET Interactive Simulations, University of Colorado Boulder",
    license: "CC-BY 4.0 · phet.colorado.edu üzerinden gömülü (yeniden barındırılmıyor)",
    duration: "~8 dk etkileşim",
    missionId: "dalton-dosyasi",
    accent: "cyan",
  },
  {
    id: "discharge-lamps",
    title: "Gaz Deşarj Lambaları — Elektron ve Enerji Düzeyleri",
    scientist: "J. J. Thomson / Niels Bohr",
    experiment: "Katot ışınları & uyarılma (1897–1913)",
    description:
      "Elektronları hızlandırıp gaz atomlarına çarptır. Yayılan ışığın yalnızca belirli renklerde olduğunu gör.",
    inquiry:
      "Elektron çarpışması neden her renkte değil de belirli renklerde ışık üretiyor? Bu gözlem hangi varsayımı gerektiriyor?",
    src: "https://phet.colorado.edu/sims/cheerpj/discharge-lamps/latest/discharge-lamps.html?simulation=discharge-lamps",
    source: "PhET Interactive Simulations, University of Colorado Boulder",
    license: "CC-BY 4.0 · phet.colorado.edu üzerinden gömülü (yeniden barındırılmıyor)",
    duration: "~9 dk etkileşim",
    missionId: "thomson-izi",
    accent: "emerald",
  },
];
