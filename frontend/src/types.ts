// Hand-written mirrors of the backend Pydantic models (backend/models/game.py) — keep in sync in the same edit.

export interface UserProfile {
  id: string;
  role: string; // student | teacher | admin
  code: string;
  nickname: string | null;
  class_id: string | null;
  xp: number;
  level: number;
  level_title: string;
  badges: string[];
  onboarded: boolean;
  avatar_seed: string;
  last_active: string | null;
}

export interface BadgeOut {
  id: string;
  icon: string;
  name: string;
  desc: string;
}

export interface MissionStatus {
  id: string;
  order: number;
  code: string;
  title: string;
  scientist: string | null;
  year: string | null;
  status: "locked" | "available" | "completed";
  xp_earned: number;
  xp_total: number;
  tasks_done: string[];
}

export interface MissionCompleteResult {
  xp_awarded: number;
  total_xp: number;
  level: number;
  level_title: string;
  mission_status: string;
  badges_awarded: BadgeOut[];
}

export interface EvidenceCardOut {
  id: string;
  text: string;
  field: string;
}

export interface EvidenceBoardState {
  placements: Record<string, Record<string, string>>;
  completed_rows: string[];
  xp_earned: number;
}

export interface JigsawState {
  expert_role: string | null;
  notes: Record<string, string>;
  synthesis: string;
  completed: boolean;
}

export interface AiAssessment {
  nature: number;
  conceptual: number;
  synthesis: number;
  total: number;
  rationale: string;
  evidence_used: string[];
  misconceptions: string[];
  suggestions: string[];
}

export interface TeacherReview {
  accepted: boolean;
  nature: number;
  conceptual: number;
  synthesis: number;
  total: number;
  feedback: string;
  reviewed_at: string | null;
}

export interface Submission {
  id: string;
  user_id: string;
  code: string;
  nickname: string | null;
  class_id: string;
  mission_id: string;
  prompt: string;
  text: string;
  ai: AiAssessment | null;
  teacher: TeacherReview | null;
  status: string;
  created_at: string;
}

export interface MentorMessage {
  id: string;
  role: string; // student | mentor | system
  text: string;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  code: string;
  nickname: string | null;
  xp: number;
  missions_completed: number;
}

export interface LeaderboardState {
  enabled: boolean;
  entries: LeaderboardEntry[];
}

// ---- teacher panel responses (plain dicts on the backend) ----

export interface TeacherOverview {
  total_students: number;
  active_students: number;
  mission_completion_rate: number;
  ai_assessment_count: number;
  teacher_reviewed_count: number;
  outcome_distribution: { key: string; label: string; count: number }[];
  mission_completion: { id: string; title: string; code: string; completed: number }[];
  leaderboard_enabled: boolean;
  kim_code: string;
  kim_text: string;
}

export interface TeacherStudentRow {
  id: string;
  code: string;
  nickname: string | null;
  xp: number;
  level: number;
  missions_completed: number;
  badges: number;
  outcome: string;
  last_active: string | null;
}

export interface TeacherStudentDetail {
  id: string;
  code: string;
  nickname: string | null;
  xp: number;
  level: number;
  badges: string[];
  missions_completed: string[];
  outcome: string;
  submissions: Submission[];
  open_answers: { mission_id: string; task_key: string; answers: Record<string, string>; created_at: string }[];
}

export interface MisconceptionIndicator {
  key: string;
  label: string;
  count: number;
  percent: number;
  samples: { code: string; excerpt: string; source: string }[];
}

export interface MisconceptionReport {
  class_size: number;
  indicators: MisconceptionIndicator[];
  note: string;
}

export interface TeacherSettings {
  leaderboard_enabled: boolean;
}

export interface OkResponse {
  ok: boolean;
  detail: string;
  extra: Record<string, unknown>;
}

export interface ArenaPlayer {
  code: string;
  nickname: string | null;
  joined_at: string | null;
  synthetic: boolean;
}

export interface ArenaRoom {
  id: string;
  pin: string;
  status: string;
  players: ArenaPlayer[];
  created_at: string;
}

export interface ArenaJoinResult {
  joined: boolean;
  already_joined: boolean;
  pin: string;
  player_count: number;
}

export interface ArenaOption {
  id: string;
  text: string;
}

export interface ArenaRound {
  index: number;
  code: string;
  title: string;
  scientist: string;
  prompt: string;
  question: string;
  options: ArenaOption[];
  seconds: number;
  total_rounds: number;
  correct?: string;
  explanation?: string;
}

export interface ArenaAnswer {
  code: string;
  nickname: string | null;
  choice: string;
  justification: string;
  correct: boolean;
  points: number;
}

export interface ArenaScore {
  rank: number;
  code: string;
  nickname: string | null;
  score: number;
  correct: number;
  answers: number;
}

export interface ArenaState {
  pin: string;
  status: string; // open | in_round | reveal | finished
  round_index: number;
  total_rounds: number;
  current_round: ArenaRound | null;
  players: ArenaPlayer[];
  answers_count: number;
  round_answers: ArenaAnswer[];
  my_answer: ArenaAnswer | null;
  my_notes: string[];
  scoreboard: ArenaScore[];
  round_started_at: string | null;
}
