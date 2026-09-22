"""Kuantum Arenası round content — one class period (~5 rounds x ~7 min).
Correct answers live ONLY here (server-side); the client never receives them while a round is open."""

from typing import TypedDict


class Option(TypedDict):
    id: str
    text: str


class Round(TypedDict):
    index: int
    code: str
    title: str
    scientist: str
    prompt: str
    question: str
    options: list[Option]
    correct: str
    explanation: str
    seconds: int


ROUNDS: list[Round] = [
    {
        "index": 0,
        "code": "TUR 1",
        "title": "Bölünemez Küre Sarsılıyor",
        "scientist": "Dalton → Thomson",
        "prompt": "Dalton'un modeli: atom bölünemeyen, iç yapısı olmayan bir küredir.",
        "question": "Aşağıdaki kanıtlardan HANGİSİ bu modelin 'bölünemezlik' varsayımını doğrudan sarsar?",
        "options": [
            {"id": "a", "text": "Kapalı kapta tepkimede kütlenin korunması"},
            {"id": "b", "text": "Katot ışınlarının negatif yüklü, atomdan ~1836 kat hafif parçacıklar olması"},
            {"id": "c", "text": "Suyun her örnekte aynı kütle oranlarında bulunması"},
            {"id": "d", "text": "Gazların basınç altında sıkışabilmesi"},
        ],
        "correct": "b",
        "explanation": "Katot ışını deneyleri atomdan çok daha hafif, negatif bir parçacığın (elektron) atomun İÇİNDEN çıktığını gösterdi. Kütle korunumu ve sabit oranlar Dalton'u destekliyordu; sıkışma ise atomun iç yapısı hakkında bilgi vermez.",
        "seconds": 90,
    },
    {
        "index": 1,
        "code": "TUR 2",
        "title": "Üzümlü Kek Dağılıyor",
        "scientist": "Thomson → Rutherford",
        "prompt": "Thomson modeli: pozitif yükün tüm hacme yayıldığı küre içinde gömülü elektronlar.",
        "question": "Altın levha deneyindeki HANGİ gözlem bu modelle açıklanamaz?",
        "options": [
            {"id": "a", "text": "Parçacıkların büyük çoğunluğunun levhadan düz geçmesi"},
            {"id": "b", "text": "Levhanın ısınması"},
            {"id": "c", "text": "Yaklaşık 1/8000 parçacığın büyük açıyla geri dönmesi"},
            {"id": "d", "text": "Işınların ekranda parıltı oluşturması"},
        ],
        "correct": "c",
        "explanation": "Yayılmış zayıf bir pozitif yük, ağır ve hızlı alfa parçacığını geri çeviremez. Büyük açılı geri saçılma, yükün ve kütlenin küçük-yoğun bir çekirdekte toplandığını zorunlu kılar. Düz geçiş her iki modelle de uyumludur.",
        "seconds": 90,
    },
    {
        "index": 2,
        "code": "TUR 3",
        "title": "Kesikli Çizgilerin Sırrı",
        "scientist": "Rutherford → Bohr",
        "prompt": "Rutherford modeli: elektronlar küçük çekirdeğin çevresinde hareket eder.",
        "question": "Hidrojenin SÜREKLİ değil KESİKLİ çizgi spektrumu vermesi hangi varsayımı gerektirir?",
        "options": [
            {"id": "a", "text": "Elektron her enerji değerini alabilir"},
            {"id": "b", "text": "Elektron yalnızca belirli enerji düzeylerinde bulunabilir"},
            {"id": "c", "text": "Çekirdek nötron içerir"},
            {"id": "d", "text": "Atom çoğunlukla boşluktur"},
        ],
        "correct": "b",
        "explanation": "Sürekli enerji sürekli spektrum verirdi. Kesikli çizgiler, elektron enerjisinin 'adımlı' (kuantumlu) olduğunu, yani belirli düzeyler arasında geçiş yaptığını gerektirir. Nötron ve boşluk bu gözlemi açıklamaz.",
        "seconds": 90,
    },
    {
        "index": 3,
        "code": "TUR 4",
        "title": "Kayıp Kütle Dosyası",
        "scientist": "Bohr → Chadwick",
        "prompt": "Helyum çekirdeğinde 2 proton var; ancak kütlesi ~4 birim ölçülüyor.",
        "question": "Bu kütle açığını kapatan kanıt hangisidir?",
        "options": [
            {"id": "a", "text": "Elektronların çekirdek dışında olması"},
            {"id": "b", "text": "Berilyuma alfa gönderildiğinde yüksüz, proton kütlesine yakın ışınım çıkması"},
            {"id": "c", "text": "Hidrojen spektrumundaki kırmızı çizgi"},
            {"id": "d", "text": "Alfa parçacıklarının düz geçmesi"},
        ],
        "correct": "b",
        "explanation": "Chadwick'in 1932 deneyi, elektrik alandan sapmayan (yüksüz) ve kütlesi protona yakın parçacığı — nötronu — gösterdi. Elektronun kütlesi çok küçük olduğu için açığı kapatamaz.",
        "seconds": 90,
    },
    {
        "index": 4,
        "code": "TUR 5",
        "title": "Bilimin Doğası Testi",
        "scientist": "KİM.9.1.3",
        "prompt": "Atom modelleri Dalton'dan bugüne birçok kez değişti.",
        "question": "Bu değişim süreci hakkında BİLİMSEL olarak en doğru ifade hangisidir?",
        "options": [
            {"id": "a", "text": "Eski bilim insanları yanlış uydurduğu için modeller değişti"},
            {"id": "b", "text": "Bilimsel teoriler kesindir; değişim bilimin başarısızlığıdır"},
            {"id": "c", "text": "Modeller dönemin kanıtlarıyla kurulur; yeni kanıtlar sınırları gösterince geliştirilir"},
            {"id": "d", "text": "Yeni model gelince eski model tamamen işe yaramaz hâle gelir"},
        ],
        "correct": "c",
        "explanation": "Her model kendi döneminin kanıtları içinde rasyoneldi. Yeni kanıt, modelin açıklayamadığı durumu ortaya çıkarır ve model geliştirilir. Bu, bilimin başarısızlığı değil işleyiş biçimidir; eski modeller de açıkladıkları alanlarda değerini korur.",
        "seconds": 120,
    },
]

POINTS_CORRECT = 100
POINTS_JUSTIFICATION = 60
MIN_JUSTIFICATION = 40
SPEED_BONUS_MAX = 40

# evidence-quality keywords: reward reasoning that links observation -> inference
QUALITY_KEYWORDS = [
    "kanıt", "kanit", "gözlem", "gozlem", "çünkü", "cunku", "açıkla", "acikla",
    "model", "varsayım", "varsayim", "saçılma", "sacilma", "spektrum", "çekirdek",
    "cekirdek", "elektron", "nötron", "notron", "enerji düzey", "enerji duzey", "değiş", "degis",
]


def public_round(index: int, reveal: bool) -> dict:
    r = ROUNDS[index]
    out = {
        "index": r["index"],
        "code": r["code"],
        "title": r["title"],
        "scientist": r["scientist"],
        "prompt": r["prompt"],
        "question": r["question"],
        "options": r["options"],
        "seconds": r["seconds"],
        "total_rounds": len(ROUNDS),
    }
    if reveal:
        out["correct"] = r["correct"]
        out["explanation"] = r["explanation"]
    return out


def score_answer(index: int, choice: str, justification: str, elapsed: float) -> tuple[int, bool, list[str]]:
    r = ROUNDS[index]
    correct = choice == r["correct"]
    points = POINTS_CORRECT if correct else 0
    notes: list[str] = []
    text = (justification or "").strip()
    low = text.lower()
    if len(text) >= MIN_JUSTIFICATION:
        hits = sum(1 for k in QUALITY_KEYWORDS if k in low)
        bonus = POINTS_JUSTIFICATION if hits >= 2 else int(POINTS_JUSTIFICATION * 0.5)
        points += bonus
        notes.append(f"Gerekçe puanı +{bonus}")
    else:
        notes.append("Gerekçeni en az 40 karakter yazarsan ek puan kazanırsın.")
    if correct:
        span = max(0.0, r["seconds"] - elapsed) / max(1, r["seconds"])
        speed = int(SPEED_BONUS_MAX * span)
        if speed:
            points += speed
            notes.append(f"Hız bonusu +{speed}")
    return points, correct, notes
