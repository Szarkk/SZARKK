/* =========================================================================
   32-BIT ARCADE PIXEL FX & EXPLOSION RENDERER
   Provides Sega Saturn / Cave / DoDonPachi style pixel-art combat effects:
   - Player-Skin FX: Pixel plasma bolts, micro-rockets, segmented Red Laser,
     pixel crescent Arc Waves, rotating Cannon Orb + ringed AOE blast,
     pixel-stepped Chain Lightning, and player/clone 32-bit explosions.
   - Enemy-Skin FX: Classic bullet-hell pulsing pixel pellets, Galaga-style
     stepped Tractor Beam rings, pixel-stepped Flux/Null Threads, Pulsar
     pixel Electro Balls / Sparks / Ship Shock Aura, V1 Buff Rings, and
     multi-stage 32-bit Sega Saturn fireball explosions + hot pixel shrapnel.
   ========================================================================= */

import { COLORS, LOGICAL_H, LOGICAL_W, PLASMA_RING_RADIUS } from '../config.js';
import { clamp } from '../utils.js';

function drawPixelDisc(ctx, cx, cy, r, color) {
  const ir = Math.round(r);
  if (ir <= 0) return;
  const ox = Math.round(cx);
  const oy = Math.round(cy);
  ctx.fillStyle = color;
  if (ir === 1) {
    ctx.fillRect(ox, oy, 2, 2);
    return;
  }
  const r2 = ir * ir;
  for (let dy = -ir; dy <= ir; dy += 2) {
    const dx = Math.floor(Math.sqrt(Math.max(0, r2 - dy * dy)));
    const sx = ox - (dx & ~1);
    const w = Math.max(2, (dx & ~1) * 2 + 2);
    ctx.fillRect(sx, oy + dy, w, 2);
  }
}

function drawPixelRing(ctx, cx, cy, r, stepSize, color, dots = 24, angleOff = 0) {
  if (r <= 1) return;
  const ox = Math.round(cx);
  const oy = Math.round(cy);
  const sz = Math.max(1, Math.round(stepSize));
  const half = Math.floor(sz * 0.5);
  ctx.fillStyle = color;
  for (let i = 0; i < dots; i++) {
    const a = angleOff + (i / dots) * Math.PI * 2;
    const px = Math.round(ox + Math.cos(a) * r) - half;
    const py = Math.round(oy + Math.sin(a) * r) - half;
    ctx.fillRect(px, py, sz, sz);
  }
}

function drawPixelThickLine(ctx, x0, y0, x1, y1, size, color) {
  if (!Number.isFinite(x0) || !Number.isFinite(y0) || !Number.isFinite(x1) || !Number.isFinite(y1)) return;
  let ix0 = Math.round(x0);
  let iy0 = Math.round(y0);
  const ix1 = Math.round(x1);
  const iy1 = Math.round(y1);
  const dx = Math.abs(ix1 - ix0);
  const dy = Math.abs(iy1 - iy0);
  const sx = ix0 < ix1 ? 1 : -1;
  const sy = iy0 < iy1 ? 1 : -1;
  let err = dx - dy;
  const sz = Math.max(1, Math.round(size));
  const half = Math.floor(sz * 0.5);
  ctx.fillStyle = color;
  const stepStride = sz >= 2 ? 2 : 1;
  const maxSteps = Math.min(2000, dx + dy + 2);
  let count = 0;
  while (count <= maxSteps) {
    if (count % stepStride === 0 || (ix0 === ix1 && iy0 === iy1)) {
      ctx.fillRect(ix0 - half, iy0 - half, sz, sz);
    }
    if (ix0 === ix1 && iy0 === iy1) break;
    const e2 = err * 2;
    if (e2 > -dy) { err -= dy; ix0 += sx; }
    if (e2 < dx) { err += dx; iy0 += sy; }
    count++;
  }
}

/* =========================================================================
   1) 32-BIT MULTI-STAGE SEGA SATURN PIXEL EXPLOSIONS & HOT SHRAPNEL
   ========================================================================= */
export function createPixelExplosion(x, y, color, tier = 'MED') {
  const isLarge = tier === 'LARGE';
  const isSmall = tier === 'SMALL';
  const maxLife = isLarge ? 0.48 : (isSmall ? 0.28 : 0.38);
  const baseR = isLarge ? 26 : (isSmall ? 11 : 17);
  const puffCount = isLarge ? 5 : (isSmall ? 2 : 3);
  const puffs = [{ ox: 0, oy: 0, rScale: 1.0, delay: 0 }];
  for (let i = 1; i < puffCount; i++) {
    const a = (i / (puffCount - 1)) * Math.PI * 2 + Math.random() * 0.9;
    const dist = baseR * (0.45 + Math.random() * 0.35);
    puffs.push({
      ox: Math.round(Math.cos(a) * dist),
      oy: Math.round(Math.sin(a) * dist),
      rScale: 0.58 + Math.random() * 0.3,
      delay: 0.03 + i * 0.035
    });
  }
  return {
    x: Math.round(x),
    y: Math.round(y),
    color: color || '#ffd447',
    baseR,
    age: 0,
    maxLife,
    puffs
  };
}

export function renderPixelExplosions(ctx, explosions) {
  if (!explosions || explosions.length === 0) return;
  for (const ex of explosions) {
    const t = clamp(ex.age / Math.max(0.01, ex.maxLife), 0, 1);

    // Expanding stepped pixel shockwave ring on early/mid frames
    if (t < 0.72) {
      const ringR = ex.baseR * (0.45 + t * 1.45);
      const ringDots = ex.baseR >= 22 ? 24 : 16;
      ctx.save();
      ctx.globalAlpha = clamp(1 - t * 1.25, 0, 1);
      drawPixelRing(ctx, ex.x, ex.y, ringR, t < 0.3 ? 3 : 2, t < 0.25 ? '#ffffff' : ex.color, ringDots, t * 1.2);
      ctx.restore();
    }

    // Multi-cluster 32-bit fireball puffs: white flash -> colored plasma -> hollow pixel smoke!
    for (const pf of ex.puffs) {
      const pt = clamp((ex.age - pf.delay) / Math.max(0.01, ex.maxLife - pf.delay), 0, 1);
      if (pt <= 0 || pt >= 1) continue;
      const px = ex.x + pf.ox;
      const py = ex.y + pf.oy;
      const curR = ex.baseR * pf.rScale * (pt < 0.32 ? (0.45 + (pt / 0.32) * 0.65) : (1.1 - (pt - 0.32) * 0.35));

      ctx.save();
      if (pt < 0.22) {
        // Stage 1: Blazing incandescent white flash core with colored pixel rim
        drawPixelDisc(ctx, px, py, curR, ex.color);
        drawPixelDisc(ctx, px, py, curR * 0.72, '#ffffff');
      } else if (pt < 0.62) {
        // Stage 2: Full 32-bit fireball (dark ember rim -> bright color -> white hot center)
        ctx.globalAlpha = 0.95;
        drawPixelDisc(ctx, px, py, curR, '#1b1124');
        drawPixelDisc(ctx, px, py, curR * 0.84, ex.color);
        drawPixelDisc(ctx, px - 2, py - 2, curR * 0.48, '#ffffff');
      } else {
        // Stage 3: Hollowing dark pixel smoke & fading hot ember sparks
        const fade = clamp(1 - (pt - 0.62) / 0.38, 0, 1);
        ctx.globalAlpha = fade * 0.85;
        drawPixelRing(ctx, px, py, curR * 0.72, 4, '#24293b', 10, pf.delay * 14);
        drawPixelRing(ctx, px, py, curR * 0.86, 2, ex.color, 8, -pf.delay * 18);
      }
      ctx.restore();
    }
  }
}

export function drawPixelShrapnelParticle(ctx, pt) {
  const ratio = clamp(pt.life / pt.maxLife, 0, 1);
  const sz = ratio > 0.55 ? Math.max(2, Math.round(pt.size * 0.85)) : 2;
  const px = Math.round(pt.x - sz * 0.5);
  const py = Math.round(pt.y - sz * 0.5);
  ctx.save();
  ctx.globalAlpha = ratio;
  ctx.fillStyle = ratio > 0.78 ? '#ffffff' : pt.color;
  ctx.fillRect(px, py, sz, sz);
  ctx.restore();
}

/* =========================================================================
   2) 32-BIT PLAYER WEAPON EFFECTS (FOLLOWS EQUIPPED SHIP SKIN)
   ========================================================================= */
export function drawPixelPlayerBullet(ctx, b, time = 0) {
  const bx = Math.round(b.x);
  const by = Math.round(b.y);
  if (b.ricochet) {
    // High-voltage electric yellow-white ricocheted enemy bullet!
    const pulse = Math.floor(time * 26 + bx) % 2;
    ctx.save();
    ctx.fillStyle = COLORS.yellowOrange;
    ctx.fillRect(bx - 4, by - 4, 8, 8);
    ctx.fillStyle = COLORS.yellow;
    ctx.fillRect(bx - 3, by - 3, 6, 6);
    ctx.fillRect(bx - (pulse ? 6 : 5), by - 1, pulse ? 12 : 10, 2);
    ctx.fillRect(bx - 1, by - (pulse ? 6 : 5), 2, pulse ? 12 : 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx - 2, by - 2, 4, 4);
    ctx.restore();
    return;
  }
  const isRed = !!b.redLaserBullet;
  const isClone = !!b.cloneBolt;
  const isPurple = !!b.purple && !isClone;

  const outerCol = isRed
    ? (b.weakened ? '#ff7c92' : COLORS.nullRed)
    : (isClone
      ? '#7d38ff'
      : (isPurple
        ? (b.weakened ? '#d96bff' : COLORS.purple)
        : (b.weakened ? '#ff6884' : '#9eeeff')));
  const coreCol = isClone ? '#f0e2ff' : '#ffffff';
  const len = isRed ? 18 : (isClone ? 18 : (isPurple ? 16 : 13));
  const half = Math.floor(len * 0.5);

  ctx.save();
  if (b.slowedByFlux && b.dissolveMax > 0) {
    ctx.globalAlpha = clamp(b.dissolveTimer / 0.65, 0.2, 1);
  }

  // Tapered 32-bit pixel plasma bolt (pointed tip + bright outer sleeve + blazing white core)
  ctx.fillStyle = outerCol;
  ctx.fillRect(bx - 1, by - half - 1, 2, 2);
  ctx.fillRect(bx - 2, by - half + 1, 4, len - 3);
  ctx.fillRect(bx - 1, by + half - 2, 2, 3);

  ctx.fillStyle = coreCol;
  ctx.fillRect(bx - 1, by - half + 1, 2, len - 4);

  // Pixel trailing vapor dot
  if (Math.floor(time * 24 + bx) % 2 === 0) {
    ctx.fillStyle = outerCol;
    ctx.fillRect(bx - 1, by + half + 2, 2, 2);
  }

  // Crisp pixel stasis diamond cage when slowed by a Cyan Flux Thread
  if (b.slowedByFlux) {
    const r = 6;
    ctx.fillStyle = COLORS.cyan;
    ctx.fillRect(bx - r, by - 1, 2, 2);
    ctx.fillRect(bx + r - 2, by - 1, 2, 2);
    ctx.fillRect(bx - 1, by - r, 2, 2);
    ctx.fillRect(bx - 1, by + r - 2, 2, 2);
  }
  ctx.restore();
}

export function drawPixelHomingMissile(ctx, m, time = 0) {
  ctx.save();
  // Stepped 32-bit pixel smoke/plasma trail puffs
  const tLen = m.trail.length;
  for (let k = 0; k < tLen; k++) {
    const frac = (k + 1) / Math.max(1, tLen);
    const sz = frac > 0.65 ? 3 : 2;
    ctx.globalAlpha = frac * 0.72;
    ctx.fillStyle = frac > 0.7 ? '#d4ffff' : COLORS.cyan;
    ctx.fillRect(Math.round(m.trail[k].x - sz * 0.5), Math.round(m.trail[k].y - sz * 0.5), sz, sz);
  }
  ctx.globalAlpha = 1;

  // Discrete 16-step Sega Saturn rotation for crisp pixel rocket silhouette
  const rawAng = m.angle + Math.PI / 2;
  const snappedAng = Math.round(rawAng / (Math.PI / 8)) * (Math.PI / 8);
  ctx.translate(Math.round(m.x), Math.round(m.y));
  ctx.rotate(snappedAng);

  // Flickering pixel thruster plume
  const thr = Math.floor(time * 24 + m.x) % 2;
  ctx.fillStyle = COLORS.cyan;
  ctx.fillRect(-1, 5, 2, 3 + thr * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-1, 5, 2, 2);

  // Dark outline + swept cyan stabilizer fins + white warhead rocket body
  ctx.fillStyle = '#061a2c';
  ctx.fillRect(-2, -9, 4, 15);
  ctx.fillRect(-5, 2, 10, 4);
  ctx.fillStyle = COLORS.cyan;
  ctx.fillRect(-4, 3, 2, 3);
  ctx.fillRect(2, 3, 2, 3);
  ctx.fillRect(-2, -5, 4, 10);
  ctx.fillStyle = '#9efcff';
  ctx.fillRect(-1, -4, 2, 8);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-1, -8, 2, 5);
  ctx.restore();
}

export function drawPixelRedLaserBeam(ctx, beam, px, py, time = 0) {
  const usePlayerCoords = typeof py === 'number';
  const t = usePlayerCoords ? time : (typeof px === 'number' ? px : 0);
  const bx = Math.round(usePlayerCoords ? (px + (beam.offsetX || 0)) : (beam.x || 0));
  const by1 = Math.round(usePlayerCoords ? (py - 16) : (beam.y1 || 0));
  const by2 = Math.round(beam.y2);
  const h = Math.max(0, by1 - by2);
  if (h <= 0) return;

  const pulse = Math.floor(t * 22) % 2;
  const outerW = pulse ? 10 : 8;
  const midW = pulse ? 6 : 4;

  ctx.save();
  // Soft stepped outer crimson aura sleeve (Design A: Solid Plasma Lance — zero horizontal dashes!)
  ctx.fillStyle = 'rgba(255, 30, 66, 0.24)';
  ctx.fillRect(bx - Math.floor((outerW + 6) / 2), by2, outerW + 6, h);
  ctx.fillStyle = 'rgba(255, 30, 66, 0.55)';
  ctx.fillRect(bx - Math.floor((outerW + 2) / 2), by2, outerW + 2, h);

  // Solid blazing crimson-scarlet plasma column
  ctx.fillStyle = COLORS.nullRed;
  ctx.fillRect(bx - Math.floor(outerW / 2), by2, outerW, h);
  ctx.fillStyle = '#ff6380';
  ctx.fillRect(bx - Math.floor(midW / 2), by2, midW, h);

  // Continuous razor-sharp pure white inner core
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(bx - 1, by2, 2, h);

  // High-speed vertical white energy slivers racing upward inside the core
  const scroll1 = Math.floor((t * 260) % 28);
  ctx.fillStyle = '#ffffff';
  for (let sy = by1 - scroll1; sy > by2 + 8; sy -= 28) {
    ctx.fillRect(bx - 2, sy - 10, 4, 10);
  }
  const scroll2 = Math.floor((t * 190 + 14) % 34);
  ctx.fillStyle = '#ffb5c4';
  for (let sy = by1 - scroll2; sy > by2 + 6; sy -= 34) {
    const side = ((Math.floor(sy / 34)) % 2 === 0) ? -3 : 2;
    ctx.fillRect(bx + side, sy - 7, 1, 7);
  }

  // Crisp pixel star muzzle flare at fighter nose
  const mf = pulse ? 6 : 5;
  ctx.fillStyle = COLORS.nullRed;
  ctx.fillRect(bx - mf, by1 - 1, mf * 2, 2);
  ctx.fillRect(bx - 1, by1 - mf, 2, mf * 2);
  drawPixelDisc(ctx, bx, by1, 4, '#ff607c');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(bx - 2, by1 - 2, 4, 4);

  // Pixelated Thread stop / refraction impact flare
  if (beam.hit) {
    const hCol = beam.hitColor || COLORS.nullRed;
    const hr = pulse ? 8 : 6;
    drawPixelDisc(ctx, bx, by2, hr + 2, 'rgba(255, 30, 66, 0.34)');
    ctx.fillStyle = hCol;
    ctx.fillRect(bx - hr, by2 - 1, hr * 2, 2);
    ctx.fillRect(bx - 1, by2 - hr, 2, hr * 2);
    drawPixelDisc(ctx, bx, by2, Math.max(3, hr - 2), hCol);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx - 2, by2 - 2, 4, 4);
  }
  ctx.restore();
}

export function drawPixelArcWave(ctx, w, time = 0) {
  const cx = Math.round(w.x);
  const cy = Math.round(w.y + w.radius * 0.52);
  const r = w.radius;
  const aStart = Math.PI * 1.14;
  const aEnd = Math.PI * 1.86;
  const steps = Math.max(18, Math.round(r * 0.38));

  ctx.save();
  // Outer deep purple stepped pixel energy aura
  ctx.fillStyle = '#6f22cc';
  for (let i = 0; i <= steps; i++) {
    const a = aStart + (i / steps) * (aEnd - aStart);
    const px = Math.round(cx + Math.cos(a) * (r + 2)) - 3;
    const py = Math.round(cy + Math.sin(a) * (r + 2)) - 3;
    ctx.fillRect(px, py, 6, 6);
  }

  // Mid bright purple stepped crescent body
  ctx.fillStyle = COLORS.purple;
  for (let i = 0; i <= steps; i++) {
    const a = aStart + (i / steps) * (aEnd - aStart);
    const px = Math.round(cx + Math.cos(a) * r) - 2;
    const py = Math.round(cy + Math.sin(a) * r) - 2;
    ctx.fillRect(px, py, 4, 4);
  }

  // Leading blazing white pixel razor edge
  ctx.fillStyle = '#ffffff';
  for (let i = 1; i < steps; i++) {
    const a = aStart + (i / steps) * (aEnd - aStart);
    const px = Math.round(cx + Math.cos(a) * (r - 2)) - 1;
    const py = Math.round(cy + Math.sin(a) * (r - 2)) - 1;
    ctx.fillRect(px, py, 2, 2);
  }

  // Trailing violet spark pips
  const flick = Math.floor(time * 20) % 2;
  ctx.fillStyle = COLORS.purpleBright;
  for (let i = 2; i < steps - 1; i += 4) {
    const a = aStart + ((i + flick) / steps) * (aEnd - aStart);
    const px = Math.round(cx + Math.cos(a) * (r - 6));
    const py = Math.round(cy + Math.sin(a) * (r - 6));
    ctx.fillRect(px, py, 2, 2);
  }
  ctx.restore();
}

export function drawPixelCannonShot(ctx, c, time = 0) {
  ctx.save();
  // Chunky pixel-square energy trail
  for (let k = 0; k < c.trail.length; k++) {
    const frac = (k + 1) / Math.max(1, c.trail.length);
    const sz = Math.max(4, Math.round(frac * 14));
    ctx.globalAlpha = frac * 0.65;
    ctx.fillStyle = frac > 0.65 ? COLORS.purpleBright : COLORS.purple;
    ctx.fillRect(Math.round(c.trail[k].x - sz * 0.5), Math.round(c.trail[k].y - sz * 0.5), sz, sz);
  }
  ctx.globalAlpha = 1;

  const cx = Math.round(c.x);
  const cy = Math.round(c.y);
  const r = Math.round(c.radius);
  drawPixelDisc(ctx, cx, cy, r + 3, '#4e1594');
  drawPixelDisc(ctx, cx, cy, r + 1, COLORS.purple);
  drawPixelDisc(ctx, cx, cy, r - 2, COLORS.purpleBright);
  drawPixelDisc(ctx, cx, cy, Math.max(4, r - 5), '#ffffff');
  drawPixelRing(ctx, cx, cy, r + 6, 2, '#ffffff', 8, time * 12);
  ctx.restore();
}

export function drawPixelAoeBlast(ctx, bl) {
  const alpha = clamp(bl.life / Math.max(0.01, bl.maxLife), 0, 1);
  const cx = Math.round(bl.x);
  const cy = Math.round(bl.y);
  const r = Math.round(bl.radius);
  ctx.save();
  // Early incandescent pixel core burst
  if (alpha > 0.55) {
    ctx.globalAlpha = (alpha - 0.55) * 1.4;
    drawPixelDisc(ctx, cx, cy, r * 0.45, COLORS.purple);
    drawPixelDisc(ctx, cx, cy, r * 0.22, '#ffffff');
  }
  // Stepped expanding 32-bit multi-ring plasma shockwaves
  ctx.globalAlpha = alpha;
  const dots = Math.max(24, Math.min(72, Math.round(r * 0.34)));
  drawPixelRing(ctx, cx, cy, r + 2, 4, '#6d1fd6', dots, alpha * 1.2);
  drawPixelRing(ctx, cx, cy, r, 3, COLORS.purpleBright, dots, -alpha * 0.8);
  drawPixelRing(ctx, cx, cy, Math.max(6, r - 6), 2, '#ffffff', Math.round(dots * 0.7), alpha * 2.1);
  ctx.restore();
}

export function drawPixelChainLightning(ctx, bolt) {
  const alpha = clamp(bolt.life / Math.max(0.01, bolt.maxLife), 0, 1);
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let si = 0; si < bolt.segments.length; si++) {
    const pts = bolt.segments[si];
    if (pts.length < 2) continue;
    const isBranch = bolt.branchStartIdx !== undefined && si >= bolt.branchStartIdx;
    const outerSz = isBranch ? 3 : 4;
    const midSz = isBranch ? 2 : 3;
    for (let k = 1; k < pts.length; k++) {
      const a = pts[k - 1];
      const b = pts[k];
      drawPixelThickLine(ctx, a.x, a.y, b.x, b.y, outerSz, COLORS.yellowOrange);
      drawPixelThickLine(ctx, a.x, a.y, b.x, b.y, midSz, COLORS.yellow);
      drawPixelThickLine(ctx, a.x, a.y, b.x, b.y, 1, '#ffffff');
    }
  }
  ctx.restore();
}

/**
 * Full-screen Vertical + Horizontal Cross Lightning Death Animation!
 * Used identically on BOTH 32-Bit Aurex Fighter AND Alpha Test legacy skin.
 */
export function drawDeathCrossLightning(ctx, cl, time = 0) {
  const t = clamp(cl.age / Math.max(0.01, cl.maxLife), 0, 1);
  const fade = t < 0.16 ? (t / 0.16) : Math.pow(1 - (t - 0.16) / 0.84, 1.35);
  const cx = Math.round(cl.x);
  const cy = Math.round(cl.y);
  const stepTick = Math.floor(time * 28 + cl.seed * 7);

  // Deterministic pseudo-random helper per frame tick so lightning crackles crisply without GC
  const hash = (n) => {
    const s = Math.sin(n * 127.1 + stepTick * 311.7 + cl.seed * 19.3) * 43758.5453;
    return s - Math.floor(s);
  };

  // Beam thickness swells violently on impact then narrows cleanly as it fades
  const env = t < 0.14 ? (0.45 + (t / 0.14) * 0.55) : Math.max(0.15, 1 - (t - 0.14) * 0.95);
  const auraW = Math.max(4, Math.round(28 * env));
  const midW = Math.max(2, Math.round(14 * env));
  const coreW = Math.max(2, Math.round(6 * env));

  ctx.save();

  // 1) Translucent full-screen golden-amber outer glow sleeves (Vertical + Horizontal Cross)
  ctx.globalAlpha = fade * 0.42;
  ctx.fillStyle = COLORS.yellowOrange;
  ctx.fillRect(cx - Math.floor(auraW / 2), 0, auraW, LOGICAL_H);
  ctx.fillRect(0, cy - Math.floor(auraW / 2), LOGICAL_W, auraW);

  // 2) Blazing neon yellow main cross plasma columns
  ctx.globalAlpha = fade * 0.88;
  ctx.fillStyle = COLORS.yellow;
  ctx.fillRect(cx - Math.floor(midW / 2), 0, midW, LOGICAL_H);
  ctx.fillRect(0, cy - Math.floor(midW / 2), LOGICAL_W, midW);

  // 3) White-hot center spines
  ctx.globalAlpha = fade;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx - Math.floor(coreW / 2), 0, coreW, LOGICAL_H);
  ctx.fillRect(0, cy - Math.floor(coreW / 2), LOGICAL_W, coreW);

  // 4) Dual jagged high-voltage stepped lightning strands crackling along BOTH full-screen axes!
  const jitterAmp = Math.round(15 * env + 4);
  for (let strand = 0; strand < 2; strand++) {
    const col = strand === 0 ? '#ffffff' : COLORS.yellow;
    const sz = strand === 0 ? 2 : 3;
    ctx.globalAlpha = fade * (strand === 0 ? 0.96 : 0.78);

    // Vertical jagged lightning strand (y = 0 -> LOGICAL_H)
    let prevX = cx;
    let prevY = 0;
    const vStep = 28;
    for (let y = vStep; y <= LOGICAL_H + vStep; y += vStep) {
      const ny = Math.min(LOGICAL_H, y);
      const jx = ny >= LOGICAL_H ? cx : Math.round(cx + (hash(y * 0.13 + strand * 51) - 0.5) * 2 * jitterAmp);
      drawPixelThickLine(ctx, prevX, prevY, jx, ny, sz, col);
      prevX = jx;
      prevY = ny;
    }

    // Horizontal jagged lightning strand (x = 0 -> LOGICAL_W)
    let hPrevX = 0;
    let hPrevY = cy;
    const hStep = 26;
    for (let x = hStep; x <= LOGICAL_W + hStep; x += hStep) {
      const nx = Math.min(LOGICAL_W, x);
      const jy = nx >= LOGICAL_W ? cy : Math.round(cy + (hash(x * 0.17 + strand * 97 + 200) - 0.5) * 2 * jitterAmp);
      drawPixelThickLine(ctx, hPrevX, hPrevY, nx, jy, sz, col);
      hPrevX = nx;
      hPrevY = jy;
    }
  }

  // 5) Blazing central detonation rings & cross-star flash right at player's death point (cx, cy)
  const ringR = Math.round(14 + t * 58);
  ctx.globalAlpha = fade * 0.9;
  drawPixelRing(ctx, cx, cy, ringR, 3, COLORS.yellow, 24, t * 2.2);
  if (t < 0.6) {
    ctx.globalAlpha = (1 - t / 0.6) * 0.95;
    drawPixelRing(ctx, cx, cy, Math.round(8 + t * 38), 2, '#ffffff', 16, -t * 3.0);
    drawPixelDisc(ctx, cx, cy, Math.round((1 - t / 0.6) * 20), '#ffffff');
  }

  ctx.restore();
}

/**
 * Subtle crackling yellow-white electric stun sparks on enemies whose firing is disabled for 4s!
 */
export function drawEnemyFireDisabledSparks(ctx, e, time = 0, isPixel = true) {
  const rx = Math.round(e.x);
  const ry = Math.round(e.y);
  const r = (e.hitRadius || 16) + 4;
  ctx.save();
  for (let k = 0; k < 3; k++) {
    const a0 = time * 6.5 + (k * Math.PI * 2) / 3 + (e.id || 0);
    const a1 = a0 + 0.85;
    const am = (a0 + a1) * 0.5;
    const rm = r + Math.sin(time * 42 + k * 3.1) * 4;
    const x0 = rx + Math.cos(a0) * r;
    const y0 = ry + Math.sin(a0) * r;
    const xm = rx + Math.cos(am) * rm;
    const ym = ry + Math.sin(am) * rm;
    const x1 = rx + Math.cos(a1) * r;
    const y1 = ry + Math.sin(a1) * r;
    if (isPixel) {
      drawPixelThickLine(ctx, x0, y0, xm, ym, 2, COLORS.yellow);
      drawPixelThickLine(ctx, xm, ym, x1, y1, 2, COLORS.yellow);
      drawPixelThickLine(ctx, x0, y0, xm, ym, 1, '#ffffff');
      drawPixelThickLine(ctx, xm, ym, x1, y1, 1, '#ffffff');
    } else {
      ctx.strokeStyle = COLORS.yellow;
      ctx.shadowColor = COLORS.yellow;
      ctx.shadowBlur = 8;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(xm, ym);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/* =========================================================================
   3) 32-BIT ENEMY HAZARD & MECHANIC EFFECTS (FOLLOWS EQUIPPED ENEMY SKIN)
   ========================================================================= */
export function drawPixelEnemyBullet(ctx, eb, time = 0) {
  const bx = Math.round(eb.x);
  const by = Math.round(eb.y);
  const pulse = Math.floor(time * 16 + bx * 0.1 + by * 0.1) % 2;

  ctx.save();
  // High-contrast 1px dark rim -> bright colored 32-bit diamond/orb -> pulsing white core!
  ctx.fillStyle = '#050812';
  ctx.fillRect(bx - 3, by - 5, 6, 10);
  ctx.fillRect(bx - 5, by - 3, 10, 6);

  ctx.fillStyle = eb.color || COLORS.nullRed;
  ctx.fillRect(bx - 2, by - 4, 4, 8);
  ctx.fillRect(bx - 4, by - 2, 8, 4);
  ctx.fillRect(bx - 3, by - 3, 6, 6);

  ctx.fillStyle = '#ffffff';
  if (pulse) {
    ctx.fillRect(bx - 2, by - 2, 4, 4);
  } else {
    ctx.fillRect(bx - 1, by - 2, 2, 4);
    ctx.fillRect(bx - 2, by - 1, 4, 2);
  }
  ctx.restore();
}

export function drawPixelTractorBeam(ctx, boss, time = 0, capturing = false) {
  const bx = Math.round(boss.x);
  const topY = Math.round(boss.y + 14);
  const botY = Math.round(LOGICAL_H - 18);
  const topHalfW = 14;
  const botHalfW = 54;
  const spanY = Math.max(1, botY - topY);
  const edgeCol = capturing ? COLORS.emerald : COLORS.cyan;

  ctx.save();
  // 1) Stepped horizontal scanline cone tint (authentic 32-bit arcade beam cone!)
  for (let sy = topY; sy < botY; sy += 4) {
    const f = (sy - topY) / spanY;
    const hw = Math.round(topHalfW + (botHalfW - topHalfW) * f);
    const alpha = (capturing ? 0.24 : 0.16) * (1 - f * 0.45);
    ctx.fillStyle = capturing
      ? `rgba(0, 255, 185, ${alpha.toFixed(3)})`
      : `rgba(0, 232, 255, ${alpha.toFixed(3)})`;
    ctx.fillRect(bx - hw, sy, hw * 2, 2);
  }

  // 2) Crisp pixel-stepped outer beam cone rails
  drawPixelThickLine(ctx, bx - topHalfW, topY, bx - botHalfW, botY, 2, edgeCol);
  drawPixelThickLine(ctx, bx + topHalfW, topY, bx + botHalfW, botY, 2, edgeCol);

  // 3) Classic Galaga '88 / Sega Saturn cascading horizontal pixel tractor rings!
  const ringCount = 9;
  const speed = capturing ? 1.05 : 0.7;
  for (let i = 0; i < ringCount; i++) {
    const phase = ((i / ringCount) + time * speed) % 1;
    const ry = Math.round(topY + phase * spanY);
    const hw = Math.round(topHalfW + (botHalfW - topHalfW) * phase) - 3;
    const alpha = Math.sin(phase * Math.PI) * 0.92;
    ctx.globalAlpha = alpha;
    const mainRingCol = (i % 2 === 0) ? COLORS.emerald : COLORS.cyan;
    ctx.fillStyle = mainRingCol;
    ctx.fillRect(bx - hw, ry, hw * 2, 3);
    // Crisp white specular core strip & bright pixel endcaps
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx - hw + 2, ry + 1, Math.max(2, hw * 2 - 4), 1);
    ctx.fillRect(bx - hw - 1, ry, 2, 3);
    ctx.fillRect(bx + hw - 1, ry, 2, 3);
  }
  ctx.restore();
}

export function drawPixelThreadTrail(ctx, trail) {
  const isNull = trail.variant === 'NULL';
  const hitFlash = trail.flashTimer > 0;
  // Subtle hot-crimson pulse when damaged (never flashes distracting solid white!)
  const mainCol = isNull
    ? (hitFlash ? '#ff5c7c' : COLORS.nullRed)
    : (hitFlash ? '#72f9ff' : COLORS.cyan);
  const coreCol = isNull
    ? (hitFlash ? '#ffb8c8' : '#ffdbe4')
    : '#e2ffff';
  const outerSz = isNull ? 5 : 4;
  const coreSz = (isNull && hitFlash) ? 2 : 1;

  for (const seg of trail.segments) {
    const alpha = clamp(seg.life / 0.55, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    drawPixelThickLine(ctx, seg.x1, seg.y1, seg.x2, seg.y2, outerSz, mainCol);
    drawPixelThickLine(ctx, seg.x1, seg.y1, seg.x2, seg.y2, coreSz, coreCol);
    ctx.restore();
  }

  // Crisp integer-snapped Null Thread shield durability pips
  if (isNull && trail.hitsRemaining < trail.maxHits && trail.segments.length > 0) {
    const midSeg = trail.segments[Math.floor(trail.segments.length / 2)];
    const mx = Math.round((midSeg.x1 + midSeg.x2) * 0.5);
    const my = Math.round((midSeg.y1 + midSeg.y2) * 0.5 - 12);
    const pipW = 4;
    const pipGap = 2;
    const totalW = trail.maxHits * pipW + (trail.maxHits - 1) * pipGap;
    const startX = Math.round(mx - totalW * 0.5);
    ctx.save();
    ctx.fillStyle = 'rgba(2, 6, 14, 0.88)';
    ctx.fillRect(startX - 1, my - 1, totalW + 2, 5);
    for (let p = 0; p < trail.maxHits; p++) {
      ctx.fillStyle = p < trail.hitsRemaining ? COLORS.nullRed : 'rgba(255, 255, 255, 0.18)';
      ctx.fillRect(startX + p * (pipW + pipGap), my, pipW, 3);
    }
    ctx.restore();
  }
}

export function drawPixelElectroBall(ctx, eb, time = 0) {
  const bx = Math.round(eb.x);
  const by = Math.round(eb.y);
  const pulse = Math.floor(time * 18 + (eb.phase || 0) * 4) % 2;
  const r = Math.round((eb.radius || 13) + (pulse ? 1 : 0));

  ctx.save();
  // Stepped 32-bit layered electric sphere
  drawPixelDisc(ctx, bx, by, r, '#45220c');
  drawPixelDisc(ctx, bx, by, r - 2, COLORS.yellowOrange);
  drawPixelDisc(ctx, bx, by, r - 4, COLORS.yellow);
  drawPixelDisc(ctx, bx, by, Math.max(3, r - 7), '#ffffff');

  // Crackling pixel-stepped white electric filaments dancing across the orb!
  for (let k = 0; k < 3; k++) {
    const a = time * 9 + (eb.phase || 0) + (k * Math.PI * 2) / 3;
    const mx = bx + Math.cos(a + 0.38) * (r * 0.55);
    const my = by + Math.sin(a + 0.38) * (r * 0.55);
    const ex = bx + Math.cos(a) * (r + 2);
    const ey = by + Math.sin(a) * (r + 2);
    drawPixelThickLine(ctx, bx, by, mx, my, 2, '#ffffff');
    drawPixelThickLine(ctx, mx, my, ex, ey, 2, pulse ? '#ffffff' : COLORS.yellow);
  }
  ctx.restore();
}

export function drawPixelPulsarSpark(ctx, sp) {
  ctx.save();
  for (let k = 0; k < sp.trail.length; k++) {
    const frac = (k + 1) / Math.max(1, sp.trail.length);
    const sz = frac > 0.65 ? 3 : 2;
    ctx.globalAlpha = 0.3 + frac * 0.7;
    ctx.fillStyle = frac > 0.68 ? '#ffffff' : COLORS.yellow;
    ctx.fillRect(Math.round(sp.trail[k].x - sz * 0.5), Math.round(sp.trail[k].y - sz * 0.5), sz, sz);
  }
  ctx.globalAlpha = 1;
  const sx = Math.round(sp.x);
  const sy = Math.round(sp.y);
  // Crisp pixel cross-star spark tip
  ctx.fillStyle = COLORS.yellow;
  ctx.fillRect(sx - 4, sy - 1, 8, 2);
  ctx.fillRect(sx - 1, sy - 4, 2, 8);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(sx - 2, sy - 2, 4, 4);
  ctx.restore();
}

export function drawPixelShipShockAura(ctx, px, py, dual, isJam, time = 0) {
  const rx = Math.round(px);
  const ry = Math.round(py);
  const shockR = dual ? 31 : 22;
  const bolts = isJam ? 5 : 4;
  ctx.save();
  // Pixelated electric shock arcs crackling around the fighter
  for (let k = 0; k < bolts; k++) {
    const a0 = time * (isJam ? 7.5 : 4.5) + (k / bolts) * Math.PI * 2;
    const a1 = a0 + 0.95;
    const am = (a0 + a1) * 0.5;
    const rMid = shockR + Math.round(Math.sin(time * 48 + k * 2.7) * 5);
    const x0 = rx + Math.cos(a0) * shockR;
    const y0 = ry + Math.sin(a0) * shockR;
    const xm = rx + Math.cos(am) * rMid;
    const ym = ry + Math.sin(am) * rMid;
    const x1 = rx + Math.cos(a1) * shockR;
    const y1 = ry + Math.sin(a1) * shockR;
    drawPixelThickLine(ctx, x0, y0, xm, ym, isJam ? 3 : 2, '#9eeeff');
    drawPixelThickLine(ctx, xm, ym, x1, y1, isJam ? 3 : 2, '#9eeeff');
    drawPixelThickLine(ctx, x0, y0, xm, ym, 1, '#ffffff');
    drawPixelThickLine(ctx, xm, ym, x1, y1, 1, '#ffffff');
  }
  ctx.restore();
}

export function drawPixelBuffWave(ctx, bw) {
  const alpha = clamp(bw.life / Math.max(0.01, bw.maxLife), 0, 1);
  const r = Math.round(bw.radius);
  const dots = Math.max(20, Math.min(56, Math.round(r * 0.45)));
  ctx.save();
  ctx.globalAlpha = alpha * 0.9;
  drawPixelRing(ctx, bw.x, bw.y, r, 3, bw.color, dots, alpha * 1.4);
  drawPixelRing(ctx, bw.x, bw.y, Math.max(4, r - 4), 2, '#ffffff', Math.round(dots * 0.7), -alpha * 1.8);
  ctx.restore();
}

/* =========================================================================
   4) SUBTLE SKIN-EXCLUSIVE POWER-UP ACQUISITION & CAPSULE SHIMMER FX
   (Replaces fiery explosions on power-up pickup with clean, sleek resonance
    waves, upward hull scanlines, gentle sparkles, and energy stream glints!)
   ========================================================================= */
export function createPowerupPickupFx(x, y, color, kind = 'SHIP_SYNC', isPixel = true, extra = {}) {
  const isShip = kind === 'SHIP_SYNC';
  const isSpawn = kind === 'CAPSULE_SPAWN';
  const maxLife = isShip ? 0.68 : (isSpawn ? 0.40 : 0.48);
  const moteCount = isShip ? 8 : (isSpawn ? 5 : 7);
  const motes = [];
  for (let i = 0; i < moteCount; i++) {
    const a = (i / moteCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    motes.push({
      ox: isShip ? (Math.random() - 0.5) * 38 : Math.cos(a) * (isSpawn ? 15 : 6),
      oy: isShip ? (4 + Math.random() * 14) : Math.sin(a) * (isSpawn ? 15 : 6),
      vx: isShip ? (Math.random() - 0.5) * 14 : Math.cos(a) * (isSpawn ? -24 : (24 + Math.random() * 20)),
      vy: isShip ? -(26 + Math.random() * 24) : (Math.sin(a) * (isSpawn ? -24 : (20 + Math.random() * 18)) - (isSpawn ? 0 : 12)),
      phase: Math.random() * Math.PI * 2
    });
  }
  return {
    x,
    y,
    color: color || COLORS.cyan,
    kind,
    isPixel,
    age: 0,
    maxLife,
    motes,
    streamToPlayer: !!extra.streamToPlayer,
    curveSide: Math.random() < 0.5 ? -1 : 1
  };
}

export function renderPowerupPickupFx(ctx, list, player, time = 0) {
  if (!list || list.length === 0) return;
  for (const fx of list) {
    const t = clamp(fx.age / Math.max(0.01, fx.maxLife), 0, 1);
    const fade = Math.pow(1 - t, 1.25);
    const isShip = fx.kind === 'SHIP_SYNC';
    const isSpawn = fx.kind === 'CAPSULE_SPAWN';
    const followPlayer = isShip && player && player.alive;
    const baseX = followPlayer ? player.x : fx.x;
    const baseY = followPlayer ? player.y : fx.y;
    const offsets = (followPlayer && player.dual) ? [-14, 14] : [0];

    ctx.save();

    if (fx.isPixel) {
      // --- 32-BIT PIXEL SHIP SKIN SUBTLE POWER-UP FX ---
      if (isShip) {
        const ringR = 12 + t * 24;
        const innerR = 8 + t * 17;
        for (const ox of offsets) {
          const cx = Math.round(baseX + ox);
          const cy = Math.round(baseY);

          // 1) Delicate expanding stepped pixel resonance ring + faint white echo ring
          ctx.globalAlpha = fade * 0.72;
          drawPixelRing(ctx, cx, cy, ringR, 2, fx.color, 20, t * 1.4);
          if (t < 0.72) {
            ctx.globalAlpha = (1 - t / 0.72) * 0.45;
            drawPixelRing(ctx, cx, cy, innerR, 1, '#ffffff', 12, -t * 1.8);
          }

          // 2) Sleek single upward hull sync scanline (glides tail -> nose over first 68%)
          if (t < 0.68) {
            const st = t / 0.68;
            const scanY = Math.round(cy + 14 - st * 32);
            const scanW = Math.max(10, Math.round(28 - Math.abs(st - 0.45) * 18));
            ctx.globalAlpha = Math.sin(st * Math.PI) * 0.85;
            ctx.fillStyle = fx.color;
            ctx.fillRect(cx - Math.floor(scanW * 0.5), scanY, scanW, 2);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(cx - Math.floor(scanW * 0.28), scanY, Math.max(4, Math.floor(scanW * 0.56)), 1);
          }
        }

        // 3) Gentle rising pixel diamond sparkles floating around the fighter wings
        for (const m of fx.motes) {
          const mx = Math.round(baseX + m.ox + m.vx * fx.age);
          const my = Math.round(baseY + m.oy + m.vy * fx.age);
          const twinkle = Math.floor(time * 20 + m.phase * 3) % 2 === 0;
          ctx.globalAlpha = fade * (twinkle ? 0.94 : 0.6);
          ctx.fillStyle = fx.color;
          ctx.fillRect(mx - 1, my - 1, 2, 2);
          if (twinkle) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(mx, my - 2, 1, 4);
            ctx.fillRect(mx - 2, my, 4, 1);
          }
        }
      } else {
        // CAPSULE_OPEN or CAPSULE_SPAWN: clean crystalline ring + soft floating data motes (no fireball!)
        const cx = Math.round(baseX);
        const cy = Math.round(baseY);
        const ringR = isSpawn ? (18 - t * 10) : (8 + t * 17);
        ctx.globalAlpha = fade * (isSpawn ? 0.52 : 0.68);
        drawPixelRing(ctx, cx, cy, ringR, 2, fx.color, 14, (isSpawn ? -1 : 1) * t * 1.6);

        if (!isSpawn && t < 0.45) {
          ctx.globalAlpha = (1 - t / 0.45) * 0.55;
          drawPixelRing(ctx, cx, cy, 4 + t * 14, 1, '#ffffff', 8, -t * 2.2);
        }

        for (const m of fx.motes) {
          const mx = Math.round(cx + m.ox + m.vx * fx.age);
          const my = Math.round(cy + m.oy + m.vy * fx.age);
          ctx.globalAlpha = fade * 0.82;
          ctx.fillStyle = fx.color;
          ctx.fillRect(mx - 1, my - 1, 2, 2);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(mx, my, 1, 1);
        }

        // Delicate stream of 4 luminous pixel glints flowing from popped capsule -> fighter
        if (fx.streamToPlayer && player && player.alive && t < 0.85) {
          const st = t / 0.85;
          const midX = (fx.x + player.x) * 0.5 + fx.curveSide * 22;
          const midY = (fx.y + player.y) * 0.5;
          for (let k = 0; k < 4; k++) {
            const u = clamp(st - k * 0.09, 0, 1);
            if (u <= 0 || u >= 1) continue;
            const inv = 1 - u;
            const sx = Math.round(inv * inv * fx.x + 2 * inv * u * midX + u * u * player.x);
            const sy = Math.round(inv * inv * fx.y + 2 * inv * u * midY + u * u * player.y);
            ctx.globalAlpha = (1 - k * 0.2) * Math.sin(u * Math.PI) * 0.85;
            ctx.fillStyle = k === 0 ? '#ffffff' : fx.color;
            ctx.fillRect(sx - 1, sy - 1, k === 0 ? 3 : 2, k === 0 ? 3 : 2);
          }
        }
      }
    } else {
      // --- ALPHA TEST LEGACY VECTOR SKIN SUBTLE POWER-UP FX ---
      if (isShip) {
        const ringR = 11 + t * 18;
        for (const ox of offsets) {
          const cx = baseX + ox;
          const cy = baseY;
          ctx.globalAlpha = fade * 0.62;
          ctx.strokeStyle = fx.color;
          ctx.shadowColor = fx.color;
          ctx.shadowBlur = 8;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
          ctx.stroke();

          // Subtle upward neon chevron scan wave over wireframe fighter
          if (t < 0.78) {
            const st = t / 0.78;
            const sy = cy + 12 - st * 26;
            const sw = 12 - Math.abs(st - 0.5) * 6;
            ctx.globalAlpha = Math.sin(st * Math.PI) * 0.78;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.25;
            ctx.beginPath();
            ctx.moveTo(cx - sw, sy + 4);
            ctx.lineTo(cx, sy - 2);
            ctx.lineTo(cx + sw, sy + 4);
            ctx.stroke();
          }
        }
        // Subtle rising neon diamond motes
        ctx.shadowBlur = 6;
        for (const m of fx.motes) {
          const mx = baseX + m.ox + m.vx * fx.age;
          const my = baseY + m.oy + m.vy * fx.age;
          ctx.globalAlpha = fade * 0.82;
          ctx.strokeStyle = fx.color;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(mx, my - 2.4);
          ctx.lineTo(mx + 2.4, my);
          ctx.lineTo(mx, my + 2.4);
          ctx.lineTo(mx - 2.4, my);
          ctx.closePath();
          ctx.stroke();
        }
      } else {
        const ringR = isSpawn ? (18 - t * 10) : (8 + t * 17);
        ctx.globalAlpha = fade * 0.68;
        ctx.strokeStyle = fx.color;
        ctx.shadowColor = fx.color;
        ctx.shadowBlur = 8;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(baseX, baseY, ringR, 0, Math.PI * 2);
        ctx.stroke();

        for (const m of fx.motes) {
          const mx = baseX + m.ox + m.vx * fx.age;
          const my = baseY + m.oy + m.vy * fx.age;
          ctx.globalAlpha = fade * 0.78;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(mx, my, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }

        if (fx.streamToPlayer && player && player.alive && t < 0.85) {
          const st = t / 0.85;
          const midX = (fx.x + player.x) * 0.5 + fx.curveSide * 22;
          const midY = (fx.y + player.y) * 0.5;
          for (let k = 0; k < 4; k++) {
            const u = clamp(st - k * 0.09, 0, 1);
            if (u <= 0 || u >= 1) continue;
            const inv = 1 - u;
            const sx = inv * inv * fx.x + 2 * inv * u * midX + u * u * player.x;
            const sy = inv * inv * fx.y + 2 * inv * u * midY + u * u * player.y;
            ctx.globalAlpha = (1 - k * 0.2) * Math.sin(u * Math.PI) * 0.85;
            ctx.fillStyle = k === 0 ? '#ffffff' : fx.color;
            ctx.beginPath();
            ctx.arc(sx, sy, k === 0 ? 2.1 : 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    ctx.restore();
  }
}

/* =========================================================================
   5) PLASMA RINGS WEAPON, GUIDED AIM LINE & GLOWING 8s ARENA BORDER
   (Green + Dark Purple + Hints of Yellow — works on 32-Bit & Alpha Test!)
   ========================================================================= */
function raycastToArenaBorder(ox, oy, dx, dy, pad = PLASMA_RING_RADIUS) {
  const minX = pad;
  const maxX = LOGICAL_W - pad;
  const minY = pad;
  const maxY = LOGICAL_H - pad;
  let bestT = Infinity;
  let hitVertical = false;

  if (Math.abs(dx) > 1e-5) {
    const tL = (minX - ox) / dx;
    if (tL > 0.5 && tL < bestT) { bestT = tL; hitVertical = true; }
    const tR = (maxX - ox) / dx;
    if (tR > 0.5 && tR < bestT) { bestT = tR; hitVertical = true; }
  }
  if (Math.abs(dy) > 1e-5) {
    const tT = (minY - oy) / dy;
    if (tT > 0.5 && tT < bestT) { bestT = tT; hitVertical = false; }
    const tB = (maxY - oy) / dy;
    if (tB > 0.5 && tB < bestT) { bestT = tB; hitVertical = false; }
  }
  if (!Number.isFinite(bestT)) {
    return { x: ox, y: oy, rx: dx, ry: dy };
  }
  return {
    x: clamp(ox + dx * bestT, minX, maxX),
    y: clamp(oy + dy * bestT, minY, maxY),
    rx: hitVertical ? -dx : dx,
    ry: hitVertical ? dy : -dy
  };
}

export function drawPixelPlasmaRing(ctx, ring, time = 0) {
  const rx = Math.round(ring.x);
  const ry = Math.round(ring.y);
  const r = Math.round(ring.radius || PLASMA_RING_RADIUS);
  const spin = ring.spin || (time * 8);

  ctx.save();
  // Translucent dark-purple + green stepped plasma afterimage trail
  if (ring.trail && ring.trail.length > 0) {
    const tLen = ring.trail.length;
    for (let k = 0; k < tLen; k += 2) {
      const frac = (k + 1) / Math.max(1, tLen);
      ctx.globalAlpha = frac * 0.34;
      drawPixelRing(
        ctx,
        ring.trail[k].x,
        ring.trail[k].y,
        Math.max(8, r - (1 - frac) * 4),
        2,
        k % 4 === 0 ? COLORS.centophagePurple : COLORS.centoidGreen,
        14,
        spin - (tLen - k) * 0.25
      );
    }
    ctx.globalAlpha = 1;
  }

  // Subtle dark-purple translucent inner energy field (ring remains clearly hollow!)
  ctx.globalAlpha = 0.22;
  drawPixelDisc(ctx, rx, ry, r - 3, '#251766');
  ctx.globalAlpha = 1;

  // Outer dark-purple containment halo -> vibrant acid-green main plasma ring -> crisp lime-white core rim
  drawPixelRing(ctx, rx, ry, r + 1, 4, '#251766', 24, spin * 0.5);
  drawPixelRing(ctx, rx, ry, r, 3, '#4e30b8', 24, -spin * 0.4);
  drawPixelRing(ctx, rx, ry, r - 1, 3, '#2dff7a', 24, spin);
  drawPixelRing(ctx, rx, ry, r - 2, 2, COLORS.centophageAcid, 20, -spin * 0.8);
  drawPixelRing(ctx, rx, ry, r - 4, 1, '#f4ffba', 16, spin * 1.2);

  // 3 orbiting bright yellow plasma spark nodes riding the ring circumference
  for (let k = 0; k < 3; k++) {
    const a = spin * 1.4 + (k * Math.PI * 2) / 3;
    const sx = Math.round(rx + Math.cos(a) * r);
    const sy = Math.round(ry + Math.sin(a) * r);
    ctx.fillStyle = COLORS.yellow;
    ctx.fillRect(sx - 2, sy - 2, 4, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx - 1, sy - 1, 2, 2);
  }
  ctx.restore();
}

export function drawPlasmaShieldBubble(ctx, player, time = 0, isPixel = true, fadeRatio = 1) {
  if (!player || !player.alive || fadeRatio <= 0.01) return;
  const r = (player.dual ? 33 : 25) + Math.sin(time * 9) * 1.2;
  const px = Math.round(player.x);
  const py = Math.round(player.y);

  ctx.save();
  // Translucent green + dark-purple protective dome fill (clearly reads as a temporary damage-blocking shield!)
  ctx.globalAlpha = 0.24 * fadeRatio;
  if (isPixel) {
    drawPixelDisc(ctx, px, py, r - 1, '#251766');
    ctx.globalAlpha = 0.16 * fadeRatio;
    drawPixelDisc(ctx, px, py, r - 4, '#2dff7a');
  } else {
    const grad = ctx.createRadialGradient(px, py, 3, px, py, r);
    grad.addColorStop(0, 'rgba(37, 23, 102, 0.14)');
    grad.addColorStop(0.68, 'rgba(78, 48, 184, 0.32)');
    grad.addColorStop(1, 'rgba(45, 255, 122, 0.48)');
    ctx.globalAlpha = fadeRatio;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Crisp double-ring shield barrier + orbiting yellow energy nodes
  if (isPixel) {
    ctx.globalAlpha = 0.88 * fadeRatio;
    drawPixelRing(ctx, px, py, r + 2, 3, '#4e30b8', 24, -time * 1.8);
    drawPixelRing(ctx, px, py, r, 2, '#2dff7a', 24, time * 2.2);
    ctx.globalAlpha = 0.72 * fadeRatio;
    drawPixelRing(ctx, px, py, r - 2, 1, '#e8ff9e', 16, -time * 2.6);
    ctx.globalAlpha = 0.95 * fadeRatio;
    for (let k = 0; k < 4; k++) {
      const a = time * 2.8 + k * (Math.PI * 0.5);
      const tx = Math.round(px + Math.cos(a) * (r + 1));
      const ty = Math.round(py + Math.sin(a) * (r + 1));
      ctx.fillStyle = COLORS.yellow;
      ctx.fillRect(tx - 1, ty - 1, 3, 3);
    }
  } else {
    ctx.globalAlpha = 0.9 * fadeRatio;
    ctx.strokeStyle = '#4e30b8';
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.arc(px, py, r + 1.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#2dff7a';
    ctx.shadowColor = COLORS.centophageAcid;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.stroke();
    for (let k = 0; k < 4; k++) {
      const a = time * 2.8 + k * (Math.PI * 0.5);
      ctx.fillStyle = COLORS.yellow;
      ctx.beginPath();
      ctx.arc(px + Math.cos(a) * (r + 1), py + Math.sin(a) * (r + 1), 2.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawPlasmaAimGuide(ctx, player, ps, time = 0, isPixel = true) {
  if (!player || !player.alive || !ps) return;
  const dx = Math.cos(ps.aimAngle);
  const dy = Math.sin(ps.aimAngle);
  const hit1 = raycastToArenaBorder(player.x, player.y, dx, dy, PLASMA_RING_RADIUS);
  const hit2 = raycastToArenaBorder(hit1.x, hit1.y, hit1.rx, hit1.ry, PLASMA_RING_RADIUS);

  // Cap bounce preview ray to ~180px so it's super helpful without cluttering the screen
  const bdx = hit2.x - hit1.x;
  const bdy = hit2.y - hit1.y;
  const bLen = Math.hypot(bdx, bdy);
  const previewLen = Math.min(180, bLen);
  const bEndX = bLen > 1 ? hit1.x + (bdx / bLen) * previewLen : hit1.x;
  const bEndY = bLen > 1 ? hit1.y + (bdy / bLen) * previewLen : hit1.y;

  const pulse = 0.72 + Math.sin(time * 12) * 0.28;

  // 1) Temporary damage-blocking protective Plasma Shield bubble around the aiming fighter!
  drawPlasmaShieldBubble(ctx, player, time, isPixel, 1);

  ctx.save();

  // 2) Primary guided aim line (dark purple backing + acid green dash + racing yellow chevrons!)
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = '#4e30b8';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(hit1.x, hit1.y);
  ctx.stroke();

  ctx.globalAlpha = 0.94;
  ctx.strokeStyle = COLORS.centophageAcid;
  ctx.shadowColor = '#2dff7a';
  ctx.shadowBlur = isPixel ? 0 : 10;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.lineDashOffset = -(time * 68);
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(hit1.x, hit1.y);
  ctx.stroke();

  // Ricochet preview ray (translucent violet-green)
  ctx.globalAlpha = 0.52;
  ctx.strokeStyle = COLORS.centophageViolet;
  ctx.lineWidth = 1.8;
  ctx.setLineDash([5, 6]);
  ctx.lineDashOffset = -(time * 52);
  ctx.beginPath();
  ctx.moveTo(hit1.x, hit1.y);
  ctx.lineTo(bEndX, bEndY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Racing yellow spark pips traveling along primary aim line
  const dist1 = Math.hypot(hit1.x - player.x, hit1.y - player.y);
  const step = 48;
  const off = (time * 130) % step;
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = COLORS.yellow;
  for (let d = off; d < dist1 - 10; d += step) {
    const px = Math.round(player.x + dx * d);
    const py = Math.round(player.y + dy * d);
    ctx.fillRect(px - 2, py - 2, 4, 4);
  }

  // 3) Wall impact reticle diamond at first ricochet point
  const hx = Math.round(hit1.x);
  const hy = Math.round(hit1.y);
  ctx.globalAlpha = pulse;
  ctx.strokeStyle = COLORS.yellow;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(hx, hy - 7);
  ctx.lineTo(hx + 7, hy);
  ctx.lineTo(hx, hy + 7);
  ctx.lineTo(hx - 7, hy);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = '#2dff7a';
  ctx.fillRect(hx - 2, hy - 2, 4, 4);

  // 4) Compact aiming prompt & 4.0s countdown bar right beneath the stopped fighter
  const promptY = Math.min(LOGICAL_H - 12, Math.round(player.y + 34));
  const aimLeft = Math.max(0, ps.aimTimer !== undefined ? ps.aimTimer : 4.0);
  const aimMax = Math.max(0.1, ps.aimMax || 4.0);
  const urgent = ps.phase === 'AIMING' && aimLeft < 1.25;
  const msg = ps.phase === 'FIRING'
    ? (ps.randomAutoFire ? `AUTO-FIRE (${ps.shotsLeft})` : `FIRING PLASMA (${ps.shotsLeft})`)
    : `AIM & FIRE (${aimLeft.toFixed(1)}s)`;
  ctx.globalAlpha = 0.94;
  ctx.font = '700 8px "Silkscreen", ui-monospace, monospace';
  ctx.textAlign = 'center';
  const boxW = 122;
  const bx = Math.round(player.x - boxW * 0.5);
  ctx.fillStyle = 'rgba(12, 6, 28, 0.9)';
  ctx.fillRect(bx, promptY - 9, boxW, ps.phase === 'AIMING' ? 16 : 13);
  ctx.fillStyle = urgent ? COLORS.yellow : COLORS.centophageAcid;
  ctx.fillText(msg, Math.round(player.x), promptY);
  if (ps.phase === 'AIMING') {
    const ratio = clamp(aimLeft / aimMax, 0, 1);
    const barW = boxW - 8;
    ctx.fillStyle = '#251766';
    ctx.fillRect(bx + 4, promptY + 3, barW, 3);
    ctx.fillStyle = urgent ? COLORS.yellow : '#2dff7a';
    ctx.fillRect(bx + 4, promptY + 3, Math.round(barW * ratio), 3);
  }
  ctx.restore();
}

export function drawPlasmaArenaBorder(ctx, ps, time = 0, isPixel = true, isSandbox = false) {
  if (!ps || !ps.borderActive) return;
  const expiring = ps.borderTimerStarted && ps.borderTimer < 1.6;
  const blink = expiring ? (0.45 + 0.55 * Math.abs(Math.sin(time * 22))) : 1;
  const pulse = (0.82 + Math.sin(time * 9) * 0.18) * blink;

  ctx.save();
  // 1) Soft dark-purple + green edge aura vignette hugging all 4 arena walls
  const edgeW = 16;
  const gTop = ctx.createLinearGradient(0, 0, 0, edgeW);
  gTop.addColorStop(0, `rgba(78, 48, 184, ${(0.52 * pulse).toFixed(3)})`);
  gTop.addColorStop(0.45, `rgba(45, 255, 122, ${(0.22 * pulse).toFixed(3)})`);
  gTop.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gTop;
  ctx.fillRect(0, 0, LOGICAL_W, edgeW);

  const gBot = ctx.createLinearGradient(0, LOGICAL_H, 0, LOGICAL_H - edgeW);
  gBot.addColorStop(0, `rgba(78, 48, 184, ${(0.52 * pulse).toFixed(3)})`);
  gBot.addColorStop(0.45, `rgba(45, 255, 122, ${(0.22 * pulse).toFixed(3)})`);
  gBot.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gBot;
  ctx.fillRect(0, LOGICAL_H - edgeW, LOGICAL_W, edgeW);

  const gLeft = ctx.createLinearGradient(0, 0, edgeW, 0);
  gLeft.addColorStop(0, `rgba(78, 48, 184, ${(0.52 * pulse).toFixed(3)})`);
  gLeft.addColorStop(0.45, `rgba(45, 255, 122, ${(0.22 * pulse).toFixed(3)})`);
  gLeft.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gLeft;
  ctx.fillRect(0, 0, edgeW, LOGICAL_H);

  const gRight = ctx.createLinearGradient(LOGICAL_W, 0, LOGICAL_W - edgeW, 0);
  gRight.addColorStop(0, `rgba(78, 48, 184, ${(0.52 * pulse).toFixed(3)})`);
  gRight.addColorStop(0.45, `rgba(45, 255, 122, ${(0.22 * pulse).toFixed(3)})`);
  gRight.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gRight;
  ctx.fillRect(LOGICAL_W - edgeW, 0, edgeW, LOGICAL_H);

  // 2) Crisp layered 4-sided glowing containment rails (Dark Purple outer -> Toxic Green inner!)
  ctx.globalAlpha = pulse;
  if (isPixel) {
    // Dark purple outer containment border (3px)
    ctx.fillStyle = '#251766';
    ctx.fillRect(0, 0, LOGICAL_W, 5);
    ctx.fillRect(0, LOGICAL_H - 5, LOGICAL_W, 5);
    ctx.fillRect(0, 0, 5, LOGICAL_H);
    ctx.fillRect(LOGICAL_W - 5, 0, 5, LOGICAL_H);

    // Mid violet pulse dashes alternating with acid green
    ctx.fillStyle = '#4e30b8';
    ctx.fillRect(1, 1, LOGICAL_W - 2, 3);
    ctx.fillRect(1, LOGICAL_H - 4, LOGICAL_W - 2, 3);
    ctx.fillRect(1, 1, 3, LOGICAL_H - 2);
    ctx.fillRect(LOGICAL_W - 4, 1, 3, LOGICAL_H - 2);

    // Bright green inner neon border rail (2px)
    ctx.fillStyle = '#2dff7a';
    ctx.fillRect(3, 3, LOGICAL_W - 6, 2);
    ctx.fillRect(3, LOGICAL_H - 5, LOGICAL_W - 6, 2);
    ctx.fillRect(3, 3, 2, LOGICAL_H - 6);
    ctx.fillRect(LOGICAL_W - 5, 3, 2, LOGICAL_H - 6);
  } else {
    ctx.strokeStyle = '#4e30b8';
    ctx.shadowColor = '#4e30b8';
    ctx.shadowBlur = 14;
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, LOGICAL_W - 6, LOGICAL_H - 6);

    ctx.strokeStyle = '#2dff7a';
    ctx.shadowColor = COLORS.centophageAcid;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 2.4;
    ctx.strokeRect(4, 4, LOGICAL_W - 8, LOGICAL_H - 8);
  }

  // 3) Racing hints of yellow energy sparks gliding around the perimeter + corner anchor gems!
  const perim = (LOGICAL_W + LOGICAL_H) * 2;
  const sparkCount = 10;
  for (let i = 0; i < sparkCount; i++) {
    let dist = ((i / sparkCount) * perim + time * 210) % perim;
    let sx = 0;
    let sy = 0;
    let horiz = true;
    if (dist < LOGICAL_W) {
      sx = dist; sy = 3; horiz = true;
    } else if (dist < LOGICAL_W + LOGICAL_H) {
      sx = LOGICAL_W - 3; sy = dist - LOGICAL_W; horiz = false;
    } else if (dist < LOGICAL_W * 2 + LOGICAL_H) {
      sx = LOGICAL_W - (dist - LOGICAL_W - LOGICAL_H); sy = LOGICAL_H - 3; horiz = true;
    } else {
      sx = 3; sy = LOGICAL_H - (dist - LOGICAL_W * 2 - LOGICAL_H); horiz = false;
    }
    ctx.fillStyle = i % 2 === 0 ? COLORS.yellow : COLORS.centophageAcid;
    if (horiz) {
      ctx.fillRect(Math.round(sx - 7), Math.round(sy - 1), 14, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(sx - 3), Math.round(sy), 6, 1);
    } else {
      ctx.fillRect(Math.round(sx - 1), Math.round(sy - 7), 3, 14);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(sx), Math.round(sy - 3), 1, 6);
    }
  }

  // Glowing corner reflector blocks (dark purple + green + yellow center)
  const corners = [
    [2, 2],
    [LOGICAL_W - 12, 2],
    [2, LOGICAL_H - 12],
    [LOGICAL_W - 12, LOGICAL_H - 12]
  ];
  for (const [cx, cy] of corners) {
    ctx.fillStyle = '#4e30b8';
    ctx.fillRect(cx, cy, 10, 10);
    ctx.fillStyle = '#2dff7a';
    ctx.fillRect(cx + 2, cy + 2, 6, 6);
    ctx.fillStyle = COLORS.yellow;
    ctx.fillRect(cx + 4, cy + 4, 2, 2);
  }

  // 4) Compact top-center Plasma Border countdown pill
  const pillY = isSandbox ? 36 : 10;
  const pillW = 164;
  const pillX = Math.round(LOGICAL_W * 0.5 - pillW * 0.5);
  const label = ps.borderTimerStarted
    ? `PLASMA BORDER // ${ps.borderTimer.toFixed(1)}s`
    : `PLASMA BORDER // ARMED`;
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = 'rgba(14, 8, 34, 0.88)';
  ctx.fillRect(pillX, pillY, pillW, 15);
  ctx.fillStyle = '#4e30b8';
  ctx.fillRect(pillX, pillY, pillW, 1);
  ctx.fillRect(pillX, pillY + 14, pillW, 1);
  ctx.fillStyle = expiring ? COLORS.yellow : '#2dff7a';
  ctx.fillRect(pillX, pillY, 3, 15);
  ctx.fillRect(pillX + pillW - 3, pillY, 3, 15);
  ctx.font = '700 7.6px "Silkscreen", ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = expiring ? COLORS.yellow : COLORS.centophageAcid;
  ctx.fillText(label, LOGICAL_W * 0.5, pillY + 10);
  ctx.restore();
}
