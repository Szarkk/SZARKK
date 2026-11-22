/* =========================================================================
   PROJECTILES: BULLETS, CYAN HOMING MISSILES, RED LASER BEAM & PURPLE ARC WAVES
   ========================================================================= */

import {
  ARC_WAVE_SPEED,
  CANNON_AOE_RADIUS,
  CANNON_SHOT_SPEED,
  COLORS,
  FIRE_COOLDOWN,
  HOMING_MISSILE_SPEED,
  LEGACY_RIBBON_BULLET_SLOW,
  LOGICAL_H,
  LOGICAL_W,
  PLAYER_BULLET_SPEED,
  RED_LASER_DRAIN_PER_SEC,
  SLOWED_BULLET_DISSOLVE_TIME
} from './config.js';
import { clamp, distToSeg, lerp, verticalRaySegIntersectY } from './utils.js';
import {
  consumePowerupEnergy,
  destroyAndCollectCapsule,
  hasPowerup,
  removePowerupSlot
} from './powerups.js';
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
    radius: p.dual ? 86 : 68,
    maxRadius: p.dual ? 132 : 108,
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
 * RED BOXED CAPSULE — Piercing Continuous Straight Laser Beam:
 * Shoots straight through ALL enemy ships, lightwings & capsules!
 * Stopped ONLY by Red (Ares) ribbons (chips -1/tick) or Cyan (Legacy) ribbons
 * (converts into slowed red laser-bullets that dissolve after 2.0s).
 * In Dual-Fighter mode, each individual fighter's beam evaluates and counts hits independently.
 */
export function updateContinuousLaserBeams(game, dt = 0) {
  const p = game.player;
  if (
    !p.alive ||
    p.capturedById ||
    !hasPowerup(game, 'RED') ||
    !game.redLaserActive
  ) {
    game.activeLaserBeams = [];
    return;
  }

  const weakened = p.dmgDebuffTimer > 0;
  const baseDmg = weakened ? 0.8 : 1.0;
  const beamDmg = baseDmg * 2.0; // 2x damage of regular bullets per individual fighter beam
  const shipOffsets = p.dual ? [-14, 14] : [0];
  const shouldDamageTick = p.laserTickCooldown <= 0;

  if (shouldDamageTick) {
    p.laserTickCooldown = FIRE_COOLDOWN; // Exact regular hitspeed, independent of stacked missiles
  }

  game.activeLaserBeams = [];

  for (const ox of shipOffsets) {
    const beamX = p.x + ox;
    const beamBottomY = p.y - 16;
    let stopY = 0;
    let ribbonBlock = null; // { y, kind: 'ARES_RIBBON' | 'LEGACY_RIBBON', idx, trailId }

    // 1) Find the closest Light Ribbon blocking or refracting this fighter's beam
    for (let ti = game.ribbonTrails.length - 1; ti >= 0; ti--) {
      const trail = game.ribbonTrails[ti];
      let hitSegY = null;
      for (const seg of trail.segments) {
        const yCross = verticalRaySegIntersectY(beamX, beamBottomY, seg.x1, seg.y1, seg.x2, seg.y2);
        if (yCross !== null && (hitSegY === null || yCross > hitSegY)) {
          hitSegY = yCross;
        }
      }
      if (hitSegY !== null && (!ribbonBlock || hitSegY > ribbonBlock.y)) {
        ribbonBlock = {
          y: hitSegY,
          kind: trail.variant === 'ARES' ? 'ARES_RIBBON' : 'LEGACY_RIBBON',
          idx: ti,
          trailId: trail.id
        };
      }
    }

    if (ribbonBlock) {
      stopY = ribbonBlock.y;
    }

    // 2) Pop any floating Power-Up Capsules pierced by the beam (stacks without canceling laser)
    for (let ci = game.capsules.length - 1; ci >= 0; ci--) {
      const cap = game.capsules[ci];
      if (cap.y <= beamBottomY && cap.y >= stopY && Math.abs(cap.x - beamX) <= cap.hitRadius + 4) {
        game.shotsHit++;
        destroyAndCollectCapsule(game, ci);
      }
    }

    const impacts = [];

    // 3) Pierce ALL Lightwings along the beam segment [stopY .. beamBottomY]
    for (let li = game.lightwings.length - 1; li >= 0; li--) {
      const lw = game.lightwings[li];
      if (lw.y <= beamBottomY && lw.y >= stopY && Math.abs(lw.x - beamX) <= 18) {
        impacts.push(lw.y);
        if (shouldDamageTick) {
          game.shotsHit++;
          damageLightwing(game, li, beamDmg);
        }
      }
    }

    // 4) Pierce ALL Enemy Ships along the beam segment [stopY .. beamBottomY]
    for (let ei = game.enemies.length - 1; ei >= 0; ei--) {
      const e = game.enemies[ei];
      const beamHalfW = e.hitRadius + 5;
      if (e.y <= beamBottomY && e.y >= stopY && Math.abs(e.x - beamX) <= beamHalfW) {
        impacts.push(e.y);
        if (shouldDamageTick) {
          game.shotsHit++;
          const isLegacyBoss = e.type === 'LEGACY_REC' || e.type === 'MASTER_LEGACY_REC';
          const finalDmg = isLegacyBoss ? beamDmg * 1.3 : beamDmg;
          damageEnemy(
            game,
            ei,
            finalDmg,
            beamX,
            e.y,
            isLegacyBoss ? COLORS.aresRed : COLORS.white
          );
        }
      }
    }

    // 5) Resolve ribbon interaction on tick (chip Red ribbon OR refract through Cyan ribbon into slowed red bolts!)
    if (shouldDamageTick) {
      game.shotsFired++;
      if (ribbonBlock) {
        if (ribbonBlock.kind === 'ARES_RIBBON') {
          const trail = game.ribbonTrails[ribbonBlock.idx];
          if (trail && trail.id === ribbonBlock.trailId) {
            trail.hitsRemaining -= 1;
            trail.flashTimer = 0.14;
            if (trail.hitsRemaining <= 0) {
              shatterRibbonTrail(game, ribbonBlock.idx, beamX, stopY, COLORS.aresRed);
            } else {
              game.synth.playRibbonDeflect();
              game.spawnDerez(beamX, stopY, COLORS.amber, 5, 95);
            }
          }
        } else if (ribbonBlock.kind === 'LEGACY_RIBBON') {
          // Beam refracts through cyan ribbon into slowed red bullets that dissolve after 2.0s!
          game.playerBullets.push({
            x: beamX,
            y: stopY - 6,
            vy: -PLAYER_BULLET_SPEED / LEGACY_RIBBON_BULLET_SLOW,
            dmg: beamDmg,
            weakened,
            purple: false,
            redLaserBullet: true,
            slowedByLegacy: true,
            dissolveTimer: SLOWED_BULLET_DISSOLVE_TIME,
            dissolveMax: SLOWED_BULLET_DISSOLVE_TIME
          });
          game.synth.playShotSlow();
          game.spawnDerez(beamX, stopY, COLORS.aresRed, 4, 68);
        }
      }
    }

    game.activeLaserBeams.push({
      offsetX: ox,
      x: beamX,
      y1: beamBottomY,
      y2: stopY,
      weakened,
      hit: !!ribbonBlock,
      hitColor: ribbonBlock && ribbonBlock.kind === 'LEGACY_RIBBON' ? COLORS.cyan : COLORS.aresRed,
      impacts
    });
  }

  if (shouldDamageTick) {
    game.synth.playContinuousLaserTick();
  }

  // Drain Red Laser slot ONLY while actively firing (single rate even in Dual-Fighter!)
  if (dt > 0) {
    consumePowerupEnergy(game, 'RED', RED_LASER_DRAIN_PER_SEC * dt);
  }
}

export function updateArcWavesAndCannon(game, dt) {
  const aw = game.arcWaveState;
  if (aw.auraFade > 0) aw.auraFade = Math.max(0, aw.auraFade - dt);

  // Double-tap Cannon Overcharge: 3.0s auto-fire fallback if user doesn't tap a 2nd time
  if (aw.phase === 'CANNON_CHARGING' && game.player.alive && !game.player.capturedById) {
    aw.cannonTimer -= dt;
    if (Math.random() < 0.35) {
      game.spawnDerez(
        game.player.x + (Math.random() - 0.5) * 26,
        game.player.y + (Math.random() - 0.5) * 20,
        COLORS.purpleBright,
        1,
        55
      );
    }
    if (aw.cannonTimer <= 0) {
      fireCannonShot(game);
      aw.auraFade = 0.55;
      removePowerupSlot(game, 'PURPLE', true);
    }
  }

  // Update active wider Arc Waves (void enemy projectiles + regular bullet damage)
  for (let i = game.arcWaves.length - 1; i >= 0; i--) {
    const w = game.arcWaves[i];
    w.y += w.vy * dt;
    w.radius = Math.min(w.maxRadius, w.radius + 48 * dt);

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

    // Bullets slowed by a cyan light ribbon dissolve after 2.0 seconds
    if (b.slowedByLegacy) {
      b.dissolveTimer -= dt;
      if (b.dissolveTimer <= 0) {
        game.spawnDerez(b.x, b.y, b.redLaserBullet ? COLORS.aresRed : COLORS.cyan, 3, 45);
        game.playerBullets.splice(i, 1);
        continue;
      }
    }

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
            b.vy /= LEGACY_RIBBON_BULLET_SLOW;
            b.dissolveTimer = SLOWED_BULLET_DISSOLVE_TIME;
            b.dissolveMax = SLOWED_BULLET_DISSOLVE_TIME;
            game.synth.playShotSlow();
            game.spawnDerez(b.x, b.y, COLORS.cyan, 4, 55);
          }
        } else {
          // Ares crimson ribbons block regular/purple/laser-bolt shots (6 hits to shatter)
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
      game.spawnDerez(game.capturedFighter.x, game.capturedFighter.y, '#ffffff', 22, 190);
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
        const isLegacyBoss = e.type === 'LEGACY_REC' || e.type === 'MASTER_LEGACY_REC';
        const finalDmg = (b.redLaserBullet && isLegacyBoss) ? b.dmg * 1.3 : b.dmg;
        damageEnemy(game, ei, finalDmg, b.x, b.y, b.redLaserBullet ? COLORS.aresRed : COLORS.white);
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
    if (m.trail.length > 12) m.trail.shift();

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

    // 3) Check Enemies (1.3x damage bonus against Elite & Master Ares Recognizers)
    for (let ei = game.enemies.length - 1; ei >= 0; ei--) {
      const e = game.enemies[ei];
      if (Math.hypot(m.x - e.x, m.y - e.y) < e.hitRadius + 3) {
        game.shotsHit++;
        const isAresBoss = e.type === 'ARES_REC' || e.type === 'MASTER_ARES_REC';
        const finalDmg = isAresBoss ? m.dmg * 1.3 : m.dmg;
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
