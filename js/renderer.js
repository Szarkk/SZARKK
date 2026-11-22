/* =========================================================================
   MAIN RENDERING PIPELINE
   ========================================================================= */

import { COLORS, LOGICAL_H, LOGICAL_W } from './config.js';
import { clamp } from './utils.js';
import {
  drawBackground,
  drawEnemySprite,
  drawLightwingSprite,
  drawPixelCapsule,
  drawPlayerFighter,
  drawTractorBeam
} from './sprites.js';

export function renderFrame(game) {
  const ctx = game.ctx;
  ctx.save();

  if (game.shake > 0) {
    const mag = game.shake * 14;
    ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
  }

  drawBackground(ctx, game.stars, game.gridOffset);

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
      }, game.clock);
    }
    drawPlayerFighter(
      ctx,
      LOGICAL_W * 0.5 + Math.sin(game.clock * 1.25) * 82,
      LOGICAL_H - 64,
      false,
      false,
      false,
      game.clock
    );
    ctx.restore();
    return;
  }

  // 1) Light Ribbon Trails + Ares shield durability pips
  for (const trail of game.ribbonTrails) {
    const isAres = trail.variant === 'ARES';
    for (const seg of trail.segments) {
      const alpha = clamp(seg.life / 0.55, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      const col = trail.flashTimer > 0 ? '#ffffff' : (isAres ? COLORS.aresRed : COLORS.cyan);
      ctx.strokeStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = 10;
      ctx.lineWidth = isAres ? 4.6 : 3.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x2, seg.y2);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x2, seg.y2);
      ctx.stroke();
      ctx.restore();
    }

    if (isAres && trail.hitsRemaining < trail.maxHits && trail.segments.length > 0) {
      const midSeg = trail.segments[Math.floor(trail.segments.length / 2)];
      const mx = (midSeg.x1 + midSeg.x2) * 0.5;
      const my = (midSeg.y1 + midSeg.y2) * 0.5 - 12;
      ctx.save();
      for (let p = 0; p < trail.maxHits; p++) {
        ctx.fillStyle = p < trail.hitsRemaining ? COLORS.aresRed : 'rgba(255, 255, 255, 0.16)';
        ctx.fillRect(mx - 10 + p * 8, my, 5, 3);
      }
      ctx.restore();
    }
  }

  // 2) Square Pixelated Power-Up Capsules (floating in mid-arena; shoot to break & activate)
  for (const cap of game.capsules) {
    const timeLeft = cap.maxLife - cap.age;
    const blinkHide = timeLeft < 3.0 && Math.floor(game.clock * 14) % 2 === 0;
    if (blinkHide) continue;

    drawPixelCapsule(ctx, cap.x, cap.y, cap.type, game.clock, 1.08);

    // Corner targeting reticle showing capsule is shootable
    const col = cap.type === 'CYAN' ? COLORS.cyan : (cap.type === 'PURPLE' ? COLORS.purpleBright : COLORS.aresRed);
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

  // 3) Tractor Beam cone visual (Classic MCP Recognizer)
  for (const e of game.enemies) {
    if (e.state === 'BEAMING') {
      drawTractorBeam(ctx, e, game.clock, game.player.capturedById === e.id);
    }
  }

  // 4) Captured Fighter (spins while being tractor-lifted)
  if (game.capturedFighter) {
    ctx.save();
    ctx.translate(game.capturedFighter.x, game.capturedFighter.y);
    if (game.capturedFighter.spin) ctx.rotate(game.capturedFighter.spin);
    drawPlayerFighter(ctx, 0, 0, false, false, true, game.clock);
    ctx.restore();
  }

  // 5) Enemies + Tractor Capacitor Shield ring during BEAM_APPROACH
  for (const e of game.enemies) {
    drawEnemySprite(ctx, e, game.clock);
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

  // 6) Lightwings
  for (const lw of game.lightwings) {
    drawLightwingSprite(ctx, lw);
  }

  // 7) True Continuous Red Laser Beams (locked straight onto fighter nose every frame)
  if (game.redLaserActive && game.activeLaserBeams.length > 0 && game.player.alive && !game.player.capturedById) {
    for (const beam of game.activeLaserBeams) {
      const bx = game.player.x + beam.offsetX;
      const by1 = game.player.y - 16;
      const by2 = beam.y2;

      ctx.save();
      const pulseW = 10 + Math.sin(game.clock * 52) * 2.2;
      // Outer crimson bloom
      ctx.strokeStyle = 'rgba(255, 30, 66, 0.45)';
      ctx.shadowColor = COLORS.aresRed;
      ctx.shadowBlur = 22;
      ctx.lineWidth = pulseW;
      ctx.lineCap = 'butt';
      ctx.beginPath();
      ctx.moveTo(bx, by1);
      ctx.lineTo(bx, by2);
      ctx.stroke();

      // Solid neon laser body
      ctx.strokeStyle = '#ff4b6b';
      ctx.lineWidth = 4.6;
      ctx.beginPath();
      ctx.moveTo(bx, by1);
      ctx.lineTo(bx, by2);
      ctx.stroke();

      // Razor-sharp white plasma core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.9;
      ctx.beginPath();
      ctx.moveTo(bx, by1);
      ctx.lineTo(bx, by2);
      ctx.stroke();

      // Animated energy chevrons racing up the beam
      const len = Math.max(0, by1 - by2);
      ctx.strokeStyle = 'rgba(255, 220, 228, 0.85)';
      ctx.lineWidth = 1.4;
      const spacing = 54;
      const travel = (game.clock * 540) % spacing;
      for (let d = travel; d < len - 10; d += spacing) {
        const ry = by1 - d;
        ctx.beginPath();
        ctx.moveTo(bx - 5, ry + 3);
        ctx.lineTo(bx, ry - 3);
        ctx.lineTo(bx + 5, ry + 3);
        ctx.stroke();
      }

      // Muzzle flare glued to fighter nose
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bx, by1, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // Impact flare where beam strikes an obstacle or enemy
      if (beam.hit) {
        ctx.fillStyle = COLORS.aresRed;
        ctx.beginPath();
        ctx.arc(bx, by2, 9 + Math.sin(game.clock * 60) * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bx, by2, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // 8) Drag Guide Rail beneath Player while Dragging
  if (game.controlMode === 'DRAG' && game.dragActive && game.player.alive && !game.player.capturedById) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 246, 255, 0.34)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(16, game.player.y + 22);
    ctx.lineTo(LOGICAL_W - 16, game.player.y + 22);
    ctx.stroke();
    ctx.fillStyle = COLORS.cyan;
    ctx.beginPath();
    ctx.moveTo(game.player.x, game.player.y + 17);
    ctx.lineTo(game.player.x - 6, game.player.y + 25);
    ctx.lineTo(game.player.x + 6, game.player.y + 25);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 9) Player Ship
  if (game.player.alive && !game.player.capturedById) {
    const hasPurpleAura = game.arcWaveState.phase === 'CANNON_AURA' || game.arcWaveState.auraFade > 0;
    drawPlayerFighter(
      ctx,
      game.player.x,
      game.player.y,
      game.player.dual,
      game.player.invulnTimer > 0,
      game.player.slowTimer > 0,
      game.clock,
      game.powerup.type,
      hasPurpleAura
    );
  }

  // 10) Purple Arc Waves
  for (const w of game.arcWaves) {
    ctx.save();
    ctx.strokeStyle = COLORS.purple;
    ctx.shadowColor = COLORS.purple;
    ctx.shadowBlur = 16;
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(w.x, w.y + w.radius * 0.55, w.radius, Math.PI * 1.18, Math.PI * 1.82);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(w.x, w.y + w.radius * 0.55, w.radius - 2, Math.PI * 1.22, Math.PI * 1.78);
    ctx.stroke();
    ctx.restore();
  }

  // Purple Cannon Shots
  for (const c of game.cannonShots) {
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

  // Large Purple AOE Explosion Shockwaves
  for (const bl of game.aoeBlasts) {
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

  // 11) Regular & Temporary Purple Player Bullets
  for (const b of game.playerBullets) {
    ctx.save();
    const col = b.purple
      ? (b.weakened ? '#d96bff' : COLORS.purpleBright)
      : (b.weakened ? '#ff5c74' : (b.slowedByLegacy ? '#8cfcff' : COLORS.cyan));
    ctx.strokeStyle = col;
    ctx.shadowColor = b.purple ? COLORS.purple : col;
    ctx.shadowBlur = b.purple ? 13 : 10;
    ctx.lineWidth = b.purple ? 3.4 : (b.weakened ? 2.2 : 3);
    ctx.beginPath();
    ctx.moveTo(b.x, b.y - (b.purple ? 9 : 7));
    ctx.lineTo(b.x, b.y + (b.purple ? 9 : 7));
    ctx.stroke();
    if (b.slowedByLegacy) {
      ctx.strokeStyle = 'rgba(0, 246, 255, 0.78)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Cyan Homing Missiles & Plasma Trails
  for (const m of game.homingMissiles) {
    ctx.save();
    if (m.trail.length > 1) {
      ctx.strokeStyle = 'rgba(0, 246, 255, 0.58)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(m.trail[0].x, m.trail[0].y);
      for (let k = 1; k < m.trail.length; k++) ctx.lineTo(m.trail[k].x, m.trail[k].y);
      ctx.stroke();
    }
    ctx.translate(m.x, m.y);
    ctx.rotate(m.angle + Math.PI / 2);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = COLORS.cyan;
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(4.5, 5);
    ctx.lineTo(0, 2.5);
    ctx.lineTo(-4.5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Enemy Bullets
  for (const eb of game.enemyBullets) {
    ctx.save();
    ctx.fillStyle = eb.color;
    ctx.shadowColor = eb.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(eb.x, eb.y, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 12) Derez Particles
  for (const pt of game.particles) {
    ctx.save();
    ctx.globalAlpha = clamp(pt.life / pt.maxLife, 0, 1);
    ctx.translate(pt.x, pt.y);
    ctx.rotate(pt.rot);
    ctx.strokeStyle = pt.color;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(-pt.size * 0.5, -pt.size * 0.5, pt.size, pt.size);
    ctx.restore();
  }

  // Floating Score & Combat Popups
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '700 11px ui-monospace, Consolas, monospace';
  for (const pop of game.popups) {
    ctx.globalAlpha = clamp(pop.life / pop.maxLife, 0, 1);
    ctx.fillStyle = pop.color;
    ctx.shadowColor = pop.color;
    ctx.shadowBlur = 8;
    ctx.fillText(pop.text, pop.x, pop.y);
  }
  ctx.restore();

  // Sector / Challenge Banner
  if (game.sectorPhase === 'BANNER' || game.sectorPhase === 'CLEARED') {
    ctx.save();
    ctx.fillStyle = 'rgba(2, 10, 24, 0.82)';
    ctx.fillRect(0, LOGICAL_H * 0.41, LOGICAL_W, 66);
    ctx.strokeStyle = game.bannerColor;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, LOGICAL_H * 0.41);
    ctx.lineTo(LOGICAL_W, LOGICAL_H * 0.41);
    ctx.moveTo(0, LOGICAL_H * 0.41 + 66);
    ctx.lineTo(LOGICAL_W, LOGICAL_H * 0.41 + 66);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = '900 19px ui-monospace, Consolas, monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = game.bannerColor;
    ctx.shadowBlur = 12;
    ctx.fillText(game.bannerTitle, LOGICAL_W * 0.5, LOGICAL_H * 0.41 + 29);

    if (game.bannerSub) {
      ctx.font = '700 11px ui-monospace, Consolas, monospace';
      ctx.fillStyle = game.bannerColor;
      ctx.shadowBlur = 6;
      ctx.fillText(game.bannerSub, LOGICAL_W * 0.5, LOGICAL_H * 0.41 + 51);
    }
    ctx.restore();
  }

  ctx.restore();
}
