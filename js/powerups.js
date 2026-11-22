/* =========================================================================
   POWER-UP CAPSULES (CYAN HOMING / RED LASER / PURPLE ARC WAVE)
   Capsules float randomly inside the mid-arena and are activated by shooting them.
   ========================================================================= */

import {
  CAPSULE_BOUNDS,
  CAPSULE_DROP_DELAY,
  COLORS,
  LOGICAL_H,
  LOGICAL_W,
  POWERUP_DURATION,
  POWERUP_START_SECTOR,
  PURPLE_POWERUP_START_SECTOR
} from './config.js';
import { clamp } from './utils.js';

export function createPowerupState() {
  return {
    type: null, // null | 'CYAN' | 'RED' | 'PURPLE'
    timer: 0,
    maxTimer: POWERUP_DURATION
  };
}

export function createArcWaveState() {
  return {
    phase: 'IDLE', // IDLE | READY | ACTIVE | FINISHING | CANNON_AURA
    wavesFired: 0,
    waveTimer: 0,
    triggerGrace: 0,
    firedBulletDuringWaves: false,
    cannonTimer: 0,
    auraFade: 0
  };
}

export function resetArcWaveState(game) {
  const aw = game.arcWaveState;
  aw.phase = 'IDLE';
  aw.wavesFired = 0;
  aw.waveTimer = 0;
  aw.triggerGrace = 0;
  aw.firedBulletDuringWaves = false;
  aw.cannonTimer = 0;
}

export function pickRandomCapsuleType(sector) {
  const pool = sector >= PURPLE_POWERUP_START_SECTOR
    ? ['CYAN', 'RED', 'PURPLE']
    : ['CYAN', 'RED'];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function rollEnemyCapsuleDrop(game, enemy) {
  // Strictly NO power-ups before Sector 05 (Sectors 01-03 + Ch.1 Sec 04 have none)
  if (game.sector < POWERUP_START_SECTOR) return;

  const allowPurple = game.sector >= PURPLE_POWERUP_START_SECTOR;
  const r = Math.random();
  let dropType = null;

  if (enemy.type === 'LEGACY_REC') {
    // Legacy Recognizer: Cyan 10%, Red 2%, Purple 2% (Sector 07+)
    if (r < 0.10) dropType = 'CYAN';
    else if (r < 0.12) dropType = 'RED';
    else if (allowPurple && r < 0.14) dropType = 'PURPLE';
  } else if (enemy.type === 'ARES_REC') {
    // Ares Recognizer: Red 10%, Cyan 2%, Purple 2% (Sector 07+)
    if (r < 0.10) dropType = 'RED';
    else if (r < 0.12) dropType = 'CYAN';
    else if (allowPurple && r < 0.14) dropType = 'PURPLE';
  } else if (enemy.type === 'CLASSIC_REC') {
    // Classic Recognizers: 1% total drop chance
    if (r < 0.01) dropType = pickRandomCapsuleType(game.sector);
  } else {
    // Normal ships (Bit-Drones, Grid-Interceptors): 0.1% drop chance
    if (r < 0.001) dropType = pickRandomCapsuleType(game.sector);
  }

  if (dropType) {
    // Materializes 1.0 second after enemy is destroyed
    game.pendingCapsuleDrops.push({
      x: clamp(enemy.x, 34, LOGICAL_W - 34),
      y: clamp(enemy.y, 60, LOGICAL_H - 120),
      type: dropType,
      timer: CAPSULE_DROP_DELAY
    });
  }
}

export function spawnCapsule(game, x, y, type, mode = 'DROP') {
  game.synth.playCapsuleSpawn();
  const col = type === 'CYAN' ? COLORS.cyan : (type === 'PURPLE' ? COLORS.purple : COLORS.aresRed);
  const { minX, maxX, minY, maxY } = CAPSULE_BOUNDS;
  const targetX = minX + Math.random() * (maxX - minX);
  const targetY = minY + Math.random() * (maxY - minY);

  if (mode === 'FLOAT') {
    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft ? -18 : LOGICAL_W + 18;
    const startY = minY + 24 + Math.random() * (maxY - minY - 48);
    const dx = targetX - startX;
    const dy = targetY - startY;
    const d = Math.max(1, Math.hypot(dx, dy));
    game.capsules.push({
      type,
      mode: 'FLOAT',
      x: startX,
      y: startY,
      vx: (dx / d) * 105,
      vy: (dy / d) * 105,
      targetX,
      targetY,
      enteredArena: false,
      wanderTimer: 1.0 + Math.random() * 0.9,
      age: 0,
      maxLife: 16.0,
      hitRadius: 21
    });

    const driftLabel = type === 'CYAN'
      ? 'CYAN CAPSULE — SHOOT!'
      : (type === 'PURPLE' ? 'PURPLE CAPSULE — SHOOT!' : 'RED CAPSULE — SHOOT!');
    game.spawnPopup(LOGICAL_W * 0.5, startY - 26, driftLabel, col, 1.35);
  } else {
    const startX = clamp(x, 66, LOGICAL_W - 66);
    const startY = clamp(y, 130, maxY);
    const alreadyInArena = startX >= minX && startX <= maxX && startY >= minY && startY <= maxY;
    const randAngle = Math.random() * Math.PI * 2;
    const driftSpd = 52 + Math.random() * 28;
    const dx = targetX - startX;
    const dy = targetY - startY;
    const d = Math.max(1, Math.hypot(dx, dy));

    game.capsules.push({
      type,
      mode: 'DROP',
      x: startX,
      y: startY,
      vx: alreadyInArena ? Math.cos(randAngle) * driftSpd : (dx / d) * 105,
      vy: alreadyInArena ? Math.sin(randAngle) * driftSpd : (dy / d) * 105,
      targetX,
      targetY,
      enteredArena: alreadyInArena,
      wanderTimer: 0.9 + Math.random() * 1.1,
      age: 0,
      maxLife: 15.0,
      hitRadius: 21
    });
    game.spawnDerez(startX, startY, col, 8, 90);
  }
}

export function destroyAndCollectCapsule(game, capIdx) {
  const cap = game.capsules[capIdx];
  if (!cap) return;
  game.capsules.splice(capIdx, 1);
  const col = cap.type === 'CYAN' ? COLORS.cyan : (cap.type === 'PURPLE' ? COLORS.purple : COLORS.aresRed);
  game.spawnDerez(cap.x, cap.y, col, 14, 150);
  collectCapsule(game, cap);
}

export function collectCapsule(game, cap) {
  const sameType = game.powerup.type === cap.type && (
    cap.type === 'PURPLE' ? game.arcWaveState.phase !== 'IDLE' : game.powerup.timer > 0
  );

  game.synth.playPowerupPickup(cap.type);
  const col = cap.type === 'CYAN' ? COLORS.cyan : (cap.type === 'PURPLE' ? COLORS.purple : COLORS.aresRed);
  game.spawnDerez(cap.x, cap.y, col, 16, 150);

  if (cap.type === 'PURPLE') {
    game.powerup.type = 'PURPLE';
    game.powerup.timer = 0;
    game.redLaserActive = false;
    game.redLaserPulseTimer = 0;
    game.activeLaserBeams = [];
    game.arcWaveState.phase = 'READY';
    game.arcWaveState.wavesFired = 0;
    game.arcWaveState.waveTimer = 0;
    game.arcWaveState.triggerGrace = 0;
    game.arcWaveState.firedBulletDuringWaves = false;
    game.arcWaveState.cannonTimer = 0;
    game.spawnPopup(
      game.player.x,
      game.player.y - 34,
      sameType ? 'ARC WAVE RESET!' : 'ARC WAVE READY!',
      COLORS.purpleBright,
      1.4
    );
  } else {
    resetArcWaveState(game);
    game.powerup.type = cap.type;
    game.powerup.timer = POWERUP_DURATION;
    game.powerup.maxTimer = POWERUP_DURATION;
    if (cap.type !== 'RED') {
      game.redLaserActive = false;
      game.redLaserPulseTimer = 0;
      game.activeLaserBeams = [];
    }

    const label = sameType
      ? (cap.type === 'CYAN' ? 'HOMING RESET 6.0S' : 'LASER RESET 6.0S')
      : (cap.type === 'CYAN' ? 'HOMING MISSILES!' : 'CONTINUOUS LASER!');
    game.spawnPopup(game.player.x, game.player.y - 34, label, col, 1.35);
  }
  game.updateStatusPills();
}

export function updatePowerupTimers(game, dt) {
  if ((game.powerup.type === 'CYAN' || game.powerup.type === 'RED') && game.powerup.timer > 0) {
    game.powerup.timer = Math.max(0, game.powerup.timer - dt);
    if (game.powerup.timer <= 0) {
      game.spawnPopup(game.player.x, game.player.y - 28, 'STANDARD PULSE RESTORED', COLORS.cyan, 1.1);
      game.powerup.type = null;
      game.redLaserActive = false;
      game.redLaserPulseTimer = 0;
      game.activeLaserBeams = [];
    }
  }
}

export function updatePowerupCapsules(game, dt) {
  // 1) Process 50% per-sector Floating Capsule spawn (Sector 05+; Purple from Sector 07+)
  if (
    game.floatingCapsulePlan &&
    !game.floatingCapsulePlan.spawned &&
    (game.sectorPhase === 'COMBAT' || game.sectorPhase === 'CHALLENGE')
  ) {
    game.floatingCapsulePlan.timer -= dt;
    if (game.floatingCapsulePlan.timer <= 0) {
      game.floatingCapsulePlan.spawned = true;
      const type = pickRandomCapsuleType(game.sector);
      spawnCapsule(game, 0, 0, type, 'FLOAT');
    }
  }

  // 2) Process 1-second delayed drops from destroyed enemies
  for (let i = game.pendingCapsuleDrops.length - 1; i >= 0; i--) {
    const pend = game.pendingCapsuleDrops[i];
    pend.timer -= dt;
    if (pend.timer <= 0) {
      spawnCapsule(game, pend.x, pend.y, pend.type, 'DROP');
      game.pendingCapsuleDrops.splice(i, 1);
    }
  }

  // 3) Update active capsules floating randomly in the mid-arena (shoot-only activation)
  const { minX, maxX, minY, maxY } = CAPSULE_BOUNDS;

  for (let i = game.capsules.length - 1; i >= 0; i--) {
    const cap = game.capsules[i];
    cap.age += dt;
    if (cap.age >= cap.maxLife) {
      game.capsules.splice(i, 1);
      continue;
    }

    if (!cap.enteredArena) {
      const dx = cap.targetX - cap.x;
      const dy = cap.targetY - cap.y;
      const d = Math.hypot(dx, dy);
      if (d > 1) {
        cap.vx = (dx / d) * 105;
        cap.vy = (dy / d) * 105;
      }
      cap.x += cap.vx * dt;
      cap.y += (cap.vy + Math.sin(cap.age * 3.4) * 10) * dt;

      if (cap.x >= minX && cap.x <= maxX && cap.y >= minY && cap.y <= maxY) {
        cap.enteredArena = true;
        cap.wanderTimer = 0.25;
      }
    } else {
      cap.wanderTimer -= dt;
      if (cap.wanderTimer <= 0) {
        cap.wanderTimer = 1.3 + Math.random() * 1.3;
        const tx = minX + Math.random() * (maxX - minX);
        const ty = minY + Math.random() * (maxY - minY);
        const dx = tx - cap.x;
        const dy = ty - cap.y;
        const d = Math.max(1, Math.hypot(dx, dy));
        const spd = 46 + Math.random() * 34;
        cap.vx = (dx / d) * spd;
        cap.vy = (dy / d) * spd;
      }

      cap.x += cap.vx * dt;
      cap.y += (cap.vy + Math.sin(cap.age * 3.4) * 14) * dt;

      if (cap.x < minX) {
        cap.x = minX;
        cap.vx = Math.abs(cap.vx);
      } else if (cap.x > maxX) {
        cap.x = maxX;
        cap.vx = -Math.abs(cap.vx);
      }
      if (cap.y < minY) {
        cap.y = minY;
        cap.vy = Math.abs(cap.vy);
      } else if (cap.y > maxY) {
        cap.y = maxY;
        cap.vy = -Math.abs(cap.vy);
      }
    }
  }
}
