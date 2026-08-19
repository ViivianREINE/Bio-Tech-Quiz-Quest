import React from 'react';
import { useGame } from '../../context/GameContext';
import { useAudio } from '../../context/AudioContext';
import { Volume2, VolumeX, Map, Trophy, Award, Menu } from 'lucide-react';
import { ProgressBar } from '../ui/ProgressBar';

export const HUD: React.FC = () => {
  const { xpData, screen, setScreen, setIsPaused, proximityPrompt, companionMessage } = useGame();
  const { isMuted, toggleMute } = useAudio();

  const totalXP = xpData?.totalXP ?? 0;
  const currentLevel = xpData?.currentLevel ?? 1;
  const progressPercent = xpData?.progressPercent ?? 0;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex flex-col justify-between p-4 select-none">
      {/* ==================== TOP BAR ==================== */}
      <div className="flex justify-between items-start w-full">
        {/* TOP-LEFT: XP, Level & Progress Bar */}
        <div className="pointer-events-auto flex items-center gap-3 pixel-box-wood px-4 py-2.5 max-w-sm">
          {/* Level Star Badge */}
          <div className="relative flex items-center justify-center shrink-0">
            <img
              src="/assets/images/gold_five_point_star_level_badge_icon.png"
              alt="Level"
              className="w-10 h-10 drop-shadow-md"
            />
            <span className="absolute font-pixel text-[11px] text-amber-950 font-black mt-0.5">
              {currentLevel}
            </span>
          </div>

          {/* XP Details & Progress */}
          <div className="flex flex-col flex-1 min-w-[130px] gap-1">
            <div className="flex items-center justify-between">
              <span className="font-pixel text-[10px] text-amber-300">
                LVL {currentLevel} SCIENTIST
              </span>
              <div className="flex items-center gap-1">
                <img
                  src="/assets/images/glowing_blue_diamond_XP_crystal_icon.png"
                  alt="XP"
                  className="w-4 h-4 inline"
                />
                <span className="font-pixel text-[11px] text-cyan-300 font-bold">
                  {totalXP} <span className="text-[8px] text-cyan-400/80">XP</span>
                </span>
              </div>
            </div>
            <ProgressBar value={progressPercent} variant="cyan" height="sm" />
          </div>
        </div>

        {/* TOP-CENTER: Location Banner */}
        <div className="hidden md:flex items-center gap-2 pixel-box-wood px-5 py-2">
          <span className="animate-pulse text-cyan-400 font-pixel text-xs">●</span>
          <span className="font-silk text-xs text-amber-200 tracking-wider">
            {screen === 'OVERWORLD'
              ? 'BIOTECH CAMPUS — CENTRAL NEXUS'
              : screen === 'LAB'
              ? 'UNIT 1: FUNCTIONAL GENOMICS LAB'
              : 'RESEARCH TERMINAL'}
          </span>
        </div>

        {/* TOP-RIGHT: Controls & Shortcuts */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="pixel-box-wood p-2.5 text-amber-300 hover:text-amber-100 hover:scale-105 active:scale-95 transition cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setScreen('WORLD_MAP')}
            className="pixel-box-wood p-2.5 text-amber-300 hover:text-amber-100 hover:scale-105 active:scale-95 transition cursor-pointer"
            title="World Map"
          >
            <Map className="w-5 h-5" />
          </button>

          <button
            onClick={() => setScreen('ACHIEVEMENTS')}
            className="pixel-box-wood p-2.5 text-amber-300 hover:text-amber-100 hover:scale-105 active:scale-95 transition cursor-pointer"
            title="Achievement Hall"
          >
            <Award className="w-5 h-5" />
          </button>

          <button
            onClick={() => setScreen('LEADERBOARD')}
            className="pixel-box-wood p-2.5 text-amber-300 hover:text-amber-100 hover:scale-105 active:scale-95 transition cursor-pointer"
            title="Leaderboard"
          >
            <Trophy className="w-5 h-5 text-yellow-400" />
          </button>

          <button
            onClick={() => setIsPaused(true)}
            className="pixel-box-wood p-2.5 text-amber-300 hover:text-amber-100 hover:scale-105 active:scale-95 transition cursor-pointer"
            title="Pause Menu [ESC]"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ==================== BOTTOM AREA ==================== */}
      <div className="flex flex-col items-center gap-2 pb-2">
        {/* Companion Hint Dialogue Bubble */}
        {companionMessage && !proximityPrompt && (
          <div className="pointer-events-auto pixel-box-parchment px-4 py-2 max-w-md flex items-center gap-3 animate-float">
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
            <p className="font-clean text-xs font-semibold text-[#3d2415]">
              <strong className="text-cyan-800">Axi Bio-Bot:</strong> "{companionMessage}"
            </p>
          </div>
        )}

        {/* Proximity Interaction Prompt Banner */}
        {proximityPrompt && (
          <div className="pointer-events-auto pixel-box-gold px-6 py-3 animate-bounce cursor-pointer flex items-center gap-3">
            <span className="font-pixel text-sm text-yellow-300 animate-pulse">⚡</span>
            <button
              onClick={proximityPrompt.action}
              className="font-pixel text-xs md:text-sm text-white uppercase tracking-wider underline hover:text-amber-200"
            >
              {proximityPrompt.message}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
