/* =========================================================================
   CONSTANTS, LOGICAL PLAYFIELD, COMBAT TUNING & GRID ARCHIVE CATALOG
   ========================================================================= */

export const GAME_VERSION = 'Alpha Test 0.1.1';
export const LOGICAL_W = 480;
export const LOGICAL_H = 640;

// Player free 2D movement arena (bottom 2/5ths of playable field — Touhou-style dodging)
export const PLAYER_MIN_Y = Math.round(LOGICAL_H * 0.60); // 384 (top edge of bottom 2/5ths)
export const PLAYER_MAX_Y = LOGICAL_H - 28;               // 612
export const PLAYER_DEFAULT_Y = LOGICAL_H - 54;           // 586

export const STANDARD_WAVES_PER_SECTOR = 4;     // 4 silent waves per standard sector
export const ELITE_LEGACY_START_SECTOR = 2;     // Elite Legacy Recognizer debuts at Sec 02 Wave 3/4
export const ELITE_LEGACY_START_WAVE = 3;
export const ELITE_START_SECTOR = 2;            // Earliest sector any Elite Recognizer can appear
export const ELITE_ARES_START_SECTOR = 3;       // Elite Ares Recognizer debuts at Sector 03
export const ELITE_REC_HP = 6;                  // Elite Recognizers take 6 hits (12 in Challenge 2+ Raiders)
export const MASTER_START_SECTOR = 6;           // Master Recognizers appear at Sector 06+ alongside Elites
export const MASTER_REC_HP = 15;                // Master Recognizers take 15 hits
export const CHALLENGE_INTERVAL = 2;            // Bonus Challenge stage after every 2nd standard sector (Sec 02->CH.01, Sec 04->CH.02, Sec 06->CH.03...)
export const CHALLENGE_ELITE_START = 2;         // Starting at Challenge 2 (after Sec 04), 2x HP Elite Raiders spawn
export const CHALLENGE_EXTRA_ROUND_START = 2;   // Starting at Challenge 2+, 2 extra tactical rounds spawn
export const CHALLENGE_MASTER_START = 3;        // Starting at Challenge 3 (after Sec 06), guarded Master Recognizers spawn
export const HARD_MODE_SECTOR_OFFSET = 5;       // Hard Mode starts at Sec 06+ intensity (H01 = eff. Sec 06, full waves & Masters live)
export const HARD_MODE_CHALLENGE_OFFSET = 2;    // Hard Mode H-CH.01 starts at Challenge 3+ (Guarded Masters + Extra Rounds)

// POWER-UP CONSTANTS (Stackable Gauge-based Cyan, Red & Purple Capsules — conserve freely!)
export const CYAN_POWERUP_START_SECTOR = 2;     // Cyan Capsule unlocks at Sector 02 Wave 3/4
export const CYAN_POWERUP_START_WAVE = 3;
export const RED_POWERUP_START_SECTOR = 3;      // Red Capsule unlocks at Sector 03
export const POWERUP_START_SECTOR = 2;          // Earliest sector capsules unlock (Sec 02 Wave 3+)
export const PURPLE_POWERUP_START_SECTOR = 4;   // Purple Boxed Capsule (Arc Wave) starts Sector 04+
export const POWERUP_MAX_ENERGY = 100;          // Full horizontal power-up gauge capacity per slot
export const CYAN_SHOT_ENERGY_COST = 100 / 30;  // 30 conserved Homing Missile volleys per full gauge
export const RED_LASER_DRAIN_PER_SEC = 100 / 12.0; // 12.0s of active firing time (drains ONLY while firing)
export const RED_LASER_TICK_MULT = 20;          // 20x tick rate (~121 ticks/sec) at 0.1 dmg = exact 2.0 dmg/cycle with zero swipe phasing
export const RED_LASER_TICK_DMG = 2.0 / RED_LASER_TICK_MULT;    // 0.1 base dmg per rapid laser tick
export const RED_LASER_RIBBON_CHIP = 1.0 / RED_LASER_TICK_MULT; // 0.05 Ares ribbon chip per rapid tick (exact same ~1s shatter)
export const CAPSULE_DROP_DELAY = 1.0;          // Destroyed enemies drop capsules 1 second later
export const FLOATING_CAPSULE_CHANCE = 0.50;    // 50% chance every standard wave once capsules unlock
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
export const ARC_WAVE_INTERVAL = 0.78;          // Auto-fire spacing when AUTO:ON
export const ARC_WAVE_MANUAL_COOLDOWN = 0.45;   // Manual fire spacing when AUTO:OFF
export const ARC_WAVE_SPEED = 420;              // Upward wave speed
export const PURPLE_FIRE_SPEED_MULT = 1.5;      // Purple bullets shoot 1.5x faster
export const CANNON_SHOT_SPEED = 480;           // AOE Cannon Shot velocity
export const CANNON_AOE_RADIUS = 276;           // Massive 2x AOE blast radius
export const CANNON_AUTO_FIRE_DELAY = 3.0;    // Auto-fires 3s after 1st cannon tap if not double-tapped

// WEAPON & RIBBON CONSTANTS
export const FIRE_COOLDOWN = 0.165;           // ~6 shots/sec uncapped rapid pulse
export const TAP_BUFFER_TIME = 0.12;          // 120ms tap queue
export const PLAYER_BULLET_SPEED = 760;
export const HOMING_MISSILE_SPEED = 540;
export const PLAYER_SPEED = 310;
export const RIBBON_LIFETIME = 4.8;           // Double-length Light Ribbons (4.8s duration & 2x path span)
export const LEGACY_RIBBON_BULLET_SLOW = 9;   // Cyan Light Ribbons slow passing bullets by 9x
export const SLOWED_BULLET_DISSOLVE_TIME = 2.0; // Bullets slowed by cyan ribbons dissolve after 2.0s
export const ARES_RIBBON_HITS = 6;            // Red Light Ribbons take 6 hits to shatter
export const ELITE_SURGE_CHANCE = 0.12;       // 12% chance for +2..4 consecutive Lightwings
export const MASTER_SURGE_CHANCE = 0.22;      // 22% surge chance for Master Recognizers
export const ELITE_SURGE_INTERVAL = 0.36;

// CLASSIC MCP RECOGNIZER TRACTOR BEAM TUNING (Slightly livelier + 80% post-challenge abduction)
export const TRACTOR_INITIAL_DELAY = 7.5;     // Wait before first tractor beam opportunity
export const TRACTOR_INTERVAL = 16.5;         // Cooldown between occasional tractor sweeps
export const TRACTOR_RETRY_DELAY = 10.5;      // Retry delay if beaming boss is destroyed mid-sweep
export const TRACTOR_MAX_PER_SECTOR = 2;      // Cap abduction attempts per sector so it's never spammy
export const TRACTOR_POST_CHALLENGE_CHANCE = 0.80; // 80% chance an existing MCP Recognizer abducts after each Challenge
export const TRACTOR_BEAM_Y = PLAYER_MIN_Y - 58; // Hover cleanly above the bottom 2/5ths player arena
export const TRACTOR_APPROACH_DUR = 1.15;     // Smooth flanking swoop to locked lane (no homing!)
export const TRACTOR_BEAM_DUR = 3.0;          // Active tractor beam cone duration
export const TRACTOR_LIFT_DUR = 1.25;         // Visual lift duration once player is kidnapped
export const TRACTOR_PULL_RADIUS = 48;        // Horizontal cone radius for gentle magnetic pull
export const TRACTOR_CAPTURE_RADIUS = 34;     // Horizontal radius for kidnapping lock

export const COLORS = {
  cyan: '#00f6ff',
  cyanSoft: '#7efaff',
  blue: '#2277ff',
  emerald: '#00ffaa',
  amber: '#ff9900',
  gold: '#ffd447',
  mcpOrange: '#ff5a1f',
  aresRed: '#ff1e42',
  purple: '#c44dff',
  purpleBright: '#ebbdff',
  white: '#ecffff'
};

export const STORAGE_KEYS = {
  hi: 'grid_galaga_1982_hi',
  hiHard: 'grid_galaga_1982_hi_hard',
  auto: 'grid_galaga_1982_auto',
  crt: 'grid_galaga_1982_crt',
  sfx: 'grid_galaga_1982_sfx',
  leaderboard: 'grid_galaga_1982_leaderboard',
  callsign: 'grid_galaga_1982_callsign'
};

export const ARCHIVE_ENTRIES = [
  {
    id: 'PLAYER',
    name: 'LIGHT-FIGHTER',
    badge: 'PLAYER CRAFT',
    badgeClass: 'player',
    cardClass: 'tier-player',
    stats: [
      { text: '2D DODGE ZONE', cls: 'emerald' },
      { text: '~6 SHOTS/SEC', cls: '' },
      { text: 'DUAL RESCUE', cls: 'gold' }
    ],
    desc: 'Your Encom defense craft moves freely across the lower 2/5ths of the Grid for bullet-hell dodging. Drag directly below the ship on touchscreens (or use WASD/Arrows on PC). Rescue a captured fighter from a Classic MCP Recognizer to unlock twin-volley Dual-Fighter firepower.'
  },
  {
    id: 'CAPSULE_CYAN',
    name: 'HOMING MISSILES',
    badge: 'POWER-UP • SEC 02 W3+',
    badgeClass: 'elite-cyan',
    cardClass: 'tier-pwr-cyan',
    stats: [
      { text: '30 VOLLEYS (GAUGE)', cls: 'gold' },
      { text: 'STACKABLE', cls: 'emerald' },
      { text: 'TRACKS CAPSULES', cls: '' },
      { text: '1-HIT ARES RIBBON', cls: '' },
      { text: '1.3x VS ARES REC', cls: 'warn' }
    ],
    desc: 'Cyan power-up (Sector 02 Wave 3+) — shoot the capsule to charge 30 manual volleys of 2x homing missiles that track enemies, lightwings, and floating capsules! Stacks with different power-ups (splitting the bottom gauge and igniting an RGB gradient on your ship). Shatters Ares crimson ribbons in 1 hit and deals 1.3x damage to Elite/Master Ares Recognizers.'
  },
  {
    id: 'CAPSULE_RED',
    name: 'CONTINUOUS LASER',
    badge: 'POWER-UP • SEC 03+',
    badgeClass: 'elite-red',
    cardClass: 'tier-pwr-red',
    stats: [
      { text: 'PIERCING LASER', cls: 'warn' },
      { text: '12s ACTIVE FIRE', cls: 'gold' },
      { text: 'STACKABLE', cls: 'emerald' },
      { text: '2x DMG / FIGHTER', cls: '' },
      { text: '1.3x VS LEGACY REC', cls: '' }
    ],
    desc: 'Red power-up (Sector 03+) — shoot the capsule to charge 12s of active high-frequency nose-locked laser firing (drains ONLY while firing, 0.1 dmg @ 20x tick rate so fast swipes never miss). Pierces straight through enemy ships (blocked only by Red ribbons; converts into slowed dissolving red bolts through Cyan ribbons) and deals 1.3x damage to Legacy Recognizers.'
  },
  {
    id: 'CAPSULE_PURPLE',
    name: 'ARC WAVE',
    badge: 'POWER-UP • SEC 04+',
    badgeClass: 'deploy',
    cardClass: 'tier-pwr-purple',
    stats: [
      { text: '6 WIDE WAVES', cls: '' },
      { text: 'STACKABLE', cls: 'emerald' },
      { text: 'VOIDS BULLETS', cls: 'gold' },
      { text: '2x AOE CANNON', cls: 'warn' }
    ],
    desc: 'Purple power-up (Sector 04+) — shoot the capsule to charge 6 wide Arc Waves that void enemy shots! After the 6th wave, double-tap Fire to unleash a massive 2x-radius AOE Cannon Shot (Tap 1 supercharges with violent vibration; Tap 2 fires, or auto-fires after 3s).'
  },
  {
    id: 'DRONE',
    name: 'BIT-DRONE',
    badge: 'STANDARD',
    badgeClass: 'basic',
    cardClass: 'tier-basic',
    stats: [
      { text: 'HP: 1', cls: '' },
      { text: 'PTS: 50 / 100', cls: 'gold' },
      { text: 'DROP: 0.1%', cls: '' }
    ],
    desc: 'Geometric lower-rank scouts that swarm in sweeping dives. Fragile in combat, with a rare 0.1% capsule drop chance starting in Sector 02 Wave 3.'
  },
  {
    id: 'INTERCEPTOR',
    name: 'GRID-INTERCEPTOR',
    badge: 'STANDARD',
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
    id: 'CLASSIC_REC',
    name: 'MCP RECOGNIZER [1982]',
    badge: 'COMMANDER',
    badgeClass: 'commander',
    cardClass: 'tier-commander',
    stats: [
      { text: 'HP: 2', cls: '' },
      { text: 'PTS: 150 / 400', cls: 'gold' },
      { text: 'TRACTOR BEAM', cls: 'emerald' },
      { text: 'DROP: 1%', cls: '' }
    ],
    desc: 'Classic 1982 arch ship. Turns cyan-damaged at 1 HP. Deploys a Tractor Beam to capture your fighter—destroy the Recognizer without hitting your captured ship to earn Dual-Fighter.'
  },
  {
    id: 'LEGACY_REC',
    name: 'ELITE LEGACY RECOGNIZER',
    badge: 'ELITE • SEC 02 W3+',
    badgeClass: 'elite-cyan',
    cardClass: 'tier-legacy',
    stats: [
      { text: 'HP: 6 (12 IN CH.2+)', cls: '' },
      { text: '1.3x SCALE', cls: '' },
      { text: 'DROP: 10%C / 2%R / 2%P', cls: 'gold' },
      { text: '9x SLOW + DISSOLVE', cls: 'warn' }
    ],
    desc: 'Deploys starting at Sector 02 Wave 3. Takes 6 hits to destroy and dives slower than standard ships. Launches curved cyan Lightwings (12% surge) whose double-length ribbons slow your ship 4s, slow passing bullets 9x (dissolving after 2s), and turn Red Lasers into slowed dissolving bolts.'
  },
  {
    id: 'ARES_REC',
    name: 'ELITE ARES RECOGNIZER',
    badge: 'ELITE • SEC 03+',
    badgeClass: 'elite-red',
    cardClass: 'tier-ares',
    stats: [
      { text: 'HP: 6 (12 IN CH.2+)', cls: '' },
      { text: '1.3x SCALE', cls: '' },
      { text: 'DROP: 10%R / 2%C / 2%P', cls: 'gold' },
      { text: '6-HIT RIBBON WALL', cls: 'warn' }
    ],
    desc: 'Deploys starting at Sector 03. Takes 6 hits to destroy and dives slower than standard ships. Launches 90° grid crimson Lightwings (12% surge) whose ribbons BLOCK shots (6 hits to break) and inflict 1s Slow + 4s -20% DMG. In Challenge 2+, raids independently with 2x HP (12) and fires twin Lightwings.'
  },
  {
    id: 'MASTER_LEGACY_REC',
    name: 'MASTER LEGACY RECOGNIZER',
    badge: 'MASTER • SEC 06+',
    badgeClass: 'elite-cyan',
    cardClass: 'tier-legacy',
    stats: [
      { text: 'HP: 15', cls: 'warn' },
      { text: 'CYAN AURA', cls: '' },
      { text: 'DROP: 50%C / 10%R / 30%P', cls: 'gold' },
      { text: '22% SURGE', cls: 'emerald' }
    ],
    desc: 'Master-tier Legacy dreadnought ringed in a radiant cyan aura (Sector 06+ alongside Elites, and guarded by escort formations in Challenge 3+ / Hard Mode). Heavy slow dives with independent multi-capsule drop rolls.'
  },
  {
    id: 'MASTER_ARES_REC',
    name: 'MASTER ARES RECOGNIZER',
    badge: 'MASTER • SEC 06+',
    badgeClass: 'elite-red',
    cardClass: 'tier-ares',
    stats: [
      { text: 'HP: 15', cls: 'warn' },
      { text: 'CRIMSON AURA', cls: '' },
      { text: 'DROP: 50%R / 10%C / 30%P', cls: 'gold' },
      { text: '22% SURGE', cls: 'emerald' }
    ],
    desc: 'Master-tier Ares warframe blazing with a crimson-red aura (Sector 06+ alongside Elites, and guarded by escort formations in Challenge 3+ / Hard Mode). Heavy slow dives with independent multi-capsule drop rolls.'
  },
  {
    id: 'LIGHTWING',
    name: 'LIGHTWINGS (LEGACY / ARES)',
    badge: 'DEPLOYABLE',
    badgeClass: 'deploy',
    cardClass: 'tier-deploy',
    stats: [
      { text: 'HP: 1', cls: '' },
      { text: 'PTS: 150', cls: 'gold' },
      { text: 'RIBBON ~4.8s (2x)', cls: 'warn' }
    ],
    desc: 'High-speed drones launched by Elite & Master Recognizers. Legacy wings carve double-length curved cyan ribbons; Ares wings snap along extended 90° crimson grid corridors.'
  }
];
