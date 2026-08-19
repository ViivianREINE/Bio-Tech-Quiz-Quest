import Phaser from 'phaser';

interface InteractiveZone {
  x: number;
  y: number;
  radius: number;
  prompt: string;
  actionType: string;
  data?: any;
}

export class CampusScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private companion!: Phaser.GameObjects.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
    SPACE: Phaser.Input.Keyboard.Key;
  };
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private interactiveZones: InteractiveZone[] = [];
  private activeZone: InteractiveZone | null = null;
  private lastStepSoundTime = 0;

  constructor() {
    super('CampusScene');
  }

  create() {
    const mapWidth = 1600;
    const mapHeight = 1200;

    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

    // 1. Create Tile Flooring
    this.createFloor(mapWidth, mapHeight);

    // 2. Create Obstacles (Walls, Lab Furniture, DNA Cylinders, Consoles)
    this.obstacles = this.physics.add.staticGroup();
    this.buildCampusEnvironment(mapWidth, mapHeight);

    // 3. Create Player
    this.createPlayerAnimations();
    this.player = this.physics.add.sprite(mapWidth / 2, mapHeight / 2 + 100, 'player_scientist', 0);
    this.player.setCollideWorldBounds(true);
    this.player.setSize(24, 28);
    this.player.setOffset(4, 20);
    this.player.setDepth(20);

    // 4. Create Companion Bio-Bot
    this.companion = this.add.image(this.player.x + 30, this.player.y - 20, 'companion_bot');
    this.companion.setDepth(25);

    // 5. Collisions
    this.physics.add.collider(this.player, this.obstacles);

    // 6. Camera Follow
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.15);

    // 7. Input Controls
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasdKeys = this.input.keyboard!.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      E: Phaser.Input.Keyboard.KeyCodes.E,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
    }) as any;

    // Register interaction zones
    this.registerInteractiveZones(mapWidth, mapHeight);

    // Global Action Key Listener [E]
    this.input.keyboard!.on('keydown-E', () => {
      this.triggerActiveAction();
    });
    this.input.keyboard!.on('keydown-SPACE', () => {
      this.triggerActiveAction();
    });
  }

  private createFloor(mapWidth: number, mapHeight: number) {
    // Tiled laboratory floor
    const tileSize = 64;
    for (let x = 0; x < mapWidth; x += tileSize) {
      for (let y = 0; y < mapHeight; y += tileSize) {
        const isBorder = x < 64 || x >= mapWidth - 64 || y < 64 || y >= mapHeight - 64;
        const color = isBorder ? 0x24140e : (x / tileSize + y / tileSize) % 2 === 0 ? 0x3d271d : 0x482f23;
        const tile = this.add.rectangle(x + tileSize / 2, y + tileSize / 2, tileSize, tileSize, color);
        tile.setStrokeStyle(1, 0x1f120c, 0.5);
        tile.setDepth(0);
      }
    }

    // High-tech circular central nexus pattern
    const nexus = this.add.circle(mapWidth / 2, mapHeight / 2, 220, 0x0f2327, 0.9);
    nexus.setStrokeStyle(4, 0x00e5ff, 0.7);
    nexus.setDepth(1);

    const innerNexus = this.add.circle(mapWidth / 2, mapHeight / 2, 120, 0x16383e, 0.8);
    innerNexus.setStrokeStyle(2, 0xffb300, 0.6);
    innerNexus.setDepth(2);
  }

  private buildCampusEnvironment(mapWidth: number, mapHeight: number) {
    const cx = mapWidth / 2;
    const cy = mapHeight / 2;

    // Exterior Perimeter Walls
    this.createWall(0, 0, mapWidth, 64);
    this.createWall(0, mapHeight - 64, mapWidth, 64);
    this.createWall(0, 0, 64, mapHeight);
    this.createWall(mapWidth - 64, 0, 64, mapHeight);

    // ==================== NORTH LAB WING: UNIT 1 (OMICS) ====================
    const labDoor1 = this.add.image(cx, 160, 'prop_lab_door').setScale(1.5).setDepth(10);
    this.obstacles.add(this.physics.add.existing(labDoor1, true));

    this.add.text(cx, 100, '🔬 UNIT 1: FUNCTIONAL GENOMICS & EPIGENOMICS', {
      fontFamily: 'Silkscreen, monospace',
      fontSize: '14px',
      color: '#00e5ff',
      backgroundColor: '#0f172a',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setDepth(12);

    // DNA holographic tanks flanking Unit 1
    this.createProp(cx - 140, 160, 'prop_dna_tank');
    this.createProp(cx + 140, 160, 'prop_dna_tank');

    // ==================== WEST WING: RESEARCH ARCHIVES & TERMINALS ====================
    this.createProp(240, cy - 120, 'prop_terminal');
    this.createProp(240, cy, 'prop_terminal');
    this.createProp(240, cy + 120, 'prop_terminal');

    this.add.text(240, cy - 180, '📚 TOPIC RESEARCH ARCHIVE', {
      fontFamily: 'Silkscreen, monospace',
      fontSize: '12px',
      color: '#ffca28',
      backgroundColor: '#2b170c',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setDepth(12);

    // Microscope benches
    this.createProp(360, cy - 60, 'prop_microscope_bench');
    this.createProp(360, cy + 80, 'prop_microscope_bench');

    // Hydroponic plants in corners
    this.createProp(120, 120, 'prop_plant');
    this.createProp(120, mapHeight - 120, 'prop_plant');
    this.createProp(mapWidth - 120, 120, 'prop_plant');
    this.createProp(mapWidth - 120, mapHeight - 120, 'prop_plant');

    // ==================== EAST WING: LOCKED FUTURE UNITS ====================
    const unit2Door = this.add.image(mapWidth - 260, cy - 120, 'prop_lab_door').setTint(0x64748b).setScale(1.2).setDepth(10);
    this.obstacles.add(this.physics.add.existing(unit2Door, true));
    this.add.text(mapWidth - 260, cy - 170, '🔒 UNIT 2 (LOCKED)', {
      fontFamily: 'Silkscreen, monospace',
      fontSize: '11px',
      color: '#94a3b8',
      backgroundColor: '#1e293b',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setDepth(12);

    const unit3Door = this.add.image(mapWidth - 260, cy + 120, 'prop_lab_door').setTint(0x64748b).setScale(1.2).setDepth(10);
    this.obstacles.add(this.physics.add.existing(unit3Door, true));
    this.add.text(mapWidth - 260, cy + 70, '🔒 UNIT 3 (LOCKED)', {
      fontFamily: 'Silkscreen, monospace',
      fontSize: '11px',
      color: '#94a3b8',
      backgroundColor: '#1e293b',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setDepth(12);

    // ==================== SOUTH WING: HALL OF FAME & TROPHIES ====================
    this.createProp(cx - 180, mapHeight - 200, 'prop_terminal');
    this.createProp(cx + 180, mapHeight - 200, 'prop_terminal');

    this.add.text(cx - 180, mapHeight - 250, '🏆 GLOBAL LEADERBOARD', {
      fontFamily: 'Silkscreen, monospace',
      fontSize: '12px',
      color: '#ffb300',
      backgroundColor: '#2b170c',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setDepth(12);

    this.add.text(cx + 180, mapHeight - 250, '🎖️ ACHIEVEMENT HALL', {
      fontFamily: 'Silkscreen, monospace',
      fontSize: '12px',
      color: '#00e5ff',
      backgroundColor: '#0f172a',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setDepth(12);

    // Central DNA Hologram Monument
    this.createProp(cx, cy, 'prop_dna_tank');
  }

  private createWall(x: number, y: number, w: number, h: number) {
    const wall = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x1f110b);
    wall.setStrokeStyle(2, 0x4a2c1b);
    wall.setDepth(10);
    this.obstacles.add(this.physics.add.existing(wall, true));
  }

  private createProp(x: number, y: number, textureKey: string) {
    const prop = this.add.image(x, y, textureKey);
    prop.setDepth(15);
    const body = this.physics.add.existing(prop, true);
    this.obstacles.add(body);
    return prop;
  }

  private registerInteractiveZones(mapWidth: number, mapHeight: number) {
    const cx = mapWidth / 2;
    const cy = mapHeight / 2;

    this.interactiveZones = [
      {
        x: cx,
        y: 220,
        radius: 90,
        prompt: '[E] ENTER UNIT 1 LAB (OMICS)',
        actionType: 'OPEN_LAB',
      },
      {
        x: 240,
        y: cy,
        radius: 110,
        prompt: '[E] ACCESS RESEARCH TOPICS',
        actionType: 'OPEN_TOPICS',
      },
      {
        x: cx - 180,
        y: mapHeight - 200,
        radius: 80,
        prompt: '[E] VIEW GLOBAL LEADERBOARD',
        actionType: 'OPEN_LEADERBOARD',
      },
      {
        x: cx + 180,
        y: mapHeight - 200,
        radius: 80,
        prompt: '[E] VIEW ACHIEVEMENTS',
        actionType: 'OPEN_ACHIEVEMENTS',
      },
      {
        x: mapWidth - 260,
        y: cy - 120,
        radius: 80,
        prompt: '🔒 UNIT 2 IS LOCKED (COMING SOON)',
        actionType: 'LOCKED_UNIT',
      },
      {
        x: mapWidth - 260,
        y: cy + 120,
        radius: 80,
        prompt: '🔒 UNIT 3 IS LOCKED (COMING SOON)',
        actionType: 'LOCKED_UNIT',
      },
    ];
  }

  private createPlayerAnimations() {
    this.anims.create({
      key: 'walk_down',
      frames: this.anims.generateFrameNumbers('player_scientist', { start: 0, end: 2 }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: 'walk_up',
      frames: this.anims.generateFrameNumbers('player_scientist', { start: 3, end: 5 }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: 'walk_left',
      frames: this.anims.generateFrameNumbers('player_scientist', { start: 6, end: 8 }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: 'walk_right',
      frames: this.anims.generateFrameNumbers('player_scientist', { start: 9, end: 11 }),
      frameRate: 8,
      repeat: -1,
    });
  }

  update(time: number) {
    if (!this.player) return;

    // Movement logic (8-directional, 180px/sec)
    const speed = 180;
    let vx = 0;
    let vy = 0;

    const left = this.cursors.left.isDown || this.wasdKeys.A.isDown;
    const right = this.cursors.right.isDown || this.wasdKeys.D.isDown;
    const up = this.cursors.up.isDown || this.wasdKeys.W.isDown;
    const down = this.cursors.down.isDown || this.wasdKeys.S.isDown;

    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    // Normalize diagonal speed
    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    this.player.setVelocity(vx * speed, vy * speed);

    // Animations & footsteps
    if (vx !== 0 || vy !== 0) {
      if (Math.abs(vx) > Math.abs(vy)) {
        this.player.anims.play(vx > 0 ? 'walk_right' : 'walk_left', true);
      } else {
        this.player.anims.play(vy > 0 ? 'walk_down' : 'walk_up', true);
      }

      // Footstep sound throttle (every 320ms)
      if (time - this.lastStepSoundTime > 320) {
        this.lastStepSoundTime = time;
        window.dispatchEvent(new CustomEvent('game:sfx', { detail: 'step' }));
      }
    } else {
      this.player.anims.stop();
    }

    // Companion smooth floating follow
    if (this.companion) {
      const targetX = this.player.x + 28;
      const targetY = this.player.y - 24 + Math.sin(time / 250) * 5;
      this.companion.x += (targetX - this.companion.x) * 0.1;
      this.companion.y += (targetY - this.companion.y) * 0.1;
    }

    // Check interaction proximity
    this.checkInteractionProximity();
  }

  private checkInteractionProximity() {
    let nearestZone: InteractiveZone | null = null;
    let minDistance = Infinity;

    for (const zone of this.interactiveZones) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, zone.x, zone.y);
      if (dist <= zone.radius && dist < minDistance) {
        minDistance = dist;
        nearestZone = zone;
      }
    }

    if (nearestZone !== this.activeZone) {
      this.activeZone = nearestZone;
      window.dispatchEvent(
        new CustomEvent('game:proximity', {
          detail: nearestZone
            ? {
                prompt: nearestZone.prompt,
                actionType: nearestZone.actionType,
                data: nearestZone.data,
              }
            : null,
        })
      );
    }
  }

  private triggerActiveAction() {
    if (this.activeZone) {
      if (this.activeZone.actionType === 'LOCKED_UNIT') {
        window.dispatchEvent(new CustomEvent('game:sfx', { detail: 'locked' }));
        window.dispatchEvent(
          new CustomEvent('game:notification', {
            detail: {
              type: 'warning',
              title: 'Access Restricted',
              description: 'This laboratory module is currently locked and undergoing calibration.',
            },
          })
        );
      } else {
        window.dispatchEvent(new CustomEvent('game:sfx', { detail: 'unlock' }));
        window.dispatchEvent(
          new CustomEvent('game:action', {
            detail: {
              actionType: this.activeZone.actionType,
              data: this.activeZone.data,
            },
          })
        );
      }
    }
  }
}
