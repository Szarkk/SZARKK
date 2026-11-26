/* =========================================================================
   32-BIT SATURN & UNIVERSAL PIXELLAB SHIP RENDERER (480x640 NATIVE 1:1)
   - Permanent built-in 32x32 monochrome White & Black 32-bit Aurex Fighter
     (mostly crisp bright white, black panel trim, smoked visor, pure white
     thrusters, 5-step banking — never overwritten by new PixelLab skins)
   - Dedicated PixelLab PNG ship renderer (drawPixelLabAurexFighter)
   - Universal Ship-Agnostic Power-Up Gradient Glow & Sheen Compositor
     (true multi-color flowing gradient BOTH around AND over the ship,
     zero blinking, zero alternating, zero per-skin work!)
   - Universal Skin-Matched Holographic Fighter Clones (auto-matches active
     ship skin + live banking + blue-violet hologram scanlines!)
   ========================================================================= */

import { COLORS, SATURN_PALETTE } from '../config.js';
import { spriteLoader } from '../sprite_loader.js';

// Crisp monochrome Titanium-White, Brushed-Silver & Obsidian-Black ramp (no cyan; mostly white!)
const SATURN_AUREX_MONO_HULL = ['#0C0E12', '#2C3038', '#686E7A', '#9EA5B2', '#E4E7EE', '#FFFFFF'];
const SATURN_AUREX_WHITE_THRUST = ['#5E6470', '#9EA5B2', '#D4D9E2', '#F0F3F8', '#FFFFFF'];

const POWERUP_GLOW_RGB = {
  CYAN:   { rim: [0, 246, 255],   sheen: [0, 218, 255],   glow: [0, 246, 255] },
  RED:    { rim: [255, 76, 108],  sheen: [255, 36, 74],   glow: [255, 30, 66] },
  PURPLE: { rim: [228, 148, 255], sheen: [192, 74, 255],  glow: [196, 77, 255] },
  YELLOW: { rim: [255, 236, 86],  sheen: [255, 206, 38],  glow: [255, 224, 52] },
  CLONE:  { rim: [176, 136, 255], sheen: [108, 92, 255],  glow: [138, 61, 255] },
  PLASMA: { rim: [204, 255, 0],   sheen: [45, 255, 122],  glow: [120, 74, 255] }
};

// Reusable 96x96 offscreen scratch buffers (handles 32px, 48px & 64px future fighters with zero GC!)
const SCRATCH_SIZE = 96;
const SCRATCH_HALF = 48;
let _shipCanvas = null;
let _shipCtx = null;
let _rimCanvas = null;
let _rimCtx = null;
let _auraCanvas = null;
let _auraCtx = null;
let _cloneCanvas = null;
let _cloneCtx = null;

function ensureScratchBuffers() {
  if (_shipCtx) return true;
  if (typeof document === 'undefined') return false;

  const makeBuf = () => {
    const c = document.createElement('canvas');
    c.width = SCRATCH_SIZE;
    c.height = SCRATCH_SIZE;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    return [c, g];
  };

  [_shipCanvas, _shipCtx] = makeBuf();
  [_rimCanvas, _rimCtx] = makeBuf();
  [_auraCanvas, _auraCtx] = makeBuf();
  [_cloneCanvas, _cloneCtx] = makeBuf();
  return true;
}

function sampleSmoothPowerupRgb(types, phase, channel, alpha = 1) {
  const n = types.length;
  if (n <= 0) {
    return alpha >= 1 ? 'rgb(255, 255, 255)' : `rgba(255, 255, 255, ${alpha})`;
  }
  if (n === 1) {
    const c = (POWERUP_GLOW_RGB[types[0]] || POWERUP_GLOW_RGB.CYAN)[channel];
    return alpha >= 1 ? `rgb(${c[0]}, ${c[1]}, ${c[2]})` : `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
  }
  const wrapped = ((phase % 1) + 1) % 1;
  const scaled = wrapped * n;
  const i0 = Math.floor(scaled) % n;
  const i1 = (i0 + 1) % n;
  const frac = scaled - Math.floor(scaled);
  // Smooth cosine easing -> liquid, non-blinking gradient transitions
  const u = (1 - Math.cos(frac * Math.PI)) * 0.5;
  const c0 = (POWERUP_GLOW_RGB[types[i0]] || POWERUP_GLOW_RGB.CYAN)[channel];
  const c1 = (POWERUP_GLOW_RGB[types[i1]] || POWERUP_GLOW_RGB.CYAN)[channel];
  const r = Math.round(c0[0] + (c1[0] - c0[0]) * u);
  const g = Math.round(c0[1] + (c1[1] - c0[1]) * u);
  const b = Math.round(c0[2] + (c1[2] - c0[2]) * u);
  return alpha >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Builds a synchronized power-up fillStyle (single crisp color for 1 power-up,
 * OR a silky continuous multi-color diagonal gradient showing ALL stacked colors
 * simultaneously with zero alternating!).
 */
function buildPowerupFill(ctx, activeTypes, scroll, channel, purpleOvercharge, time, x0, y0, x1, y1) {
  if (purpleOvercharge) {
    const overPulse = 0.5 + 0.5 * Math.sin(time * 14);
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, `rgba(255, 255, 255, ${0.86 + 0.14 * overPulse})`);
    g.addColorStop(0.5, '#e89eff');
    g.addColorStop(1, '#ffffff');
    return g;
  }
  if (activeTypes.length >= 2) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    const stops = 8;
    for (let s = 0; s <= stops; s++) {
      const pos = s / stops;
      g.addColorStop(pos, sampleSmoothPowerupRgb(activeTypes, pos * 0.92 + scroll, channel, 1));
    }
    return g;
  }
  return sampleSmoothPowerupRgb(activeTypes, 0, channel, 1);
}

function normalizeActivePowerups(activePowerups, purpleAura, purpleOvercharge) {
  const list = Array.isArray(activePowerups)
    ? activePowerups.filter(t => POWERUP_GLOW_RGB[t])
    : (activePowerups && POWERUP_GLOW_RGB[activePowerups] ? [activePowerups] : []);
  if ((purpleAura || purpleOvercharge) && !list.includes('PURPLE')) {
    list.push('PURPLE');
  }
  return list;
}

/**
 * Draws the permanent built-in 32x32 monochrome White & Black 32-bit Aurex Fighter
 * centered at integer (cx, cy): mostly crisp bright white armor, sharp obsidian-black
 * panel trim & smoked armored cockpit, pure white dual+center thrusters, and 5-step banking!
 */
function drawBuiltInSaturnAurexShip(ctx, cx, cy, opts = {}) {
  const {
    bankAxis = 0,
    thrustAxis = 0,
    time = 0,
    hullRamp = SATURN_AUREX_MONO_HULL,
    thrustRamp = SATURN_AUREX_WHITE_THRUST
  } = opts;

  const x = Math.round(cx);
  const y = Math.round(cy);
  const px = (rx, ry, w, h, col) => {
    ctx.fillStyle = col;
    ctx.fillRect(x + rx, y + ry, w, h);
  };

  // Bank level: -2 (hard left), -1 (mild left), 0 (level), +1 (mild right), +2 (hard right)
  const bankStep = bankAxis <= -0.58 ? -2 : (bankAxis <= -0.2 ? -1 : (bankAxis >= 0.58 ? 2 : (bankAxis >= 0.2 ? 1 : 0)));
  const leftCompress = bankStep < 0 ? Math.abs(bankStep) * 2 : 0;
  const rightCompress = bankStep > 0 ? Math.abs(bankStep) * 2 : 0;
  const leftExtend = bankStep > 0 ? 1 : 0;
  const rightExtend = bankStep < 0 ? 1 : 0;

  const [s0, s1, s2, s3, s4, s5] = hullRamp;
  const [, t2, t3, t4, t5] = thrustRamp;

  // Predominantly bright white wings with clean silver-to-white banking relief
  const dippedWhite = '#C8CDD6';
  const leftWingBody = bankStep < 0 ? dippedWhite : (bankStep > 0 ? s5 : s4);
  const leftWingEdge = bankStep < 0 ? s4 : s5;
  const rightWingBody = bankStep > 0 ? dippedWhite : (bankStep < 0 ? s5 : s4);
  const rightWingEdge = bankStep > 0 ? s4 : s5;

  // Strict Dual-Safe Valkyrie Mk-II swept wing spans (9px level = 26px total, max 10px raised = 28px -> ZERO Dual overlap even mid-bank!)
  const spanL = Math.min(10, Math.max(5, 9 - leftCompress + leftExtend));
  const spanR = Math.min(10, Math.max(5, 9 - rightCompress + rightExtend));
  const lx = -5 + Math.floor(leftCompress * 0.4);
  const rx = 3 - Math.floor(rightCompress * 0.4);

  // Computes the aerodynamic swept-back Valkyrie Mk-II main wing profile for column index i (0 = root -> span-1 = tip)
  const getMainWingProfile = (i, span) => {
    const u = i / Math.max(1, span - 1);
    const topY = Math.round(-2 + u * 8); // Swept mid-fuselage delta leading edge (-2 -> +6)
    const botY = Math.round(5 + u * 4);  // Sleek parallel swept jet trailing edge (+5 -> +9)
    return { topY, botY, u };
  };

  // Draws one mirrored wing assembly: forward mini-canard + swept horizontal tail + swept main wing + subtle wingtip laser rod
  const drawValkyrieSide = (side, span, wingBody, wingEdge) => {
    // 1) Forward mini-canard winglets flanking the nose/cockpit
    const canSpan = Math.max(2, Math.round(span * 0.36));
    for (let i = 0; i < canSpan; i++) {
      const colX = side < 0 ? (-3 - i) : (2 + i);
      const ty = -8 + i;
      const by = -5 + Math.floor(i * 0.6);
      px(colX, ty - 1, 1, (by - ty) + 3, s0);
    }
    const canTipX = side < 0 ? (-3 - canSpan) : (2 + canSpan);
    px(canTipX, -8 + canSpan - 1, 1, 3, s0);
    for (let i = 0; i < canSpan; i++) {
      const colX = side < 0 ? (-3 - i) : (2 + i);
      const ty = -8 + i;
      const by = -5 + Math.floor(i * 0.6);
      px(colX, ty, 1, (by - ty) + 1, wingBody);
      px(colX, ty, 1, 1, wingEdge);
      px(colX, by, 1, 1, s3);
    }

    // 2) Angled swept rear horizontal tail stabilizers flanking the twin engines
    const tailSpan = Math.max(3, Math.round(span * 0.46));
    for (let i = 0; i < tailSpan; i++) {
      const colX = side < 0 ? (-4 - i) : (3 + i);
      const ty = 8 + Math.floor(i * 0.55);
      const by = 11 + Math.floor(i * 0.45);
      px(colX, ty - 1, 1, (by - ty) + 3, s0);
    }
    const tailTipX = side < 0 ? (-4 - tailSpan) : (3 + tailSpan);
    px(tailTipX, 8 + Math.floor((tailSpan - 1) * 0.55), 1, 3, s0);
    for (let i = 0; i < tailSpan; i++) {
      const colX = side < 0 ? (-4 - i) : (3 + i);
      const ty = 8 + Math.floor(i * 0.55);
      const by = 11 + Math.floor(i * 0.45);
      px(colX, ty, 1, (by - ty) + 1, s3);
      px(colX, ty, 1, 1, wingBody);
      px(colX, by, 1, 1, s2);
    }

    // 3) Swept-back main fighter jet wings + subtle pointy wingtip laser rods
    const outerColX = side < 0 ? (-4 - (span - 1)) : (3 + (span - 1));
    const innerAdjX = side < 0 ? (-4 - (span - 2)) : (3 + (span - 2));
    const tipX = side < 0 ? (-4 - span) : (3 + span);
    const tipProf = getMainWingProfile(span - 1, span);
    const rodLen = 3; // Crisp subtle starfighter wingtip barrel/rod
    const rodTopY = tipProf.topY - rodLen;

    // Pass A: Crisp 1px jet-black outer silhouette around diagonal wing + wingtip rod
    for (let i = 0; i < span; i++) {
      const colX = side < 0 ? (-4 - i) : (3 + i);
      const { topY, botY } = getMainWingProfile(i, span);
      px(colX, topY - 1, 1, (botY - topY) + 3, s0);
    }
    px(tipX, rodTopY, 1, (tipProf.botY - rodTopY) + 1, s0);
    px(outerColX, rodTopY - 1, 1, rodLen + 1, s0);
    px(innerAdjX, rodTopY, 1, Math.max(1, rodLen - 1), s0);

    // Pass B: Sculpted 32-bit monochrome titanium-white & silver swept wing armor
    for (let i = 0; i < span; i++) {
      const colX = side < 0 ? (-4 - i) : (3 + i);
      const { topY, botY } = getMainWingProfile(i, span);
      const chord = (botY - topY) + 1;
      px(colX, topY, 1, chord, wingBody);
      px(colX, topY, 1, Math.min(2, chord), wingEdge);
      if (i === Math.floor(span * 0.48) && chord >= 4) {
        px(colX, topY + 2, 1, Math.max(1, chord - 3), s3);
      }
      if (i < span - 1) {
        px(colX, botY - 1, 1, 1, s3); // brushed silver trailing bevel
        px(colX, botY, 1, 1, s2);     // dark steel trailing flap edge
      } else {
        // Sleek wingtip stabilizer cap + pure white strobe beacon
        px(colX, topY, 1, chord, s2);
        px(colX, topY + 1, 1, Math.max(1, chord - 2), s5);
      }
    }

    // Pass C: Subtle starfighter wingtip pointy rod (steel mount -> silver shaft -> pure-white needle tip)
    px(outerColX, tipProf.topY - 1, 1, 1, s2);
    px(outerColX, tipProf.topY - 2, 1, 1, s3);
    px(outerColX, tipProf.topY - 3, 1, 1, s5);
  };

  // 1) Pure WHITE animated twin afterburner plasma plumes (anchored seamlessly at y=11 inside silver bells!)
  const thrFrame = Math.floor(time * 16) % 3;
  const boostLen = thrustAxis > 0.25 ? 3 : (thrustAxis < -0.25 ? -1 : 0);
  const flameH = Math.max(3, 4 + thrFrame + boostLen);

  px(lx, 11, 2, flameH, t3);
  px(lx, 11, 2, Math.max(2, flameH - 1), t4);
  px(lx, 11, 2, Math.max(1, flameH - 3), t5);

  px(rx, 11, 2, flameH, t3);
  px(rx, 11, 2, Math.max(2, flameH - 1), t4);
  px(rx, 11, 2, Math.max(1, flameH - 3), t5);

  // 2) Valkyrie Mk-II Canards, Twin Tails & Swept Main Wings
  drawValkyrieSide(-1, spanL, leftWingBody, leftWingEdge);
  drawValkyrieSide(1, spanR, rightWingBody, rightWingEdge);

  // 3) Razor-Slim Supersonic Fuselage Outline (s0)
  px(-1, -17, 2, 4, s0);   // extended needle nose tip
  px(-2, -14, 4, 5, s0);   // slender upper nose cone
  px(-3, -10, 6, 20, s0);  // slim central fuselage hull
  px(-6, 7, 12, 4, s0);    // rear twin-engine housing

  // 4) Central Fuselage Spine (predominantly crisp white with brushed-silver nose bevels & jet intakes)
  px(-2, -13, 4, 22, s4);         // bright ceramic white sleek fuselage
  px(-1, -16, 2, 25, s5);         // razor-sharp pure white needle nose & dorsal spine
  px(-3, -4, 6, 13, s4);          // mid/aft engine fuselage blend
  // Silver nose-cheek bevels for supersonic taper
  px(-2, -12, 1, 4, s3);
  px(1, -12, 1, 4, s3);
  // Dark gunmetal + silver side air-intake scoops right behind the canards (shift slightly with banking)
  px(bankStep < 0 ? -3 : -4, -3, 2, 7, s1);
  px(bankStep < 0 ? -3 : -4, -3, 1, 6, s2);
  px(bankStep > 0 ? 1 : 2, -3, 2, 7, s1);
  px(bankStep > 0 ? 2 : 3, -3, 1, 6, s2);
  // Crisp twin dorsal vertical tail-fin stripes
  px(-3, 4, 1, 6, s0);
  px(2, 4, 1, 6, s0);
  px(-2, 5, 1, 4, s3);
  px(1, 5, 1, 4, s3);

  // 5) Smoked Black Armored Bubble Canopy with brushed-silver bezel & pure white glint (zero cyan!)
  const canopyX = bankStep < 0 ? -2 : (bankStep > 0 ? 0 : -1);
  px(canopyX - 1, -10, 4, 1, s3); // silver canopy brow frame
  px(canopyX - 1, -9, 4, 7, s0);  // obsidian frame
  px(canopyX, -8, 2, 5, s1);      // smoked armored glass
  px(canopyX, -8, 1, 2, s5);      // crisp white glass highlight

  // 6) Twin Sculpted Brushed-Silver & Dark-Steel Afterburner Bells + Center Tail Sting
  px(lx - 1, 9, 4, 2, s2);
  px(lx, 9, 2, 2, s3);
  px(lx, 10, 2, 1, s4);
  px(rx - 1, 9, 4, 2, s2);
  px(rx, 9, 2, 2, s3);
  px(rx, 10, 2, 1, s4);
  px(-1, 9, 2, 2, s1);            // sleek dark center tail sting between twin engines
}

function drawPixelDashedRing(ctx, cx, cy, radius, color, time, speed = 2.6, dots = 16) {
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

function drawPurpleAuraRings(ctx, x, y, dual, purpleOvercharge, time) {
  const pulse = purpleOvercharge
    ? (0.90 + Math.sin(time * 14) * 0.10)
    : (0.92 + Math.sin(time * 5.5) * 0.08);
  const auraR = (dual ? (purpleOvercharge ? 38 : 32) : (purpleOvercharge ? 28 : 23)) * pulse;
  drawPixelDashedRing(
    ctx, x, y, auraR,
    purpleOvercharge ? '#FFFFFF' : SATURN_PALETTE.arc[3],
    time, purpleOvercharge ? 7.0 : 4.0, 24
  );
  drawPixelDashedRing(
    ctx, x, y, auraR - 5,
    SATURN_PALETTE.arc[2],
    time, purpleOvercharge ? -8.0 : -4.8, 18
  );
}

/**
 * UNIVERSAL POWER-UP GRADIENT GLOW & SMOOTH ENERGY OVERLAY COMPOSITOR
 * Works automatically on ANY ship skin (built-in 32-bit monochrome fighter OR
 * any future PixelLab PNG fighter of any silhouette/size) with ZERO blinking
 * and ZERO single-color alternating:
 *   1. True multi-color radial-feathered ambient aura BEHIND the ship
 *   2. True multi-color blurred neon silhouette bloom AROUND the ship
 *   3. Exact shape-hugging 1px glowing gradient rim hugging the wings & nose
 *   4. Translucent synchronized gradient wash + gliding specular sheen OVER
 *      the ship's exact non-transparent pixels (keeps custom skin art clear!)
 */
function drawCompositeShipWithPowerupGlow(ctx, drawShipAtCenter, x, y, list, purpleOvercharge, time) {
  const rx = Math.round(x);
  const ry = Math.round(y);

  // Fast path: no active power-up -> pure untouched ship skin!
  if ((!list || list.length === 0) && !purpleOvercharge) {
    drawShipAtCenter(ctx, rx, ry);
    return;
  }

  if (!ensureScratchBuffers()) {
    drawShipAtCenter(ctx, rx, ry);
    return;
  }

  const activeTypes = purpleOvercharge ? ['PURPLE'] : list;
  const breath = purpleOvercharge
    ? (0.88 + Math.sin(time * 12) * 0.12)
    : (0.90 + Math.sin(time * 3.6) * 0.10);
  const scroll = -time * 0.72;
  const ox0 = rx - SCRATCH_HALF;
  const oy0 = ry - SCRATCH_HALF;

  // 1) Draw raw base ship centered in offscreen scratch buffer
  _shipCtx.globalCompositeOperation = 'source-over';
  _shipCtx.globalAlpha = 1;
  _shipCtx.clearRect(0, 0, SCRATCH_SIZE, SCRATCH_SIZE);
  _shipCtx.imageSmoothingEnabled = false;
  drawShipAtCenter(_shipCtx, SCRATCH_HALF, SCRATCH_HALF);

  // 2) True Multi-Color Radial-Feathered Ambient Glow Halo in _auraCanvas (NO alternating!)
  const auraRadius = (purpleOvercharge ? 31 : 25) * breath;
  _auraCtx.globalCompositeOperation = 'source-over';
  _auraCtx.globalAlpha = 1;
  _auraCtx.clearRect(0, 0, SCRATCH_SIZE, SCRATCH_SIZE);
  const maskGrad = _auraCtx.createRadialGradient(SCRATCH_HALF, SCRATCH_HALF, 3, SCRATCH_HALF, SCRATCH_HALF, auraRadius);
  maskGrad.addColorStop(0, `rgba(255, 255, 255, ${(purpleOvercharge ? 0.56 : 0.40) * breath})`);
  maskGrad.addColorStop(0.52, `rgba(255, 255, 255, ${(purpleOvercharge ? 0.28 : 0.18) * breath})`);
  maskGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  _auraCtx.fillStyle = maskGrad;
  _auraCtx.beginPath();
  _auraCtx.arc(SCRATCH_HALF, SCRATCH_HALF, auraRadius, 0, Math.PI * 2);
  _auraCtx.fill();

  _auraCtx.globalCompositeOperation = 'source-in';
  _auraCtx.fillStyle = buildPowerupFill(
    _auraCtx, activeTypes, scroll, 'glow', purpleOvercharge, time, 18, 18, 78, 78
  );
  _auraCtx.fillRect(0, 0, SCRATCH_SIZE, SCRATCH_SIZE);
  _auraCtx.globalCompositeOperation = 'source-over';
  ctx.drawImage(_auraCanvas, ox0, oy0);

  // 3) Build exact shape-hugging silhouette gradient in _rimCanvas (synchronized scroll!)
  _rimCtx.globalCompositeOperation = 'source-over';
  _rimCtx.globalAlpha = 1;
  _rimCtx.clearRect(0, 0, SCRATCH_SIZE, SCRATCH_SIZE);
  _rimCtx.imageSmoothingEnabled = false;
  _rimCtx.drawImage(_shipCanvas, 0, 0);
  _rimCtx.globalCompositeOperation = 'source-in';
  _rimCtx.fillStyle = buildPowerupFill(
    _rimCtx, activeTypes, scroll, 'rim', purpleOvercharge, time, 22, 22, 74, 74
  );
  _rimCtx.fillRect(0, 0, SCRATCH_SIZE, SCRATCH_SIZE);
  _rimCtx.globalCompositeOperation = 'source-over';

  // 3a) True Multi-Color Per-Pixel Blurred Neon Bloom AROUND the ship (never alternates single color!)
  ctx.save();
  ctx.filter = purpleOvercharge ? 'blur(6px)' : 'blur(4px)';
  ctx.globalAlpha = purpleOvercharge ? 0.92 : (0.78 * breath);
  ctx.drawImage(_rimCanvas, ox0, oy0);
  ctx.filter = 'none';

  // 3b) Crisp 1px Shape-Hugging Gradient Rim Outline directly behind the ship
  ctx.globalAlpha = purpleOvercharge ? 0.88 : (0.68 * breath);
  ctx.drawImage(_rimCanvas, ox0 - 1, oy0);
  ctx.drawImage(_rimCanvas, ox0 + 1, oy0);
  ctx.drawImage(_rimCanvas, ox0, oy0 - 1);
  ctx.drawImage(_rimCanvas, ox0, oy0 + 1);
  ctx.restore();

  // 4) Smooth translucent synchronized gradient wash + gliding specular sheen OVER ship pixels
  _shipCtx.globalCompositeOperation = 'source-atop';
  _shipCtx.globalAlpha = purpleOvercharge
    ? (0.34 + 0.16 * (0.5 + 0.5 * Math.sin(time * 14)))
    : ((activeTypes.length >= 2 ? 0.34 : 0.27) * breath);
  _shipCtx.fillStyle = buildPowerupFill(
    _shipCtx, activeTypes, scroll, 'sheen', purpleOvercharge, time, 22, 22, 74, 74
  );
  _shipCtx.fillRect(0, 0, SCRATCH_SIZE, SCRATCH_SIZE);

  // Soft diagonal specular plasma sheen gliding smoothly across the armor (every ~1.8s)
  const sweepPhase = ((time * 0.56) % 1 + 1) % 1;
  const sweepPos = 18 + sweepPhase * 60;
  const sheenGrad = _shipCtx.createLinearGradient(
    sweepPos - 14, sweepPos - 14,
    sweepPos + 14, sweepPos + 14
  );
  sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  sheenGrad.addColorStop(0.5, purpleOvercharge ? 'rgba(255, 255, 255, 0.42)' : 'rgba(255, 255, 255, 0.24)');
  sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  _shipCtx.globalAlpha = 1;
  _shipCtx.fillStyle = sheenGrad;
  _shipCtx.fillRect(0, 0, SCRATCH_SIZE, SCRATCH_SIZE);
  _shipCtx.globalCompositeOperation = 'source-over';

  // 5) Draw finished ship with smooth glowing power-up overlay onto main canvas
  ctx.drawImage(_shipCanvas, ox0, oy0);
}

/**
 * Permanent built-in 32-Bit Monochrome White & Black Aurex Fighter skin.
 * Never overwritten when new PixelLab ship skins are added!
 */
export function drawSaturnAurexFighter(
  ctx,
  x,
  y,
  dual = false,
  invuln = false,
  slow = false,
  time = 0,
  activePowerups = null,
  purpleAura = false,
  purpleOvercharge = false,
  animState = null
) {
  if (invuln && Math.floor(time * 16) % 2 === 0) return;

  const offsets = dual ? [-14, 14] : [0];
  const list = normalizeActivePowerups(activePowerups, purpleAura, purpleOvercharge);

  if (purpleAura || purpleOvercharge) {
    drawPurpleAuraRings(ctx, x, y, dual, purpleOvercharge, time);
  }

  const bankAxis = animState ? (animState.bankAxis || 0) : 0;
  const thrustAxis = animState ? (animState.thrustAxis || 0) : 0;

  for (const ox of offsets) {
    drawCompositeShipWithPowerupGlow(
      ctx,
      (targetCtx, cx, cy) => {
        drawBuiltInSaturnAurexShip(targetCtx, cx, cy, {
          bankAxis,
          thrustAxis,
          time
        });
      },
      x + ox,
      y,
      list,
      purpleOvercharge,
      time
    );
  }

  if (slow) {
    drawPixelDashedRing(ctx, x, y, dual ? 30 : 21, SATURN_PALETTE.flux[3], time, 3.2, 20);
  }
}

/**
 * Dedicated renderer for separate PixelLab PNG ship skins (manifestId = 'AUREX_<SKIN_ID>').
 * Each new PixelLab ship skin gets its own card in AUREX_SKINS without replacing 32-BIT SATURN,
 * and AUTOMATICALLY inherits the universal multi-color gradient glow overlay!
 */
export function drawPixelLabAurexFighter(
  ctx,
  manifestId,
  x,
  y,
  dual = false,
  invuln = false,
  slow = false,
  time = 0,
  activePowerups = null,
  purpleAura = false,
  purpleOvercharge = false,
  animState = null
) {
  if (invuln && Math.floor(time * 16) % 2 === 0) return;

  const desiredClip = animState ? (animState.animClip || 'idle') : 'idle';
  const loadedClip = manifestId ? spriteLoader.getClip(manifestId, desiredClip) : null;
  if (!loadedClip) {
    // Graceful fallback while a newly added skin's PNGs are loading
    drawSaturnAurexFighter(
      ctx, x, y, dual, invuln, slow, time, activePowerups, purpleAura, purpleOvercharge, animState
    );
    return;
  }

  const list = normalizeActivePowerups(activePowerups, purpleAura, purpleOvercharge);

  if (purpleAura || purpleOvercharge) {
    drawPurpleAuraRings(ctx, x, y, dual, purpleOvercharge, time);
  }

  const offsets = dual ? [-14, 14] : [0];
  const isBank = desiredClip === 'bank_left' || desiredClip === 'bank_right';
  const frameIdx = isBank
    ? (animState ? animState.bankFrame : 0)
    : Math.floor(time * loadedClip.fps);

  for (const ox of offsets) {
    drawCompositeShipWithPowerupGlow(
      ctx,
      (targetCtx, cx, cy) => {
        spriteLoader.drawFrame(targetCtx, loadedClip, frameIdx, cx, cy);
      },
      x + ox,
      y,
      list,
      purpleOvercharge,
      time
    );
  }

  if (slow) {
    drawPixelDashedRing(ctx, x, y, dual ? 30 : 21, SATURN_PALETTE.flux[3], time, 3.2, 20);
  }
}

/**
 * UNIVERSAL SKIN-MATCHED HOLOGRAM FIGHTER CLONE RENDERER
 * Automatically projects the player's currently equipped skin (32-BIT SATURN or
 * ANY future PixelLab PNG ship skin!) as a glowing blue-violet hologram with
 * live banking, scanlines, i-frame shield ring, and HP pips — zero extra clone
 * sprites ever needed!
 */
export function drawSkinMatchedFighterClone(ctx, cl, time, skin) {
  const flicker = cl.invulnTimer > 0 && Math.floor(time * 22) % 2 === 0;
  const flash = (cl.hitFlash || 0) > 0;
  const rx = Math.round(cl.x);
  const ry = Math.round(cl.y);

  // Soft holographic violet-blue ambient projection glow behind clone
  ctx.save();
  const halo = ctx.createRadialGradient(rx, ry, 2, rx, ry, 21);
  halo.addColorStop(0, flash ? 'rgba(255, 255, 255, 0.45)' : 'rgba(138, 61, 255, 0.34)');
  halo.addColorStop(0.55, 'rgba(56, 82, 255, 0.16)');
  halo.addColorStop(1, 'rgba(56, 82, 255, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(rx, ry, 21, 0, Math.PI * 2);
  ctx.fill();

  // Holographic shield ring while invincible (1.0s break-off i-frames!)
  if (cl.invulnTimer > 0) {
    ctx.strokeStyle = '#d4c4ff';
    ctx.shadowColor = COLORS.clonePurple;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(rx, ry, 17, time * 5, time * 5 + Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();

  if (ensureScratchBuffers()) {
    const desiredClip = cl.animClip || 'idle';
    const loadedClip = (skin && skin.renderer === 'PIXELLAB_SPRITE' && skin.manifestId)
      ? spriteLoader.getClip(skin.manifestId, desiredClip)
      : null;

    // 1) Draw active ship skin centered in _cloneCanvas
    _cloneCtx.globalCompositeOperation = 'source-over';
    _cloneCtx.globalAlpha = 1;
    _cloneCtx.clearRect(0, 0, SCRATCH_SIZE, SCRATCH_SIZE);
    _cloneCtx.imageSmoothingEnabled = false;

    if (loadedClip) {
      const isBank = desiredClip === 'bank_left' || desiredClip === 'bank_right';
      const frameIdx = isBank ? (cl.bankFrame || 0) : Math.floor(time * loadedClip.fps);
      spriteLoader.drawFrame(_cloneCtx, loadedClip, frameIdx, SCRATCH_HALF, SCRATCH_HALF);
    } else {
      drawBuiltInSaturnAurexShip(_cloneCtx, SCRATCH_HALF, SCRATCH_HALF, {
        bankAxis: cl.bankAxis || 0,
        thrustAxis: cl.thrustAxis || 0,
        time
      });
    }

    // 2) Build 1px holographic lavender rim outline in _rimCanvas
    _rimCtx.globalCompositeOperation = 'source-over';
    _rimCtx.globalAlpha = 1;
    _rimCtx.clearRect(0, 0, SCRATCH_SIZE, SCRATCH_SIZE);
    _rimCtx.imageSmoothingEnabled = false;
    _rimCtx.drawImage(_cloneCanvas, 0, 0);
    _rimCtx.globalCompositeOperation = 'source-in';
    _rimCtx.fillStyle = flash ? '#ffffff' : '#c09eff';
    _rimCtx.fillRect(0, 0, SCRATCH_SIZE, SCRATCH_SIZE);
    _rimCtx.globalCompositeOperation = 'source-over';

    // 3) Apply universal blue-violet hologram shader + scanlines strictly inside ship pixels
    _cloneCtx.globalCompositeOperation = 'source-atop';
    if (flash) {
      _cloneCtx.globalAlpha = 0.86;
      _cloneCtx.fillStyle = '#ffffff';
      _cloneCtx.fillRect(0, 0, SCRATCH_SIZE, SCRATCH_SIZE);
    } else {
      const hg = _cloneCtx.createLinearGradient(0, SCRATCH_HALF - 18, 0, SCRATCH_HALF + 18);
      hg.addColorStop(0, '#a682ff');
      hg.addColorStop(0.48, '#3d58ff');
      hg.addColorStop(1, '#8a3dff');
      _cloneCtx.globalAlpha = 0.64;
      _cloneCtx.fillStyle = hg;
      _cloneCtx.fillRect(0, 0, SCRATCH_SIZE, SCRATCH_SIZE);

      // Subtle holographic scanlines every 3px
      _cloneCtx.globalAlpha = 0.28;
      _cloneCtx.fillStyle = '#0c1038';
      for (let sy = SCRATCH_HALF - 24; sy <= SCRATCH_HALF + 24; sy += 3) {
        _cloneCtx.fillRect(0, sy, SCRATCH_SIZE, 1);
      }

      // Bright moving holographic scan shimmer bar
      const scanY = SCRATCH_HALF - 16 + Math.floor(((time * 28 + cl.id * 9) % 32));
      _cloneCtx.globalAlpha = 0.78;
      _cloneCtx.fillStyle = '#e6d8ff';
      _cloneCtx.fillRect(0, scanY, SCRATCH_SIZE, 2);
    }
    _cloneCtx.globalCompositeOperation = 'source-over';
    _cloneCtx.globalAlpha = 1;

    // 4) Draw glowing holographic rim + hologram ship at exact 1:1 pixel crispness (zero scaling distortion!)
    const ox0 = rx - SCRATCH_HALF;
    const oy0 = ry - SCRATCH_HALF;

    ctx.save();
    ctx.globalAlpha = flicker ? 0.40 : 0.86;
    ctx.shadowColor = flash ? '#ffffff' : COLORS.clonePurple;
    ctx.shadowBlur = 7;

    // Subtle 1px holographic rim
    ctx.save();
    ctx.globalAlpha = flicker ? 0.24 : 0.54;
    ctx.drawImage(_rimCanvas, ox0 - 1, oy0);
    ctx.drawImage(_rimCanvas, ox0 + 1, oy0);
    ctx.drawImage(_rimCanvas, ox0, oy0 - 1);
    ctx.drawImage(_rimCanvas, ox0, oy0 + 1);
    ctx.restore();

    ctx.drawImage(_cloneCanvas, ox0, oy0);
    ctx.restore();
  }

  // Mini HP pips indicator underneath detached clones (e.g. 4 HP)
  if (cl.detached && cl.maxHp > 0) {
    const pipW = 5;
    const gap = 2;
    const totalW = cl.maxHp * pipW + (cl.maxHp - 1) * gap;
    const sx = Math.round(cl.x - totalW * 0.5);
    const sy = Math.round(cl.y + 15);
    ctx.save();
    for (let k = 0; k < cl.maxHp; k++) {
      ctx.fillStyle = k < cl.hp ? '#b794ff' : 'rgba(255, 255, 255, 0.16)';
      ctx.fillRect(sx + k * (pipW + gap), sy, pipW, 2.5);
    }
    ctx.restore();
  }
}
