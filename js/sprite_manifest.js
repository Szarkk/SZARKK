/* =========================================================================
   PIXELLAB-READY 32-BIT SPRITE & ANIMATION MANIFEST (480x640 NATIVE 1:1)
   Supports horizontal strips AND PixelLab 2x2 / 4x4 grid PNG exports.
   Add newly exported PNG filenames to assets/sprites/installed.json (or set
   ready: true on a clip) to activate them live with zero code changes!
   ========================================================================= */

export const SPRITE_PACK_ROOT = 'assets/sprites/saturn_32bit/';

export const SPRITE_MANIFEST = {
  // PLAYER & CLONES (32x32)
  AUREX: {
    cellW: 32,
    cellH: 32,
    rotateMode: 'UPRIGHT',
    clips: {
      idle:       { src: 'player/aurex_idle.png',       frames: 4, fps: 10, loop: true },
      bank_left:  { src: 'player/aurex_bank_left.png',  frames: 4, fps: 14, loop: false, holdLast: true },
      bank_right: { src: 'player/aurex_bank_right.png', frames: 4, fps: 14, loop: false, holdLast: true },
      thrust_up:  { src: 'player/aurex_thrust_up.png',  frames: 4, fps: 14, loop: true },
      overcharge: { src: 'player/aurex_overcharge.png', frames: 4, fps: 14, loop: true }
    }
  },
  CLONE: {
    cellW: 32,
    cellH: 32,
    rotateMode: 'UPRIGHT',
    clips: {
      idle: { src: 'player/clone_idle.png', frames: 4, fps: 10, loop: true }
    }
  },

  // NORMAL & DEPLOYABLE ENEMIES (32x32)
  DRONE: {
    cellW: 32,
    cellH: 32,
    rotateMode: 'SNAP_16',
    clips: {
      idle: { src: 'enemies/drone_idle.png', frames: 4, fps: 10, loop: true }
    }
  },
  INTERCEPTOR: {
    cellW: 32,
    cellH: 32,
    rotateMode: 'SNAP_16',
    clips: {
      idle: { src: 'enemies/interceptor_idle.png', frames: 4, fps: 10, loop: true }
    }
  },
  ENFORCER_WING_FLUX: {
    cellW: 32,
    cellH: 32,
    rotateMode: 'SNAP_16',
    clips: {
      fly: { src: 'enemies/wing_flux_fly.png', frames: 4, fps: 12, loop: true }
    }
  },
  ENFORCER_WING_NULL: {
    cellW: 32,
    cellH: 32,
    rotateMode: 'SNAP_16',
    clips: {
      fly: { src: 'enemies/wing_null_fly.png', frames: 4, fps: 12, loop: true }
    }
  },
  CENTOID: {
    cellW: 32,
    cellH: 32,
    rotateMode: 'SNAP_16',
    clips: {
      head: { src: 'enemies/centoid_head.png', frames: 4, fps: 10, loop: true },
      body: { src: 'enemies/centoid_body.png', frames: 4, fps: 10, loop: true }
    }
  },
  ALPHA_CENTOID: {
    cellW: 32,
    cellH: 32,
    rotateMode: 'SNAP_16',
    clips: {
      head: { src: 'enemies/alpha_centoid_head.png', frames: 4, fps: 10, loop: true },
      body: { src: 'enemies/alpha_centoid_body.png', frames: 4, fps: 10, loop: true }
    }
  },

  // ADVANCED ENEMY (48x48)
  V1_ENFORCER: {
    cellW: 48,
    cellH: 48,
    rotateMode: 'SNAP_16',
    clips: {
      idle:         { src: 'enemies/v1_idle.png',         frames: 4, fps: 10, loop: true },
      cracked:      { src: 'enemies/v1_cracked.png',      frames: 4, fps: 10, loop: true },
      synergy_flux: { src: 'enemies/v1_synergy_flux.png', frames: 4, fps: 12, loop: true },
      synergy_null: { src: 'enemies/v1_synergy_null.png', frames: 4, fps: 12, loop: true }
    }
  },

  // ELITE ENEMIES (64x64)
  FLUX_ENFORCER: {
    cellW: 64,
    cellH: 64,
    rotateMode: 'SNAP_16',
    clips: {
      idle:    { src: 'enemies/elite_flux_idle.png',    frames: 4, fps: 10, loop: true },
      damaged: { src: 'enemies/elite_flux_damaged.png', frames: 4, fps: 10, loop: true }
    }
  },
  NULL_ENFORCER: {
    cellW: 64,
    cellH: 64,
    rotateMode: 'SNAP_16',
    clips: {
      idle:    { src: 'enemies/elite_null_idle.png',    frames: 4, fps: 10, loop: true },
      damaged: { src: 'enemies/elite_null_damaged.png', frames: 4, fps: 10, loop: true }
    }
  },
  PULSAR: {
    cellW: 64,
    cellH: 64,
    rotateMode: 'UPRIGHT',
    clips: {
      idle:    { src: 'enemies/pulsar_idle.png',    frames: 6, fps: 12, loop: true },
      damaged: { src: 'enemies/pulsar_damaged.png', frames: 4, fps: 12, loop: true }
    }
  },

  // MASTER ENEMIES (96x96)
  MASTER_FLUX_ENFORCER: {
    cellW: 96,
    cellH: 96,
    rotateMode: 'SNAP_16',
    clips: {
      idle:    { src: 'enemies/master_flux_idle.png',    frames: 6, fps: 10, loop: true },
      damaged: { src: 'enemies/master_flux_damaged.png', frames: 6, fps: 10, loop: true }
    }
  },
  MASTER_NULL_ENFORCER: {
    cellW: 96,
    cellH: 96,
    rotateMode: 'SNAP_16',
    clips: {
      idle:    { src: 'enemies/master_null_idle.png',    frames: 6, fps: 10, loop: true },
      damaged: { src: 'enemies/master_null_damaged.png', frames: 6, fps: 10, loop: true }
    }
  },

  // POWER-UP CAPSULES (32x32)
  CAPSULE_CYAN:   { cellW: 32, cellH: 32, clips: { idle: { src: 'pickups/capsule_cyan_idle.png',   frames: 4, fps: 10, loop: true } } },
  CAPSULE_RED:    { cellW: 32, cellH: 32, clips: { idle: { src: 'pickups/capsule_red_idle.png',    frames: 4, fps: 10, loop: true } } },
  CAPSULE_PURPLE: { cellW: 32, cellH: 32, clips: { idle: { src: 'pickups/capsule_purple_idle.png', frames: 4, fps: 10, loop: true } } },
  CAPSULE_YELLOW: { cellW: 32, cellH: 32, clips: { idle: { src: 'pickups/capsule_yellow_idle.png', frames: 4, fps: 10, loop: true } } },
  CAPSULE_CLONE:  { cellW: 32, cellH: 32, clips: { idle: { src: 'pickups/capsule_clone_idle.png',  frames: 4, fps: 10, loop: true } } },

  // ANIMATED EXPLOSIONS & ONE-SHOT PIXELLAB VFX
  FX_HIT_SPARK:    { cellW: 24,  cellH: 24,  clips: { play: { src: 'fx/fx_hit_spark.png',    frames: 4,  fps: 18, loop: false } } },
  FX_EXP_SMALL:    { cellW: 32,  cellH: 32,  clips: { play: { src: 'fx/fx_exp_small.png',    frames: 6,  fps: 16, loop: false } } },
  FX_EXP_MED:      { cellW: 64,  cellH: 64,  clips: { play: { src: 'fx/fx_exp_med.png',      frames: 8,  fps: 16, loop: false } } },
  FX_EXP_LARGE:    { cellW: 96,  cellH: 96,  clips: { play: { src: 'fx/fx_exp_large.png',    frames: 10, fps: 15, loop: false } } },
  FX_CANNON_BLAST: { cellW: 128, cellH: 128, clips: { play: { src: 'fx/fx_cannon_blast.png', frames: 10, fps: 14, loop: false } } },
  FX_SPAWN_WARP:   { cellW: 32,  cellH: 32,  clips: { play: { src: 'fx/fx_spawn_warp.png',   frames: 6,  fps: 16, loop: false } } }
};

export function getEntityManifest(entityId) {
  return SPRITE_MANIFEST[entityId] || null;
}

export function getClipSpec(entityId, clipName) {
  const ent = SPRITE_MANIFEST[entityId];
  if (!ent || !ent.clips) return null;
  const clip = ent.clips[clipName] || ent.clips.idle || ent.clips.play;
  if (!clip) return null;
  return {
    entityId,
    clipName,
    cellW: clip.cellW || ent.cellW,
    cellH: clip.cellH || ent.cellH,
    rotateMode: ent.rotateMode || 'UPRIGHT',
    ...clip
  };
}
