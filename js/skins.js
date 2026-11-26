/* =========================================================================
   AUREX FIGHTER & ENEMY FLEET SKINS REGISTRY
   - Preserves Alpha Test 0.1.2 neon wireframe art permanently as Legacy skins
   - Locks built-in 32-bit Aurex Fighter & 32-bit Nexus Fleet as Defaults
   - Ready to append future PixelLab ship or enemy skins as separate cards!
   ========================================================================= */

import { STORAGE_KEYS } from './config.js';
import { readLS, writeLS } from './utils.js';

export const AUREX_SKINS = [
  {
    id: 'saturn_32bit',
    name: 'AUREX FIGHTER',
    badge: 'DEFAULT',
    badgeClass: 'saturn',
    cardClass: 'skin-saturn',
    renderer: 'SATURN_PIXEL',
    manifestId: null,
    desc: '32-bit monochrome White, Brushed-Silver & Black Aurex Fighter with 5-step banking, silver thruster bells, flowing power-up aura, and exclusive 32-bit pixel weapon & explosion effects.'
  },
  {
    id: 'alpha_test',
    name: 'ALPHA TEST',
    badge: 'LEGACY • 0.1.2',
    badgeClass: 'legacy',
    cardClass: 'skin-legacy',
    renderer: 'ALPHA_VECTOR',
    manifestId: null,
    desc: 'Original Alpha Test 0.1.2 neon wireframe Aurex Fighter preserved permanently as a classic legacy skin, complete with classic vector weapon beams, RGB wave fill, and wireframe bursts.'
  }
  // Future PixelLab ship skins simply append here with:
  // { id: 'my_skin', name: 'MY SKIN', badge: 'CUSTOM', badgeClass: 'saturn', cardClass: 'skin-saturn', renderer: 'PIXELLAB_SPRITE', manifestId: 'AUREX_MY_SKIN', desc: '...' }
];

export const ENEMY_SKINS = [
  {
    id: 'saturn_fleet',
    name: 'NEXUS FLEET',
    badge: 'DEFAULT',
    badgeClass: 'saturn',
    cardClass: 'skin-saturn',
    renderer: 'SATURN_PIXEL',
    desc: 'Complete 32-bit pixel-art redesign of the entire enemy lineup — including exclusive 32-bit pixel explosions, bullet pellets, stepped tractor beam rings, pixel threads, and Pulsar lightning hazards.'
  },
  {
    id: 'alpha_test',
    name: 'ALPHA TEST',
    badge: 'LEGACY • 0.1.2',
    badgeClass: 'legacy',
    cardClass: 'skin-legacy',
    renderer: 'ALPHA_VECTOR',
    desc: 'Original Alpha Test 0.1.2 neon wireframe enemy lineup preserved permanently as a classic legacy skin, complete with original smooth vector beams, hazards, and wireframe delete bursts.'
  }
];

export const RENDER_MODES = {
  PIXEL: 'PIXEL', // 480x640 native 1:1 32-bit pixel buffer (dpr=1)
  HD: 'HD'
};

export function getAurexSkinMeta(skinId) {
  return AUREX_SKINS.find(s => s.id === skinId) || AUREX_SKINS[0];
}

export function loadAurexSkinId() {
  const raw = readLS(STORAGE_KEYS.aurexSkin, AUREX_SKINS[0].id);
  return getAurexSkinMeta(raw).id;
}

export function saveAurexSkinId(skinId) {
  const valid = getAurexSkinMeta(skinId).id;
  writeLS(STORAGE_KEYS.aurexSkin, valid);
  return valid;
}

export function getEnemySkinMeta(skinId) {
  return ENEMY_SKINS.find(s => s.id === skinId) || ENEMY_SKINS[0];
}

export function loadEnemySkinId() {
  const raw = readLS(STORAGE_KEYS.enemySkin, ENEMY_SKINS[0].id);
  return getEnemySkinMeta(raw).id;
}

export function saveEnemySkinId(skinId) {
  const valid = getEnemySkinMeta(skinId).id;
  writeLS(STORAGE_KEYS.enemySkin, valid);
  return valid;
}

export function loadRenderMode() {
  return RENDER_MODES.PIXEL;
}

export function saveRenderMode(mode) {
  const valid = mode === RENDER_MODES.HD ? RENDER_MODES.HD : RENDER_MODES.PIXEL;
  writeLS(STORAGE_KEYS.renderMode, valid);
  return valid;
}
