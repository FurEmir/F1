"""Server-authoritative game content: missions, XP rules, levels, badges, evidence cards, rubric."""

from pydantic import BaseModel, Field

# ---------------------------------------------------------------- levels
LEVELS = [
    (1, 0, "Stajyer Dedektif (Karanlık Kutu)"),
    (2, 250, "Madde Araştırmacısı (Dalton)"),
    (3, 550, "Yük Kaşifi (Thomson)"),
    (4, 950, "Çekirdek Operatörü (Rutherford)"),
    (5, 1400, "Kuantum Yörünge Dedektifi (Bohr)"),
    (6, 2000, "Baş Kuantum Müfettişi (Chadwick & Modern)"),
]


def level_for(xp: int) -> tuple[int, str]:
    level, title = LEVELS[0][0], LEVELS[0][2]
    for lv, min_xp, t in LEVELS:
        if xp >= min_xp:
            level, title = lv, t
    return level, title


# ---------------------------------------------------------------- missions
# (task_key, xp) — a mission is completed when all its tasks have progress docs.
MISSION_TASKS: dict[str, list[tuple[str, int]]] = {
    "karanlik-kutu": [("gozlem", 50), ("ilk-model", 100)],
    "dalton-dosyasi": [("dosya-inceleme", 100), ("cikarim", 100)],
    "thomson-izi": [("npc-diyalog", 120), ("zincir", 100)],
    "rutherford-operasyonu": [("simulasyon", 100), ("kanit-panosu", 50), ("cikarim", 100)],
    "bohr-sirri": [("npc-diyalog", 120), ("aciklama", 100)],
    "chadwick-dosyasi": [("siralama", 120), ("zincir", 80)],
    "jigsaw": [("uzman-notu", 120), ("sentez", 120)],
    "bilimsel-kirilma": [("gonderim", 350)],
}

MISSION_META: dict[str, dict] = {
    "karanlik-kutu": {"code": "B01", "title": "Karanlık Kutu", "scientist": None, "year": None},
    "dalton-dosyasi": {"code": "B02", "title": "Dalton Dosyası", "scientist": "John Dalton", "year": "1803"},
    "thomson-izi": {"code": "B03", "title": "Thomson'un İzi", "scientist": "J. J. Thomson", "year": "1897"},
    "rutherford-operasyonu": {"code": "B04", "title": "Rutherford Operasyonu", "scientist": "Ernest Rutherford", "year": "1911"},
    "bohr-sirri": {"code": "B05", "title": "Bohr'un Sırrı", "scientist": "Niels Bohr", "year": "1913"},
    "chadwick-dosyasi": {"code": "B06", "title": "Chadwick Dosyası", "scientist": "James Chadwick", "year": "1932"},
    "jigsaw": {"code": "OP", "title": "Jigsaw: Ayrılıp-Birleşme", "scientist": None, "year": None},
    "bilimsel-kirilma": {"code": "FINAL", "title": "Bilimsel Kırılma (Final Görevi)", "scientist": None, "year": None},
}

MISSION_ORDER = list(MISSION_TASKS.keys())
XP_KEY_TO_MISSION: dict[str, str] = {k: m for m, ts in MISSION_TASKS.items() for k, _ in ts}

# unlock rules: a mission is available when all of its prerequisites are completed
MISSION_PREREQS: dict[str, list[str]] = {
    "karanlik-kutu": [],
    "dalton-dosyasi": ["karanlik-kutu"],
    "thomson-izi": ["dalton-dosyasi"],
    "rutherford-operasyonu": ["thomson-izi"],
    "bohr-sirri": ["rutherford-operasyonu"],
    "chadwick-dosyasi": ["bohr-sirri"],
    "jigsaw": ["dalton-dosyasi", "thomson-izi", "rutherford-operasyonu", "bohr-sirri"],
    "bilimsel-kirilma": ["karanlik-kutu", "dalton-dosyasi", "thomson-izi", "rutherford-operasyonu", "bohr-sirri", "chadwick-dosyasi"],
}


def is_mission_completed(user_id: str, mission_id: str, task_keys: set[str]) -> bool:
    return all(tk in task_keys for tk, _ in MISSION_TASKS.get(mission_id, []))


# ---------------------------------------------------------------- badges
class BadgeDef(BaseModel):
    id: str
    icon: str
    name: str
    desc: str


BADGES: dict[str, BadgeDef] = {
    "kanit-avcisi": BadgeDef(id="kanit-avcisi", icon="🔬", name="Kanıt Avcısı", desc="İlk bilimsel kanıt dosyasını tamamladı."),
    "model-sorgulayici": BadgeDef(id="model-sorgulayici", icon="🧠", name="Model Sorgulayıcı", desc="Bir modelin sınırını kanıtla açıkladı."),
    "bilim-dedektifi": BadgeDef(id="bilim-dedektifi", icon="🕵️", name="Bilim Dedektifi", desc="Atom teorilerinin değişimini doğru ilişkilendirdi."),
    "bilim-ekibi": BadgeDef(id="bilim-ekibi", icon="🤝", name="Bilim Ekibi", desc="Jigsaw görevini tamamladı."),
    "bilimsel-dusunur": BadgeDef(id="bilimsel-dusunur", icon="⚛️", name="Bilimsel Düşünür", desc="Final görevinde güçlü sentez oluşturdu."),
}

# event -> badges awarded (event keys match task_key completions)
BADGE_RULES: dict[str, list[str]] = {
    "dosya-inceleme": ["kanit-avcisi"],
    "zincir": ["model-sorgulayici"],          # thomson chain
    "aciklama": ["model-sorgulayici"],        # bohr limit explanation
    "siralama": ["bilim-dedektifi"],
    "sentez": ["bilim-ekibi"],                # jigsaw synthesis
}

FINAL_BADGE_THRESHOLD = 7  # AI total out of 10 → Bilimsel Düşünür

# ---------------------------------------------------------------- rubric
RUBRIC = {
    "nature": {"max": 3, "label": "Bilimin Doğası", "desc": "Bilimsel bilginin değişebilirliği hakkında açıklama"},
    "conceptual": {"max": 3, "label": "Kavramsal Doğruluk", "desc": "Atom modelleri, varsayımlar ve kanıtlar arası ilişkiler"},
    "synthesis": {"max": 4, "label": "Sentez / Değerlendirme", "desc": "Modellerin değişimini kanıtlarla ilişkilendiren tutarlı sentez"},
}

# ---------------------------------------------------------------- evidence board (single source of truth for correctness)
EB_FIELDS = ["varsayim", "kanit", "acikliyor", "zorlanıyor", "sonraki"]
EB_FIELD_LABELS = {
    "varsayim": "Model Varsayımı",
    "kanit": "Kanıt",
    "acikliyor": "Açıklayabildiği Durum",
    "zorlanıyor": "Açıklamakta Zorlandığı Durum",
    "sonraki": "Sonraki Değişim",
}


class EvidenceCard(BaseModel):
    id: str
    text: str
    scientist: str
    field: str


EB_CARDS: list[EvidenceCard] = [
    EvidenceCard(id="da-var", text="Maddeler bölünemeyen küre biçimindeki atomlardan oluşur; aynı elementin atomları birbirinin aynıdır.", scientist="dalton", field="varsayim"),
    EvidenceCard(id="da-kan", text="Kimyasal bileşim oranları ve kütle korunumu gözlemleri (sabit oran yasaları).", scientist="dalton", field="kanit"),
    EvidenceCard(id="da-ac", text="Kimyasal reaksiyonlarda kütle korunumunu ve sabit bileşim oranlarını açıklar.", scientist="dalton", field="acikliyor"),
    EvidenceCard(id="da-zor", text="Atomun yükünü ve iç yapısını; elektrik iletkenliği gibi olayları açıklamaz.", scientist="dalton", field="zorlanıyor"),
    EvidenceCard(id="da-son", text="Elektronun keşfiyle 'bölünemez küre' varsayımı terk edildi.", scientist="dalton", field="sonraki"),
    EvidenceCard(id="th-var", text="Atom, içine gömülü elektronlar bulunan pozitif yüklü bir küredir (üzümlü kek modeli).", scientist="thomson", field="varsayim"),
    EvidenceCard(id="th-kan", text="Katot ışını tüpü deneyleri: ışınların negatif yüklü, sabit kütle/yük oranlı parçacıklar olduğu.", scientist="thomson", field="kanit"),
    EvidenceCard(id="th-ac", text="Atomun elektriksel nötrlüğünü ve elektronun varlığını açıklar.", scientist="thomson", field="acikliyor"),
    EvidenceCard(id="th-zor", text="Alfa parçacıklarının büyük açılarla geri saçılmasını açıklamaz.", scientist="thomson", field="zorlanıyor"),
    EvidenceCard(id="th-son", text="Altın levha deneyi, pozitif yükün küçük bir çekirdekte toplandığını gösterdi.", scientist="thomson", field="sonraki"),
    EvidenceCard(id="ru-var", text="Pozitif yük ve kütle, merkezdeki küçük ve yoğun çekirdekte toplanmıştır; atom çoğunlukla boşluktur.", scientist="rutherford", field="varsayim"),
    EvidenceCard(id="ru-kan", text="Altın levha deneyi: alfa parçacıklarının çoğu düz geçti, az sayıda büyük açıyla saptı ve geri döndü.", scientist="rutherford", field="kanit"),
    EvidenceCard(id="ru-ac", text="Büyük açılı saçılmayı ve atomun boşluk yapısını açıklar.", scientist="rutherford", field="acikliyor"),
    EvidenceCard(id="ru-zor", text="Elektronların çekirdeğe düşmemesini ve çizgi spektrumlarını açıklamaz.", scientist="rutherford", field="zorlanıyor"),
    EvidenceCard(id="ru-son", text="Belirli enerji düzeyleri varsayımı (Bohr) eklendi.", scientist="rutherford", field="sonraki"),
    EvidenceCard(id="bo-var", text="Elektronlar belirli enerji düzeylerinde bulunur; enerji alıp vererek düzey değiştirir.", scientist="bohr", field="varsayim"),
    EvidenceCard(id="bo-kan", text="Hidrojenin çizgi spektrumu: ışınım yalnızca belirli dalga boylarında görülür.", scientist="bohr", field="kanit"),
    EvidenceCard(id="bo-ac", text="Hidrojenin çizgi spektrumunu ve elektronun kararlılığını açıklar.", scientist="bohr", field="acikliyor"),
    EvidenceCard(id="bo-zor", text="Çok elektronlu atomların spektrumlarını ve kesin yörünge varsayımını açıklamaz.", scientist="bohr", field="zorlanıyor"),
    EvidenceCard(id="bo-son", text="Kuantum mekaniğiyle olasılıksal orbital anlayışına geçildi.", scientist="bohr", field="sonraki"),
    EvidenceCard(id="ch-var", text="Çekirdekte yüksüz, kütlesi protona yakın parçacıklar (nötronlar) bulunur.", scientist="chadwick", field="varsayim"),
    EvidenceCard(id="ch-kan", text="Berilyuma alfa parçacıkları gönderilince yüksek enerjili yüksüz ışınım gözlendi (1932).", scientist="chadwick", field="kanit"),
    EvidenceCard(id="ch-ac", text="Atom kütlesinin proton sayısından büyük olmasını ve izotopları açıklar.", scientist="chadwick", field="acikliyor"),
    EvidenceCard(id="ch-zor", text="Elektron bulutunun (olasılıksal orbital) yapısını açıklamaz.", scientist="chadwick", field="zorlanıyor"),
    EvidenceCard(id="ch-son", text="Modern kuantum modeli atomu olasılık dağılımlarıyla tanımlar.", scientist="chadwick", field="sonraki"),
]

EB_CORRECT: dict[str, dict[str, str]] = {
    s: {c.field: c.id for c in EB_CARDS if c.scientist == s}
    for s in ["dalton", "thomson", "rutherford", "bohr", "chadwick"]
}

EB_ROW_XP = 30  # per fully-correct row, awarded once

# ---------------------------------------------------------------- leaderboards / classes
DEFAULT_CLASS = "9-A"
