/* =========================================================================
   SHARED NEON WIREFRAME, BACKGROUND & PIXEL CAPSULE DRAWING PRIMITIVES
   ========================================================================= */

import { COLORS, LOGICAL_W, LOGICAL_H } from './config.js';
import { clamp } from './utils.js';

export function drawBackground(ctx, stars, gridOffset) {
  const horizon = LOGICAL_H * 0.24;
  const bg = ctx.createLinearGradient(0, 0, 0, LOGICAL_H);
  bg.addColorStop(0, '#01030b');
  bg.addColorStop(0.24, '#03132b');
  bg.addColorStop(0.32, '#020919');
  bg.addColorStop(1, '#01040c');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

  // Vector stars
  for (const s of stars) {
    ctx.fillStyle = s.cyan ? 'rgba(0, 246, 255, 0.56)' : 'rgba(255, 255, 255, 0.44)';
    ctx.fillRect(s.x, s.y, s.size, s.size);
  }

  // Outlands wireframe silhouette
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 246, 255, 0.26)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, horizon);
  const xs = [0, 58, 120, 184, 240, 304, 368, 424, LOGICAL_W];
  const ys = [0, -28, -12, -40, -18, -34, -14, -26, 0];
  for (let i = 0; i < xs.length; i++) ctx.lineTo(xs[i], horizon + ys[i]);
  ctx.stroke();

  // Horizon bloom
  const glow = ctx.createLinearGradient(0, horizon - 18, 0, horizon + 26);
  glow.addColorStop(0, 'rgba(0, 246, 255, 0)');
  glow.addColorStop(0.5, 'rgba(0, 246, 255, 0.28)');
  glow.addColorStop(1, 'rgba(0, 246, 255, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, horizon - 18, LOGICAL_W, 44);

  // Perspective grid lines
  ctx.strokeStyle = 'rgba(0, 246, 255, 0.16)';
  ctx.lineWidth = 1;
  const vx = LOGICAL_W * 0.5;
  for (let i = -8; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(vx + i * 24, horizon);
    ctx.lineTo(vx + i * 122, LOGICAL_H);
    ctx.stroke();
  }

  for (let i = 0; i < 12; i++) {
    const f = (i + gridOffset) / 12;
    const y = horizon + Math.pow(f, 2.2) * (LOGICAL_H - horizon);
    ctx.strokeStyle = `rgba(0, 246, 255, ${0.06 + f * 0.22})`;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(LOGICAL_W, y);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawPlayerFighter(
  ctx,
  x,
  y,
  dual = false,
  invuln = false,
  slow = false,
  time = 0,
  powerupType = null,
  purpleAura = false
) {
  if (invuln && Math.floor(time * 16) % 2 === 0) return;
  const offsets = dual ? [-14, 14] : [0];
  const accent = powerupType === 'RED'
    ? COLORS.aresRed
    : (powerupType === 'PURPLE' ? COLORS.purple : COLORS.cyan);

  // Pulsing Purple Aura around the ship when 3 waves complete without shooting
  if (purpleAura) {
    ctx.save();
    const pulse = 0.85 + Math.sin(time * 24) * 0.15;
    const auraR = (dual ? 36 : 26) * pulse;
    const grad = ctx.createRadialGradient(x, y, 4, x, y, auraR + 10);
    grad.addColorStop(0, 'rgba(235, 189, 255, 0.62)');
    grad.addColorStop(0.55, 'rgba(196, 77, 255, 0.34)');
    grad.addColorStop(1, 'rgba(196, 77, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, auraR + 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = COLORS.purpleBright;
    ctx.shadowColor = COLORS.purple;
    ctx.shadowBlur = 18;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(x, y, auraR, time * 5, time * 5 + Math.PI * 1.45);
    ctx.stroke();

    ctx.strokeStyle = COLORS.purple;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(x, y, auraR * 0.76, -time * 6, -time * 6 + Math.PI * 1.3);
    ctx.stroke();
    ctx.restore();
  }

  for (const ox of offsets) {
    ctx.save();
    ctx.translate(x + ox, y);
    ctx.strokeStyle = purpleAura ? COLORS.purpleBright : COLORS.cyan;
    ctx.fillStyle = purpleAura ? 'rgba(38, 8, 62, 0.94)' : 'rgba(2, 26, 46, 0.92)';
    ctx.shadowColor = accent;
    ctx.shadowBlur = (powerupType || purpleAura) ? 16 : 11;
    ctx.lineWidth = 1.9;

    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(13, 11);
    ctx.lineTo(5, 7);
    ctx.lineTo(0, 13);
    ctx.lineTo(-5, 7);
    ctx.lineTo(-13, 11);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cockpit / energy core highlight
    ctx.strokeStyle = powerupType === 'RED'
      ? '#ff6a82'
      : ((powerupType === 'PURPLE' || purpleAura) ? COLORS.purpleBright : '#ffffff');
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(0, 7);
    ctx.stroke();

    // Active power-up wingtip nodes
    if (powerupType || purpleAura) {
      ctx.fillStyle = purpleAura ? COLORS.purple : accent;
      ctx.fillRect(-12, 6, 3, 4);
      ctx.fillRect(9, 6, 3, 4);
    }
    ctx.restore();
  }

  if (slow) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 246, 255, 0.78)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, dual ? 30 : 21, time * 3.2, time * 3.2 + Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

export function drawEnemySprite(ctx, e, time = 0, overrideScale = null) {
  const isElite = e.type === 'LEGACY_REC' || e.type === 'ARES_REC';
  const scale = overrideScale !== null ? overrideScale : (isElite ? 1.3 : 1.0);
  const flash = (e.hitFlash || 0) > 0;
  const damaged = e.hp < e.maxHp;

  ctx.save();
  ctx.translate(e.x, e.y);
  if (e.angle) ctx.rotate(e.angle);
  ctx.scale(scale, scale);

  if (e.type === 'DRONE') {
    const col = flash ? '#ffffff' : COLORS.cyan;
    ctx.strokeStyle = col;
    ctx.fillStyle = 'rgba(0, 24, 44, 0.9)';
    ctx.shadowColor = col;
    ctx.shadowBlur = 9;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(12, 0);
    ctx.lineTo(0, 11);
    ctx.lineTo(-12, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.stroke();
  } else if (e.type === 'INTERCEPTOR') {
    const col = flash ? '#ffffff' : COLORS.gold;
    ctx.strokeStyle = col;
    ctx.fillStyle = 'rgba(38, 22, 4, 0.9)';
    ctx.shadowColor = col;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(0, 13);
    ctx.lineTo(15, -6);
    ctx.lineTo(7, -11);
    ctx.lineTo(0, -3);
    ctx.lineTo(-7, -11);
    ctx.lineTo(-15, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (e.type === 'CLASSIC_REC') {
    const isDamagedClassic = e.hp <= 1 && e.maxHp > 1;
    const col = flash ? '#ffffff' : (isDamagedClassic ? COLORS.cyan : COLORS.mcpOrange);
    ctx.strokeStyle = col;
    ctx.fillStyle = isDamagedClassic ? 'rgba(0, 28, 48, 0.94)' : 'rgba(42, 10, 4, 0.94)';
    ctx.shadowColor = col;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 1.9;
    ctx.beginPath();
    ctx.moveTo(-17, -13);
    ctx.lineTo(17, -13);
    ctx.lineTo(17, 14);
    ctx.lineTo(8, 14);
    ctx.lineTo(8, -2);
    ctx.lineTo(-8, -2);
    ctx.lineTo(-8, 14);
    ctx.lineTo(-17, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = col;
    ctx.fillRect(-7, -9, 14, 3);
  } else if (e.type === 'LEGACY_REC') {
    const col = flash ? '#ffffff' : COLORS.cyan;
    ctx.strokeStyle = col;
    ctx.fillStyle = '#040b16';
    ctx.shadowColor = col;
    ctx.shadowBlur = (e.surgePulse || 0) > 0 ? 22 : 14;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-20, -12);
    ctx.lineTo(-10, -17);
    ctx.lineTo(10, -17);
    ctx.lineTo(20, -12);
    ctx.lineTo(18, 16);
    ctx.lineTo(9, 16);
    ctx.lineTo(7, -3);
    ctx.lineTo(-7, -3);
    ctx.lineTo(-9, 16);
    ctx.lineTo(-18, 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#a8fcff';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-13, -9);
    ctx.lineTo(13, -9);
    ctx.stroke();
  } else if (e.type === 'ARES_REC') {
    const col = flash ? '#ffffff' : COLORS.aresRed;
    ctx.strokeStyle = col;
    ctx.fillStyle = '#140308';
    ctx.shadowColor = col;
    ctx.shadowBlur = (e.surgePulse || 0) > 0 ? 22 : 15;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-22, -8);
    ctx.lineTo(-12, -17);
    ctx.lineTo(0, -11);
    ctx.lineTo(12, -17);
    ctx.lineTo(22, -8);
    ctx.lineTo(17, 17);
    ctx.lineTo(8, 13);
    ctx.lineTo(6, -2);
    ctx.lineTo(-6, -2);
    ctx.lineTo(-8, 13);
    ctx.lineTo(-17, 17);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = `rgba(255, 30, 66, ${0.55 + Math.sin(time * 8) * 0.35})`;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(6, -5);
    ctx.lineTo(0, -1);
    ctx.lineTo(-6, -5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Upright Mini HP Bar above damaged enemies (or always visible on 2x HP Challenge Elites)
  if (overrideScale === null && (damaged || e.isChallengeElite) && e.hp > 0) {
    const bw = e.isChallengeElite ? 44 : (isElite ? 38 : (e.maxHp >= 2 ? 26 : 18));
    const bx = e.x - bw / 2;
    const by = e.y - (isElite ? 30 : (e.maxHp >= 2 ? 23 : 18));
    const ratio = clamp(e.hp / e.maxHp, 0, 1);
    ctx.save();
    ctx.fillStyle = 'rgba(2, 8, 18, 0.88)';
    ctx.fillRect(bx - 1, by - 1, bw + 2, 5);
    ctx.fillStyle = e.type === 'ARES_REC' ? COLORS.aresRed : (e.type === 'LEGACY_REC' ? COLORS.cyan : COLORS.gold);
    ctx.fillRect(bx, by, bw * ratio, 3);
    ctx.restore();
  }
}

export function drawLightwingSprite(ctx, lw) {
  ctx.save();
  ctx.translate(lw.x, lw.y);
  ctx.rotate(lw.angle + Math.PI / 2);
  const isAres = lw.variant === 'ARES';
  const col = isAres ? COLORS.aresRed : COLORS.cyan;
  ctx.strokeStyle = col;
  ctx.fillStyle = isAres ? '#1b0309' : '#021726';
  ctx.shadowColor = col;
  ctx.shadowBlur = 10;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  if (isAres) {
    ctx.moveTo(0, -11);
    ctx.lineTo(9, 2);
    ctx.lineTo(5, 9);
    ctx.lineTo(0, 5);
    ctx.lineTo(-5, 9);
    ctx.lineTo(-9, 2);
  } else {
    ctx.moveTo(0, -11);
    ctx.lineTo(8, 9);
    ctx.lineTo(0, 4);
    ctx.lineTo(-8, 9);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/**
 * Renders a retro Square Pixelated Power-Up Capsule (Cyan = Homing, Red = Laser, Purple = Arc Wave)
 * Built on an explicit blocky 9x9 pixel grid for crisp pixelated TRON arcade appeal.
 */
export function drawPixelCapsule(ctx, x, y, type, time = 0, scale = 1.0) {
  const isCyan = type === 'CYAN';
  const isPurple = type === 'PURPLE';
  const mainCol = isCyan ? COLORS.cyan : (isPurple ? COLORS.purple : COLORS.aresRed);
  const glowCol = isCyan ? '#9efcff' : (isPurple ? COLORS.purpleBright : '#ff8ca0');
  const fillCol = isCyan ? '#041d2e' : (isPurple ? '#1e0532' : '#26040b');
  const px = 2.6 * scale;
  const half = 4.5 * px;
  const pulse = 0.8 + Math.sin(time * 7) * 0.2;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.shadowColor = mainCol;
  ctx.shadowBlur = 12 * pulse;

  // Inner dark square fill
  ctx.fillStyle = fillCol;
  ctx.fillRect(-half + px, -half + px, px * 7, px * 7);

  // Pixelated square outer frame (notched retro corners)
  ctx.fillStyle = mainCol;
  ctx.fillRect(-half + px, -half, px * 7, px);
  ctx.fillRect(-half + px, half - px, px * 7, px);
  ctx.fillRect(-half, -half + px, px, px * 7);
  ctx.fillRect(half - px, -half + px, px, px * 7);

  // Corner accent pixels
  ctx.fillStyle = glowCol;
  ctx.fillRect(-half + px, -half + px, px, px);
  ctx.fillRect(half - 2 * px, -half + px, px, px);
  ctx.fillRect(-half + px, half - 2 * px, px, px);
  ctx.fillRect(half - 2 * px, half - 2 * px, px, px);

  // Inner pixel icon
  ctx.fillStyle = '#ffffff';
  if (isCyan) {
    // Twin Homing Missile / Lock-On Pixel Icon
    ctx.fillRect(-px * 2.5, -px * 1.5, px, px * 3);
    ctx.fillRect(px * 1.5, -px * 1.5, px, px * 3);
    ctx.fillRect(-px * 1.5, -px * 2.5, px, px);
    ctx.fillRect(px * 0.5, -px * 2.5, px, px);
    ctx.fillStyle = mainCol;
    ctx.fillRect(-px * 0.5, -px * 0.5, px, px);
  } else if (isPurple) {
    // Stacked Pixel Arc Wave Icon
    ctx.fillRect(-px * 1.5, -px * 2.5, px * 3, px);
    ctx.fillRect(-px * 2.5, -px * 1.5, px, px);
    ctx.fillRect(px * 1.5, -px * 1.5, px, px);
    ctx.fillStyle = glowCol;
    ctx.fillRect(-px * 1.5, -px * 0.5, px * 3, px);
    ctx.fillRect(-px * 2.5, px * 0.5, px, px);
    ctx.fillRect(px * 1.5, px * 0.5, px, px);
    ctx.fillStyle = mainCol;
    ctx.fillRect(-px * 0.5, px * 1.5, px, px);
  } else {
    // Continuous Vertical Laser Beam Pixel Icon
    ctx.fillRect(-px * 0.5, -px * 3, px, px * 6);
    ctx.fillStyle = glowCol;
    ctx.fillRect(-px * 1.5, -px * 2, px, px * 4);
    ctx.fillRect(px * 0.5, -px * 2, px, px * 4);
  }
  ctx.restore();
}

/**
 * Renders the Classic MCP Recognizer's Galaga-style Tractor Beam cone with animated shimmer bands.
 */
export function drawTractorBeam(ctx, boss, time = 0, capturing = false) {
  const topY = boss.y + 12;
  const botY = LOGICAL_H - 22;
  const topHalfW = 13;
  const botHalfW = 54;
  const pulse = 0.78 + Math.sin(time * (capturing ? 18 : 10)) * 0.22;

  ctx.save();
  // Translucent cone body
  const coneGrad = ctx.createLinearGradient(0, topY, 0, botY);
  if (capturing) {
    coneGrad.addColorStop(0, `rgba(0, 255, 196, ${0.46 * pulse})`);
    coneGrad.addColorStop(0.55, `rgba(0, 246, 255, ${0.34 * pulse})`);
    coneGrad.addColorStop(1, `rgba(255, 70, 110, ${0.28 * pulse})`);
  } else {
    coneGrad.addColorStop(0, `rgba(0, 246, 255, ${0.4 * pulse})`);
    coneGrad.addColorStop(0.55, `rgba(0, 255, 170, ${0.26 * pulse})`);
    coneGrad.addColorStop(1, `rgba(0, 246, 255, ${0.14 * pulse})`);
  }

  ctx.fillStyle = coneGrad;
  ctx.beginPath();
  ctx.moveTo(boss.x - topHalfW, topY);
  ctx.lineTo(boss.x + topHalfW, topY);
  ctx.lineTo(boss.x + botHalfW, botY);
  ctx.lineTo(boss.x - botHalfW, botY);
  ctx.closePath();
  ctx.fill();

  // Glowing outer edge lines
  const edgeCol = capturing ? COLORS.emerald : COLORS.cyan;
  ctx.strokeStyle = edgeCol;
  ctx.shadowColor = edgeCol;
  ctx.shadowBlur = 14;
  ctx.lineWidth = 1.9;
  ctx.beginPath();
  ctx.moveTo(boss.x - topHalfW, topY);
  ctx.lineTo(boss.x - botHalfW, botY);
  ctx.moveTo(boss.x + topHalfW, topY);
  ctx.lineTo(boss.x + botHalfW, botY);
  ctx.stroke();

  // Animated descending/oscillating wave bands inside the cone
  const bandCount = 8;
  const spanY = botY - topY;
  for (let i = 0; i < bandCount; i++) {
    const phase = ((i / bandCount) + time * (capturing ? 0.95 : 0.65)) % 1;
    const bandY = topY + phase * spanY;
    const hw = topHalfW + (botHalfW - topHalfW) * phase;
    const alpha = Math.sin(phase * Math.PI) * 0.85;
    ctx.strokeStyle = i % 2 === 0
      ? `rgba(0, 255, 185, ${alpha})`
      : `rgba(0, 246, 255, ${alpha})`;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(boss.x - hw + 3, bandY);
    ctx.lineTo(boss.x + hw - 3, bandY);
    ctx.stroke();
  }

  // Bottom capture zone target ring at player altitude
  const ringY = LOGICAL_H - 54;
  const ringPhase = (ringY - topY) / spanY;
  const ringHalfW = topHalfW + (botHalfW - topHalfW) * ringPhase;
  ctx.strokeStyle = capturing ? 'rgba(255, 90, 120, 0.85)' : 'rgba(0, 255, 170, 0.72)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(boss.x, ringY, ringHalfW * 0.88, 7, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}
