# SPEC — Kuantum Dedektifleri: Bilimsel Kırılma

Gamified, AI-supported chemistry learning platform (Turkish UI) for 9th grade, aligned with
Türkiye Yüzyılı Maarif Modeli outcome **KİM.9.1.3** (inferring the changeability of scientific
knowledge from assumptions in atomic theories). Theme: dark "Top Secret" terminal/holographic.

## Roles
- `student` — own progress only (missions, XP, badges, evidence board, mentor chat, own feedback)
- `teacher` — class analytics, student evidence, rubric override, misconception radar, settings
- `admin` — same routes as teacher (system administration)

RBAC is enforced in the backend routers (`require_role`), not only in frontend routes.
Sessions are httpOnly cookies (`kd_session`), tokens stored in `sessions` collection.

## Student flow (routes)
`/giris` (educational purpose → privacy card → privacy link → student/teacher entry)
→ `/` dashboard (safety onboarding modal on first login)
→ `/gorevler` missions list → `/gorevler/:missionId`
→ `/kanit-panosu` evidence board → `/teknoloji-agaci` tech tree
→ `/simulasyonlar` live PhET simulations → `/mentor` Dr. Nova → `/basarilar` → `/profil`
Public: `/gizlilik` (privacy & data use, 11 sections incl. KVKK + accessibility + sources)
Teacher: `/pano` (6 tabs: Genel Bakış, Öğrenciler, Kavram Yanılgısı Radarı, Rubrik, Analitik, Ayarlar)

## Missions (server-authoritative, `backend/lib/content.py`)
| id | code | tasks (task_key: xp) | unlock |
|---|---|---|---|
| karanlik-kutu | B01 | gozlem:50, ilk-model:100 | — |
| dalton-dosyasi | B02 | dosya-inceleme:100, cikarim:100 | B01 |
| thomson-izi | B03 | npc-diyalog:120, zincir:100 | B02 |
| rutherford-operasyonu | B04 | simulasyon:100, kanit-panosu:50, cikarim:100 | B03 |
| bohr-sirri | B05 | npc-diyalog:120, aciklama:100 | B04 |
| chadwick-dosyasi | B06 | siralama:120, zincir:80 | B05 |
| jigsaw | OP | uzman-notu:120, sentez:120 | B02+B03+B04+B05 |
| bilimsel-kirilma | FINAL | gonderim:350 | all 6 chapters |

Evidence board rows award 30 XP each under pseudo-mission `evidence-board` (task `row-<scientist>`).
Levels: 0/250/550/950/1400/2000 XP. Badges: kanit-avcisi, model-sorgulayici, bilim-dedektifi,
bilim-ekibi, bilimsel-dusunur (final AI total ≥ 7).

## Data model (Mongo collections)
- `users` — id, role, code (unique), nickname, class_id, xp, badges[], onboarded, pin_hash (staff only)
- `sessions` — token (unique), user_id, expires_at (7 days)
- `progress` — user_id+mission_id+task_key unique, xp, answers
- `mission_answers` — open-ended in-mission answers (teacher evidence)
- `evidence_boards` — user_id unique, placements{scientist:{field:card_id}}, completed_rows[]
- `jigsaw_notes` — user_id unique, expert_role, notes, synthesis
- `submissions` — final essay + `ai` pre-assessment + optional `teacher` review
- `mentor_messages` — Dr. Nova chat (student-deletable)
- `settings` — id "teacher-settings", leaderboard_enabled

## AI (backend only — key never reaches the browser)
`lib/ai.py` over `emergentintegrations` + `EMERGENT_LLM_KEY` (openai/gpt-5.4).
- `stream_mentor_reply()` → SSE at `POST /api/mentor/chat`; Socratic system prompt with a fixed
  historical knowledge base; rule-based `mock_mentor_reply()` fallback so the flow never breaks.
- `score_submission()` → analytic rubric (nature 0-3, conceptual 0-3, synthesis 0-4 = 10) returning
  suggested score + rationale + evidence + misconception indicators + suggestions; deterministic
  heuristic fallback. Teacher can accept or override (`PATCH /api/teacher/submissions/{id}`).
- `scrub_pii()` strips phone/ID-like digit runs before storage and before the model call.
- `detect_misconceptions()` powers the aggregated teacher radar, worded as
  "olası kavram yanılgısı göstergesi" — never a diagnosis.

## Privacy posture (implemented, not just copy)
No real name/TC/address/phone/email/birthdate/photo/camera/location/ads/3rd-party analytics.
Identity = detective code + nickname. Leaderboard is XP-only and teacher-toggleable. Mentor history
is user-deletable. Footer on every page: "Eğitim amacıyla geliştirilmiş prototiptir" +
"KVKK ve ilgili mevzuat gözetilerek tasarlanmıştır" (never "KVKK uyumludur").

## Seed (synthetic only)
`cd /app/backend && python seed.py` → 30 students (`KD-2001`..`KD-2029` + `KD-2048` fresh),
teacher `OG-1001`/PIN 4321, admin `ADM-0001`/PIN 0000, ~10 final submissions (3 teacher-reviewed),
varied mission progress and evidence-board rows. Credentials: `memory/test_credentials.md`.


## UI system (game HUD, revised)
Immersive shell, not flat panels: `components/layout/AmbientBackground.tsx` (fixed quantum-lab
gradients + drifting tech grid + concentric orbit rings + particle field + vignette/scanlines),
glassmorphism utilities in `index.css` (`.glass`, `.glass-emerald/cyan/amber`, `.hud-frame` cut
corners, `.hud-ticks` crosshairs, `.hover-lift`, `.text-glow`) and keyframes
(grid-drift, orbit, pulse-ring, sweep, scan, flicker, fade-up, blink).
Login (`pages/Login.tsx`) = "GÖREV BRİFİNGİ" panel (icon-driven privacy briefing) +
"SİSTEM GİRİŞ TERMİNALİ" (prompt-prefixed input, shimmer on GÖREVE BAŞLA, demo code chips).

## Simulations (replaces "Hologram Arşivi")
Nav item + route renamed to **SİMÜLASYONLAR** (`/simulasyonlar`, `pages/Simulations.tsx`).
Content in `lib/simulations.ts`: 5 PhET sims embedded LIVE via iframe from phet.colorado.edu
(CC-BY, nothing re-hosted) — rutherford-scattering, models-of-the-hydrogen-atom, build-an-atom,
isotopes-and-atomic-mass, discharge-lamps. Each card carries scientist, experiment, description,
a Socratic "DEDEKTİF SORUSU" prompt, source/license, duration and a link to its related mission.
Legacy `HologramPlayer` component and `HologramArchivePage` removed.

## Kuantum Arenası — live class game (AŞAMA 3.5 + 4.1)
Teacher route `/arena` (host / smartboard), student route `/arena/:pin` (QR landing).
Teacher entry points: nav "Kuantum Arenası" + prominent "ARENAYI BAŞLAT" card on the panel overview tab.

Flow: teacher creates room (PIN `KD-xxxx` + QR of `/arena/<pin>`) → students scan & join (live list with
glitch/fade-in animation, player count) → teacher "TURU BAŞLAT" → 5 evidence rounds (~1 class period) →
per round: students pick which evidence undermines a model + write a justification → teacher
"KANITI AÇIKLA" (reveal + explanation + all student justifications as learning evidence) →
"SONRAKİ TUR" → after round 5 "ARENAYI BİTİR" → final scoreboard.

Backend `routers/arena.py` + `lib/arena_content.py` (correct answers server-side only; the client gets
`correct`/`explanation` only for the host or after reveal). Endpoints: create, current, `{pin}/lobby`,
`{pin}/join`, `{pin}/demo-join`, `{pin}/state`, `{pin}/start`, `{pin}/answer`, `{pin}/reveal`,
`{pin}/next`, `{pin}/close`. Room doc in `arena_rooms`: status open|in_round|reveal|finished,
round_index, players[], answers[].
Scoring: correct evidence +100, justification ≥40 chars +60 (or +30 if weak reasoning keywords),
speed bonus up to +40. Rounds: Dalton→Thomson, Thomson→Rutherford, Rutherford→Bohr, Bohr→Chadwick,
nature-of-science (KİM.9.1.3).
Privacy: lobby/scoreboard show only detective code + nickname + XP-style score; open-ended
justifications are visible to the teacher only.

## Extras
- **Sesli brifing**: `lib/speech.ts` + `components/game/VoiceBriefing.tsx` — Web Speech API (tr-TR),
  on-device, button in every chapter header (`ChapterShell`).
- **Dedektif Rozet Kartı**: `components/game/DetectiveBadgeCard.tsx` on `/profil` — inline SVG card
  (code, nickname, level, XP, missions, badge icons), PNG download + share; contains no personal data.
- **Theme (AŞAMA 4.1)**: dark quantum background + grid retained; accents repainted to neon orange
  `#FB8B24` / amber `#FFC233` / gold. `.hud-frame` is a jigsaw silhouette (tab + notch),
  `.jigsaw-btn` puzzle-shaped CTAs, `.jigsaw-edge` hover data-beam, amber text-glow.
- **Vite**: `react-qr-code` added to `optimizeDeps.include` — a missing entry caused a mid-session
  re-optimize + reload ("Failed to load /src/main.tsx"). Every shipped dep must be listed there.
