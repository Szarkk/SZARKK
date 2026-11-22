/* =========================================================================
   PROJECTILES: BULLETS, CYAN HOMING MISSILES, RED LASER BEAM & PURPLE ARC WAVES
   ========================================================================= */

import {
  ARC_WAVE_INTERVAL,
  ARC_WAVE_MAX,
  ARC_WAVE_SPEED,
  CANNON_AOE_RADIUS,
  CANNON_SHOT_SPEED,
  COLORS,
  FIRE_COOLDOWN,
  HOMING_MISSILE_SPEED,
  LOGICAL_H,
  LOGICAL_W
} from './config.js';
import { clamp, distToSeg, lerp, verticalRaySegIntersectY } from './utils.js';
import { destroyAndCollectCapsule, resetArcWaveState } from './powerups.js';
import { damageLightwing, shatterRibbonTrail } from './recognizers.js';
import { damageEnemy } from './enemies.js';

export function spawnArcWaveFromPlayer(game) {
  const p = game.player;
  if (!p.alive || p.capturedById) return;
  const weakened = p.dmgDebuffTimer > 0;
  const baseDmg = weakened ? 0.8 : 1.0;

  game.arcWaves.push({
    x: p.x,
    y: p.y - 20,
    vy: -ARC_WAVE_SPEED,
    radius: p.dual ? 52 : 42,
    maxRadius: p.dual ? 72 : 58,
    dmg: baseDmg,
    weakened,
    hitEnemyIds: new Set(),
    hitLightwings: new Set(),
    hitRibbonIds: new Set()
  });
  game.synth.playArcWave();
}

export function fireCannonShot(game) {
  const p = game.player;
  if (!p.alive || p.capturedById) return;
  const weakened = p.dmgDebuffTimer > 0;
  const baseDmg = weakened ? 0.8 : 1.0;

  game.cannonShots.push({
    x: p.x,
    y: p.y - 24,
    vy: -CANNON_SHOT_SPEED,
    dmg: baseDmg * 4.0,
    radius: 13,
    aoeRadius: CANNON_AOE_RADIUS,
    trail: []
  });
  game.shotsFired++;
  game.shake = 0.16;
  game.synth.playArcWave();
  game.spawnPopup(p.x, p.y - 36, 'CANNON SHOT!', COLORS.purpleBright, 1.2);
}

export function detonateCannonShot(game, x, y, dmg, aoeRadius) {
  game.aoeBlasts.push({
    x,
    y,
    radius: 14,
    maxRadius: aoeRadius,
    life: 0.48,
    maxLife: 0.48
  });
  game.shake = 0.34;
  game.hitStop = 0.04;
  game.synth.playCannonBoom();
  game.spawnDerez(x, y, COLORS.purpleBright, 34, 260);
  game.spawnDerez(x, y, COLORS.purple, 22, 195);

  // Void all enemy projectiles inside the AOE blast
  for (let i = game.enemyBullets.length - 1; i >= 0; i--) {
    const eb = game.enemyBullets[i];
    if (Math.hypot(eb.x - x, eb.y - y) <= aoeRadius) {
      game.spawnDerez(eb.x, eb.y, COLORS.purpleBright, 4, 80);
      game.enemyBullets.splice(i, 1);
    }
  }

  // Shatter any Light Ribbon trails caught inside the AOE blast
  for (let ti = game.ribbonTrails.length - 1; ti >= 0; ti--) {
    const trail = game.ribbonTrails[ti];
    let inside = false;
    for (const seg of trail.segments) {
      if (distToSeg(x, y, seg.x1, seg.y1, seg.x2, seg.y2) <= aoeRadius) {
        inside = true;
        break;
      }
    }
    if (inside) {
      shatterRibbonTrail(game, ti, x, y, COLORS.purpleBright);
    }
  }

  // Damage all Lightwings inside the AOE blast
  for (let li = game.lightwings.length - 1; li >= 0; li--) {
    const lw = game.lightwings[li];
    if (Math.hypot(lw.x - x, lw.y - y) <= aoeRadius + 14) {
      game.shotsHit++;
      damageLightwing(game, li, dmg);
    }
  }

  // Damage all Enemies inside the AOE blast
  for (let ei = game.enemies.length - 1; ei >= 0; ei--) {
    const e = game.enemies[ei];
    if (Math.hypot(e.x - x, e.y - y) <= aoeRadius + e.hitRadius) {
      game.shotsHit++;
      damageEnemy(game, ei, dmg, e.x, e.y, COLORS.purpleBright);
    }
  }

  // Pop any floating capsules caught inside the AOE blast
  for (let ci = game.capsules.length - 1; ci >= 0; ci--) {
    const cap = game.capsules[ci];
    if (Math.hypot(cap.x - x, cap.y - y) <= aoeRadius + cap.hitRadius) {
      destroyAndCollectCapsule(game, ci);
    }
  }
}

/**
 * CYAN BOXED CAPSULE — Homing Missiles:
 * 2x shot count per fighter, assigns different enemies across the volley,
 * breaks Ares light ribbons in 1 hit, and deals 1.3x damage to Ares Recognizers.
 */
export function fireHomingMissiles(game, shipOffsets, baseDmg, weakened) {
  const p = game.player;
  const candidates = [];
  for (const e of game.enemies) {
    if (e.y > -24 && e.y < LOGICAL_H - 20) candidates.push({ kind: 'ENEMY', ref: e });
  }
  for (const lw of game.lightwings) {
    candidates.push({ kind: 'LIGHTWING', ref: lw });
  }
  candidates.sort((a, b) => Math.hypot(a.ref.x - p.x, a.ref.y - p.y) - Math.hypot(b.ref.x - p.x, b.ref.y - p.y));

  let targetCursor = 0;
  for (const ox of shipOffsets) {
    const pairSpread = [-1, 1];
    for (const side of pairSpread) {
      const targetObj = candidates.length > 0
        ? candidates[targetCursor % candidates.length]
        : null;
      targetCursor++;

      const startX = p.x + ox + side * 8;
      const startY = p.y - 14;
      const initAngle = -Math.PI / 2 + side * 0.34;
      game.homingMissiles.push({
        x: startX,
        y: startY,
        vx: Math.cos(initAngle) * HOMING_MISSILE_SPEED,
        vy: Math.sin(initAngle) * HOMING_MISSILE_SPEED,
        angle: initAngle,
        dmg: baseDmg,
        weakened,
        targetKind: targetObj ? targetObj.kind : null,
        targetRef: targetObj ? targetObj.ref : null,
        life: 3.0,
        trail: []
      });
      game.shotsFired++;
    }
  }
  game.synth.playMissileLaunch();
}

/**
 * RED BOXED CAPSULE — True Continuous Straight Laser Beam:
 * Evaluates EVERY frame after movement/enemies/capsules update so the beam
 * stays pixel-locked straight up from the fighter's exact nose (zero lag/chasing).
 */
export function updateContinuousLaserBeams(game) {
  const p = game.player;
  if (
    !p.alive ||
    p.capturedById ||
    game.powerup.type !== 'RED' ||
    game.powerup.timer <= 0 ||
    !game.redLaserActive
  ) {
    game.activeLaserBeams = [];
    return;
  }

  const weakened = p.dmgDebuffTimer > 0;
  const baseDmg = weakened ? 0.8 : 1.0;
  const beamDmg = baseDmg * 2.0; // 2x damage of regular bullets
  const shipOffsets = p.dual ? [-14, 14] : [0];
  const shouldDamageTick = p.fireCooldown <= 0;

  if (shouldDamageTick) {
    p.fireCooldown = FIRE_COOLDOWN; // Exact regular hitspeed
  }

  game.activeLaserBeams = [];
  let switchedAwayFromRed = false;

  for (const ox of shipOffsets) {
    const beamX = p.x + ox;
    const beamBottomY = p.y - 16;
    let stopY = 0;
    let bestHit = null; // { y, kind, idx }

    // 1) Immediately shatter Legacy cyan ribbons swept by the laser beam;
    //    check Ares crimson ribbons as solid blockers until their 3 hits are exhausted.
    for (let ti = game.ribbonTrails.length - 1; ti >= 0; ti--) {
      const trail = game.ribbonTrails[ti];
      let hitSegY = null;
      for (const seg of trail.segments) {
        const yCross = verticalRaySegIntersectY(beamX, beamBottomY, seg.x1, seg.y1, seg.x2, seg.y2);
        if (yCross !== null && (hitSegY === null || yCross > hitSegY)) {
          hitSegY = yCross;
        }
      }
      if (hitSegY !== null) {
        if (trail.variant === 'LEGACY') {
          shatterRibbonTrail(game, ti, beamX, hitSegY, COLORS.cyan);
        } else if (!bestHit || hitSegY > bestHit.y) {
          bestHit = { y: hitSegY, kind: 'ARES_RIBBON', idx: ti };
        }
      }
    }

    // 2) Check destructible mid-arena Power-Up Capsules
    for (let ci = game.capsules.length - 1; ci >= 0; ci--) {
      const cap = game.capsules[ci];
      if (cap.y <= beamBottomY && Math.abs(cap.x - beamX) <= cap.hitRadius + 4) {
        if (!bestHit || cap.y > bestHit.y) {
          bestHit = { y: cap.y, kind: 'CAPSULE', idx: ci };
        }
      }
    }

    // 3) Check Lightwings in the beam line
    for (let li = 0; li < game.lightwings.length; li++) {
      const lw = game.lightwings[li];
      if (lw.y <= beamBottomY && Math.abs(lw.x - beamX) <= 18) {
        if (!bestHit || lw.y > bestHit.y) {
          bestHit = { y: lw.y, kind: 'LIGHTWING', idx: li };
        }
      }
    }

    // 4) Check Enemies in the beam line
    for (let ei = 0; ei < game.enemies.length; ei++) {
      const e = game.enemies[ei];
      const beamHalfW = e.hitRadius + 5;
      if (e.y <= beamBottomY && Math.abs(e.x - beamX) <= beamHalfW) {
        if (!bestHit || e.y > bestHit.y) {
          bestHit = { y: e.y, kind: 'ENEMY', idx: ei };
        }
      }
    }

    if (bestHit) {
      stopY = bestHit.y;
    }

    game.activeLaserBeams.push({
      offsetX: ox,
      x: beamX,
      y1: beamBottomY,
      y2: stopY,
      weakened,
      hit: !!bestHit
    });

    // 5) Pop destructible capsule on sweep, or resolve damage on the regular hitspeed tick
    if (bestHit && bestHit.kind === 'CAPSULE') {
      const cap = game.capsules[bestHit.idx];
      if (cap) {
        const capType = cap.type;
        game.shotsHit++;
        destroyAndCollectCapsule(game, bestHit.idx);
        if (capType !== 'RED') {
          switchedAwayFromRed = true;
          break;
        }
      }
    } else if (shouldDamageTick) {
      game.shotsFired++;
      if (bestHit) {
        if (bestHit.kind === 'ARES_RIBBON') {
          const trail = game.ribbonTrails[bestHit.idx];
          if (trail) {
            trail.hitsRemaining -= 1;
            trail.flashTimer = 0.14;
            if (trail.hitsRemaining <= 0) {
              shatterRibbonTrail(game, bestHit.idx, beamX, stopY, COLORS.aresRed);
            } else {
              game.synth.playRibbonDeflect();
              game.spawnDerez(beamX, stopY, COLORS.amber, 5, 95);
            }
          }
        } else if (bestHit.kind === 'LIGHTWING') {
          const lw = game.lightwings[bestHit.idx];
          if (lw) {
            game.shotsHit++;
            damageLightwing(game, bestHit.idx, beamDmg);
          }
        } else if (bestHit.kind === 'ENEMY') {
          const e = game.enemies[bestHit.idx];
          if (e) {
            game.shotsHit++;
            // 1.3x damage bonus against Legacy Recognizers
            const finalDmg = e.type === 'LEGACY_REC' ? beamDmg * 1.3 : beamDmg;
            damageEnemy(
              game,
              bestHit.idx,
              finalDmg,
              beamX,
              stopY,
              e.type === 'LEGACY_REC' ? COLORS.aresRed : COLORS.white
            );
          }
        }
      }
    }
  }

  if (switchedAwayFromRed) {
    game.activeLaserBeams = [];
    game.redLaserActive = false;
    return;
  }

  if (shouldDamageTick) {
    game.synth.playContinuousLaserTick();
  }
}

export function updateArcWavesAndCannon(game, dt) {
  const aw = game.arcWaveState;
  if (aw.auraFade > 0) aw.auraFade = Math.max(0, aw.auraFade - dt);

  // Advance Purple Boxed Capsule 3-wave auto-fire & Purple Aura Cannon cycle
  if (game.powerup.type === 'PURPLE' && game.player.alive && !game.player.capturedById) {
    if (aw.triggerGrace > 0) aw.triggerGrace = Math.max(0, aw.triggerGrace - dt);

    if (aw.phase === 'ACTIVE') {
      aw.waveTimer -= dt;
      if (aw.waveTimer <= 0) {
        aw.wavesFired++;
        spawnArcWaveFromPlayer(game);
        if (aw.wavesFired < ARC_WAVE_MAX) {
          aw.waveTimer = ARC_WAVE_INTERVAL;
        } else if (!aw.firedBulletDuringWaves) {
          aw.phase = 'CANNON_AURA';
          aw.cannonTimer = 0.62;
          game.synth.playCannonCharge();
          game.spawnPopup(game.player.x, game.player.y - 36, 'PURPLE AURA!', COLORS.purpleBright, 1.3);
        } else {
          aw.phase = 'FINISHING';
          aw.waveTimer = 0.85;
        }
      }
    } else if (aw.phase === 'FINISHING') {
      aw.waveTimer -= dt;
      if (aw.waveTimer <= 0) {
        resetArcWaveState(game);
        game.powerup.type = null;
        game.spawnPopup(game.player.x, game.player.y - 28, 'STANDARD PULSE RESTORED', COLORS.cyan, 1.0);
      }
    } else if (aw.phase === 'CANNON_AURA') {
      aw.cannonTimer -= dt;
      if (aw.cannonTimer <= 0) {
        fireCannonShot(game);
        resetArcWaveState(game);
        aw.auraFade = 0.55;
        game.powerup.type = null;
      }
    }
  }

  // Update active Arc Waves (void enemy projectiles + regular bullet damage)
  for (let i = game.arcWaves.length - 1; i >= 0; i--) {
    const w = game.arcWaves[i];
    w.y += w.vy * dt;
    w.radius = Math.min(w.maxRadius, w.radius + 32 * dt);

    if (w.y < -50) {
      game.arcWaves.splice(i, 1);
      continue;
    }

    // 1) Void enemy projectiles on contact
    for (let bi = game.enemyBullets.length - 1; bi >= 0; bi--) {
      const eb = game.enemyBullets[bi];
      const dx = eb.x - w.x;
      const dy = eb.y - w.y;
      if (Math.abs(dx) <= w.radius + 6 && dy >= -24 && dy <= 18) {
        game.spawnDerez(eb.x, eb.y, COLORS.purpleBright, 6, 95);
        game.synth.playProjectileVoid();
        game.enemyBullets.splice(bi, 1);
      }
    }

    // 2) Chip Ares ribbons once per wave
    for (let ti = game.ribbonTrails.length - 1; ti >= 0; ti--) {
      const trail = game.ribbonTrails[ti];
      if (trail.variant !== 'ARES' || w.hitRibbonIds.has(trail.id)) continue;
      let touched = false;
      for (const seg of trail.segments) {
        if (distToSeg(w.x, w.y, seg.x1, seg.y1, seg.x2, seg.y2) <= w.radius * 0.72) {
          touched = true;
          break;
        }
      }
      if (touched) {
        w.hitRibbonIds.add(trail.id);
        trail.hitsRemaining -= 1;
        trail.flashTimer = 0.14;
        if (trail.hitsRemaining <= 0) {
          shatterRibbonTrail(game, ti, w.x, w.y, COLORS.aresRed);
        } else {
          game.synth.playRibbonDeflect();
        }
      }
    }

    // 3) Damage Lightwings
    for (let li = game.lightwings.length - 1; li >= 0; li--) {
      const lw = game.lightwings[li];
      if (w.hitLightwings.has(lw)) continue;
      if (Math.abs(lw.x - w.x) <= w.radius + 10 && Math.abs(lw.y - w.y) <= 22) {
        w.hitLightwings.add(lw);
        damageLightwing(game, li, w.dmg);
      }
    }

    // 4) Damage Enemies
    for (let ei = game.enemies.length - 1; ei >= 0; ei--) {
      const e = game.enemies[ei];
      if (w.hitEnemyIds.has(e.id)) continue;
      if (Math.abs(e.x - w.x) <= w.radius + e.hitRadius * 0.7 && Math.abs(e.y - w.y) <= e.hitRadius + 16) {
        w.hitEnemyIds.add(e.id);
        damageEnemy(game, ei, w.dmg, e.x, e.y, COLORS.purpleBright);
      }
    }

    // 5) Pop floating Power-Up Capsules swept by the Arc Wave
    for (let ci = game.capsules.length - 1; ci >= 0; ci--) {
      const cap = game.capsules[ci];
      if (Math.abs(cap.x - w.x) <= w.radius + cap.hitRadius * 0.7 && Math.abs(cap.y - w.y) <= cap.hitRadius + 16) {
        destroyAndCollectCapsule(game, ci);
      }
    }
  }

  // Update Purple Cannon Shots -> explode in large AOE on hit or upper formation
  for (let i = game.cannonShots.length - 1; i >= 0; i--) {
    const c = game.cannonShots[i];
    c.y += c.vy * dt;
    c.trail.push({ x: c.x, y: c.y });
    if (c.trail.length > 9) c.trail.shift();

    let detonated = false;
    for (const lw of game.lightwings) {
      if (Math.hypot(c.x - lw.x, c.y - lw.y) <= c.radius + 16) {
        detonated = true;
        break;
      }
    }
    if (!detonated) {
      for (const e of game.enemies) {
        if (Math.hypot(c.x - e.x, c.y - e.y) <= c.radius + e.hitRadius) {
          detonated = true;
          break;
        }
      }
    }
    if (!detonated) {
      for (const cap of game.capsules) {
        if (Math.hypot(c.x - cap.x, c.y - cap.y) <= c.radius + cap.hitRadius) {
          detonated = true;
          break;
        }
      }
    }
    if (!detonated && c.y <= 155) {
      detonated = true;
    }

    if (detonated) {
      detonateCannonShot(game, c.x, c.y, c.dmg, c.aoeRadius);
      game.cannonShots.splice(i, 1);
    } else if (c.y < -40) {
      game.cannonShots.splice(i, 1);
    }
  }

  // Update expanding AOE blast shockwaves
  for (let i = game.aoeBlasts.length - 1; i >= 0; i--) {
    const bl = game.aoeBlasts[i];
    bl.life -= dt;
    const prog = clamp(1 - bl.life / bl.maxLife, 0, 1);
    bl.radius = lerp(18, bl.maxRadius, 1 - Math.pow(1 - prog, 2.6));
    if (bl.life <= 0) game.aoeBlasts.splice(i, 1);
  }
}

export function updatePlayerBullets(game, dt) {
  for (let i = game.playerBullets.length - 1; i >= 0; i--) {
    const b = game.playerBullets[i];
    b.y += b.vy * dt;
    if (b.y < -20) {
      game.playerBullets.splice(i, 1);
      continue;
    }

    let removed = false;

    // 1) Check Light Ribbons
    for (let ti = game.ribbonTrails.length - 1; ti >= 0; ti--) {
      const trail = game.ribbonTrails[ti];
      let hitRibbon = false;
      for (const seg of trail.segments) {
        if (distToSeg(b.x, b.y, seg.x1, seg.y1, seg.x2, seg.y2) < 9) {
          hitRibbon = true;
          break;
        }
      }
      if (hitRibbon) {
        if (trail.variant === 'LEGACY') {
          if (!b.slowedByLegacy) {
            b.slowedByLegacy = true;
            b.vy *= 0.5;
            game.synth.playShotSlow();
            game.spawnDerez(b.x, b.y, COLORS.cyan, 4, 55);
          }
        } else {
          // Ares crimson ribbons block regular/purple shots (3 hits to shatter)
          trail.hitsRemaining -= 1;
          trail.flashTimer = 0.14;
          removed = true;
          if (trail.hitsRemaining <= 0) {
            shatterRibbonTrail(game, ti, b.x, b.y, COLORS.aresRed);
          } else {
            game.synth.playRibbonDeflect();
            game.spawnDerez(b.x, b.y, COLORS.amber, 5, 95);
          }
          break;
        }
      }
    }
    if (removed) {
      game.playerBullets.splice(i, 1);
      continue;
    }

    // 2) Friendly-fire against Captured Fighter (respect brief capture grace)
    if (
      game.capturedFighter &&
      game.capturedFighter.friendlyFireGrace <= 0 &&
      Math.hypot(b.x - game.capturedFighter.x, b.y - game.capturedFighter.y) < 15
    ) {
      const owner = game.enemies.find(e => e.id === game.capturedFighter.ownerId);
      if (owner) owner.hasCapturedShip = false;
      game.spawnDerez(game.capturedFighter.x, game.capturedFighter.y, COLORS.cyan, 22, 190);
      game.spawnPopup(game.capturedFighter.x, game.capturedFighter.y, 'CAPTURED SHIP DESTROYED', COLORS.aresRed, 1.3);
      game.capturedFighter = null;
      game.synth.playDerez(true);
      game.playerBullets.splice(i, 1);
      continue;
    }

    // 2b) Destructible floating Power-Up Capsules (shoot to break & activate)
    for (let ci = game.capsules.length - 1; ci >= 0; ci--) {
      const cap = game.capsules[ci];
      if (Math.hypot(b.x - cap.x, b.y - cap.y) < cap.hitRadius) {
        game.shotsHit++;
        destroyAndCollectCapsule(game, ci);
        removed = true;
        break;
      }
    }
    if (removed) {
      game.playerBullets.splice(i, 1);
      continue;
    }

    // 3) Check Lightwings
    for (let li = game.lightwings.length - 1; li >= 0; li--) {
      const lw = game.lightwings[li];
      if (Math.hypot(b.x - lw.x, b.y - lw.y) < 16) {
        game.shotsHit++;
        damageLightwing(game, li, b.dmg);
        removed = true;
        break;
      }
    }
    if (removed) {
      game.playerBullets.splice(i, 1);
      continue;
    }

    // 4) Check Enemies
    for (let ei = game.enemies.length - 1; ei >= 0; ei--) {
      const e = game.enemies[ei];
      if (Math.hypot(b.x - e.x, b.y - e.y) < e.hitRadius) {
        game.shotsHit++;
        damageEnemy(game, ei, b.dmg, b.x, b.y);
        removed = true;
        break;
      }
    }
    if (removed) {
      game.playerBullets.splice(i, 1);
    }
  }
}

export function updateHomingMissiles(game, dt) {
  for (let i = game.homingMissiles.length - 1; i >= 0; i--) {
    const m = game.homingMissiles[i];
    m.life -= dt;

    let validTarget = null;
    if (m.targetKind === 'ENEMY' && game.enemies.includes(m.targetRef)) {
      validTarget = m.targetRef;
    } else if (m.targetKind === 'LIGHTWING' && game.lightwings.includes(m.targetRef)) {
      validTarget = m.targetRef;
    } else {
      let bestD = Infinity;
      for (const e of game.enemies) {
        const d = Math.hypot(e.x - m.x, e.y - m.y);
        if (d < bestD) {
          bestD = d;
          validTarget = e;
          m.targetKind = 'ENEMY';
          m.targetRef = e;
        }
      }
      for (const lw of game.lightwings) {
        const d = Math.hypot(lw.x - m.x, lw.y - m.y);
        if (d < bestD) {
          bestD = d;
          validTarget = lw;
          m.targetKind = 'LIGHTWING';
          m.targetRef = lw;
        }
      }
    }

    if (validTarget) {
      const desired = Math.atan2(validTarget.y - m.y, validTarget.x - m.x);
      let diff = desired - m.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const maxTurn = 7.8 * dt;
      m.angle += clamp(diff, -maxTurn, maxTurn);
    }

    m.vx = Math.cos(m.angle) * HOMING_MISSILE_SPEED;
    m.vy = Math.sin(m.angle) * HOMING_MISSILE_SPEED;
    m.x += m.vx * dt;
    m.y += m.vy * dt;

    m.trail.push({ x: m.x, y: m.y });
    if (m.trail.length > 7) m.trail.shift();

    if (m.life <= 0 || m.y < -30 || m.y > LOGICAL_H + 30 || m.x < -30 || m.x > LOGICAL_W + 30) {
      game.homingMissiles.splice(i, 1);
      continue;
    }

    let removed = false;

    // 1) Breaks Ares crimson light ribbons in ONE HIT
    for (let ti = game.ribbonTrails.length - 1; ti >= 0; ti--) {
      const trail = game.ribbonTrails[ti];
      if (trail.variant !== 'ARES') continue;
      let hitAresRibbon = false;
      for (const seg of trail.segments) {
        if (distToSeg(m.x, m.y, seg.x1, seg.y1, seg.x2, seg.y2) < 11) {
          hitAresRibbon = true;
          break;
        }
      }
      if (hitAresRibbon) {
        shatterRibbonTrail(game, ti, m.x, m.y, COLORS.aresRed);
        removed = true;
        break;
      }
    }
    if (removed) {
      game.homingMissiles.splice(i, 1);
      continue;
    }

    // 2) Check Lightwings
    for (let li = game.lightwings.length - 1; li >= 0; li--) {
      const lw = game.lightwings[li];
      if (Math.hypot(m.x - lw.x, m.y - lw.y) < 18) {
        game.shotsHit++;
        damageLightwing(game, li, m.dmg);
        removed = true;
        break;
      }
    }
    if (removed) {
      game.homingMissiles.splice(i, 1);
      continue;
    }

    // 2b) Check destructible floating Power-Up Capsules
    for (let ci = game.capsules.length - 1; ci >= 0; ci--) {
      const cap = game.capsules[ci];
      if (Math.hypot(m.x - cap.x, m.y - cap.y) < cap.hitRadius) {
        game.shotsHit++;
        destroyAndCollectCapsule(game, ci);
        removed = true;
        break;
      }
    }
    if (removed) {
      game.homingMissiles.splice(i, 1);
      continue;
    }

    // 3) Check Enemies (1.3x damage bonus against Ares Recognizers)
    for (let ei = game.enemies.length - 1; ei >= 0; ei--) {
      const e = game.enemies[ei];
      if (Math.hypot(m.x - e.x, m.y - e.y) < e.hitRadius + 3) {
        game.shotsHit++;
        const finalDmg = e.type === 'ARES_REC' ? m.dmg * 1.3 : m.dmg;
        damageEnemy(game, ei, finalDmg, m.x, m.y, COLORS.cyan);
        removed = true;
        break;
      }
    }
    if (removed) {
      game.homingMissiles.splice(i, 1);
    }
  }
}

export function updateEnemyBullets(game, dt) {
  const p = game.player;
  for (let i = game.enemyBullets.length - 1; i >= 0; i--) {
    const eb = game.enemyBullets[i];
    eb.x += eb.vx * dt;
    eb.y += eb.vy * dt;
    if (eb.y > LOGICAL_H + 22 || eb.x < -22 || eb.x > LOGICAL_W + 22) {
      game.enemyBullets.splice(i, 1);
      continue;
    }
    if (p.alive && !p.capturedById && p.invulnTimer <= 0 && Math.hypot(eb.x - p.x, eb.y - p.y) < (p.dual ? 22 : 13)) {
      game.damagePlayer();
      game.enemyBullets.splice(i, 1);
    }
  }
}
