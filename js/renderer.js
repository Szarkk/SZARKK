/* =========================================================================
   MAIN RENDERING PIPELINE
   ========================================================================= */

import {
  CANNON_AUTO_FIRE_DELAY,
  COLORS,
  LOGICAL_H,
  LOGICAL_W,
  PLAYER_MIN_Y,
  TOUCH_HINT_DURATION,
  TRACTOR_BEAM_Y
} from './config.js';
import { clamp } from './utils.js';
import { getActivePowerups } from './powerups.js';
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

  // 0) Subtle horizontal Touhou Dodge Zone ceiling line (bottom 2/5ths of arena)
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 246, 255, 0.2)';
  ctx.setLineDash([6, 8]);
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(10, PLAYER_MIN_Y);
  ctx.lineTo(LOGICAL_W - 10, PLAYER_MIN_Y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(0, 246, 255, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(6, PLAYER_MIN_Y - 5); ctx.lineTo(6, PLAYER_MIN_Y + 5);
  ctx.moveTo(LOGICAL_W - 6, PLAYER_MIN_Y - 5); ctx.lineTo(LOGICAL_W - 6, PLAYER_MIN_Y + 5);
  ctx.stroke();
  ctx.restore();

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
      const pipW = 4;
      const pipGap = 2;
      const totalW = trail.maxHits * pipW + (trail.maxHits - 1) * pipGap;
      const startX = mx - totalW * 0.5;
      ctx.save();
      for (let p = 0; p < trail.maxHits; p++) {
        ctx.fillStyle = p < trail.hitsRemaining ? COLORS.aresRed : 'rgba(255, 255, 255, 0.18)';
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

  // 5) Enemies + Tractor Capacitor Shield ring & fixed drop-lane telegraph during BEAM_APPROACH
  for (const e of game.enemies) {
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

  // 7) Piercing Continuous Red Laser Beams (slices through enemies; blocked/refracted by ribbons)
  const vibAmp = game.player.vibrateAmp || 0;
  const vibX = vibAmp > 0 ? (Math.random() - 0.5) * 2 * vibAmp : 0;
  const vibY = vibAmp > 0 ? (Math.random() - 0.5) * 2 * vibAmp : 0;

  if (game.redLaserActive && game.activeLaserBeams.length > 0 && game.player.alive && !game.player.capturedById) {
    for (const beam of game.activeLaserBeams) {
      const bx = game.player.x + beam.offsetX;
      const by1 = game.player.y - 16;
      const by2 = beam.y2;

      ctx.save();
      const pulseW = 10 + Math.sin(game.clock * 48) * 1.8;
      // Outer crimson neon bloom
      ctx.strokeStyle = 'rgba(255, 30, 66, 0.42)';
      ctx.shadowColor = COLORS.aresRed;
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

      // Ribbon stop / refraction flare (crimson on Red ribbon, cyan on Cyan ribbon)
      if (beam.hit) {
        ctx.fillStyle = beam.hitColor || COLORS.aresRed;
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

  // 8) Subtle one-time touch-ready glow ONLY when user willingly toggles Touch UI
  //    (Never shown on mobile; starts 1.5s fade immediately upon first touch)
  if (
    !game.desktopMode &&
    (game.touchHintState === 'GLOWING' || game.touchHintState === 'FADING') &&
    game.player.alive &&
    !game.player.capturedById
  ) {
    const px = game.player.x;
    const py = game.player.y;
    const glowY = Math.min(LOGICAL_H - 18, py + 34);
    const fade = game.touchHintState === 'FADING' ? clamp(game.touchHintTimer / TOUCH_HINT_DURATION, 0, 1) : 1;
    const pulse = 0.72 + Math.sin(game.clock * 6.5) * 0.28;
    const r = (game.player.dual ? 44 : 36) * (0.94 + pulse * 0.1);
    ctx.save();
    ctx.globalAlpha = fade * (game.dragActive ? 0.85 : 0.72 * pulse);
    const grad = ctx.createRadialGradient(px, glowY, 4, px, glowY, r);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.34)');
    grad.addColorStop(0.52, 'rgba(0, 246, 255, 0.24)');
    grad.addColorStop(1, 'rgba(0, 246, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, glowY, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 9) Player Ship (White default; power-up color when 1 active; moving RGB wave when 2+ stacked; vibration + cannon overcharge!)
  if (game.player.alive && !game.player.capturedById) {
    const aw = game.arcWaveState;
    const isCannonCharging = aw.phase === 'CANNON_CHARGING';
    const hasPurpleAura = isCannonCharging || aw.phase === 'CANNON_READY' || aw.auraFade > 0;
    const activePowerups = getActivePowerups(game);
    drawPlayerFighter(
      ctx,
      game.player.x + vibX,
      game.player.y + vibY,
      game.player.dual,
      game.player.invulnTimer > 0,
      game.player.slowTimer > 0,
      game.clock,
      activePowerups,
      hasPurpleAura,
      isCannonCharging
    );

    // Small compact on-field Cannon Shot auto-fire timer indicator during CANNON_CHARGING (or ready prompt)
    if (isCannonCharging) {
      const ratio = clamp(aw.cannonTimer / CANNON_AUTO_FIRE_DELAY, 0, 1);
      const ix = game.player.x;
      const iy = Math.min(LOGICAL_H - 12, game.player.y + 24);
      const bw = 46;
      ctx.save();
      ctx.fillStyle = 'rgba(18, 4, 34, 0.88)';
      ctx.fillRect(ix - bw * 0.5 - 1, iy - 1, bw + 2, 6);
      ctx.fillStyle = '#f2ccff';
      ctx.shadowColor = COLORS.purple;
      ctx.shadowBlur = 10;
      ctx.fillRect(ix - bw * 0.5, iy, bw * ratio, 4);

      ctx.textAlign = 'center';
      ctx.font = '800 9px ui-monospace, Consolas, monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`TAP // ${aw.cannonTimer.toFixed(1)}s`, ix, iy + 15);
      ctx.restore();
    } else if (aw.phase === 'CANNON_READY') {
      const ix = game.player.x;
      const iy = Math.min(LOGICAL_H - 8, game.player.y + 28);
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '800 8.5px ui-monospace, Consolas, monospace';
      ctx.fillStyle = COLORS.purpleBright;
      ctx.shadowColor = COLORS.purple;
      ctx.shadowBlur = 8;
      ctx.globalAlpha = 0.72 + Math.sin(game.clock * 10) * 0.28;
      ctx.fillText('2x TAP CANNON', ix, iy);
      ctx.restore();
    }
  }

  // 10) Wider Purple Arc Waves
  for (const w of game.arcWaves) {
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

  // 11) Regular White, Refracted Red Laser Bolts & Purple Player Bullets (fade as they dissolve!)
  for (const b of game.playerBullets) {
    ctx.save();
    if (b.slowedByLegacy && b.dissolveMax > 0) {
      ctx.globalAlpha = clamp(b.dissolveTimer / 0.65, 0.18, 1);
    }
    const isRedBolt = !!b.redLaserBullet;
    const col = isRedBolt
      ? (b.weakened ? '#ff7c92' : COLORS.aresRed)
      : (b.purple
        ? (b.weakened ? '#d96bff' : COLORS.purpleBright)
        : (b.weakened ? '#ff8ea0' : '#ffffff'));
    ctx.strokeStyle = col;
    ctx.shadowColor = isRedBolt ? COLORS.aresRed : (b.purple ? COLORS.purple : (b.weakened ? COLORS.aresRed : '#ffffff'));
    ctx.shadowBlur = isRedBolt ? 14 : (b.purple ? 13 : 10);
    ctx.lineWidth = isRedBolt ? 4.0 : (b.purple ? 3.4 : (b.weakened ? 2.4 : 3));
    ctx.beginPath();
    ctx.moveTo(b.x, b.y - (isRedBolt ? 10 : (b.purple ? 9 : 7)));
    ctx.lineTo(b.x, b.y + (isRedBolt ? 10 : (b.purple ? 9 : 7)));
    ctx.stroke();

    if (isRedBolt) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y - 8);
      ctx.lineTo(b.x, b.y + 8);
      ctx.stroke();
    }

    if (b.slowedByLegacy) {
      const lifeRatio = b.dissolveMax > 0 ? clamp(b.dissolveTimer / b.dissolveMax, 0.25, 1) : 1;
      ctx.strokeStyle = 'rgba(0, 246, 255, 0.85)';
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4 + lifeRatio * 3.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Cyan Homing Missiles — Sleek Neon Micro-Rockets with Tapered Plasma Exhaust Trails
  for (const m of game.homingMissiles) {
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

  // Sector / Challenge / Extra Round Banner
  if (game.sectorPhase === 'BANNER' || game.sectorPhase === 'CHALLENGE_BANNER' || game.sectorPhase === 'CLEARED') {
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
