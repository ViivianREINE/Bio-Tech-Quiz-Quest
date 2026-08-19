import React from 'react';
import { useGame } from '../../context/GameContext';
import { useAudio } from '../../context/AudioContext';
import { PixelPanel } from '../ui/PixelPanel';
import { PixelButton } from '../ui/PixelButton';
import { Map, Lock, Navigation, ArrowLeft } from 'lucide-react';

export const WorldMapModal: React.FC = () => {
  const { setScreen, setActiveUnit, units } = useGame();
  const { playSFX } = useAudio();

  const handleFastTravel = (screenName: any, unit?: any) => {
    playSFX('unlock');
    if (unit) setActiveUnit(unit);
    setScreen(screenName);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-3xl my-auto animate-scale-in">
        <PixelPanel
          variant="wood"
          header={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Map className="w-5 h-5 text-cyan-400" />
                <span className="font-pixel text-xs text-amber-300">
                  BIOTECHNOLOGY CAMPUS FAST-TRAVEL MAP
                </span>
              </div>
              <PixelButton
                variant="wood"
                size="sm"
                onClick={() => setScreen('OVERWORLD')}
                icon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                CLOSE MAP
              </PixelButton>
            </div>
          }
        >
          <div className="flex flex-col gap-5">
            {/* Campus Layout Visual Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {/* Central Hub */}
              <div className="pixel-box-wood p-4 flex flex-col justify-between gap-3 border-cyan-500/60">
                <div>
                  <span className="text-[10px] font-pixel text-cyan-400">ZONE 0</span>
                  <h4 className="font-pixel text-xs text-amber-200 mt-1">
                    CENTRAL CAMPUS NEXUS
                  </h4>
                  <p className="text-xs text-amber-100/70 font-sans mt-1">
                    Main atrium connecting all research wings, companion bot, and equipment.
                  </p>
                </div>
                <PixelButton
                  variant="cyan"
                  size="sm"
                  onClick={() => handleFastTravel('OVERWORLD')}
                  icon={<Navigation className="w-3 h-3" />}
                >
                  WALK HERE
                </PixelButton>
              </div>

              {/* Unit 1 Lab */}
              <div className="pixel-box-wood p-4 flex flex-col justify-between gap-3 border-emerald-500/60">
                <div>
                  <span className="text-[10px] font-pixel text-emerald-400">UNIT 1</span>
                  <h4 className="font-pixel text-xs text-amber-200 mt-1">
                    FUNCTIONAL GENOMICS LAB
                  </h4>
                  <p className="text-xs text-amber-100/70 font-sans mt-1">
                    Active OMICS wing containing 6 research modules and assessments.
                  </p>
                </div>
                <PixelButton
                  variant="amber"
                  size="sm"
                  onClick={() => handleFastTravel('LAB', units[0])}
                  icon={<Navigation className="w-3 h-3" />}
                >
                  ENTER LAB
                </PixelButton>
              </div>

              {/* Unit 2 (Locked) */}
              <div className="bg-[#181009] border border-stone-800 p-4 flex flex-col justify-between gap-3 opacity-60">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-pixel text-stone-500">UNIT 2</span>
                    <Lock className="w-3.5 h-3.5 text-stone-500" />
                  </div>
                  <h4 className="font-pixel text-xs text-stone-400 mt-1">
                    ADVANCED GENOMICS WING
                  </h4>
                  <p className="text-xs text-stone-500 font-sans mt-1">
                    Locked sector. Unlocks in future curriculum updates.
                  </p>
                </div>
                <button
                  disabled
                  className="px-3 py-1.5 font-pixel text-[10px] bg-stone-900 border border-stone-800 text-stone-600 cursor-not-allowed"
                >
                  🔒 LOCKED
                </button>
              </div>

              {/* Unit 3 (Locked) */}
              <div className="bg-[#181009] border border-stone-800 p-4 flex flex-col justify-between gap-3 opacity-60">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-pixel text-stone-500">UNIT 3</span>
                    <Lock className="w-3.5 h-3.5 text-stone-500" />
                  </div>
                  <h4 className="font-pixel text-xs text-stone-400 mt-1">
                    PROTEOMICS SECTOR
                  </h4>
                  <p className="text-xs text-stone-500 font-sans mt-1">
                    Locked sector. Undergoing calibration.
                  </p>
                </div>
                <button
                  disabled
                  className="px-3 py-1.5 font-pixel text-[10px] bg-stone-900 border border-stone-800 text-stone-600 cursor-not-allowed"
                >
                  🔒 LOCKED
                </button>
              </div>

              {/* Hall of Fame */}
              <div className="pixel-box-wood p-4 flex flex-col justify-between gap-3 border-amber-600/60">
                <div>
                  <span className="text-[10px] font-pixel text-yellow-400">HALL OF FAME</span>
                  <h4 className="font-pixel text-xs text-amber-200 mt-1">
                    GLOBAL LEADERBOARD
                  </h4>
                  <p className="text-xs text-amber-100/70 font-sans mt-1">
                    Review candidate rankings, top XP leaders, and exam statistics.
                  </p>
                </div>
                <PixelButton
                  variant="wood"
                  size="sm"
                  onClick={() => handleFastTravel('LEADERBOARD')}
                  icon={<Navigation className="w-3 h-3" />}
                >
                  VIEW RANKS
                </PixelButton>
              </div>

              {/* Achievements Hall */}
              <div className="pixel-box-wood p-4 flex flex-col justify-between gap-3 border-cyan-600/60">
                <div>
                  <span className="text-[10px] font-pixel text-cyan-400">TROPHY ROOM</span>
                  <h4 className="font-pixel text-xs text-amber-200 mt-1">
                    ACHIEVEMENT HALL
                  </h4>
                  <p className="text-xs text-amber-100/70 font-sans mt-1">
                    Inspect your unlocked badges and research commendations.
                  </p>
                </div>
                <PixelButton
                  variant="wood"
                  size="sm"
                  onClick={() => handleFastTravel('ACHIEVEMENTS')}
                  icon={<Navigation className="w-3 h-3" />}
                >
                  VIEW HONORS
                </PixelButton>
              </div>
            </div>
          </div>
        </PixelPanel>
      </div>
    </div>
  );
};
