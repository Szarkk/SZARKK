/* =========================================================================
   AUREX FIGHTER SKINS & RENDER PIPELINE REGISTRY (PHASE 0)
   Preserves Alpha Test 0.1.2 neon wireframe art as a permanent Legacy skin
   while preparing clean slots for 32-Bit Saturn & future custom ship skins.
   ========================================================================= */

import { STORAGE_KEYS } from './config.js';
import { readLS, writeLS } from './utils.js';

export const AUREX_SKINS = [
  {
    id: 'saturn_32bit',
    name: '32-BIT SATURN',
    badge: '32-BIT • DEFAULT',
    badgeClass: 'saturn',
    cardClass: 'skin-saturn',
    renderer: 'SATURN_PIXEL',
    manifestId: null,
    desc: 'Permanent built-in 32-bit monochrome White, Brushed-Silver & Black Aurex Fighter with 5-step banking, silver thruster bells, pure white jets, and flowing gradient power-up aura.'
  },
  {
    id: 'alpha_test',
    name: 'ALPHA TEST',
    badge: 'LEGACY • 0.1.2',
    badgeClass: 'legacy',
    cardClass: 'skin-legacy',
    renderer: 'ALPHA_VECTOR',
    manifestId: null,
    desc: 'Original Alpha Test 0.1.2 neon wireframe Aurex Fighter preserved permanently as a classic legacy skin, complete with crisp glow trails and stacked RGB wave fill.'
  }
  // Future PixelLab ship skins simply append here with:
  // { id: 'my_skin', name: 'MY SKIN', badge: 'PIXELLAB', badgeClass: 'saturn', cardClass: 'skin-saturn', renderer: 'PIXELLAB_SPRITE', manifestId: 'AUREX_MY_SKIN', desc: '...' }
];

export const RENDER_MODES = {
  PIXEL: 'PIXEL', // 480x640 fixed 1:1 nearest-neighbor 32-bit pixel buffer (dpr=1)
  HD: 'HD'        // Classic HiDPI vector canvas (dpr up to 2)
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

export function loadRenderMode() {
  const raw = readLS(STORAGE_KEYS.renderMode, RENDER_MODES.PIXEL);
  return raw === RENDER_MODES.HD ? RENDER_MODES.HD : RENDER_MODES.PIXEL;
}

export function saveRenderMode(mode) {
  const valid = mode === RENDER_MODES.HD ? RENDER_MODES.HD : RENDER_MODES.PIXEL;
  writeLS(STORAGE_KEYS.renderMode, valid);
  return valid;
}
