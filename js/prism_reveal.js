/* =========================================================================
   SZARKK — HARD MODE LIGHT PRISM REVEAL ENGINE (MODULAR & EXTENSIBLE)
   -------------------------------------------------------------------------
   - Automatically discovers all unlocked capsules via getUnlockedCapsuleTypes
     (backed by CAPSULE_UNLOCK_SECTORS in config.js) and renders them using
     the live drawPixelCapsule() sprite renderer — new power-ups added later
     automatically join the random roll, roulette cycle, and dissolve FX!
   - To add/edit an animation, add one entry to PRISM_ANIMATIONS below.
   - To add a custom button bezel theme for a future capsule, add one entry
     to CAPSULE_PRISM_STYLES below (unlisted types gracefully use FALLBACK).
   ========================================================================= */

import { COLORS } from './config.js';
import { clamp } from './utils.js';
import { drawPixelCapsule } from './sprites.js';
import { getUnlockedCapsuleTypes, queueReadyPowerup } from './powerups.js';

export const PRISM_SPECTRUM = [
  '#00f6ff',
  '#7efaff',
  '#e8a6ff',
  '#ff52c8',
  '#ffe640',
  '#2dff7a'
];

// Single visual style registry for Ready/Prism bezels — add one entry when introducing a new power-up!
export const CAPSULE_PRISM_STYLES = {
  CYAN: {
    cls: 'pwr-cyan',
    main: '#00f6ff',
    top: '#c4ffff',
    sides: '#00f6ff',
    bot: '#147aff',
    bg: '#041d2e',
    pip: '#00f6ff',
    halo: 'rgba(0, 246, 255, 0.54)'
  },
  RED: {
    cls: 'pwr-red',
    main: '#ff1e42',
    top: '#ffafc2',
    sides: '#ff1e42',
    bot: '#c40e2c',
    bg: '#26040b',
    pip: '#ff4769',
    halo: 'rgba(255, 30, 66, 0.54)'
  },
  PURPLE: {
    cls: 'pwr-purple',
    main: '#c44dff',
    top: '#f2ccff',
    sides: '#c44dff',
    bot: '#7c24e8',
    bg: '#1e0532',
    pip: '#d67bff',
    halo: 'rgba(196, 77, 255, 0.54)'
  },
  YELLOW: {
    cls: 'pwr-yellow',
    main: '#ffe640',
    top: '#fff7b2',
    sides: '#ffe640',
    bot: '#ff9e1b',
    bg: '#291b02',
    pip: '#ffe640',
    halo: 'rgba(255, 224, 48, 0.54)'
  },
  CLONE: {
    cls: 'pwr-clone',
    main: '#6c44ff',
    top: '#d4c8ff',
    sides: '#6c44ff',
    bot: '#2f5bff',
    bg: '#100c36',
    pip: '#8a66ff',
    halo: 'rgba(118, 72, 255, 0.58)'
  },
  PLASMA: {
    cls: 'pwr-plasma',
    main: '#2dff7a',
    top: '#ccff00',
    sides: '#2dff7a',
    bot: '#6e3ef2',
    bg: '#151232',
    pip: '#ccff00',
    halo: 'rgba(52, 255, 122, 0.56)'
  }
};

const FALLBACK_CAPSULE_STYLE = {
  cls: 'pwr-cyan',
  main: COLORS.cyan,
  top: '#ffffff',
  sides: COLORS.cyan,
  bot: COLORS.blue,
  bg: '#081b2e',
  pip: COLORS.cyan,
  halo: 'rgba(0, 246, 255, 0.54)'
};

export function getCapsulePrismStyle(type) {
  return CAPSULE_PRISM_STYLES[type] || FALLBACK_CAPSULE_STYLE;
}

export function spectralColor(phase) {
  const n = PRISM_SPECTRUM.length;
  const idx = ((Math.floor(phase) % n) + n) % n;
  return PRISM_SPECTRUM[idx];
}

function getPrismBezel(time) {
  return {
    bg: '#11162c',
    top: '#ffffff',
    sides: spectralColor(time * 4.5),
    bot: spectralColor(time * 4.5 + 2),
    pip: '#ffffff',
    halo: 'rgba(180, 240, 255, 0.62)',
    barTop: spectralColor(time * 4.5)
  };
}

// 4x4 Retro Ordered Bayer Dither Matrix (0..15)
const BAYER4 = [
  [ 0,  8,  2, 10],
  [12,  4, 14,  6],
  [ 3, 11,  1,  9],
  [15,  7, 13,  5]
];

// Deterministic spectral pixel motes for Bayer Pixel Dissolve
const BAYER_MOTES = Array.from({ length: 28 }, (_, i) => ({
  ang: (i / 28) * Math.PI * 2 + (i % 3) * 0.2,
  dist: 10 + ((i * 7) % 20),
  colorIdx: i % PRISM_SPECTRUM.length,
  delay: (i % 7) * 0.04
}));

// Reusable offscreen sprite buffers (avoids per-frame DOM allocations)
const SPRITE_W = 56;
const SPRITE_H = 32;
let _prismBuf = null;
let _capBuf = null;

function ensureBuffer(buf) {
  if (buf) return buf;
  const c = document.createElement('canvas');
  c.width = SPRITE_W * 2;
  c.height = SPRITE_H * 2;
  return c;
}

/**
 * Draws SZARKK's faceted 32-bit Pixel Light Prism sprite (centered at x, y).
 */
export function drawPixelLightPrism(ctx, x, y, time = 0, scale = 1.0) {
  const s = 2.6 * scale;
  const cA = spectralColor(time * 4.5);
  const cB = spectralColor(time * 4.5 + 2);
  const cC = spectralColor(time * 4.5 + 4);

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.shadowColor = cA;
  ctx.shadowBlur = 12;

  const rows = [
    [-0.5, 1, '#ffffff'],
    [-1.5, 3, cA],
    [-2.5, 5, '#e8fbff'],
    [-3.5, 7, cB],
    [-4.5, 9, '#ffffff'],
    [-3.5, 7, cC],
    [-2.5, 5, '#d8f6ff'],
    [-1.5, 3, cA],
    [-0.5, 1, '#ffffff']
  ];
  for (let r = 0; r < rows.length; r++) {
    const ry = (r - 4.5) * s;
    const [x0, w, col] = rows[r];
    ctx.fillStyle = col;
    ctx.fillRect(x0 * s, ry, w * s, s);
  }

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#091830';
  ctx.fillRect(-2.5 * s, -1.5 * s, 5 * s, 3 * s);
  ctx.fillRect(-1.5 * s, -2.5 * s, 3 * s, 5 * s);

  ctx.fillStyle = cA;
  ctx.fillRect(-2.5 * s, -1.5 * s, 2 * s, 2 * s);
  ctx.fillStyle = cB;
  ctx.fillRect(0.5 * s, -1.5 * s, 2 * s, 2 * s);
  ctx.fillStyle = cC;
  ctx.fillRect(-1.5 * s, 0.5 * s, 3 * s, 1 * s);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-0.5 * s, -2.5 * s, 1 * s, 5 * s);
  ctx.fillRect(-1.5 * s, -0.5 * s, 3 * s, 1 * s);

  const glint = Math.floor(time * 8) % 4;
  const gPts = [[-5.5, -2.5], [4.5, -2.5], [4.5, 1.5], [-5.5, 1.5]];
  const [gx, gy] = gPts[glint];
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(gx * s, gy * s, s, s);
  const [gx2, gy2] = gPts[(glint + 2) % 4];
  ctx.fillStyle = cB;
  ctx.fillRect(gx2 * s, gy2 * s, s, s);

  ctx.restore();
}

function getPrismSpriteBuffer(time, expand = 1) {
  _prismBuf = ensureBuffer(_prismBuf);
  const bctx = _prismBuf.getContext('2d');
  bctx.setTransform(2, 0, 0, 2, 0, 0);
  bctx.clearRect(0, 0, SPRITE_W, SPRITE_H);
  drawPixelLightPrism(bctx, SPRITE_W * 0.5, SPRITE_H * 0.5, time, expand);
  return _prismBuf;
}

function getCapsuleSpriteBuffer(type) {
  _capBuf = ensureBuffer(_capBuf);
  const bctx = _capBuf.getContext('2d');
  bctx.setTransform(2, 0, 0, 2, 0, 0);
  bctx.clearRect(0, 0, SPRITE_W, SPRITE_H);
  // Matches the exact Ready button capsule call (scale 1.0, glowing, stationary)
  drawPixelCapsule(bctx, SPRITE_W * 0.5, SPRITE_H * 0.5, type, Math.PI / 14, 1.0, false);
  return _capBuf;
}

// =========================================================================
// EXTENSIBLE ANIMATION REGISTRY (Add / reorder / tweak entries freely!)
// =========================================================================
export const PRISM_ANIMATIONS = [
  {
    id: 'GLITCH',
    label: 'Chromatic Scanline Glitch',
    duration: 1.55,
    midSfxAt: 0.45,
    lockAt: 1.15,
    render(ctx, W, H, pr, now) {
      const t = pr.elapsed;
      const capStyle = getCapsulePrismStyle(pr.targetType);
      const pBuf = getPrismSpriteBuffer(now, 1);
      const cBuf = getCapsuleSpriteBuffer(pr.targetType);
      const cx = W * 0.5;
      const cy = H * 0.5;
      const sx = cx - SPRITE_W * 0.5;
      const sy = cy - SPRITE_H * 0.5;

      let bezel = getPrismBezel(now);
      let flash = 0;

      if (t >= 0.45 && t < 1.15) {
        const g = (t - 0.45) / 0.70;
        const flip = Math.sin(now * 58 + pr.seed) > (0.35 - g * 0.7);
        bezel = flip ? { ...capStyle, barTop: capStyle.main } : getPrismBezel(now * 3);
      } else if (t >= 1.15) {
        bezel = { ...capStyle, barTop: capStyle.main };
        if (t < 1.38) flash = (1 - (t - 1.15) / 0.23) * 0.85;
      }

      if (t < 0.45) {
        ctx.drawImage(pBuf, 0, 0, SPRITE_W * 2, SPRITE_H * 2, sx, sy, SPRITE_W, SPRITE_H);
      } else if (t < 1.15) {
        const g = (t - 0.45) / 0.70;
        const intensity = Math.sin(g * Math.PI);
        const sliceH = 2;
        const tick = Math.floor(t * 28);

        for (let y = 0; y < SPRITE_H; y += sliceH) {
          const hash = Math.sin(y * 12.9898 + tick * 78.233 + pr.seed) * 43758.5453;
          const rnd = hash - Math.floor(hash);
          const showCap = rnd < g;
          const src = showCap ? cBuf : pBuf;
          const tear = ((rnd - 0.5) * 2) * (4 + intensity * 26);

          ctx.globalAlpha = 0.55 * intensity;
          ctx.drawImage(src, 0, y * 2, SPRITE_W * 2, sliceH * 2, Math.round(sx + tear - 5), sy + y, SPRITE_W, sliceH);
          ctx.drawImage(src, 0, y * 2, SPRITE_W * 2, sliceH * 2, Math.round(sx + tear + 5), sy + y, SPRITE_W, sliceH);

          ctx.globalAlpha = 1;
          ctx.drawImage(src, 0, y * 2, SPRITE_W * 2, sliceH * 2, Math.round(sx + tear), sy + y, SPRITE_W, sliceH);

          if (rnd > 0.87) {
            ctx.fillStyle = rnd > 0.94 ? '#ffffff' : (showCap ? capStyle.main : spectralColor(tick + y));
            ctx.globalAlpha = 0.65 * intensity;
            ctx.fillRect(6, sy + y, W - 12, 1);
          }
        }
        ctx.globalAlpha = 1;
      } else {
        ctx.drawImage(cBuf, 0, 0, SPRITE_W * 2, SPRITE_H * 2, sx, sy, SPRITE_W, SPRITE_H);
      }

      if (flash > 0.01) {
        ctx.fillStyle = `rgba(255, 255, 255, ${clamp(flash, 0, 1).toFixed(3)})`;
        ctx.fillRect(0, 0, W, H);
      }

      return { bezel, scale: 1 };
    }
  },
  {
    id: 'BAYER',
    label: 'Bayer Pixel Dissolve',
    duration: 1.55,
    midSfxAt: 0.48,
    lockAt: 1.16,
    render(ctx, W, H, pr, now) {
      const t = pr.elapsed;
      const capStyle = getCapsulePrismStyle(pr.targetType);
      const pBuf = getPrismSpriteBuffer(now, 1);
      const cBuf = getCapsuleSpriteBuffer(pr.targetType);
      const cx = W * 0.5;
      const cy = H * 0.5;
      const sx = cx - SPRITE_W * 0.5;
      const sy = cy - SPRITE_H * 0.5;

      let bezel = getPrismBezel(now);
      let flash = 0;

      if (t >= 0.48 && t < 1.16) {
        const d = (t - 0.48) / 0.68;
        bezel = d > 0.55 ? { ...capStyle, barTop: capStyle.main } : getPrismBezel(now * 2);
      } else if (t >= 1.16) {
        bezel = { ...capStyle, barTop: capStyle.main };
        if (t < 1.35) flash = (1 - (t - 1.16) / 0.19) * 0.62;
      }

      if (t < 0.48) {
        const p = Math.sin((t / 0.48) * Math.PI);
        ctx.fillStyle = spectralColor(now * 6);
        ctx.globalAlpha = 0.35 + p * 0.45;
        ctx.fillRect(Math.round(cx - 42), Math.round(cy - 1), 14, 2);
        ctx.fillRect(Math.round(cx + 28), Math.round(cy - 1), 14, 2);
        ctx.globalAlpha = 1;
        ctx.drawImage(pBuf, 0, 0, SPRITE_W * 2, SPRITE_H * 2, sx, sy, SPRITE_W, SPRITE_H);
      } else if (t < 1.16) {
        const d = (t - 0.48) / 0.68;
        const cell = 2;
        for (let py = 0; py < SPRITE_H; py += cell) {
          const by4 = (py / cell) & 3;
          for (let px = 0; px < SPRITE_W; px += cell) {
            const bx4 = (px / cell) & 3;
            const thresh = (BAYER4[by4][bx4] + 0.5) / 16;
            const src = d < thresh ? pBuf : cBuf;
            ctx.drawImage(src, px * 2, py * 2, cell * 2, cell * 2, sx + px, sy + py, cell, cell);
          }
        }

        const arc = Math.sin(d * Math.PI);
        for (const m of BAYER_MOTES) {
          const md = clamp((d - m.delay) / (1 - m.delay), 0, 1);
          if (md <= 0 || md >= 1) continue;
          const r = Math.sin(md * Math.PI) * m.dist * 1.1;
          const a = m.ang + md * 1.8;
          const mx = Math.round(cx + Math.cos(a) * r * 1.45);
          const my = Math.round(cy + Math.sin(a) * r * 0.65);
          ctx.fillStyle = md > 0.62 ? capStyle.main : PRISM_SPECTRUM[m.colorIdx];
          ctx.globalAlpha = 0.85 * arc;
          ctx.fillRect(mx - 1, my - 1, 2, 2);
        }
        ctx.globalAlpha = 1;
      } else {
        ctx.drawImage(cBuf, 0, 0, SPRITE_W * 2, SPRITE_H * 2, sx, sy, SPRITE_W, SPRITE_H);
        if (t < 1.50) {
          const sp = (t - 1.16) / 0.34;
          const shineX = Math.round(sp * W);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
          ctx.fillRect(shineX - 6, 0, 6, H);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
          ctx.fillRect(shineX - 12, 0, 18, H);
        }
      }

      if (flash > 0.01) {
        ctx.fillStyle = `rgba(255, 255, 255, ${clamp(flash, 0, 1).toFixed(3)})`;
        ctx.fillRect(0, 0, W, H);
      }

      return { bezel, scale: 1 };
    }
  },
  {
    id: 'ROULETTE',
    label: 'Prism Glitch Roulette',
    duration: 1.75,
    midSfxAt: 0.38,
    lockAt: 1.36,
    render(ctx, W, H, pr, now) {
      const t = pr.elapsed;
      const pool = (pr.pool && pr.pool.length > 0) ? pr.pool : [pr.targetType];
      const targetIdx = Math.max(0, pool.indexOf(pr.targetType));
      const capStyle = getCapsulePrismStyle(pr.targetType);
      const cx = W * 0.5;
      const cy = H * 0.5;
      const sx = cx - SPRITE_W * 0.5;
      const sy = cy - SPRITE_H * 0.5;

      let bezel = getPrismBezel(now);
      let flash = 0;
      let scale = 1;
      let shownType = pr.targetType;
      let stepIdx = 0;
      let justTicked = false;

      if (t >= 0.38 && t < 1.36) {
        const u = (t - 0.38) / 0.98;
        const eased = 1 - Math.pow(1 - u, 2.6);
        const totalSteps = Math.max(10, pool.length * 2);
        stepIdx = Math.min(totalSteps, Math.floor(eased * totalSteps));
        const frac = (eased * totalSteps) - stepIdx;
        justTicked = frac < 0.28;
        const typeIdx = ((targetIdx - (totalSteps - stepIdx)) % pool.length + pool.length * 8) % pool.length;
        shownType = pool[typeIdx] || pr.targetType;
        const shownStyle = getCapsulePrismStyle(shownType);
        bezel = { ...shownStyle, barTop: shownStyle.main };
        pr._currentRouletteStep = stepIdx;
      } else if (t >= 1.36) {
        const k = clamp((t - 1.36) / 0.24, 0, 1);
        scale = t < 1.60 ? (1 + Math.sin(k * Math.PI) * 0.045) : 1;
        bezel = { ...capStyle, barTop: capStyle.main };
        if (t < 1.60) flash = (1 - k) * 0.92;
      }

      if (t < 0.38) {
        const expand = 1 + Math.sin((t / 0.38) * Math.PI) * 0.14;
        const pBuf = getPrismSpriteBuffer(now * 1.4, expand);
        ctx.drawImage(pBuf, 0, 0, SPRITE_W * 2, SPRITE_H * 2, sx, sy, SPRITE_W, SPRITE_H);
      } else if (t < 1.36) {
        const cBuf = getCapsuleSpriteBuffer(shownType);
        const jitterX = justTicked ? ((stepIdx % 2 === 0 ? 1 : -1) * 7) : 0;
        if (justTicked) {
          const pBuf = getPrismSpriteBuffer(now * 2, 1);
          ctx.globalAlpha = 0.55;
          ctx.drawImage(pBuf, 0, 0, SPRITE_W * 2, SPRITE_H * 2, sx - jitterX, sy, SPRITE_W, SPRITE_H);
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = 0.42;
          ctx.fillRect(4, Math.round(cy - 1 + ((stepIdx % 3) - 1) * 5), W - 8, 2);
        }
        ctx.globalAlpha = 1;
        ctx.drawImage(cBuf, 0, 0, SPRITE_W * 2, SPRITE_H * 2, sx + jitterX, sy, SPRITE_W, SPRITE_H);
      } else {
        const cBuf = getCapsuleSpriteBuffer(pr.targetType);
        ctx.drawImage(cBuf, 0, 0, SPRITE_W * 2, SPRITE_H * 2, sx, sy, SPRITE_W, SPRITE_H);
        if (t < 1.70) {
          const sp = (t - 1.36) / 0.34;
          const spread = sp * 22;
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = 1 - sp;
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + 0.4;
            ctx.fillRect(
              Math.round(cx + Math.cos(a) * (16 + spread * 2.2)),
              Math.round(cy + Math.sin(a) * (8 + spread * 0.65)),
              2,
              2
            );
          }
          ctx.globalAlpha = 1;
        }
      }

      if (flash > 0.01) {
        ctx.fillStyle = `rgba(255, 255, 255, ${clamp(flash, 0, 1).toFixed(3)})`;
        ctx.fillRect(0, 0, W, H);
      }

      return { bezel, scale };
    }
  }
];

export function pickRandomPrismAnimation(lastAnimId = null) {
  if (PRISM_ANIMATIONS.length <= 1) return PRISM_ANIMATIONS[0];
  const pool = PRISM_ANIMATIONS.filter(a => a.id !== lastAnimId);
  const src = pool.length > 0 ? pool : PRISM_ANIMATIONS;
  return src[Math.floor(Math.random() * src.length)];
}

export function getPrismAnimationById(id) {
  return PRISM_ANIMATIONS.find(a => a.id === id) || PRISM_ANIMATIONS[0];
}

/**
 * Starts the Hard Mode Round 1 Light Prism opening sequence right before the
 * Round 1 title card appears, dynamically drawing from all unlocked capsules.
 */
export function startHardModePrismIntro(game, forcedAnimId = null) {
  const effSec = game.getEffectiveSector ? game.getEffectiveSector() : 1;
  const pool = getUnlockedCapsuleTypes(effSec, 1, true, false);
  if (pool.length === 0) return false;

  const targetType = pool[Math.floor(Math.random() * pool.length)];
  const anim = forcedAnimId
    ? getPrismAnimationById(forcedAnimId)
    : pickRandomPrismAnimation(game._lastPrismAnimId || null);
  game._lastPrismAnimId = anim.id;

  game.sector = 1;
  game.isChallengeStage = false;
  game.sectorPhase = 'PRISM_INTRO';
  game.phaseTimer = anim.duration;
  game.bannerTitle = '';
  game.bannerSub = '';
  game.bannerNote = '';

  game.prismReveal = {
    active: true,
    animId: anim.id,
    duration: anim.duration,
    midSfxAt: anim.midSfxAt,
    lockAt: anim.lockAt,
    elapsed: 0,
    targetType,
    pool,
    seed: Math.random() * 100,
    midSoundPlayed: false,
    lockedSoundPlayed: false,
    lastRouletteStep: -1,
    _currentRouletteStep: -1
  };

  if (game.synth && game.synth.playPrismStart) {
    game.synth.playPrismStart();
  }
  return true;
}

/**
 * Advances the active Light Prism reveal and hands off seamlessly to the live
 * Ready capsule button + Hard Mode Sector 1 title card once locked in.
 */
export function updatePrismReveal(game, dt, onComplete) {
  const pr = game.prismReveal;
  if (!pr || !pr.active) return false;

  pr.elapsed += dt;

  if (!pr.midSoundPlayed && pr.elapsed >= pr.midSfxAt) {
    pr.midSoundPlayed = true;
    if (pr.animId !== 'ROULETTE' && game.synth && game.synth.playPrismGlitch) {
      game.synth.playPrismGlitch();
    }
  }

  if (
    pr.animId === 'ROULETTE' &&
    pr._currentRouletteStep !== pr.lastRouletteStep &&
    pr._currentRouletteStep >= 0
  ) {
    pr.lastRouletteStep = pr._currentRouletteStep;
    if (game.synth && game.synth.playPrismTick) {
      game.synth.playPrismTick(pr._currentRouletteStep);
    }
  }

  if (!pr.lockedSoundPlayed && pr.elapsed >= pr.lockAt) {
    pr.lockedSoundPlayed = true;
    if (game.synth && game.synth.playPrismReveal) {
      game.synth.playPrismReveal(pr.targetType);
    }
  }

  if (pr.elapsed >= pr.duration) {
    const revealedType = pr.targetType;
    game.prismReveal = null;
    queueReadyPowerup(game, revealedType);
    game._pwrGaugeKey = '';
    if (typeof onComplete === 'function') onComplete(revealedType);
    return true;
  }

  return false;
}

/**
 * Renders the live Light Prism -> Capsule transition directly inside the
 * gauge bar's centered prism button canvas & updates its pixel bezel colors.
 */
export function renderPrismRevealFrame(game, btnEl, canvasEl, barEl) {
  const pr = game.prismReveal;
  if (!pr || !pr.active || !btnEl || !canvasEl) return;

  const rect = btnEl.getBoundingClientRect();
  const cssW = Math.max(64, Math.round(rect.width || 160));
  const cssH = Math.max(28, Math.round(rect.height || 32));
  const targetW = cssW * 2;
  const targetH = cssH * 2;
  if (canvasEl.width !== targetW || canvasEl.height !== targetH) {
    canvasEl.width = targetW;
    canvasEl.height = targetH;
  }

  const ctx = canvasEl.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  const anim = getPrismAnimationById(pr.animId);
  const res = anim.render(ctx, cssW, cssH, pr, game.clock || 0);
  if (res && res.bezel) {
    const b = res.bezel;
    btnEl.style.setProperty('--px-top', b.top);
    btnEl.style.setProperty('--px-sides', b.sides);
    btnEl.style.setProperty('--px-bot', b.bot);
    btnEl.style.setProperty('--px-bg', b.bg);
    btnEl.style.setProperty('--px-pip', b.pip);
    btnEl.style.setProperty('--px-halo', b.halo);
    btnEl.style.transform = res.scale && res.scale !== 1 ? `scale(${res.scale.toFixed(3)})` : '';
    if (barEl && b.barTop) {
      barEl.style.borderTopColor = b.barTop;
    }
  }
}
