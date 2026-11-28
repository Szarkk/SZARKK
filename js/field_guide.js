/* =========================================================================
   SZARKK — DATA-DRIVEN FIELD GUIDE (GAME RULES, MATCHUPS & SECRETS)
   Zero overlap with the ARCHIVE bestiary (which owns individual unit &
   capsule sprites/stats). Pulls live numbers & unlocks directly from code.
   To document a new mechanic, rule, or mode, add one entry below.
   ========================================================================= */

import {
  CENTOID_MAX_SPLITS,
  CHALLENGE_CENTOID_TIME_LIMIT,
  CHALLENGE_ELITE_START,
  CHALLENGE_EXTRA_ROUND_START,
  CHALLENGE_INTERVAL,
  CHALLENGE_MASTER_START,
  COST_SWAP_CHANCE,
  ELITE_ABDUCTION_CHANCE,
  FLOATING_CAPSULE_CHANCE,
  FLUX_THREAD_BULLET_SLOW,
  HARD_FIELD_DEBUFF_CHANCE,
  HARD_FIELD_DEBUFF_DUR,
  HARD_MODE_CHALLENGE_OFFSET,
  HARD_MODE_MAX_UNLOCK_SECTOR,
  HARD_MODE_SECTOR_OFFSET,
  MASTER_STREAK_REWARD_COUNT,
  NULL_FIELD_DMG_MULT,
  NULL_THREAD_HITS,
  STANDARD_WAVES_PER_SECTOR,
  TRACTOR_POST_CHALLENGE_CHANCE
} from './config.js';
import { EXTRA_ROUND_MODES } from './enemies.js';

const sec = (n) => `SEC ${String(n).padStart(2, '0')}`;
const pct = (v) => `${Math.round(v * 100)}%`;

const CLASSIC_EXTRA_NAMES = EXTRA_ROUND_MODES
  .filter(m => (m.minEffChallenge || 2) <= 2)
  .map(m => m.title.replace(/\s*\[.*?\]/g, ''))
  .join(', ');
const SPECIALIST_EXTRA_NAMES = EXTRA_ROUND_MODES
  .filter(m => (m.minEffChallenge || 2) >= 3)
  .map(m => m.title.replace(/\s*\[.*?\]/g, ''))
  .join(', ');

export const FIELD_GUIDE_SECTIONS = [
  { id: 'controls', label: 'CONTROLS', title: 'CONTROLS', kicker: 'MOVEMENT, FIRE & SHORTCUTS', accent: 'cyan' },
  { id: 'rules', label: 'MATCHUPS', title: 'MATCHUPS & RULES', kicker: 'STACKING, COUNTERS & TIPS', accent: 'emerald' },
  { id: 'challenges', label: 'CHALLENGES', title: 'CHALLENGES & EXTRA ROUNDS', kicker: 'DATA STREAMS & BONUS MODES', accent: 'purple' },
  { id: 'hidden', label: 'HIDDEN', title: 'HIDDEN MECHANICS', kicker: 'BONUSES, STREAKS & RESERVES', accent: 'gold' },
  { id: 'hardmode', label: 'HARD MODE', title: 'HARD MODE', kicker: 'FULL ROSTER & FIELD DEBUFFS', accent: 'red' }
];

export const FIELD_GUIDE_ENTRIES = [
  // =========================================================================
  // CONTROLS
  // =========================================================================
  {
    section: 'controls',
    name: '2D DODGE ZONE',
    tag: 'LOWER 2/5 ARENA',
    accent: 'cyan',
    lines: [
      'Move freely anywhere below the dotted line to weave around bullets and threads.',
      'On touchscreens, drag anywhere below the line—no need to touch the ship directly.'
    ]
  },
  {
    section: 'controls',
    name: 'DESKTOP CONTROLS',
    tag: 'KEYBOARD + MOUSE',
    accent: 'cyan',
    lines: [
      'WASD / Arrows move, Space / Z / Click fires, F toggles Auto-Fire, and E activates a Ready capsule.',
      'Press P or Esc to pause, M to mute SFX, and aim Plasma Rings with your mouse cursor.'
    ]
  },
  {
    section: 'controls',
    name: 'TOUCH & AUTO-FIRE',
    tag: 'MOBILE READY',
    accent: 'emerald',
    lines: [
      'Steer with one thumb below the dotted line and tap or hold FIRE with your other thumb.',
      'Turn Auto-Fire OFF to conserve shots on limited-ammo power-ups, or ON for continuous fire.'
    ]
  },

  // =========================================================================
  // MATCHUPS & RULES (NO UNIT/CAPSULE DUPLICATION — SEE ARCHIVE FOR SPRITES)
  // =========================================================================
  {
    section: 'rules',
    name: 'CAPSULE STACKING & REFILLS',
    tag: 'POWER-UP RULE',
    accent: 'emerald',
    lines: [
      'Shoot floating or dropped capsules to activate them—different power-ups stack at the same time.',
      'Shooting a capsule you already have active refills its gauge back to 100%.'
    ]
  },
  {
    section: 'rules',
    name: 'FLUX VS. NULL COUNTERS',
    tag: '1.3x MATCHUPS',
    accent: 'cyan',
    lines: [
      `Homing Missiles shatter crimson Null Threads (${NULL_THREAD_HITS}-hit walls) in 1 hit and deal 1.3x to Null Enforcers.`,
      `Continuous Laser deals 1.3x to Flux Enforcers and 2x vs Normal ships, but Flux Threads slow shots ${FLUX_THREAD_BULLET_SLOW}x.`
    ]
  },
  {
    section: 'rules',
    name: 'SERPENT HEADSHOTS & SPLITS',
    tag: `MAX ${CENTOID_MAX_SPLITS} SNAKES`,
    accent: 'plasma',
    lines: [
      `Destroying a Centoid, Super Centoid, or Centophage head erases its entire chain at once without splitting.`,
      `Body hits split serpents (capped at ${CENTOID_MAX_SPLITS} living chains); Centophages devour nearby non-Centoids to grow longer.`
    ]
  },
  {
    section: 'rules',
    name: 'TRACTOR BEAM & DUAL FIGHTER',
    tag: 'TWIN FIREPOWER',
    accent: 'amber',
    lines: [
      `V1 Enforcers—and Elites (${pct(ELITE_ABDUCTION_CHANCE)} roll/wave)—can abduct your fighter with a Tractor Beam.`,
      'Destroy the capturing Enforcer to rescue your ship and lock in Dual-Fighter twin volleys.'
    ]
  },

  // =========================================================================
  // CHALLENGES & EXTRA ROUNDS
  // =========================================================================
  {
    section: 'challenges',
    name: 'DATA STREAM CADENCE',
    tag: `EVERY ${CHALLENGE_INTERVAL} SECTORS`,
    accent: 'gold',
    lines: [
      `Every ${CHALLENGE_INTERVAL} standard sectors (${STANDARD_WAVES_PER_SECTOR} waves each) unlocks a bonus Data Stream challenge (+10,000 pts for 100%).`,
      'No mid-wave floating capsules appear in challenges—capsules come from enemy drops and clear bonuses.'
    ]
  },
  {
    section: 'challenges',
    name: 'CHALLENGE ESCALATION',
    tag: `CH.0${CHALLENGE_ELITE_START} → CH.04+`,
    accent: 'purple',
    lines: [
      `CH.0${CHALLENGE_ELITE_START}+ adds 2x-HP Elite Raiders and ${CHALLENGE_EXTRA_ROUND_START} Extra Rounds; CH.0${CHALLENGE_MASTER_START}+ adds guarded Master Enforcers.`,
      'CH.04+ (and Hard H-CH.02+) escalates to 3 guarded Masters plus 3 Extra Rounds with Master escorts.'
    ]
  },
  {
    section: 'challenges',
    name: 'CLASSIC EXTRA ROUNDS',
    tag: `CH.0${CHALLENGE_EXTRA_ROUND_START}+`,
    accent: 'cyan',
    lines: [
      `${CLASSIC_EXTRA_NAMES}.`,
      'Test any standard challenge or individual extra round anytime in Training / Sandbox.'
    ]
  },
  {
    section: 'challenges',
    name: 'SPECIALIST EXTRA ROUNDS',
    tag: 'CH.03–04+',
    accent: 'plasma',
    lines: [
      `${SPECIALIST_EXTRA_NAMES}.`,
      `Feature Pulsars, Centoids, Super Centoids, and Master Centophage arenas (serpents escape after ${CHALLENGE_CENTOID_TIME_LIMIT}s).`
    ]
  },

  // =========================================================================
  // HIDDEN MECHANICS
  // =========================================================================
  {
    section: 'hidden',
    name: 'MASTER 10-KILL STREAK',
    tag: `${MASTER_STREAK_REWARD_COUNT} KILLS / 0 DEATHS`,
    accent: 'gold',
    lines: [
      `Destroy ${MASTER_STREAK_REWARD_COUNT} Master Flux (or ${MASTER_STREAK_REWARD_COUNT} Master Null) without dying to spawn a glowing Cyan (or Red) reward capsule.`,
      'Dying resets both streaks; collecting the glowing capsule starts the next streak.'
    ]
  },
  {
    section: 'hidden',
    name: 'CHALLENGE CAPSULE REWARDS',
    tag: 'END-OF-ROUND BONUS',
    accent: 'emerald',
    lines: [
      'Regular round: >50% kills = 75% chance for 1 capsule (100% = guaranteed 1). Combined Extra Rounds: >75% = 1 capsule, 100% = 2.',
      'MASTER RULE: If any Master spawns, you must kill at least 1 Master or the kill-% capsule bonus is voided.'
    ]
  },
  {
    section: 'hidden',
    name: '1UP READY RESERVES',
    tag: 'ON-DEMAND BUTTON',
    accent: 'cyan',
    lines: [
      'Earn an extra life (20,000 pts, then every 35,000) while Dual Fighter is active—or at 4+ lives single—to bank a random unlocked capsule.',
      'Stored capsules appear as buttons in the gauge bar (duplicates stack x2, x3) to trigger whenever you want (tap or press E).'
    ]
  },
  {
    section: 'hidden',
    name: 'V1 ENFORCER SYNERGY',
    tag: '1 HP LINK BUFF',
    accent: 'amber',
    lines: [
      'Dropping a V1 Enforcer to 1 HP near a Flux or Null Enforcer links its hull color.',
      'When it dies, nearby enemies gain a non-stacking +30% speed (Cyan) or +33% HP (Red) pulse.'
    ]
  },
  {
    section: 'hidden',
    name: 'WAVE SWAPS & ABDUCTIONS',
    tag: 'DYNAMIC FLEETS',
    accent: 'purple',
    lines: [
      `Each wave rolls a ${pct(COST_SWAP_CHANCE)} cost-based ±1 tier unit swap and a ${pct(FLOATING_CAPSULE_CHANCE)} floating capsule chance once unlocked.`,
      `Right after clearing a Challenge, an existing V1 Enforcer has an ${pct(TRACTOR_POST_CHALLENGE_CHANCE)} chance to attempt abduction.`
    ]
  },

  // =========================================================================
  // HARD MODE
  // =========================================================================
  {
    section: 'hardmode',
    name: 'ROUND 1 LIGHT PRISM',
    tag: 'FREE STARTER CAPSULE',
    accent: 'cyan',
    lines: [
      'Every Hard Mode run opens with a Light Prism button that glitches or dissolves into 1 free random unlocked capsule right before H01 begins.',
      'Triggers on demand whenever you want (tap the capsule button or press E).'
    ]
  },
  {
    section: 'hardmode',
    name: 'FULL ROSTER FROM H01',
    tag: `${sec(1 + HARD_MODE_SECTOR_OFFSET)}+ INTENSITY`,
    accent: 'red',
    lines: [
      `Hard Mode starts at ${sec(1 + HARD_MODE_SECTOR_OFFSET)} pacing with all enemies and capsules through ${sec(HARD_MODE_MAX_UNLOCK_SECTOR)} unlocked immediately.`,
      `Hard Challenges start at CH.0${1 + HARD_MODE_CHALLENGE_OFFSET} difficulty with guarded Masters and Extra Rounds.`
    ]
  },
  {
    section: 'hardmode',
    name: 'ROUND 1 MASTER BONUS',
    tag: 'H01 OPENER ONLY',
    accent: 'gold',
    lines: [
      'Your first Master kill in Hard Mode Sector 1 (H01) guarantees 1 random unlocked capsule floats into the arena.',
      'Triggers once per run on Round 1 to give every Hard run an early tactical spike.'
    ]
  },
  {
    section: 'hardmode',
    name: 'FLUX & NULL FIELD DEBUFFS',
    tag: `${pct(HARD_FIELD_DEBUFF_CHANCE)} ON RE-ENTRY`,
    accent: 'red',
    lines: [
      `Surviving Elite or Master Enforcers returning from a dive have a ${pct(HARD_FIELD_DEBUFF_CHANCE)} chance to activate a ${HARD_FIELD_DEBUFF_DUR}s arena field.`,
      `Flux Field slows move & fire rate 1.5x; Null Field reduces outgoing damage to ${NULL_FIELD_DMG_MULT}x (does not stack with thread debuffs).`
    ]
  }
];
