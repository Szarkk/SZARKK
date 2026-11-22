/* =========================================================================
   ENEMY SPAWNING, SECTORS, CHALLENGE STAGES & FORMATION / DIVE AI
   ========================================================================= */

import {
  CHALLENGE_ELITE_START,
  CHALLENGE_INTERVAL,
  COLORS,
  ELITE_START_SECTOR,
  ELITE_SURGE_INTERVAL,
  FLOATING_CAPSULE_CHANCE,
  LOGICAL_H,
  LOGICAL_W,
  POWERUP_START_SECTOR,
  TRACTOR_INITIAL_DELAY,
  TRACTOR_INTERVAL
} from './config.js';
import { clamp, evalCubic } from './utils.js';
import { rollEnemyCapsuleDrop } from './powerups.js';
import {
  handleRecognizerDestroyed,
  spawnLightwing,
  startRecognizerBeam,
  updateCapturedFighterTether,
  updateRecognizerBeamApproach,
  updateRecognizerBeaming
} from './recognizers.js';

export function beginSector(game, num) {
  game.sector = num;
  game.enemies = [];
  game.enemyBullets = [];
  game.lightwings = [];
  game.ribbonTrails = [];
  game.capsules = [];
  game.pendingCapsuleDrops = [];
  game.activeBeamBoss = null;
  game.tractorTimer = TRACTOR_INITIAL_DELAY;
  game.redLaserActive = false;
  game.redLaserPulseTimer = 0;
  game.activeLaserBeams = [];
  game.synth.stopTractorBeam();
  game.waveQueue = [];
  game.formationClock = 0;

  // Starting at Sector 05, 50% chance per sector for a floating capsule
  if (num >= POWERUP_START_SECTOR && Math.random() < FLOATING_CAPSULE_CHANCE) {
    game.floatingCapsulePlan = {
      timer: 4.5 + Math.random() * 5.0,
      spawned: false
    };
  } else {
    game.floatingCapsulePlan = null;
  }

  const isChallenge = num % CHALLENGE_INTERVAL === 0;
  game.challengeNum = isChallenge ? Math.floor(num / CHALLENGE_INTERVAL) : 0;
  game.sectorPhase = 'BANNER';
  game.phaseTimer = 1.9;

  if (isChallenge) {
    game.challengeHits = 0;
    game.bannerTitle = `DATA STREAM // CH.${String(game.challengeNum).padStart(2, '0')}`;
    game.bannerSub = game.challengeNum >= CHALLENGE_ELITE_START
      ? 'ALERT: 2X HP ELITE RAIDERS DETECTED'
      : `CHALLENGING SECTOR ${String(num).padStart(2, '0')} // BONUS WAVE`;
    game.bannerColor = game.challengeNum >= CHALLENGE_ELITE_START ? COLORS.aresRed : COLORS.gold;
    buildChallengeWaveQueue(game, game.challengeNum);
  } else {
    game.bannerTitle = `SECTOR ${String(num).padStart(2, '0')}`;
    game.bannerSub = num < ELITE_START_SECTOR
      ? (num === 1 ? 'CLASSIC MCP PATROL INBOUND' : 'MCP SQUADRON INTENSIFYING')
      : (num === 3
        ? 'WARNING: ELITE LEGACY RECOGNIZER DETECTED'
        : (num === 5
          ? 'ARES ELITE & POWER CAPSULES ONLINE'
          : (num === 7
            ? 'PURPLE ARC WAVE CAPSULES ONLINE'
            : 'ELITE RECOGNIZER FLEET INBOUND')));
    game.bannerColor = num === 5 ? COLORS.aresRed : (num === 7 ? COLORS.purple : COLORS.cyan);
    buildStandardWaveQueue(game, num);
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
  return {
    types: ['CLASSIC_REC', 'LEGACY_REC', 'CLASSIC_REC', 'CLASSIC_REC', 'ARES_REC', 'CLASSIC_REC'],
    xs: [64, 134, 204, 276, 346, 416]
  };
}

export function buildStandardWaveQueue(game, sec) {
  const slots = [];
  const top = buildTopRowConfig(sec);
  top.types.forEach((type, idx) => {
    slots.push({ type, homeX: top.xs[idx], homeY: 92, squad: idx % 2 });
  });

  // 2 rows of Interceptors (6 per row)
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 6; c++) {
      slots.push({
        type: 'INTERCEPTOR',
        homeX: 80 + c * 64,
        homeY: 152 + r * 42,
        squad: 2 + (c >= 3 ? 1 : 0)
      });
    }
  }

  // 2 rows of Bit-Drones (8 per row)
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 8; c++) {
      slots.push({
        type: 'DRONE',
        homeX: 54 + c * 53,
        homeY: 238 + r * 38,
        squad: 4
      });
    }
  }

  slots.sort((a, b) => a.squad - b.squad);
  slots.forEach((s, i) => {
    const fromLeft = s.squad % 2 === 0;
    const sx = fromLeft ? -30 : LOGICAL_W + 30;
    const path = [
      { x: sx, y: 120 + s.squad * 26 },
      { x: fromLeft ? 340 : 140, y: 315 },
      { x: fromLeft ? 120 : 360, y: 205 },
      { x: s.homeX, y: s.homeY }
    ];
    game.waveQueue.push({
      delay: 0.25 + i * 0.11,
      type: s.type,
      homeX: s.homeX,
      homeY: s.homeY,
      path,
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
        delay: s * 2.4 + i * 0.16,
        type: types[s],
        homeX: p3.x,
        homeY: p3.y,
        path: [p0, p1, p2, p3],
        challenge: true,
        challengeElite: false
      });
    }
  }

  // Starting at Challenge 3: Independent 2x HP Elite Recognizer Raiders that fire 2 Lightwings at once
  if (challengeNum >= CHALLENGE_ELITE_START) {
    const eliteRaids = challengeNum === CHALLENGE_ELITE_START
      ? [
          { delay: 2.2, type: 'LEGACY_REC', dir: 1, laneY: 96, speed: 74 },
          { delay: 6.4, type: 'ARES_REC', dir: -1, laneY: 146, speed: 74 }
        ]
      : [
          { delay: 1.8, type: 'LEGACY_REC', dir: 1, laneY: 92, speed: 76 },
          { delay: 5.4, type: 'ARES_REC', dir: -1, laneY: 144, speed: 76 },
          { delay: 9.0, type: challengeNum % 2 === 0 ? 'ARES_REC' : 'LEGACY_REC', dir: 1, laneY: 190, speed: 78 }
        ];

    game.challengeTotal += eliteRaids.length;
    for (const raid of eliteRaids) {
      game.waveQueue.push({
        delay: raid.delay,
        type: raid.type,
        homeX: LOGICAL_W * 0.5,
        homeY: raid.laneY,
        path: null,
        challenge: true,
        challengeElite: true,
        startX: raid.dir > 0 ? -44 : LOGICAL_W + 44,
        raidDir: raid.dir,
        raidLaneY: raid.laneY,
        raidSpeed: raid.speed
      });
    }
    game.waveQueue.sort((a, b) => a.delay - b.delay);
  }

  game.waveSpawnTimer = 0;
}

export function spawnEnemyFromItem(game, item) {
  const isRec = item.type.endsWith('_REC');
  const isElite = item.type === 'LEGACY_REC' || item.type === 'ARES_REC';
  const isChallengeElite = !!item.challengeElite;
  const maxHp = isChallengeElite ? 6 : (
    item.challenge ? 1 : (
      isElite ? 3 : (item.type === 'CLASSIC_REC' ? 2 : 1)
    )
  );

  const ptsForm = isChallengeElite ? 1200 : (item.challenge ? 100 : (
    item.type === 'ARES_REC' ? 350 :
    item.type === 'LEGACY_REC' ? 300 :
    item.type === 'CLASSIC_REC' ? 150 :
    item.type === 'INTERCEPTOR' ? 80 : 50
  ));
  const ptsDive = isChallengeElite ? 1200 : (item.challenge ? 100 : (
    item.type === 'ARES_REC' ? 900 :
    item.type === 'LEGACY_REC' ? 800 :
    item.type === 'CLASSIC_REC' ? 400 :
    item.type === 'INTERCEPTOR' ? 160 : 100
  ));

  const startX = isChallengeElite ? item.startX : item.path[0].x;
  const startY = isChallengeElite ? item.raidLaneY : item.path[0].y;

  game.enemies.push({
    id: game.enemyIdSeq++,
    type: item.type,
    isRec,
    isElite,
    isChallengeElite,
    hitRadius: isElite ? 26 : (isRec ? 20 : 16),
    maxHp,
    hp: maxHp,
    ptsForm,
    ptsDive,
    x: startX,
    y: startY,
    homeX: item.homeX,
    homeY: item.homeY,
    angle: 0,
    state: isChallengeElite ? 'CHALLENGE_ELITE' : (item.challenge ? 'CHALLENGE' : 'ENTERING'),
    path: item.path,
    pathT: 0,
    pathDur: item.challenge ? 3.2 : 1.5,
    hitFlash: 0,
    animPhase: Math.random() * Math.PI * 2,
    diveT: 0,
    divePath: null,
    beamTimer: 0,
    beamShield: 0,
    beamApproachT: 0,
    beamStartX: startX,
    beamStartY: startY,
    beamFlankX: startX,
    hasCapturedShip: false,
    shotCooldown: 0.4 + Math.random() * 0.8,
    wingSurgeQueue: 0,
    wingSurgeTimer: 0,
    surgePulse: 0,
    raidDir: item.raidDir || 1,
    raidLaneY: item.raidLaneY || 110,
    raidSpeed: item.raidSpeed || 74,
    raidClock: 0,
    challengeTwinFired: false
  });

  if (isChallengeElite) {
    game.spawnPopup(
      LOGICAL_W * 0.5,
      startY - 12,
      item.type === 'ARES_REC' ? 'ARES RAIDER [2X HP]' : 'LEGACY RAIDER [2X HP]',
      item.type === 'ARES_REC' ? COLORS.aresRed : COLORS.cyan,
      1.3
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
  game.sectorPhase = 'CLEARED';
  game.phaseTimer = 2.4;
}

export function launchFormationDiver(game) {
  const ready = game.enemies.filter(e => e.state === 'FORMATION');
  if (ready.length === 0) return;

  // Prioritize Classic MCP Recognizer Tractor Beam opportunity if eligible
  if (
    !game.player.dual &&
    !game.capturedFighter &&
    !game.activeBeamBoss &&
    game.player.alive &&
    Math.random() < 0.28
  ) {
    const classicRecs = ready.filter(e => e.type === 'CLASSIC_REC' && !e.hasCapturedShip);
    if (classicRecs.length > 0) {
      const rec = classicRecs[Math.floor(Math.random() * classicRecs.length)];
      startRecognizerBeam(game, rec);
      game.tractorTimer = TRACTOR_INTERVAL;
      return;
    }
  }

  const diver = ready[Math.floor(Math.random() * ready.length)];
  diver.state = 'DIVING';
  diver.diveT = 0;
  const tx = clamp(game.player.x + (Math.random() - 0.5) * 85, 42, LOGICAL_W - 42);
  diver.divePath = [
    { x: diver.x, y: diver.y },
    { x: diver.x + (diver.x < LOGICAL_W * 0.5 ? 110 : -110), y: diver.y + 150 },
    { x: tx, y: LOGICAL_H - 92 },
    { x: tx + (Math.random() < 0.5 ? -95 : 95), y: LOGICAL_H + 58 }
  ];
  diver.shotCooldown = 0.55;
}

export function updateSectorPhase(game, dt) {
  if (game.sectorPhase === 'BANNER') {
    game.phaseTimer -= dt;
    if (game.phaseTimer <= 0) {
      game.sectorPhase = (game.sector % CHALLENGE_INTERVAL === 0) ? 'CHALLENGE' : 'ENTRY';
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
          game.diveTimer = 1.1;
          game.tractorTimer = TRACTOR_INITIAL_DELAY;
          game.wingLaunchTimer = 2.0;
        }
      } else if (game.sectorPhase === 'CHALLENGE' && game.enemies.length === 0 && game.lightwings.length === 0) {
        finishChallengeStage(game);
      }
    }
    return;
  }

  if (game.sectorPhase === 'COMBAT') {
    if (game.enemies.length === 0 && game.lightwings.length === 0) {
      game.sectorPhase = 'CLEARED';
      game.phaseTimer = 1.85;
      game.bannerTitle = `SECTOR ${String(game.sector).padStart(2, '0')} CLEARED`;
      game.bannerSub = 'ADVANCING GRID...';
      game.bannerColor = COLORS.emerald;
      return;
    }

    // Diving scheduler
    game.diveTimer -= dt;
    if (game.diveTimer <= 0) {
      launchFormationDiver(game);
      game.diveTimer = Math.max(0.85, 2.2 - game.sector * 0.1);
    }

    // Dedicated Classic MCP Recognizer Tractor Beam scheduler so kidnappings reliably trigger
    if (
      !game.player.dual &&
      !game.capturedFighter &&
      !game.activeBeamBoss &&
      game.player.alive
    ) {
      game.tractorTimer -= dt;
      if (game.tractorTimer <= 0) {
        const beamCandidates = game.enemies.filter(
          e => e.type === 'CLASSIC_REC' && e.state === 'FORMATION' && !e.hasCapturedShip
        );
        if (beamCandidates.length > 0) {
          const chosen = beamCandidates[Math.floor(Math.random() * beamCandidates.length)];
          startRecognizerBeam(game, chosen);
          game.tractorTimer = TRACTOR_INTERVAL;
        } else {
          // Retry shortly once a Classic Recognizer returns to formation
          game.tractorTimer = 1.2;
        }
      }
    }

    // Elite Lightwing scheduler
    const elitesInForm = game.enemies.filter(e => e.isElite && e.state === 'FORMATION');
    if (elitesInForm.length > 0) {
      game.wingLaunchTimer -= dt;
      if (game.wingLaunchTimer <= 0) {
        const boss = elitesInForm[Math.floor(Math.random() * elitesInForm.length)];
        spawnLightwing(game, boss, true, 0);
        game.wingLaunchTimer = Math.max(3.6, 5.8 - game.sector * 0.16);
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

  const col = e.type === 'ARES_REC' ? COLORS.aresRed
    : (e.type === 'LEGACY_REC' ? COLORS.cyan
      : (e.type === 'CLASSIC_REC' ? COLORS.mcpOrange
        : (e.type === 'INTERCEPTOR' ? COLORS.gold : COLORS.cyan)));

  game.spawnDerez(e.x, e.y, col, e.isElite ? 28 : 16, e.isElite ? 220 : 165);
  game.synth.playDerez(e.isElite || e.isRec);

  if (e.isElite) {
    game.shake = 0.18;
    game.hitStop = 0.03;
  }

  if (scored) {
    rollEnemyCapsuleDrop(game, e);

    if (game.sectorPhase === 'CHALLENGE') {
      game.challengeHits++;
      game.addScore(e.isChallengeElite ? 1200 : 100, e.x, e.y, e.isChallengeElite ? col : COLORS.gold);
    } else {
      const isDiving = e.state === 'DIVING' || e.state === 'BEAMING' || e.state === 'BEAM_APPROACH';
      game.addScore(isDiving ? e.ptsDive : e.ptsForm, e.x, e.y, col);
    }
  }
  game.enemies.splice(idx, 1);
}

export function updateEnemies(game, dt) {
  game.formationClock += dt;
  const swayX = Math.sin(game.formationClock * 1.15) * 24;
  const breath = 1 + Math.sin(game.formationClock * 1.8) * 0.045;
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
      const cx = LOGICAL_W * 0.5;
      e.x = cx + (e.homeX - cx) * breath + swayX;
      e.y = e.homeY + Math.sin(game.formationClock * 1.8 + e.homeX * 0.02) * 4;
      e.angle = 0;
    } else if (e.state === 'DIVING') {
      const diveDur = Math.max(1.85, 2.7 - game.sector * 0.08);
      e.diveT += dt / diveDur;
      const pos = evalCubic(e.divePath, clamp(e.diveT, 0, 1));
      e.x = pos.x;
      e.y = pos.y;

      e.shotCooldown -= dt;
      if (e.shotCooldown <= 0 && e.y < LOGICAL_H - 180 && p.alive) {
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        const d = Math.max(1, Math.hypot(dx, dy));
        const spd = 240 + game.sector * 8;
        game.enemyBullets.push({
          x: e.x,
          y: e.y + 12,
          vx: (dx / d) * spd,
          vy: (dy / d) * spd,
          color: e.type === 'ARES_REC' ? COLORS.aresRed : COLORS.amber
        });
        e.shotCooldown = 1.25;
      }

      if (e.diveT >= 1) {
        e.y = -32;
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
      const cx = LOGICAL_W * 0.5;
      const targetX = cx + (e.homeX - cx) * breath + swayX;
      const targetY = e.homeY + Math.sin(game.formationClock * 1.8 + e.homeX * 0.02) * 4;
      const dx = targetX - e.x;
      const dy = targetY - e.y;
      const dist = Math.hypot(dx, dy);
      const step = 240 * dt;
      if (dist <= step) {
        e.x = targetX;
        e.y = targetY;
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
        spawnLightwing(game, e, false, 0, -1, -18);
        spawnLightwing(game, e, false, 0, 1, 18);
        game.spawnPopup(
          e.x,
          e.y - 32,
          'TWIN LAUNCH x2',
          e.type === 'ARES_REC' ? COLORS.aresRed : COLORS.cyan,
          1.25
        );
      }

      if ((e.raidDir > 0 && e.x > LOGICAL_W + 64) || (e.raidDir < 0 && e.x < -64)) {
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
