export const XP_PER_LEVEL = 200;

export const XP_REWARDS = {
  habit_log: 10,
  reflection: 20,
  goal_complete: 50,
  task_complete: 15,
  challenge_step: 25,
} as const;

export function levelFromXp(xp: number) {
  return Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1);
}

export function xpProgress(xp: number) {
  const lvl = levelFromXp(xp);
  const base = (lvl - 1) * XP_PER_LEVEL;
  const into = xp - base;
  return { level: lvl, into, max: XP_PER_LEVEL, percent: Math.min(100, (into / XP_PER_LEVEL) * 100) };
}
