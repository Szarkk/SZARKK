/* =========================================================================
   CONSTANTS, LOGICAL PLAYFIELD, COMBAT TUNING & GRID ARCHIVE CATALOG
   ========================================================================= */

export const GAME_VERSION = 'Alpha Test 0.1.0';
export const LOGICAL_W = 480;
export const LOGICAL_H = 640;

export const ELITE_START_SECTOR = 3;          // Elite Recognizers start showing up at Sector 03
export const CHALLENGE_INTERVAL = 4;          // Challenge 1 = Sec 04, Challenge 2 = Sec 08, Challenge 3 = Sec 12
export const CHALLENGE_ELITE_START = 3;       // Starting at Challenge 3, 2x HP Elite Raiders spawn independently

// POWER-UP CONSTANTS (Cyan, Red & Purple Capsules)
export const POWERUP_START_SECTOR = 5;        // No power-ups in Sectors 01-04; Cyan/Red Capsules start Sector 05+
export const PURPLE_POWERUP_START_SECTOR = 7; // Purple Boxed Capsule (Arc Wave) starts Sector 07+
export const POWERUP_DURATION = 6.0;          // 6 seconds for Homing Missiles & Continuous Lasers
export const CAPSULE_DROP_DELAY = 1.0;        // Destroyed enemies drop capsules 1 second later
export const FLOATING_CAPSULE_CHANCE = 0.50;  // 50% chance per sector from Sector 05+

// Mid-arena playfield bounds where power-up capsules float and are shot to activate
export const CAPSULE_BOUNDS = {
  minX: 62,
  maxX: LOGICAL_W - 62,
  minY: 232,
  maxY: 412
};

// PURPLE ARC WAVE CONSTANTS
export const ARC_WAVE_MAX = 3;                // Maximum of 3 consecutive auto-fired waves
export const ARC_WAVE_INTERVAL = 0.78;        // Seconds between consecutive auto-fired waves
export const ARC_WAVE_SPEED = 420;            // Upward wave speed
export const PURPLE_FIRE_SPEED_MULT = 1.5;    // Purple bullets shoot 1.5x faster
export const CANNON_SHOT_SPEED = 480;         // AOE Cannon Shot velocity
export const CANNON_AOE_RADIUS = 138;         // Large AOE blast radius

// WEAPON & RIBBON CONSTANTS
export const FIRE_COOLDOWN = 0.165;           // ~6 shots/sec uncapped rapid pulse
export const TAP_BUFFER_TIME = 0.12;          // 120ms tap queue
export const PLAYER_BULLET_SPEED = 760;
export const HOMING_MISSILE_SPEED = 540;
export const PLAYER_SPEED = 310;
export const RIBBON_LIFETIME = 2.4;
export const ARES_RIBBON_HITS = 3;
export const ELITE_SURGE_CHANCE = 0.10;       // 10% chance for +2..4 consecutive Lightwings
export const ELITE_SURGE_INTERVAL = 0.38;

// CLASSIC MCP RECOGNIZER TRACTOR BEAM TUNING
export const TRACTOR_INITIAL_DELAY = 3.2;     // First tractor opportunity shortly after combat starts
export const TRACTOR_INTERVAL = 6.5;          // Interval between Classic MCP Recognizer tractor sweeps
export const TRACTOR_RETRY_DELAY = 4.0;       // Retry delay if beaming boss is destroyed mid-sweep
export const TRACTOR_APPROACH_DUR = 1.15;     // Smooth flanking swoop duration
export const TRACTOR_BEAM_DUR = 3.0;          // Active tractor beam cone duration
export const TRACTOR_LIFT_DUR = 1.25;         // Visual lift duration once player is kidnapped
export const TRACTOR_PULL_RADIUS = 58;        // Horizontal cone radius for gentle magnetic pull
export const TRACTOR_CAPTURE_RADIUS = 42;     // Horizontal radius for kidnapping lock

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
  ctrl: 'grid_galaga_1982_ctrl',
  auto: 'grid_galaga_1982_auto',
  crt: 'grid_galaga_1982_crt',
  sfx: 'grid_galaga_1982_sfx'
};

export const ARCHIVE_ENTRIES = [
  {
    id: 'PLAYER',
    name: 'LIGHT-FIGHTER',
    badge: 'PLAYER CRAFT',
    badgeClass: 'player',
    cardClass: 'tier-player',
    stats: [
      { text: 'UNCAPPED CANNON', cls: 'emerald' },
      { text: '~6 SHOTS/SEC', cls: '' },
      { text: 'DUAL RESCUE', cls: 'gold' }
    ],
    desc: 'Your Encom defense craft equipped with an uncapped rapid-pulse cannon. Rescue a captured fighter from a Classic MCP Recognizer to unlock twin-volley Dual-Fighter firepower.'
  },
  {
    id: 'CAPSULE_CYAN',
    name: 'CYAN BOXED CAPSULE',
    badge: 'POWER-UP • SEC 05+',
    badgeClass: 'elite-cyan',
    cardClass: 'tier-pwr-cyan',
    stats: [
      { text: 'HOMING MISSILES', cls: '' },
      { text: '6s DURATION', cls: 'gold' },
      { text: '2x SHOTS', cls: 'emerald' },
      { text: '1-HIT ARES RIBBON', cls: '' },
      { text: '1.3x VS ARES REC', cls: 'warn' }
    ],
    desc: 'Square pixelated capsule (Sector 05+) that floats randomly in the mid-arena—shoot it to activate! Replaces regular bullets for 6s with 2x homing missiles that lock onto different enemies, shatter Ares crimson ribbons in 1 hit, and deal 1.3x damage to Ares Recognizers.'
  },
  {
    id: 'CAPSULE_RED',
    name: 'RED BOXED CAPSULE',
    badge: 'POWER-UP • SEC 05+',
    badgeClass: 'elite-red',
    cardClass: 'tier-pwr-red',
    stats: [
      { text: 'CONTINUOUS LASER', cls: 'warn' },
      { text: '6s DURATION', cls: 'gold' },
      { text: '2x DAMAGE', cls: 'emerald' },
      { text: 'BREAKS LEGACY RIBBON', cls: '' },
      { text: '1.3x VS LEGACY REC', cls: '' }
    ],
    desc: 'Square pixelated capsule (Sector 05+) that floats randomly in the mid-arena—shoot it to activate! Replaces regular bullets for 6s with a true continuous laser beam locked to your nose dealing 2x damage at regular hitspeed, shattering Legacy cyan ribbons, and dealing 1.3x damage to Legacy Recognizers.'
  },
  {
    id: 'CAPSULE_PURPLE',
    name: 'PURPLE BOXED CAPSULE',
    badge: 'POWER-UP • SEC 07+',
    badgeClass: 'deploy',
    cardClass: 'tier-pwr-purple',
    stats: [
      { text: 'ARC WAVE (3 MAX)', cls: '' },
      { text: '1.5x PURPLE SHOTS', cls: 'emerald' },
      { text: 'VOIDS BULLETS', cls: 'gold' },
      { text: 'NO-SHOT AOE CANNON', cls: 'warn' }
    ],
    desc: 'Square pixelated capsule (Sector 07+) that floats randomly in the mid-arena—shoot it to activate! Press Fire once to trigger up to 3 automatic Arc Waves that void enemy shots and deal regular damage. Shooting after triggering fires 1.5x faster temporary purple bullets; letting all 3 waves fire without shooting ignites a Purple Aura and unleashes a large AOE Cannon Shot.'
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
    desc: 'Geometric lower-rank scouts that swarm in sweeping dives. Fragile in combat, with a rare 0.1% capsule drop chance starting in Sector 05.'
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
    badge: 'ELITE • SEC 03+',
    badgeClass: 'elite-cyan',
    cardClass: 'tier-legacy',
    stats: [
      { text: 'HP: 3 (6 IN CH.3+)', cls: '' },
      { text: '1.3x SCALE', cls: '' },
      { text: 'DROP: 10%C / 2%R / 2%P', cls: 'gold' },
      { text: '10% SURGE (+2-4)', cls: 'warn' }
    ],
    desc: 'Deploys starting at Sector 03. Launches curved cyan Lightwings (10% chance for +2-4 surge) whose ribbons slow your ship 4s and slow passing lasers 2x. In Challenge 3+, raids independently with 2x HP and fires an initial pair of Lightwings at once.'
  },
  {
    id: 'ARES_REC',
    name: 'ELITE ARES RECOGNIZER',
    badge: 'ELITE • SEC 03+',
    badgeClass: 'elite-red',
    cardClass: 'tier-ares',
    stats: [
      { text: 'HP: 3 (6 IN CH.3+)', cls: '' },
      { text: '1.3x SCALE', cls: '' },
      { text: 'DROP: 10%R / 2%C / 2%P', cls: 'gold' },
      { text: '10% SURGE (+2-4)', cls: 'warn' }
    ],
    desc: 'Deploys starting at Sector 03. Launches 90° grid crimson Lightwings (10% surge) whose ribbons BLOCK shots (3 hits to break) and inflict 1s Slow + 4s -20% DMG. In Challenge 3+, raids independently with 2x HP and fires an initial pair of Lightwings at once.'
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
      { text: 'RIBBON ~2.4s', cls: 'warn' }
    ],
    desc: 'High-speed drones launched by Elite Recognizers. Legacy wings carve curved cyan ribbons; Ares wings snap along 90° crimson grid corridors.'
  }
];
