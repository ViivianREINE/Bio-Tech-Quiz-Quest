import React from 'react';
import { useGame } from '../../context/GameContext';
import { useAudio } from '../../context/AudioContext';
import { PixelPanel } from '../ui/PixelPanel';
import { PixelButton } from '../ui/PixelButton';
import { Settings, Volume2, VolumeX, Music, ArrowLeft, Gamepad2 } from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const { setScreen } = useGame();
  const {
    isMuted,
    toggleMute,
    bgmVolume,
    setBgmVolume,
    sfxVolume,
    setSfxVolume,
    playSFX,
  } = useAudio();

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-xl my-auto animate-scale-in">
        <PixelPanel
          variant="wood"
          header={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                <span className="font-pixel text-xs text-amber-300">
                  SYSTEM CONFIGURATION & AUDIO
                </span>
              </div>
              <PixelButton
                variant="wood"
                size="sm"
                onClick={() => setScreen('OVERWORLD')}
                icon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                CLOSE
              </PixelButton>
            </div>
          }
        >
          <div className="flex flex-col gap-6">
            {/* Audio Settings */}
            <div className="pixel-box-parchment p-4 flex flex-col gap-4">
              <h4 className="font-pixel text-xs text-[#3a2216] flex items-center gap-2">
                <Music className="w-4 h-4 text-amber-800" />
                AUDIO SYNTHESIZER & SOUND
              </h4>

              {/* Master Mute Toggle */}
              <div className="flex items-center justify-between py-1 border-b border-amber-900/20">
                <span className="font-clean text-xs font-bold text-[#3a2216]">
                  Master Sound Output
                </span>
                <PixelButton
                  variant={isMuted ? 'danger' : 'amber'}
                  size="sm"
                  onClick={toggleMute}
                  icon={isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                >
                  {isMuted ? 'MUTED' : 'ENABLED'}
                </PixelButton>
              </div>

              {/* BGM Volume */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-clean text-[#523422]">
                  <span>Background Music (BGM)</span>
                  <span>{Math.round(bgmVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={bgmVolume}
                  onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                  disabled={isMuted}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>

              {/* SFX Volume */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-clean text-[#523422]">
                  <span>Sound Effects (SFX)</span>
                  <span>{Math.round(sfxVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={sfxVolume}
                  onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                  disabled={isMuted}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>

              {/* Sound Test Buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-amber-900/20">
                <span className="font-pixel text-[9px] text-[#523422] w-full">TEST SOUND FX:</span>
                {(['correct', 'wrong', 'levelup', 'unlock', 'tick'] as const).map((snd) => (
                  <button
                    key={snd}
                    onClick={() => playSFX(snd)}
                    className="px-2.5 py-1 bg-[#3a2216] border border-[#1f110b] text-amber-200 font-pixel text-[9px] hover:bg-[#523422] cursor-pointer"
                  >
                    🔊 {snd}
                  </button>
                ))}
              </div>
            </div>

            {/* Controls Reference */}
            <div className="pixel-box-wood p-4 flex flex-col gap-3">
              <h4 className="font-pixel text-xs text-amber-300 flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-cyan-400" />
                STATION CONTROLS REFERENCE
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs font-sans">
                <div className="p-2 bg-black/30 border border-amber-950">
                  <span className="font-pixel text-[10px] text-cyan-300">W / A / S / D</span>
                  <p className="text-amber-100/80 mt-0.5">8-Way Scientist Movement</p>
                </div>
                <div className="p-2 bg-black/30 border border-amber-950">
                  <span className="font-pixel text-[10px] text-cyan-300">ARROW KEYS</span>
                  <p className="text-amber-100/80 mt-0.5">Alternative Movement</p>
                </div>
                <div className="p-2 bg-black/30 border border-amber-950">
                  <span className="font-pixel text-[10px] text-amber-300">[E] / [SPACE]</span>
                  <p className="text-amber-100/80 mt-0.5">Interact / Enter Laboratory</p>
                </div>
                <div className="p-2 bg-black/30 border border-amber-950">
                  <span className="font-pixel text-[10px] text-amber-300">[ESC]</span>
                  <p className="text-amber-100/80 mt-0.5">Pause Menu / Close Modals</p>
                </div>
              </div>
            </div>
          </div>
        </PixelPanel>
      </div>
    </div>
  );
};
