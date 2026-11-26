/* =========================================================================
   UNIFIED ANIMATION CONTROLLER (SHIP MOVEMENT BANKING + ONE-SHOT VFX QUEUE)
   Drives smooth left/right ship banking & upward thruster flare from BOTH
   keyboard (WASD/Arrows) and Touch 2D drag deltas, plus PixelLab explosion clips.
   ========================================================================= */

import { clamp } from './utils.js';
import { spriteLoader } from './sprite_loader.js';

/**
 * Call once per frame after player movement (and Touch drag) to compute
 * smoothed velocity, bankAxis (-1..+1), thrustAxis (-1..+1), and clip frames.
 */
export function updatePlayerAnimation(game, dt) {
  const p = game.player;
  if (!p) return;

  if (p.prevX === undefined) {
    p.prevX = p.x;
    p.prevY = p.y;
  }
  const safeDt = Math.max(0.001, dt);
  const instVx = (p.x - p.prevX) / safeDt;
  const instVy = (p.y - p.prevY) / safeDt;
  p.prevX = p.x;
  p.prevY = p.y;

  // Smooth velocity so banking transitions feel crisp yet organic on both keys & touch drag
  const smooth = Math.min(1, dt * 16);
  p.vx = (p.vx || 0) + (instVx - (p.vx || 0)) * smooth;
  p.vy = (p.vy || 0) + (instVy - (p.vy || 0)) * smooth;

  const targetBank = Math.abs(p.vx) > 22 ? clamp(p.vx / 210, -1, 1) : 0;
  const targetThrust = Math.abs(p.vy) > 22 ? clamp(-p.vy / 210, -1, 1) : 0; // +1 flying UP, -1 braking DOWN

  const bankRate = Math.min(1, dt * 14);
  p.bankAxis = (p.bankAxis || 0) + (targetBank - (p.bankAxis || 0)) * bankRate;
  p.thrustAxis = (p.thrustAxis || 0) + (targetThrust - (p.thrustAxis || 0)) * bankRate;
  if (Math.abs(p.bankAxis) < 0.02 && targetBank === 0) p.bankAxis = 0;
  if (Math.abs(p.thrustAxis) < 0.02 && targetThrust === 0) p.thrustAxis = 0;

  p.animClock = (p.animClock || 0) + dt;

  const aw = game.arcWaveState;
  const isOvercharge = aw && aw.phase === 'CANNON_CHARGING';
  if (isOvercharge) {
    p.animClip = 'overcharge';
  } else if (p.bankAxis <= -0.22) {
    p.animClip = 'bank_left';
  } else if (p.bankAxis >= 0.22) {
    p.animClip = 'bank_right';
  } else if (p.thrustAxis >= 0.25) {
    p.animClip = 'thrust_up';
  } else {
    p.animClip = 'idle';
  }

  // Smooth bank frame index (0..3) maps directly to 4-frame PixelLab bank strips
  p.bankFrame = Math.min(3, Math.round(Math.abs(p.bankAxis) * 3));
}

/**
 * Spawns a one-shot animated PixelLab VFX clip (e.g. FX_EXP_SMALL / MED / LARGE)
 * if installed. Safe no-op when clip PNG is not installed yet.
 */
export function spawnSpriteEffect(game, entityId, x, y, opts = {}) {
  const clip = spriteLoader.getClip(entityId, 'play');
  if (!clip) return false;
  if (!game.spriteEffects) game.spriteEffects = [];
  game.spriteEffects.push({
    entityId,
    clip,
    x,
    y,
    age: 0,
    fps: opts.fps || clip.fps || 16,
    scale: opts.scale || 1,
    angle: opts.angle || 0,
    alpha: opts.alpha !== undefined ? opts.alpha : 1
  });
  return true;
}

export function updateSpriteEffects(game, dt) {
  if (!game.spriteEffects || game.spriteEffects.length === 0) return;
  if (game.sandboxMode && game.sandboxPauseAnim) return;

  for (let i = game.spriteEffects.length - 1; i >= 0; i--) {
    const fx = game.spriteEffects[i];
    fx.age += dt;
    const frameIdx = Math.floor(fx.age * fx.fps);
    if (frameIdx >= fx.clip.frames) {
      game.spriteEffects.splice(i, 1);
    }
  }
}

export function renderSpriteEffects(ctx, game) {
  if (!game.spriteEffects || game.spriteEffects.length === 0) return;
  for (const fx of game.spriteEffects) {
    const frameIdx = Math.floor(fx.age * fx.fps);
    spriteLoader.drawFrame(ctx, fx.clip, frameIdx, fx.x, fx.y, {
      scale: fx.scale,
      angle: fx.angle,
      alpha: fx.alpha
    });
  }
}
