import { prisma } from '../../config/prisma.js';
import { calculateLevel } from '../gamification/level.calculator.js';

export class LeaderboardService {
  async getGlobalLeaderboard(limit = 50) {
    const rawRankings = await prisma.xPTransaction.groupBy({
      by: ['userId'],
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: limit,
    });

    const userIds = rawRankings.map((r) => r.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Build ranked list — deterministic secondary sort by userId for ties
    const ranked = rawRankings
      .map((row) => {
        const totalXP = row._sum.amount ?? 0;
        const levelInfo = calculateLevel(totalXP);
        return {
          userId: row.userId,
          displayName: userMap.get(row.userId)?.name ?? 'Unknown',
          totalXP,
          level: levelInfo.currentLevel,
        };
      })
      .sort((a, b) => b.totalXP - a.totalXP || a.userId.localeCompare(b.userId));

    return ranked.map((entry, idx) => ({ rank: idx + 1, ...entry }));
  }
}

export const leaderboardService = new LeaderboardService();
