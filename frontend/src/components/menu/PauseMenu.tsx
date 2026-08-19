import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { PixelPanel } from '../ui/PixelPanel';
import { PixelButton } from '../ui/PixelButton';
import { Play, Map, Award, Trophy, Settings, Home, X, GraduationCap } from 'lucide-react';

export const PauseMenu: React.FC = () => {
  const { user } = useAuth();
  const { isPaused, setIsPaused, setScreen } = useGame();

  if (!isPaused) return null;

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleNavigate = (screenName: any) => {
    setIsPaused(false);
    setScreen(screenName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm animate-scale-in">
        <PixelPanel
          variant="wood"
          header={
            <div className="flex items-center justify-between w-full">
              <span className="font-pixel text-xs text-amber-300">PAUSED [ESC]</span>
              <button
                onClick={handleResume}
                className="text-amber-200 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-3 py-2">
            <PixelButton
              variant="amber"
              size="md"
              onClick={handleResume}
              icon={<Play className="w-4 h-4 fill-current" />}
            >
              RESUME RESEARCH
            </PixelButton>

            {user?.role === 'ADMIN' && (
              <PixelButton
                variant="amber"
                size="md"
                onClick={() => handleNavigate('ADMIN')}
                icon={<GraduationCap className="w-4 h-4 fill-current" />}
                className="font-bold"
              >
                TEACHER CONSOLE (CMS)
              </PixelButton>
            )}

            <PixelButton
              variant="cyan"
              size="md"
              onClick={() => handleNavigate('WORLD_MAP')}
              icon={<Map className="w-4 h-4" />}
            >
              CAMPUS MAP
            </PixelButton>

            <PixelButton
              variant="wood"
              size="md"
              onClick={() => handleNavigate('ACHIEVEMENTS')}
              icon={<Award className="w-4 h-4 text-amber-400" />}
            >
              ACHIEVEMENTS
            </PixelButton>

            <PixelButton
              variant="wood"
              size="md"
              onClick={() => handleNavigate('LEADERBOARD')}
              icon={<Trophy className="w-4 h-4 text-yellow-400" />}
            >
              LEADERBOARD
            </PixelButton>

            <PixelButton
              variant="wood"
              size="md"
              onClick={() => handleNavigate('SETTINGS')}
              icon={<Settings className="w-4 h-4" />}
            >
              SETTINGS & AUDIO
            </PixelButton>

            <div className="pt-2 border-t border-amber-900/50">
              <PixelButton
                variant="danger"
                size="sm"
                onClick={() => handleNavigate('MENU')}
                icon={<Home className="w-4 h-4" />}
                className="w-full"
              >
                EXIT TO MAIN MENU
              </PixelButton>
            </div>
          </div>
        </PixelPanel>
      </div>
    </div>
  );
};
