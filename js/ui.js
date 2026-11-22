/* =========================================================================
   UI SYNCHRONIZATION, OVERLAYS, GRID ARCHIVE & MULTI-TOUCH INPUT BINDING
   ========================================================================= */

import {
  ARCHIVE_ENTRIES,
  ARC_WAVE_INTERVAL,
  ARC_WAVE_MAX,
  GAME_VERSION,
  LOGICAL_H,
  LOGICAL_W,
  STORAGE_KEYS,
  TAP_BUFFER_TIME
} from './config.js';
import { clamp, writeLS } from './utils.js';
import {
  drawEnemySprite,
  drawLightwingSprite,
  drawPixelCapsule,
  drawPlayerFighter
} from './sprites.js';

export function cacheDomElements(game) {
  game.canvas = document.getElementById('game-canvas');
  game.ctx = game.canvas.getContext('2d');
  game.stageContainer = document.getElementById('stage-container');
  game.crtOverlay = document.getElementById('crt-overlay');

  game.elScore = document.getElementById('hud-score');
  game.elHigh = document.getElementById('hud-high');
  game.elSector = document.getElementById('hud-sector');
  game.elLives = document.getElementById('hud-lives');
  game.elStartHigh = document.getElementById('start-high-val');
  game.elMenuCtrlChip = document.getElementById('menu-ctrl-chip');

  game.pillPwr = document.getElementById('pill-powerup');
  game.pillPwrLabel = document.getElementById('pill-pwr-label');
  game.pillPwrTime = document.getElementById('pill-pwr-time');
  game.pillPwrFill = document.getElementById('pill-pwr-fill');

  game.pillSlow = document.getElementById('pill-slow');
  game.pillSlowTime = document.getElementById('pill-slow-time');
  game.pillSlowFill = document.getElementById('pill-slow-fill');

  game.pillDmg = document.getElementById('pill-dmg');
  game.pillDmgTime = document.getElementById('pill-dmg-time');
  game.pillDmgFill = document.getElementById('pill-dmg-fill');

  game.btnCtrl = document.getElementById('btn-ctrl');
  game.btnAuto = document.getElementById('btn-auto');
  game.btnCrt = document.getElementById('btn-crt');
  game.btnSfx = document.getElementById('btn-sfx');
  game.btnPause = document.getElementById('btn-pause');

  game.overlayStart = document.getElementById('overlay-start');
  game.overlayControls = document.getElementById('overlay-controls');
  game.overlayArchive = document.getElementById('overlay-archive');
  game.overlayPause = document.getElementById('overlay-pause');
  game.overlayGameOver = document.getElementById('overlay-gameover');

  game.dockDot = document.getElementById('dock-dot');
  game.dockStatusText = document.getElementById('dock-status-text');
  game.lrFirePill = document.getElementById('lr-fire-pill');
  game.dockBtnRow = document.getElementById('dock-btn-row');
  game.touchLeft = document.getElementById('touch-left');
  game.touchRight = document.getElementById('touch-right');
  game.touchFire = document.getElementById('touch-fire');
  game.dragRow = document.getElementById('drag-row');
  game.dragPad = document.getElementById('drag-pad');
  game.dragSub = document.getElementById('drag-sub');
  game.dragThumb = document.getElementById('drag-thumb');
  game.dragFire = document.getElementById('drag-fire');

  const menuVer = document.getElementById('menu-version');
  const pauseVer = document.getElementById('pause-version');
  if (menuVer) menuVer.textContent = GAME_VERSION;
  if (pauseVer) pauseVer.textContent = GAME_VERSION;
}

export function buildArchiveCards(game) {
  const container = document.getElementById('archive-scroll');
  container.innerHTML = '';
  game.archivePreviews = [];

  for (const entry of ARCHIVE_ENTRIES) {
    const card = document.createElement('article');
    card.className = `archive-card ${entry.cardClass}`;

    const top = document.createElement('div');
    top.className = 'archive-card-top';

    const previewBox = document.createElement('div');
    previewBox.className = 'archive-preview-box';
    const pCanvas = document.createElement('canvas');
    pCanvas.className = 'archive-preview-canvas';
    pCanvas.width = 68;
    pCanvas.height = 58;
    previewBox.appendChild(pCanvas);
    game.archivePreviews.push({ id: entry.id, ctx: pCanvas.getContext('2d') });

    const meta = document.createElement('div');
    meta.className = 'archive-meta';
    meta.innerHTML = `
      <div class="archive-name-row">
        <span class="archive-name">${entry.name}</span>
        <span class="tier-badge ${entry.badgeClass}">${entry.badge}</span>
      </div>
      <div class="stat-chips">
        ${entry.stats.map(s => `<span class="stat-chip ${s.cls}">${s.text}</span>`).join('')}
      </div>
    `;

    top.appendChild(previewBox);
    top.appendChild(meta);

    const desc = document.createElement('p');
    desc.className = 'archive-desc';
    desc.textContent = entry.desc;

    card.appendChild(top);
    card.appendChild(desc);
    container.appendChild(card);
  }
}

export function renderArchivePreviews(game) {
  if (game.overlayArchive.classList.contains('hidden')) return;
  const t = game.clock;
  for (const p of game.archivePreviews) {
    const c = p.ctx;
    c.clearRect(0, 0, 68, 58);
    c.strokeStyle = 'rgba(0, 246, 255, 0.14)';
    c.lineWidth = 1;
    for (let gx = 17; gx < 68; gx += 17) {
      c.beginPath(); c.moveTo(gx, 0); c.lineTo(gx, 58); c.stroke();
    }
    for (let gy = 14; gy < 58; gy += 14) {
      c.beginPath(); c.moveTo(0, gy); c.lineTo(68, gy); c.stroke();
    }

    const bob = Math.sin(t * 2.6) * 2.5;
    if (p.id === 'PLAYER') {
      drawPlayerFighter(c, 34, 31 + bob, false, false, false, t);
    } else if (p.id === 'CAPSULE_CYAN') {
      drawPixelCapsule(c, 34, 29 + bob, 'CYAN', t, 1.35);
    } else if (p.id === 'CAPSULE_RED') {
      drawPixelCapsule(c, 34, 29 + bob, 'RED', t, 1.35);
    } else if (p.id === 'CAPSULE_PURPLE') {
      drawPixelCapsule(c, 34, 29 + bob, 'PURPLE', t, 1.35);
    } else if (p.id === 'LIGHTWING') {
      drawLightwingSprite(c, { variant: 'LEGACY', x: 22, y: 30 + bob, angle: -Math.PI / 2 });
      drawLightwingSprite(c, { variant: 'ARES', x: 46, y: 30 - bob, angle: -Math.PI / 2 });
    } else {
      const isElite = p.id === 'LEGACY_REC' || p.id === 'ARES_REC';
      drawEnemySprite(c, {
        type: p.id,
        x: 34,
        y: 30 + bob,
        hp: 3,
        maxHp: 3,
        hitFlash: 0,
        angle: 0
      }, t, isElite ? 0.96 : 0.92);
    }
  }
}

export function resetInputs(game) {
  game.keys.clear();
  game.dirPointerMap.clear();
  game.firePointerIds.clear();
  game.dragPointerId = null;
  game.dragActive = false;
  game.tapFireBuffer = 0;
  updateControlPressVisuals(game);
}

export function updateControlPressVisuals(game) {
  let l = false;
  let r = false;
  for (const d of game.dirPointerMap.values()) {
    if (d === 'LEFT') l = true;
    if (d === 'RIGHT') r = true;
  }
  game.touchLeft.classList.toggle('active', l);
  game.touchRight.classList.toggle('active', r);
  const f = game.firePointerIds.size > 0;
  game.touchFire.classList.toggle('active', f);
  game.dragFire.classList.toggle('active', f);
  game.lrFirePill.classList.toggle('active', f);
  game.dragPad.classList.toggle('dragging', game.dragActive);
}

export function resizeCanvas(game) {
  const rect = game.stageContainer.getBoundingClientRect();
  const w = Math.max(240, Math.floor(rect.width));
  const h = Math.max(240, Math.floor(rect.height));
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  game.canvas.width = Math.floor(w * dpr);
  game.canvas.height = Math.floor(h * dpr);
  game.ctx.setTransform((w * dpr) / LOGICAL_W, 0, 0, (h * dpr) / LOGICAL_H, 0, 0);
}

export function syncControlsUI(game) {
  const modeLabel = game.controlMode === 'DRAG' ? 'DRAG' : (game.controlMode === 'TOUCH_LR' ? 'L/R' : '3-BTN');
  const modeLong = game.controlMode === 'DRAG' ? 'DRAG' : (game.controlMode === 'TOUCH_LR' ? 'TOUCH L/R' : '3-BTN');

  game.btnCtrl.textContent = modeLabel;
  game.btnAuto.textContent = `AUTO:${game.autoFire ? 'ON' : 'OFF'}`;
  game.btnAuto.className = `hud-pill ${game.autoFire ? 'auto-on' : 'auto-off'}`;
  game.btnCrt.className = `hud-pill ${game.crtEnabled ? '' : 'is-off'}`;
  game.btnSfx.className = `hud-pill ${game.sfxEnabled ? '' : 'is-off'}`;
  game.crtOverlay.classList.toggle('crt-off', !game.crtEnabled);

  game.elMenuCtrlChip.textContent = `${modeLong} • AUTO: ${game.autoFire ? 'ON' : 'OFF'}`;
  game.canvas.classList.toggle('drag-cursor', game.controlMode === 'DRAG');

  const isDrag = game.controlMode === 'DRAG';
  game.dragRow.classList.toggle('hidden', !isDrag);
  game.dockBtnRow.classList.toggle('hidden', isDrag);
  game.touchFire.classList.toggle('hidden', game.controlMode !== 'THREE_BTN');
  game.lrFirePill.classList.toggle('hidden', !(game.controlMode === 'TOUCH_LR' && !game.autoFire));

  game.dockDot.className = `status-dot ${game.autoFire ? '' : 'manual'}`;
  if (isDrag) {
    game.dockStatusText.textContent = game.autoFire
      ? 'DRAG MODE // AUTO-FIRE WHILE TOUCHING'
      : 'DRAG + HOLD FIRE // INDEPENDENT 2-THUMB';
    game.dragSub.textContent = game.autoFire ? 'TOUCH TO STEER & FIRE' : 'DRAG HERE OR ON SCREEN';
  } else if (game.controlMode === 'TOUCH_LR') {
    game.dockStatusText.textContent = game.autoFire
      ? 'TOUCH L/R // SLIDE THUMB + AUTO-FIRE'
      : 'TOUCH L/R // SLIDE THUMB + FIRE PILL';
  } else {
    game.dockStatusText.textContent = game.autoFire
      ? '3-BTN ARCADE // AUTO-FIRE ENABLED'
      : '3-BTN ARCADE // INDEPENDENT HOLD-TO-FIRE';
  }

  document.querySelectorAll('.seg-btn').forEach((btn) => {
    btn.classList.toggle('selected', btn.dataset.mode === game.controlMode);
  });
  const modalAuto = document.getElementById('btn-ctrl-auto');
  modalAuto.textContent = `AUTO-FIRE: ${game.autoFire ? 'ON' : 'OFF'}`;
  modalAuto.className = `auto-toggle-btn ${game.autoFire ? 'on' : 'off'}`;
  document.getElementById('btn-ctrl-crt').textContent = `CRT: ${game.crtEnabled ? 'ON' : 'OFF'}`;
  document.getElementById('btn-ctrl-sfx').textContent = `SFX: ${game.sfxEnabled ? 'ON' : 'OFF'}`;

  const hint = document.getElementById('ctrl-modal-hint');
  if (game.controlMode === 'DRAG') {
    hint.textContent = 'Independent 2-thumb drag + hold-to-fire rapid pulse cannon.';
  } else if (game.controlMode === 'TOUCH_LR') {
    hint.textContent = '2 large Left/Right pads (or tap screen halves) with smooth thumb sliding.';
  } else {
    hint.textContent = 'Classic Left / Right / Hold-to-Fire arcade buttons.';
  }

  writeLS(STORAGE_KEYS.ctrl, game.controlMode);
  writeLS(STORAGE_KEYS.auto, game.autoFire ? '1' : '0');
  writeLS(STORAGE_KEYS.crt, game.crtEnabled ? '1' : '0');
  writeLS(STORAGE_KEYS.sfx, game.sfxEnabled ? '1' : '0');
}

export function updateHUD(game) {
  game.elScore.textContent = String(game.score).padStart(6, '0');
  game.elHigh.textContent = String(game.highScore).padStart(6, '0');
  game.elStartHigh.textContent = String(game.highScore).padStart(6, '0');
  game.elSector.textContent = String(game.sector).padStart(2, '0');

  let html = '';
  for (let i = 0; i < Math.max(0, game.lives); i++) {
    html += `<svg class="life-ship-svg" viewBox="0 0 20 22"><polygon points="10,1 19,19 10,14 1,19" fill="rgba(0,246,255,0.22)" stroke="#00f6ff" stroke-width="1.8"/></svg>`;
  }
  game.elLives.innerHTML = html;
}

export function updateStatusPills(game) {
  const p = game.player;
  if (game.powerup.type === 'PURPLE') {
    const aw = game.arcWaveState;
    game.pillPwr.classList.remove('hidden');
    game.pillPwr.className = 'status-pill pwr-purple';
    if (aw.phase === 'READY') {
      game.pillPwrLabel.textContent = 'ARC WAVE: TAP FIRE';
      game.pillPwrTime.textContent = '3 WAVES';
      game.pillPwrFill.style.width = '100%';
    } else if (aw.phase === 'CANNON_AURA') {
      game.pillPwrLabel.textContent = 'PURPLE AURA // CANNON';
      game.pillPwrTime.textContent = 'AOE';
      game.pillPwrFill.style.width = `${clamp((1 - aw.cannonTimer / 0.62) * 100, 0, 100)}%`;
    } else {
      const left = Math.max(0, ARC_WAVE_MAX - aw.wavesFired);
      game.pillPwrLabel.textContent = aw.firedBulletDuringWaves
        ? 'PURPLE SHOTS 1.5x'
        : 'ARC WAVE (HOLD FIRE!)';
      game.pillPwrTime.textContent = `${aw.wavesFired}/${ARC_WAVE_MAX}`;
      game.pillPwrFill.style.width = `${clamp(((left + (aw.waveTimer / ARC_WAVE_INTERVAL)) / ARC_WAVE_MAX) * 100, 8, 100)}%`;
    }
  } else if (game.powerup.type && game.powerup.timer > 0) {
    game.pillPwr.classList.remove('hidden');
    const isCyan = game.powerup.type === 'CYAN';
    game.pillPwr.className = `status-pill ${isCyan ? 'pwr-cyan' : 'pwr-red'}`;
    game.pillPwrLabel.textContent = isCyan ? 'HOMING MISSILES' : 'CONTINUOUS LASER';
    game.pillPwrTime.textContent = `${game.powerup.timer.toFixed(1)}s`;
    game.pillPwrFill.style.width = `${clamp((game.powerup.timer / game.powerup.maxTimer) * 100, 0, 100)}%`;
  } else {
    game.pillPwr.classList.add('hidden');
  }

  if (p.slowTimer > 0) {
    game.pillSlow.classList.remove('hidden');
    game.pillSlowTime.textContent = `${p.slowTimer.toFixed(1)}s`;
    game.pillSlowFill.style.width = `${clamp((p.slowTimer / Math.max(1, p.slowMax)) * 100, 0, 100)}%`;
  } else {
    game.pillSlow.classList.add('hidden');
  }

  if (p.dmgDebuffTimer > 0) {
    game.pillDmg.classList.remove('hidden');
    game.pillDmgTime.textContent = `${p.dmgDebuffTimer.toFixed(1)}s`;
    game.pillDmgFill.style.width = `${clamp((p.dmgDebuffTimer / p.dmgDebuffMax) * 100, 0, 100)}%`;
  } else {
    game.pillDmg.classList.add('hidden');
  }
}

export function hideAllOverlays(game) {
  game.overlayStart.classList.add('hidden');
  game.overlayControls.classList.add('hidden');
  game.overlayArchive.classList.add('hidden');
  game.overlayPause.classList.add('hidden');
  game.overlayGameOver.classList.add('hidden');
}

export function openModal(game, which, returnTo) {
  game.modalReturnTo = returnTo;
  hideAllOverlays(game);
  if (which === 'ARCHIVE') game.overlayArchive.classList.remove('hidden');
  else game.overlayControls.classList.remove('hidden');
}

export function closeModal(game) {
  hideAllOverlays(game);
  if (game.modalReturnTo === 'PAUSED') game.overlayPause.classList.remove('hidden');
  else game.overlayStart.classList.remove('hidden');
}

export function showGameOverOverlay(game) {
  const acc = game.shotsFired > 0 ? ((game.shotsHit / game.shotsFired) * 100).toFixed(1) : '0.0';
  document.getElementById('go-score').textContent = String(game.score).padStart(6, '0');
  document.getElementById('go-high').textContent = String(game.highScore).padStart(6, '0');
  document.getElementById('go-sector').textContent = String(game.sector).padStart(2, '0');
  document.getElementById('go-acc').textContent = `${acc}%`;
  document.getElementById('go-shots').textContent = String(game.shotsFired);
  document.getElementById('go-hits').textContent = String(game.shotsHit);
  document.getElementById('go-rescues').textContent = String(game.dualRescues);
  document.getElementById('go-record-badge').classList.toggle('hidden', !game.newRecord);
  game.overlayGameOver.classList.remove('hidden');
}

export function bindEvents(game) {
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => resizeCanvas(game)).observe(game.stageContainer);
  }
  window.addEventListener('resize', () => resizeCanvas(game));

  // Top HUD buttons
  game.btnCtrl.addEventListener('click', () => {
    game.synth.unlock();
    const order = ['DRAG', 'TOUCH_LR', 'THREE_BTN'];
    game.controlMode = order[(order.indexOf(game.controlMode) + 1) % order.length];
    resetInputs(game);
    syncControlsUI(game);
  });

  game.btnAuto.addEventListener('click', () => {
    game.synth.unlock();
    game.autoFire = !game.autoFire;
    syncControlsUI(game);
  });

  game.btnCrt.addEventListener('click', () => {
    game.crtEnabled = !game.crtEnabled;
    syncControlsUI(game);
  });

  game.btnSfx.addEventListener('click', () => {
    game.sfxEnabled = !game.sfxEnabled;
    game.synth.setEnabled(game.sfxEnabled);
    syncControlsUI(game);
  });

  game.btnPause.addEventListener('click', () => {
    if (game.state === 'PLAYING') game.pauseGame();
    else if (game.state === 'PAUSED') game.resumeGame();
  });

  // Main Menu, Pause, Game Over buttons
  document.getElementById('btn-start').addEventListener('click', () => game.startNewGame());
  document.getElementById('btn-replay').addEventListener('click', () => game.startNewGame());
  document.getElementById('btn-restart').addEventListener('click', () => game.startNewGame());
  document.getElementById('btn-resume').addEventListener('click', () => game.resumeGame());
  document.getElementById('btn-pause-menu').addEventListener('click', () => game.returnToMainMenu());
  document.getElementById('btn-go-menu').addEventListener('click', () => game.returnToMainMenu());

  // Archive & Controls modals
  document.getElementById('btn-open-archive').addEventListener('click', () => openModal(game, 'ARCHIVE', 'MENU'));
  document.getElementById('btn-pause-archive').addEventListener('click', () => openModal(game, 'ARCHIVE', 'PAUSED'));
  document.getElementById('btn-archive-back').addEventListener('click', () => closeModal(game));

  document.getElementById('btn-open-controls').addEventListener('click', () => openModal(game, 'CONTROLS', 'MENU'));
  document.getElementById('btn-pause-controls').addEventListener('click', () => openModal(game, 'CONTROLS', 'PAUSED'));
  document.getElementById('btn-ctrl-back').addEventListener('click', () => closeModal(game));

  document.querySelectorAll('.seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      game.controlMode = btn.dataset.mode;
      resetInputs(game);
      syncControlsUI(game);
    });
  });

  document.getElementById('btn-ctrl-auto').addEventListener('click', () => {
    game.autoFire = !game.autoFire;
    syncControlsUI(game);
  });
  document.getElementById('btn-ctrl-crt').addEventListener('click', () => {
    game.crtEnabled = !game.crtEnabled;
    syncControlsUI(game);
  });
  document.getElementById('btn-ctrl-sfx').addEventListener('click', () => {
    game.sfxEnabled = !game.sfxEnabled;
    game.synth.setEnabled(game.sfxEnabled);
    syncControlsUI(game);
  });

  // Sliding directional buttons (TOUCH_LR & THREE_BTN)
  const getDirFromBtnRow = (clientX) => {
    const leftRect = game.touchLeft.getBoundingClientRect();
    const rightRect = game.touchRight.getBoundingClientRect();
    const mid = (leftRect.right + rightRect.left) * 0.5;
    return clientX < mid ? 'LEFT' : 'RIGHT';
  };

  game.dockBtnRow.addEventListener('pointerdown', (e) => {
    if (e.target === game.touchFire || game.touchFire.contains(e.target)) return;
    e.preventDefault();
    game.synth.unlock();
    game.dirPointerMap.set(e.pointerId, getDirFromBtnRow(e.clientX));
    try { game.dockBtnRow.setPointerCapture(e.pointerId); } catch {}
    updateControlPressVisuals(game);
  }, { passive: false });

  game.dockBtnRow.addEventListener('pointermove', (e) => {
    if (!game.dirPointerMap.has(e.pointerId)) return;
    e.preventDefault();
    game.dirPointerMap.set(e.pointerId, getDirFromBtnRow(e.clientX));
    updateControlPressVisuals(game);
  }, { passive: false });

  // Independent Hold-to-Fire Buttons
  const bindFireEl = (el) => {
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      game.synth.unlock();
      game.firePointerIds.add(e.pointerId);
      game.tapFireBuffer = TAP_BUFFER_TIME;
      try { el.setPointerCapture(e.pointerId); } catch {}
      updateControlPressVisuals(game);
    }, { passive: false });
  };
  bindFireEl(game.touchFire);
  bindFireEl(game.dragFire);
  bindFireEl(game.lrFirePill);

  // Independent Drag Start (Trackpad & Canvas)
  const startDrag = (e) => {
    if (game.state !== 'PLAYING' || game.controlMode !== 'DRAG') return;
    if (game.firePointerIds.has(e.pointerId)) return;
    if (game.dragPointerId !== null && game.dragPointerId !== e.pointerId) return;
    e.preventDefault();
    game.synth.unlock();
    game.dragPointerId = e.pointerId;
    game.dragLastX = e.clientX;
    game.dragActive = true;
    updateControlPressVisuals(game);
  };
  game.dragPad.addEventListener('pointerdown', startDrag, { passive: false });

  game.canvas.addEventListener('pointerdown', (e) => {
    if (game.state !== 'PLAYING') return;
    game.synth.unlock();
    if (game.controlMode === 'DRAG') {
      startDrag(e);
    } else if (game.controlMode === 'TOUCH_LR') {
      e.preventDefault();
      const rect = game.canvas.getBoundingClientRect();
      game.dirPointerMap.set(e.pointerId, e.clientX < rect.left + rect.width * 0.5 ? 'LEFT' : 'RIGHT');
      updateControlPressVisuals(game);
    }
  }, { passive: false });

  // Global pointermove / pointerup so dragging never drops off-edge
  window.addEventListener('pointermove', (e) => {
    if (e.pointerId === game.dragPointerId && game.dragActive && game.state === 'PLAYING') {
      e.preventDefault();
      const dx = e.clientX - game.dragLastX;
      game.dragLastX = e.clientX;
      if (game.player.alive && !game.player.capturedById) {
        const rect = game.canvas.getBoundingClientRect();
        const scaleX = LOGICAL_W / Math.max(1, rect.width);
        const slowMult = game.player.slowTimer > 0 ? 0.45 : 1.0;
        game.player.x += dx * scaleX * 1.18 * slowMult;
        game.clampPlayerX();
      }
    } else if (game.dirPointerMap.has(e.pointerId) && game.controlMode === 'TOUCH_LR' && game.state === 'PLAYING') {
      const rect = game.canvas.getBoundingClientRect();
      if (e.clientY <= rect.bottom) {
        game.dirPointerMap.set(e.pointerId, e.clientX < rect.left + rect.width * 0.5 ? 'LEFT' : 'RIGHT');
        updateControlPressVisuals(game);
      }
    }
  }, { passive: false });

  const releasePointer = (e) => {
    if (e.pointerId === game.dragPointerId) {
      game.dragPointerId = null;
      game.dragActive = false;
      updateControlPressVisuals(game);
    }
    if (game.dirPointerMap.delete(e.pointerId)) {
      updateControlPressVisuals(game);
    }
    if (game.firePointerIds.delete(e.pointerId)) {
      updateControlPressVisuals(game);
    }
  };
  window.addEventListener('pointerup', releasePointer);
  window.addEventListener('pointercancel', releasePointer);

  [game.canvas, game.dragPad, game.dockBtnRow].forEach((el) => {
    el.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  });

  // Keyboard
  window.addEventListener('keydown', (e) => {
    const c = e.code;
    if (['ArrowLeft', 'ArrowRight', 'Space', 'KeyA', 'KeyD', 'KeyZ'].includes(c) && game.state === 'PLAYING') {
      e.preventDefault();
    }
    game.synth.unlock();
    if (c === 'KeyP' || c === 'Escape') {
      if (!game.overlayControls.classList.contains('hidden') || !game.overlayArchive.classList.contains('hidden')) {
        closeModal(game);
      } else if (game.state === 'PLAYING') {
        game.pauseGame();
      } else if (game.state === 'PAUSED') {
        game.resumeGame();
      }
      return;
    }
    if (c === 'KeyM') {
      game.sfxEnabled = !game.sfxEnabled;
      game.synth.setEnabled(game.sfxEnabled);
      syncControlsUI(game);
      return;
    }
    if ((c === 'Space' || c === 'KeyZ') && !game.keys.has(c)) {
      game.tapFireBuffer = TAP_BUFFER_TIME;
    }
    game.keys.add(c);
  });

  window.addEventListener('keyup', (e) => {
    game.keys.delete(e.code);
  });
}
