/* =========================================================================
   GRID GALAGA // 1982 — MAIN GAME ORCHESTRATOR & SIMULATION LOOP
   ========================================================================= */

import {
  COLORS,
  LOGICAL_H,
  LOGICAL_W,
  STORAGE_KEYS,
  TRACTOR_INITIAL_DELAY
} from './config.js';
import { readLS, writeLS } from './utils.js';
import { SynthEngine } from './audio.js';
import {
  createArcWaveState,
  createPowerupState,
  updatePowerupCapsules,
  updatePowerupTimers
} from './powerups.js';
import {
  applyRibbonDebuff,
  clampPlayerX,
  createPlayerState,
  damagePlayer,
  updatePlayer
} from './player.js';
import { updateLightwingsAndRibbons } from './recognizers.js';
import {
  beginSector,
  updateEnemies,
  updateSectorPhase
} from './enemies.js';
import {
  updateArcWavesAndCannon,
  updateContinuousLaserBeams,
  updateEnemyBullets,
  updateHomingMissiles,
  updatePlayerBullets
} from './projectiles.js';
import { renderFrame } from './renderer.js';
import {
  bindEvents,
  buildArchiveCards,
  cacheDomElements,
  hideAllOverlays,
  renderArchivePreviews,
  resetInputs,
  resizeCanvas,
  showGameOverOverlay,
  syncControlsUI,
  updateHUD,
  updateStatusPills
} from './ui.js';

export class GridGalagaGame {
  constructor() {
    cacheDomElements(this);

    this.synth = new SynthEngine();
    this.isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

    // Persistent Settings
    const savedCtrl = readLS(STORAGE_KEYS.ctrl, this.isTouch ? 'DRAG' : 'THREE_BTN');
    this.controlMode = ['DRAG', 'TOUCH_LR', 'THREE_BTN'].includes(savedCtrl) ? savedCtrl : 'DRAG';
    this.autoFire = readLS(STORAGE_KEYS.auto, this.isTouch && this.controlMode === 'TOUCH_LR' ? '1' : '0') === '1';
    this.crtEnabled = readLS(STORAGE_KEYS.crt, '1') === '1';
    this.sfxEnabled = readLS(STORAGE_KEYS.sfx, '1') === '1';
    this.synth.setEnabled(this.sfxEnabled);
    this.highScore = parseInt(readLS(STORAGE_KEYS.hi, '0'), 10) || 0;

    // Multi-Touch Isolation Maps
    this.keys = new Set();
    this.dirPointerMap = new Map();
    this.firePointerIds = new Set();
    this.dragPointerId = null;
    this.dragLastX = 0;
    this.dragActive = false;
    this.tapFireBuffer = 0;

    this.state = 'MENU'; // MENU | PLAYING | PAUSED | GAMEOVER
    this.modalReturnTo = 'MENU';
    this.clock = 0;
    this.gridOffset = 0;
    this.archivePreviews = [];

    // Background stars & demo fleet
    this.stars = Array.from({ length: 48 }, () => ({
      x: Math.random() * LOGICAL_W,
      y: Math.random() * LOGICAL_H,
      speed: 14 + Math.random() * 44,
      size: Math.random() < 0.35 ? 2 : 1.2,
      cyan: Math.random() < 0.72
    }));

    this.demoFleet = [
      { type: 'CLASSIC_REC', x: 112, y: 118, phase: 0 },
      { type: 'LEGACY_REC', x: 240, y: 102, phase: 1.2 },
      { type: 'ARES_REC', x: 368, y: 118, phase: 2.4 },
      { type: 'INTERCEPTOR', x: 155, y: 185, phase: 0.7 },
      { type: 'INTERCEPTOR', x: 325, y: 185, phase: 1.9 },
      { type: 'DRONE', x: 240, y: 212, phase: 3.1 }
    ];

    buildArchiveCards(this);
    this.resetGameData();
    bindEvents(this);
    syncControlsUI(this);
    updateHUD(this);
    resizeCanvas(this);

    this.lastFrame = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  resetGameData() {
    this.score = 0;
    this.nextExtraLife = 20000;
    this.sector = 1;
    this.lives = 3;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.dualRescues = 0;
    this.newRecord = false;
    this.gameOverTimer = 0;
    this.enemyIdSeq = 1;
    this.ribbonIdSeq = 1;
    this.waveQueue = [];
    this.waveSpawnTimer = 0;
    this.diveTimer = 1.5;
    this.tractorTimer = TRACTOR_INITIAL_DELAY;
    this.wingLaunchTimer = 2.5;
    this.challengeNum = 0;
    this.challengeHits = 0;
    this.challengeTotal = 0;

    this.shake = 0;
    this.hitStop = 0;
    this.formationClock = 0;
    this.sectorPhase = 'BANNER'; // BANNER | ENTRY | COMBAT | CHALLENGE | CLEARED
    this.phaseTimer = 0;
    this.bannerTitle = '';
    this.bannerSub = '';
    this.bannerColor = COLORS.cyan;

    this.powerup = createPowerupState();
    this.arcWaveState = createArcWaveState();

    this.capsules = [];
    this.pendingCapsuleDrops = [];
    this.floatingCapsulePlan = null;
    this.activeLaserBeams = [];
    this.redLaserActive = false;
    this.redLaserPulseTimer = 0;

    this.player = createPlayerState();
    this.capturedFighter = null;
    this.activeBeamBoss = null;

    this.playerBullets = [];
    this.homingMissiles = [];
    this.arcWaves = [];
    this.cannonShots = [];
    this.aoeBlasts = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.lightwings = [];
    this.ribbonTrails = [];
    this.particles = [];
    this.popups = [];
  }

  clampPlayerX() {
    clampPlayerX(this);
  }

  updateHUD() {
    updateHUD(this);
  }

  updateStatusPills() {
    updateStatusPills(this);
  }

  startNewGame() {
    this.synth.unlock();
    resetInputs(this);
    hideAllOverlays(this);
    this.resetGameData();
    this.state = 'PLAYING';
    this.player.invulnTimer = 1.4;
    beginSector(this, 1);
  }

  pauseGame() {
    if (this.state !== 'PLAYING') return;
    this.state = 'PAUSED';
    this.synth.stopTractorBeam();
    resetInputs(this);
    hideAllOverlays(this);
    this.overlayPause.classList.remove('hidden');
  }

  resumeGame() {
    if (this.state !== 'PAUSED') return;
    hideAllOverlays(this);
    this.state = 'PLAYING';
  }

  returnToMainMenu() {
    this.synth.stopTractorBeam();
    resetInputs(this);
    hideAllOverlays(this);
    this.resetGameData();
    this.state = 'MENU';
    updateStatusPills(this);
    updateHUD(this);
    this.overlayStart.classList.remove('hidden');
  }

  triggerGameOver() {
    this.state = 'GAMEOVER';
    this.gameOverTimer = 0;
    this.synth.stopTractorBeam();
    this.synth.playGameOver();
    resetInputs(this);
    hideAllOverlays(this);
    showGameOverOverlay(this);
  }

  damagePlayer() {
    damagePlayer(this);
  }

  applyRibbonDebuff(variant) {
    applyRibbonDebuff(this, variant);
  }

  addScore(pts, x, y, color = COLORS.cyan) {
    this.score += pts;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.newRecord = true;
      writeLS(STORAGE_KEYS.hi, this.highScore);
    }
    if (this.score >= this.nextExtraLife) {
      this.lives = Math.min(5, this.lives + 1);
      this.nextExtraLife += 35000;
      this.spawnPopup(this.player.x, this.player.y - 38, '1UP // EXTRA FIGHTER', COLORS.emerald, 1.5);
      this.synth.playRescue();
    }
    if (x !== undefined && y !== undefined) {
      this.spawnPopup(x, y, `+${pts}`, color, 0.9);
    }
    updateHUD(this);
  }

  spawnPopup(x, y, text, color = COLORS.cyan, life = 1.1) {
    this.popups.push({ x, y, text, color, life, maxLife: life });
  }

  spawnDerez(x, y, color, count = 14, speed = 165) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 32 + Math.random() * speed;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0.3 + Math.random() * 0.42,
        maxLife: 0.72,
        size: 2 + Math.random() * 4,
        color,
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 9
      });
    }
  }

  updateParticlesAndPopups(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.rot += pt.vrot * dt;
      pt.life -= dt;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const pop = this.popups[i];
      pop.y -= 28 * dt;
      pop.life -= dt;
      if (pop.life <= 0) this.popups.splice(i, 1);
    }
  }

  update(dt) {
    this.clock += dt;
    this.gridOffset = (this.gridOffset + dt * 1.45) % 1;

    for (const s of this.stars) {
      s.y += s.speed * dt;
      if (s.y > LOGICAL_H) {
        s.y = -4;
        s.x = Math.random() * LOGICAL_W;
      }
    }

    if (this.state !== 'PLAYING') return;

    if (this.gameOverTimer > 0) {
      this.gameOverTimer -= dt;
      if (this.gameOverTimer <= 0) {
        this.gameOverTimer = 0;
        if (this.lives <= 0) {
          this.triggerGameOver();
          return;
        }
      }
    }

    if (this.hitStop > 0) {
      this.hitStop -= dt;
      return;
    }
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt);

    updatePowerupTimers(this, dt);
    updatePlayer(this, dt);
    updateSectorPhase(this, dt);
    updatePowerupCapsules(this, dt);
    updateEnemies(this, dt);
    updateLightwingsAndRibbons(this, dt);
    updateContinuousLaserBeams(this);
    updateArcWavesAndCannon(this, dt);
    updatePlayerBullets(this, dt);
    updateHomingMissiles(this, dt);
    updateEnemyBullets(this, dt);
    this.updateParticlesAndPopups(dt);
    updateStatusPills(this);
  }

  render() {
    renderFrame(this);
  }

  loop(now) {
    const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    this.update(dt);
    this.render();
    renderArchivePreviews(this);
    requestAnimationFrame((t) => this.loop(t));
  }
}

function boot() {
  window.__gridGalaga = new GridGalagaGame();
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
}
