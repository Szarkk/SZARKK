/* =========================================================================
   DROP-IN PIXELLAB SPRITE LOADER, GRID SLICER & AUTO HIT-FLASH BAKER
   Loads only clips listed in assets/sprites/installed.json (or ready:true)
   so missing future PNGs produce ZERO 404 console/network noise.
   ========================================================================= */

import { SPRITE_MANIFEST, SPRITE_PACK_ROOT } from './sprite_manifest.js';

export function snapAngle16(angle) {
  const step = Math.PI / 8;
  return Math.round(angle / step) * step;
}

function bakeWhiteFlashCanvas(img) {
  try {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth || img.width;
    c.height = img.naturalHeight || img.height;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, c.width, c.height);
    return c;
  } catch {
    return null;
  }
}

class SpriteLoader {
  constructor() {
    this.loaded = new Map(); // key: `${entityId}:${clipName}` -> { img, flashCanvas, cellW, cellH, frames, cols, rows, fps, loop, holdLast, rotateMode }
    this.installedPaths = new Set();
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const res = await fetch('assets/sprites/installed.json', { cache: 'no-cache' });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.clips)) {
          for (const rel of data.clips) {
            if (typeof rel === 'string' && rel.trim()) {
              this.installedPaths.add(rel.trim().replace(/^\/+/, ''));
            }
          }
        }
      }
    } catch {
      // Optional registry — silently fall back to built-in renderers
    }

    const tasks = [];
    for (const [entityId, ent] of Object.entries(SPRITE_MANIFEST)) {
      if (!ent || !ent.clips) continue;
      for (const [clipName, clip] of Object.entries(ent.clips)) {
        if (!clip || !clip.src) continue;
        if (!clip.ready && !this.installedPaths.has(clip.src)) continue;
        tasks.push(this.loadClip(entityId, clipName, ent, clip));
      }
    }
    await Promise.allSettled(tasks);
  }

  loadClip(entityId, clipName, ent, clip) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const cellW = clip.cellW || ent.cellW || img.naturalWidth;
        const cellH = clip.cellH || ent.cellH || img.naturalHeight;
        const cols = clip.cols || Math.max(1, Math.floor(img.naturalWidth / cellW));
        const rows = clip.rows || Math.max(1, Math.floor(img.naturalHeight / cellH));
        const maxCells = cols * rows;
        const frames = Math.max(1, Math.min(clip.frames || maxCells, maxCells));
        this.loaded.set(`${entityId}:${clipName}`, {
          img,
          flashCanvas: bakeWhiteFlashCanvas(img),
          cellW,
          cellH,
          cols,
          rows,
          frames,
          fps: clip.fps || 10,
          loop: clip.loop !== false,
          holdLast: !!clip.holdLast,
          rotateMode: ent.rotateMode || 'UPRIGHT',
          src: clip.src
        });
        resolve(true);
      };
      img.onerror = () => resolve(false);
      img.src = `${SPRITE_PACK_ROOT}${clip.src}`;
    });
  }

  hasClip(entityId, clipName = 'idle') {
    return this.loaded.has(`${entityId}:${clipName}`);
  }

  hasAnyClipFor(entityId) {
    const prefix = `${entityId}:`;
    for (const k of this.loaded.keys()) {
      if (k.startsWith(prefix)) return true;
    }
    return false;
  }

  getClip(entityId, clipName = 'idle') {
    return this.loaded.get(`${entityId}:${clipName}`) || this.loaded.get(`${entityId}:idle`) || null;
  }

  getInstalledCount() {
    return this.loaded.size;
  }

  /**
   * Draws a single frame from a loaded horizontal strip or PixelLab grid PNG
   * centered on (x, y) with crisp nearest-neighbor pixel rendering.
   */
  drawFrame(ctx, clipEntry, frameIndex, x, y, opts = {}) {
    if (!clipEntry || !clipEntry.img) return false;
    const {
      angle = 0,
      scale = 1,
      flash = false,
      alpha = 1,
      flipX = false
    } = opts;

    const total = clipEntry.frames;
    const safeFrame = clipEntry.loop
      ? ((Math.floor(frameIndex) % total) + total) % total
      : Math.max(0, Math.min(total - 1, Math.floor(frameIndex)));

    const col = safeFrame % clipEntry.cols;
    const row = Math.floor(safeFrame / clipEntry.cols);
    const sx = col * clipEntry.cellW;
    const sy = row * clipEntry.cellH;
    const dw = Math.round(clipEntry.cellW * scale);
    const dh = Math.round(clipEntry.cellH * scale);
    const source = (flash && clipEntry.flashCanvas) ? clipEntry.flashCanvas : clipEntry.img;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (alpha < 1) ctx.globalAlpha *= alpha;
    ctx.translate(Math.round(x), Math.round(y));

    if (angle !== 0 && clipEntry.rotateMode !== 'UPRIGHT') {
      const drawAngle = clipEntry.rotateMode === 'SNAP_16' ? snapAngle16(angle) : angle;
      ctx.rotate(drawAngle);
    }
    if (flipX) ctx.scale(-1, 1);

    ctx.drawImage(
      source,
      sx, sy, clipEntry.cellW, clipEntry.cellH,
      -Math.round(dw * 0.5), -Math.round(dh * 0.5), dw, dh
    );
    ctx.restore();
    return true;
  }
}

export const spriteLoader = new SpriteLoader();
