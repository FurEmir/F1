"""Pydantic v2 models — every response model here has a hand-written TS mirror in frontend/src/types.ts."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class UserProfile(BaseModel):
    id: str
    role: str
    code: str
    nickname: str | None = None
    class_id: str | None = None
    xp: int = 0
    level: int = 1
    level_title: str = "Stajyer Dedektif (Karanlık Kutu)"
    badges: list[str] = []
    onboarded: bool = False
    avatar_seed: str = "emerald"
    last_active: datetime | None = None


class LoginInput(BaseModel):
    code: str = Field(min_length=3, max_length=32)
    pin: str | None = Field(default=None, max_length=32)


class NicknameInput(BaseModel):
    nickname: str = Field(min_length=2, max_length=24)


class MissionStatus(BaseModel):
    id: str
    order: int
    code: str
    title: str
    scientist: str | None = None
    year: str | None = None
    status: str  # locked | available | completed
    xp_earned: int = 0
    xp_total: int = 0
    tasks_done: list[str] = []


class MissionCompleteInput(BaseModel):
    task_key: str
    answers: dict[str, str] = {}


class BadgeOut(BaseModel):
    id: str
    icon: str
    name: str
    desc: str


class MissionCompleteResult(BaseModel):
    xp_awarded: int
    total_xp: int
    level: int
    level_title: str
    mission_status: str
    badges_awarded: list[BadgeOut] = []


class EvidenceCardOut(BaseModel):
    id: str
    text: str
    field: str


class EvidenceBoardState(BaseModel):
    placements: dict[str, dict[str, str]] = {}
    completed_rows: list[str] = []
    xp_earned: int = 0


class EvidencePutInput(BaseModel):
    scientist_id: str
    field: str
    card_id: str | None = None


class JigsawState(BaseModel):
    expert_role: str | None = None
    notes: dict[str, str] = {}
    synthesis: str = ""
    completed: bool = False


class JigsawSaveInput(BaseModel):
    expert_role: str
    notes: dict[str, str] = {}
    synthesis: str = ""


class AiAssessment(BaseModel):
    nature: int
    conceptual: int
    synthesis: int
    total: int
    rationale: str
    evidence_used: list[str] = []
    misconceptions: list[str] = []
    suggestions: list[str] = []


class TeacherReview(BaseModel):
    accepted: bool
    nature: int
    conceptual: int
    synthesis: int
    total: int
    feedback: str = ""
    reviewed_at: datetime | None = None


class Submission(BaseModel):
    id: str
    user_id: str
    code: str
    nickname: str | None = None
    class_id: str
    mission_id: str
    prompt: str = ""
    text: str
    ai: AiAssessment | None = None
    teacher: TeacherReview | None = None
    status: str = "ai_scored"  # ai_scored | teacher_reviewed
    created_at: datetime


class SubmissionInput(BaseModel):
    text: str = Field(min_length=20, max_length=6000)


class TeacherReviewInput(BaseModel):
    action: str  # accept | override
    nature: int | None = Field(default=None, ge=0, le=3)
    conceptual: int | None = Field(default=None, ge=0, le=3)
    synthesis: int | None = Field(default=None, ge=0, le=4)
    feedback: str = Field(default="", max_length=2000)


class MentorMessage(BaseModel):
    id: str
    role: str  # student | mentor | system
    text: str
    created_at: datetime


class MentorChatInput(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    mission_id: str | None = None


class LeaderboardEntry(BaseModel):
    rank: int
    code: str
    nickname: str | None
    xp: int
    missions_completed: int


class LeaderboardState(BaseModel):
    enabled: bool
    entries: list[LeaderboardEntry] = []


class SettingsInput(BaseModel):
    leaderboard_enabled: bool


class Ok(BaseModel):
    ok: bool = True
    detail: str = ""
    extra: dict[str, Any] = {}


class ArenaPlayer(BaseModel):
    code: str
    nickname: str | None = None
    joined_at: datetime | None = None
    synthetic: bool = False


class ArenaRoom(BaseModel):
    id: str
    pin: str
    status: str = "open"
    players: list[ArenaPlayer] = []
    created_at: datetime


class ArenaAnswerInput(BaseModel):
    choice: str = Field(min_length=1, max_length=8)
    justification: str = Field(default="", max_length=1200)


class ArenaAnswer(BaseModel):
    code: str
    nickname: str | None = None
    choice: str
    justification: str = ""
    correct: bool = False
    points: int = 0


class ArenaScore(BaseModel):
    rank: int = 0
    code: str
    nickname: str | None = None
    score: int = 0
    correct: int = 0
    answers: int = 0


class ArenaState(BaseModel):
    pin: str
    status: str
    round_index: int = 0
    total_rounds: int = 0
    current_round: dict[str, Any] | None = None
    players: list[ArenaPlayer] = []
    answers_count: int = 0
    round_answers: list[ArenaAnswer] = []
    my_answer: ArenaAnswer | None = None
    my_notes: list[str] = []
    scoreboard: list[ArenaScore] = []
    round_started_at: datetime | None = None


class ArenaJoinResult(BaseModel):
    joined: bool
    already_joined: bool
    pin: str
    player_count: int
