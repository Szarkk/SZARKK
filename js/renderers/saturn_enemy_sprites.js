/* =========================================================================
   32-BIT PIXEL-ART ENEMY FLEET RENDERER (FULL NEXUS LINEUP)
   Hand-crafted 32-bit Sega Saturn pixel-art designs for every enemy & wing:
   - Drone, Interceptor, V1 Enforcer (+ Flux/Null synergy & cracked state)
   - Elite Enforcer [Flux], Elite Enforcer [Null]
   - Master Enforcer [Flux], Master Enforcer [Null]
   - Centoid (head & body), Alpha Centoid (head & body)
   - Pulsar (twin lightning rods + live pixel electric arc)
   - Enforcer Wings (Flux Cyan & Null Crimson)
   ========================================================================= */

import { COLORS, SATURN_PALETTE } from '../config.js';

// Neutral brushed steel / gunmetal mechanical trim ramp for 32-bit armor depth
const STEEL = ['#0B0E16', '#2B3242', '#5A657C', '#98A4BC', '#DDE5F2'];
// Deep indigo / violet / blazing pink ramp for Alpha Centoid
const ALPHA_RAMP = ['#0E0829', '#251766', '#4E30B8', '#8D5CFF', '#FF5AD4'];

const SCRATCH_SZ = 96;
const SCRATCH_HALF = 48;
let _enemyCanvas = null;
let _enemyCtx = null;

function ensureEnemyScratch() {
  if (_enemyCtx) return true;
  if (typeof document === 'undefined') return false;
  _enemyCanvas = document.createElement('canvas');
  _enemyCanvas.width = SCRATCH_SZ;
  _enemyCanvas.height = SCRATCH_SZ;
  _enemyCtx = _enemyCanvas.getContext('2d');
  _enemyCtx.imageSmoothingEnabled = false;
  return true;
}

function makePx(ctx, cx, cy) {
  const ox = Math.round(cx);
  const oy = Math.round(cy);
  return (rx, ry, w, h, col) => {
    ctx.fillStyle = col;
    ctx.fillRect(ox + rx, oy + ry, w, h);
  };
}

function drawPixelOrbitRing(ctx, cx, cy, radius, color, time, speed, dots) {
  ctx.fillStyle = color;
  const rx = Math.round(cx);
  const ry = Math.round(cy);
  for (let i = 0; i < dots; i++) {
    if (i % 2 === 1) continue;
    const a = time * speed + (i / dots) * Math.PI * 2;
    const dx = Math.round(rx + Math.cos(a) * radius);
    const dy = Math.round(ry + Math.sin(a) * radius);
    ctx.fillRect(dx - 1, dy - 1, 2, 2);
  }
}

/* -------------------------------------------------------------------------
   1. DRONE (Tier 1 Scout — Sculpted Cyan/Steel Diamond Reconnaissance Unit)
   ------------------------------------------------------------------------- */
function drawDrone32(ctx, cx, cy, e, time) {
  const px = makePx(ctx, cx, cy);
  const [f0, f1, f2, f3, f4] = SATURN_PALETTE.flux;
  const [g0, g1, g2, g3] = STEEL;
  const pulse = Math.floor(time * 8 + (e.animPhase || 0)) % 2 === 0;

  // Rear thruster micro-sparks
  const thr = Math.floor(time * 14 + (e.animPhase || 0)) % 2;
  px(-2, -13 - thr, 1, 2 + thr, f3);
  px(1, -13 - thr, 1, 2 + thr, f3);

  // 1px dark silhouette outline
  px(-2, -12, 4, 2, g0);
  px(-5, -10, 10, 3, g0);
  px(-9, -7, 18, 4, g0);
  px(-13, -3, 26, 6, g0);
  px(-9, 3, 18, 4, g0);
  px(-5, 7, 10, 3, g0);
  px(-2, 10, 4, 2, g0);

  // Outer swept dark-steel flank fins
  px(-12, -2, 4, 4, g2);
  px(-11, -1, 3, 2, g3);
  px(8, -2, 4, 4, g2);
  px(8, -1, 3, 2, g3);

  // Armored diamond hull (layered cyan metallic bevels)
  px(-8, -6, 16, 12, f1);
  px(-6, -8, 12, 16, f2);
  px(-4, -10, 8, 20, f2);
  px(-2, -11, 4, 22, f3);

  // Upper bright beveled shoulder plates
  px(-7, -5, 5, 4, f3);
  px(2, -5, 5, 4, f3);
  px(-4, -9, 8, 2, f3);
  px(-2, -10, 4, 2, f4);

  // Lower dark recessed armor facets
  px(-7, 2, 5, 3, f0);
  px(2, 2, 5, 3, f0);
  px(-3, 7, 6, 2, f1);

  // Central ocular core housing & pulsing eye
  px(-4, -4, 8, 8, g0);
  px(-3, -3, 6, 6, g1);
  px(-2, -2, 4, 4, pulse ? f4 : f3);
  px(-1, -1, 2, 2, '#ffffff');
}

/* -------------------------------------------------------------------------
   2. INTERCEPTOR (Tier 1 Striker — Forward-Swept Gold/Gunmetal Predator)
   ------------------------------------------------------------------------- */
function drawInterceptor32(ctx, cx, cy, e, time) {
  const px = makePx(ctx, cx, cy);
  const [p0, p1, p2, p3, p4] = SATURN_PALETTE.pulsar;
  const [g0, g1, g2, g3] = STEEL;
  const thr = Math.floor(time * 16 + (e.animPhase || 0)) % 3;

  // Twin dorsal exhaust flames (flying downward, jets point up)
  px(-7, -14 - thr, 2, 3 + thr, p3);
  px(-7, -13, 2, 1, '#ffffff');
  px(5, -14 - thr, 2, 3 + thr, p3);
  px(5, -13, 2, 1, '#ffffff');

  // Crisp outer dark outline
  px(-9, -12, 5, 4, g0);
  px(4, -12, 5, 4, g0);
  px(-15, -8, 30, 8, g0);
  px(-13, 0, 26, 5, g0);
  px(-7, 5, 14, 5, g0);
  px(-3, 10, 6, 4, g0);

  // Swept wing cannons & armored golden wings
  px(-14, -7, 6, 6, p2);
  px(-13, -7, 4, 3, p3);
  px(-14, -2, 4, 3, g2); // wingtip gun pod
  px(-13, 1, 2, 2, p4);  // muzzle glint

  px(8, -7, 6, 6, p2);
  px(9, -7, 4, 3, p3);
  px(10, -2, 4, 3, g2);
  px(11, 1, 2, 2, p4);

  // Shoulder thruster cowlings
  px(-8, -11, 3, 4, g2);
  px(-7, -11, 2, 2, g3);
  px(5, -11, 3, 4, g2);
  px(5, -11, 2, 2, g3);

  // Main arrow fuselage body (gold & burnished bronze bevels)
  px(-9, -5, 18, 9, p1);
  px(-7, -4, 14, 9, p2);
  px(-5, -2, 10, 9, p3);
  px(-2, 4, 4, 9, p3);
  px(-1, 7, 2, 6, p4);

  // Dark steel cockpit slit & spine detail
  px(-3, -4, 6, 2, g0);
  px(-2, -1, 4, 5, g0);
  px(-1, 0, 2, 3, '#ff4769'); // crimson predator optic
  px(-1, 0, 1, 1, '#ffffff');
}

/* -------------------------------------------------------------------------
   3. V1 ENFORCER (Tier 2 U-Claw Tractor Boss + Flux/Null Synergy & Cracks)
   ------------------------------------------------------------------------- */
function drawV1Enforcer32(ctx, cx, cy, e, time) {
  const px = makePx(ctx, cx, cy);
  const isFlux = e.v1Synergy === 'FLUX';
  const isNull = e.v1Synergy === 'NULL';
  const isCracked = !isFlux && !isNull && e.hp <= 1.001 && e.maxHp > 1;
  const ramp = isFlux
    ? SATURN_PALETTE.flux
    : (isNull ? SATURN_PALETTE.null : (isCracked ? SATURN_PALETTE.pulsar : SATURN_PALETTE.v1));
  const [r0, r1, r2, r3, r4] = ramp;
  const [g0, g1, g2, g3, g4] = STEEL;

  // Pulsing pixel synergy halo when linked to Flux or Null Elite/Master!
  if (isFlux || isNull) {
    drawPixelOrbitRing(ctx, cx, cy, 22, isFlux ? SATURN_PALETTE.flux[3] : SATURN_PALETTE.null[3], time, 5.5, 20);
  }

  // Outer silhouette outline (iconic heavy U-claw hull)
  px(-18, -14, 36, 13, g0);
  px(-18, -1, 11, 16, g0);
  px(7, -1, 11, 16, g0);

  // Upper armored bridge chassis
  px(-17, -13, 34, 11, r1);
  px(-15, -13, 30, 8, r2);
  px(-13, -12, 26, 5, r3);
  // Brushed steel shoulder corner plates
  px(-17, -13, 4, 6, g2);
  px(-16, -12, 2, 4, g3);
  px(13, -13, 4, 6, g2);
  px(14, -12, 2, 4, g3);

  // Twin forward armored U-Claw arms
  px(-17, -2, 9, 16, r1);
  px(-16, -2, 7, 14, r2);
  px(-15, 0, 4, 11, r3);
  px(-17, 11, 9, 3, g2); // steel clamp tip
  px(-15, 12, 5, 2, g4);

  px(8, -2, 9, 16, r1);
  px(9, -2, 7, 14, r2);
  px(11, 0, 4, 11, r3);
  px(8, 11, 9, 3, g2);
  px(10, 12, 5, 2, g4);

  // Inner tractor bay emitter rails (glowing inside the U-gap)
  const beamGlow = (Math.floor(time * 10) % 2 === 0) ? r4 : r3;
  px(-8, 1, 1, 10, beamGlow);
  px(7, 1, 1, 10, beamGlow);
  px(-7, -2, 14, 2, g2);
  px(-5, -1, 10, 1, beamGlow);

  // Glowing bridge command visor bar
  px(-9, -10, 18, 5, g0);
  px(-8, -9, 16, 3, r3);
  px(-6, -9, 12, 2, r4);
  px(-3, -9, 6, 1, '#ffffff');

  // Cracked battle damage pixels when isolated at 1 HP
  if (isCracked) {
    px(-11, -12, 2, 3, g0);
    px(-9, -9, 2, 3, g0);
    px(-10, -6, 2, 4, g0);
    px(9, -11, 2, 3, g0);
    px(7, -8, 2, 3, g0);
    px(10, -5, 2, 4, g0);
    if (Math.floor(time * 14) % 2 === 0) {
      px(-10, -8, 2, 2, '#ffffff');
      px(8, -7, 2, 2, '#ffe44d');
    }
  }
}

/* -------------------------------------------------------------------------
   4 & 5. ELITE & MASTER ENFORCER [FLUX] (Armored Cyan Cruisers / Dreadnought)
   ------------------------------------------------------------------------- */
function drawFluxEnforcer32(ctx, cx, cy, e, time, isMaster) {
  const px = makePx(ctx, cx, cy);
  const [f0, f1, f2, f3, f4] = SATURN_PALETTE.flux;
  const [g0, g1, g2, g3, g4] = STEEL;
  const surge = (e.surgePulse || 0) > 0;

  if (isMaster) {
    // Master radiant cyan aura + counter-rotating pixel rings
    const pulse = 0.90 + Math.sin(time * 7.5) * 0.10;
    const auraR = Math.round(33 * pulse);
    ctx.save();
    const grad = ctx.createRadialGradient(cx, cy, 6, cx, cy, auraR + 6);
    grad.addColorStop(0, 'rgba(130, 252, 255, 0.36)');
    grad.addColorStop(0.55, 'rgba(0, 246, 255, 0.16)');
    grad.addColorStop(1, 'rgba(0, 246, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, auraR + 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawPixelOrbitRing(ctx, cx, cy, auraR - 2, f3, time, 2.4, 24);
    drawPixelOrbitRing(ctx, cx, cy, auraR - 7, f4, time, -3.2, 18);
  }

  const w = isMaster ? 26 : 21;
  const armW = isMaster ? 10 : 8;
  const topY = isMaster ? -22 : -18;
  const botY = isMaster ? 21 : 17;

  // Crisp outer 1px dark silhouette
  px(-w + 8, topY, (w - 8) * 2, 5, g0);
  px(-w, topY + 4, w * 2, 14, g0);
  px(-w + 2, -4, armW + 2, botY + 5, g0);
  px(w - armW - 4, -4, armW + 2, botY + 5, g0);

  // Dark metallic cruiser chassis + beveled cyan shoulder armor
  px(-w + 1, topY + 5, w * 2 - 2, 12, g1);
  px(-w + 9, topY + 1, (w - 9) * 2, 6, f1);
  px(-w + 3, topY + 5, w * 2 - 6, 9, f1);
  px(-w + 5, topY + 3, w * 2 - 10, 7, f2);
  px(-w + 8, topY + 2, w * 2 - 16, 4, f3);

  // Titanium/silver heavy pauldron wing plates
  px(-w + 1, topY + 6, 5, 9, g2);
  px(-w + 2, topY + 7, 3, 7, isMaster ? g4 : g3);
  px(w - 6, topY + 6, 5, 9, g2);
  px(w - 5, topY + 7, 3, 7, isMaster ? g4 : g3);

  // Twin armored forward mandibles / thread launchers
  px(-w + 3, -3, armW, botY + 3, f1);
  px(-w + 4, -2, armW - 2, botY + 1, f2);
  px(-w + 5, 0, armW - 4, botY - 3, f3);
  px(-w + 3, botY - 4, armW, 3, g2);
  px(-w + 4, botY - 3, armW - 2, 2, f4);

  px(w - armW - 3, -3, armW, botY + 3, f1);
  px(w - armW - 2, -2, armW - 2, botY + 1, f2);
  px(w - armW - 1, 0, armW - 4, botY - 3, f3);
  px(w - armW - 3, botY - 4, armW, 3, g2);
  px(w - armW - 2, botY - 3, armW - 2, 2, f4);

  // Central bridge armor & glowing Flux plasma conduit strip
  const coreCol = (surge || Math.floor(time * 8) % 2 === 0) ? '#ffffff' : f4;
  px(-12, topY + 8, 24, 6, g0);
  px(-11, topY + 9, 22, 4, f2);
  px(-10, topY + 10, 20, 2, coreCol);
  // Secondary inner reactor core
  px(-4, -5, 8, 5, g0);
  px(-3, -4, 6, 3, f3);
  px(-2, -3, 4, 1, '#ffffff');

  // Master Sovereign Crown Crest (blazing diamond crest atop the dreadnought!)
  if (isMaster) {
    px(-2, topY - 7, 4, 2, g0);
    px(-5, topY - 5, 10, 3, g0);
    px(-7, topY - 2, 14, 4, g0);
    px(-6, topY - 2, 12, 3, f3);
    px(-4, topY - 4, 8, 4, f4);
    px(-2, topY - 6, 4, 5, '#ffffff');
    // Extra white-cyan dorsal trim fins
    px(-15, topY + 2, 4, 2, f4);
    px(11, topY + 2, 4, 2, f4);
  }
}

/* -------------------------------------------------------------------------
   6 & 7. ELITE & MASTER ENFORCER [NULL] (Horned Crimson Cruisers / Tyrant)
   ------------------------------------------------------------------------- */
function drawNullEnforcer32(ctx, cx, cy, e, time, isMaster) {
  const px = makePx(ctx, cx, cy);
  const [n0, n1, n2, n3, n4] = SATURN_PALETTE.null;
  const [g0, g1, g2, g3, g4] = STEEL;
  const corePulse = Math.floor(time * 9) % 2 === 0;

  if (isMaster) {
    const pulse = 0.90 + Math.sin(time * 7.5) * 0.10;
    const auraR = Math.round(34 * pulse);
    ctx.save();
    const grad = ctx.createRadialGradient(cx, cy, 6, cx, cy, auraR + 6);
    grad.addColorStop(0, 'rgba(255, 65, 100, 0.38)');
    grad.addColorStop(0.55, 'rgba(255, 30, 66, 0.16)');
    grad.addColorStop(1, 'rgba(255, 30, 66, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, auraR + 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawPixelOrbitRing(ctx, cx, cy, auraR - 2, n3, time, 2.5, 24);
    drawPixelOrbitRing(ctx, cx, cy, auraR - 7, n4, time, -3.3, 18);
  }

  const w = isMaster ? 27 : 22;
  const armW = isMaster ? 10 : 8;
  const topY = isMaster ? -20 : -16;
  const botY = isMaster ? 22 : 18;

  // Jagged horned outer silhouette
  px(-16, topY - 4, 8, 5, g0);
  px(8, topY - 4, 8, 5, g0);
  px(-w, topY + 2, w * 2, 13, g0);
  px(-w + 3, -3, armW + 2, botY + 4, g0);
  px(w - armW - 5, -3, armW + 2, botY + 4, g0);

  // Twin armored shoulder horns
  px(-15, topY - 3, 6, 5, n2);
  px(-14, topY - 3, 4, 3, n3);
  px(9, topY - 3, 6, 5, n2);
  px(10, topY - 3, 4, 3, n3);

  // Main obsidian-crimson jagged wing chassis
  px(-w + 1, topY + 3, w * 2 - 2, 11, n0);
  px(-w + 3, topY + 3, w * 2 - 6, 9, n1);
  px(-w + 5, topY + 4, w * 2 - 10, 6, n2);
  // Angular gunmetal wing blades
  px(-w + 1, topY + 5, 5, 7, g1);
  px(-w + 2, topY + 6, 3, 5, g3);
  px(w - 6, topY + 5, 5, 7, g1);
  px(w - 5, topY + 6, 3, 5, g3);

  // Twin jagged forward fangs
  px(-w + 4, -2, armW, botY + 2, n1);
  px(-w + 5, -1, armW - 2, botY - 1, n2);
  px(-w + 6, 2, armW - 4, botY - 6, n3);
  px(-w + 4, botY - 3, armW - 1, 3, g2);
  px(-w + 5, botY - 1, armW - 3, 2, n4);

  px(w - armW - 4, -2, armW, botY + 2, n1);
  px(w - armW - 3, -1, armW - 2, botY - 1, n2);
  px(w - armW - 2, 2, armW - 4, botY - 6, n3);
  px(w - armW - 3, botY - 3, armW - 1, 3, g2);
  px(w - armW - 2, botY - 1, armW - 3, 2, n4);

  // Pulsing crimson diamond core in chest
  px(-6, topY + 5, 12, 10, g0);
  px(-5, topY + 6, 10, 8, n1);
  px(-4, topY + 7, 8, 6, n3);
  px(-2, topY + 8, 4, 4, corePulse ? '#ffffff' : n4);
  px(-1, topY + 9, 2, 2, '#ffffff');

  // Master Sovereign Twin Blazing Horns + Central White-Hot Crown Spike!
  if (isMaster) {
    // Extended twin crimson-pink horns
    px(-18, topY - 9, 4, 6, g0);
    px(-17, topY - 8, 2, 5, n4);
    px(-17, topY - 8, 1, 2, '#ffffff');
    px(14, topY - 9, 4, 6, g0);
    px(15, topY - 8, 2, 5, n4);
    px(16, topY - 8, 1, 2, '#ffffff');
    // Central radiant spear crest
    px(-3, topY - 7, 6, 7, g0);
    px(-2, topY - 6, 4, 6, n3);
    px(-1, topY - 6, 2, 5, '#ffffff');
    // Bright metallic shoulder ribs
    px(-w + 2, topY + 4, 3, 2, g4);
    px(w - 5, topY + 4, 3, 2, g4);
  }
}

/* -------------------------------------------------------------------------
   8. CENTOID (Tier 2 Segmented Emerald/Gold Bio-Mech Serpent, faces +X)
   ------------------------------------------------------------------------- */
function drawCentoid32(ctx, cx, cy, e, time) {
  const px = makePx(ctx, cx, cy);
  const [c0, c1, c2, c3, c4] = SATURN_PALETTE.centoid;
  const [y0, , y2, y3, y4] = SATURN_PALETTE.pulsar;
  const [g0] = STEEL;
  const step = Math.round(Math.sin(time * 16 + (e.centoidOrder || 0) * 1.1) * 2);

  // Scuttling golden articulated pixel legs (top & bottom flanks)
  px(-5 + step, -14, 2, 5, y3);
  px(-5 + step, -14, 2, 1, y4);
  px(2 - step, -14, 2, 5, y3);
  px(2 - step, -14, 2, 1, y4);

  px(-5 - step, 9, 2, 5, y3);
  px(-5 - step, 13, 2, 1, y4);
  px(2 + step, 9, 2, 5, y3);
  px(2 + step, 13, 2, 1, y4);

  if (e.isCentoidHead) {
    // Twin golden serrated pixel mandibles reaching forward (+X)
    px(10, -9, 6, 3, y0);
    px(11, -8, 6, 2, y3);
    px(15, -7, 3, 2, y4);
    px(10, 6, 6, 3, y0);
    px(11, 6, 6, 2, y3);
    px(15, 5, 3, 2, y4);

    // Armored emerald head carapace
    px(-12, -10, 22, 20, g0);
    px(-10, -11, 17, 22, g0);
    px(9, -7, 5, 14, g0);

    px(-11, -9, 20, 18, c1);
    px(-9, -10, 15, 20, c2);
    px(-6, -8, 13, 16, c3);
    px(6, -6, 6, 12, c2);
    px(8, -4, 4, 8, c3);

    // Dorsal emerald highlight ridge & gold V-chevron
    px(-8, -3, 12, 6, c1);
    px(-5, -4, 2, 2, y3);
    px(-3, -2, 2, 4, y4);
    px(-5, 2, 2, 2, y3);

    // Glowing yellow-gold twin compound eyes
    px(3, -7, 4, 4, y0);
    px(4, -6, 3, 3, y3);
    px(5, -6, 2, 2, '#ffffff');

    px(3, 3, 4, 4, y0);
    px(4, 3, 3, 3, y3);
    px(5, 4, 2, 2, '#ffffff');
  } else {
    // Segmented emerald armored body ring
    px(-10, -9, 20, 18, g0);
    px(-8, -10, 16, 20, g0);

    px(-9, -8, 18, 16, c1);
    px(-7, -9, 14, 18, c2);
    px(-5, -7, 10, 14, c3);
    // Dark green armored joint rib
    px(-3, -8, 2, 16, c0);
    // Glowing golden dorsal power node
    px(0, -3, 5, 6, y0);
    px(1, -2, 3, 4, y3);
    px(2, -1, 2, 2, y4);
    // Specular chitin glint
    px(-6, -7, 2, 3, c4);
  }
}

/* -------------------------------------------------------------------------
   9. ALPHA CENTOID (Tier 3 Elite Indigo/Violet/Pink Serpent, faces +X)
   ------------------------------------------------------------------------- */
function drawAlphaCentoid32(ctx, cx, cy, e, time) {
  const px = makePx(ctx, cx, cy);
  const [a0, a1, a2, a3, pink] = ALPHA_RAMP;
  const [g0, , , g3] = STEEL;
  const step = Math.round(Math.sin(time * 19 + (e.centoidOrder || 0) * 1.2) * 2.5);

  // Jagged neon-pink & violet plasma legs
  px(-5 + step, -15, 2, 6, pink);
  px(-4 + step, -15, 1, 2, '#ffffff');
  px(3 - step, -15, 2, 6, pink);
  px(4 - step, -15, 1, 2, '#ffffff');

  px(-5 - step, 9, 2, 6, pink);
  px(-4 - step, 13, 1, 2, '#ffffff');
  px(3 + step, 9, 2, 6, pink);
  px(4 + step, 13, 1, 2, '#ffffff');

  if (e.isCentoidHead) {
    // Blazing twin hot-pink horned mandibles
    px(10, -10, 8, 3, a0);
    px(11, -9, 8, 2, pink);
    px(16, -8, 4, 2, '#ffc8f0');
    px(10, 7, 8, 3, a0);
    px(11, 7, 8, 2, pink);
    px(16, 6, 4, 2, '#ffc8f0');

    // Heavy angular void-indigo & electric-violet armored head
    px(-13, -11, 24, 22, g0);
    px(-10, -12, 18, 24, g0);
    px(10, -8, 6, 16, g0);

    px(-12, -10, 22, 20, a1);
    px(-9, -11, 16, 22, a2);
    px(-6, -9, 14, 18, a3);
    px(8, -6, 6, 12, a2);
    px(10, -4, 4, 8, a3);

    // Armored dark-indigo inner crest & pink core jewel
    px(-8, -6, 12, 12, a1);
    px(-6, -4, 4, 8, a2);
    px(-2, -3, 5, 6, pink);
    px(-1, -1, 3, 2, '#ffffff');

    // Luminous twin bright-pink Alpha eyes
    px(4, -7, 4, 4, a0);
    px(5, -6, 3, 3, pink);
    px(6, -6, 2, 2, '#ffffff');

    px(4, 3, 4, 4, a0);
    px(5, 3, 3, 3, pink);
    px(6, 4, 2, 2, '#ffffff');
  } else {
    // Deep indigo & electric violet plated body with pulsing pink crystal core
    px(-11, -10, 22, 20, g0);
    px(-8, -11, 16, 22, g0);

    px(-10, -9, 20, 18, a1);
    px(-7, -10, 14, 20, a2);
    px(-5, -8, 10, 16, a3);
    // Steel side ribs
    px(-6, -7, 9, 2, g3);
    px(-6, 5, 9, 2, g3);
    // Pulsing hot-pink diamond plasma core
    px(-4, -4, 8, 8, a0);
    px(-3, -3, 6, 6, pink);
    px(-1, -1, 2, 2, '#ffffff');
  }
}

/* -------------------------------------------------------------------------
   9b. MASTER CENTOPHAGE (Tier 4 Master — Overlord Graft, Obsidian/Acid/Dark Purple)
       Same size as Centoid/Super Centoid! Replaces crimson with Super Centoid dark purple.
   ------------------------------------------------------------------------- */
function drawCentophage32(ctx, cx, cy, e, time) {
  const px = makePx(ctx, cx, cy);
  const o = '#07090d';
  const [a0, a1, a2, a3] = ['#12161e', '#1e2530', '#313c4b', '#506075'];
  const [v0, v1, v2, v3] = ['#2e4700', '#69a600', '#ccff00', '#edff8f'];
  // Dark purple straight from Super/Alpha Centoid's ALPHA_RAMP!
  const [p0, p1, p2, p3] = ALPHA_RAMP;
  const cl1 = '#b8f000';
  const cl2 = '#f4ffaa';
  const isHead = !!e.isCentoidHead;
  const isTail = !!e.isCentoidTail && !isHead;
  const ord = e.centoidOrder || 0;
  const step = Math.round(Math.sin(time * 22 + ord * 1.15) * 2.5);
  const pulse = Math.floor(time * 10 + ord) % 2 === 0;

  // Angular scythe-blade legs (chartreuse rear blade + dark-purple front scythe!)
  if (!isTail) {
    for (const dir of [-1, 1]) {
      const s1 = dir < 0 ? step : -step;
      const yOut = dir < 0 ? -15 : 9;
      const bladeY = dir < 0 ? -15 : 13;
      px(-5 + s1, yOut, 4, 6, o);
      px(-4 + s1, yOut + (dir < 0 ? 1 : 0), 2, 5, a3);
      px(-2 + s1, bladeY, 4, 2, cl1);
      px(1 + s1, bladeY, 2, 2, cl2);

      px(3 - s1, yOut, 3, 6, o);
      px(4 - s1, yOut + (dir < 0 ? 1 : 0), 2, 5, a3);
      px(5 - s1, bladeY, 3, 2, p2); // Super Centoid dark-purple front scythe edge
      px(6 - s1, bladeY, 1, 2, p3);
    }
  }

  if (isHead) {
    // Interlocking serrated fangs (+10..+20) tipped in Super Centoid dark purple
    px(10, -10, 9, 4, o);
    px(11, -9, 8, 2, a3);
    px(17, -8, 3, 3, p2);
    px(18, -8, 2, 2, p3);
    px(13, -6, 2, 2, v2);

    px(10, 6, 9, 4, o);
    px(11, 7, 8, 2, a3);
    px(17, 5, 3, 3, p2);
    px(18, 6, 2, 2, p3);
    px(13, 4, 2, 2, v2);

    // Swept-back Master acid-chartreuse crown horns
    px(-14, -12, 7, 4, o);
    px(-13, -11, 6, 2, v2);
    px(-14, -11, 2, 2, v3);
    px(-14, 8, 7, 4, o);
    px(-13, 9, 6, 2, v2);
    px(-14, 9, 2, 2, v3);

    // Heavy angular obsidian battle-helm carapace
    px(-12, -11, 23, 22, o);
    px(-9, -12, 17, 24, o);
    px(10, -7, 5, 14, o);

    px(-11, -10, 21, 20, a0);
    px(-8, -11, 15, 22, a1);
    px(-5, -9, 13, 18, a2);
    px(8, -5, 5, 10, a2);
    // Beveled crown armor plates
    px(-9, -8, 12, 3, a3);
    px(-9, 5, 12, 3, a3);

    // Central glowing Master crest diamond (acid surround + dark-purple core!)
    px(-7, -4, 10, 8, o);
    px(-6, -3, 8, 6, v1);
    px(-4, -2, 5, 4, pulse ? v3 : v2);
    px(-3, -2, 4, 4, p1);
    px(-2, -1, 3, 2, p2);
    px(-1, -1, 1, 2, p3);

    // Sharp fierce slanting Super-Centoid dark-purple Master eyes
    px(3, -8, 6, 4, o);
    px(4, -7, 5, 2, p1);
    px(5, -7, 4, 2, p2);
    px(6, -6, 3, 2, p3);
    px(8, -6, 1, 1, '#d8c4ff');

    px(3, 4, 6, 4, o);
    px(4, 5, 5, 2, p1);
    px(5, 5, 4, 2, p2);
    px(6, 4, 3, 2, p3);
    px(8, 5, 1, 1, '#d8c4ff');
  } else if (isTail) {
    // Serrated harvester blade tail with dark-purple core
    px(-17, -3, 9, 6, o);
    px(-16, -2, 8, 4, a3);
    px(-17, -1, 6, 2, v2);
    px(-14, -1, 3, 2, v3);

    px(-9, -8, 17, 16, o);
    px(-8, -7, 15, 14, a0);
    px(-6, -6, 11, 12, a1);
    px(-4, -4, 8, 8, a2);
    px(-3, -2, 6, 4, p1);
    px(-2, -2, 5, 4, p2);
    px(-1, -1, 2, 2, p3);
  } else {
    const graft = e.absorbedTint || null;
    // Chevron-plated sovereign armor with twin lateral chartreuse gill vents
    px(-11, -10, 22, 20, o);
    px(-8, -11, 16, 22, o);

    px(-10, -9, 20, 18, a0);
    px(-7, -10, 14, 20, a1);
    px(-5, -8, 11, 16, a2);

    // Sharp forward-pointing obsidian chevron ridge
    px(-2, -9, 3, 18, a3);
    px(1, -6, 2, 12, a3);
    px(3, -3, 2, 6, a3);

    // Lateral acid gill vents
    px(-8, -8, 5, 3, o);
    px(-7, -7, 4, 2, pulse ? v3 : v2);
    px(-8, 5, 5, 3, o);
    px(-7, 5, 4, 2, pulse ? v3 : v2);

    // Central core: stolen entity tint wrapped in acid veins, or pulsing dark-purple Master conduit!
    px(-5, -4, 8, 8, o);
    if (graft) {
      px(-4, -3, 6, 6, graft.mid);
      px(-2, -2, 3, 4, graft.bright);
      px(-5, -1, 2, 2, v2);
      px(2, -1, 2, 2, v2);
    } else {
      px(-4, -3, 6, 6, p0);
      px(-4, -3, 6, 6, p1);
      px(-3, -2, 4, 4, p2);
      px(-2, -1, 3, 2, pulse ? p3 : p2);
      px(-1, -1, 1, 2, pulse ? '#d8c4ff' : p3);
    }
  }
}

/* -------------------------------------------------------------------------
   10. PULSAR (Tier 3 Elite Gold/Yellow Fighter + Twin Tesla Lightning Rods!)
   ------------------------------------------------------------------------- */
function drawPulsar32(ctx, cx, cy, e, time) {
  const px = makePx(ctx, cx, cy);
  const [p0, p1, p2, p3, p4] = SATURN_PALETTE.pulsar;
  const [g0, g1, g2, g3, g4] = STEEL;
  const ox = Math.round(cx);
  const oy = Math.round(cy);

  // Outer swept elite silhouette
  px(-12, -16, 24, 5, g0);
  px(-20, -11, 40, 11, g0);
  px(-23, -4, 46, 11, g0);
  px(-18, 7, 36, 7, g0);
  px(-6, 11, 12, 6, g0);

  // Outer swept armored golden-yellow wings + dark gunmetal shoulder trim
  px(-22, -3, 10, 9, p1);
  px(-21, -2, 8, 7, p2);
  px(-19, -2, 6, 4, p3);
  px(-22, -3, 4, 4, g2);
  px(-21, -2, 2, 2, g3);

  px(12, -3, 10, 9, p1);
  px(13, -2, 8, 7, p2);
  px(13, -2, 6, 4, p3);
  px(18, -3, 4, 4, g2);
  px(19, -2, 2, 2, g3);

  // Central angular generator chassis
  px(-11, -15, 22, 26, p1);
  px(-14, -10, 28, 19, p2);
  px(-10, -13, 20, 21, p3);
  px(-5, 11, 10, 5, p2);
  px(-3, 12, 6, 4, p3);
  px(-1, 14, 2, 2, p4);

  // Pulsing orange-gold hexagonal dynamo core
  const coreBright = Math.floor(time * 12) % 2 === 0;
  px(-7, -8, 14, 12, g0);
  px(-6, -7, 12, 10, p1);
  px(-5, -6, 10, 8, p2);
  px(-3, -4, 6, 4, coreBright ? '#ffffff' : p4);
  px(-2, -3, 4, 2, '#ffffff');

  // 2 Prominent Twin Tesla Lightning Rods extending forward (+Y) from wings
  // Left rod
  px(-17, 7, 6, 14, g0);
  px(-16, 7, 4, 13, g2);
  px(-15, 7, 2, 13, g4);
  px(-18, 10, 8, 2, p2); // conductor coil 1
  px(-18, 14, 8, 2, p2); // conductor coil 2
  px(-17, 10, 6, 1, p3);
  px(-17, 14, 6, 1, p3);
  // Left discharge orb
  px(-17, 19, 6, 5, p3);
  px(-16, 20, 4, 3, '#ffffff');

  // Right rod
  px(11, 7, 6, 14, g0);
  px(12, 7, 4, 13, g2);
  px(13, 7, 2, 13, g4);
  px(10, 10, 8, 2, p2);
  px(10, 14, 8, 2, p2);
  px(11, 10, 6, 1, p3);
  px(11, 14, 6, 1, p3);
  // Right discharge orb
  px(11, 19, 6, 5, p3);
  px(12, 20, 4, 3, '#ffffff');

  // Live crackling 32-bit pixel lightning arc jumping between the two Tesla tips!
  const j1 = Math.round(Math.sin(time * 38 + (e.animPhase || 0)) * 3);
  const j2 = Math.round(Math.cos(time * 52 + (e.animPhase || 0)) * 3);
  const arcCol = Math.floor(time * 24) % 2 === 0 ? '#ffffff' : COLORS.yellow;
  const pts = [
    [-12, 21],
    [-6, 21 + j1],
    [0, 21 - j2],
    [6, 21 + j1],
    [12, 21]
  ];
  ctx.fillStyle = arcCol;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let s = 0; s <= steps; s++) {
      const t = steps > 0 ? s / steps : 0;
      const ax = ox + Math.round(x0 + (x1 - x0) * t);
      const ay = oy + Math.round(y0 + (y1 - y0) * t);
      ctx.fillRect(ax, ay, 2, 2);
    }
  }
}

/* -------------------------------------------------------------------------
   11. ENFORCER WING (Deployable Flux Cyan / Null Crimson Thread Drone)
   ------------------------------------------------------------------------- */
export function drawSaturnEnforcerWing(ctx, ew, time = 0) {
  const isNull = ew.variant === 'NULL';
  const ramp = isNull ? SATURN_PALETTE.null : SATURN_PALETTE.flux;
  const [r0, r1, r2, r3, r4] = ramp;
  const [g0, , g2, g3] = STEEL;

  ctx.save();
  ctx.translate(Math.round(ew.x), Math.round(ew.y));
  if (ew.angle !== undefined) ctx.rotate(ew.angle + Math.PI / 2);

  const px = (rx, ry, w, h, col) => {
    ctx.fillStyle = col;
    ctx.fillRect(rx, ry, w, h);
  };

  // Exhaust spark
  const thr = Math.floor(time * 18) % 2;
  px(-1, 8, 2, 3 + thr, r3);
  px(-1, 8, 2, 1, '#ffffff');

  if (isNull) {
    // Jagged angular crimson blade wing
    px(-2, -12, 4, 3, g0);
    px(-6, -9, 12, 6, g0);
    px(-10, -3, 20, 8, g0);
    px(-7, 5, 14, 5, g0);

    px(-9, -2, 18, 6, r1);
    px(-6, -7, 12, 11, r2);
    px(-3, -10, 6, 15, r3);
    px(-1, -11, 2, 14, r4);
    // Steel side razor edges
    px(-9, -1, 3, 4, g2);
    px(6, -1, 3, 4, g2);
    px(-5, 5, 3, 4, r2);
    px(2, 5, 3, 4, r2);
    // Hot core
    px(-2, -2, 4, 4, g0);
    px(-1, -1, 2, 2, '#ffffff');
  } else {
    // Sleek swept cyan dart wing
    px(-2, -12, 4, 4, g0);
    px(-5, -8, 10, 6, g0);
    px(-9, -2, 18, 11, g0);

    px(-8, -1, 16, 9, r1);
    px(-5, -6, 10, 12, r2);
    px(-3, -9, 6, 14, r3);
    px(-1, -11, 2, 15, r4);
    // Brushed steel leading edge accents
    px(-7, 1, 2, 6, g3);
    px(5, 1, 2, 6, g3);
    // Bright plasma core
    px(-2, -2, 4, 4, g0);
    px(-1, -1, 2, 2, '#ffffff');
  }

  ctx.restore();
}

function drawEnemyBodyDispatch(ctx, cx, cy, e, time) {
  switch (e.type) {
    case 'DRONE':
      drawDrone32(ctx, cx, cy, e, time);
      break;
    case 'INTERCEPTOR':
      drawInterceptor32(ctx, cx, cy, e, time);
      break;
    case 'V1_ENFORCER':
      drawV1Enforcer32(ctx, cx, cy, e, time);
      break;
    case 'FLUX_ENFORCER':
      drawFluxEnforcer32(ctx, cx, cy, e, time, false);
      break;
    case 'MASTER_FLUX_ENFORCER':
      drawFluxEnforcer32(ctx, cx, cy, e, time, true);
      break;
    case 'NULL_ENFORCER':
      drawNullEnforcer32(ctx, cx, cy, e, time, false);
      break;
    case 'MASTER_NULL_ENFORCER':
      drawNullEnforcer32(ctx, cx, cy, e, time, true);
      break;
    case 'CENTOID':
      drawCentoid32(ctx, cx, cy, e, time);
      break;
    case 'ALPHA_CENTOID':
      drawAlphaCentoid32(ctx, cx, cy, e, time);
      break;
    case 'CENTOPHAGE':
      drawCentophage32(ctx, cx, cy, e, time);
      break;
    case 'PULSAR':
      drawPulsar32(ctx, cx, cy, e, time);
      break;
    default:
      drawDrone32(ctx, cx, cy, e, time);
      break;
  }
}

/**
 * Main entry point for drawing any built-in 32-bit pixel-art enemy.
 * Supports arbitrary rotation, preview scaling, and crisp white hit-flash!
 */
export function drawSaturnEnemySprite(ctx, e, time = 0, overrideScale = null) {
  const flash = (e.hitFlash || 0) > 0;
  const rx = Math.round(e.x);
  const ry = Math.round(e.y);
  const drawScale = overrideScale !== null ? overrideScale : 1;

  if (flash && ensureEnemyScratch()) {
    _enemyCtx.globalCompositeOperation = 'source-over';
    _enemyCtx.globalAlpha = 1;
    _enemyCtx.clearRect(0, 0, SCRATCH_SZ, SCRATCH_SZ);
    _enemyCtx.imageSmoothingEnabled = false;
    drawEnemyBodyDispatch(_enemyCtx, SCRATCH_HALF, SCRATCH_HALF, e, time);
    _enemyCtx.globalCompositeOperation = 'source-atop';
    _enemyCtx.fillStyle = 'rgba(255, 255, 255, 0.86)';
    _enemyCtx.fillRect(0, 0, SCRATCH_SZ, SCRATCH_SZ);
    _enemyCtx.globalCompositeOperation = 'source-over';

    ctx.save();
    ctx.translate(rx, ry);
    if (e.angle) ctx.rotate(e.angle);
    if (drawScale !== 1) ctx.scale(drawScale, drawScale);
    ctx.drawImage(_enemyCanvas, -SCRATCH_HALF, -SCRATCH_HALF);
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.translate(rx, ry);
  if (e.angle) ctx.rotate(e.angle);
  if (drawScale !== 1) ctx.scale(drawScale, drawScale);
  drawEnemyBodyDispatch(ctx, 0, 0, e, time);
  ctx.restore();
}
