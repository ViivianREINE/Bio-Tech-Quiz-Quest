import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Load static image assets
    this.load.image('ground_lab_tile', '/assets/images/ground_lab_tile.png');
    this.load.image('ground_grass', '/assets/images/ground_grass.png');
    this.load.image('xp_crystal', '/assets/images/glowing_blue_diamond_XP_crystal_icon.png');
    this.load.image('star_badge', '/assets/images/gold_five_point_star_level_badge_icon.png');
    this.load.image('padlock', '/assets/images/brass_padlock_closed_lock_icon.png');
    this.load.image('test_tube', '/assets/images/a_science_test_tube_flask_filled_with_bright_aqua_liquid__used_as_a_life_or_attempt_pip.png');

    // Create procedural high-fidelity pixel art sprites if any asset needs fallbacks or animation frames
    this.generateProceduralSprites();
  }

  create() {
    this.scene.start('CampusScene');
  }

  private generateProceduralSprites() {
    // 1. Generate Scientist Player (32x48) Frames: Down, Up, Left, Right
    this.generatePlayerSprite();

    // 2. Generate Companion Bio-Bot (32x32)
    this.generateCompanionSprite();

    // 3. Generate Lab Furniture & Props:
    this.generateLabProps();
  }

  private generatePlayerSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 32 * 3;
    canvas.height = 48 * 4;
    const ctx = canvas.getContext('2d')!;

    for (let d = 0; d < 4; d++) {
      for (let f = 0; f < 3; f++) {
        const ox = f * 32;
        const oy = d * 48;
        const legOffset = f === 1 ? -2 : f === 2 ? 2 : 0;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(ox + 16, oy + 44, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs / Pants (Dark Navy)
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(ox + 11 + legOffset, oy + 36, 4, 8);
        ctx.fillRect(ox + 17 - legOffset, oy + 36, 4, 8);

        // Shoes (Brown)
        ctx.fillStyle = '#451a03';
        ctx.fillRect(ox + 10 + legOffset, oy + 42, 5, 4);
        ctx.fillRect(ox + 17 - legOffset, oy + 42, 5, 4);

        // Lab Coat / Body (Clean White & Slate details)
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(ox + 8, oy + 20, 16, 18);

        // Lab coat buttons / trim
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(ox + 15, oy + 22, 2, 14);

        // Backpack / Vials on Back
        if (d === 1 || d === 2 || d === 3) {
          ctx.fillStyle = '#78350f';
          ctx.fillRect(ox + (d === 2 ? 18 : 6), oy + 22, 8, 12);
          // Glowing Aqua Vial in bag pocket
          ctx.fillStyle = '#00e5ff';
          ctx.fillRect(ox + (d === 2 ? 20 : 8), oy + 24, 4, 6);
        }

        // Head / Skin (Peach / Warm)
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(ox + 9, oy + 8, 14, 13);

        // Hair (Brown Chibi style)
        ctx.fillStyle = '#713f12';
        ctx.fillRect(ox + 8, oy + 4, 16, 8);
        ctx.fillRect(ox + 6, oy + 8, 4, 6);
        ctx.fillRect(ox + 22, oy + 8, 4, 6);

        // Eyes & Glasses (Cute Aqua Scientist Visor/Glasses)
        if (d === 0) { // Down
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(ox + 11, oy + 12, 4, 4);
          ctx.fillRect(ox + 17, oy + 12, 4, 4);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(ox + 12, oy + 13, 2, 2);
          ctx.fillRect(ox + 18, oy + 13, 2, 2);
          // Glasses frame
          ctx.fillStyle = '#0f172a';
          ctx.strokeRect(ox + 10.5, oy + 11.5, 5, 5);
          ctx.strokeRect(ox + 16.5, oy + 11.5, 5, 5);
        } else if (d === 2) { // Left
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(ox + 10, oy + 12, 4, 4);
          ctx.strokeRect(ox + 9.5, oy + 11.5, 5, 5);
        } else if (d === 3) { // Right
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(ox + 18, oy + 12, 4, 4);
          ctx.strokeRect(ox + 17.5, oy + 11.5, 5, 5);
        }
      }
    }

    this.textures.addCanvas('player_canvas', canvas);
    this.textures.addSpriteSheet('player_scientist', this.textures.get('player_canvas').getSourceImage() as any, {
      frameWidth: 32,
      frameHeight: 48,
    });
  }

  private generateCompanionSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;

    // Cute floating jelly/bio-bot with aqua aura
    ctx.fillStyle = 'rgba(0, 229, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(16, 16, 14, 0, Math.PI * 2);
    ctx.fill();

    // Inner glowing sphere
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(16, 16, 10, 0, Math.PI * 2);
    ctx.fill();

    // Cute chibi eyes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(12, 14, 2, 3);
    ctx.fillRect(18, 14, 2, 3);

    // Sparkle reflection
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(13, 11, 2, 2);

    this.textures.addCanvas('companion_bot', canvas);
  }

  private generateLabProps() {
    // 1. DNA Tank
    const dnaCanvas = document.createElement('canvas');
    dnaCanvas.width = 48;
    dnaCanvas.height = 80;
    const dctx = dnaCanvas.getContext('2d')!;
    dctx.fillStyle = '#334155';
    dctx.fillRect(4, 60, 40, 18);
    dctx.fillStyle = '#f59e0b';
    dctx.fillRect(8, 64, 32, 4);
    dctx.fillStyle = '#334155';
    dctx.fillRect(4, 2, 40, 14);
    dctx.fillStyle = 'rgba(0, 229, 255, 0.25)';
    dctx.fillRect(8, 16, 32, 44);
    dctx.fillStyle = '#00e5ff';
    for (let y = 20; y < 56; y += 6) {
      const sin = Math.sin((y / 36) * Math.PI * 2) * 10;
      dctx.fillRect(24 + sin, y, 4, 3);
      dctx.fillRect(24 - sin, y, 4, 3);
      dctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      dctx.fillRect(24 - Math.abs(sin), y + 1, Math.abs(sin) * 2, 1);
      dctx.fillStyle = '#00e5ff';
    }
    this.textures.addCanvas('prop_dna_tank', dnaCanvas);

    // 2. Research Computer / Terminal
    const termCanvas = document.createElement('canvas');
    termCanvas.width = 48;
    termCanvas.height = 48;
    const tctx = termCanvas.getContext('2d')!;
    tctx.fillStyle = '#5c3a21';
    tctx.fillRect(2, 20, 44, 26);
    tctx.fillStyle = '#3d2414';
    tctx.fillRect(4, 40, 40, 6);
    tctx.fillStyle = '#0f172a';
    tctx.fillRect(10, 4, 28, 20);
    tctx.fillStyle = '#00e5ff';
    tctx.fillRect(12, 6, 24, 16);
    tctx.fillStyle = '#004d40';
    tctx.fillRect(14, 9, 14, 2);
    tctx.fillRect(14, 13, 20, 2);
    tctx.fillRect(14, 17, 10, 2);
    this.textures.addCanvas('prop_terminal', termCanvas);

    // 3. Microscope Bench
    const microCanvas = document.createElement('canvas');
    microCanvas.width = 64;
    microCanvas.height = 48;
    const mctx = microCanvas.getContext('2d')!;
    mctx.fillStyle = '#e2e8f0';
    mctx.fillRect(2, 16, 60, 30);
    mctx.fillStyle = '#94a3b8';
    mctx.fillRect(4, 40, 56, 6);
    mctx.fillStyle = '#0f172a';
    mctx.fillRect(16, 6, 12, 16);
    mctx.fillStyle = '#f59e0b';
    mctx.fillRect(18, 2, 8, 6);
    mctx.fillStyle = '#a855f7';
    mctx.fillRect(42, 22, 6, 10);
    mctx.fillStyle = '#22c55e';
    mctx.fillRect(52, 20, 6, 12);
    this.textures.addCanvas('prop_microscope_bench', microCanvas);

    // 4. Hydroponic Plant
    const plantCanvas = document.createElement('canvas');
    plantCanvas.width = 32;
    plantCanvas.height = 48;
    const pctx = plantCanvas.getContext('2d')!;
    pctx.fillStyle = '#78350f';
    pctx.fillRect(6, 30, 20, 16);
    pctx.fillStyle = '#15803d';
    pctx.beginPath();
    pctx.arc(16, 22, 12, 0, Math.PI * 2);
    pctx.fill();
    pctx.fillStyle = '#22c55e';
    pctx.beginPath();
    pctx.arc(14, 18, 8, 0, Math.PI * 2);
    pctx.fill();
    this.textures.addCanvas('prop_plant', plantCanvas);

    // 5. Unit Lab Portal Door
    const doorCanvas = document.createElement('canvas');
    doorCanvas.width = 64;
    doorCanvas.height = 64;
    const drctx = doorCanvas.getContext('2d')!;
    drctx.fillStyle = '#334155';
    drctx.fillRect(0, 0, 64, 64);
    drctx.fillStyle = '#064e3b';
    drctx.fillRect(8, 8, 48, 56);
    drctx.fillStyle = '#00e5ff';
    drctx.fillRect(12, 12, 40, 52);
    drctx.fillStyle = '#ffffff';
    drctx.font = '16px monospace';
    drctx.fillText('🧬 LAB', 14, 36);
    this.textures.addCanvas('prop_lab_door', doorCanvas);
  }
}
