import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { gamificationApi } from '../../api';
import type { BadgeItem } from '../../types';
import { PixelPanel } from '../ui/PixelPanel';
import { PixelButton } from '../ui/PixelButton';
import { Award, Lock, CheckCircle2, ArrowLeft, Sparkles } from 'lucide-react';

export const AchievementsHall: React.FC = () => {
  const { setScreen } = useGame();
  const { user } = useAuth();
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'UNLOCKED' | 'LOCKED'>('ALL');

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setLoading(true);
        setError(null);
        const list = await gamificationApi.getBadges();
        setBadges(Array.isArray(list) ? list : []);
      } catch (e: any) {
        console.error('Failed to load badges:', e);
        setError(e.message || 'Failed to load badges.');
        setBadges([]);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchBadges();
    } else {
      setLoading(false);
    }
  }, [user]);

  const filteredBadges = badges.filter((b) => {
    if (filter === 'UNLOCKED') return b.isUnlocked;
    if (filter === 'LOCKED') return !b.isUnlocked;
    return true;
  });

  const unlockedCount = badges.filter((b) => b.isUnlocked).length;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-4xl my-auto animate-scale-in">
        <PixelPanel
          variant="wood"
          header={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span className="font-pixel text-xs md:text-sm text-amber-300">
                  BIOTECHNOLOGY ACHIEVEMENT HALL
                </span>
              </div>
              <PixelButton
                variant="wood"
                size="sm"
                onClick={() => setScreen('OVERWORLD')}
                icon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                RETURN TO CAMPUS
              </PixelButton>
            </div>
          }
        >
          <div className="flex flex-col gap-6">
            {/* Stats & Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 pixel-box-parchment">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span className="font-pixel text-xs text-[#3a2216]">
                  UNLOCKED: {unlockedCount} / {badges.length} HONORS
                </span>
              </div>

              <div className="flex items-center gap-1.5 font-pixel text-[10px]">
                {(['ALL', 'UNLOCKED', 'LOCKED'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 border transition cursor-pointer ${
                      filter === f
                        ? 'bg-[#3a2216] border-[#1f110b] text-amber-300 font-bold'
                        : 'bg-[#e2d5bd] border-[#b09e7c] text-[#523422] hover:bg-[#d8c8ad]'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-950/80 border-2 border-red-600 text-red-200 text-xs font-sans rounded">
                ⚠️ {error}
              </div>
            )}

            {/* Not logged in */}
            {!user && (
              <div className="py-12 text-center font-pixel text-xs text-amber-300">
                PLEASE LOGIN TO VIEW YOUR ACHIEVEMENTS.
              </div>
            )}

            {/* Badges Grid */}
            {user && loading ? (
              <div className="py-16 text-center font-pixel text-xs text-amber-300">
                LOADING AWARDS DOSSIER...
              </div>
            ) : user && filteredBadges.length === 0 ? (
              <div className="py-12 text-center font-pixel text-xs text-amber-100/50">
                NO BADGES FOUND IN THIS CATEGORY.
              </div>
            ) : user ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredBadges.map((badge) => {
                  const unlocked = badge.isUnlocked;

                  return (
                    <div
                      key={badge.id || badge.code}
                      className={`p-4 border-2 flex items-start gap-3 transition ${
                        unlocked
                          ? 'pixel-box-wood border-amber-500/80'
                          : 'bg-[#18110b] border-stone-800 opacity-60'
                      }`}
                    >
                      {/* Badge Icon */}
                      <div className="relative shrink-0 flex items-center justify-center p-1 bg-black/40 border border-amber-900">
                        {unlocked ? (
                          <img
                            src="/assets/images/gold_five_point_star_level_badge_icon.png"
                            alt="Badge"
                            className="w-12 h-12 drop-shadow-[0_0_8px_rgba(255,179,0,0.6)]"
                          />
                        ) : (
                          <div className="relative w-12 h-12 flex items-center justify-center grayscale">
                            <img
                              src="/assets/images/brass_padlock_closed_lock_icon.png"
                              alt="Locked"
                              className="w-8 h-8 opacity-75"
                            />
                          </div>
                        )}
                      </div>

                      {/* Badge Info */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4
                            className={`font-pixel text-xs ${
                              unlocked ? 'text-amber-300' : 'text-stone-400'
                            }`}
                          >
                            {badge.name}
                          </h4>
                          {unlocked ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                          )}
                        </div>

                        <p className="font-clean text-xs text-amber-100/80 mt-1 leading-relaxed">
                          {badge.description}
                        </p>

                        {unlocked && badge.unlockedAt && (
                          <div className="mt-2 text-[9px] font-pixel text-cyan-400/90">
                            UNLOCKED: {new Date(badge.unlockedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </PixelPanel>
      </div>
    </div>
  );
};
