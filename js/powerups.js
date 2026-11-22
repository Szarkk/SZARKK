/* =========================================================================
   STACKABLE POWER-UP CAPSULES (CYAN HOMING / RED LASER / PURPLE ARC WAVE)
   Different power-ups stack simultaneously; same type refills its gauge to 100%.
   Capsules float randomly inside the mid-arena and are activated by shooting them.
   ========================================================================= */

import {
  CAPSULE_BOUNDS,
  CAPSULE_DROP_DELAY,
  COLORS,
  CYAN_POWERUP_START_SECTOR,
  CYAN_POWERUP_START_WAVE,
  LOGICAL_H,
  LOGICAL_W,
  POWERUP_MAX_ENERGY,
  PURPLE_POWERUP_START_SECTOR,
  RED_POWERUP_START_SECTOR
} from './config.js';
import { clamp } from './utils.js';

export function createPowerupState() {
  return {
    slots: {
      CYAN: 0,
      RED: 0,
      PURPLE: 0
    },
    order: [] // Active distinct power-up types in collection order
  };
}

export function createArcWaveState() {
  return {
    phase: 'IDLE', // IDLE | READY | ACTIVE | CANNON_READY | CANNON_CHARGING
    wavesFired: 0,
    waveTimer: 0,
    triggerGrace: 0,
    cannonTapGrace: 0,
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
  aw.cannonTapGrace = 0;
  aw.firedBulletDuringWaves = false;
  aw.cannonTimer = 0;
}

export function hasPowerup(game, type) {
  return (game.powerup.slots[type] || 0) > 0;
}

export function getActivePowerups(game) {
  const awPhase = game.arcWaveState.phase;
  return game.powerup.order.filter((type) => {
    if (type === 'PURPLE' && (awPhase === 'CANNON_READY' || awPhase === 'CANNON_CHARGING')) return true;
    return (game.powerup.slots[type] || 0) > 0;
  });
}

export function clearActivePowerup(game) {
  game.powerup.slots.CYAN = 0;
  game.powerup.slots.RED = 0;
  game.powerup.slots.PURPLE = 0;
  game.powerup.order = [];
  resetArcWaveState(game);
  game.arcWaveState.auraFade = 0;
  game.redLaserActive = false;
  game.redLaserPulseTimer = 0;
  game.activeLaserBeams = [];
}

export function removePowerupSlot(game, type, silent = false) {
  game.powerup.slots[type] = 0;
  game.powerup.order = game.powerup.order.filter(t => t !== type);

  if (type === 'RED') {
    game.redLaserActive = false;
    game.redLaserPulseTimer = 0;
    game.activeLaserBeams = [];
  } else if (type === 'PURPLE') {
    resetArcWaveState(game);
  }

  if (!silent) {
    const remaining = getActivePowerups(game);
    if (remaining.length === 0) {
      game.spawnPopup(game.player.x, game.player.y - 28, 'STANDARD PULSE RESTORED', COLORS.white, 1.1);
    } else {
      const label = type === 'CYAN' ? 'HOMING EMPTY' : (type === 'RED' ? 'LASER EMPTY' : 'ARC WAVE EMPTY');
      const col = type === 'CYAN' ? COLORS.cyan : (type === 'RED' ? COLORS.aresRed : COLORS.purpleBright);
      game.spawnPopup(game.player.x, game.player.y - 28, label, col, 0.95);
    }
  }
}

export function consumePowerupEnergy(game, type, amount) {
  if (!hasPowerup(game, type)) return false;
  game.powerup.slots[type] = Math.max(0, game.powerup.slots[type] - amount);
  if (game.powerup.slots[type] <= 0.001) {
    game.powerup.slots[type] = 0;
    if (type !== 'PURPLE') {
      removePowerupSlot(game, type, false);
    }
    return true;
  }
  return false;
}

export function getUnlockedCapsuleTypes(effSec, waveNum = 1, hardMode = false, inChallenge = false) {
  if (hardMode || effSec >= PURPLE_POWERUP_START_SECTOR) {
    return ['CYAN', 'RED', 'PURPLE'];
  }
  if (effSec >= RED_POWERUP_START_SECTOR) {
    return ['CYAN', 'RED'];
  }
  if (
    effSec >= CYAN_POWERUP_START_SECTOR &&
    (inChallenge || effSec > CYAN_POWERUP_START_SECTOR || waveNum >= CYAN_POWERUP_START_WAVE)
  ) {
    return ['CYAN'];
  }
  return [];
}

export function pickRandomCapsuleType(effSec, waveNum = 4, hardMode = false, inChallenge = false) {
  const pool = getUnlockedCapsuleTypes(effSec, waveNum, hardMode, inChallenge);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function rollEnemyCapsuleDrop(game, enemy) {
  const effSec = game.getEffectiveSector ? game.getEffectiveSector() : game.sector;
  const unlocked = getUnlockedCapsuleTypes(effSec, game.sectorWave || 1, game.hardMode, game.isChallengeStage);
  if (unlocked.length === 0) return;

  const allowCyan = unlocked.includes('CYAN');
  const allowRed = unlocked.includes('RED');
  const allowPurple = unlocked.includes('PURPLE');
  const drops = [];

  if (enemy.type === 'MASTER_LEGACY_REC') {
    // Master Legacy Recognizer: Independent rolls — 50% Cyan, 10% Red, 30% Purple (Sec 04+)
    if (allowCyan && Math.random() < 0.50) drops.push('CYAN');
    if (allowRed && Math.random() < 0.10) drops.push('RED');
    if (allowPurple && Math.random() < 0.30) drops.push('PURPLE');
  } else if (enemy.type === 'MASTER_ARES_REC') {
    // Master Ares Recognizer: Independent rolls — 50% Red, 10% Cyan, 30% Purple (Sec 04+)
    if (allowRed && Math.random() < 0.50) drops.push('RED');
    if (allowCyan && Math.random() < 0.10) drops.push('CYAN');
    if (allowPurple && Math.random() < 0.30) drops.push('PURPLE');
  } else if (enemy.type === 'LEGACY_REC') {
    // Elite Legacy Recognizer: Cyan 10%, Red 2% (Sec 03+), Purple 2% (Sec 04+)
    const r = Math.random();
    if (allowCyan && r < 0.10) drops.push('CYAN');
    else if (allowRed && r < 0.12) drops.push('RED');
    else if (allowPurple && r < 0.14) drops.push('PURPLE');
  } else if (enemy.type === 'ARES_REC') {
    // Elite Ares Recognizer: Red 10%, Cyan 2%, Purple 2% (Sec 04+)
    const r = Math.random();
    if (allowRed && r < 0.10) drops.push('RED');
    else if (allowCyan && r < 0.12) drops.push('CYAN');
    else if (allowPurple && r < 0.14) drops.push('PURPLE');
  } else if (enemy.type === 'CLASSIC_REC') {
    // Classic Recognizers: 1% total drop chance
    if (Math.random() < 0.01) {
      const picked = pickRandomCapsuleType(effSec, game.sectorWave || 1, game.hardMode, game.isChallengeStage);
      if (picked) drops.push(picked);
    }
  } else {
    // Normal ships (Bit-Drones, Grid-Interceptors): 0.1% drop chance
    if (Math.random() < 0.001) {
      const picked = pickRandomCapsuleType(effSec, game.sectorWave || 1, game.hardMode, game.isChallengeStage);
      if (picked) drops.push(picked);
    }
  }

  drops.forEach((dropType, idx) => {
    const spreadX = drops.length > 1 ? (idx - (drops.length - 1) * 0.5) * 32 : 0;
    // Materializes 1.0 second after enemy is destroyed
    game.pendingCapsuleDrops.push({
      x: clamp(enemy.x + spreadX, 42, LOGICAL_W - 42),
      y: clamp(enemy.y, 60, LOGICAL_H - 120),
      type: dropType,
      timer: CAPSULE_DROP_DELAY + idx * 0.12
    });
  });
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
      driftClock: 0,
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
      driftClock: 0,
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
  const activeBefore = getActivePowerups(game);
  const alreadyHasSame = activeBefore.includes(cap.type);
  const isStacking = !alreadyHasSame && activeBefore.length > 0;

  game.synth.playPowerupPickup(cap.type);
  const col = cap.type === 'CYAN' ? COLORS.cyan : (cap.type === 'PURPLE' ? COLORS.purple : COLORS.aresRed);
  game.spawnDerez(cap.x, cap.y, col, 16, 150);

  if (!game.powerup.order.includes(cap.type)) {
    game.powerup.order.push(cap.type);
  }
  game.powerup.slots[cap.type] = POWERUP_MAX_ENERGY;

  if (cap.type === 'PURPLE') {
    game.arcWaveState.phase = 'READY';
    game.arcWaveState.wavesFired = 0;
    game.arcWaveState.waveTimer = 0;
    game.arcWaveState.triggerGrace = 0;
    game.arcWaveState.cannonTapGrace = 0;
    game.arcWaveState.firedBulletDuringWaves = false;
    game.arcWaveState.cannonTimer = 0;
    const label = alreadyHasSame
      ? 'ARC WAVE RECHARGED!'
      : (isStacking ? 'STACKED // ARC WAVE!' : 'ARC WAVE CHARGED!');
    game.spawnPopup(game.player.x, game.player.y - 34, label, COLORS.purpleBright, 1.4);
  } else if (cap.type === 'CYAN') {
    const label = alreadyHasSame
      ? 'HOMING RECHARGED 100%'
      : (isStacking ? 'STACKED // HOMING!' : 'HOMING MISSILES!');
    game.spawnPopup(game.player.x, game.player.y - 34, label, col, 1.35);
  } else {
    const label = alreadyHasSame
      ? 'LASER RECHARGED 100%'
      : (isStacking ? 'STACKED // LASER!' : 'CONTINUOUS LASER!');
    game.spawnPopup(game.player.x, game.player.y - 34, label, col, 1.35);
  }

  game.updateStatusPills();
}

export function updatePowerupTimers(_game, _dt) {
  // Power-ups are gauge-based and conserved until manually fired (or AUTO:ON).
}

export function updatePowerupCapsules(game, dt) {
  const inTransition =
    game.sectorPhase === 'BANNER' ||
    game.sectorPhase === 'CHALLENGE_BANNER' ||
    game.sectorPhase === 'CLEARED';

  // 1) Process 50% per-wave Floating Capsule spawn (Sec 02 W3+: Cyan; Sec 03: Cyan/Red; Sec 04+/Hard: All 3)
  if (
    game.floatingCapsulePlan &&
    !game.floatingCapsulePlan.spawned &&
    game.sectorPhase === 'COMBAT'
  ) {
    game.floatingCapsulePlan.timer -= dt;
    if (game.floatingCapsulePlan.timer <= 0) {
      game.floatingCapsulePlan.spawned = true;
      const effSec = game.getEffectiveSector ? game.getEffectiveSector() : game.sector;
      const type = pickRandomCapsuleType(effSec, game.sectorWave || 1, game.hardMode, game.isChallengeStage);
      if (type) {
        spawnCapsule(game, 0, 0, type, 'FLOAT');
      }
    }
  }

  // 2) Process 1-second delayed drops from destroyed enemies (paused during sector banners so none are lost)
  if (!inTransition) {
    for (let i = game.pendingCapsuleDrops.length - 1; i >= 0; i--) {
      const pend = game.pendingCapsuleDrops[i];
      pend.timer -= dt;
      if (pend.timer <= 0) {
        spawnCapsule(game, pend.x, pend.y, pend.type, 'DROP');
        game.pendingCapsuleDrops.splice(i, 1);
      }
    }
  }

  // 3) Update active capsules floating randomly in the mid-arena (persist across sector transitions!)
  const { minX, maxX, minY, maxY } = CAPSULE_BOUNDS;

  for (let i = game.capsules.length - 1; i >= 0; i--) {
    const cap = game.capsules[i];
    cap.driftClock = (cap.driftClock || 0) + dt;
    // Pause despawn aging during CLEARED / BANNER screens so capsules never expire during sector transitions
    if (!inTransition) {
      cap.age += dt;
      if (cap.age >= cap.maxLife) {
        game.capsules.splice(i, 1);
        continue;
      }
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
      cap.y += (cap.vy + Math.sin(cap.driftClock * 3.4) * 10) * dt;

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
      cap.y += (cap.vy + Math.sin(cap.driftClock * 3.4) * 14) * dt;

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
