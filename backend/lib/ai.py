"""Socratic AI mentor (Dr. Nova) + analytic rubric scoring over the Emergent LLM key.

The key never leaves the backend: frontend talks to /api/mentor and /api/assessment only.
A rule-based fallback keeps the Socratic flow alive if the LLM is unavailable.
"""

import json
import logging
import os
import re
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

_MODEL_PROVIDER = "openai"
_MODEL = "gpt-5.4"

# ------------------------------------------------------------ knowledge base (historical, checked)
KNOWLEDGE = """
DOĞRU TARİHSEL BİLGİ TABANI (yalnızca bunlara dayan, uydurma):
- Dalton (1803): Madde bölünemeyen küresel atomlardan oluşur; aynı elementin atomları birbirinin aynıdır.
  Kanıtlar: kütle korunumu, sabit oran yasaları, gaz gözlemleri. Açıkladığı: kimyasal reaksiyon oranları.
  Sınırı: atomun iç yapısı, elektrik iletkenliği, yük.
- Thomson (1897): Katot ışını tüpü deneyleri; ışınlar negatif yüklü parçacıklardır (elektron).
  Model: pozitif küre içinde gömülü elektronlar (üzümlü kek). Açıkladığı: atomun nötrlüğü, elektronun varlığı.
  Sınırı: alfa saçılmasında büyük açılı geri sapmalar.
- Rutherford (1911): Altın levha deneyi. Çoğu alfa parçacığı levhadan düz geçti; az sayıda büyük açıyla saptı,
  yaklaşık 1/8000'i geri döndü. Çıkarım: pozitif yük ve kütle küçük, yoğun bir çekirdekte toplanmıştır;
  atom çoğunlukla boşluktur. Sınırı: elektronların kararlılığı, çizgi spektrumlar.
- Bohr (1913): Elektronlar belirli enerji düzeylerinde bulunur; enerji alıp verince düzey değiştirir.
  Kanıt: hidrojenin çizgi spektrumu (belirli dalga boyları). Sınırı: çok elektronlu atomlar, kesin yörünge varsayımı.
- Chadwick (1932): Berilyuma alfa ile vurulunca yüksüz, yüksek enerjili ışınım → nötron.
  Açıkladığı: kütlenin proton sayısından fazla olması, izotoplar.
- Kuantum mekaniği: orbital = olasılık dağılımı; elektronun kesin yörüngesi yoktur.
- Bilimin doğası: modeller mevcut kanıtlara göre rasyoneldir; yeni kanıt modelleri değiştirir/geliştirir;
  eski model her zaman 'değersiz' değildir (örn. Dalton'un varsayımları dönemi için geçerliydi).
"""

MISCONCEPTION_MARKERS = [
    ("gunes-sistemi", ["güneş sistemi gibi", "gunes sistemi gibi"]),
    ("kesin-yorunge", ["net dairesel yörünge", "kesin yörünge", "belirli yörüngede döner"]),
    ("yanlis-uydurma", ["her şeyi yanlış uydurmuş", "yanlış uydur", "saçmalık"]),
    ("dalton-degersiz", ["dalton değersiz", "dalton yanlış olduğu için", "tamamen işe yaramaz"]),
    ("degismez-bilgi", ["kesin ve değişmez", "asla değişmez", "değişmez bilgi"]),
    ("eski-model-cop", ["eski model çöp", "tamamen çöktü", "hiçbir işe yaramaz"]),
]


def detect_misconceptions(text: str) -> list[str]:
    low = " " + text.lower() + " "
    found = [key for key, markers in MISCONCEPTION_MARKERS if any(m in low for m in markers)]
    return found


def scrub_pii(text: str) -> tuple[str, bool]:
    """Replace phone/TC-like digit runs — data minimization before anything is stored or sent to the model."""
    scrubbed = re.sub(r"\b0?5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}\b", "[kişisel veri silindi]", text)
    scrubbed = re.sub(r"\b\d{11}\b", "[kişisel veri silindi]", scrubbed)
    scrubbed = re.sub(r"\b\d{10,13}\b", "[kişisel veri silindi]", scrubbed)
    return scrubbed, scrubbed != text


# ------------------------------------------------------------ Socratic mentor
def _system_prompt(mission_id: str | None) -> str:
    mission_ctx = ""
    if mission_id:
        mission_ctx = f"Öğrencinin şu an üzerinde çalıştığı görev: {mission_id}. Yanıtlarını bu göreve bağla."
    return f"""Sen "Dr. Nova" adlı bir bilimsel sorgulama mentorüsün. 9. sınıf Kimya öğrencisiyle (KİM.9.1.3 kazancı:
atom teorilerindeki varsayımları kullanarak bilimsel bilginin değişebilirliğine çıkarım yapma) TÜRKÇE konuşursun.

KATI KURALLAR:
1. ASLA doğrudan, hazır cevabı verme. Her zaman soru → ipucu → ikinci soru → öğrencinin çıkarımı sırasını izle.
2. Öğrencinin gerekçesini sorgula: "Bu düşünceni hangi kanıt destekliyor?", "Gözlemi ile çıkarımın arasında ne var?"
3. Kısa konuş (2-5 cümle), tek bir güçlü soru sor, çoklu soru yığma.
4. Kavram yanılgısı görürsen öğrenciyi azarlama; kanıt iste, karşılaştırma yaptır, daha bilimsel açıklamaya yönlendir.
   Örn: "Bir modeli yalnızca bugünkü bilgilerle 'yanlış' diye değerlendirmek yanıltıcı olabilir. Dalton'un döneminde hangi kanıtlar vardı?"
5. Öğrenci uzun süre ilerleyemezse KONTROLLÜ ipucu verebilirsin ama cevabı yine öğrenciye yazdırmalısın.
6. Ödev/final cevabı öğrencinin yerine YAZMAZSIN. "Rutherford deneyini açıkla" derse: "Önce deneydeki en çarpıcı iki gözlemi belirleyelim: sen hangilerini fark ettin?" dersin.
7. Kimya/bilim dışı konularda kibarca görevine döndür. Kişisel veri (adres, telefon, T.C., şifre) isteme; öğrenci paylaşırsa bunu kişisel bilgi paylaşmaması gerektiğini hatırlatarak uyar.
8. Tarihsel bilgi uydurma; emin olmadığında bunu söyle. Öğrenciyi akademik olarak etiketleme, teşhis koyma.
9. Yanıtın tamamı Türkçe olacak.

{KNOWLEDGE}
{mission_ctx}"""


def mock_mentor_reply(user_text: str) -> str:
    """Rule-based Socratic fallback used when the LLM key is missing or fails."""
    low = user_text.lower()
    if any(w in low for w in ["rutherford", "altın levha", "altin levha", "alfa", "saçılma", "sacilma"]):
        return (
            "Merak ediyorum: altın levha deneyinde parçacıkların büyük çoğunluğu levhadan nasıl geçmişti? "
            "Peki az sayıdaki parçacığın büyük açıyla geri dönmesi seni atomun içinde neye yöneltiyor? "
            "Bu iki gözlemi birleştirince hangi çıkarımı kurabilirsin?"
        )
    if any(w in low for w in ["dalton", "bölünemez", "bolunemez", "küre", "kure"]):
        return (
            "İlginç bir çıkarım. Peki Dalton'un döneminde elinde hangi gözlemler vardı — kütle korunumu mu, sabit oranlar mı? "
            "Bu kanıtlarla 'bölünemez küre' varsayımı dönemi için rasyonel midir, düşünmeli miyiz?"
        )
    if any(w in low for w in ["thomson", "elektron", "katot"]):
        return (
            "Katot ışını tüpünde ışınların manyetik alandan saptığını gözlemlediğini düşünürsek, bu ışınların yükü hakkında ne söyleyebiliriz? "
            "Ve atomun içinde bu parçacık varsa Dalton'un 'bölünemez küre' varsayımına ne olur?"
        )
    if any(w in low for w in ["bohr", "spektrum", "enerji düzeyi", "enerji seviyesi"]):
        return (
            "Hidrojen ısındığında neden her renkte değil de yalnızca belirli çizgilerde ışınım yayar? "
            "Bu kesikli çizgiler, elektronun enerjisi hakkında ne varsayım yapmamızı gerektirir?"
        )
    if any(w in low for w in ["güneş sistemi", "gunes sistemi", "yörünge", "yorunge"]):
        return (
            "Dikkat: bu benzetmenin sana hangi özelliği açıklamada yardımcı olduğunu düşünüyorsun? "
            "Elektronların hareketini gerçekten kesin bir yörüngeyle açıkladığına dair elimizde ne tür bir kanıt var?"
        )
    if any(w in low for w in ["yanlış", "yanlis", "değersiz", "degersiz", "işe yaramaz", "ise yaramaz"]):
        return (
            "Bir bilimsel modeli yalnızca bugün bildiklerimizle 'yanlış' olarak değerlendirmek yanıltıcı olabilir. "
            "Sence de bir modeli kendi döneminin kanıtları içinde değerlendirmek daha adil değil mi? Dalton için hangi kanıtlar mevcuttu?"
        )
    if any(w in low for w in ["nötron", "notron", "chadwick"]):
        return (
            "Atom kütlesi proton sayısından daha büyük çıkıyorsa, çekirdekte henüz keşfedilmemiş ne olabilir? "
            "Berilyum deneyindeki ışınımın yüksüz olması sana ne söyler?"
        )
    return (
        "Güzel bir soru — ama önce seni duymak isterim: bu düşünceni hangi gözlem veya kanıt destekliyor? "
        "Elindeki kanıt dosyalarından birine bakıp bana bir gözlem ve onun çıkarımını anlatır mısın?"
    )


def _get_key() -> str | None:
    return os.environ.get("EMERGENT_LLM_KEY") or None


async def stream_mentor_reply(history: list[dict], user_text: str, mission_id: str | None):
    """Yield text deltas; falls back to the rule-based mentor on any failure."""
    key = _get_key()
    if not key:
        yield mock_mentor_reply(user_text)
        return
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        convo = "\n".join(f"{'Öğrenci' if h['role'] == 'student' else 'Dr. Nova'}: {h['text']}" for h in history[-8:])
        prompt = (f"Konuşma özeti:\n{convo}\n\nÖğrencinin yeni mesajı: {user_text}\n\n"
                  "Dr. Nova olarak Türkçe, kısa ve Sokratik yanıt ver.")
        chat = LlmChat(
            api_key=key,
            session_id=f"nova-{datetime.now(timezone.utc).strftime('%Y%m%d')}",
            system_message=_system_prompt(mission_id),
        ).with_model(_MODEL_PROVIDER, _MODEL)
        from emergentintegrations.llm.chat import TextDelta, StreamDone

        full: list[str] = []
        async for ev in chat.stream_message(UserMessage(text=prompt)):
            if isinstance(ev, TextDelta) and ev.content:
                full.append(ev.content)
                yield ev.content
            elif isinstance(ev, StreamDone):
                break
        if not full:
            yield mock_mentor_reply(user_text)
    except Exception as exc:
        logger.warning("mentor LLM failed, using fallback: %s", exc)
        yield mock_mentor_reply(user_text)


# ------------------------------------------------------------ rubric scoring
SCORE_PROMPT = """Sen bir kimya eğitimi ölçme-değerlendirme uzmanısın. 9. sınıf öğrencisinin açık uçlu cevabını
aşağıdaki ANALİTİK RUBRİKLE puanla. Bilimsel bilginin değişebilirliği (KİM.9.1.3) kazanıma odaklan.

RUBRİK:
- nature (Bilimin Doğası) 0-3: 0 anlamlı açıklama yok; 1 değişim mümkün diyor ama gerekçelendirmiyor;
  2 yeni kanıtların modelleri değiştirebileceğini açıklıyor; 3 modellerin mevcut kanıtlarla kurulup yeni kanıtlarla
  geliştirildiğini atom teorilerinin tarihsel gelişimiyle ilişkilendiriyor.
- conceptual (Kavramsal Doğruluk) 0-3: 0 ciddi hatalı; 1 kısmen doğru ama önemli yanılgılar var;
  2 temel kavramlar büyük ölçüde doğru; 3 modeller-varsayımlar-kanıtlar arası doğru ilişkiler kuruyor.
- synthesis (Sentez/Değerlendirme) 0-4: 0 yok; 1 tek bilgiyi tekrarlıyor; 2 iki modeli karşılaştırıyor;
  3 model değişimini kanıtlarla ilişkilendiriyor; 4 modeller-kanıtlar-değişebilirlik arasında tutarlı sentez.

KAVRAM YANILGISI İŞARETLERİ (görürsen misconception'a ekle): "atom güneş sistemi gibidir", "elektron net dairesel
yörüngede döner", "eski bilim insanları her şeyi uydurmuş", "dalton değersizdi", "bilimsel teori kesin ve değişmez",
"yeni model gelince eski model işe yaramaz".

SADECE şu JSON'u döndür (başka metin yok):
{"nature": int, "conceptual": int, "synthesis": int, "rationale": "2-3 cümle gerekçe",
 "evidence_used": ["öğrencinin kullandığı kanıt/argüman özetleri"], "misconceptions": ["tespit edilen olası yanılgılar"],
 "suggestions": ["gelişim önerisi 1", "öneri 2"]}

ÖĞRENCİ CEVABI:
"""


def _heuristic_score(text: str) -> dict:
    """Deterministic fallback so the flow never breaks without the LLM."""
    low = text.lower()
    nature = 0
    if any(w in low for w in ["değiş", "degis", "geliş", "gelis", "yeni kanıt", "yeni kanit"]):
        nature = 2
    if any(w in low for w in ["kanıtlar doğrultusunda", "kanitlar dogrultusunda", "yeni kanıtlarla", "yeni kanitlarla", "tarihsel gelişim", "tarihsel gelisim"]):
        nature = 3
    conceptual = 1
    hits = sum(w in low for w in ["çekirdek", "cekirdek", "elektron", "alfa", "boşluk", "bosluk", "enerji düzeyi", "enerji duzeyi", "spektrum", "nötron", "notron"])
    conceptual = min(3, 1 + (1 if hits >= 2 else 0) + (1 if hits >= 4 else 0))
    synthesis = 0
    if any(w in low for w in ["o zaman", "olmasaydı", "olmasaydi", "gecikirdi", "gecikirdi", "farklı olurdu", "farkli olurdu"]):
        synthesis = 2
    if any(w in low for w in ["thomson", "bohr", "dalton", "chadwick"]) and synthesis > 0:
        synthesis = 3
    if synthesis == 3 and nature == 3:
        synthesis = 4
    misconceptions = [m for m in detect_misconceptions(text)]
    return {
        "nature": nature,
        "conceptual": conceptual,
        "synthesis": synthesis,
        "rationale": "Ön değerlendirme: otomatik anahtar-kelime analizine göre puanlandı (AI değerlendirmesi kullanılamadı).",
        "evidence_used": [],
        "misconceptions": ["Olası kavram yanılgısı göstergesi: " + m.replace("-", " ") for m in misconceptions],
        "suggestions": ["Cevabını kanıt–model ilişkisi kurarak güçlendir: hangi gözlem, hangi çıkarımı zorunlu kıldı?"],
    }


async def score_submission(text: str) -> dict:
    key = _get_key()
    if key:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage

            chat = LlmChat(
                api_key=key,
                session_id="rubric-scoring",
                system_message="Yalnızca geçerli JSON döndüren bir ölçme-değerlendirme uzmanısın. Tüm metinler Türkçe.",
            ).with_model(_MODEL_PROVIDER, _MODEL)
            res = await chat.send_message(UserMessage(text=SCORE_PROMPT + text[:4000]))
            raw = (res or "").strip()
            raw = re.sub(r"^```(?:json)?|```$", "", raw, flags=re.MULTILINE).strip()
            data = json.loads(raw[raw.find("{"): raw.rfind("}") + 1])
            out = {
                "nature": int(data.get("nature", 0)),
                "conceptual": int(data.get("conceptual", 0)),
                "synthesis": int(data.get("synthesis", 0)),
                "rationale": str(data.get("rationale", "")),
                "evidence_used": [str(x) for x in (data.get("evidence_used") or [])][:6],
                "misconceptions": [str(x) for x in (data.get("misconceptions") or [])][:6],
                "suggestions": [str(x) for x in (data.get("suggestions") or [])][:6],
            }
            if not any(m.lower().startswith("olası kavram") for m in out["misconceptions"]):
                out["misconceptions"] += ["Olası kavram yanılgısı göstergesi: " + m for m in detect_misconceptions(text)]
            return out
        except Exception as exc:
            logger.warning("rubric LLM failed, using heuristic: %s", exc)
    return _heuristic_score(text)
