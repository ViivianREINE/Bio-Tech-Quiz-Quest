import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface AudioContextType {
  isMuted: boolean;
  bgmVolume: number;
  sfxVolume: number;
  toggleMute: () => void;
  setBgmVolume: (vol: number) => void;
  setSfxVolume: (vol: number) => void;
  playBGM: () => void;
  stopBGM: () => void;
  playSFX: (soundName: 'correct' | 'wrong' | 'pass' | 'fail' | 'levelup' | 'unlock' | 'locked' | 'tick' | 'step') => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('btqq_muted') === 'true';
  });
  const [bgmVolume, setBgmVolumeState] = useState<number>(() => {
    const v = localStorage.getItem('btqq_bgm_vol');
    return v ? parseFloat(v) : 0.4;
  });
  const [sfxVolume, setSfxVolumeState] = useState<number>(() => {
    const v = localStorage.getItem('btqq_sfx_vol');
    return v ? parseFloat(v) : 0.7;
  });

  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const sfxCacheRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Initialize SFX Cache
  useEffect(() => {
    const sounds = ['correct', 'wrong', 'pass', 'fail', 'levelup', 'unlock', 'locked', 'tick', 'step'];
    sounds.forEach((name) => {
      const audio = new Audio(`/assets/audio/${name}.wav`);
      audio.preload = 'auto';
      sfxCacheRef.current.set(name, audio);
    });

    const bgm = new Audio('/assets/audio/bgm.ogg');
    bgm.loop = true;
    bgm.preload = 'auto';
    bgm.volume = isMuted ? 0 : bgmVolume;
    bgmRef.current = bgm;

    const enableAudioOnGesture = () => {
      if (!isMuted && bgmRef.current && bgmRef.current.paused) {
        bgmRef.current.play().catch(() => {});
      }
      window.removeEventListener('click', enableAudioOnGesture);
      window.removeEventListener('keydown', enableAudioOnGesture);
    };

    window.addEventListener('click', enableAudioOnGesture);
    window.addEventListener('keydown', enableAudioOnGesture);

    return () => {
      window.removeEventListener('click', enableAudioOnGesture);
      window.removeEventListener('keydown', enableAudioOnGesture);
      if (bgmRef.current) {
        bgmRef.current.pause();
      }
    };
  }, []);

  // Update Volumes
  useEffect(() => {
    if (bgmRef.current) {
      bgmRef.current.volume = isMuted ? 0 : bgmVolume;
    }
    localStorage.setItem('btqq_muted', isMuted ? 'true' : 'false');
    localStorage.setItem('btqq_bgm_vol', bgmVolume.toString());
    localStorage.setItem('btqq_sfx_vol', sfxVolume.toString());
  }, [isMuted, bgmVolume, sfxVolume]);

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const setBgmVolume = (vol: number) => {
    setBgmVolumeState(Math.max(0, Math.min(1, vol)));
  };

  const setSfxVolume = (vol: number) => {
    setSfxVolumeState(Math.max(0, Math.min(1, vol)));
  };

  const playBGM = () => {
    if (bgmRef.current && !isMuted) {
      bgmRef.current.play().catch(() => {});
    }
  };

  const stopBGM = () => {
    if (bgmRef.current) {
      bgmRef.current.pause();
    }
  };

  const playSFX = (soundName: 'correct' | 'wrong' | 'pass' | 'fail' | 'levelup' | 'unlock' | 'locked' | 'tick' | 'step') => {
    if (isMuted || sfxVolume <= 0) return;

    try {
      const cached = sfxCacheRef.current.get(soundName);
      if (cached) {
        const sound = cached.cloneNode(true) as HTMLAudioElement;
        sound.volume = sfxVolume;
        sound.play().catch(() => {});
      }
    } catch {
      // Audio playback fallback
    }
  };

  return (
    <AudioContext.Provider
      value={{
        isMuted,
        bgmVolume,
        sfxVolume,
        toggleMute,
        setBgmVolume,
        setSfxVolume,
        playBGM,
        stopBGM,
        playSFX,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
