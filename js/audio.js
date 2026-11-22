/* =========================================================================
   PROCEDURAL 1982 TRON WEB AUDIO SYNTHESIZER
   ========================================================================= */

export class SynthEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.enabled = true;
    this.tractorOsc = null;
    this.tractorLfo = null;
    this.tractorGain = null;
  }

  unlock() {
    if (!this.enabled) return;
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.28;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch {
      // Audio unavailable
    }
  }

  setEnabled(flag) {
    this.enabled = flag;
    if (!flag) this.stopTractorBeam();
    else this.unlock();
  }

  tone(f1, f2, dur, type = 'sawtooth', vol = 0.22, delay = 0) {
    if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
    try {
      const now = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(24, f1), now);
      if (f2 !== f1) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(24, f2), now + dur);
      }
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(now);
      osc.stop(now + dur + 0.02);
    } catch {}
  }

  noise(dur, vol = 0.22, freq = 900) {
    if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
    try {
      const now = this.ctx.currentTime;
      const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq, now);
      filter.Q.value = 1.2;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      src.start(now);
    } catch {}
  }

  playLaser(weakened = false) {
    if (weakened) {
      this.tone(580, 210, 0.085, 'sawtooth', 0.14);
    } else {
      this.tone(1140, 310, 0.075, 'square', 0.14);
    }
  }

  playMissileLaunch() {
    this.tone(760, 1340, 0.06, 'triangle', 0.16);
    this.noise(0.08, 0.11, 1800);
  }

  playContinuousLaserTick() {
    this.tone(240, 310, 0.07, 'sawtooth', 0.13);
    this.tone(880, 740, 0.06, 'square', 0.09);
  }

  playCapsuleSpawn() {
    this.tone(520, 780, 0.07, 'square', 0.15, 0);
    this.tone(780, 1040, 0.09, 'square', 0.15, 0.06);
  }

  playPowerupPickup(type) {
    const notes = type === 'CYAN'
      ? [523.25, 659.25, 1046.5, 1318.5]
      : (type === 'PURPLE'
        ? [440.0, 587.33, 880.0, 1174.66]
        : [392.0, 523.25, 783.99, 1046.5]);
    notes.forEach((f, i) => this.tone(f, f * 1.04, 0.11, 'square', 0.18, i * 0.055));
  }

  playArcWave() {
    this.tone(310, 760, 0.19, 'sine', 0.22);
    this.tone(460, 920, 0.16, 'triangle', 0.14, 0.02);
  }

  playPurpleBullet(weakened = false) {
    this.tone(weakened ? 780 : 1460, weakened ? 320 : 520, 0.06, 'square', 0.13);
  }

  playProjectileVoid() {
    this.tone(1420, 2100, 0.055, 'sine', 0.12);
  }

  playCannonCharge() {
    this.tone(180, 960, 0.56, 'sawtooth', 0.2);
    this.tone(360, 1440, 0.52, 'triangle', 0.14, 0.04);
  }

  playCannonBoom() {
    this.noise(0.46, 0.36, 420);
    this.tone(220, 38, 0.44, 'sawtooth', 0.32);
    this.tone(520, 90, 0.28, 'square', 0.18, 0.03);
  }

  playArmorPing() {
    this.tone(440, 740, 0.07, 'triangle', 0.2);
  }

  playDerez(big = false) {
    this.noise(big ? 0.34 : 0.18, big ? 0.3 : 0.2, big ? 480 : 1150);
    this.tone(big ? 250 : 480, 48, big ? 0.32 : 0.17, 'sawtooth', big ? 0.25 : 0.15);
  }

  playRibbonDeflect() {
    this.tone(940, 1520, 0.07, 'triangle', 0.2);
  }

  playRibbonShatter() {
    this.noise(0.2, 0.24, 1650);
    this.tone(1280, 240, 0.2, 'sawtooth', 0.22);
  }

  playShotSlow() {
    this.tone(560, 200, 0.12, 'sine', 0.16);
  }

  playDebuff(isAres = false) {
    this.tone(isAres ? 340 : 480, 110, 0.24, 'sawtooth', 0.22);
    this.tone(isAres ? 185 : 290, 95, 0.25, 'square', 0.14, 0.04);
  }

  playLightwingLaunch(isAres = false) {
    this.tone(isAres ? 300 : 620, isAres ? 160 : 940, 0.12, 'sawtooth', 0.14);
  }

  playWingSurge(isAres = false) {
    this.tone(isAres ? 420 : 540, isAres ? 680 : 860, 0.09, 'square', 0.18, 0);
    this.tone(isAres ? 680 : 860, isAres ? 1020 : 1280, 0.13, 'square', 0.19, 0.07);
  }

  playRescue() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      this.tone(f, f * 1.02, 0.14, 'square', 0.2, i * 0.085);
    });
  }

  playSectorStart(isChallenge = false) {
    const notes = isChallenge ? [440, 554.37, 659.25, 880] : [392, 523.25, 659.25];
    notes.forEach((f, i) => this.tone(f, f, 0.13, 'triangle', 0.18, i * 0.085));
  }

  playGameOver() {
    [440, 392, 349.23, 261.63, 196].forEach((f, i) => {
      this.tone(f, f * 0.92, 0.2, 'sawtooth', 0.2, i * 0.12);
    });
  }

  startTractorBeam() {
    if (!this.enabled || !this.ctx || this.ctx.state !== 'running' || this.tractorOsc) return;
    try {
      const osc = this.ctx.createOscillator();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 215;
      lfo.frequency.value = 8.5;
      lfoGain.gain.value = 55;
      gain.gain.value = 0.13;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start();
      lfo.start();
      this.tractorOsc = osc;
      this.tractorLfo = lfo;
      this.tractorGain = gain;
    } catch {}
  }

  stopTractorBeam() {
    if (this.tractorOsc) {
      try { this.tractorOsc.stop(); } catch {}
      this.tractorOsc = null;
    }
    if (this.tractorLfo) {
      try { this.tractorLfo.stop(); } catch {}
      this.tractorLfo = null;
    }
    this.tractorGain = null;
  }
}
