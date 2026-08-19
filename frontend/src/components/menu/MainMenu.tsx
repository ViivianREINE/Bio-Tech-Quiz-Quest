import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { useAudio } from '../../context/AudioContext';
import { PixelButton } from '../ui/PixelButton';
import { AuthModal } from '../auth/AuthModal';
import { Play, BookOpen, Trophy, Award, Settings, LogOut, Dna, Sparkles, GraduationCap } from 'lucide-react';

export const MainMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const { setScreen, xpData } = useGame();
  const { playBGM } = useAudio();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handlePlay = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    playBGM();
    setScreen('OVERWORLD');
  };

  const handleOpenLab = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    playBGM();
    setScreen('LAB');
  };

  const handleOpenAdmin = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setScreen('ADMIN');
  };

  return (
    <div className="relative w-full h-full min-h-screen flex items-center justify-center bg-[#180e08] p-4 overflow-hidden scanline-effect">
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#00e5ff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      
      {/* Center Container */}
      <div className="relative z-10 w-full max-w-xl flex flex-col items-center gap-6 animate-fade-in">
        {/* Title Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="flex items-center gap-3">
            <Dna className="w-10 h-10 text-cyan-400 animate-spin" />
            <h1 className="font-pixel text-2xl md:text-3xl text-amber-300 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] tracking-wider">
              BIO-TECH
            </h1>
            <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
          </div>
          <h2 className="font-silk text-lg md:text-xl text-cyan-300 tracking-widest uppercase">
            QUIZ QUEST
          </h2>
          <p className="font-clean text-xs md:text-sm text-amber-100/70 max-w-md">
            Interactive Biotechnology Laboratory Adventure & Academic Assessment Station
          </p>
        </div>

        {/* Researcher Card (If Logged In) */}
        {user ? (
          <div className="w-full pixel-box-wood p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/assets/images/gold_five_point_star_level_badge_icon.png"
                alt="Level"
                className="w-10 h-10"
              />
              <div>
                <h4 className="font-pixel text-xs text-amber-300">{user.name}</h4>
                <p className="text-[11px] text-cyan-300 font-sans">
                  {user.email} • <span className="text-amber-400 font-pixel text-[9px]">{user.role}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a0e08] border border-amber-800">
              <img
                src="/assets/images/glowing_blue_diamond_XP_crystal_icon.png"
                alt="XP"
                className="w-5 h-5"
              />
              <span className="font-pixel text-xs text-cyan-300">
                {xpData?.totalXP ?? 0} <span className="text-[9px] text-cyan-400/80">XP</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full pixel-box-gold p-3 text-center">
            <p className="font-pixel text-xs text-amber-200">
              ⚡ GUEST MODE — SIGN IN TO SAVE XP & EARN BADGES
            </p>
          </div>
        )}

        {/* Menu Buttons Panel */}
        <div className="w-full flex flex-col gap-3">
          <PixelButton
            variant="amber"
            size="lg"
            onClick={handlePlay}
            icon={<Play className="w-5 h-5 fill-current" />}
            className="w-full py-4 text-base"
          >
            {user ? 'ENTER CAMPUS' : 'LOGIN & PLAY'}
          </PixelButton>

          {/* Teacher Console (Admin / Faculty button) */}
          {user?.role === 'ADMIN' && (
            <PixelButton
              variant="amber"
              size="md"
              onClick={handleOpenAdmin}
              icon={<GraduationCap className="w-4 h-4 fill-current" />}
              className="w-full py-3 text-sm font-bold"
            >
              🎓 OPEN TEACHER CONSOLE (CMS)
            </PixelButton>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <PixelButton
              variant="cyan"
              size="md"
              onClick={handleOpenLab}
              icon={<BookOpen className="w-4 h-4" />}
            >
              RESEARCH LAB
            </PixelButton>

            <PixelButton
              variant="wood"
              size="md"
              onClick={() => {
                if (!user) setShowAuthModal(true);
                else setScreen('ACHIEVEMENTS');
              }}
              icon={<Award className="w-4 h-4 text-amber-400" />}
            >
              ACHIEVEMENTS
            </PixelButton>

            <PixelButton
              variant="wood"
              size="md"
              onClick={() => {
                if (!user) setShowAuthModal(true);
                else setScreen('LEADERBOARD');
              }}
              icon={<Trophy className="w-4 h-4 text-yellow-400" />}
            >
              LEADERBOARD
            </PixelButton>

            <PixelButton
              variant="wood"
              size="md"
              onClick={() => setScreen('SETTINGS')}
              icon={<Settings className="w-4 h-4" />}
            >
              SETTINGS
            </PixelButton>
          </div>

          {user && (
            <PixelButton
              variant="danger"
              size="sm"
              onClick={logout}
              icon={<LogOut className="w-3.5 h-3.5" />}
              className="mt-2 w-full"
            >
              LOGOUT RESEARCHER
            </PixelButton>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center font-silk text-[10px] text-amber-200/40">
          POWERED BY OMICS UNIT 1 KNOWLEDGE ENGINE • VER 2.0
        </div>
      </div>

      {/* Auth Modal Trigger */}
      {showAuthModal && (
        <AuthModal
          onSuccess={() => {
            setShowAuthModal(false);
            playBGM();
            setScreen('OVERWORLD');
          }}
        />
      )}
    </div>
  );
};
