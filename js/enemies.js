/* =========================================================================
   ENEMY SPAWNING, SECTORS, CHALLENGE STAGES & UNPREDICTABLE FORMATION / DIVE AI
   ========================================================================= */

import {
  CHALLENGE_ELITE_START,
  CHALLENGE_EXTRA_ROUND_START,
  CHALLENGE_INTERVAL,
  CHALLENGE_MASTER_START,
  COLORS,
  ELITE_REC_HP,
  ELITE_START_SECTOR,
  ELITE_SURGE_INTERVAL,
  FLOATING_CAPSULE_CHANCE,
  LOGICAL_H,
  LOGICAL_W,
  MASTER_REC_HP,
  MASTER_START_SECTOR,
  POWERUP_START_SECTOR,
  TRACTOR_INITIAL_DELAY,
  TRACTOR_INTERVAL,
  TRACTOR_MAX_PER_SECTOR,
  TRACTOR_POST_CHALLENGE_CHANCE
} from './config.js';
import { clamp, evalCubic, lerp } from './utils.js';
import { rollEnemyCapsuleDrop } from './powerups.js';
import {
  handleRecognizerDestroyed,
  spawnLightwing,
  startRecognizerBeam,
  updateCapturedFighterTether,
  updateRecognizerBeamApproach,
  updateRecognizerBeaming
} from './recognizers.js';

const FORMATION_STYLES = ['PHALANX', 'CHEVRON', 'TWIN_FLANKS', 'DIAMOND', 'ARCH'];
const ENTRY_PATTERNS = ['CROSS', 'SPIRAL', 'TOP_DROP', 'PINCER'];
const SWAY_MODES = ['SWAY', 'FIGURE8', 'COUNTER_ROW', 'ACCORDION'];

const EXTRA_ROUND_MODES = [
  { id: 'DIAMOND_VORTEX', title: 'ORBITAL DIAMOND VORTEX', color: COLORS.cyan },
  { id: 'TWIN_PINCER', title: 'TWIN PINCER SPEARHEAD', color: COLORS.amber },
  { id: 'HELIX_BARRAGE', title: 'DOUBLE HELIX BARRAGE', color: COLORS.purpleBright },
  { id: 'PHALANX_ASSAULT', title: 'IRON PHALANX ASSAULT', color: COLORS.aresRed }
];

function pickDifferent(pool, avoid) {
  const choices = pool.filter(v => v !== avoid);
  return choices[Math.floor(Math.random() * choices.length)] || pool[0];
}

function fireAimedBullet(game, x, y, speed, color, angleOffset = 0, leadFactor = 0) {
  const p = game.player;
  if (!p.alive) return;
  let targetX = p.x;
  if (leadFactor > 0) {
    // Predict player lateral movement slightly for sharper pressure
    let playerDir = 0;
    if (game.keys.has('ArrowLeft') || game.keys.has('KeyA')) playerDir -= 1;
    if (game.keys.has('ArrowRight') || game.keys.has('KeyD')) playerDir += 1;
    targetX = clamp(p.x + playerDir * 72 * leadFactor, 26, LOGICAL_W - 26);
  }
  const baseAngle = Math.atan2(p.y - y, targetX - x) + angleOffset;
  game.enemyBullets.push({
    x,
    y,
    vx: Math.cos(baseAngle) * speed,
    vy: Math.sin(baseAngle) * speed,
    color
  });
}

function fireDirectedBullet(game, x, y, angle, speed, color) {
  game.enemyBullets.push({
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    color
  });
}

export function beginSector(game, num) {
  game.sector = num;
  const effSec = game.getEffectiveSector ? game.getEffectiveSector() : num;
  game.enemies = [];
  game.enemyBullets = [];
  game.lightwings = [];
  game.ribbonTrails = [];
  game.capsules = [];
  game.pendingCapsuleDrops = [];
  game.activeBeamBoss = null;
  game.sectorTractorCount = 0;
  game.tractorTimer = TRACTOR_INITIAL_DELAY + Math.random() * 4.0;
  game.redLaserActive = false;
  game.redLaserPulseTimer = 0;
  game.activeLaserBeams = [];
  game.synth.stopTractorBeam();
  game.waveQueue = [];
  game.formationClock = 0;

  // Starting at effective Sector 05, 66% chance per sector for a floating capsule
  if (effSec >= POWERUP_START_SECTOR && Math.random() < FLOATING_CAPSULE_CHANCE) {
    game.floatingCapsulePlan = {
      timer: 4.5 + Math.random() * 5.0,
      spawned: false
    };
  } else {
    game.floatingCapsulePlan = null;
  }

  const isChallenge = num % CHALLENGE_INTERVAL === 0;
  game.postChallengeAbductionPending = false;
  if (!isChallenge && game.justFinishedChallenge) {
    game.justFinishedChallenge = false;
    // After each Challenge stage, an existing Classic MCP Recognizer has an 80% chance to abduct
    if (Math.random() < TRACTOR_POST_CHALLENGE_CHANCE) {
      game.postChallengeAbductionPending = true;
    }
  }
  game.challengeNum = isChallenge ? Math.floor(num / CHALLENGE_INTERVAL) : 0;
  const effChallenge = isChallenge
    ? (game.getEffectiveChallengeNum ? game.getEffectiveChallengeNum() : game.challengeNum)
    : 0;
  game.challengeSubRound = 0;
  game.challengeExtraRounds = !isChallenge
    ? 0
    : (effChallenge >= 7 ? 3 : (effChallenge >= CHALLENGE_EXTRA_ROUND_START ? 2 : 0));
  game.sectorPhase = 'BANNER';
  game.phaseTimer = 1.9;

  if (isChallenge) {
    game.challengeHits = 0;
    game.bannerTitle = game.hardMode
      ? `HARD STREAM // H-CH.${String(game.challengeNum).padStart(2, '0')}`
      : `DATA STREAM // CH.${String(game.challengeNum).padStart(2, '0')}`;
    game.bannerSub = effChallenge >= 7
      ? 'OVERDRIVE: 3 GUARDED MASTERS + 3 EXTRA ROUNDS'
      : (effChallenge >= CHALLENGE_MASTER_START
        ? 'CRITICAL: GUARDED MASTER RECOGNIZERS + 2 EXTRA ROUNDS'
        : (effChallenge >= CHALLENGE_EXTRA_ROUND_START
          ? 'GAUNTLET ALERT: MASTER RAIDERS + 2 EXTRA ROUNDS'
          : (effChallenge >= CHALLENGE_ELITE_START
            ? 'ALERT: ELITE & MASTER RECOGNIZER RAIDERS'
            : `CHALLENGING SECTOR ${String(num).padStart(2, '0')} // BONUS WAVE`)));
    game.bannerColor = effChallenge >= CHALLENGE_MASTER_START
      ? COLORS.aresRed
      : (effChallenge >= CHALLENGE_EXTRA_ROUND_START
        ? COLORS.purpleBright
        : (effChallenge >= CHALLENGE_ELITE_START ? COLORS.aresRed : COLORS.gold));
    buildChallengeWaveQueue(game, effChallenge);
  } else {
    game.formationStyle = pickDifferent(FORMATION_STYLES, game.lastFormationStyle);
    game.lastFormationStyle = game.formationStyle;
    game.swayMode = SWAY_MODES[Math.floor(Math.random() * SWAY_MODES.length)];

    game.bannerTitle = game.hardMode
      ? `HARD // SECTOR ${String(num).padStart(2, '0')}`
      : `SECTOR ${String(num).padStart(2, '0')}`;
    game.bannerSub = game.hardMode
      ? (num === 1
        ? 'SEC 21+ INTENSITY // ALL CAPSULES & MASTERS LIVE'
        : `MASTER FLEET // ${game.formationStyle.replace('_', ' ')}`)
      : (effSec < ELITE_START_SECTOR
        ? (num === 1 ? 'CLASSIC MCP PATROL INBOUND' : 'MCP SQUADRON INTENSIFYING')
        : (effSec === 3
          ? 'WARNING: ELITE LEGACY RECOGNIZER DETECTED'
          : (effSec === 5
            ? 'ARES ELITE & POWER CAPSULES ONLINE'
            : (effSec === 7
              ? 'PURPLE ARC WAVE CAPSULES ONLINE'
              : (effSec === MASTER_START_SECTOR + 1
                ? 'WARNING: MASTER RECOGNIZERS ONLINE'
                : (effSec >= MASTER_START_SECTOR
                  ? `MASTER FLEET // ${game.formationStyle.replace('_', ' ')}`
                  : `FLEET FORMATION: ${game.formationStyle.replace('_', ' ')}`))))));
    game.bannerColor = (game.hardMode || effSec >= MASTER_START_SECTOR)
      ? COLORS.aresRed
      : (effSec === 5 ? COLORS.aresRed : (effSec === 7 ? COLORS.purple : COLORS.cyan));
    buildStandardWaveQueue(game, effSec);
  }

  game.synth.playSectorStart(isChallenge);
  game.updateHUD();
}

export function buildTopRowConfig(sec) {
  if (sec < ELITE_START_SECTOR) {
    return {
      types: ['CLASSIC_REC', 'CLASSIC_REC', 'CLASSIC_REC', 'CLASSIC_REC'],
      xs: [96, 192, 288, 384]
    };
  }
  if (sec === 3) {
    return {
      types: ['CLASSIC_REC', 'LEGACY_REC', 'CLASSIC_REC', 'CLASSIC_REC'],
      xs: [96, 192, 288, 384]
    };
  }
  if (sec === 5) {
    return {
      types: ['CLASSIC_REC', 'CLASSIC_REC', 'ARES_REC', 'CLASSIC_REC'],
      xs: [96, 192, 288, 384]
    };
  }
  if (sec <= 7) {
    return {
      types: ['CLASSIC_REC', 'LEGACY_REC', 'CLASSIC_REC', 'ARES_REC', 'CLASSIC_REC'],
      xs: [74, 157, 240, 323, 406]
    };
  }
  if (sec < MASTER_START_SECTOR) {
    return {
      types: ['CLASSIC_REC', 'LEGACY_REC', 'CLASSIC_REC', 'CLASSIC_REC', 'ARES_REC', 'CLASSIC_REC'],
      xs: [64, 134, 204, 276, 346, 416]
    };
  }
  // Sector 12+: Master Legacy & Master Ares Recognizers deploy alongside Elite Recognizers
  return {
    types: ['LEGACY_REC', 'MASTER_LEGACY_REC', 'CLASSIC_REC', 'CLASSIC_REC', 'MASTER_ARES_REC', 'ARES_REC'],
    xs: [54, 130, 204, 276, 350, 426]
  };
}

function shapeSlotPosition(style, x, y, rowIdx, colIdx, rowLen) {
  const norm = rowLen > 1 ? (colIdx / (rowLen - 1)) * 2 - 1 : 0; // -1..1
  const absN = Math.abs(norm);

  if (style === 'CHEVRON') {
    return { x, y: y + (1 - absN) * 32 - 12 };
  }
  if (style === 'TWIN_FLANKS') {
    const push = norm === 0 ? 0 : Math.sign(norm) * 26;
    return { x: clamp(x + push, 44, LOGICAL_W - 44), y: y + (absN < 0.35 ? -16 : 8) };
  }
  if (style === 'DIAMOND') {
    const squeeze = rowIdx === 0 || rowIdx === 4 ? 0.78 : (rowIdx === 2 ? 1.06 : 0.92);
    const cx = LOGICAL_W * 0.5;
    return { x: clamp(cx + (x - cx) * squeeze, 44, LOGICAL_W - 44), y: y + absN * 18 - 8 };
  }
  if (style === 'ARCH') {
    return { x, y: y + absN * absN * 34 - 10 };
  }
  return { x, y };
}

function buildEntryPath(entryPattern, squad, homeX, homeY) {
  const fromLeft = squad % 2 === 0;
  const sx = fromLeft ? -32 : LOGICAL_W + 32;

  if (entryPattern === 'SPIRAL') {
    return [
      { x: fromLeft ? 70 : LOGICAL_W - 70, y: -36 },
      { x: fromLeft ? LOGICAL_W - 45 : 45, y: 270 },
      { x: fromLeft ? 95 : LOGICAL_W - 95, y: 360 },
      { x: homeX, y: homeY }
    ];
  }
  if (entryPattern === 'TOP_DROP') {
    return [
      { x: clamp(homeX + (fromLeft ? -90 : 90), 36, LOGICAL_W - 36), y: -34 },
      { x: fromLeft ? 390 : 90, y: 245 },
      { x: fromLeft ? 110 : 370, y: 185 },
      { x: homeX, y: homeY }
    ];
  }
  if (entryPattern === 'PINCER') {
    return [
      { x: sx, y: 320 - squad * 34 },
      { x: fromLeft ? 190 : 290, y: 390 },
      { x: fromLeft ? 375 : 105, y: 175 },
      { x: homeX, y: homeY }
    ];
  }
  // CROSS (classic swoop)
  return [
    { x: sx, y: 120 + squad * 26 },
    { x: fromLeft ? 340 : 140, y: 315 },
    { x: fromLeft ? 120 : 360, y: 205 },
    { x: homeX, y: homeY }
  ];
}

export function buildStandardWaveQueue(game, sec) {
  const slots = [];
  const style = game.formationStyle || 'PHALANX';
  const entryPattern = ENTRY_PATTERNS[Math.floor(Math.random() * ENTRY_PATTERNS.length)];
  const top = buildTopRowConfig(sec);

  top.types.forEach((type, idx) => {
    const pos = shapeSlotPosition(style, top.xs[idx], 92, 0, idx, top.types.length);
    slots.push({ type, homeX: pos.x, homeY: pos.y, rowIdx: 0, squad: idx % 2 });
  });

  // 2 rows of Interceptors (6 per row)
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 6; c++) {
      const pos = shapeSlotPosition(style, 80 + c * 64, 152 + r * 42, 1 + r, c, 6);
      slots.push({
        type: 'INTERCEPTOR',
        homeX: pos.x,
        homeY: pos.y,
        rowIdx: 1 + r,
        squad: 2 + (c >= 3 ? 1 : 0)
      });
    }
  }

  // 2 rows of Bit-Drones (8 per row)
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 8; c++) {
      const pos = shapeSlotPosition(style, 54 + c * 53, 238 + r * 38, 3 + r, c, 8);
      slots.push({
        type: 'DRONE',
        homeX: pos.x,
        homeY: pos.y,
        rowIdx: 3 + r,
        squad: 4 + (c % 2)
      });
    }
  }

  slots.sort((a, b) => a.squad - b.squad);
  const entryDur = Math.max(1.15, 1.48 - sec * 0.02);
  slots.forEach((s, i) => {
    const path = buildEntryPath(entryPattern, s.squad, s.homeX, s.homeY);
    game.waveQueue.push({
      delay: 0.22 + i * 0.095,
      type: s.type,
      homeX: s.homeX,
      homeY: s.homeY,
      rowIdx: s.rowIdx,
      path,
      pathDur: entryDur,
      challenge: false,
      challengeElite: false
    });
  });
  game.waveSpawnTimer = 0;
}

export function buildChallengeWaveQueue(game, challengeNum) {
  const types = ['DRONE', 'INTERCEPTOR', 'CLASSIC_REC', 'INTERCEPTOR', 'DRONE'];
  game.challengeTotal = 40;

  for (let s = 0; s < 5; s++) {
    const fromLeft = s % 2 === 0;
    for (let i = 0; i < 8; i++) {
      const p0 = { x: fromLeft ? -26 : LOGICAL_W + 26, y: 90 + (s * 42) };
      const p1 = { x: fromLeft ? 380 : 100, y: 260 + (i % 2) * 45 };
      const p2 = { x: fromLeft ? 90 : 390, y: 420 };
      const p3 = { x: fromLeft ? LOGICAL_W + 36 : -36, y: 160 + (s * 30) };
      game.waveQueue.push({
        delay: s * 2.3 + i * 0.15,
        type: types[s],
        homeX: p3.x,
        homeY: p3.y,
        path: [p0, p1, p2, p3],
        challenge: true,
        challengeElite: false
      });
    }
  }

  // Starting at Challenge 3 (Sector 12+): Elite Raiders + Master Recognizer Raiders;
  // Starting at Challenge 5 (Sector 20+): Guarded Master Recognizer Battle Groups!
  if (challengeNum >= CHALLENGE_ELITE_START) {
    const eliteRaids = challengeNum === CHALLENGE_ELITE_START
      ? [
          { delay: 2.0, type: 'LEGACY_REC', dir: 1, laneY: 96, speed: 64 },
          { delay: 5.8, type: 'ARES_REC', dir: -1, laneY: 146, speed: 64 },
          { delay: 8.8, type: 'MASTER_LEGACY_REC', dir: 1, laneY: 118, speed: 58 }
        ]
      : (challengeNum === CHALLENGE_EXTRA_ROUND_START
        ? [
            { delay: 1.8, type: 'LEGACY_REC', dir: 1, laneY: 92, speed: 64 },
            { delay: 5.0, type: 'MASTER_ARES_REC', dir: -1, laneY: 138, speed: 58 },
            { delay: 8.4, type: 'MASTER_LEGACY_REC', dir: 1, laneY: 184, speed: 58 }
          ]
        : (challengeNum >= 7
          ? [
              // Hard Mode H-CH.03+ / Normal Ch.7+: 3 Guarded Master Recognizer Battle Groups!
              { delay: 1.8, type: 'MASTER_LEGACY_REC', dir: 1, laneY: 96, speed: 54, guardGroup: 'MASTER_G1' },
              { delay: 5.4, type: 'MASTER_ARES_REC', dir: -1, laneY: 146, speed: 54, guardGroup: 'MASTER_G2' },
              { delay: 9.0, type: challengeNum % 2 === 0 ? 'MASTER_ARES_REC' : 'MASTER_LEGACY_REC', dir: 1, laneY: 186, speed: 56, guardGroup: 'MASTER_G3' }
            ]
          : [
              // Challenge 5-6 (and Hard Mode H-CH.01-02): Elite Raider + 2 Guarded Master Recognizers!
              { delay: 1.6, type: challengeNum % 2 === 0 ? 'ARES_REC' : 'LEGACY_REC', dir: 1, laneY: 86, speed: 64 },
              { delay: 4.2, type: 'MASTER_LEGACY_REC', dir: 1, laneY: 132, speed: 52, guardGroup: 'MASTER_G1' },
              { delay: 8.4, type: 'MASTER_ARES_REC', dir: -1, laneY: 158, speed: 52, guardGroup: 'MASTER_G2' }
            ]));

    const guardOffsets = [
      { ox: 0, oy: 50, type: 'INTERCEPTOR' },
      { ox: -44, oy: 36, type: 'INTERCEPTOR' },
      { ox: 44, oy: 36, type: 'INTERCEPTOR' },
      { ox: -62, oy: -4, type: 'DRONE' },
      { ox: 62, oy: -4, type: 'DRONE' }
    ];

    for (const raid of eliteRaids) {
      game.challengeTotal++;
      const startX = raid.dir > 0 ? -48 : LOGICAL_W + 48;
      game.waveQueue.push({
        delay: raid.delay,
        type: raid.type,
        homeX: LOGICAL_W * 0.5,
        homeY: raid.laneY,
        path: null,
        challenge: true,
        challengeElite: true,
        startX,
        raidDir: raid.dir,
        raidLaneY: raid.laneY,
        raidSpeed: raid.speed,
        guardGroup: raid.guardGroup || null
      });

      // Spawn a tight protective escort formation shielding each Challenge 5+ Master Recognizer
      if (raid.guardGroup) {
        guardOffsets.forEach((gOff, gIdx) => {
          game.challengeTotal++;
          game.waveQueue.push({
            delay: raid.delay + 0.04,
            type: gOff.type,
            homeX: LOGICAL_W * 0.5,
            homeY: raid.laneY + gOff.oy,
            path: null,
            challenge: true,
            challengeGuard: true,
            startX: startX + gOff.ox,
            startY: raid.laneY + gOff.oy,
            guardTargetGroup: raid.guardGroup,
            guardOx: gOff.ox,
            guardOy: gOff.oy,
            guardIdx: gIdx,
            raidDir: raid.dir
          });
        });
      }
    }
    game.waveQueue.sort((a, b) => a.delay - b.delay);
  }

  game.waveSpawnTimer = 0;
}

/**
 * Challenges 4+: Builds 1 of 2 extra tactical rounds featuring unique battle formations
 * and active attack patterns!
 */
export function startChallengeExtraRound(game, effChallengeNum, subRound) {
  const modeIdx = ((effChallengeNum - CHALLENGE_EXTRA_ROUND_START) * 2 + (subRound - 1)) % EXTRA_ROUND_MODES.length;
  const mode = EXTRA_ROUND_MODES[modeIdx];
  const hardEscalated = effChallengeNum >= 6; // H-CH.02+ & Ch.6+ escalate with Master escorts & faster extra rounds

  game.waveQueue = [];
  game.waveSpawnTimer = 0;
  game.sectorPhase = 'CHALLENGE_BANNER';
  game.phaseTimer = 1.65;
  const chPrefix = game.hardMode ? `H-CH.${String(game.challengeNum).padStart(2, '0')}` : `CH.${String(game.challengeNum).padStart(2, '0')}`;
  game.bannerTitle = `${chPrefix} // EXTRA ROUND ${subRound}/${game.challengeExtraRounds}`;
  game.bannerSub = hardEscalated ? `${mode.title} [MASTER ESCORT]` : mode.title;
  game.bannerColor = mode.color;
  game.synth.playSectorStart(true);

  const items = [];

  if (mode.id === 'DIAMOND_VORTEX') {
    // 10 ships lock into a rotating orbital diamond around center screen firing radial salvos before peeling off
    const roster = [
      'CLASSIC_REC', 'INTERCEPTOR', 'DRONE', 'INTERCEPTOR', 'DRONE',
      'CLASSIC_REC', 'INTERCEPTOR', 'DRONE', 'INTERCEPTOR', 'DRONE'
    ];
    roster.forEach((type, i) => {
      const baseAngle = (i / roster.length) * Math.PI * 2;
      items.push({
        delay: 0.15 + i * 0.14,
        type,
        homeX: LOGICAL_W * 0.5,
        homeY: 210,
        startX: i % 2 === 0 ? -34 : LOGICAL_W + 34,
        startY: 70 + (i % 5) * 32,
        challenge: true,
        challengeExtra: true,
        extraPattern: 'DIAMOND_VORTEX',
        extraData: {
          clock: 0,
          baseAngle,
          orbitRx: 145,
          orbitRy: 88,
          orbitDir: subRound % 2 === 0 ? -1 : 1,
          peelDelay: 4.5 + i * 0.24,
          shotTimer: 1.55 + (i % 4) * 0.35,
          exitVx: (i % 2 === 0 ? 1 : -1) * (55 + (i % 3) * 35),
          exitVy: 270
        }
      });
    });
  } else if (mode.id === 'TWIN_PINCER') {
    // Two mirrored V-spearhead wings hold flanking crossfire then scissor across the playfield
    const wingTypes = ['CLASSIC_REC', 'INTERCEPTOR', 'INTERCEPTOR', 'DRONE', 'DRONE', 'DRONE'];
    for (const side of [-1, 1]) {
      wingTypes.forEach((type, idx) => {
        const holdX = side < 0 ? 78 + (idx % 3) * 34 : LOGICAL_W - 78 - (idx % 3) * 34;
        const holdY = 110 + Math.floor(idx / 3) * 52 + (idx % 3) * 22;
        items.push({
          delay: 0.18 + idx * 0.16,
          type,
          homeX: holdX,
          homeY: holdY,
          startX: side < 0 ? -36 : LOGICAL_W + 36,
          startY: 64 + idx * 24,
          challenge: true,
          challengeExtra: true,
          extraPattern: 'TWIN_PINCER',
          extraData: {
            clock: 0,
            side,
            holdX,
            holdY,
            holdDur: 2.3 + idx * 0.16,
            shotTimer: 1.05 + idx * 0.24,
            scissorAngle: side < 0 ? Math.PI * 0.32 : Math.PI * 0.68
          }
        });
      });
    }
  } else if (mode.id === 'HELIX_BARRAGE') {
    // 12 interwoven ships descend in a double-helix DNA wave + 1 Elite Recognizer escort
    for (let i = 0; i < 12; i++) {
      const strand = i % 2;
      const type = i % 3 === 0 ? 'INTERCEPTOR' : 'DRONE';
      items.push({
        delay: 0.2 + Math.floor(i / 2) * 0.42 + strand * 0.1,
        type,
        homeX: LOGICAL_W * 0.5,
        homeY: 160,
        startX: LOGICAL_W * 0.5 + (strand === 0 ? -130 : 130),
        startY: -30,
        challenge: true,
        challengeExtra: true,
        extraPattern: 'HELIX_BARRAGE',
        extraData: {
          clock: 0,
          phase: strand * Math.PI,
          amp: 148,
          vy: 112,
          shotTimer: 0.95 + (i % 3) * 0.35
        }
      });
    }
    // Escort Elite Recognizer raider sweeping across the top
    const eliteType = challengeNum % 2 === 0 ? 'LEGACY_REC' : 'ARES_REC';
    items.push({
      delay: 1.4,
      type: eliteType,
      homeX: LOGICAL_W * 0.5,
      homeY: 102,
      path: null,
      challenge: true,
      challengeElite: true,
      startX: -44,
      raidDir: 1,
      raidLaneY: 102,
      raidSpeed: 64
    });
  } else {
    // PHALANX_ASSAULT: Fortified advancing battle wall + outer S-loop flankers
    const wallTypes = ['CLASSIC_REC', 'LEGACY_REC', 'CLASSIC_REC', 'ARES_REC', 'CLASSIC_REC'];
    const wallXs = [86, 163, 240, 317, 394];
    wallTypes.forEach((type, idx) => {
      items.push({
        delay: 0.25 + idx * 0.12,
        type,
        homeX: wallXs[idx],
        homeY: 90,
        startX: wallXs[idx],
        startY: -36,
        challenge: true,
        challengeExtra: true,
        extraPattern: 'PHALANX_ASSAULT',
        extraData: {
          clock: 0,
          role: 'WALL',
          laneX: wallXs[idx],
          shotTimer: 1.15 + (idx % 2) * 0.45,
          wingFired: false
        }
      });
    });

    for (let f = 0; f < 6; f++) {
      const side = f % 2 === 0 ? -1 : 1;
      items.push({
        delay: 0.9 + f * 0.55,
        type: 'INTERCEPTOR',
        homeX: side < 0 ? 52 : LOGICAL_W - 52,
        homeY: 120,
        startX: side < 0 ? 42 : LOGICAL_W - 42,
        startY: -32,
        challenge: true,
        challengeExtra: true,
        extraPattern: 'PHALANX_ASSAULT',
        extraData: {
          clock: 0,
          role: 'FLANKER',
          side,
          shotTimer: 0.72
        }
      });
    }
  }

  // H-CH.02+ / Ch.6+ Extra Rounds also include an escalated Master Recognizer escort!
  if (hardEscalated && mode.id !== 'HELIX_BARRAGE') {
    const escortType = (effChallengeNum + subRound) % 2 === 0 ? 'MASTER_ARES_REC' : 'MASTER_LEGACY_REC';
    const dir = subRound % 2 === 0 ? -1 : 1;
    items.push({
      delay: 1.5,
      type: escortType,
      homeX: LOGICAL_W * 0.5,
      homeY: 96,
      path: null,
      challenge: true,
      challengeElite: true,
      startX: dir > 0 ? -48 : LOGICAL_W + 48,
      raidDir: dir,
      raidLaneY: 96,
      raidSpeed: 58
    });
  }

  items.sort((a, b) => a.delay - b.delay);
  game.challengeTotal += items.length;
  game.waveQueue = items;
}

export function spawnEnemyFromItem(game, item) {
  const isRec = item.type.endsWith('_REC');
  const isMaster = item.type === 'MASTER_LEGACY_REC' || item.type === 'MASTER_ARES_REC';
  const isElite = isMaster || item.type === 'LEGACY_REC' || item.type === 'ARES_REC';
  const isChallengeElite = !!item.challengeElite;
  const isChallengeExtra = !!item.challengeExtra;
  const isChallengeGuard = !!item.challengeGuard;

  // Master Recognizers = 10 HP; Elite Recognizers = 6 HP (12 in 2x HP Ch.3+ Raiders)
  const maxHp = isMaster
    ? MASTER_REC_HP
    : (isChallengeElite
      ? ELITE_REC_HP * 2
      : (isChallengeGuard
        ? (item.type === 'INTERCEPTOR' ? 2 : 1)
        : (isChallengeExtra
          ? (isElite ? ELITE_REC_HP : (item.type === 'CLASSIC_REC' ? 2 : 1))
          : (item.challenge
            ? 1
            : (isElite ? ELITE_REC_HP : (item.type === 'CLASSIC_REC' ? 2 : 1))))));

  const ptsForm = isMaster
    ? (isChallengeElite ? 2500 : (item.type === 'MASTER_ARES_REC' ? 850 : 750))
    : (isChallengeElite ? 1500 : (isChallengeGuard ? 250 : (isChallengeExtra
      ? (isElite ? 900 : (isRec ? 350 : 200))
      : (item.challenge ? 100 : (
        item.type === 'ARES_REC' ? 400 :
        item.type === 'LEGACY_REC' ? 350 :
        item.type === 'CLASSIC_REC' ? 150 :
        item.type === 'INTERCEPTOR' ? 80 : 50
      )))));
  const ptsDive = isMaster
    ? (isChallengeElite ? 2500 : (item.type === 'MASTER_ARES_REC' ? 2000 : 1800))
    : (isChallengeElite ? 1500 : (isChallengeGuard ? 250 : (isChallengeExtra
      ? ptsForm
      : (item.challenge ? 100 : (
        item.type === 'ARES_REC' ? 1000 :
        item.type === 'LEGACY_REC' ? 900 :
        item.type === 'CLASSIC_REC' ? 400 :
        item.type === 'INTERCEPTOR' ? 160 : 100
      )))));

  const startX = (isChallengeElite || isChallengeExtra || isChallengeGuard) ? item.startX : item.path[0].x;
  const startY = isChallengeElite
    ? item.raidLaneY
    : ((isChallengeExtra || isChallengeGuard) ? item.startY : item.path[0].y);

  const initState = isChallengeElite
    ? 'CHALLENGE_ELITE'
    : (isChallengeGuard
      ? 'CHALLENGE_GUARD'
      : (isChallengeExtra ? 'CHALLENGE_EXTRA' : (item.challenge ? 'CHALLENGE' : 'ENTERING')));

  game.enemies.push({
    id: game.enemyIdSeq++,
    type: item.type,
    isRec,
    isElite,
    isMaster,
    isChallengeElite,
    isChallengeExtra,
    isChallengeGuard,
    hitRadius: isMaster ? 30 : (isElite ? 26 : (isRec ? 20 : 16)),
    maxHp,
    hp: maxHp,
    ptsForm,
    ptsDive,
    x: startX,
    y: startY,
    homeX: item.homeX,
    homeY: item.homeY,
    rowIdx: item.rowIdx || 0,
    angle: 0,
    state: initState,
    path: item.path || null,
    pathT: 0,
    pathDur: item.pathDur || (item.challenge ? 3.0 : 1.4),
    hitFlash: 0,
    animPhase: Math.random() * Math.PI * 2,
    diveT: 0,
    diveDur: 2.1,
    divePattern: 'SWOOP',
    divePath: null,
    weaveAmp: 0,
    weaveFreq: 0,
    feintSnapped: false,
    feintSnapT: 0.44,
    feintSubCurve: null,
    loopCx: 0,
    loopCy: 0,
    loopR: 48,
    loopDir: 1,
    beamTimer: 0,
    beamShield: 0,
    beamApproachT: 0,
    beamStartX: startX,
    beamStartY: startY,
    beamTargetX: startX,
    beamFlankX: startX,
    hasCapturedShip: false,
    shotCooldown: 0.35 + Math.random() * 0.55,
    wingSurgeQueue: 0,
    wingSurgeTimer: 0,
    surgePulse: 0,
    raidDir: item.raidDir || 1,
    raidLaneY: item.raidLaneY || 110,
    raidSpeed: item.raidSpeed || 64,
    raidClock: 0,
    challengeTwinFired: false,
    guardGroup: item.guardGroup || null,
    guardTargetGroup: item.guardTargetGroup || null,
    guardOx: item.guardOx || 0,
    guardOy: item.guardOy || 0,
    guardIdx: item.guardIdx || 0,
    guardClock: 0,
    guardBroken: false,
    extraPattern: item.extraPattern || null,
    extraData: item.extraData ? { ...item.extraData } : null
  });

  if (isChallengeElite) {
    const isAresKind = item.type === 'ARES_REC' || item.type === 'MASTER_ARES_REC';
    const label = isMaster
      ? (isAresKind
        ? (item.guardGroup ? 'MASTER ARES + GUARD FORMATION' : 'MASTER ARES RAIDER [15 HP]')
        : (item.guardGroup ? 'MASTER LEGACY + GUARD FORMATION' : 'MASTER LEGACY RAIDER [15 HP]'))
      : (isAresKind ? 'ARES RAIDER [2X HP]' : 'LEGACY RAIDER [2X HP]');
    game.spawnPopup(
      LOGICAL_W * 0.5,
      startY - 14,
      label,
      isAresKind ? COLORS.aresRed : COLORS.cyan,
      1.4
    );
  }
}

export function finishChallengeStage(game) {
  const hits = game.challengeHits;
  const total = Math.max(1, game.challengeTotal);
  if (hits >= total) {
    game.addScore(10000);
    game.bannerTitle = 'PERFECT DATA STREAM!';
    game.bannerSub = '100% ACCURACY // BONUS +10000';
    game.bannerColor = COLORS.gold;
    game.synth.playRescue();
  } else {
    const bonus = hits * 100;
    if (bonus > 0) game.addScore(bonus);
    game.bannerTitle = 'CHALLENGE COMPLETE';
    game.bannerSub = `HITS ${hits}/${total} // BONUS +${bonus}`;
    game.bannerColor = COLORS.emerald;
    game.synth.playSectorStart(false);
  }
  game.justFinishedChallenge = true;
  game.sectorPhase = 'CLEARED';
  game.phaseTimer = 2.4;
}

function assignDivePattern(game, diver, forcedPattern = null, flankOffset = 0) {
  const effSec = game.getEffectiveSector ? game.getEffectiveSector() : game.sector;
  diver.state = 'DIVING';
  diver.diveT = 0;
  diver.feintSnapped = false;
  diver.feintSnapT = 0.44;
  diver.feintSubCurve = null;

  const patterns = effSec === 1
    ? ['SWOOP', 'WEAVE', 'FEINT']
    : ['SWOOP', 'WEAVE', 'FEINT', 'LOOP'];
  const pattern = forcedPattern || patterns[Math.floor(Math.random() * patterns.length)];
  diver.divePattern = pattern;

  const baseDur = Math.max(1.45, 2.35 - effSec * 0.085);
  diver.diveDur = baseDur * (pattern === 'LOOP' ? 1.18 : (pattern === 'WEAVE' ? 1.08 : 0.94));

  const tx = clamp(game.player.x + flankOffset + (Math.random() - 0.5) * 78, 36, LOGICAL_W - 36);
  const swingDir = diver.x < LOGICAL_W * 0.5 ? 1 : -1;

  if (pattern === 'WEAVE') {
    diver.weaveAmp = 44 + Math.random() * 34;
    diver.weaveFreq = 3.5 + Math.random() * 2.0;
    diver.divePath = [
      { x: diver.x, y: diver.y },
      { x: clamp(lerp(diver.x, tx, 0.35), 48, LOGICAL_W - 48), y: diver.y + 160 },
      { x: tx, y: LOGICAL_H - 115 },
      { x: clamp(tx + swingDir * 60, 28, LOGICAL_W - 28), y: LOGICAL_H + 58 }
    ];
    diver.shotCooldown = 0.28 + Math.random() * 0.25;
  } else if (pattern === 'FEINT') {
    const fakeSide = game.player.x < LOGICAL_W * 0.5 ? 1 : -1;
    const fakeX = clamp(game.player.x + fakeSide * (120 + Math.random() * 45), 42, LOGICAL_W - 42);
    diver.divePath = [
      { x: diver.x, y: diver.y },
      { x: fakeX, y: lerp(diver.y, LOGICAL_H - 190, 0.72) },
      { x: tx, y: LOGICAL_H - 96 },
      { x: clamp(tx - fakeSide * 75, 24, LOGICAL_W - 24), y: LOGICAL_H + 58 }
    ];
    diver.shotCooldown = 0.36 + Math.random() * 0.22;
  } else if (pattern === 'LOOP') {
    diver.loopCx = clamp(lerp(diver.x, tx, 0.55), 86, LOGICAL_W - 86);
    diver.loopCy = clamp(diver.y + 185, 240, 380);
    diver.loopR = 46 + Math.random() * 22;
    diver.loopDir = Math.random() < 0.5 ? 1 : -1;
    diver.divePath = [
      { x: diver.x, y: diver.y },
      { x: diver.loopCx + diver.loopDir * 90, y: diver.loopCy - 60 },
      { x: tx, y: LOGICAL_H - 84 },
      { x: clamp(tx + diver.loopDir * 85, 28, LOGICAL_W - 28), y: LOGICAL_H + 58 }
    ];
    diver.shotCooldown = 0.32 + Math.random() * 0.25;
  } else {
    // Sharp lead-aimed SWOOP
    diver.divePath = [
      { x: diver.x, y: diver.y },
      { x: clamp(diver.x + swingDir * (95 + Math.random() * 65), 36, LOGICAL_W - 36), y: diver.y + 145 },
      { x: tx, y: LOGICAL_H - 88 },
      { x: clamp(tx + (Math.random() < 0.5 ? -95 : 95), 20, LOGICAL_W - 20), y: LOGICAL_H + 58 }
    ];
    diver.shotCooldown = 0.26 + Math.random() * 0.28;
  }
}

export function launchFormationDiver(game) {
  const effSec = game.getEffectiveSector ? game.getEffectiveSector() : game.sector;
  const ready = game.enemies.filter(e => e.state === 'FORMATION');
  if (ready.length === 0) return;

  const activeDivers = game.enemies.filter(e => e.state === 'DIVING').length;
  const maxDivers = Math.min(7, 2 + Math.floor((effSec + 1) / 2));
  if (activeDivers >= maxDivers) return;

  // Slightly higher occasional abduction chance when a Classic MCP Recognizer is ready in formation
  if (
    !game.player.dual &&
    !game.capturedFighter &&
    !game.activeBeamBoss &&
    game.player.alive &&
    game.sectorTractorCount < TRACTOR_MAX_PER_SECTOR &&
    game.tractorTimer <= 6.0 &&
    Math.random() < 0.08
  ) {
    const classicRecs = ready.filter(e => e.type === 'CLASSIC_REC' && !e.hasCapturedShip);
    if (classicRecs.length > 0) {
      const rec = classicRecs[Math.floor(Math.random() * classicRecs.length)];
      startRecognizerBeam(game, rec);
      game.sectorTractorCount++;
      game.postChallengeAbductionPending = false;
      game.tractorTimer = TRACTOR_INTERVAL + Math.random() * 6.0;
      return;
    }
  }

  // Coordinated multi-fighter squadron / pincer dives grow more frequent as sectors advance
  const squadChance = clamp(0.32 + effSec * 0.06, 0.35, 0.78);
  const desiredCount = (Math.random() < squadChance && ready.length >= 2)
    ? (effSec >= 3 && Math.random() < 0.38 && ready.length >= 3 ? 3 : 2)
    : 1;
  const launchCount = Math.min(desiredCount, maxDivers - activeDivers, ready.length);

  const chosen = [];
  const pool = [...ready];
  for (let k = 0; k < launchCount; k++) {
    const idx = Math.floor(Math.random() * pool.length);
    chosen.push(pool.splice(idx, 1)[0]);
  }

  // Either synchronized pincer pair or mixed unpredictable patterns
  const syncPincer = chosen.length >= 2 && Math.random() < 0.55;
  chosen.forEach((diver, idx) => {
    const flankOffset = syncPincer ? (idx === 0 ? -56 : (idx === 1 ? 56 : 0)) : 0;
    const forced = syncPincer && idx > 0 ? chosen[0].divePattern : null;
    assignDivePattern(game, diver, forced, flankOffset);
  });
}

export function updateSectorPhase(game, dt) {
  if (game.sectorPhase === 'BANNER') {
    game.phaseTimer -= dt;
    if (game.phaseTimer <= 0) {
      game.sectorPhase = (game.sector % CHALLENGE_INTERVAL === 0) ? 'CHALLENGE' : 'ENTRY';
    }
    return;
  }

  if (game.sectorPhase === 'CHALLENGE_BANNER') {
    game.phaseTimer -= dt;
    if (game.phaseTimer <= 0) {
      game.sectorPhase = 'CHALLENGE';
    }
    return;
  }

  if (game.sectorPhase === 'ENTRY' || game.sectorPhase === 'CHALLENGE') {
    game.waveSpawnTimer += dt;
    while (game.waveQueue.length > 0 && game.waveQueue[0].delay <= game.waveSpawnTimer) {
      spawnEnemyFromItem(game, game.waveQueue.shift());
    }
    if (game.waveQueue.length === 0) {
      if (game.sectorPhase === 'ENTRY') {
        const stillEntering = game.enemies.some(e => e.state === 'ENTERING');
        if (!stillEntering) {
          game.sectorPhase = 'COMBAT';
          game.diveTimer = 0.75;
          game.formationShotTimer = 1.6;
          // If the 80% post-challenge abduction roll triggered, queue an early sweep once settled
          game.tractorTimer = game.postChallengeAbductionPending
            ? 1.8
            : (TRACTOR_INITIAL_DELAY + Math.random() * 3.0);
          game.wingLaunchTimer = 1.8;
        }
      } else if (game.sectorPhase === 'CHALLENGE' && game.enemies.length === 0 && game.lightwings.length === 0) {
        if (game.challengeSubRound < game.challengeExtraRounds) {
          game.challengeSubRound++;
          const effCh = game.getEffectiveChallengeNum ? game.getEffectiveChallengeNum() : game.challengeNum;
          startChallengeExtraRound(game, effCh, game.challengeSubRound);
        } else {
          finishChallengeStage(game);
        }
      }
    }
    return;
  }

  if (game.sectorPhase === 'COMBAT') {
    const effSec = game.getEffectiveSector ? game.getEffectiveSector() : game.sector;
    if (game.enemies.length === 0 && game.lightwings.length === 0) {
      game.sectorPhase = 'CLEARED';
      game.phaseTimer = 1.85;
      game.bannerTitle = game.hardMode
        ? `HARD // SECTOR ${String(game.sector).padStart(2, '0')} CLEARED`
        : `SECTOR ${String(game.sector).padStart(2, '0')} CLEARED`;
      game.bannerSub = 'ADVANCING GRID...';
      game.bannerColor = COLORS.emerald;
      return;
    }

    // Aggressive, variable diving scheduler
    game.diveTimer -= dt;
    if (game.diveTimer <= 0) {
      launchFormationDiver(game);
      const baseGap = Math.max(0.52, 1.48 - effSec * 0.08);
      game.diveTimer = baseGap * (0.78 + Math.random() * 0.44);
    }

    // Formation skirmish fire so stationary players stay under pressure
    game.formationShotTimer -= dt;
    if (game.formationShotTimer <= 0 && game.player.alive) {
      const shooters = game.enemies.filter(
        e => e.state === 'FORMATION' && (e.type === 'INTERCEPTOR' || e.isRec)
      );
      if (shooters.length > 0) {
        const s = shooters[Math.floor(Math.random() * shooters.length)];
        const spd = Math.min(430, 265 + effSec * 11);
        const col = (s.type === 'ARES_REC' || s.type === 'MASTER_ARES_REC')
          ? COLORS.aresRed
          : ((s.type === 'LEGACY_REC' || s.type === 'MASTER_LEGACY_REC') ? COLORS.cyan : COLORS.amber);
        fireAimedBullet(game, s.x, s.y + 12, spd, col, (Math.random() - 0.5) * 0.14, 0.35);
      }
      game.formationShotTimer = Math.max(0.85, 2.2 - effSec * 0.1) * (0.75 + Math.random() * 0.5);
    }

    // Occasional Classic MCP Recognizer Tractor Beam scheduler (paced like original Galaga)
    if (
      !game.player.dual &&
      !game.capturedFighter &&
      !game.activeBeamBoss &&
      game.player.alive &&
      game.sectorTractorCount < TRACTOR_MAX_PER_SECTOR
    ) {
      game.tractorTimer -= dt;
      if (game.tractorTimer <= 0) {
        const beamCandidates = game.enemies.filter(
          e => e.type === 'CLASSIC_REC' && e.state === 'FORMATION' && !e.hasCapturedShip
        );
        if (beamCandidates.length > 0) {
          const chosen = beamCandidates[Math.floor(Math.random() * beamCandidates.length)];
          startRecognizerBeam(game, chosen);
          game.sectorTractorCount++;
          game.postChallengeAbductionPending = false;
          game.tractorTimer = TRACTOR_INTERVAL + Math.random() * 6.0;
        } else {
          game.tractorTimer = 2.4;
        }
      }
    }

    // Elite & Master Lightwing scheduler
    const elitesInForm = game.enemies.filter(e => e.isElite && e.state === 'FORMATION');
    if (elitesInForm.length > 0) {
      game.wingLaunchTimer -= dt;
      if (game.wingLaunchTimer <= 0) {
        const boss = elitesInForm[Math.floor(Math.random() * elitesInForm.length)];
        spawnLightwing(game, boss, true, 0);
        game.wingLaunchTimer = Math.max(2.5, 4.5 - effSec * 0.16);
      }
    }
  } else if (game.sectorPhase === 'CLEARED') {
    game.phaseTimer -= dt;
    if (game.phaseTimer <= 0) {
      beginSector(game, game.sector + 1);
    }
  }
}

export function damageEnemy(game, idx, dmg, hitX, hitY, sparkCol = COLORS.white) {
  const e = game.enemies[idx];
  if (!e) return;

  // Classic MCP Recognizer Tractor Capacitor Shield absorbs 1 hit during approach
  if (e.state === 'BEAM_APPROACH' && e.beamShield > 0) {
    e.beamShield -= 1;
    e.hitFlash = 0.14;
    game.synth.playRibbonDeflect();
    game.spawnDerez(hitX, hitY, COLORS.cyan, 8, 120);
    return;
  }

  e.hp -= dmg;
  e.hitFlash = 0.12;
  if (e.hp <= 0.001) {
    destroyEnemy(game, idx, true);
  } else {
    game.synth.playArmorPing();
    game.spawnDerez(hitX, hitY, sparkCol, 4, 85);
  }
}

export function destroyEnemy(game, idx, scored = true) {
  const e = game.enemies[idx];
  if (!e) return;

  handleRecognizerDestroyed(game, e);

  const col = (e.type === 'ARES_REC' || e.type === 'MASTER_ARES_REC') ? COLORS.aresRed
    : ((e.type === 'LEGACY_REC' || e.type === 'MASTER_LEGACY_REC') ? COLORS.cyan
      : (e.type === 'CLASSIC_REC' ? COLORS.mcpOrange
        : (e.type === 'INTERCEPTOR' ? COLORS.gold : COLORS.cyan)));

  game.spawnDerez(e.x, e.y, col, e.isMaster ? 38 : (e.isElite ? 28 : 16), e.isMaster ? 250 : (e.isElite ? 220 : 165));
  game.synth.playDerez(e.isElite || e.isRec);

  if (e.isMaster) {
    game.shake = 0.28;
    game.hitStop = 0.045;
  } else if (e.isElite) {
    game.shake = 0.18;
    game.hitStop = 0.03;
  }

  if (scored) {
    rollEnemyCapsuleDrop(game, e);

    if (game.sectorPhase === 'CHALLENGE' || game.sectorPhase === 'CHALLENGE_BANNER') {
      game.challengeHits++;
      const chPts = e.isMaster ? 2500 : (e.isChallengeElite ? 1500 : ((e.isChallengeExtra || e.isChallengeGuard) ? e.ptsForm : 100));
      game.addScore(chPts, e.x, e.y, (e.isChallengeElite || e.isChallengeExtra || e.isChallengeGuard) ? col : COLORS.gold);
    } else {
      const isDiving = e.state === 'DIVING' || e.state === 'BEAMING' || e.state === 'BEAM_APPROACH';
      game.addScore(isDiving ? e.ptsDive : e.ptsForm, e.x, e.y, col);
    }
  }
  game.enemies.splice(idx, 1);
}

function getFormationTarget(game, e) {
  const cx = LOGICAL_W * 0.5;
  const clk = game.formationClock;
  const mode = game.swayMode || 'SWAY';

  if (mode === 'FIGURE8') {
    const sx = Math.sin(clk * 1.25) * 28;
    const sy = Math.sin(clk * 2.5 + e.rowIdx * 0.4) * 7;
    return { x: cx + (e.homeX - cx) * (1 + Math.sin(clk * 1.6) * 0.04) + sx, y: e.homeY + sy };
  }
  if (mode === 'COUNTER_ROW') {
    const dir = e.rowIdx % 2 === 0 ? 1 : -1;
    const sx = Math.sin(clk * 1.35) * 24 * dir;
    return { x: e.homeX + sx, y: e.homeY + Math.cos(clk * 2.0 + e.homeX * 0.02) * 5 };
  }
  if (mode === 'ACCORDION') {
    const breath = 1 + Math.sin(clk * 2.15) * 0.095;
    const sx = Math.sin(clk * 0.95) * 16;
    return { x: cx + (e.homeX - cx) * breath + sx, y: e.homeY + Math.sin(clk * 2.15 + e.rowIdx * 0.6) * 6 };
  }
  const swayX = Math.sin(clk * 1.15) * 24;
  const breath = 1 + Math.sin(clk * 1.8) * 0.045;
  return {
    x: cx + (e.homeX - cx) * breath + swayX,
    y: e.homeY + Math.sin(clk * 1.8 + e.homeX * 0.02) * 4
  };
}

function updateChallengeExtraEnemy(game, e, dt) {
  const d = e.extraData;
  d.clock += dt;
  const p = game.player;
  const bulletSpd = Math.min(430, 275 + game.sector * 8);
  const bCol = e.type === 'ARES_REC' ? COLORS.aresRed : (e.type === 'LEGACY_REC' ? COLORS.cyan : COLORS.amber);

  if (e.extraPattern === 'DIAMOND_VORTEX') {
    const cx = LOGICAL_W * 0.5;
    const cy = 215;
    if (d.clock < 1.15) {
      const t = d.clock / 1.15;
      const ease = 1 - Math.pow(1 - t, 3);
      const ca = Math.cos(d.baseAngle);
      const sa = Math.sin(d.baseAngle);
      const diam = 1 / (Math.abs(ca) + Math.abs(sa));
      const tx = cx + ca * diam * d.orbitRx;
      const ty = cy + sa * diam * d.orbitRy;
      e.x = lerp(e.x, tx, Math.min(1, dt * 6 + ease * 0.14));
      e.y = lerp(e.y, ty, Math.min(1, dt * 6 + ease * 0.14));
    } else if (d.clock < d.peelDelay) {
      const orbT = d.clock - 1.15;
      const ang = d.baseAngle + orbT * 1.65 * d.orbitDir;
      const pulse = 1 + Math.sin(orbT * 3.6) * 0.14;
      // Diamond-shaped superellipse orbit
      const ca = Math.cos(ang);
      const sa = Math.sin(ang);
      const diam = 1 / (Math.abs(ca) + Math.abs(sa));
      e.x = cx + ca * diam * d.orbitRx * pulse;
      e.y = cy + sa * diam * d.orbitRy * pulse;
      d.shotTimer -= dt;
      if (d.shotTimer <= 0 && p.alive) {
        fireAimedBullet(game, e.x, e.y + 10, bulletSpd, bCol, 0, 0.25);
        d.shotTimer = 1.45;
      }
    } else {
      e.x += d.exitVx * dt;
      e.y += d.exitVy * dt;
      d.shotTimer -= dt;
      if (d.shotTimer <= 0 && e.y < LOGICAL_H - 170 && p.alive) {
        fireAimedBullet(game, e.x, e.y + 10, bulletSpd * 1.05, bCol);
        d.shotTimer = 1.2;
      }
    }
    return e.y > LOGICAL_H + 56 || e.x < -64 || e.x > LOGICAL_W + 64;
  }

  if (e.extraPattern === 'TWIN_PINCER') {
    if (d.clock < 1.05) {
      const k = Math.min(1, dt * 5.2);
      e.x += (d.holdX - e.x) * k;
      e.y += (d.holdY - e.y) * k;
    } else if (d.clock < 1.05 + d.holdDur) {
      const t = d.clock - 1.05;
      e.x = d.holdX + Math.sin(t * 4.2) * 14 * d.side;
      e.y = d.holdY + Math.cos(t * 3.0) * 8;
      d.shotTimer -= dt;
      if (d.shotTimer <= 0 && p.alive) {
        // Converging crossfire volley
        fireAimedBullet(game, e.x, e.y + 10, bulletSpd, bCol, -0.14 * d.side, 0.3);
        if (e.isRec) {
          fireAimedBullet(game, e.x, e.y + 10, bulletSpd, bCol, 0.12 * d.side, 0);
        }
        d.shotTimer = 1.25;
      }
    } else {
      const spd = 285;
      e.x += Math.cos(d.scissorAngle) * spd * dt;
      e.y += Math.sin(d.scissorAngle) * spd * dt;
    }
    return e.y > LOGICAL_H + 56 || e.x < -64 || e.x > LOGICAL_W + 64;
  }

  if (e.extraPattern === 'HELIX_BARRAGE') {
    e.y += d.vy * dt;
    e.x = LOGICAL_W * 0.5 + Math.sin(d.clock * 3.3 + d.phase) * d.amp;
    d.shotTimer -= dt;
    if (d.shotTimer <= 0 && e.y > 40 && e.y < LOGICAL_H - 165 && p.alive) {
      if (e.type === 'INTERCEPTOR') {
        fireAimedBullet(game, e.x, e.y + 10, bulletSpd, COLORS.gold, -0.18);
        fireAimedBullet(game, e.x, e.y + 10, bulletSpd, COLORS.gold, 0.18);
      } else {
        fireAimedBullet(game, e.x, e.y + 10, bulletSpd, COLORS.cyan, 0, 0.25);
      }
      d.shotTimer = 1.15;
    }
    return e.y > LOGICAL_H + 56;
  }

  // PHALANX_ASSAULT
  if (d.role === 'WALL') {
    const marchWave = Math.sin(d.clock * 2.2);
    e.x = clamp(d.laneX + marchWave * 28, 38, LOGICAL_W - 38);
    // Stepped advance: surge down then briefly brace
    const stepSpeed = Math.sin(d.clock * 2.4) > -0.25 ? 82 : 24;
    e.y += stepSpeed * dt;

    if (e.isElite && !d.wingFired && e.y > 105) {
      d.wingFired = true;
      spawnLightwing(game, e, false, 0, e.x < LOGICAL_W * 0.5 ? 1 : -1, 0);
    }

    d.shotTimer -= dt;
    if (d.shotTimer <= 0 && e.y > 35 && e.y < LOGICAL_H - 150 && p.alive) {
      fireDirectedBullet(game, e.x - 10, e.y + 14, Math.PI * 0.5, bulletSpd * 0.95, bCol);
      fireDirectedBullet(game, e.x + 10, e.y + 14, Math.PI * 0.5, bulletSpd * 0.95, bCol);
      d.shotTimer = 1.3;
    }
    return e.y > LOGICAL_H + 56;
  }

  // PHALANX FLANKER
  e.y += 162 * dt;
  const edgeBase = d.side < 0 ? 58 : LOGICAL_W - 58;
  e.x = edgeBase - d.side * Math.sin(d.clock * 3.8) * 44;
  d.shotTimer -= dt;
  if (d.shotTimer <= 0 && e.y > 50 && e.y < LOGICAL_H - 140 && p.alive) {
    fireAimedBullet(game, e.x, e.y + 10, bulletSpd * 1.04, COLORS.gold, 0, 0.35);
    d.shotTimer = 0.95;
  }
  return e.y > LOGICAL_H + 56;
}

export function updateEnemies(game, dt) {
  game.formationClock += dt;
  const p = game.player;
  let beamActive = false;

  for (let i = game.enemies.length - 1; i >= 0; i--) {
    const e = game.enemies[i];
    if (e.hitFlash > 0) e.hitFlash = Math.max(0, e.hitFlash - dt);
    if (e.surgePulse > 0) e.surgePulse = Math.max(0, e.surgePulse - dt);

    // Consecutive Lightwing Surge queue
    if (e.wingSurgeQueue > 0) {
      e.wingSurgeTimer -= dt;
      if (e.wingSurgeTimer <= 0) {
        const idx = e.wingSurgeQueue;
        e.wingSurgeQueue--;
        e.wingSurgeTimer = ELITE_SURGE_INTERVAL;
        spawnLightwing(game, e, false, idx);
      }
    }

    if (e.state === 'ENTERING' || e.state === 'CHALLENGE') {
      e.pathT += dt / e.pathDur;
      const pos = evalCubic(e.path, clamp(e.pathT, 0, 1));
      e.x = pos.x;
      e.y = pos.y;
      if (e.pathT >= 1) {
        if (e.state === 'CHALLENGE') {
          game.enemies.splice(i, 1);
          continue;
        }
        e.state = 'FORMATION';
      }
    } else if (e.state === 'FORMATION') {
      const target = getFormationTarget(game, e);
      e.x = target.x;
      e.y = target.y;
      e.angle = 0;
    } else if (e.state === 'DIVING') {
      const effSec = game.getEffectiveSector ? game.getEffectiveSector() : game.sector;
      const prevX = e.x;
      const prevY = e.y;
      e.diveT += dt / e.diveDur;
      const t = clamp(e.diveT, 0, 1);

      // Seamless C1-continuous FEINT juke (builds a new curve from exact current pos — zero teleporting!)
      if (e.divePattern === 'FEINT' && !e.feintSnapped && t >= 0.44 && p.alive) {
        e.feintSnapped = true;
        e.feintSnapT = t;
        const pCur = evalCubic(e.divePath, t);
        const pAhead = evalCubic(e.divePath, Math.min(1, t + 0.02));
        const tanX = (pAhead.x - pCur.x) / 0.02;
        const tanY = (pAhead.y - pCur.y) / 0.02;
        const snapX = clamp(p.x + (Math.random() - 0.5) * 44, 34, LOGICAL_W - 34);
        const exitX = clamp(snapX + (snapX < LOGICAL_W * 0.5 ? 85 : -85), 24, LOGICAL_W - 24);
        e.feintSubCurve = [
          { x: pCur.x, y: pCur.y },
          { x: clamp(pCur.x + tanX * 0.16, 28, LOGICAL_W - 28), y: pCur.y + Math.max(24, tanY * 0.16) },
          { x: snapX, y: LOGICAL_H - 96 },
          { x: exitX, y: LOGICAL_H + 58 }
        ];
      }

      if (e.feintSubCurve) {
        const subT = clamp((t - e.feintSnapT) / Math.max(0.01, 1 - e.feintSnapT), 0, 1);
        const pos = evalCubic(e.feintSubCurve, subT);
        e.x = pos.x;
        e.y = pos.y;
      } else if (e.divePattern === 'LOOP' && t > 0.28 && t < 0.68) {
        const lt = (t - 0.28) / 0.40; // 0..1 full 360-degree loop
        const basePos = evalCubic(e.divePath, t);
        const loopAng = lt * Math.PI * 2 * e.loopDir;
        const env = Math.sin(lt * Math.PI);
        e.x = clamp(basePos.x + Math.sin(loopAng) * e.loopR * env, 24, LOGICAL_W - 24);
        e.y = basePos.y - (1 - Math.cos(loopAng)) * e.loopR * 0.72 * env;
      } else {
        const pos = evalCubic(e.divePath, t);
        if (e.divePattern === 'WEAVE') {
          const weave = Math.sin(t * Math.PI * e.weaveFreq) * e.weaveAmp * Math.sin(t * Math.PI);
          e.x = clamp(pos.x + weave, 24, LOGICAL_W - 24);
          e.y = pos.y;
        } else {
          e.x = pos.x;
          e.y = pos.y;
        }
      }

      const vx = e.x - prevX;
      const vy = e.y - prevY;
      if (Math.hypot(vx, vy) > 0.25 && !e.isRec) {
        e.angle = Math.atan2(vy, vx) - Math.PI * 0.5;
      }

      e.shotCooldown -= dt;
      if (e.shotCooldown <= 0 && e.y < LOGICAL_H - 145 && p.alive) {
        const spd = Math.min(460, 275 + effSec * 12);
        const col = (e.type === 'ARES_REC' || e.type === 'MASTER_ARES_REC')
          ? COLORS.aresRed
          : ((e.type === 'LEGACY_REC' || e.type === 'MASTER_LEGACY_REC') ? COLORS.cyan : COLORS.amber);

        if (e.isMaster) {
          // Master Recognizers fire a 3-bolt tactical fan
          fireAimedBullet(game, e.x, e.y + 14, spd, col, -0.24, 0.25);
          fireAimedBullet(game, e.x, e.y + 14, spd, col, 0, 0.25);
          fireAimedBullet(game, e.x, e.y + 14, spd, col, 0.24, 0.25);
        } else if ((e.type === 'INTERCEPTOR' || e.isRec) && (effSec >= 2 || e.divePattern === 'LOOP')) {
          // Twin aimed spread volley for higher unpredictability
          const spread = e.isRec ? 0.20 : 0.15;
          fireAimedBullet(game, e.x, e.y + 12, spd, col, -spread, 0.25);
          fireAimedBullet(game, e.x, e.y + 12, spd, col, spread, 0.25);
        } else {
          fireAimedBullet(game, e.x, e.y + 12, spd, col, 0, e.divePattern === 'FEINT' ? 0.55 : 0.35);
        }
        e.shotCooldown = Math.max(0.52, 0.92 - effSec * 0.035);
      }

      if (e.diveT >= 1) {
        e.y = -32;
        e.angle = 0;
        e.state = 'RETURNING';
        if (e.hasCapturedShip && game.capturedFighter && game.capturedFighter.ownerId === e.id) {
          game.capturedFighter.x = e.x;
          game.capturedFighter.y = e.y - 30;
        }
      }
    } else if (e.state === 'BEAM_APPROACH') {
      updateRecognizerBeamApproach(game, e, dt);
    } else if (e.state === 'BEAMING') {
      beamActive = true;
      updateRecognizerBeaming(game, e, dt);
    } else if (e.state === 'RETURNING') {
      const target = getFormationTarget(game, e);
      const dx = target.x - e.x;
      const dy = target.y - e.y;
      const dist = Math.hypot(dx, dy);
      const step = 255 * dt;
      if (dist <= step) {
        e.x = target.x;
        e.y = target.y;
        e.angle = 0;
        e.state = 'FORMATION';
      } else {
        e.x += (dx / dist) * step;
        e.y += (dy / dist) * step;
      }
    } else if (e.state === 'CHALLENGE_ELITE') {
      e.raidClock += dt;
      e.x += e.raidDir * e.raidSpeed * dt;
      e.y = e.raidLaneY + Math.sin(e.raidClock * 2.5) * 22;

      if (!e.challengeTwinFired && e.x > 64 && e.x < LOGICAL_W - 64) {
        e.challengeTwinFired = true;
        const isAresKind = e.type === 'ARES_REC' || e.type === 'MASTER_ARES_REC';
        spawnLightwing(game, e, e.isMaster, 0, -1, -18);
        spawnLightwing(game, e, false, 0, 1, 18);
        game.spawnPopup(
          e.x,
          e.y - 34,
          e.isMaster ? 'MASTER LAUNCH x2' : 'TWIN LAUNCH x2',
          isAresKind ? COLORS.aresRed : COLORS.cyan,
          1.25
        );
      }

      if ((e.raidDir > 0 && e.x > LOGICAL_W + 70) || (e.raidDir < 0 && e.x < -70)) {
        game.enemies.splice(i, 1);
        continue;
      }
    } else if (e.state === 'CHALLENGE_GUARD') {
      e.guardClock += dt;
      const boss = e.guardBroken
        ? null
        : game.enemies.find(b => b.guardGroup === e.guardTargetGroup && b.state === 'CHALLENGE_ELITE');

      if (boss) {
        // Shielding formation orbits & holds tightly around its Master Recognizer
        const swayX = Math.sin(e.guardClock * 3.4 + e.guardIdx * 1.1) * 8;
        const swayY = Math.cos(e.guardClock * 3.0 + e.guardIdx * 0.9) * 6;
        const tx = boss.x + e.guardOx + swayX;
        const ty = boss.y + e.guardOy + swayY;
        e.x += (tx - e.x) * Math.min(1, dt * 8.5);
        e.y += (ty - e.y) * Math.min(1, dt * 8.5);

        e.shotCooldown -= dt;
        if (e.shotCooldown <= 0 && e.x > 24 && e.x < LOGICAL_W - 24 && p.alive) {
          const spd = Math.min(430, 275 + game.sector * 6);
          const col = boss.type === 'MASTER_ARES_REC' ? COLORS.aresRed : COLORS.cyan;
          fireAimedBullet(game, e.x, e.y + 10, spd, col, 0, 0.2);
          e.shotCooldown = 1.45 + Math.random() * 0.55;
        }
      } else {
        // Master Recognizer destroyed or exited — guards break off cleanly down-screen
        e.guardBroken = true;
        e.x += e.raidDir * 85 * dt;
        e.y += 235 * dt;
        if (e.y > LOGICAL_H + 54 || e.x < -64 || e.x > LOGICAL_W + 64) {
          game.enemies.splice(i, 1);
          continue;
        }
      }
    } else if (e.state === 'CHALLENGE_EXTRA') {
      const exited = updateChallengeExtraEnemy(game, e, dt);
      if (exited) {
        game.enemies.splice(i, 1);
        continue;
      }
    }

    updateCapturedFighterTether(game, e, dt);

    // Direct collision with player ship
    if (
      p.alive &&
      !p.capturedById &&
      p.invulnTimer <= 0 &&
      Math.hypot(e.x - p.x, e.y - p.y) < e.hitRadius + (p.dual ? 14 : 8)
    ) {
      game.damagePlayer();
    }
  }

  // Defensive orphan cleanup if captor enemy is no longer active
  if (
    game.capturedFighter &&
    !game.enemies.some(e => e.id === game.capturedFighter.ownerId && e.hasCapturedShip) &&
    game.player.capturedById !== game.capturedFighter.ownerId
  ) {
    game.capturedFighter = null;
  }

  if (beamActive) game.synth.startTractorBeam();
  else game.synth.stopTractorBeam();
}
