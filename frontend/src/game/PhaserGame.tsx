import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from './config';
import { useGame } from '../context/GameContext';
import { useAudio } from '../context/AudioContext';
import { useToast } from '../context/ToastContext';

export const PhaserGame: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const { setScreen, setProximityPrompt, setActiveUnit, units } = useGame();
  const { playSFX } = useAudio();
  const { addToast } = useToast();

  useEffect(() => {
    if (!containerRef.current) return;

    const containerId = 'phaser-game-container';
    containerRef.current.id = containerId;

    if (!gameRef.current) {
      const config = createGameConfig(containerId);
      gameRef.current = new Phaser.Game(config);
    }

    // Event Listeners from Phaser
    const handleProximity = (e: any) => {
      const detail = e.detail;
      if (detail) {
        setProximityPrompt({
          message: detail.prompt,
          action: () => {
            window.dispatchEvent(
              new CustomEvent('game:action', {
                detail: { actionType: detail.actionType, data: detail.data },
              })
            );
          },
        });
      } else {
        setProximityPrompt(null);
      }
    };

    const handleAction = (e: any) => {
      const { actionType } = e.detail || {};
      if (actionType === 'OPEN_LAB' || actionType === 'OPEN_TOPICS') {
        if (units.length > 0) {
          setActiveUnit(units[0]);
        }
        setScreen('LAB');
      } else if (actionType === 'OPEN_LEADERBOARD') {
        setScreen('LEADERBOARD');
      } else if (actionType === 'OPEN_ACHIEVEMENTS') {
        setScreen('ACHIEVEMENTS');
      }
    };

    const handleSFX = (e: any) => {
      if (e.detail) {
        playSFX(e.detail);
      }
    };

    const handleNotification = (e: any) => {
      if (e.detail) {
        addToast(e.detail);
      }
    };

    window.addEventListener('game:proximity', handleProximity);
    window.addEventListener('game:action', handleAction);
    window.addEventListener('game:sfx', handleSFX);
    window.addEventListener('game:notification', handleNotification);

    return () => {
      window.removeEventListener('game:proximity', handleProximity);
      window.removeEventListener('game:action', handleAction);
      window.removeEventListener('game:sfx', handleSFX);
      window.removeEventListener('game:notification', handleNotification);

      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [setScreen, setProximityPrompt, setActiveUnit, units, playSFX, addToast]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#1a120c] overflow-hidden">
      <div ref={containerRef} className="w-full h-full max-w-[1920px] max-h-[1080px] shadow-2xl" />
    </div>
  );
};
