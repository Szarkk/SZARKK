/* =========================================================================
   PLAYER FIGHTER STATE, MOVEMENT, WEAPON FIRING & DAMAGE/DEBUFFS
   ========================================================================= */

import {
  ARC_WAVE_INTERVAL,
  COLORS,
  FIRE_COOLDOWN,
  LOGICAL_H,
  LOGICAL_W,
  PLAYER_BULLET_SPEED,
  PLAYER_SPEED,
  PURPLE_FIRE_SPEED_MULT
} from './config.js';
import { clamp } from './utils.js';
import { resetArcWaveState } from './powerups.js';
import { fireHomingMissiles, spawnArcWaveFromPlayer } from './projectiles.js';

export function createPlayerState() {
  return {
    x: LOGICAL_W * 0.5,
    y: LOGICAL_H - 54,
    dual: false,
    alive: true,
    respawnTimer: 0,
    invulnTimer: 0,
    fireCooldown: 0,
    slowTimer: 0,
    slowMax: 4.0,
    dmgDebuffTimer: 0,
    dmgDebuffMax: 4.0,
    capturedById: null
  };
}

export function clampPlayerX(game) {
  const margin = game.player.dual ? 34 : 20;
  game.player.x = clamp(game.player.x, margin, LOGICAL_W - margin);
}

export function firePlayerWeapon(game) {
  const p = game.player;
  if (!p.alive || p.capturedById) return;

  const weakened = p.dmgDebuffTimer > 0;
  const baseDmg = weakened ? 0.8 : 1.0;
  const shipOffsets = p.dual ? [-14, 14] : [0];

  if (game.powerup.type === 'PURPLE') {
    const aw = game.arcWaveState;
    if (aw.phase === 'READY') {
      aw.phase = 'ACTIVE';
      aw.wavesFired = 1;
      aw.waveTimer = ARC_WAVE_INTERVAL;
      aw.triggerGrace = 0.28;
      aw.firedBulletDuringWaves = false;
      p.fireCooldown = FIRE_COOLDOWN / PURPLE_FIRE_SPEED_MULT;
      spawnArcWaveFromPlayer(game);
      game.spawnPopup(p.x, p.y - 32, 'ARC WAVE 1/3', COLORS.purpleBright, 0.95);
      return;
    }

    if (aw.phase === 'ACTIVE' && aw.triggerGrace > 0) {
      return;
    }

    if (aw.phase === 'CANNON_AURA') {
      return;
    }

    if (aw.phase === 'ACTIVE' || aw.phase === 'FINISHING') {
      if (aw.phase === 'ACTIVE') aw.firedBulletDuringWaves = true;
      p.fireCooldown = FIRE_COOLDOWN / PURPLE_FIRE_SPEED_MULT;
      for (const ox of shipOffsets) {
        game.playerBullets.push({
          x: p.x + ox,
          y: p.y - 16,
          vy: -PLAYER_BULLET_SPEED * PURPLE_FIRE_SPEED_MULT,
          dmg: baseDmg,
          weakened,
          purple: true,
          slowedByLegacy: false
        });
        game.shotsFired++;
      }
      game.synth.playPurpleBullet(weakened);
      return;
    }
  }

  p.fireCooldown = FIRE_COOLDOWN;

  if (game.powerup.type === 'CYAN' && game.powerup.timer > 0) {
    fireHomingMissiles(game, shipOffsets, baseDmg, weakened);
  } else if (game.powerup.type === 'RED' && game.powerup.timer > 0) {
    // Red Continuous Laser runs every frame in updateContinuousLaserBeams()
    return;
  } else {
    for (const ox of shipOffsets) {
      game.playerBullets.push({
        x: p.x + ox,
        y: p.y - 16,
        vy: -PLAYER_BULLET_SPEED,
        dmg: baseDmg,
        weakened,
        purple: false,
        slowedByLegacy: false
      });
      game.shotsFired++;
    }
    game.synth.playLaser(weakened);
  }
}

export function damagePlayer(game) {
  const p = game.player;
  if (!p.alive || p.invulnTimer > 0) return;

  if (p.dual) {
    p.dual = false;
    p.invulnTimer = 1.6;
    game.activeLaserBeams = [];
    game.shake = 0.24;
    game.spawnDerez(p.x + 14, p.y, COLORS.cyan, 20, 180);
    game.spawnPopup(p.x, p.y - 24, 'WINGMAN DEREZZED', COLORS.amber, 1.2);
    game.synth.playDerez(true);
    return;
  }

  p.alive = false;
  p.respawnTimer = 1.75;
  p.slowTimer = 0;
  p.dmgDebuffTimer = 0;
  game.powerup.type = null;
  game.powerup.timer = 0;
  resetArcWaveState(game);
  game.arcWaveState.auraFade = 0;
  game.redLaserActive = false;
  game.redLaserPulseTimer = 0;
  game.activeLaserBeams = [];

  game.lives--;
  game.shake = 0.34;
  game.hitStop = 0.05;
  game.spawnDerez(p.x, p.y, COLORS.cyan, 30, 225);
  game.synth.playDerez(true);
  game.updateHUD();
  game.updateStatusPills();

  if (game.lives <= 0) {
    game.gameOverTimer = 1.05;
  }
}

export function applyRibbonDebuff(game, variant) {
  const p = game.player;
  if (!p.alive) return;
  if (variant === 'LEGACY') {
    if (p.slowTimer < 3.6) {
      game.synth.playDebuff(false);
      game.spawnPopup(p.x, p.y - 26, 'STASIS SLOW 4.0S', COLORS.cyan, 1.15);
    }
    p.slowTimer = 4.0;
    p.slowMax = 4.0;
  } else {
    if (p.dmgDebuffTimer < 3.6) {
      game.synth.playDebuff(true);
      game.spawnPopup(p.x, p.y - 26, '-20% DMG 4.0S', COLORS.aresRed, 1.15);
    }
    p.slowTimer = Math.max(p.slowTimer, 1.0);
    if (p.slowMax < 1.0 || p.slowTimer <= 1.0) p.slowMax = 1.0;
    p.dmgDebuffTimer = 4.0;
    p.dmgDebuffMax = 4.0;
  }
}

export function updatePlayer(game, dt) {
  const p = game.player;
  if (!p.alive && game.lives > 0) {
    p.respawnTimer -= dt;
    if (p.respawnTimer <= 0) {
      p.alive = true;
      p.x = LOGICAL_W * 0.5;
      p.invulnTimer = 2.0;
    }
  }
  if (p.invulnTimer > 0) p.invulnTimer = Math.max(0, p.invulnTimer - dt);
  if (p.slowTimer > 0) p.slowTimer = Math.max(0, p.slowTimer - dt);
  if (p.dmgDebuffTimer > 0) p.dmgDebuffTimer = Math.max(0, p.dmgDebuffTimer - dt);
  if (p.fireCooldown > 0) p.fireCooldown = Math.max(0, p.fireCooldown - dt);
  if (game.tapFireBuffer > 0) game.tapFireBuffer = Math.max(0, game.tapFireBuffer - dt);

  if (!p.alive || p.capturedById) {
    game.redLaserActive = false;
    game.activeLaserBeams = [];
    return;
  }

  // Keyboard & Directional Pads
  let move = 0;
  if (game.keys.has('ArrowLeft') || game.keys.has('KeyA')) move -= 1;
  if (game.keys.has('ArrowRight') || game.keys.has('KeyD')) move += 1;
  for (const d of game.dirPointerMap.values()) {
    if (d === 'LEFT') move -= 1;
    if (d === 'RIGHT') move += 1;
  }
  move = clamp(move, -1, 1);

  if (move !== 0) {
    const slowMult = p.slowTimer > 0 ? 0.45 : 1.0;
    p.x += move * PLAYER_SPEED * slowMult * dt;
    clampPlayerX(game);
  }

  // Update Drag Trackpad thumb indicator
  if (game.dragThumb) {
    const pct = clamp((p.x / LOGICAL_W) * 100, 7, 93);
    game.dragThumb.style.left = `${pct}%`;
  }

  // Firing check (Uncapped cooldown + Hold-to-fire + Tap buffer + Explicit Auto-Fire)
  const manualHold =
    game.keys.has('Space') ||
    game.keys.has('KeyZ') ||
    game.firePointerIds.size > 0;
  const autoActive = game.autoFire && (game.controlMode !== 'DRAG' || game.dragActive);

  if (game.powerup.type === 'RED' && game.powerup.timer > 0) {
    // True Continuous Laser: active flag updated here; raycast runs after all movement
    if (game.tapFireBuffer > 0) {
      game.redLaserPulseTimer = Math.max(game.redLaserPulseTimer, FIRE_COOLDOWN);
      game.tapFireBuffer = 0;
    }
    if (manualHold || autoActive) {
      game.redLaserActive = true;
    } else if (game.redLaserPulseTimer > 0) {
      game.redLaserPulseTimer = Math.max(0, game.redLaserPulseTimer - dt);
      game.redLaserActive = game.redLaserPulseTimer > 0;
    } else {
      game.redLaserActive = false;
    }
  } else {
    game.redLaserActive = false;
    game.activeLaserBeams = [];
    if ((manualHold || autoActive || game.tapFireBuffer > 0) && p.fireCooldown <= 0) {
      firePlayerWeapon(game);
      game.tapFireBuffer = 0;
    }
  }
}
