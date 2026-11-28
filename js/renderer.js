/* =========================================================================
   MAIN RENDERING PIPELINE
   ========================================================================= */

import {
  CANNON_AUTO_FIRE_DELAY,
  CHAIN_LIGHTNING_JUMP_RANGE,
  CHAIN_LIGHTNING_RANGE,
  COLORS,
  LOGICAL_H,
  LOGICAL_W,
  PLAYER_DEFAULT_Y,
  PLAYER_MIN_Y,
  TOUCH_HINT_DURATION,
  TRACTOR_BEAM_Y
} from './config.js';
import { clamp } from './utils.js';
import { getActivePowerups } from './powerups.js';
import { renderSpriteEffects } from './animator.js';
import { getAurexSkinMeta, getEnemySkinMeta } from './skins.js';
import {
  drawDeathCrossLightning,
  drawEnemyFireDisabledSparks,
  drawPixelAoeBlast,
  drawPixelArcWave,
  drawPixelBuffWave,
  drawPixelCannonShot,
  drawPixelChainLightning,
  drawPixelElectroBall,
  drawPixelEnemyBullet,
  drawPixelHomingMissile,
  drawPixelPlasmaRing,
  drawPixelPlayerBullet,
  drawPixelPulsarSpark,
  drawPixelRedLaserBeam,
  drawPixelShipShockAura,
  drawPixelShrapnelParticle,
  drawPixelThreadTrail,
  drawPixelTractorBeam,
  drawPlasmaAimGuide,
  drawPlasmaArenaBorder,
  drawPlasmaShieldBubble,
  renderPixelExplosions,
  renderPowerupPickupFx
} from './renderers/saturn_fx.js';
import {
  drawAurexFighter,
  drawBackground,
  drawEnemySprite,
  drawEnforcerWingSprite,
  drawFighterClone,
  drawPixelCapsule,
  drawTractorBeam
} from './sprites.js';

const FONT_ARCADE_DISPLAY = '"Silkscreen", ui-monospace, monospace';
const FONT_ARCADE_UI = '"Silkscreen", ui-monospace, monospace';

/**
 * Word-wraps arcade banner text cleanly within maxWidth so intro & reward cards
 * expand vertically instead of clipping on left/right frame edges.
 */
function wrapBannerSegment(ctx, segment, maxWidth) {
  const trimmed = segment.trim();
  if (!trimmed) return [];
  if (ctx.measureText(trimmed).width <= maxWidth) return [trimmed];

  const words = trimmed.split(/\s+/);
  const lines = [];
  let current = '';

  const pushOversizedWord = (word) => {
    let chunk = '';
    for (const ch of word) {
      const next = chunk + ch;
      if (chunk && ctx.measureText(next).width > maxWidth) {
        lines.push(chunk);
        chunk = ch;
      } else {
        chunk = next;
      }
    }
    if (chunk) current = chunk;
  };

  for (const word of words) {
    if (!current) {
      if (ctx.measureText(word).width <= maxWidth) {
        current = word;
      } else {
        pushOversizedWord(word);
      }
    } else {
      const candidate = `${current} ${word}`;
      if (ctx.measureText(candidate).width <= maxWidth) {
        current = candidate;
      } else {
        lines.push(current);
        current = '';
        if (ctx.measureText(word).width <= maxWidth) {
          current = word;
        } else {
          pushOversizedWord(word);
        }
      }
    }
  }
  if (current) lines.push(current);

  // If greedy wrap produced exactly 2 unbalanced lines, balance word split cleanly near midpoint
  if (lines.length === 2 && words.length >= 3) {
    let bestSplit = -1;
    let bestDiff = Infinity;
    for (let k = 1; k < words.length; k++) {
      const left = words.slice(0, k).join(' ');
      const right = words.slice(k).join(' ');
      const lw = ctx.measureText(left).width;
      const rw = ctx.measureText(right).width;
      if (lw <= maxWidth && rw <= maxWidth) {
        const diff = Math.abs(lw - rw);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestSplit = k;
        }
      }
    }
    if (bestSplit > 0) {
      return [words.slice(0, bestSplit).join(' '), words.slice(bestSplit).join(' ')];
    }
  }

  return lines;
}

function wrapBannerLines(ctx, text, maxWidth) {
  if (!text) return [];
  const raw = String(text);
  const result = [];
  for (const para of raw.split('\n')) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    if (ctx.measureText(trimmed).width <= maxWidth) {
      result.push(trimmed);
      continue;
    }
    // Prefer splitting cleanly at " // " dividers so marquees stack symmetrically without orphan slashes
    if (trimmed.includes(' // ')) {
      const parts = trimmed.split(' // ');
      for (const part of parts) {
        result.push(...wrapBannerSegment(ctx, part, maxWidth));
      }
    } else {
      result.push(...wrapBannerSegment(ctx, trimmed, maxWidth));
    }
  }
  return result;
}

function drawMeasurementGridUnderlay(ctx) {
  ctx.save();

  // Player-centered 1F measurement grid: 1 square box (38x38px) fits the entire player,
  // built outward symmetrically from the player's exact original spawn position (240, 586)!
  const cell = 38;
  const half = cell * 0.5; // 19px
  const originX = LOGICAL_W * 0.5; // 240
  const originY = PLAYER_DEFAULT_Y; // 586
  const box0Left = originX - half; // 221
  const box0Top = originY - half;  // 567

  // 1) Highlight the player's (0, 0) Origin Cell so you always see the exact home box
  ctx.fillStyle = 'rgba(255, 212, 71, 0.08)';
  ctx.fillRect(box0Left, box0Top, cell, cell);

  // 2) Vertical grid lines tiled outward from the origin cell edges (x = 221 + k*38)
  const kMin = Math.floor((0 - box0Left) / cell);
  const kMax = Math.ceil((LOGICAL_W - box0Left) / cell);
  for (let k = kMin; k <= kMax; k++) {
    const x = box0Left + k * cell;
    if (x < 0 || x > LOGICAL_W) continue;
    const isOriginEdge = k === 0 || k === 1;
    const isMajor = !isOriginEdge && (k % 4 === 0 || (k - 1) % 4 === 0) && (Math.abs(k) === 4 || Math.abs(k - 1) === 4);
    ctx.strokeStyle = isOriginEdge
      ? 'rgba(255, 212, 71, 0.42)'
      : (isMajor ? 'rgba(0, 255, 170, 0.36)' : 'rgba(0, 246, 255, 0.2)');
    ctx.lineWidth = isOriginEdge ? 1.1 : (isMajor ? 1.05 : 0.85);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, LOGICAL_H);
    ctx.stroke();
  }

  // 3) Horizontal grid lines tiled outward from the origin cell edges (y = 567 + m*38)
  const mMin = Math.floor((0 - box0Top) / cell);
  const mMax = Math.ceil((LOGICAL_H - box0Top) / cell);
  for (let m = mMin; m <= mMax; m++) {
    const y = box0Top + m * cell;
    if (y < 0 || y > LOGICAL_H) continue;
    const isOriginEdge = m === 0 || m === 1;
    // Highlight every 4F upward from the origin box top edge (m = -4, -8, -12 -> 4F, 8F, 12F!)
    const isMajor = m < 0 && m % 4 === 0;
    ctx.strokeStyle = isOriginEdge
      ? 'rgba(255, 212, 71, 0.42)'
      : (isMajor ? 'rgba(0, 255, 170, 0.4)' : 'rgba(0, 246, 255, 0.2)');
    ctx.lineWidth = isOriginEdge ? 1.1 : (isMajor ? 1.1 : 0.85);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(LOGICAL_W, y);
    ctx.stroke();
  }

  // 4) Subtle dashed center cross-axes passing directly through the player's original spawn point (240, 586)
  ctx.strokeStyle = 'rgba(255, 212, 71, 0.22)';
  ctx.setLineDash([3, 4]);
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(originX, 0);
  ctx.lineTo(originX, LOGICAL_H);
  ctx.moveTo(0, originY);
  ctx.lineTo(LOGICAL_W, originY);
  ctx.stroke();
  ctx.setLineDash([]);

  // 5) Crisp gold frame on the (0, 0) Player Origin Box + subtle corner ticks
  ctx.strokeStyle = 'rgba(255, 212, 71, 0.82)';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(box0Left + 0.5, box0Top + 0.5, cell - 1, cell - 1);

  // 6) Fighter-box coordinate labels (Columns: -5..0..+5 along top; Rows: 0F..14F up left margin)
  ctx.font = `400 7.6px ${FONT_ARCADE_UI}`;
  ctx.textAlign = 'center';
  for (let col = -5; col <= 5; col++) {
    const cx = originX + col * cell;
    if (cx < 14 || cx > LOGICAL_W - 14) continue;
    ctx.fillStyle = col === 0
      ? 'rgba(255, 224, 96, 0.92)'
      : (Math.abs(col) === 4 ? 'rgba(120, 255, 205, 0.86)' : 'rgba(130, 232, 255, 0.68)');
    const label = col > 0 ? `+${col}` : `${col}`;
    ctx.fillText(label, cx, 61);
  }

  ctx.textAlign = 'left';
  for (let rowUp = 0; rowUp <= 14; rowUp++) {
    const cy = originY - rowUp * cell;
    if (cy < 66 || cy > LOGICAL_H - 8) continue;
    const isMajorRow = rowUp > 0 && rowUp % 4 === 0;
    ctx.fillStyle = rowUp === 0
      ? 'rgba(255, 224, 96, 0.92)'
      : (isMajorRow ? 'rgba(120, 255, 205, 0.9)' : 'rgba(130, 232, 255, 0.68)');
    ctx.fillText(`${rowUp}F`, 4, cy + 3);
  }

  // Subtle origin tag right below the (0, 0) home box
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 224, 96, 0.82)';
  ctx.fillText('ORIGIN (0,0)', originX, box0Top + cell + 10);

  // Compact reference legend (aligned top-right under Sandbox strip)
  ctx.fillStyle = 'rgba(2, 12, 24, 0.78)';
  ctx.fillRect(LOGICAL_W - 294, 38, 288, 15);
  ctx.fillStyle = 'rgba(180, 255, 232, 0.9)';
  ctx.textAlign = 'right';
  ctx.fillText('1 BOX=1F (38px) • ORIGIN=(0,0) • BOLT=4F (152px)', LOGICAL_W - 10, 48);
  ctx.restore();
}

function drawShipLightningRuler(ctx, game) {
  const p = game.player;
  if (!p.alive || p.capturedById) return;

  ctx.save();
  const offsets = p.dual ? [-14, 14] : [0];
  // Front 270-degree sector: from +135 deg (3*PI/4) clockwise through up (-PI/2) to +45 deg (PI/4)
  const startAng = Math.PI * 0.75;
  const endAng = Math.PI * 2.25;

  for (const ox of offsets) {
    const cx = p.x + ox;
    const cy = p.y - 6;

    // Translucent 270-degree sector fill
    ctx.fillStyle = 'rgba(255, 230, 64, 0.065)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, CHAIN_LIGHTNING_RANGE, startAng, endAng);
    ctx.closePath();
    ctx.fill();

    // Outer 270-degree boundary arc + rear blind-wedge boundary rays (+45 deg & +135 deg)
    ctx.strokeStyle = 'rgba(255, 230, 64, 0.82)';
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(startAng) * CHAIN_LIGHTNING_RANGE, cy + Math.sin(startAng) * CHAIN_LIGHTNING_RANGE);
    ctx.arc(cx, cy, CHAIN_LIGHTNING_RANGE, startAng, endAng);
    ctx.lineTo(cx, cy);
    ctx.stroke();

    // Concentric 1F / 2F / 3F range rings (every 38px) inside the 270-degree sector
    ctx.strokeStyle = 'rgba(255, 230, 64, 0.28)';
    ctx.setLineDash([3, 4]);
    ctx.lineWidth = 0.9;
    for (let f = 1; f <= 3; f++) {
      ctx.beginPath();
      ctx.arc(cx, cy, f * 38, startAng, endAng);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Vertical 1F..4F scale labels (only once on rightmost fighter when dual)
    if (ox === offsets[offsets.length - 1]) {
      ctx.font = `400 8px ${FONT_ARCADE_UI}`;
      ctx.fillStyle = COLORS.yellow;
      ctx.textAlign = 'center';
      for (let f = 1; f <= 4; f++) {
        const ty = cy - f * 38;
        if (ty < 12) break;
        ctx.fillText(f === 4 ? '270° • 4F (152px)' : `${f}F`, cx, ty - 3);
      }
    }

    // Ship hull comparison frame (26x28px)
    ctx.strokeStyle = 'rgba(0, 246, 255, 0.55)';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 13, p.y - 15, 26, 28);
  }
  ctx.restore();
}

function drawMeasurementGridOverlay(ctx, game) {
  ctx.save();

  // Enemy Hitbox Radius circles (size comparison!) + Edge-to-Edge Chain Jump rings & pair distances
  const measured = game.enemies.filter(e => !e.isCentoid || e.isCentoidHead);
  ctx.font = `400 8px ${FONT_ARCADE_UI}`;
  ctx.textAlign = 'center';

  for (const e of measured) {
    // Hitbox radius circle
    ctx.strokeStyle = 'rgba(0, 255, 170, 0.65)';
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.hitRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Radius size tag (e.g. r30 for Master, r25 for Pulsar, r16 for Drone)
    ctx.fillStyle = 'rgba(180, 255, 232, 0.9)';
    ctx.fillText(`r${e.hitRadius}`, e.x, e.y + e.hitRadius + 10);
  }

  // Show edge-to-edge Chain Jump reach (hitRadius + 200px) around enemies when <= 6 measured enemies (or dragged/closest!)
  const jumpRingTargets = measured.length <= 6
    ? measured
    : (game.sandboxDrag && game.sandboxDrag.kind === 'ENEMY' ? [game.sandboxDrag.ref] : measured.slice(0, 2));

  for (const e of jumpRingTargets) {
    ctx.strokeStyle = 'rgba(255, 198, 48, 0.34)';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.hitRadius + CHAIN_LIGHTNING_JUMP_RANGE, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Live EDGE-TO-EDGE gap readouts between nearby enemy pairs (edge gap <= 240px)
  // Green = <= 200px edge gap (chains!), Red = > 200px (misses jump!)
  if (measured.length >= 2 && measured.length <= 10) {
    for (let i = 0; i < measured.length; i++) {
      for (let j = i + 1; j < measured.length; j++) {
        const a = measured[i];
        const b = measured[j];
        const centerDist = Math.hypot(b.x - a.x, b.y - a.y);
        const edgeGap = Math.max(0, centerDist - a.hitRadius - b.hitRadius);
        if (edgeGap > 240) continue;
        const inRange = edgeGap <= CHAIN_LIGHTNING_JUMP_RANGE;
        const ux = centerDist > 0.1 ? (b.x - a.x) / centerDist : 1;
        const uy = centerDist > 0.1 ? (b.y - a.y) / centerDist : 0;
        const ax = a.x + ux * a.hitRadius;
        const ay = a.y + uy * a.hitRadius;
        const bx = b.x - ux * b.hitRadius;
        const by = b.y - uy * b.hitRadius;

        ctx.strokeStyle = inRange ? 'rgba(45, 255, 122, 0.72)' : 'rgba(255, 70, 102, 0.55)';
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
        ctx.setLineDash([]);

        const mx = (ax + bx) * 0.5;
        const my = (ay + by) * 0.5;
        const txt = `${Math.round(edgeGap)}px`;
        ctx.fillStyle = 'rgba(2, 10, 20, 0.84)';
        ctx.fillRect(mx - 17, my - 6, 34, 11);
        ctx.fillStyle = inRange ? '#6dffaa' : '#ff8ca0';
        ctx.fillText(txt, mx, my + 3);
      }
    }
  }

  ctx.restore();
}

export function renderFrame(game) {
  const ctx = game.ctx;
  ctx.save();
  ctx.imageSmoothingEnabled = game.renderMode !== 'PIXEL';

  if (game.shake > 0) {
    const mag = game.shake * 14;
    ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
  }

  if (game.sandboxMode && game.sandboxHideBg) {
    ctx.fillStyle = '#02060d';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
  } else {
    drawBackground(ctx, game.stars, game.nexusGridOffset, game.renderMode === 'PIXEL');
  }

  if (game.sandboxMode && game.sandboxShowGrid && game.state !== 'MENU') {
    drawMeasurementGridUnderlay(ctx);
  }

  if (game.state === 'MENU') {
    for (const d of game.demoFleet) {
      drawEnemySprite(ctx, {
        type: d.type,
        x: d.x + Math.sin(game.clock * 1.1 + d.phase) * 22,
        y: d.y + Math.cos(game.clock * 1.5 + d.phase) * 8,
        hp: 3,
        maxHp: 3,
        hitFlash: 0,
        angle: 0
      }, game.clock, null, game.enemySkin);
    }
    const demoBank = Math.cos(game.clock * 1.25);
    drawAurexFighter(
      ctx,
      LOGICAL_W * 0.5 + Math.sin(game.clock * 1.25) * 82,
      LOGICAL_H - 64,
      false,
      false,
      false,
      game.clock,
      null,
      false,
      false,
      game.aurexSkin,
      { bankAxis: demoBank, thrustAxis: 0, animClip: demoBank < -0.22 ? 'bank_left' : (demoBank > 0.22 ? 'bank_right' : 'idle'), bankFrame: Math.min(3, Math.round(Math.abs(demoBank) * 3)) }
    );
    ctx.restore();
    return;
  }

  // 0) Crisp pixel-snapped Touhou Dodge Zone ceiling line (bottom 2/5ths of arena)
  ctx.save();
  const dzY = Math.round(PLAYER_MIN_Y);
  ctx.fillStyle = 'rgba(0, 246, 255, 0.24)';
  for (let dx = 12; dx < LOGICAL_W - 14; dx += 14) {
    ctx.fillRect(dx, dzY, 6, 1);
  }
  // Sharp arcade edge bracket markers [ ]
  ctx.fillStyle = 'rgba(0, 246, 255, 0.62)';
  ctx.fillRect(5, dzY - 5, 2, 11);
  ctx.fillRect(7, dzY - 5, 3, 1);
  ctx.fillRect(7, dzY + 5, 3, 1);
  ctx.fillRect(LOGICAL_W - 7, dzY - 5, 2, 11);
  ctx.fillRect(LOGICAL_W - 10, dzY - 5, 3, 1);
  ctx.fillRect(LOGICAL_W - 10, dzY + 5, 3, 1);
  ctx.restore();

  const isPixelPlayerFx = getAurexSkinMeta(game.aurexSkin).renderer !== 'ALPHA_VECTOR';
  const isPixelEnemyFx = getEnemySkinMeta(game.enemySkin).renderer !== 'ALPHA_VECTOR';

  // 1) Thread Trails + Null Thread shield durability pips (bound to active Enemy Skin!)
  for (const trail of game.threadTrails) {
    if (isPixelEnemyFx) {
      drawPixelThreadTrail(ctx, trail);
      continue;
    }
    const isNull = trail.variant === 'NULL';
    for (const seg of trail.segments) {
      const alpha = clamp(seg.life / 0.55, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      const col = trail.flashTimer > 0
        ? (isNull ? '#ff5c7c' : '#72f9ff')
        : (isNull ? COLORS.nullRed : COLORS.cyan);
      ctx.strokeStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = trail.flashTimer > 0 ? 12 : 10;
      ctx.lineWidth = isNull ? 4.6 : 3.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x2, seg.y2);
      ctx.stroke();

      ctx.strokeStyle = isNull ? (trail.flashTimer > 0 ? '#ffc8d6' : '#ffe6ec') : '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x2, seg.y2);
      ctx.stroke();
      ctx.restore();
    }

    if (isNull && trail.hitsRemaining < trail.maxHits && trail.segments.length > 0) {
      const midSeg = trail.segments[Math.floor(trail.segments.length / 2)];
      const mx = (midSeg.x1 + midSeg.x2) * 0.5;
      const my = (midSeg.y1 + midSeg.y2) * 0.5 - 12;
      const pipW = 4;
      const pipGap = 2;
      const totalW = trail.maxHits * pipW + (trail.maxHits - 1) * pipGap;
      const startX = mx - totalW * 0.5;
      ctx.save();
      for (let p = 0; p < trail.maxHits; p++) {
        ctx.fillStyle = p < trail.hitsRemaining ? COLORS.nullRed : 'rgba(255, 255, 255, 0.18)';
        ctx.fillRect(startX + p * (pipW + pipGap), my, pipW, 3);
      }
      ctx.restore();
    }
  }

  // 2) Square Pixelated Power-Up Capsules (floating in mid-arena; shoot to break & activate)
  for (const cap of game.capsules) {
    const timeLeft = cap.maxLife - cap.age;
    const blinkHide = timeLeft < 3.0 && Math.floor(game.clock * 14) % 2 === 0;
    if (blinkHide) continue;

    // Extra radiant halo for Master 10-kill streak glowing reward capsules!
    if (cap.glowReward) {
      const rewardCol = cap.type === 'CYAN' ? COLORS.cyan : COLORS.nullRed;
      const pulse = 0.8 + Math.sin(game.clock * 10) * 0.2;
      ctx.save();
      const rg = ctx.createRadialGradient(cap.x, cap.y, 4, cap.x, cap.y, 28 * pulse);
      rg.addColorStop(0, cap.type === 'CYAN' ? 'rgba(180, 255, 255, 0.52)' : 'rgba(255, 160, 180, 0.52)');
      rg.addColorStop(0.55, cap.type === 'CYAN' ? 'rgba(0, 246, 255, 0.25)' : 'rgba(255, 30, 66, 0.25)');
      rg.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(cap.x, cap.y, 28 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.shadowColor = rewardCol;
      ctx.shadowBlur = 16;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cap.x, cap.y, 21 + pulse * 3, game.clock * 4, game.clock * 4 + Math.PI * 1.4);
      ctx.stroke();
      ctx.restore();
    }

    drawPixelCapsule(ctx, cap.x, cap.y, cap.type, game.clock, cap.glowReward ? 1.18 : 1.08);

    // Corner targeting reticle showing capsule is shootable
    const col = cap.type === 'CYAN'
      ? COLORS.cyan
      : (cap.type === 'PURPLE'
        ? COLORS.purpleBright
        : (cap.type === 'YELLOW'
          ? COLORS.yellow
          : (cap.type === 'PLASMA'
            ? COLORS.centophageAcid
            : (cap.type === 'CLONE' ? COLORS.clonePurple : COLORS.nullRed))));
    const r = 17 + Math.sin(game.clock * 6) * 2;
    const arm = 5;
    ctx.save();
    ctx.strokeStyle = col;
    ctx.globalAlpha = 0.72;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cap.x - r, cap.y - r + arm); ctx.lineTo(cap.x - r, cap.y - r); ctx.lineTo(cap.x - r + arm, cap.y - r);
    ctx.moveTo(cap.x + r - arm, cap.y - r); ctx.lineTo(cap.x + r, cap.y - r); ctx.lineTo(cap.x + r, cap.y - r + arm);
    ctx.moveTo(cap.x - r, cap.y + r - arm); ctx.lineTo(cap.x - r, cap.y + r); ctx.lineTo(cap.x - r + arm, cap.y + r);
    ctx.moveTo(cap.x + r - arm, cap.y + r); ctx.lineTo(cap.x + r, cap.y + r); ctx.lineTo(cap.x + r, cap.y + r - arm);
    ctx.stroke();
    ctx.restore();
  }

  // 3) Tractor Beam cone visual (V1 Enforcer — bound to active Enemy Skin!)
  for (const e of game.enemies) {
    if (e.state === 'BEAMING') {
      if (isPixelEnemyFx) {
        drawPixelTractorBeam(ctx, e, game.clock, game.player.capturedById === e.id);
      } else {
        drawTractorBeam(ctx, e, game.clock, game.player.capturedById === e.id);
      }
    }
  }

  // 4) Captured Fighter (spins while being tractor-lifted; matches active Aurex skin!)
  if (game.capturedFighter) {
    ctx.save();
    ctx.translate(Math.round(game.capturedFighter.x), Math.round(game.capturedFighter.y));
    if (game.capturedFighter.spin) ctx.rotate(game.capturedFighter.spin);
    drawAurexFighter(
      ctx,
      0,
      0,
      false,
      false,
      true,
      game.clock,
      null,
      false,
      false,
      game.aurexSkin,
      { bankAxis: 0, thrustAxis: 0, animClip: 'idle', bankFrame: 0 }
    );
    ctx.restore();
  }

  // 4b) V1 Enforcer Synergy Death AOE Enemy Buff Shockwaves (bound to Enemy Skin!)
  for (const bw of game.enemyBuffWaves) {
    if (isPixelEnemyFx) {
      drawPixelBuffWave(ctx, bw);
      continue;
    }
    const alpha = clamp(bw.life / bw.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha * 0.85;
    ctx.strokeStyle = bw.color;
    ctx.shadowColor = bw.color;
    ctx.shadowBlur = 16;
    ctx.lineWidth = 3.5 * alpha + 1;
    ctx.beginPath();
    ctx.arc(bw.x, bw.y, bw.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = bw.color === COLORS.cyan ? 'rgba(0, 246, 255, 0.14)' : 'rgba(255, 30, 66, 0.14)';
    ctx.fill();
    ctx.restore();
  }

  // 5) Enemies + Tractor Capacitor Shield ring & fixed drop-lane telegraph during BEAM_APPROACH
  // First draw subtle predatory hunt lock-lines for any Master Centophage chasing an entity!
  if (game.centoidChains && game.centoidChains.size > 0) {
    for (const chain of game.centoidChains.values()) {
      if (!chain.isCentophage || chain.chaseTargetId === null) continue;
      const head = game.enemies.find(e => e.isCentoid && e.centoidChainId === chain.chainId && e.isCentoidHead);
      const prey = game.enemies.find(e => e.id === chain.chaseTargetId && !e.isCentoid);
      if (!head || !prey) continue;
      ctx.save();
      ctx.strokeStyle = 'rgba(204, 255, 0, 0.45)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(head.x, head.y);
      ctx.lineTo(prey.x, prey.y);
      ctx.stroke();
      ctx.setLineDash([]);
      // Pulsing parasitic lock ring on targeted prey
      const lockR = (prey.hitRadius || 16) + 4 + Math.sin(game.clock * 14) * 2;
      ctx.strokeStyle = COLORS.centophageAcid;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(prey.x, prey.y, lockR, game.clock * 4, game.clock * 4 + Math.PI * 1.35);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Draw Centoid heads in a second pass so weak-point heads always sit cleanly on top of body segments
  const enemyAnimTime = (game.sandboxMode && game.sandboxPauseAnim) ? 0 : game.clock;
  const centoidHeads = [];
  for (const e of game.enemies) {
    if (e.isCentoid && e.isCentoidHead) {
      centoidHeads.push(e);
      continue;
    }
    if (e.state === 'BEAM_APPROACH') {
      ctx.save();
      const lx = e.beamTargetX;
      ctx.strokeStyle = 'rgba(0, 246, 255, 0.28)';
      ctx.setLineDash([5, 6]);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(lx, TRACTOR_BEAM_Y);
      ctx.lineTo(lx, LOGICAL_H - 28);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(0, 255, 170, 0.45)';
      ctx.beginPath();
      ctx.ellipse(lx, LOGICAL_H - 54, 34, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    drawEnemySprite(ctx, e, enemyAnimTime, null, game.enemySkin);
    if ((e.fireDisabledTimer || 0) > 0) {
      drawEnemyFireDisabledSparks(ctx, e, game.clock, isPixelEnemyFx);
    }
    if (e.state === 'BEAM_APPROACH' && e.beamShield > 0) {
      ctx.save();
      ctx.strokeStyle = COLORS.cyan;
      ctx.shadowColor = COLORS.cyan;
      ctx.shadowBlur = 12;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(e.x, e.y, 25, game.clock * 4, game.clock * 4 + Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
  for (const head of centoidHeads) {
    drawEnemySprite(ctx, head, enemyAnimTime, null, game.enemySkin);
    if ((head.fireDisabledTimer || 0) > 0) {
      drawEnemyFireDisabledSparks(ctx, head, game.clock, isPixelEnemyFx);
    }
  }

  // 6) Enforcer Wings
  for (const ew of game.enforcerWings) {
    drawEnforcerWingSprite(ctx, ew, game.enemySkin, enemyAnimTime);
  }

  // 7) Piercing Continuous Red Laser Beams (slices through enemies; blocked/refracted by Threads)
  const vibAmp = game.player.vibrateAmp || 0;
  const vibX = vibAmp > 0 ? (Math.random() - 0.5) * 2 * vibAmp : 0;
  const vibY = vibAmp > 0 ? (Math.random() - 0.5) * 2 * vibAmp : 0;

  if (game.redLaserActive && game.activeLaserBeams.length > 0 && game.player.alive && !game.player.capturedById) {
    for (const beam of game.activeLaserBeams) {
      if (isPixelPlayerFx) {
        drawPixelRedLaserBeam(ctx, beam, game.player.x, game.player.y, game.clock);
        continue;
      }
      const bx = game.player.x + beam.offsetX;
      const by1 = game.player.y - 16;
      const by2 = beam.y2;

      ctx.save();
      const pulseW = 10 + Math.sin(game.clock * 48) * 1.8;
      // Outer crimson neon bloom
      ctx.strokeStyle = 'rgba(255, 30, 66, 0.42)';
      ctx.shadowColor = COLORS.nullRed;
      ctx.shadowBlur = 22;
      ctx.lineWidth = pulseW;
      ctx.lineCap = 'butt';
      ctx.beginPath();
      ctx.moveTo(bx, by1);
      ctx.lineTo(bx, by2);
      ctx.stroke();

      // Solid neon crimson beam body
      ctx.strokeStyle = '#ff385c';
      ctx.lineWidth = 4.8;
      ctx.beginPath();
      ctx.moveTo(bx, by1);
      ctx.lineTo(bx, by2);
      ctx.stroke();

      // Razor-sharp white plasma core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(bx, by1);
      ctx.lineTo(bx, by2);
      ctx.stroke();

      // Clean muzzle glow at fighter nose
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bx, by1, 4.8, 0, Math.PI * 2);
      ctx.fill();

      // Thread stop / refraction flare (crimson on Null Thread, cyan on Flux Thread)
      if (beam.hit) {
        ctx.fillStyle = beam.hitColor || COLORS.nullRed;
        ctx.beginPath();
        ctx.arc(bx, by2, 8 + Math.sin(game.clock * 55) * 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bx, by2, 3.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // 8) One-time crisp white text prompt centered cleanly between the Sector Banner bottom (328) & dotted line (384)
  //    (Fades over 1.5s once the player touches anywhere below; never reappears on game restarts!)
  if (
    !game.desktopMode &&
    (game.touchHintState === 'GLOWING' || game.touchHintState === 'FADING') &&
    game.player.alive &&
    !game.player.capturedById
  ) {
    const fade = game.touchHintState === 'FADING' ? clamp(game.touchHintTimer / TOUCH_HINT_DURATION, 0, 1) : 1;
    const pulse = 0.84 + Math.sin(game.clock * 4.5) * 0.16;
    const bannerBottomY = LOGICAL_H * 0.41 + 66; // 328.4
    const promptY = (bannerBottomY + PLAYER_MIN_Y) * 0.5; // ~356 — dead center between banner & dotted line!
    ctx.save();
    ctx.globalAlpha = fade * (game.touchHintState === 'FADING' ? 0.95 : pulse);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 10px ${FONT_ARCADE_UI}`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.72)';
    ctx.shadowBlur = 9;
    ctx.fillText('TOUCH ANYWHERE BELOW TO MOVE', LOGICAL_W * 0.5, promptY);
    ctx.restore();
  }

  // 9) Fighter Clones (hologram squadmates — tethered 0.8s left/right/back, then autonomous!)
  if (game.fighterClones && game.fighterClones.length > 0) {
    for (const cl of game.fighterClones) {
      if (!cl.detached && game.player.alive) {
        ctx.save();
        ctx.strokeStyle = 'rgba(138, 61, 255, 0.52)';
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(game.player.x, game.player.y);
        ctx.lineTo(cl.x, cl.y);
        ctx.stroke();
        ctx.restore();
      }
      drawFighterClone(ctx, cl, game.clock, game.aurexSkin);
    }
  }

  // 9b) Player Ship (White default; power-up color when 1 active; moving RGB wave when 2+ stacked; vibration + cannon overcharge!)
  if (game.player.alive && !game.player.capturedById) {
    const aw = game.arcWaveState;
    const isCannonCharging = aw.phase === 'CANNON_CHARGING';
    const hasPurpleAura = isCannonCharging || aw.phase === 'CANNON_READY' || aw.auraFade > 0;
    const activePowerups = getActivePowerups(game);
    const px = game.player.x + vibX;
    const py = game.player.y + vibY;
    drawAurexFighter(
      ctx,
      px,
      py,
      game.player.dual,
      game.player.invulnTimer > 0,
      game.player.slowTimer > 0,
      game.clock,
      activePowerups,
      hasPurpleAura,
      isCannonCharging,
      game.aurexSkin,
      game.player
    );

    // White Electric Shock Aura (Pulsar Electro Ball Fire Jam OR Pulsar Death Spark — bound to Enemy Skin!)
    if (game.player.fireJamTimer > 0 || game.player.sparkSlowTimer > 0) {
      const isJam = game.player.fireJamTimer > 0;
      if (isPixelEnemyFx) {
        drawPixelShipShockAura(ctx, px, py, game.player.dual, isJam, game.clock);
      } else {
        const shockR = game.player.dual ? 31 : 22;
        ctx.save();
        const grad = ctx.createRadialGradient(px, py, 3, px, py, shockR + 10);
        grad.addColorStop(0, isJam ? 'rgba(255, 255, 255, 0.42)' : 'rgba(255, 255, 255, 0.28)');
        grad.addColorStop(0.65, 'rgba(220, 240, 255, 0.18)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, shockR + 10, 0, Math.PI * 2);
        ctx.fill();

        // Crackling white electric arcs dancing around ship perimeter
        ctx.strokeStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 14;
        ctx.lineWidth = isJam ? 2.0 : 1.5;
        const bolts = isJam ? 5 : 4;
        for (let k = 0; k < bolts; k++) {
          const a0 = game.clock * (isJam ? 7.5 : 4.5) + (k / bolts) * Math.PI * 2;
          const a1 = a0 + 0.95;
          const am = (a0 + a1) * 0.5;
          const rMid = shockR + (Math.sin(game.clock * 48 + k * 2.7) * 5);
          ctx.beginPath();
          ctx.moveTo(px + Math.cos(a0) * shockR, py + Math.sin(a0) * shockR);
          ctx.lineTo(px + Math.cos(am) * rMid, py + Math.sin(am) * rMid);
          ctx.lineTo(px + Math.cos(a1) * shockR, py + Math.sin(a1) * shockR);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // Small compact on-field Cannon Shot auto-fire timer indicator during CANNON_CHARGING (or ready prompt)
    if (isCannonCharging) {
      const ratio = clamp(aw.cannonTimer / CANNON_AUTO_FIRE_DELAY, 0, 1);
      const ix = Math.round(game.player.x);
      const iy = Math.round(Math.min(LOGICAL_H - 12, game.player.y + 24));
      const bw = 48;
      const bx = Math.round(ix - bw * 0.5);
      const fillW = Math.round(bw * ratio);
      ctx.save();
      ctx.fillStyle = '#06020e';
      ctx.fillRect(bx - 2, iy - 2, bw + 4, 8);
      ctx.fillStyle = COLORS.purpleBright;
      ctx.fillRect(bx - 1, iy - 1, bw + 2, 1);
      ctx.fillRect(bx - 1, iy + 5, bw + 2, 1);
      ctx.fillRect(bx - 1, iy, 1, 5);
      ctx.fillRect(bx + bw, iy, 1, 5);
      ctx.fillStyle = '#e89eff';
      ctx.fillRect(bx, iy, fillW, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, iy, fillW, 2);

      ctx.textAlign = 'center';
      ctx.font = `700 8px ${FONT_ARCADE_UI}`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`TAP // ${aw.cannonTimer.toFixed(1)}s`, ix, iy + 16);
      ctx.restore();
    } else if (aw.phase === 'CANNON_READY') {
      const ix = game.player.x;
      const iy = Math.min(LOGICAL_H - 8, game.player.y + 28);
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = `700 7.8px ${FONT_ARCADE_UI}`;
      ctx.fillStyle = COLORS.purpleBright;
      ctx.shadowColor = COLORS.purple;
      ctx.shadowBlur = 8;
      ctx.globalAlpha = 0.72 + Math.sin(game.clock * 10) * 0.28;
      ctx.fillText('2x TAP CANNON', ix, iy);
      ctx.restore();
    }

    // Plasma Rings 360-degree Guided Aim Line + Shield Bubble while aiming/firing,
    // and smooth 0.5s fading post-fire invincibility shield (non-blinking!) right after firing!
    if (game.plasmaRingState && (game.plasmaRingState.phase === 'AIMING' || game.plasmaRingState.phase === 'FIRING')) {
      drawPlasmaAimGuide(ctx, game.player, game.plasmaRingState, game.clock, isPixelPlayerFx);
    } else if ((game.player.plasmaShieldTimer || 0) > 0) {
      const fadeRatio = clamp(game.player.plasmaShieldTimer / 0.5, 0, 1);
      drawPlasmaShieldBubble(ctx, game.player, game.clock, isPixelPlayerFx, fadeRatio);
    }
  }

  // 10) Wider Purple Arc Waves (bound to active Ship Skin!)
  for (const w of game.arcWaves) {
    if (isPixelPlayerFx) {
      drawPixelArcWave(ctx, w, game.clock);
      continue;
    }
    ctx.save();
    ctx.strokeStyle = COLORS.purple;
    ctx.shadowColor = COLORS.purple;
    ctx.shadowBlur = 18;
    ctx.lineWidth = 6.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(w.x, w.y + w.radius * 0.52, w.radius, Math.PI * 1.14, Math.PI * 1.86);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(w.x, w.y + w.radius * 0.52, w.radius - 2, Math.PI * 1.18, Math.PI * 1.82);
    ctx.stroke();
    ctx.restore();
  }

  // Purple Cannon Shots (bound to active Ship Skin!)
  for (const c of game.cannonShots) {
    if (isPixelPlayerFx) {
      drawPixelCannonShot(ctx, c, game.clock);
      continue;
    }
    ctx.save();
    if (c.trail.length > 1) {
      ctx.strokeStyle = 'rgba(196, 77, 255, 0.7)';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(c.trail[0].x, c.trail[0].y);
      for (let k = 1; k < c.trail.length; k++) ctx.lineTo(c.trail[k].x, c.trail[k].y);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = COLORS.purple;
    ctx.shadowColor = COLORS.purple;
    ctx.shadowBlur = 22;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Large Purple AOE Explosion Shockwaves (bound to active Ship Skin!)
  for (const bl of game.aoeBlasts) {
    if (isPixelPlayerFx) {
      drawPixelAoeBlast(ctx, bl);
      continue;
    }
    const alpha = clamp(bl.life / bl.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    const grad = ctx.createRadialGradient(bl.x, bl.y, bl.radius * 0.15, bl.x, bl.y, bl.radius);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
    grad.addColorStop(0.5, 'rgba(196, 77, 255, 0.36)');
    grad.addColorStop(1, 'rgba(196, 77, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(bl.x, bl.y, bl.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = COLORS.purpleBright;
    ctx.shadowColor = COLORS.purple;
    ctx.shadowBlur = 18;
    ctx.lineWidth = 4 * alpha + 1;
    ctx.beginPath();
    ctx.arc(bl.x, bl.y, bl.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 10b) Yellow Chain Lightning Arcs (bound to active Ship Skin!)
  if (game.lightningBolts && game.lightningBolts.length > 0) {
    for (const bolt of game.lightningBolts) {
      if (isPixelPlayerFx) {
        drawPixelChainLightning(ctx, bolt);
        continue;
      }
      const alpha = clamp(bolt.life / Math.max(0.01, bolt.maxLife), 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let si = 0; si < bolt.segments.length; si++) {
        const pts = bolt.segments[si];
        if (pts.length < 2) continue;
        const wScale = (bolt.branchStartIdx !== undefined && si >= bolt.branchStartIdx) ? 0.58 : 1.0;
        // Outer golden-orange electric bloom
        ctx.strokeStyle = COLORS.yellowOrange;
        ctx.shadowColor = COLORS.yellow;
        ctx.shadowBlur = 18 * wScale;
        ctx.lineWidth = (5.4 * alpha + 1.4) * wScale;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
        ctx.stroke();

        // Crisp neon yellow inner arc
        ctx.strokeStyle = COLORS.yellow;
        ctx.lineWidth = (2.8 * alpha + 0.8) * wScale;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
        ctx.stroke();

        // White-hot plasma core
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.3 * wScale;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // 10c) Full-Screen Death Cross Lightning (copied across BOTH 32-Bit AND Alpha Test skins!)
  if (game.deathCrossLightnings && game.deathCrossLightnings.length > 0) {
    for (const cl of game.deathCrossLightnings) {
      drawDeathCrossLightning(ctx, cl, game.clock);
    }
  }

  // 10d) Piercing Ricocheting Plasma Rings (slightly larger than Pulsar electro balls; 32-Bit & Alpha Test!)
  if (game.plasmaRings && game.plasmaRings.length > 0) {
    for (const ring of game.plasmaRings) {
      if (isPixelPlayerFx) {
        drawPixelPlasmaRing(ctx, ring, game.clock);
        continue;
      }
      ctx.save();
      if (ring.trail && ring.trail.length > 1) {
        for (let k = 0; k < ring.trail.length; k += 2) {
          const frac = (k + 1) / ring.trail.length;
          ctx.globalAlpha = frac * 0.34;
          ctx.strokeStyle = k % 4 === 0 ? COLORS.centophagePurple : '#2dff7a';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.arc(ring.trail[k].x, ring.trail[k].y, ring.radius * (0.76 + frac * 0.24), 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      // Translucent dark-purple interior aura + outer purple containment + acid green plasma ring + yellow orbit sparks
      ctx.fillStyle = 'rgba(37, 23, 102, 0.24)';
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius - 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = COLORS.centophagePurple;
      ctx.shadowColor = COLORS.centophageViolet;
      ctx.shadowBlur = 16;
      ctx.lineWidth = 6.2;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#2dff7a';
      ctx.shadowColor = COLORS.centophageAcid;
      ctx.shadowBlur = 14;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius - 0.5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#f2ffaa';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius - 2.2, 0, Math.PI * 2);
      ctx.stroke();

      for (let k = 0; k < 3; k++) {
        const a = (ring.spin || game.clock * 8) * 1.4 + (k * Math.PI * 2) / 3;
        const sx = ring.x + Math.cos(a) * ring.radius;
        const sy = ring.y + Math.sin(a) * ring.radius;
        ctx.fillStyle = COLORS.yellow;
        ctx.shadowColor = COLORS.yellow;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(sx, sy, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // 11) Regular White, Refracted Red Laser Bolts, Ricocheted Bolts, Clone Dark-Purple Bolts & Purple Player Bullets (bound to Ship Skin!)
  for (const b of game.playerBullets) {
    if (isPixelPlayerFx) {
      drawPixelPlayerBullet(ctx, b, game.clock);
      continue;
    }
    ctx.save();
    if (b.ricochet) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = COLORS.yellow;
      ctx.shadowColor = COLORS.yellow;
      ctx.shadowBlur = 14;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      continue;
    }
    if (b.slowedByFlux && b.dissolveMax > 0) {
      ctx.globalAlpha = clamp(b.dissolveTimer / 0.65, 0.18, 1);
    }
    const isRedBolt = !!b.redLaserBullet;
    const isCloneBolt = !!b.cloneBolt;
    const col = isRedBolt
      ? (b.weakened ? '#ff7c92' : COLORS.nullRed)
      : (isCloneBolt
        ? '#7d38ff'
        : (b.purple
          ? (b.weakened ? '#d96bff' : COLORS.purpleBright)
          : (b.weakened ? '#ff8ea0' : '#ffffff')));
    ctx.strokeStyle = col;
    ctx.shadowColor = isRedBolt
      ? COLORS.nullRed
      : (isCloneBolt ? COLORS.clonePurple : (b.purple ? COLORS.purple : (b.weakened ? COLORS.nullRed : '#ffffff')));
    ctx.shadowBlur = isRedBolt ? 14 : (isCloneBolt ? 14 : (b.purple ? 13 : 10));
    ctx.lineWidth = isRedBolt ? 4.0 : (isCloneBolt ? 3.8 : (b.purple ? 3.4 : (b.weakened ? 2.4 : 3)));
    const halfLen = isRedBolt ? 10 : (isCloneBolt ? 11 : (b.purple ? 9 : 7));
    ctx.beginPath();
    ctx.moveTo(b.x, b.y - halfLen);
    ctx.lineTo(b.x, b.y + halfLen);
    ctx.stroke();

    if (isRedBolt || isCloneBolt) {
      ctx.strokeStyle = isCloneBolt ? '#e0cbff' : '#ffffff';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y - (halfLen - 2));
      ctx.lineTo(b.x, b.y + (halfLen - 2));
      ctx.stroke();
    }

    if (b.slowedByFlux) {
      const lifeRatio = b.dissolveMax > 0 ? clamp(b.dissolveTimer / b.dissolveMax, 0.25, 1) : 1;
      ctx.strokeStyle = 'rgba(0, 246, 255, 0.85)';
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4 + lifeRatio * 3.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Cyan Homing Missiles (bound to active Ship Skin!)
  for (const m of game.homingMissiles) {
    if (isPixelPlayerFx) {
      drawPixelHomingMissile(ctx, m, game.clock);
      continue;
    }
    ctx.save();
    // Smooth tapered glowing contrail
    const tLen = m.trail.length;
    if (tLen > 1) {
      ctx.lineCap = 'round';
      for (let k = 1; k < tLen; k++) {
        const frac = k / (tLen - 1);
        ctx.strokeStyle = frac > 0.72
          ? `rgba(210, 255, 255, ${0.25 + frac * 0.65})`
          : `rgba(0, 246, 255, ${frac * 0.65})`;
        ctx.lineWidth = 0.8 + frac * 3.2;
        ctx.beginPath();
        ctx.moveTo(m.trail[k - 1].x, m.trail[k - 1].y);
        ctx.lineTo(m.trail[k].x, m.trail[k].y);
        ctx.stroke();
      }
    }

    ctx.translate(m.x, m.y);
    ctx.rotate(m.angle + Math.PI / 2);
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 12;

    // Flickering cyan-white thruster plume at the rear nozzle
    const flameLen = 4.5 + Math.sin(game.clock * 70 + m.x) * 2.2;
    ctx.fillStyle = COLORS.cyan;
    ctx.beginPath();
    ctx.moveTo(-2.1, 5.5);
    ctx.lineTo(0, 5.5 + flameLen);
    ctx.lineTo(2.1, 5.5);
    ctx.closePath();
    ctx.fill();

    // Rear angled stabilizer fins
    ctx.fillStyle = COLORS.cyan;
    ctx.beginPath();
    ctx.moveTo(-2.2, 2.2);
    ctx.lineTo(-5.0, 5.8);
    ctx.lineTo(-2.0, 5.2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(2.2, 2.2);
    ctx.lineTo(5.0, 5.8);
    ctx.lineTo(2.0, 5.2);
    ctx.closePath();
    ctx.fill();

    // Torpedo fuselage body (cylindrical rocket with curved warhead nose)
    ctx.fillStyle = '#072a42';
    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -8.5);
    ctx.quadraticCurveTo(2.7, -5.2, 2.5, -1.5);
    ctx.lineTo(2.4, 5.2);
    ctx.lineTo(-2.4, 5.2);
    ctx.lineTo(-2.5, -1.5);
    ctx.quadraticCurveTo(-2.7, -5.2, 0, -8.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing white warhead tip & neon core band
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -8.2);
    ctx.quadraticCurveTo(1.7, -5.6, 1.6, -3.5);
    ctx.lineTo(-1.6, -3.5);
    ctx.quadraticCurveTo(-1.7, -5.6, 0, -8.2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#9efcff';
    ctx.fillRect(-1.1, -1.2, 2.2, 4.4);
    ctx.restore();
  }

  // Pulsar Leaf-Falling Yellow Electro Balls (bound to active Enemy Skin!)
  if (game.electroBalls && game.electroBalls.length > 0) {
    for (const eb of game.electroBalls) {
      if (isPixelEnemyFx) {
        drawPixelElectroBall(ctx, eb, game.clock);
        continue;
      }
      ctx.save();
      ctx.translate(eb.x, eb.y);
      const pulse = 0.88 + Math.sin(game.clock * 22 + eb.phase) * 0.12;
      const r = (eb.radius || 13) * pulse;
      const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, r + 6);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      grad.addColorStop(0.45, 'rgba(255, 230, 64, 0.85)');
      grad.addColorStop(0.78, 'rgba(255, 158, 27, 0.42)');
      grad.addColorStop(1, 'rgba(255, 158, 27, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = COLORS.yellow;
      ctx.shadowColor = COLORS.yellow;
      ctx.shadowBlur = 14;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
      ctx.stroke();

      // Crackling white internal lightning filaments
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.25;
      for (let k = 0; k < 3; k++) {
        const a = game.clock * 9 + eb.phase + (k * Math.PI * 2) / 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a + 0.35) * r * 0.55, Math.sin(a + 0.35) * r * 0.55);
        ctx.lineTo(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // Pulsar Death Sparks (bound to active Enemy Skin!)
  if (game.pulsarSparks && game.pulsarSparks.length > 0) {
    for (const sp of game.pulsarSparks) {
      if (isPixelEnemyFx) {
        drawPixelPulsarSpark(ctx, sp);
        continue;
      }
      ctx.save();
      if (sp.trail.length > 1) {
        ctx.lineCap = 'round';
        for (let k = 1; k < sp.trail.length; k++) {
          const frac = k / (sp.trail.length - 1);
          ctx.strokeStyle = frac > 0.65
            ? `rgba(255, 255, 255, ${0.4 + frac * 0.6})`
            : `rgba(255, 230, 64, ${frac * 0.85})`;
          ctx.lineWidth = 1.2 + frac * 2.6;
          ctx.beginPath();
          ctx.moveTo(sp.trail[k - 1].x, sp.trail[k - 1].y);
          ctx.lineTo(sp.trail[k].x, sp.trail[k].y);
          ctx.stroke();
        }
      }
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = COLORS.yellow;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Enemy Bullets (bound to active Enemy Skin!)
  for (const eb of game.enemyBullets) {
    if (isPixelEnemyFx) {
      drawPixelEnemyBullet(ctx, eb, game.clock);
      continue;
    }
    ctx.save();
    ctx.fillStyle = eb.color;
    ctx.shadowColor = eb.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(eb.x, eb.y, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 12) Animated PixelLab One-Shot VFX, 32-Bit Pixel Fireballs, Subtle Power-Up Sync FX & Shrapnel
  renderSpriteEffects(ctx, game);
  renderPixelExplosions(ctx, game.pixelExplosions);
  renderPowerupPickupFx(ctx, game.powerupFx, game.player, game.clock);
  for (const pt of game.particles) {
    if (pt.isPixel) {
      drawPixelShrapnelParticle(ctx, pt);
      continue;
    }
    ctx.save();
    ctx.globalAlpha = clamp(pt.life / pt.maxLife, 0, 1);
    ctx.translate(pt.x, pt.y);
    ctx.rotate(pt.rot);
    ctx.strokeStyle = pt.color;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(-pt.size * 0.5, -pt.size * 0.5, pt.size, pt.size);
    ctx.restore();
  }

  // Floating Score & Combat Popups (authentic 32-bit arcade bitmap text with crisp black outline!)
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = `400 10px ${FONT_ARCADE_UI}`;
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2.6;
  for (const pop of game.popups) {
    ctx.globalAlpha = clamp(pop.life / pop.maxLife, 0, 1);
    const px = Math.round(pop.x);
    const py = Math.round(pop.y);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(2, 6, 13, 0.94)';
    ctx.strokeText(pop.text, px, py);
    ctx.fillStyle = pop.color;
    ctx.shadowColor = pop.color;
    ctx.shadowBlur = 6;
    ctx.fillText(pop.text, px, py);
  }
  ctx.restore();

  // 13) Hard Mode Cyan / Red CRT Field Debuff Visual Overlay (balanced exposure for full readability)
  if (game.fieldDebuff && (game.fieldDebuff.indefinite || game.fieldDebuff.timer > 0)) {
    const fd = game.fieldDebuff;
    const isCyanField = fd.type === 'CYAN';
    const fadeOut = fd.indefinite ? 1 : clamp(fd.timer / 0.6, 0, 1);
    const flicker = 0.86 + Math.sin(game.clock * 34) * 0.08 + Math.cos(game.clock * 15) * 0.04;
    const intensity = fadeOut * flicker;

    ctx.save();
    // Balanced phosphor screen tint + CRT edge vignette (keeps center playfield crisp)
    const vig = ctx.createRadialGradient(
      LOGICAL_W * 0.5, LOGICAL_H * 0.5, LOGICAL_W * 0.22,
      LOGICAL_W * 0.5, LOGICAL_H * 0.5, LOGICAL_H * 0.65
    );
    if (isCyanField) {
      vig.addColorStop(0, `rgba(0, 165, 255, ${0.035 * intensity})`);
      vig.addColorStop(0.65, `rgba(0, 120, 255, ${0.11 * intensity})`);
      vig.addColorStop(1, `rgba(0, 246, 255, ${0.26 * intensity})`);
    } else {
      vig.addColorStop(0, `rgba(255, 24, 58, ${0.04 * intensity})`);
      vig.addColorStop(0.65, `rgba(210, 10, 40, ${0.12 * intensity})`);
      vig.addColorStop(1, `rgba(255, 30, 66, ${0.28 * intensity})`);
    }
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    // Subtle animated CRT scanlines
    ctx.fillStyle = isCyanField
      ? `rgba(0, 225, 255, ${0.065 * intensity})`
      : `rgba(255, 35, 72, ${0.07 * intensity})`;
    const scanOffset = Math.floor((game.clock * 42) % 6);
    for (let sy = scanOffset; sy < LOGICAL_H; sy += 6) {
      ctx.fillRect(0, sy, LOGICAL_W, 1.5);
    }

    // Soft rolling CRT interference bar
    const rollY = ((game.clock * 165) % (LOGICAL_H + 80)) - 40;
    const rollGrad = ctx.createLinearGradient(0, rollY - 22, 0, rollY + 22);
    const barRgb = isCyanField ? '0, 246, 255' : '255, 30, 66';
    rollGrad.addColorStop(0, `rgba(${barRgb}, 0)`);
    rollGrad.addColorStop(0.5, `rgba(${barRgb}, ${0.11 * intensity})`);
    rollGrad.addColorStop(1, `rgba(${barRgb}, 0)`);
    ctx.fillStyle = rollGrad;
    ctx.fillRect(0, rollY - 22, LOGICAL_W, 44);

    // Pulsing CRT border frame
    ctx.strokeStyle = isCyanField ? COLORS.cyan : COLORS.nullRed;
    ctx.shadowColor = isCyanField ? COLORS.cyan : COLORS.nullRed;
    ctx.shadowBlur = 12;
    ctx.globalAlpha = 0.54 * intensity;
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, LOGICAL_W - 3, LOGICAL_H - 3);
    ctx.restore();
  }

  // 13b) Glowing Green + Dark Purple + Yellow Arena Containment Border (Plasma Rings 8s timer!)
  if (game.plasmaRingState && game.plasmaRingState.borderActive) {
    drawPlasmaArenaBorder(ctx, game.plasmaRingState, game.clock, isPixelPlayerFx, !!game.sandboxMode);
  }

  // 13c) Challenge Extra Round 20s Serpent Escape Countdown Pill
  if (
    game.isChallengeStage &&
    game.sectorPhase === 'CHALLENGE' &&
    (game.challengeSerpentTimer > 0 || game.challengeSerpentEscaping)
  ) {
    ctx.save();
    const hasPlasmaPill = !!(game.plasmaRingState && game.plasmaRingState.borderActive);
    const pillY = hasPlasmaPill ? (game.sandboxMode ? 55 : 29) : (game.sandboxMode ? 36 : 10);
    const pillW = 178;
    const pillX = Math.round(LOGICAL_W * 0.5 - pillW * 0.5);
    const left = Math.max(0, game.challengeSerpentTimer || 0);
    const maxT = Math.max(1, game.challengeSerpentMax || 20);
    const ratio = clamp(left / maxT, 0, 1);
    const escaping = !!game.challengeSerpentEscaping;
    const critical = escaping || left < 4.0;
    const warning = !critical && left < 8.0;
    const col = critical ? COLORS.nullRed : (warning ? COLORS.amber : COLORS.centoidGreen);
    const blink = critical ? (0.58 + 0.42 * Math.abs(Math.sin(game.clock * 16))) : 1;

    ctx.globalAlpha = 0.94 * blink;
    ctx.fillStyle = 'rgba(6, 12, 24, 0.9)';
    ctx.fillRect(pillX, pillY, pillW, 17);
    ctx.fillStyle = col;
    ctx.fillRect(pillX, pillY, pillW, 1);
    ctx.fillRect(pillX, pillY, 3, 17);
    ctx.fillRect(pillX + pillW - 3, pillY, 3, 17);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.fillRect(pillX + 3, pillY + 14, pillW - 6, 2);
    if (!escaping) {
      ctx.fillStyle = col;
      ctx.fillRect(pillX + 3, pillY + 14, Math.round((pillW - 6) * ratio), 2);
    }
    ctx.font = `400 8px ${FONT_ARCADE_UI}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = critical ? '#ffd2dc' : (warning ? '#ffe49e' : '#c4ffd8');
    ctx.fillText(
      escaping ? 'SERPENTS ESCAPING!' : `SERPENTS ESCAPE // ${left.toFixed(1)}s`,
      LOGICAL_W * 0.5,
      pillY + 10
    );
    ctx.restore();
  }

  // Sandbox Measurement Grid live overlay (enemy hitboxes & edge-to-edge jump distances — NO ship yellow ruler!)
  if (game.sandboxMode && game.sandboxShowGrid) {
    drawMeasurementGridOverlay(ctx, game);
  }

  // Standalone Toggleable Ship Chain Lightning Ruler (RULER button between PWR and CLR PWR!)
  if (game.sandboxMode && game.sandboxShowRuler) {
    drawShipLightningRuler(ctx, game);
  }

  // Sandbox Active Mode Hint Banner (crisp 32-bit double-bezel arcade box)
  if (game.sandboxMode && game.sandbox && game.sandbox.deployMode !== 'OFF' && !game.sandbox.drawerOpen) {
    ctx.save();
    const isDrag = game.sandbox.deployMode === 'DRAG';
    const isCap = game.sandbox.deployKind === 'CAPSULE';
    const col = isDrag ? COLORS.emerald : (isCap ? COLORS.gold : COLORS.cyan);
    const msg = isDrag
      ? 'DRAG MODE: GRAB ANY ENEMY, CAPSULE OR SHIP'
      : `TAP / CLICK ARENA TO DEPLOY: ${game.sandbox.deployLabel}`;
    const bx = 34;
    const by = 42;
    const bw = LOGICAL_W - 68;
    const bh = 22;
    // Pixel-curved arcade box: 2px stepped cutout corners + subtle under-shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.58)';
    ctx.fillRect(bx + 2, by + 3, bw - 4, bh);
    ctx.fillStyle = 'rgba(2, 12, 24, 0.94)';
    ctx.fillRect(bx + 2, by + 2, bw - 4, bh - 4);
    ctx.fillStyle = col;
    ctx.fillRect(bx + 2, by, bw - 4, 2);
    ctx.fillRect(bx + 2, by + bh - 2, bw - 4, 2);
    ctx.fillRect(bx, by + 2, 2, bh - 4);
    ctx.fillRect(bx + bw - 2, by + 2, 2, bh - 4);
    ctx.textAlign = 'center';
    ctx.font = `400 8.5px ${FONT_ARCADE_UI}`;
    ctx.fillStyle = col;
    ctx.shadowColor = col;
    ctx.shadowBlur = 5;
    ctx.fillText(msg, LOGICAL_W * 0.5, by + 14);
    ctx.restore();
  }

  // Sector / Challenge / Extra Round / Reward Banner (32-bit Sega Saturn double-rail arcade marquee!)
  if (
    game.sectorPhase === 'BANNER' ||
    game.sectorPhase === 'CHALLENGE_BANNER' ||
    game.sectorPhase === 'CHALLENGE_REWARD' ||
    game.sectorPhase === 'CLEARED'
  ) {
    ctx.save();
    const maxTextW = LOGICAL_W - 48; // 432px safe inner width (24px clear margin inside 480px frame)
    const titleFont = `400 17px ${FONT_ARCADE_DISPLAY}`;
    const subFont = `400 10px ${FONT_ARCADE_UI}`;
    const noteFont = `400 9.5px ${FONT_ARCADE_UI}`;
    const titleLineH = 21;
    const subLineH = 14;
    const noteLineH = 14;

    ctx.font = titleFont;
    const titleLines = wrapBannerLines(ctx, game.bannerTitle, maxTextW);
    ctx.font = subFont;
    const subLines = game.bannerSub ? wrapBannerLines(ctx, game.bannerSub, maxTextW) : [];
    ctx.font = noteFont;
    const noteLines = game.bannerNote ? wrapBannerLines(ctx, game.bannerNote, maxTextW) : [];

    const topPad = 14;
    const botPad = 14;
    const titleBlockH = Math.max(1, titleLines.length) * titleLineH;
    const subGap = subLines.length > 0 ? 7 : 0;
    const subBlockH = subLines.length * subLineH;
    const noteGap = noteLines.length > 0 ? 7 : 0;
    const noteBlockH = noteLines.length * noteLineH;
    const contentH = titleBlockH + subGap + subBlockH + noteGap + noteBlockH;
    const banH = Math.max(68, Math.ceil(topPad + contentH + botPad));
    const centerY = Math.round(LOGICAL_H * 0.41 + 34);
    const topY = clamp(Math.round(centerY - banH * 0.5), 74, PLAYER_MIN_Y - banH - 14);

    // Dark CRT backing + subtle horizontal arcade scanlines
    ctx.fillStyle = 'rgba(2, 8, 20, 0.92)';
    ctx.fillRect(0, topY, LOGICAL_W, banH);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.30)';
    for (let sy = topY + 2; sy < topY + banH - 2; sy += 3) {
      ctx.fillRect(0, sy, LOGICAL_W, 1);
    }

    // Crisp outer 2px neon rails + inner 1px specular highlight rails + pixel corner brackets
    ctx.fillStyle = game.bannerColor;
    ctx.fillRect(0, topY, LOGICAL_W, 2);
    ctx.fillRect(0, topY + banH - 2, LOGICAL_W, 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
    ctx.fillRect(0, topY + 4, LOGICAL_W, 1);
    ctx.fillRect(0, topY + banH - 5, LOGICAL_W, 1);

    // Left & right arcade bezel corner pips
    ctx.fillStyle = game.bannerColor;
    ctx.fillRect(6, topY + 7, 4, 4);
    ctx.fillRect(LOGICAL_W - 10, topY + 7, 4, 4);
    ctx.fillRect(6, topY + banH - 11, 4, 4);
    ctx.fillRect(LOGICAL_W - 10, topY + banH - 11, 4, 4);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';

    let cursorY = topY + Math.round((banH - contentH) * 0.5);

    // Multi-line 32-bit arcade vertical metallic title
    ctx.font = titleFont;
    for (let i = 0; i < titleLines.length; i++) {
      const lineY = cursorY + i * titleLineH + titleLineH * 0.5;
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#02060d';
      ctx.shadowBlur = 0;
      ctx.strokeText(titleLines[i], LOGICAL_W * 0.5, lineY);

      const titleGrad = ctx.createLinearGradient(0, lineY - 8, 0, lineY + 8);
      titleGrad.addColorStop(0, '#ffffff');
      titleGrad.addColorStop(0.55, '#e8fbff');
      titleGrad.addColorStop(1, game.bannerColor);
      ctx.fillStyle = titleGrad;
      ctx.shadowColor = game.bannerColor;
      ctx.shadowBlur = 10;
      ctx.fillText(titleLines[i], LOGICAL_W * 0.5, lineY);
    }
    cursorY += titleBlockH;

    if (subLines.length > 0) {
      cursorY += subGap;
      ctx.font = subFont;
      for (let i = 0; i < subLines.length; i++) {
        const lineY = cursorY + i * subLineH + subLineH * 0.5;
        ctx.lineWidth = 2.6;
        ctx.strokeStyle = '#02060d';
        ctx.shadowBlur = 0;
        ctx.strokeText(subLines[i], LOGICAL_W * 0.5, lineY);
        ctx.fillStyle = game.bannerColor;
        ctx.shadowColor = game.bannerColor;
        ctx.shadowBlur = 5;
        ctx.fillText(subLines[i], LOGICAL_W * 0.5, lineY);
      }
      cursorY += subBlockH;
    }

    if (noteLines.length > 0) {
      cursorY += noteGap;
      const noteCol = game.bannerNoteColor || game.bannerColor;
      ctx.font = noteFont;
      for (let i = 0; i < noteLines.length; i++) {
        const lineY = cursorY + i * noteLineH + noteLineH * 0.5;
        ctx.lineWidth = 2.6;
        ctx.strokeStyle = '#02060d';
        ctx.shadowBlur = 0;
        ctx.strokeText(noteLines[i], LOGICAL_W * 0.5, lineY);
        ctx.fillStyle = noteCol;
        ctx.shadowColor = noteCol;
        ctx.shadowBlur = 6;
        ctx.fillText(noteLines[i], LOGICAL_W * 0.5, lineY);
      }
    }
    ctx.restore();
  }

  ctx.restore();
}
