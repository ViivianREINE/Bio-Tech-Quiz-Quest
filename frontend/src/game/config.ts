import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { CampusScene } from './scenes/CampusScene';

export const createGameConfig = (containerId: string): Phaser.Types.Core.GameConfig => {
  return {
    type: Phaser.AUTO,
    parent: containerId,
    width: 1280,
    height: 720,
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    backgroundColor: '#1a120c',
    scene: [BootScene, CampusScene],
  };
};
