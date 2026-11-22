/* =========================================================================
   RECOGNIZER TRACTOR BEAM (CLASSIC MCP) + ELITE LIGHTWINGS & RIBBONS
   ========================================================================= */

import {
  ARES_RIBBON_HITS,
  COLORS,
  ELITE_SURGE_CHANCE,
  ELITE_SURGE_INTERVAL,
  LOGICAL_H,
  LOGICAL_W,
  RIBBON_LIFETIME,
  TRACTOR_APPROACH_DUR,
  TRACTOR_BEAM_DUR,
  TRACTOR_CAPTURE_RADIUS,
  TRACTOR_LIFT_DUR,
  TRACTOR_PULL_RADIUS,
  TRACTOR_RETRY_DELAY
} from './config.js';
import { clamp, distToSeg, evalCubic, lerp } from './utils.js';
import { resetArcWaveState } from './powerups.js';

export function startRecognizerBeam(game, rec) {
  rec.state = 'BEAM_APPROACH';
  rec.beamShield = 1; // 1-hit Tractor Capacitor Shield while descending so rapid-pulse doesn't instakill it
  rec.beamApproachT = 0;
  rec.beamStartX = rec.x;
  rec.beamStartY = rec.y;
  // Flank wide away from the player's current fire line before curving into beam lock
  const flankDir = rec.x < game.player.x ? -1 : 1;
  rec.beamFlankX = clamp(game.player.x + flankDir * 115, 56, LOGICAL_W - 56);
  game.activeBeamBoss = rec;
  game.spawnPopup(rec.x, rec.y - 24, 'TRACTOR BEAM!', COLORS.cyan, 1.15);
}

export function updateRecognizerBeamApproach(game, e, dt) {
  const targetY = LOGICAL_H - 204;
  const targetX = clamp(game.player.x, 56, LOGICAL_W - 56);
  e.beamApproachT = Math.min(1, e.beamApproachT + dt / TRACTOR_APPROACH_DUR);
  const pos = evalCubic([
    { x: e.beamStartX, y: e.beamStartY },
    { x: e.beamFlankX, y: lerp(e.beamStartY, targetY, 0.42) },
    { x: lerp(e.beamFlankX, targetX, 0.62), y: lerp(e.beamStartY, targetY, 0.88) },
    { x: targetX, y: targetY }
  ], e.beamApproachT);
  e.x = pos.x;
  e.y = pos.y;

  if (e.beamApproachT >= 1) {
    e.y = targetY;
    e.beamShield = 0;
    e.state = 'BEAMING';
    e.beamTimer = TRACTOR_BEAM_DUR;
  }
}

export function updateRecognizerBeaming(game, e, dt) {
  const p = game.player;
  e.beamTimer -= dt;

  if (p.alive && !p.dual && !p.capturedById && p.invulnTimer <= 0) {
    const dx = e.x - p.x;
    // Gentle magnetic pull inside the beam cone, then full kidnapping capture
    if (Math.abs(dx) < TRACTOR_PULL_RADIUS) {
      p.x += dx * 3.8 * dt;
      game.clampPlayerX();
    }
    if (Math.abs(e.x - p.x) < TRACTOR_CAPTURE_RADIUS) {
      p.capturedById = e.id;
      e.hasCapturedShip = true;
      game.redLaserActive = false;
      game.redLaserPulseTimer = 0;
      game.activeLaserBeams = [];
      game.capturedFighter = {
        x: p.x,
        y: p.y,
        ownerId: e.id,
        friendlyFireGrace: 1.6,
        spin: 0
      };
      game.spawnPopup(p.x, p.y - 30, 'FIGHTER CAPTURED!', COLORS.aresRed, 1.35);
      e.beamTimer = TRACTOR_LIFT_DUR; // Visual tractor lift before returning to formation
    }
  }

  if (e.beamTimer <= 0) {
    e.state = 'RETURNING';
    if (game.activeBeamBoss && game.activeBeamBoss.id === e.id) {
      game.activeBeamBoss = null;
    }
    if (p.capturedById === e.id) {
      p.capturedById = null;
      p.alive = false;
      p.respawnTimer = 1.5;
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
      game.updateHUD();
      game.updateStatusPills();
      if (game.lives <= 0) {
        game.gameOverTimer = 1.05;
      }
    }
  }
}

export function updateCapturedFighterTether(game, e, dt) {
  if (!e.hasCapturedShip || !game.capturedFighter || game.capturedFighter.ownerId !== e.id) return;
  const p = game.player;
  const liftSpeed = p.capturedById === e.id ? 5.2 : 8.0;
  game.capturedFighter.x += (e.x - game.capturedFighter.x) * Math.min(1, liftSpeed * dt);
  game.capturedFighter.y += ((e.y - 30) - game.capturedFighter.y) * Math.min(1, liftSpeed * dt);
  if (game.capturedFighter.friendlyFireGrace > 0) {
    game.capturedFighter.friendlyFireGrace = Math.max(0, game.capturedFighter.friendlyFireGrace - dt);
  }
  game.capturedFighter.spin = p.capturedById === e.id ? game.capturedFighter.spin + dt * 10 : 0;
}

export function handleRecognizerDestroyed(game, e) {
  if (game.activeBeamBoss && game.activeBeamBoss.id === e.id) {
    game.activeBeamBoss = null;
    game.synth.stopTractorBeam();
    game.tractorTimer = Math.min(game.tractorTimer, TRACTOR_RETRY_DELAY);
  }

  // Abort active pull-up or rescue docked captured fighter if Classic MCP Recognizer is destroyed
  if (game.player.capturedById === e.id) {
    game.player.capturedById = null;
    game.capturedFighter = null;
    game.player.invulnTimer = 1.4;
    game.spawnPopup(e.x, e.y - 22, 'CAPTURE ABORTED!', COLORS.emerald, 1.3);
    game.synth.playRescue();
  } else if (e.hasCapturedShip && game.capturedFighter && game.capturedFighter.ownerId === e.id) {
    game.capturedFighter = null;
    game.player.dual = true;
    game.dualRescues++;
    game.spawnPopup(e.x, e.y - 22, 'DUAL-FIGHTER RESCUED!', COLORS.emerald, 1.5);
    game.synth.playRescue();
  }
}

export function spawnLightwing(
  game,
  boss,
  allowSurge = true,
  surgeOffsetIdx = 0,
  forcedSide = null,
  spawnOffsetX = 0
) {
  const isAres = boss.type === 'ARES_REC';
  game.synth.playLightwingLaunch(isAres);

  if (allowSurge && boss.wingSurgeQueue <= 0 && Math.random() < ELITE_SURGE_CHANCE) {
    const extraCount = 2 + Math.floor(Math.random() * 3); // 2, 3, or 4
    boss.wingSurgeQueue = extraCount;
    boss.wingSurgeTimer = ELITE_SURGE_INTERVAL;
    boss.surgePulse = 0.9;
    game.synth.playWingSurge(isAres);
    game.spawnPopup(
      boss.x,
      boss.y - 34,
      `WING SURGE +${extraCount}`,
      isAres ? COLORS.aresRed : COLORS.cyan,
      1.45
    );
  }

  const trail = {
    id: game.ribbonIdSeq++,
    variant: isAres ? 'ARES' : 'LEGACY',
    segments: [],
    hitsRemaining: isAres ? ARES_RIBBON_HITS : 999,
    maxHits: ARES_RIBBON_HITS,
    flashTimer: 0
  };
  game.ribbonTrails.push(trail);

  const spread = surgeOffsetIdx * 18 * (surgeOffsetIdx % 2 === 0 ? 1 : -1);

  if (isAres) {
    const startX = clamp(boss.x + spawnOffsetX + spread * 0.4, 54, LOGICAL_W - 54);
    const startY = boss.y + 20;
    const dirX = forcedSide !== null
      ? forcedSide
      : ((startX < LOGICAL_W * 0.5 ? 1 : -1) * (surgeOffsetIdx % 2 === 1 ? -1 : 1));
    const dropY1 = clamp(230 + Math.random() * 115 + surgeOffsetIdx * 14, 210, 385);
    const crossX = clamp(startX + dirX * (145 + Math.random() * 145), 44, LOGICAL_W - 44);
    const dropY2 = clamp(LOGICAL_H - 94 - Math.random() * 54, 455, LOGICAL_H - 82);
    const exitX = dirX > 0 ? -36 : LOGICAL_W + 36;

    game.lightwings.push({
      variant: 'ARES',
      trail,
      x: startX,
      y: startY,
      prevX: startX,
      prevY: startY,
      hp: 1,
      maxHp: 1,
      speed: 225,
      angle: Math.PI / 2,
      waypoints: [
        { x: startX, y: dropY1 },
        { x: crossX, y: dropY1 },
        { x: crossX, y: dropY2 },
        { x: exitX, y: dropY2 }
      ],
      wpIndex: 0
    });
  } else {
    const startX = clamp(boss.x + spawnOffsetX, 44, LOGICAL_W - 44);
    const startY = boss.y + 20;
    const sweepRight = forcedSide !== null
      ? (forcedSide > 0)
      : ((startX < LOGICAL_W * 0.5) !== (surgeOffsetIdx % 2 === 1));
    const p0 = { x: startX, y: startY };
    const p1 = { x: clamp((sweepRight ? 395 : 85) + spread, 40, LOGICAL_W - 40), y: 255 + surgeOffsetIdx * 12 };
    const p2 = { x: clamp((sweepRight ? 95 : 385) - spread, 40, LOGICAL_W - 40), y: LOGICAL_H - 64 };
    const p3 = { x: sweepRight ? LOGICAL_W + 40 : -40, y: LOGICAL_H - 175 };

    game.lightwings.push({
      variant: 'LEGACY',
      trail,
      x: startX,
      y: startY,
      prevX: startX,
      prevY: startY,
      hp: 1,
      maxHp: 1,
      angle: Math.PI / 2,
      curve: [p0, p1, p2, p3],
      t: 0,
      dur: 2.85
    });
  }
}

export function shatterRibbonTrail(game, trailIdx, fx, fy, color) {
  const trail = game.ribbonTrails[trailIdx];
  if (!trail) return;
  for (const seg of trail.segments) {
    if (Math.random() < 0.45) {
      game.spawnDerez((seg.x1 + seg.x2) * 0.5, (seg.y1 + seg.y2) * 0.5, color, 2, 110);
    }
  }
  game.spawnDerez(fx, fy, color, 10, 155);
  game.synth.playRibbonShatter();
  game.ribbonTrails.splice(trailIdx, 1);
}

export function damageLightwing(game, idx, dmg) {
  const lw = game.lightwings[idx];
  if (!lw) return;
  lw.hp -= dmg;
  if (lw.hp <= 0.001) {
    const col = lw.variant === 'ARES' ? COLORS.aresRed : COLORS.cyan;
    game.addScore(150, lw.x, lw.y, col);
    game.spawnDerez(lw.x, lw.y, col, 14, 150);
    game.synth.playDerez(false);
    game.lightwings.splice(idx, 1);
  } else {
    game.synth.playArmorPing();
  }
}

export function updateLightwingsAndRibbons(game, dt) {
  const p = game.player;

  // 1) Update Lightwings (Legacy curved swoops & Ares 90-degree grid corridors)
  for (let i = game.lightwings.length - 1; i >= 0; i--) {
    const lw = game.lightwings[i];
    const prevX = lw.x;
    const prevY = lw.y;
    let finished = false;

    if (lw.variant === 'LEGACY') {
      lw.t += dt / lw.dur;
      if (lw.t >= 1) {
        finished = true;
      } else {
        const pos = evalCubic(lw.curve, lw.t);
        lw.x = pos.x;
        lw.y = pos.y;
        if (Math.hypot(lw.x - prevX, lw.y - prevY) > 0.1) {
          lw.angle = Math.atan2(lw.y - prevY, lw.x - prevX);
        }
      }
    } else {
      let moveLeft = lw.speed * dt;
      while (moveLeft > 0 && lw.wpIndex < lw.waypoints.length) {
        const wp = lw.waypoints[lw.wpIndex];
        const dx = wp.x - lw.x;
        const dy = wp.y - lw.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= moveLeft) {
          const cornerX = lw.x;
          const cornerY = lw.y;
          lw.x = wp.x;
          lw.y = wp.y;
          moveLeft -= dist;
          lw.wpIndex++;
          if (Math.hypot(lw.x - lw.prevX, lw.y - lw.prevY) > 2) {
            lw.trail.segments.push({
              x1: lw.prevX,
              y1: lw.prevY,
              x2: lw.x,
              y2: lw.y,
              life: RIBBON_LIFETIME
            });
            lw.prevX = lw.x;
            lw.prevY = lw.y;
          }
          if (Math.hypot(wp.x - cornerX, wp.y - cornerY) > 0.1) {
            lw.angle = Math.atan2(wp.y - cornerY, wp.x - cornerX);
          }
        } else {
          lw.x += (dx / dist) * moveLeft;
          lw.y += (dy / dist) * moveLeft;
          lw.angle = Math.atan2(dy, dx);
          moveLeft = 0;
        }
      }
      if (lw.wpIndex >= lw.waypoints.length) {
        finished = true;
      }
    }

    // Emit Light Ribbon segment as Lightwing travels
    if (!finished && Math.hypot(lw.x - lw.prevX, lw.y - lw.prevY) >= 12) {
      lw.trail.segments.push({
        x1: lw.prevX,
        y1: lw.prevY,
        x2: lw.x,
        y2: lw.y,
        life: RIBBON_LIFETIME
      });
      lw.prevX = lw.x;
      lw.prevY = lw.y;
    }

    // Direct Lightwing collision with player ship
    if (
      !finished &&
      p.alive &&
      !p.capturedById &&
      p.invulnTimer <= 0 &&
      Math.hypot(lw.x - p.x, lw.y - p.y) < (p.dual ? 24 : 16)
    ) {
      game.damagePlayer();
      game.spawnDerez(lw.x, lw.y, lw.variant === 'ARES' ? COLORS.aresRed : COLORS.cyan, 12, 135);
      game.lightwings.splice(i, 1);
      continue;
    }

    if (finished) {
      game.lightwings.splice(i, 1);
    }
  }

  // 2) Decay Light Ribbon segments & check player touch debuffs
  for (let ti = game.ribbonTrails.length - 1; ti >= 0; ti--) {
    const trail = game.ribbonTrails[ti];
    if (trail.flashTimer > 0) trail.flashTimer = Math.max(0, trail.flashTimer - dt);

    for (let si = trail.segments.length - 1; si >= 0; si--) {
      const seg = trail.segments[si];
      seg.life -= dt;
      if (seg.life <= 0) {
        trail.segments.splice(si, 1);
        continue;
      }
      if (p.alive && !p.capturedById) {
        if (distToSeg(p.x, p.y, seg.x1, seg.y1, seg.x2, seg.y2) < (p.dual ? 20 : 14)) {
          game.applyRibbonDebuff(trail.variant);
        }
      }
    }

    const ownedByActiveWing = game.lightwings.some(lw => lw.trail === trail);
    if (trail.segments.length === 0 && !ownedByActiveWing) {
      game.ribbonTrails.splice(ti, 1);
    }
  }
}
