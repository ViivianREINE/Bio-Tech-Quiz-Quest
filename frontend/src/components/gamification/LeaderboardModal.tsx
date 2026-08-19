import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { leaderboardApi } from '../../api';
import type { LeaderboardEntry } from '../../types';
import { PixelPanel } from '../ui/PixelPanel';
import { PixelButton } from '../ui/PixelButton';
import { Trophy, Crown, Star, ArrowLeft, RefreshCw } from 'lucide-react';

export const LeaderboardModal: React.FC = () => {
  const { user } = useAuth();
  const { setScreen } = useGame();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await leaderboardApi.getGlobalLeaderboard();
      const safeData = Array.isArray(data) ? data : [];
      setLeaderboard(safeData);
    } catch (e: any) {
      console.error('Failed to load leaderboard:', e);
      setErrorMsg(e.message || 'Unable to retrieve leaderboard rankings.');
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center gap-1 text-yellow-400 font-pixel text-xs">
          <Crown className="w-5 h-5 fill-current" />
          <span>1ST</span>
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center gap-1 text-slate-300 font-pixel text-xs">
          <Crown className="w-4 h-4 fill-current" />
          <span>2ND</span>
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center gap-1 text-amber-600 font-pixel text-xs">
          <Crown className="w-4 h-4 fill-current" />
          <span>3RD</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-amber-200/70 font-pixel text-xs">
        <Star className="w-3.5 h-3.5" />
        <span>#{rank}</span>
      </div>
    );
  };

  const safeList = Array.isArray(leaderboard) ? leaderboard : [];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-4xl my-auto animate-scale-in">
        <PixelPanel
          variant="wood"
          header={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="font-pixel text-xs md:text-sm text-amber-300">
                  GLOBAL RESEARCH LEADERBOARD & HALL OF FAME
                </span>
              </div>
              <div className="flex items-center gap-2">
                <PixelButton
                  variant="wood"
                  size="sm"
                  onClick={fetchLeaderboard}
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  REFRESH
                </PixelButton>
                <PixelButton
                  variant="wood"
                  size="sm"
                  onClick={() => setScreen('OVERWORLD')}
                  icon={<ArrowLeft className="w-3.5 h-3.5" />}
                >
                  RETURN TO CAMPUS
                </PixelButton>
              </div>
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            {errorMsg && (
              <div className="p-3 bg-red-950/80 border border-red-500 text-red-200 text-xs font-sans rounded">
                ⚠️ {errorMsg}
              </div>
            )}

            {loading ? (
              <div className="py-16 text-center font-pixel text-xs text-amber-300">
                QUERYING GLOBAL ACADEMIC RANKINGS...
              </div>
            ) : safeList.length === 0 ? (
              <div className="py-12 text-center font-pixel text-xs text-amber-100/50">
                No researchers have earned XP yet. Complete topic quizzes to appear on the leaderboard!
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
                {safeList.map((entry, index) => {
                  const rank = entry.rank || index + 1;
                  const isCurrent = user?.id === entry.userId || (user?.email && user.email === entry.email);

                  return (
                    <div
                      key={entry.userId || index}
                      className={`p-3 md:p-4 border-2 flex items-center justify-between gap-3 transition ${
                        isCurrent
                          ? 'pixel-box-gold border-amber-400 bg-[#42220b] shadow-[0_0_12px_rgba(255,179,0,0.4)]'
                          : rank <= 3
                          ? 'pixel-box-wood border-amber-600/80 bg-[#28150c]'
                          : 'bg-[#1b1009] border-stone-800 text-stone-300'
                      }`}
                    >
                      {/* Rank & Name */}
                      <div className="flex items-center gap-3 md:gap-4 flex-1">
                        <div className="w-16 shrink-0 flex items-center justify-center">
                          {getRankBadge(rank)}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-pixel text-xs md:text-sm text-white font-bold">
                              {entry.name || 'Unknown Researcher'}
                            </h4>
                            {isCurrent && (
                              <span className="px-1.5 py-0.5 bg-cyan-800 text-cyan-200 font-pixel text-[8px] rounded">
                                YOU
                              </span>
                            )}
                          </div>
                          {entry.email && (
                            <p className="font-clean text-xs text-amber-100/70">
                              {entry.email}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Stats: Level, Badges, XP */}
                      <div className="flex items-center gap-4 md:gap-6 shrink-0">
                        <div className="text-center hidden sm:block">
                          <span className="font-pixel text-[9px] text-amber-400">LEVEL</span>
                          <div className="font-pixel text-xs text-white">
                            LVL {entry.level || 1}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 border border-amber-900">
                          <img
                            src="/assets/images/glowing_blue_diamond_XP_crystal_icon.png"
                            alt="XP"
                            className="w-4 h-4"
                          />
                          <span className="font-pixel text-xs md:text-sm text-amber-300 font-bold">
                            {entry.totalXP} <span className="text-[9px] text-amber-400/80">XP</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </PixelPanel>
      </div>
    </div>
  );
};
