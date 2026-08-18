export interface LevelInfo {
  totalXP: number;
  currentLevel: number;
  nextLevel: number;
  XPToNextLevel: number;
  progressPercentage: number;
}

export function calculateLevel(totalXP: number): LevelInfo {
  const safeXP = Math.max(0, totalXP);

  // Level N minimum XP = 50 * (N - 1) * N
  // e.g. L1 = 0, L2 = 100, L3 = 300, L4 = 600, L5 = 1000, L6 = 1500, etc.
  let currentLevel = 1;
  while (50 * currentLevel * (currentLevel + 1) <= safeXP) {
    currentLevel++;
  }

  const currentLevelMinXP = 50 * (currentLevel - 1) * currentLevel;
  const nextLevelMinXP = 50 * currentLevel * (currentLevel + 1);
  const span = nextLevelMinXP - currentLevelMinXP;
  const xpIntoCurrentLevel = safeXP - currentLevelMinXP;

  const XPToNextLevel = Math.max(0, nextLevelMinXP - safeXP);
  const progressPercentage = span > 0
    ? Math.min(100, Math.round((xpIntoCurrentLevel / span) * 10000) / 100)
    : 100;

  return {
    totalXP: safeXP,
    currentLevel,
    nextLevel: currentLevel + 1,
    XPToNextLevel,
    progressPercentage,
  };
}
