/* =========================================================================
   SPECIAL ENEMIES: CENTOID, ALPHA CENTOID, PULSAR & COST-BASED SWAP ENGINE
   ========================================================================= */

import {
  ALPHA_CENTOID_SEG_HP,
  CENTOID_HEAD_HP,
  CENTOID_MAX_SPLITS,
  CENTOID_SEGMENTS,
  CENTOPHAGE_CHASE_CHANCE,
  CENTOPHAGE_CHECK_INTERVAL,
  CENTOPHAGE_FAIL_COOLDOWN,
  CENTOPHAGE_HEAD_HP,
  CENTOPHAGE_MAX_SEGMENTS,
  CENTOPHAGE_SEGMENTS,
  CENTOPHAGE_SEG_HP,
  CENTOPHAGE_SPEED_MULT,
  COLORS,
  COST_SWAP_CHANCE,
  HARD_MODE_MAX_UNLOCK_SECTOR,
  LOGICAL_H,
  LOGICAL_W,
  PULSAR_FIRE_INTERVAL,
  SUPER_CENTOID_HEAD_HP,
  SUPER_CENTOID_SEGMENTS,
  UNIT_META
} from './config.js';
import { clamp } from './utils.js';
import { rollEnemyCapsuleDrop } from './powerups.js';
import { handleEnforcerDestroyed } from './enforcers.js';

function getCentoidSpec(variant) {
  if (variant === 'CENTOPHAGE') {
    return {
      type: 'CENTOPHAGE',
      isAlpha: false,
      isCentophage: true,
      isElite: true,
      isMaster: true,
      segCount: CENTOPHAGE_SEGMENTS,
      headHp: CENTOPHAGE_HEAD_HP,
      bodyHp: CENTOPHAGE_SEG_HP,
      headRadius: 17,
      bodyRadius: 14,
      segSpacing: 20,
      speed: Math.round(158 * CENTOPHAGE_SPEED_MULT), // 284 px/s (1.8x faster than Super Centoids & >2.1x faster than Centoids!)
      ptsHead: 1200,
      ptsBody: 250
    };
  }
  if (variant === 'ALPHA_CENTOID' || variant === true) {
    return {
      type: 'ALPHA_CENTOID',
      isAlpha: true,
      isCentophage: false,
      isElite: true,
      isMaster: false,
      segCount: SUPER_CENTOID_SEGMENTS,
      headHp: SUPER_CENTOID_HEAD_HP,
      bodyHp: ALPHA_CENTOID_SEG_HP,
      headRadius: 17,
      bodyRadius: 14,
      segSpacing: 20,
      speed: 158,
      ptsHead: 450,
      ptsBody: 120
    };
  }
  return {
    type: 'CENTOID',
    isAlpha: false,
    isCentophage: false,
    isElite: false,
    isMaster: false,
    segCount: CENTOID_SEGMENTS,
    headHp: CENTOID_HEAD_HP,
    bodyHp: 1,
    headRadius: 15,
    bodyRadius: 13,
    segSpacing: 19,
    speed: 132,
    ptsHead: 220,
    ptsBody: 60
  };
}

function getAbsorbedTintForPrey(preyType) {
  switch (preyType) {
    case 'DRONE':
    case 'FLUX_ENFORCER':
      return { outer: '#074559', mid: '#00c8e8', bright: '#a6fbff' };
    case 'INTERCEPTOR':
      return { outer: '#5e3d05', mid: '#f0a818', bright: '#fff0a6' };
    case 'V1_ENFORCER':
      return { outer: '#591e08', mid: '#ff6e24', bright: '#ffd29e' };
    case 'NULL_ENFORCER':
      return { outer: '#59081a', mid: '#ff1e42', bright: '#ffa6b8' };
    case 'PULSAR':
      return { outer: '#594804', mid: '#ffe640', bright: '#ffffff' };
    default:
      return { outer: '#2e4700', mid: '#ccff00', bright: '#edff8f' };
  }
}

function sampleTrailAtDist(history, targetDist) {
  if (!history || history.length === 0) return { x: LOGICAL_W * 0.5, y: 80, angle: 0 };
  let acc = 0;
  for (let i = 0; i < history.length - 1; i++) {
    const a = history[i];
    const b = history[i + 1];
    const segLen = Math.hypot(b.x - a.x, b.y - a.y);
    if (acc + segLen >= targetDist && segLen > 0.001) {
      const f = (targetDist - acc) / segLen;
      return {
        x: a.x + (b.x - a.x) * f,
        y: a.y + (b.y - a.y) * f,
        angle: a.angle
      };
    }
    acc += segLen;
  }
  const last = history[history.length - 1];
  return { x: last.x, y: last.y, angle: last.angle };
}

/**
 * Spawns a Centoid (8 seg, 4 HP head / 1 HP body), Super Centoid (10 seg, 6 HP head / 2 HP body),
 * or Master-Tier Centophage (6 seg, 8 HP head / 3 HP body, 1.8x faster, consumes entities to grow!).
 */
export function spawnCentoidChain(game, variantOrIsAlpha = 'CENTOID', startX = null, startY = null, dirX = null) {
  const spec = getCentoidSpec(variantOrIsAlpha);
  const fromLeft = dirX !== null ? dirX > 0 : Math.random() < 0.5;
  const initDirX = fromLeft ? 1 : -1;
  const sx = startX !== null ? clamp(startX, 34, LOGICAL_W - 34) : (fromLeft ? 34 : LOGICAL_W - 34);
  const sy = startY !== null ? clamp(startY, 74, 240) : (88 + Math.random() * 76);

  const chainId = game.centoidIdSeq++;
  const rootId = chainId;
  const { segSpacing, speed, segCount, type, isAlpha, isCentophage } = spec;
  const initAngle = initDirX > 0 ? 0 : Math.PI;

  // Pre-seed trail history behind the head so all segments align crisply from frame 1
  const history = [];
  const totalLen = segCount * segSpacing + 48;
  for (let d = 0; d <= totalLen; d += 4) {
    history.push({
      x: sx - initDirX * d,
      y: sy,
      angle: initAngle
    });
  }

  const chain = {
    chainId,
    rootId,
    type,
    isAlpha,
    isCentophage,
    speed,
    segSpacing,
    // Centoid strict horizontal zig-zag state
    dirX: initDirX,
    dirY: 1, // +1 descending toward bottom, -1 ascending back up
    stepMode: 'HORIZ', // 'HORIZ' | 'STEP_Y'
    stepRemaining: 0,
    leftBound: 28 + Math.random() * 18,
    rightBound: LOGICAL_W - 28 - Math.random() * 18,
    // Super Centoid / Centophage 90-degree corridor state
    axis: 'H', // 'H' | 'V'
    corridorDistLeft: 120 + Math.random() * 110,
    // Master Centophage parasitic entity-hunting state
    chaseTargetId: null,
    chaseTimer: CENTOPHAGE_CHECK_INTERVAL, // 2.0s before first 80% hunt roll
    history
  };
  game.centoidChains.set(chainId, chain);

  for (let k = 0; k < segCount; k++) {
    const pos = sampleTrailAtDist(history, k * segSpacing);
    const isHead = k === 0;
    const segHp = isHead ? spec.headHp : spec.bodyHp;
    game.enemies.push({
      id: game.enemyIdSeq++,
      type,
      isEnforcer: false,
      isElite: spec.isElite,
      isMaster: spec.isMaster,
      isCentoid: true,
      isCentoidHead: isHead,
      isCentoidTail: k === segCount - 1,
      isCentophage,
      centoidChainId: chainId,
      centoidRootId: rootId,
      centoidOrder: k,
      absorbedTint: null,
      isChallengeElite: false,
      isChallengeExtra: false,
      isChallengeGuard: false,
      hitRadius: isHead ? spec.headRadius : spec.bodyRadius,
      maxHp: segHp,
      hp: segHp,
      ptsForm: isHead ? spec.ptsHead : spec.ptsBody,
      ptsDive: isHead ? spec.ptsHead : spec.ptsBody,
      x: pos.x,
      y: pos.y,
      homeX: pos.x,
      homeY: pos.y,
      rowIdx: 0,
      angle: pos.angle,
      state: 'CENTOID',
      path: null,
      pathT: 1,
      pathDur: 1,
      hitFlash: 0,
      animPhase: Math.random() * Math.PI * 2,
      diveT: 0,
      diveDur: 2.0,
      divePattern: 'SWOOP',
      divePath: null,
      beamTimer: 0,
      beamShield: 0,
      hasCapturedShip: false,
      shotCooldown: 1.8 + Math.random() * 1.4,
      wingSurgeQueue: 0,
      wingSurgeTimer: 0,
      surgePulse: 0,
      v1Synergy: null,
      speedBuffed: false,
      hpBuffed: false
    });
  }
}

/**
 * Handles Centoid / Super Centoid / Centophage headshot instant-delete AND body-hit splitting (max 2 living per original).
 */
export function handleCentoidSegmentDestroyed(game, e, idx, scored = true) {
  const chainId = e.centoidChainId;
  const rootId = e.centoidRootId;
  const chain = game.centoidChains.get(chainId);
  const spec = getCentoidSpec(e.type);
  const col = e.type === 'CENTOPHAGE'
    ? COLORS.centophageAcid
    : (e.type === 'ALPHA_CENTOID' ? COLORS.alphaPink : COLORS.centoidGreen);

  // Remove the hit segment first
  game.enemies.splice(idx, 1);
  game.spawnDeleteBurst(e.x, e.y, col, e.isCentoidHead ? 28 : 12, e.isCentoidHead ? 215 : 135);
  game.synth.playDeleteBurst(e.isCentoidHead);
  if (scored) {
    game.addScore(e.ptsForm, e.x, e.y, col);
  }

  // HEADSHOT: Instantly deletes the entire chain at once without splitting!
  if (e.isCentoidHead) {
    let bonusPts = 0;
    for (let i = game.enemies.length - 1; i >= 0; i--) {
      const seg = game.enemies[i];
      if (seg.isCentoid && seg.centoidChainId === chainId) {
        game.spawnDeleteBurst(seg.x, seg.y, col, 10, 145);
        bonusPts += seg.ptsForm;
        game.enemies.splice(i, 1);
      }
    }
    game.centoidChains.delete(chainId);
    const popCol = e.type === 'CENTOPHAGE'
      ? COLORS.centophageAcid
      : (e.type === 'ALPHA_CENTOID' ? COLORS.alphaPink : COLORS.centoidGold);
    if (scored && bonusPts > 0) {
      game.addScore(bonusPts, e.x, e.y - 18, popCol);
    }
    game.spawnPopup(
      e.x,
      e.y - 30,
      e.type === 'CENTOPHAGE'
        ? 'CENTOPHAGE HEADSHOT!'
        : (e.type === 'ALPHA_CENTOID' ? 'SUPER HEADSHOT!' : 'CENTOID HEADSHOT!'),
      popCol,
      1.3
    );
    // Roll capsule drop once on clean headshot kill if no other split of this root remains
    const anyLeftForRoot = game.enemies.some(o => o.isCentoid && o.centoidRootId === rootId);
    if (scored && !anyLeftForRoot) {
      rollEnemyCapsuleDrop(game, e);
    }
    return;
  }

  // BODY HIT: Find remaining segments on this chain ahead & behind the destroyed segment
  const sameChain = game.enemies
    .filter(o => o.isCentoid && o.centoidChainId === chainId)
    .sort((a, b) => a.centoidOrder - b.centoidOrder);

  if (sameChain.length === 0) {
    game.centoidChains.delete(chainId);
    const anyLeftForRoot = game.enemies.some(o => o.isCentoid && o.centoidRootId === rootId);
    if (scored && !anyLeftForRoot) {
      rollEnemyCapsuleDrop(game, e);
    }
    return;
  }

  const ahead = sameChain.filter(s => s.centoidOrder < e.centoidOrder);
  const behind = sameChain.filter(s => s.centoidOrder > e.centoidOrder);

  // Re-index front segments cleanly
  ahead.forEach((seg, k) => {
    seg.centoidOrder = k;
    seg.isCentoidHead = k === 0;
    seg.isCentoidTail = k === ahead.length - 1;
  });

  if (behind.length === 0) return;

  // Count currently living chains spawned from this same original Centoid (max 2!)
  const livingRootChains = new Set();
  for (const o of game.enemies) {
    if (o.isCentoid && o.centoidRootId === rootId) {
      livingRootChains.add(o.centoidChainId);
    }
  }

  if (ahead.length === 0) {
    // Only trailing segments remain — promote front-most trailing segment to Head on same chain
    behind.forEach((seg, k) => {
      seg.centoidOrder = k;
      seg.isCentoidHead = k === 0;
      seg.isCentoidTail = k === behind.length - 1;
      if (k === 0) {
        seg.hitRadius = spec.headRadius;
        seg.maxHp = spec.headHp;
        seg.hp = spec.headHp;
        seg.absorbedTint = null;
      }
    });
    return;
  }

  if (livingRootChains.size < CENTOID_MAX_SPLITS && chain) {
    // SPLIT into a second independent Centoid!
    const newChainId = game.centoidIdSeq++;
    const newHead = behind[0];
    const newDirX = -chain.dirX;
    const newAngle = newDirX > 0 ? 0 : Math.PI;
    const newHistory = [];
    for (let k = 0; k < behind.length; k++) {
      const seg = behind[k];
      newHistory.push({ x: seg.x, y: seg.y, angle: seg.angle });
    }
    // Pad history tail smoothly so trailing segments don't snap
    const tailSeg = behind[behind.length - 1];
    for (let d = 4; d <= 36; d += 4) {
      newHistory.push({ x: tailSeg.x - newDirX * d, y: tailSeg.y, angle: newAngle });
    }

    game.centoidChains.set(newChainId, {
      chainId: newChainId,
      rootId,
      type: chain.type || e.type,
      isAlpha: chain.isAlpha,
      isCentophage: !!chain.isCentophage,
      speed: chain.speed * 1.05,
      segSpacing: chain.segSpacing,
      dirX: newDirX,
      dirY: chain.dirY,
      stepMode: 'HORIZ',
      stepRemaining: 0,
      leftBound: 28 + Math.random() * 18,
      rightBound: LOGICAL_W - 28 - Math.random() * 18,
      axis: (chain.isAlpha || chain.isCentophage) ? (chain.axis === 'H' ? 'V' : 'H') : 'H',
      corridorDistLeft: 95 + Math.random() * 95,
      chaseTargetId: null,
      chaseTimer: CENTOPHAGE_CHECK_INTERVAL,
      history: newHistory
    });

    behind.forEach((seg, k) => {
      seg.centoidChainId = newChainId;
      seg.centoidOrder = k;
      seg.isCentoidHead = k === 0;
      seg.isCentoidTail = k === behind.length - 1;
      if (k === 0) {
        seg.hitRadius = spec.headRadius;
        seg.maxHp = spec.headHp;
        seg.hp = spec.headHp;
        seg.absorbedTint = null;
      }
    });

    game.synth.playCentoidSplit();
    game.spawnPopup(newHead.x, newHead.y - 20, 'SPLIT!', col, 0.9);
  } else {
    // Already at max 2 living centoids from this original: re-link tail cleanly to front chain
    const base = ahead.length;
    const total = base + behind.length;
    ahead.forEach((seg) => { seg.isCentoidTail = false; });
    behind.forEach((seg, k) => {
      seg.centoidOrder = base + k;
      seg.isCentoidHead = false;
      seg.isCentoidTail = (base + k) === total - 1;
    });
  }
}

/**
 * Centophage devours a caught non-Centoid entity and grafts +1 (Normal), +2 (Advanced),
 * or +3 (Elite) new 3 HP segments onto its chain!
 */
function devourPreyAndGrowCentophage(game, chain, segs, prey) {
  const preyIdx = game.enemies.indexOf(prey);
  if (preyIdx < 0) return;

  const meta = UNIT_META[prey.type] || { tier: 1 };
  const rawGain = meta.tier === 3 ? 3 : (meta.tier === 2 ? 2 : 1);
  const room = Math.max(0, CENTOPHAGE_MAX_SEGMENTS - segs.length);
  const gainCount = Math.min(rawGain, room);

  // Clean up tractor beam / captured fighter tether if the devoured enemy was an Enforcer!
  if (game.activeBeamBoss && game.activeBeamBoss.id === prey.id) {
    game.activeBeamBoss = null;
    game.synth.stopTractorBeam();
  }
  if (prey.hasCapturedShip || (game.capturedFighter && game.capturedFighter.ownerId === prey.id)) {
    handleEnforcerDestroyed(game, prey);
  }

  // Remove the devoured entity from the arena (no player score awarded — Centophage stole it!)
  game.enemies.splice(preyIdx, 1);

  const spec = getCentoidSpec('CENTOPHAGE');
  const tint = getAbsorbedTintForPrey(prey.type);

  // Extend history smoothly behind the current tail so newly grafted segments emerge cleanly
  if (gainCount > 0) {
    const tail = segs[segs.length - 1];
    const tailEnd = chain.history[chain.history.length - 1] || { x: tail.x, y: tail.y, angle: tail.angle };
    const backX = -Math.cos(tailEnd.angle || 0);
    const backY = -Math.sin(tailEnd.angle || 0);
    const extraDist = gainCount * chain.segSpacing + 24;
    for (let d = 4; d <= extraDist; d += 4) {
      chain.history.push({
        x: clamp(tailEnd.x + backX * d, 18, LOGICAL_W - 18),
        y: clamp(tailEnd.y + backY * d, 48, LOGICAL_H - 64),
        angle: tailEnd.angle || 0
      });
    }

    const startOrder = segs.length;
    for (let g = 0; g < gainCount; g++) {
      const ord = startOrder + g;
      const pos = sampleTrailAtDist(chain.history, ord * chain.segSpacing);
      const newSeg = {
        id: game.enemyIdSeq++,
        type: 'CENTOPHAGE',
        isEnforcer: false,
        isElite: true,
        isMaster: true,
        isCentoid: true,
        isCentoidHead: false,
        isCentoidTail: g === gainCount - 1,
        isCentophage: true,
        centoidChainId: chain.chainId,
        centoidRootId: chain.rootId,
        centoidOrder: ord,
        absorbedTint: tint,
        isChallengeElite: false,
        isChallengeExtra: false,
        isChallengeGuard: false,
        hitRadius: spec.bodyRadius,
        maxHp: spec.bodyHp,
        hp: spec.bodyHp,
        ptsForm: spec.ptsBody,
        ptsDive: spec.ptsBody,
        x: pos.x,
        y: pos.y,
        homeX: pos.x,
        homeY: pos.y,
        rowIdx: 0,
        angle: pos.angle,
        state: 'CENTOID',
        path: null,
        pathT: 1,
        pathDur: 1,
        hitFlash: 0.18,
        animPhase: Math.random() * Math.PI * 2,
        diveT: 0,
        diveDur: 2.0,
        divePattern: 'SWOOP',
        divePath: null,
        beamTimer: 0,
        beamShield: 0,
        hasCapturedShip: false,
        shotCooldown: 2.0,
        wingSurgeQueue: 0,
        wingSurgeTimer: 0,
        surgePulse: 0,
        v1Synergy: null,
        speedBuffed: segs[0]?.speedBuffed || false,
        hpBuffed: false
      };
      game.enemies.push(newSeg);
      segs.push(newSeg);
    }
    for (let k = 0; k < segs.length; k++) {
      segs[k].isCentoidTail = (k === segs.length - 1);
    }
  }

  // Devour visual & audio burst!
  game.spawnDeleteBurst(prey.x, prey.y, COLORS.centophageAcid, 16, 165);
  game.spawnDeleteBurst(prey.x, prey.y, COLORS.centophageViolet, 8, 120);
  game.synth.playCentoidSplit();
  game.spawnPopup(
    prey.x,
    Math.max(46, prey.y - 22),
    gainCount > 0 ? `CONSUMED! +${gainCount} SEG` : 'CONSUMED! (MAX)',
    COLORS.centophageAcid,
    1.25
  );

  // Reset hunt cycle back to 2.0s patrol before next 80% chase roll
  chain.chaseTargetId = null;
  chain.chaseTimer = CENTOPHAGE_CHECK_INTERVAL;
}

export function updateCentoids(game, dt) {
  if (!game.centoidChains || game.centoidChains.size === 0) return;
  const idleMode = !!game.sandboxIdle || !!game.sandboxPauseAnim;

  // Group living centoid segments by chainId
  const byChain = new Map();
  for (const e of game.enemies) {
    if (!e.isCentoid) continue;
    let arr = byChain.get(e.centoidChainId);
    if (!arr) {
      arr = [];
      byChain.set(e.centoidChainId, arr);
    }
    arr.push(e);
  }

  for (const [chainId, chain] of game.centoidChains.entries()) {
    const segs = byChain.get(chainId);
    if (!segs || segs.length === 0) {
      game.centoidChains.delete(chainId);
      continue;
    }
    segs.sort((a, b) => a.centoidOrder - b.centoidOrder);
    const head = segs[0];
    head.isCentoidHead = true;
    for (let k = 0; k < segs.length; k++) {
      segs[k].isCentoidHead = (k === 0);
      segs[k].isCentoidTail = (k === segs.length - 1);
    }

    if (idleMode) continue;

    const spdMult = head.speedBuffed ? 1.3 : 1.0;
    const step = chain.speed * spdMult * dt;
    let hx = head.x;
    let hy = head.y;
    let angle = head.angle;
    let chasingPrey = null;

    // Master Centophage Parasitic Hunt Scheduler (every 2s -> 80% chase non-centoid, else 6s cooldown!)
    if (chain.isCentophage) {
      if (chain.chaseTargetId !== null) {
        chasingPrey = game.enemies.find(o => o.id === chain.chaseTargetId && !o.isCentoid) || null;
        if (!chasingPrey) {
          chain.chaseTargetId = null;
          chain.chaseTimer = CENTOPHAGE_CHECK_INTERVAL;
        }
      }

      if (!chasingPrey) {
        chain.chaseTimer = (chain.chaseTimer !== undefined ? chain.chaseTimer : CENTOPHAGE_CHECK_INTERVAL) - dt;
        if (chain.chaseTimer <= 0) {
          const candidates = game.enemies.filter((o) => {
            if (!o || o.isCentoid) return false;
            const meta = UNIT_META[o.type];
            return meta && meta.tier >= 1 && meta.tier <= 3 && o.y >= 16 && o.y <= LOGICAL_H - 36;
          });
          if (candidates.length > 0) {
            if (Math.random() < CENTOPHAGE_CHASE_CHANCE) {
              chasingPrey = candidates[Math.floor(Math.random() * candidates.length)];
              chain.chaseTargetId = chasingPrey.id;
              game.spawnPopup(hx, Math.max(44, hy - 22), 'LOCK ON!', COLORS.centophageAcid, 0.85);
            } else {
              // 20% miss -> 6.0 second cooldown before rolling again!
              chain.chaseTimer = CENTOPHAGE_FAIL_COOLDOWN;
            }
          } else {
            chain.chaseTimer = CENTOPHAGE_CHECK_INTERVAL;
          }
        }
      }
    }

    if (chain.isCentophage && chasingPrey) {
      // Predatory direct chase at 1.8x speed toward target entity!
      const dx = chasingPrey.x - hx;
      const dy = chasingPrey.y - hy;
      const dist = Math.hypot(dx, dy);
      if (dist > 0.1) {
        angle = Math.atan2(dy, dx);
        const move = Math.min(step, dist);
        hx = clamp(hx + (dx / dist) * move, 24, LOGICAL_W - 24);
        hy = clamp(hy + (dy / dist) * move, 48, LOGICAL_H - 64);
      }
      if (Math.hypot(chasingPrey.x - hx, chasingPrey.y - hy) <= head.hitRadius + chasingPrey.hitRadius + 4) {
        devourPreyAndGrowCentophage(game, chain, segs, chasingPrey);
        // Pick fresh horizontal/vertical corridor bias after devouring
        chain.dirX = hx < LOGICAL_W * 0.5 ? 1 : -1;
        chain.dirY = hy > LOGICAL_H * 0.55 ? -1 : 1;
        chain.corridorDistLeft = 80 + Math.random() * 90;
      }
    } else if (!chain.isAlpha && !chain.isCentophage) {
      // CENTOID: Strict Atari horizontal zig-zags (NO diagonals or curves!) stepping down & reversing up at bottom
      if (chain.stepMode === 'HORIZ') {
        hx += chain.dirX * step;
        angle = chain.dirX > 0 ? 0 : Math.PI;
        if (chain.dirX > 0 && hx >= chain.rightBound) {
          hx = chain.rightBound;
          chain.stepMode = 'STEP_Y';
          chain.stepRemaining = 24;
          chain.dirX = -1;
        } else if (chain.dirX < 0 && hx <= chain.leftBound) {
          hx = chain.leftBound;
          chain.stepMode = 'STEP_Y';
          chain.stepRemaining = 24;
          chain.dirX = 1;
        }
      } else {
        // Pure 90-degree vertical step down (or up after reaching bottom!)
        const dy = Math.min(step, chain.stepRemaining);
        hy += chain.dirY * dy;
        angle = chain.dirY > 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
        chain.stepRemaining -= dy;
        if (hy >= LOGICAL_H - 96) {
          hy = LOGICAL_H - 96;
          chain.dirY = -1;
          chain.stepRemaining = 0;
        } else if (hy <= 78) {
          hy = 78;
          chain.dirY = 1;
          chain.stepRemaining = 0;
        }
        if (chain.stepRemaining <= 0.1) {
          chain.stepMode = 'HORIZ';
        }
      }
    } else {
      // SUPER CENTOID & PATROLLING CENTOPHAGE: Sharp 90-degree orthogonal grid corridors!
      if (chain.axis === 'H') {
        hx += chain.dirX * step;
        angle = chain.dirX > 0 ? 0 : Math.PI;
        chain.corridorDistLeft -= step;
        const hitEdge = (chain.dirX > 0 && hx >= LOGICAL_W - 30) || (chain.dirX < 0 && hx <= 30);
        if (hitEdge) {
          hx = clamp(hx, 30, LOGICAL_W - 30);
          chain.dirX = -chain.dirX;
        }
        if (hitEdge || chain.corridorDistLeft <= 0) {
          chain.axis = 'V';
          if (hy >= LOGICAL_H - 115) chain.dirY = -1;
          else if (hy <= 92) chain.dirY = 1;
          else if (Math.random() < 0.28) chain.dirY = -chain.dirY;
          chain.corridorDistLeft = 62 + Math.random() * 78;
        }
      } else {
        hy += chain.dirY * step;
        angle = chain.dirY > 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
        chain.corridorDistLeft -= step;
        const hitEdge = (chain.dirY > 0 && hy >= LOGICAL_H - 92) || (chain.dirY < 0 && hy <= 76);
        if (hitEdge) {
          hy = clamp(hy, 76, LOGICAL_H - 92);
          chain.dirY = -chain.dirY;
        }
        if (hitEdge || chain.corridorDistLeft <= 0) {
          chain.axis = 'H';
          if (hx >= LOGICAL_W - 70) chain.dirX = -1;
          else if (hx <= 70) chain.dirX = 1;
          else chain.dirX = Math.random() < 0.5 ? 1 : -1;
          chain.corridorDistLeft = 105 + Math.random() * 145;
        }
      }
    }

    head.x = hx;
    head.y = hy;
    head.angle = angle;

    // Prepend head sample to path breadcrumb history
    const first = chain.history[0];
    if (!first || Math.hypot(hx - first.x, hy - first.y) >= 2.5) {
      chain.history.unshift({ x: hx, y: hy, angle });
      const maxPts = Math.ceil((segs.length * chain.segSpacing + 110) / 2.5);
      if (chain.history.length > maxPts) {
        chain.history.length = maxPts;
      }
    }

    // Trailing body segments follow exact head path
    for (let k = 1; k < segs.length; k++) {
      const seg = segs[k];
      seg.isCentoidHead = false;
      const pos = sampleTrailAtDist(chain.history, k * chain.segSpacing);
      seg.x = pos.x;
      seg.y = pos.y;
      seg.angle = pos.angle;
    }
  }
}

/**
 * Updates Pulsar 3.0s leaf-falling electro ball firing (both in formation & diving!).
 */
export function updatePulsarAttacks(game, e, dt) {
  if (e.type !== 'PULSAR' || game.sandboxIdle || (e.fireDisabledTimer || 0) > 0) return;
  if (e.state !== 'FORMATION' && e.state !== 'DIVING') return;
  e.pulsarTimer = (e.pulsarTimer !== undefined ? e.pulsarTimer : PULSAR_FIRE_INTERVAL * (0.5 + Math.random() * 0.5)) - dt;
  if (e.pulsarTimer <= 0 && game.player.alive) {
    e.pulsarTimer = PULSAR_FIRE_INTERVAL;
    game.electroBalls.push({
      baseX: e.x,
      x: e.x,
      y: e.y + 18,
      vy: 90 + Math.random() * 16,
      swayAmp: 34 + Math.random() * 22,
      swayFreq: 2.8 + Math.random() * 1.2,
      phase: Math.random() * Math.PI * 2,
      age: 0,
      radius: 13 // Size of a Drone!
    });
    game.synth.playElectroBall();
  }
}

/**
 * Spawns 3-4 omnidirectional spark lines on Pulsar death that shoot outward then trail downward.
 */
export function spawnPulsarDeathSparks(game, x, y) {
  const count = Math.random() < 0.5 ? 3 : 4;
  const baseAngle = Math.random() * Math.PI * 2;
  for (let i = 0; i < count; i++) {
    const a = baseAngle + (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
    const burstSpd = 185 + Math.random() * 45;
    game.pulsarSparks.push({
      x,
      y,
      burstVx: Math.cos(a) * burstSpd,
      burstVy: Math.sin(a) * burstSpd,
      vx: Math.cos(a) * burstSpd,
      vy: Math.sin(a) * burstSpd,
      driftVx: Math.cos(a) * 32,
      fallVy: 225 + Math.random() * 40,
      burstDur: 0.30 + Math.random() * 0.10,
      age: 0,
      trail: [{ x, y }]
    });
  }
}

/**
 * Cost-Based Enemy Swap System (5% chance per mob per wave, strictly +-1 tier + sideways!).
 * Costs: Normal=1, Advanced=2, Elite=3, Master=6.
 * - Normal   (1): Up (2 Normal -> 1 Adv)
 * - Advanced (2): Up (3 Adv -> 2 Elite) | Down (1 Adv -> 2 Normal) | Sideways (Adv <-> Adv)
 * - Elite    (3): Up (2 Elite -> 1 Master) | Down (2 Elite -> 3 Adv) | Sideways (Elite <-> Elite)
 * - Master   (6): Down (1 Master -> 2 Elite) | Sideways (Master <-> Master)
 * Respects sector unlock rules (Hard Mode automatically unlocks up to HARD_MODE_MAX_UNLOCK_SECTOR).
 */
export function applyCostBasedSwaps(slots, effSec, hardMode = false) {
  const sec = hardMode ? Math.max(effSec, HARD_MODE_MAX_UNLOCK_SECTOR) : effSec;
  const unlockedByTier = (tier) =>
    Object.entries(UNIT_META)
      .filter(([, meta]) => meta.tier === tier && sec >= meta.minSec)
      .map(([type]) => type);

  const normalPool = unlockedByTier(1);
  const advPool = unlockedByTier(2);
  const elitePool = unlockedByTier(3);
  const masterPool = unlockedByTier(4);
  const pick = (pool, avoid = null) => {
    const filtered = avoid ? pool.filter(t => t !== avoid) : pool;
    const src = filtered.length > 0 ? filtered : pool;
    return src[Math.floor(Math.random() * src.length)] || null;
  };

  const result = [];
  const consumed = new Set();

  for (let i = 0; i < slots.length; i++) {
    if (consumed.has(i)) continue;
    const slot = slots[i];
    const meta = UNIT_META[slot.type];
    if (!meta || Math.random() >= COST_SWAP_CHANCE) {
      result.push(slot);
      continue;
    }

    // 1) Normal (Tier 1, Cost 1): Up (+1 tier) — 2x Normal -> 1x Advanced (Cost 2)
    if (meta.tier === 1 && advPool.length > 0) {
      let partnerIdx = -1;
      for (let j = i + 1; j < slots.length; j++) {
        if (!consumed.has(j) && UNIT_META[slots[j].type]?.tier === 1) {
          partnerIdx = j;
          break;
        }
      }
      if (partnerIdx >= 0) {
        consumed.add(partnerIdx);
        const swapped = pick(advPool);
        if (swapped) {
          result.push({ ...slot, type: swapped });
          continue;
        }
      }
    }

    // 2) Advanced (Tier 2, Cost 2): Up (3x Adv -> 2x Elite) | Down (1x Adv -> 2x Normal) | Sideways (Adv <-> Adv)
    if (meta.tier === 2) {
      const roll = Math.random();
      if (elitePool.length > 0 && roll < 0.35) {
        const partners = [];
        for (let j = i + 1; j < slots.length && partners.length < 2; j++) {
          if (!consumed.has(j) && UNIT_META[slots[j].type]?.tier === 2) partners.push(j);
        }
        if (partners.length === 2) {
          consumed.add(partners[0]);
          consumed.add(partners[1]);
          result.push({ ...slot, type: pick(elitePool) });
          result.push({ ...slots[partners[0]], type: pick(elitePool) });
          continue;
        }
      } else if (normalPool.length > 0 && roll < 0.65) {
        // Swap down -1 tier: 1x Advanced (Cost 2) -> 2x Normal (Cost 1 + 1 = 2)
        result.push({ ...slot, type: pick(normalPool), homeX: clamp(slot.homeX - 20, 42, LOGICAL_W - 42) });
        result.push({ ...slot, type: pick(normalPool), homeX: clamp(slot.homeX + 20, 42, LOGICAL_W - 42) });
        continue;
      }
      const altAdv = pick(advPool, slot.type);
      if (altAdv && altAdv !== slot.type) {
        result.push({ ...slot, type: altAdv });
        continue;
      }
    }

    // 3) Elite (Tier 3, Cost 3): Up (2x Elite -> 1x Master) | Down (2x Elite -> 3x Adv) | Sideways (Elite <-> Elite)
    if (meta.tier === 3) {
      const roll = Math.random();
      if (masterPool.length > 0 && roll < 0.30) {
        let partnerIdx = -1;
        for (let j = i + 1; j < slots.length; j++) {
          if (!consumed.has(j) && UNIT_META[slots[j].type]?.tier === 3) {
            partnerIdx = j;
            break;
          }
        }
        if (partnerIdx >= 0) {
          consumed.add(partnerIdx);
          result.push({ ...slot, type: pick(masterPool) });
          continue;
        }
      } else if (advPool.length > 0 && roll < 0.60) {
        // Swap down -1 tier: 2x Elite (Cost 6) -> 3x Advanced (Cost 2 + 2 + 2 = 6)
        let partnerIdx = -1;
        for (let j = i + 1; j < slots.length; j++) {
          if (!consumed.has(j) && UNIT_META[slots[j].type]?.tier === 3) {
            partnerIdx = j;
            break;
          }
        }
        if (partnerIdx >= 0) {
          consumed.add(partnerIdx);
          const pSlot = slots[partnerIdx];
          const midX = clamp((slot.homeX + pSlot.homeX) * 0.5, 42, LOGICAL_W - 42);
          const midY = (slot.homeY + pSlot.homeY) * 0.5;
          result.push({ ...slot, type: pick(advPool) });
          result.push({ ...pSlot, type: pick(advPool) });
          result.push({ ...slot, type: pick(advPool), homeX: midX, homeY: midY });
          continue;
        }
      }
      const altElite = pick(elitePool, slot.type);
      if (altElite && altElite !== slot.type) {
        result.push({ ...slot, type: altElite });
        continue;
      }
    }

    // 4) Master (Tier 4, Cost 6): Down (1x Master -> 2x Elite) | Sideways (Master Flux / Null / Centophage)
    if (meta.tier === 4) {
      const altMaster = masterPool.length > 1 ? pick(masterPool, slot.type) : null;
      if (altMaster && altMaster !== slot.type && Math.random() < 0.50) {
        result.push({ ...slot, type: altMaster });
        continue;
      }
      if (elitePool.length > 0) {
        const e1 = pick(elitePool);
        const e2 = pick(elitePool);
        result.push({ ...slot, type: e1, homeX: clamp(slot.homeX - 24, 42, LOGICAL_W - 42) });
        result.push({ ...slot, type: e2, homeX: clamp(slot.homeX + 24, 42, LOGICAL_W - 42) });
        continue;
      }
    }

    result.push(slot);
  }

  return result;
}
