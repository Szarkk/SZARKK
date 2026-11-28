/* =========================================================================
   SZARKK — CONSTANTS, LOGICAL PLAYFIELD, COMBAT TUNING & NEXUS ARCHIVE
   ========================================================================= */

export const GAME_VERSION = 'Alpha Test 0.1.4';
export const LOGICAL_W = 480;
export const LOGICAL_H = 640;

// Player free 2D movement arena (bottom 2/5ths of playable field — Touhou-style dodging)
export const PLAYER_MIN_Y = Math.round(LOGICAL_H * 0.60); // 384 (top edge of bottom 2/5ths)
export const PLAYER_MAX_Y = LOGICAL_H - 28;               // 612
export const PLAYER_DEFAULT_Y = LOGICAL_H - 54;           // 586

export const STANDARD_WAVES_PER_SECTOR = 4;     // 4 silent waves per standard sector
export const ELITE_FLUX_START_SECTOR = 2;       // Elite Enforcer [Flux] debuts at Sec 02 Wave 3/4
export const ELITE_FLUX_START_WAVE = 3;
export const ELITE_START_SECTOR = 2;            // Earliest sector any Elite Enforcer can appear
export const ELITE_NULL_START_SECTOR = 3;       // Elite Enforcer [Null] debuts at Sector 03
export const V1_ENFORCER_HP = 3;                // Advanced Tier: V1 Enforcers take 3 hits
export const V1_SYNERGY_RADIUS = 115;           // Proximity (~1 fighter apart) to Flux/Null Enforcer
export const V1_BUFF_AOE_RADIUS = 130;          // Small AOE enemy buff radius when color-shifted V1 dies
export const ELITE_ENFORCER_HP = 6;             // Elite Enforcers take 6 hits (12 in Challenge 2+ Raiders)
export const MASTER_START_SECTOR = 6;           // Master Enforcers appear at Sector 06+ alongside Elites
export const MASTER_ENFORCER_HP = 18;           // Master Enforcers take 18 hits
export const MASTER_STREAK_REWARD_COUNT = 10;   // Kill 10 Master Flux or Null without dying -> glowing reward capsule
export const ELITE_ABDUCTION_CHANCE = 0.10;     // 10% chance per wave for 1 Elite Enforcer to abduct
export const HARD_FIELD_DEBUFF_CHANCE = 0.50;   // Hard Mode: 50% chance when surviving Master/Elite re-enters
export const HARD_FIELD_DEBUFF_DUR = 4.0;       // 4.0s Flux / Null Field CRT debuff duration
export const NULL_FIELD_DMG_MULT = 0.33;        // Null Field reduces player damage to 0.33x
export const HARD_FIELD_MIN_POWERUPS = 0;       // Active power-ups required for the Field roll
export const HARD_FIELD_ELITES_TRIGGER = true;  // Elite Flux/Null Enforcers (not just Masters) can trigger the Field
export const CHALLENGE_INTERVAL = 2;            // Bonus Challenge stage after every 2nd standard sector (Sec 02->CH.01, Sec 04->CH.02, Sec 06->CH.03...)
export const CHALLENGE_ELITE_START = 2;         // Starting at Challenge 2 (after Sec 04), 2x HP Elite Raiders spawn
export const CHALLENGE_EXTRA_ROUND_START = 2;   // Starting at Challenge 2+, 2 extra tactical rounds spawn
export const CHALLENGE_MASTER_START = 3;        // Starting at Challenge 3 (after Sec 06), guarded Master Enforcers spawn
export const CHALLENGE_CENTOID_TIME_LIMIT = 20.0; // Challenge Extra Rounds: surviving Centoids/Super Centoids/Centophages escape after 20s!
export const HARD_MODE_SECTOR_OFFSET = 5;       // Hard Mode starts at Sec 06+ intensity (H01 = eff. Sec 06, full waves & Masters live)
export const HARD_MODE_CHALLENGE_OFFSET = 2;    // Hard Mode H-CH.01 starts at Challenge 3+ (Guarded Masters + Extra Rounds)

// MILESTONE 2 ENEMY CONSTANTS (Centoid, Super Centoid, Master Centophage, Pulsar & Cost-Based Swaps)
export const CENTOID_START_SECTOR = 4;          // Advanced Tier: Centoids appear Sec 04+
export const CENTOID_SEGMENTS = 8;              // 8 segments make up a Centoid
export const CENTOID_HEAD_HP = 4;               // Centoid Head = 4 HP (body segments = 1 HP)
export const CENTOID_MAX_SPLITS = 2;            // Max 2 living centoids split from 1 original
export const ALPHA_CENTOID_START_SECTOR = 7;    // Elite Tier: Super Centoids appear Sec 07+
export const SUPER_CENTOID_SEGMENTS = 10;       // Super Centoids get 10 segments!
export const SUPER_CENTOID_HEAD_HP = 6;         // Super Centoid Head = 6 HP
export const ALPHA_CENTOID_SEG_HP = 2;          // Super Centoid body segments = 2 HP (headshot deletes entire chain!)
export const ALPHA_CENTOID_DROP_CHANCE = 0.20;  // 20% chance to drop Fighter Clones capsule
export const CENTOPHAGE_START_SECTOR = 8;       // Master Tier: Centophage ONLY appears Sector 08+!
export const CENTOPHAGE_SEGMENTS = 6;           // Centophage starts with 6 segments
export const CENTOPHAGE_HEAD_HP = 8;            // Centophage Head = 8 HP
export const CENTOPHAGE_SEG_HP = 3;             // Centophage body segments = 3 HP
export const CENTOPHAGE_SPEED_MULT = 1.8;       // 1.8x faster than Centoids & Super Centoids!
export const CENTOPHAGE_CHECK_INTERVAL = 2.0;   // Every 2.0s rolls 80% chance to hunt a non-centoid entity
export const CENTOPHAGE_CHASE_CHANCE = 0.80;    // 80% chase roll; on fail -> 6.0s cooldown
export const CENTOPHAGE_FAIL_COOLDOWN = 6.0;    // 6.0s cooldown when 80% chase roll misses
export const CENTOPHAGE_MAX_SEGMENTS = 24;      // Safety segment cap for marathon fights
export const CENTOPHAGE_DROP_CLONE = 0.07;      // Independent 7% drop: Fighter Clones
export const CENTOPHAGE_DROP_LIGHTNING = 0.07;  // Independent 7% drop: Chain Lightning
export const CENTOPHAGE_DROP_PLASMA = 0.25;     // Independent 25% drop: Plasma Rings!
export const CENTOPHAGE_DROP_CHANCE = 0.25;     // Legacy alias
export const PULSAR_START_SECTOR = 7;           // Elite Tier: Pulsars appear Sec 07+
export const PULSAR_HP = 6;                     // 6 HP yellow elite-sized fighter
export const PULSAR_FIRE_INTERVAL = 3.0;        // Leaf-falling electro ball every 3.0s
export const PULSAR_JAM_DUR = 2.0;              // Electro ball jams firing for 2.0s (no damage!)
export const PULSAR_SPARK_SLOW_DUR = 4.0;       // Death sparks slow fire rate 2x for 4.0s (no damage!)
export const PULSAR_DROP_CHANCE = 0.10;         // 10% chance to drop Chain Lightning capsule ONLY
export const COST_SWAP_CHANCE = 0.05;           // 5% chance per mob per wave (strictly +-1 tier!)

export const UNIT_META = {
  DRONE:                { tier: 1, cost: 1, minSec: 1 },
  INTERCEPTOR:          { tier: 1, cost: 1, minSec: 1 },
  V1_ENFORCER:          { tier: 2, cost: 2, minSec: 1 },
  CENTOID:              { tier: 2, cost: 2, minSec: CENTOID_START_SECTOR },
  FLUX_ENFORCER:        { tier: 3, cost: 3, minSec: ELITE_FLUX_START_SECTOR },
  NULL_ENFORCER:        { tier: 3, cost: 3, minSec: ELITE_NULL_START_SECTOR },
  ALPHA_CENTOID:        { tier: 3, cost: 3, minSec: ALPHA_CENTOID_START_SECTOR },
  PULSAR:               { tier: 3, cost: 3, minSec: PULSAR_START_SECTOR },
  MASTER_FLUX_ENFORCER: { tier: 4, cost: 6, minSec: MASTER_START_SECTOR },
  MASTER_NULL_ENFORCER: { tier: 4, cost: 6, minSec: MASTER_START_SECTOR },
  CENTOPHAGE:           { tier: 4, cost: 6, minSec: CENTOPHAGE_START_SECTOR }
};

// POWER-UP CONSTANTS (Stackable Gauge-based Cyan, Red, Purple, Yellow & Clone Capsules!)
export const CYAN_POWERUP_START_SECTOR = 2;     // Cyan Capsule unlocks at Sector 02 Wave 3/4
export const CYAN_POWERUP_START_WAVE = 3;
export const RED_POWERUP_START_SECTOR = 3;      // Red Capsule unlocks at Sector 03
export const POWERUP_START_SECTOR = 2;          // Earliest sector capsules unlock (Sec 02 Wave 3+)
export const PURPLE_POWERUP_START_SECTOR = 4;   // Purple Capsule (Arc Wave) starts Sector 04+
export const YELLOW_POWERUP_START_SECTOR = 7;   // Yellow Capsule (Chain Lightning) starts Sector 07+
export const CLONE_POWERUP_START_SECTOR = 7;    // Dark Blue/Purple Capsule (Fighter Clones) starts Sector 07+
export const PLASMA_POWERUP_START_SECTOR = 8;   // Plasma Capsule (Plasma Rings) unlocks Sector 08+ & 25% Centophage drop

// Dynamic Hard Mode unlock floor: automatically tracks the highest unlock sector across ALL mobs & capsules!
export const CAPSULE_UNLOCK_SECTORS = {
  CYAN: CYAN_POWERUP_START_SECTOR,
  RED: RED_POWERUP_START_SECTOR,
  PURPLE: PURPLE_POWERUP_START_SECTOR,
  YELLOW: YELLOW_POWERUP_START_SECTOR,
  CLONE: CLONE_POWERUP_START_SECTOR,
  PLASMA: PLASMA_POWERUP_START_SECTOR
};
export const HARD_MODE_MAX_UNLOCK_SECTOR = Math.max(
  ...Object.values(UNIT_META).map(m => m.minSec || 1),
  ...Object.values(CAPSULE_UNLOCK_SECTORS)
);
export const PLASMA_RING_COUNT = 3;             // Fires 3 piercing plasma rings in quick succession
export const PLASMA_RING_SHOT_INTERVAL = 0.25;  // 0.25s between each aimed ring
export const PLASMA_RING_SPEED = 460;           // Slightly faster than enemy bullets (~300-430)
export const PLASMA_RING_RADIUS = 17;           // Slightly bigger than Pulsar electro balls (13px)
export const PLASMA_RING_DMG = 2.5;             // Piercing pass-through damage
export const PLASMA_RING_HIT_COOLDOWN = 0.22;   // Per-target pass-through cooldown (resets on border bounce!)
export const PLASMA_AIM_TIMEOUT = 4.0;          // 4.0s to aim before auto-firing 3 rings in 3 random directions!
export const PLASMA_BORDER_DUR = 8.0;           // Glowing ricochet border lasts 8.0s after FIRST enemy or border hit!
export const POWERUP_MAX_ENERGY = 100;          // Full horizontal power-up gauge capacity per slot
export const CYAN_SHOT_ENERGY_COST = 100 / 30;  // 30 conserved Homing Missile volleys per full gauge
export const YELLOW_SHOT_ENERGY_COST = 100 / 24;// 24 conserved Chain Lightning shots (3 individual bolts per burst = 3 ammo, 8 bursts)
export const CHAIN_LIGHTNING_MAX_SHOTS = 24;
export const CHAIN_LIGHTNING_RANGE = 152;       // Short range (~4 fighters long) across front 270-degree arc
export const CHAIN_LIGHTNING_JUMP_RANGE = 200;  // Extended 200px edge-to-edge chain jump distance
export const CHAIN_LIGHTNING_MAX_JUMPS = 8;     // Jumps to up to 8 additional targets
export const CHAIN_LIGHTNING_DMG = 1.0;         // 1.0 base damage per hit & jump
export const CHAIN_LIGHTNING_REPEL_DIST = 114;  // Enemy plane bounce-off distance (~3 planes = 3 * 38px)
export const CHAIN_LIGHTNING_DISABLE_DUR = 4.0; // Disables repelled enemy firing for 4.0 seconds
export const HOMING_TRACK_HALF_WIDTH = 76;      // Homing tracking corridor: 2 planes (76px) on each side
export const CHAIN_LIGHTNING_BURST_COUNT = 3;   // 3 bolts fired per burst
export const CHAIN_LIGHTNING_BURST_INTERVAL = 0.25; // 3 bolts go out over 0.50s (0.00s, 0.25s, 0.50s)
export const CHAIN_LIGHTNING_BURST_COOLDOWN = 0.80; // Waits 0.80s after burst before firing again
export const CLONE_DURATION = 20.0;             // 20.0s countdown (pauses between sectors/challenges/waves!)
export const CLONE_BREAKOFF_TIME = 0.8;         // Clones stay left/right/back for 0.8s then break off
export const CLONE_IFRAMES = 1.0;               // 1.0s invincibility frames upon breaking off
export const CLONE_HP = 4;                      // 4 HP per autonomous hologram clone
export const CLONE_FIRE_COOLDOWN = 0.24;        // Rapid dark-purple bolt cadence (2x bolt velocity!)
export const RED_LASER_DRAIN_PER_SEC = 100 / 11.0; // 11.0s of active firing time (drains ONLY while firing)
export const RED_LASER_TICK_MULT = 20;          // 20x tick rate (~121 ticks/sec) at 0.1 dmg = exact 2.0 dmg/cycle with zero swipe phasing
export const RED_LASER_TICK_DMG = 2.0 / RED_LASER_TICK_MULT;    // 0.1 base dmg per rapid laser tick (2x vs Normal tier!)
export const RED_LASER_THREAD_CHIP = 1.0 / RED_LASER_TICK_MULT; // 0.05 Null Thread chip per rapid tick (exact same ~1s shatter)
export const CAPSULE_DROP_DELAY = 1.0;          // Destroyed enemies drop capsules 1 second later
export const FLOATING_CAPSULE_CHANCE = 0.20;    // 20% chance every standard wave once capsules unlock
export const TOUCH_HINT_DURATION = 1.5;         // Touch indicator lasts 1.5s starting immediately upon touch

// Mid-arena playfield bounds where power-up capsules float and are shot to activate
export const CAPSULE_BOUNDS = {
  minX: 62,
  maxX: LOGICAL_W - 62,
  minY: 205,
  maxY: 352
};

// PURPLE ARC WAVE CONSTANTS
export const ARC_WAVE_MAX = 6;                  // 6 conserved Arc Wave charges per gauge
export const ARC_WAVE_DMG = 0.5;                // 0.5 dmg per wave (defensive bullet-clear + chip into 2x AoE Cannon!)
export const ARC_WAVE_INTERVAL = 0.78;          // Auto-fire spacing when AUTO:ON
export const ARC_WAVE_MANUAL_COOLDOWN = 0.45;   // Manual fire spacing when AUTO:OFF
export const ARC_WAVE_SPEED = 420;              // Upward wave speed
export const PURPLE_FIRE_SPEED_MULT = 1.5;      // Purple bullets shoot 1.5x faster
export const CANNON_SHOT_SPEED = 480;           // AOE Cannon Shot velocity
export const CANNON_AOE_RADIUS = 276;           // Massive 2x AOE blast radius
export const CANNON_AUTO_FIRE_DELAY = 3.0;      // Auto-fires 3s after 1st cannon tap if not double-tapped

// WEAPON & THREAD CONSTANTS
export const FIRE_COOLDOWN = 0.165;             // ~6 shots/sec uncapped rapid pulse
export const TAP_BUFFER_TIME = 0.12;            // 120ms tap queue
export const PLAYER_BULLET_SPEED = 760;
export const HOMING_MISSILE_SPEED = 540;
export const PLAYER_SPEED = 310;
export const THREAD_LIFETIME = 4.8;             // Double-length Threads (4.8s duration & 2x path span)
export const FLUX_THREAD_BULLET_SLOW = 9;       // Cyan Flux Threads slow passing bullets by 9x
export const SLOWED_BULLET_DISSOLVE_TIME = 2.0; // Bullets slowed by Flux Threads dissolve after 2.0s
export const NULL_THREAD_HITS = 6;              // Crimson Null Threads take 6 hits to shatter
export const ELITE_SURGE_CHANCE = 0.12;         // 12% chance for +2..4 consecutive Enforcer Wings
export const MASTER_SURGE_CHANCE = 0.22;        // 22% surge chance for Master Enforcers
export const ELITE_SURGE_INTERVAL = 0.36;

// V1 ENFORCER TRACTOR BEAM TUNING (Slightly livelier + 80% post-challenge abduction)
export const TRACTOR_INITIAL_DELAY = 7.5;       // Wait before first tractor beam opportunity
export const TRACTOR_INTERVAL = 16.5;           // Cooldown between occasional tractor sweeps
export const TRACTOR_RETRY_DELAY = 10.5;        // Retry delay if beaming boss is destroyed mid-sweep
export const TRACTOR_MAX_PER_SECTOR = 2;        // Cap abduction attempts per sector so it's never spammy
export const TRACTOR_POST_CHALLENGE_CHANCE = 0.80; // 80% chance an existing V1 Enforcer abducts after each Challenge
export const TRACTOR_BEAM_Y = PLAYER_MIN_Y - 58; // Hover cleanly above the bottom 2/5ths player arena
export const TRACTOR_APPROACH_DUR = 1.15;       // Smooth flanking swoop to locked lane (no homing!)
export const TRACTOR_BEAM_DUR = 3.0;            // Active tractor beam cone duration
export const TRACTOR_LIFT_DUR = 1.25;           // Visual lift duration once player is kidnapped
export const TRACTOR_PULL_RADIUS = 48;          // Horizontal cone radius for gentle magnetic pull
export const TRACTOR_CAPTURE_RADIUS = 34;       // Horizontal radius for kidnapping lock

export const COLORS = {
  cyan: '#00f6ff',
  cyanSoft: '#7efaff',
  blue: '#2277ff',
  emerald: '#00ffaa',
  amber: '#ff9900',
  gold: '#ffd447',
  v1Orange: '#ff5a1f',
  nullRed: '#ff1e42',
  purple: '#c44dff',
  purpleBright: '#ebbdff',
  yellow: '#ffe640',
  yellowOrange: '#ff9e1b',
  cloneBlue: '#2f5bff',
  clonePurple: '#8a3dff',
  centoidGreen: '#2dff7a',
  centoidDarkGreen: '#0c7c3b',
  centoidGold: '#ffd942',
  alphaBlue: '#2a4cff',
  alphaPurple: '#6f2cff',
  alphaPink: '#ff52c8',
  centophageAcid: '#ccff00',
  centophagePurple: '#4e30b8',
  centophageViolet: '#8d5cff',
  white: '#ecffff'
};

// 32-BIT SATURN NEON-ALLOY MASTER PALETTE (40 Colors: 8 Hue-Shifted 5-Shade Ramps)
// S1 Outline -> S2 Shadow -> S3 Midtone -> S4 Bright -> S5 Core/Specular
export const SATURN_PALETTE = {
  endframe: ['#04050E', '#0A0F24', '#122042', '#1D3C6E', '#396EA6'],
  aurex:    ['#2D354F', '#5A6988', '#9BADB7', '#DBE8F5', '#FFFFFF'],
  flux:     ['#082442', '#0D5680', '#129CD6', '#2BE8FF', '#D4FFFF'],
  null:     ['#38081C', '#7A1030', '#CC1B42', '#FF4769', '#FFC2CF'],
  v1:       ['#3D1414', '#802B19', '#D4551E', '#FF9338', '#FFE299'],
  pulsar:   ['#45220C', '#8F5110', '#E09B19', '#FFE44D', '#FFFFD1'],
  arc:      ['#1D1042', '#48218A', '#8838DB', '#D46BFF', '#F7D6FF'],
  centoid:  ['#092E24', '#12633D', '#1FA854', '#5CF27A', '#D4FFBF']
};

export const STORAGE_KEYS = {
  hi: 'szarkk_hi',
  hiHard: 'szarkk_hi_hard',
  auto: 'szarkk_auto',
  crt: 'szarkk_crt',
  sfx: 'szarkk_sfx',
  leaderboard: 'szarkk_leaderboard',
  callsign: 'szarkk_callsign',
  aurexSkin: 'szarkk_aurex_skin',
  enemySkin: 'szarkk_enemy_skin',
  renderMode: 'szarkk_render_mode'
};

const _fmtSec = (n) => `SEC ${String(n).padStart(2, '0')}`;
const _fmtPct = (v) => `${Math.round(v * 100)}%`;
const _HOMING_VOLLEYS = Math.round(POWERUP_MAX_ENERGY / CYAN_SHOT_ENERGY_COST);
const _LASER_SECS = Math.round(POWERUP_MAX_ENERGY / RED_LASER_DRAIN_PER_SEC);

export const ARCHIVE_ENTRIES = [
  {
    id: 'PLAYER',
    name: 'AUREX FIGHTER',
    badge: 'PLAYER CRAFT',
    badgeClass: 'player',
    cardClass: 'tier-player',
    stats: [
      { text: '2D DODGE ZONE', cls: 'emerald' },
      { text: '~6 SHOTS/SEC', cls: '' },
      { text: 'DUAL RESCUE', cls: 'gold' }
    ],
    desc: 'Your AUREX (Adaptive Unified Recursive EXecution) fighter moves freely across the lower 2/5ths of the Nexus for bullet-hell dodging. Touch and drag anywhere below the dotted line on touchscreens (or use WASD/Arrows on PC). Rescue a captured fighter from an Enforcer to unlock twin-volley Dual-Fighter firepower.'
  },
  {
    id: 'CAPSULE_CYAN',
    name: 'HOMING MISSILES',
    badge: `POWER-UP • ${_fmtSec(CYAN_POWERUP_START_SECTOR)} W${CYAN_POWERUP_START_WAVE}+`,
    badgeClass: 'elite-cyan',
    cardClass: 'tier-pwr-cyan',
    stats: [
      { text: `${_HOMING_VOLLEYS} VOLLEYS (GAUGE)`, cls: 'gold' },
      { text: 'STACKABLE', cls: 'emerald' },
      { text: '±2 PLANE TRACKING', cls: '' },
      { text: '1-HIT NULL THREAD', cls: '' },
      { text: '1.3x VS NULL ENF', cls: 'warn' }
    ],
    desc: `Cyan power-up (${_fmtSec(CYAN_POWERUP_START_SECTOR)} Wave ${CYAN_POWERUP_START_WAVE}+) — shoot the capsule to charge ${_HOMING_VOLLEYS} manual volleys of twin forward-launched homing missiles that track enemies, Enforcer Wings, and capsules within 2 planes on either side! Stacks with different power-ups, shatters crimson Null Threads in 1 hit, and deals 1.3x damage to Elite & Master Null Enforcers.`
  },
  {
    id: 'CAPSULE_RED',
    name: 'CONTINUOUS LASER',
    badge: `POWER-UP • ${_fmtSec(RED_POWERUP_START_SECTOR)}+`,
    badgeClass: 'elite-red',
    cardClass: 'tier-pwr-red',
    stats: [
      { text: 'PIERCING LASER', cls: 'warn' },
      { text: `${_LASER_SECS}s ACTIVE FIRE`, cls: 'gold' },
      { text: 'STACKABLE', cls: 'emerald' },
      { text: '2x VS NORMAL TIER', cls: '' },
      { text: '1.3x VS FLUX ENF', cls: '' }
    ],
    desc: `Red power-up (${_fmtSec(RED_POWERUP_START_SECTOR)}+) — shoot the capsule to charge ${_LASER_SECS}s of active high-frequency nose-locked laser firing (drains ONLY while firing, ${RED_LASER_TICK_DMG} dmg @ ${RED_LASER_TICK_MULT}x tick rate so fast swipes never miss). Deals 2x DPS to Normal tier enemies, pierces straight through ships (blocked only by Null Threads; converts into slowed dissolving red bolts through Flux Threads), and deals 1.3x damage to Elite & Master Flux Enforcers.`
  },
  {
    id: 'CAPSULE_PURPLE',
    name: 'ARC WAVE',
    badge: `POWER-UP • ${_fmtSec(PURPLE_POWERUP_START_SECTOR)}+`,
    badgeClass: 'deploy',
    cardClass: 'tier-pwr-purple',
    stats: [
      { text: `${ARC_WAVE_MAX} WIDE WAVES (${ARC_WAVE_DMG} DMG)`, cls: '' },
      { text: 'STACKABLE', cls: 'emerald' },
      { text: 'VOIDS BULLETS', cls: 'gold' },
      { text: '2x AOE CANNON', cls: 'warn' }
    ],
    desc: `Purple power-up (${_fmtSec(PURPLE_POWERUP_START_SECTOR)}+) — shoot the capsule to charge ${ARC_WAVE_MAX} wide bullet-voiding Arc Waves (${ARC_WAVE_DMG} dmg each)! After the ${ARC_WAVE_MAX}th wave, double-tap Fire to unleash a massive 2x-radius AOE Cannon Shot (Tap 1 supercharges with violent vibration; Tap 2 fires, or auto-fires after ${CANNON_AUTO_FIRE_DELAY}s).`
  },
  {
    id: 'CAPSULE_YELLOW',
    name: 'CHAIN LIGHTNING',
    badge: `POWER-UP • ${_fmtSec(YELLOW_POWERUP_START_SECTOR)}+`,
    badgeClass: 'commander',
    cardClass: 'tier-pwr-yellow',
    stats: [
      { text: `${CHAIN_LIGHTNING_MAX_SHOTS} SHOTS (${CHAIN_LIGHTNING_BURST_COUNT}x BOLTS)`, cls: 'gold' },
      { text: 'RICOCHET & REPEL', cls: '' },
      { text: 'DEATH CROSS ZAP', cls: 'emerald' },
      { text: `JUMPS +${CHAIN_LIGHTNING_MAX_JUMPS} (${CHAIN_LIGHTNING_JUMP_RANGE}px)`, cls: 'warn' }
    ],
    desc: `Yellow power-up (${_fmtSec(YELLOW_POWERUP_START_SECTOR)}+ & ${_fmtPct(PULSAR_DROP_CHANCE)} Pulsar drop) — charges ${CHAIN_LIGHTNING_MAX_SHOTS} shots fired as rapid ${CHAIN_LIGHTNING_BURST_COUNT}-bolt bursts across a front 270° arc, chaining up to ${CHAIN_LIGHTNING_JUMP_RANGE}px across ${CHAIN_LIGHTNING_MAX_JUMPS} targets! While shooting lightning, incoming bullets ricochet into enemies and colliding enemy planes bounce 3 planes back with firing disabled for ${CHAIN_LIGHTNING_DISABLE_DUR}s. Dying with Chain Lightning unleashes a full-screen Cross Lightning blast.`
  },
  {
    id: 'CAPSULE_CLONE',
    name: 'FIGHTER CLONES',
    badge: `POWER-UP • ${_fmtSec(CLONE_POWERUP_START_SECTOR)}+`,
    badgeClass: 'deploy',
    cardClass: 'tier-pwr-clone',
    stats: [
      { text: `3 HOLOGRAMS (${CLONE_HP} HP)`, cls: 'emerald' },
      { text: `${CLONE_DURATION}s TIMER (PAUSES)`, cls: 'gold' },
      { text: '2x BOLT SPEED', cls: '' },
      { text: 'STACKABLE', cls: '' }
    ],
    desc: `Dark blue & purple power-up (${_fmtSec(CLONE_POWERUP_START_SECTOR)}+ & ${_fmtPct(ALPHA_CENTOID_DROP_CHANCE)} Super Centoid drop) — deploys 3 hologram clones (left, right, back) that break off after ${CLONE_BREAKOFF_TIME}s with ${CLONE_IFRAMES}s invincibility frames and ${CLONE_HP} HP each, firing dark purple bolts at 2x speed for ${CLONE_DURATION}s (timer pauses between sectors & challenges; clones stay active if you die).`
  },
  {
    id: 'CAPSULE_PLASMA',
    name: 'PLASMA RINGS',
    badge: `POWER-UP • ${_fmtSec(PLASMA_POWERUP_START_SECTOR)}+`,
    badgeClass: 'centophage',
    cardClass: 'tier-pwr-plasma',
    stats: [
      { text: `${PLASMA_RING_COUNT} PIERCING RINGS`, cls: 'emerald' },
      { text: `${PLASMA_RING_SHOT_INTERVAL}s AIMED BURST`, cls: 'gold' },
      { text: `${PLASMA_BORDER_DUR}s RICOCHET BORDER`, cls: '' },
      { text: `${_fmtPct(CENTOPHAGE_DROP_PLASMA)} CENTOPHAGE DROP`, cls: 'warn' }
    ],
    desc: `Green, dark-purple & yellow Plasma Capsule (${_fmtSec(PLASMA_POWERUP_START_SECTOR)}+ & ${_fmtPct(CENTOPHAGE_DROP_PLASMA)} Centophage drop) — wraps your ship in a temporary damage-blocking shield while lighting up the arena borders. You have ${PLASMA_AIM_TIMEOUT}s to aim a guided line in any direction and fire ${PLASMA_RING_COUNT} large piercing Plasma Rings (${PLASMA_RING_SHOT_INTERVAL}s apart), or auto-fire in ${PLASMA_RING_COUNT} random directions! Grants 0.5s post-fire invincibility; the ${PLASMA_BORDER_DUR}s ricochet border timer starts on the first enemy or wall impact.`
  },
  {
    id: 'DRONE',
    name: 'DRONE',
    badge: 'NORMAL',
    badgeClass: 'basic',
    cardClass: 'tier-basic',
    stats: [
      { text: 'HP: 1', cls: '' },
      { text: 'PTS: 50 / 100', cls: 'gold' },
      { text: 'DROP: 0.1%', cls: '' }
    ],
    desc: `Geometric lower-rank scouts that swarm in sweeping dives. Fragile in combat, with a rare 0.1% capsule drop chance starting in ${_fmtSec(CYAN_POWERUP_START_SECTOR)} Wave ${CYAN_POWERUP_START_WAVE}.`
  },
  {
    id: 'INTERCEPTOR',
    name: 'INTERCEPTOR',
    badge: 'NORMAL',
    badgeClass: 'basic',
    cardClass: 'tier-basic',
    stats: [
      { text: 'HP: 1', cls: '' },
      { text: 'PTS: 80 / 160', cls: 'gold' },
      { text: 'DROP: 0.1%', cls: '' }
    ],
    desc: 'Mid-row assault interceptors that dive in wide arcs while firing amber plasma bolts.'
  },
  {
    id: 'V1_ENFORCER',
    name: 'V1 ENFORCER',
    badge: 'ADVANCED',
    badgeClass: 'commander',
    cardClass: 'tier-commander',
    stats: [
      { text: `HP: ${V1_ENFORCER_HP}`, cls: '' },
      { text: 'PTS: 150 / 400', cls: 'gold' },
      { text: 'FLUX/NULL SYNERGY', cls: 'warn' },
      { text: 'TRACTOR BEAM', cls: 'emerald' }
    ],
    desc: `Advanced-tier arch commander (${V1_ENFORCER_HP} HP, 20% slower movement, lower fire rate). Deploys a Tractor Beam to capture your Aurex Fighter. At 1 HP near a Cyan Enforcer it shifts Cyan and bursts an AOE +30% speed buff on death; near a Red Enforcer it shifts Red and bursts an AOE +33% HP buff on death.`
  },
  {
    id: 'CENTOID',
    name: 'CENTOID',
    badge: `ADVANCED • ${_fmtSec(CENTOID_START_SECTOR)}+`,
    badgeClass: 'player',
    cardClass: 'tier-centoid',
    stats: [
      { text: `${CENTOID_SEGMENTS} SEGMENTS`, cls: '' },
      { text: `HEAD: ${CENTOID_HEAD_HP} HP / SEG: 1 HP`, cls: 'gold' },
      { text: 'HEADSHOT = INSTA-CLEAR', cls: 'emerald' },
      { text: `SPLITS (MAX ${CENTOID_MAX_SPLITS})`, cls: 'warn' }
    ],
    desc: `Green & gold ${CENTOID_SEGMENTS}-segment cyber-serpent (${_fmtSec(CENTOID_START_SECTOR)}+). Reinforced ${CENTOID_HEAD_HP} HP head with 1 HP body segments. Zig-zags horizontally across the arena, stepping down and rebounding upward at the bottom. Destroy the head to erase the entire Centoid at once without splitting!`
  },
  {
    id: 'ALPHA_CENTOID',
    name: 'SUPER CENTOID',
    badge: `ELITE • ${_fmtSec(ALPHA_CENTOID_START_SECTOR)}+`,
    badgeClass: 'deploy',
    cardClass: 'tier-alpha',
    stats: [
      { text: `${SUPER_CENTOID_SEGMENTS} SEGMENTS`, cls: 'warn' },
      { text: `HEAD: ${SUPER_CENTOID_HEAD_HP} HP / SEG: ${ALPHA_CENTOID_SEG_HP} HP`, cls: 'gold' },
      { text: '90° CORRIDOR PATH', cls: '' },
      { text: `DROP: ${_fmtPct(ALPHA_CENTOID_DROP_CHANCE)} CLONES`, cls: 'emerald' }
    ],
    desc: `Elite dark-blue, purple & pink ${SUPER_CENTOID_SEGMENTS}-segment serpent (${_fmtSec(ALPHA_CENTOID_START_SECTOR)}+) with a ${SUPER_CENTOID_HEAD_HP} HP head and ${ALPHA_CENTOID_SEG_HP} HP body segments that snaps along sharp 90° corridors like Null Threads. Splitting caps at ${CENTOID_MAX_SPLITS} living snakes; headshots erase the entire chain. ${_fmtPct(ALPHA_CENTOID_DROP_CHANCE)} chance to drop Fighter Clones.`
  },
  {
    id: 'CENTOPHAGE',
    name: 'CENTOPHAGE',
    badge: `MASTER • ${_fmtSec(CENTOPHAGE_START_SECTOR)}+`,
    badgeClass: 'centophage',
    cardClass: 'tier-centophage',
    stats: [
      { text: `${CENTOPHAGE_SEGMENTS}+ SEGMENTS`, cls: 'emerald' },
      { text: `HEAD: ${CENTOPHAGE_HEAD_HP} HP / SEG: ${CENTOPHAGE_SEG_HP} HP`, cls: 'warn' },
      { text: `${CENTOPHAGE_SPEED_MULT}x SPEED`, cls: 'gold' },
      { text: `DROP: ${_fmtPct(CENTOPHAGE_DROP_PLASMA)}P / ${_fmtPct(CENTOPHAGE_DROP_CLONE)}C / ${_fmtPct(CENTOPHAGE_DROP_LIGHTNING)}L`, cls: '' }
    ],
    desc: `Master-tier parasitic Overlord Centoid (${_fmtSec(CENTOPHAGE_START_SECTOR)}+) moving ${CENTOPHAGE_SPEED_MULT}x faster than Centoids & Super Centoids. Every ${CENTOPHAGE_CHECK_INTERVAL}s rolls ${_fmtPct(CENTOPHAGE_CHASE_CHANCE)} to hunt a non-Centoid entity (${CENTOPHAGE_FAIL_COOLDOWN}s cooldown on miss) and devour it to grow: +1 segment for Normal, +2 for Advanced, and +3 for Elite prey! Independent drops: ${_fmtPct(CENTOPHAGE_DROP_PLASMA)} Plasma Rings, ${_fmtPct(CENTOPHAGE_DROP_CLONE)} Clones, ${_fmtPct(CENTOPHAGE_DROP_LIGHTNING)} Chain Lightning.`
  },
  {
    id: 'PULSAR',
    name: 'PULSAR',
    badge: `ELITE • ${_fmtSec(PULSAR_START_SECTOR)}+`,
    badgeClass: 'commander',
    cardClass: 'tier-pulsar',
    stats: [
      { text: `HP: ${PULSAR_HP}`, cls: '' },
      { text: `${PULSAR_JAM_DUR}s FIRE JAM ORBS`, cls: 'warn' },
      { text: `${PULSAR_SPARK_SLOW_DUR}s 2x SLOW SPARKS`, cls: '' },
      { text: `DROP: ${_fmtPct(PULSAR_DROP_CHANCE)} LIGHTNING`, cls: 'gold' }
    ],
    desc: `Yellow elite-sized fighter with twin lightning rods (${_fmtSec(PULSAR_START_SECTOR)}+). Drops leaf-falling electro balls every ${PULSAR_FIRE_INTERVAL}s that jam your firing for ${PULSAR_JAM_DUR}s (no HP damage), and explodes on death into downward sparks that halve fire rate for ${PULSAR_SPARK_SLOW_DUR}s. ${_fmtPct(PULSAR_DROP_CHANCE)} chance to drop Chain Lightning.`
  },
  {
    id: 'FLUX_ENFORCER',
    name: 'ELITE ENFORCER [FLUX]',
    badge: `ELITE • ${_fmtSec(ELITE_FLUX_START_SECTOR)} W${ELITE_FLUX_START_WAVE}+`,
    badgeClass: 'elite-cyan',
    cardClass: 'tier-flux',
    stats: [
      { text: `HP: ${ELITE_ENFORCER_HP} (${ELITE_ENFORCER_HP * 2} IN CH.${CHALLENGE_ELITE_START}+)`, cls: '' },
      { text: `${_fmtPct(ELITE_ABDUCTION_CHANCE)} ABDUCT / WAVE`, cls: 'emerald' },
      { text: 'DROP: 10%C / 2%R / 2%P', cls: 'gold' },
      { text: `${FLUX_THREAD_BULLET_SLOW}x SLOW + DISSOLVE`, cls: 'warn' }
    ],
    desc: `Deploys starting at ${_fmtSec(ELITE_FLUX_START_SECTOR)} Wave ${ELITE_FLUX_START_WAVE}. Takes ${ELITE_ENFORCER_HP} hits to destroy and dives slower than normal ships (${_fmtPct(ELITE_ABDUCTION_CHANCE)} chance per wave for an Elite to attempt abduction). Launches curved cyan Enforcer Wings (${_fmtPct(ELITE_SURGE_CHANCE)} surge) whose double-length Flux Threads slow your ship 4s, slow passing bullets ${FLUX_THREAD_BULLET_SLOW}x (dissolving after ${SLOWED_BULLET_DISSOLVE_TIME}s), and turn Red Lasers into slowed dissolving bolts.`
  },
  {
    id: 'NULL_ENFORCER',
    name: 'ELITE ENFORCER [NULL]',
    badge: `ELITE • ${_fmtSec(ELITE_NULL_START_SECTOR)}+`,
    badgeClass: 'elite-red',
    cardClass: 'tier-null',
    stats: [
      { text: `HP: ${ELITE_ENFORCER_HP} (${ELITE_ENFORCER_HP * 2} IN CH.${CHALLENGE_ELITE_START}+)`, cls: '' },
      { text: `${_fmtPct(ELITE_ABDUCTION_CHANCE)} ABDUCT / WAVE`, cls: 'emerald' },
      { text: 'DROP: 10%R / 2%C / 2%P', cls: 'gold' },
      { text: `${NULL_THREAD_HITS}-HIT THREAD WALL`, cls: 'warn' }
    ],
    desc: `Deploys starting at ${_fmtSec(ELITE_NULL_START_SECTOR)}. Takes ${ELITE_ENFORCER_HP} hits to destroy and dives slower than normal ships (${_fmtPct(ELITE_ABDUCTION_CHANCE)} chance per wave for an Elite to attempt abduction). Launches 90° crimson Enforcer Wings (${_fmtPct(ELITE_SURGE_CHANCE)} surge) whose Null Threads BLOCK shots (${NULL_THREAD_HITS} hits to break) and inflict 1s Slow + 4s -20% DMG. In Challenge ${CHALLENGE_ELITE_START}+, raids independently with 2x HP (${ELITE_ENFORCER_HP * 2}) and fires twin Enforcer Wings.`
  },
  {
    id: 'MASTER_FLUX_ENFORCER',
    name: 'MASTER ENFORCER [FLUX]',
    badge: `MASTER • ${_fmtSec(MASTER_START_SECTOR)}+`,
    badgeClass: 'elite-cyan',
    cardClass: 'tier-flux',
    stats: [
      { text: `HP: ${MASTER_ENFORCER_HP}`, cls: 'warn' },
      { text: 'CYAN AURA', cls: '' },
      { text: 'DROP: 25%C / 5%R / 10%P', cls: 'gold' },
      { text: `${MASTER_STREAK_REWARD_COUNT}-KILL STREAK REWARD`, cls: 'emerald' }
    ],
    desc: `Master-tier Flux dreadnought ringed in a radiant cyan aura (${_fmtSec(MASTER_START_SECTOR)}+ alongside Elites, and guarded in Challenge ${CHALLENGE_MASTER_START}+ / Hard Mode). Kill ${MASTER_STREAK_REWARD_COUNT} without dying for a glowing Cyan reward capsule! On Hard Mode, re-entering after a dive can trigger a ${HARD_FIELD_DEBUFF_DUR}s Flux Field (1.5x slower move & fire rate).`
  },
  {
    id: 'MASTER_NULL_ENFORCER',
    name: 'MASTER ENFORCER [NULL]',
    badge: `MASTER • ${_fmtSec(MASTER_START_SECTOR)}+`,
    badgeClass: 'elite-red',
    cardClass: 'tier-null',
    stats: [
      { text: `HP: ${MASTER_ENFORCER_HP}`, cls: 'warn' },
      { text: 'CRIMSON AURA', cls: '' },
      { text: 'DROP: 25%R / 5%C / 10%P', cls: 'gold' },
      { text: `${MASTER_STREAK_REWARD_COUNT}-KILL STREAK REWARD`, cls: 'emerald' }
    ],
    desc: `Master-tier Null warframe blazing with a crimson-red aura (${_fmtSec(MASTER_START_SECTOR)}+ alongside Elites, and guarded in Challenge ${CHALLENGE_MASTER_START}+ / Hard Mode). Kill ${MASTER_STREAK_REWARD_COUNT} without dying for a glowing Red reward capsule! On Hard Mode, re-entering after a dive can trigger a ${HARD_FIELD_DEBUFF_DUR}s Null Field (reduces player damage to ${NULL_FIELD_DMG_MULT}x).`
  },
  {
    id: 'ENFORCER_WING',
    name: 'ENFORCER WINGS',
    badge: 'DEPLOYABLE',
    badgeClass: 'deploy',
    cardClass: 'tier-deploy',
    stats: [
      { text: 'HP: 1', cls: '' },
      { text: 'PTS: 150', cls: 'gold' },
      { text: `THREAD ~${THREAD_LIFETIME}s (2x)`, cls: 'warn' }
    ],
    desc: 'High-speed drones launched by Elite & Master Enforcers. Flux Wings carve double-length curved cyan Flux Threads; Null Wings snap along extended 90° crimson Null Thread corridors.'
  }
];
