export interface User {
  id: number;
  username: string;
  level: number;
  xp: number;
  forge_points: number;
  streak_shields: number;
  avatar?: string;
}

export interface Habit {
  id: number;
  name: string;
  category: string;
  frequency: string;
  streak: number;
  shield_active: number;
  last_completed?: string;
  lifespan_days: number;
  expiry_date?: string;
  reminder_time?: string;
  created_at: string;
}

export interface Quest {
  id: number;
  title: string;
  description: string;
  reward_xp: number;
  reward_fp: number;
  completed: number;
  date: string;
}

export interface Guild {
  id: number;
  name: string;
  description: string;
  member_count: number;
  icon: string;
}

export interface LeaderboardEntry {
  username: string;
  forge_points: number;
  level: number;
}
