<div align="center">

# SZARKK

**SENTIENT ZENITH AUGMENTATION RECURSIVE KNOWLEDGE KERNEL**

A neon arcade shooter for the browser.  
Pilot the AUREX fighter, stack capsules, and carve a path through the Nexus.

[![Play Now](https://img.shields.io/badge/%E2%96%B6_PLAY_NOW-00f6ff?style=for-the-badge&labelColor=05080c)](https://szarkk.github.io/SZARKK/)
[![Version](https://img.shields.io/badge/Alpha_Test-0.1.3-ff1e42?style=for-the-badge&labelColor=05080c)](https://szarkk.github.io/SZARKK/)

**[ENTER THE NEXUS](https://szarkk.github.io/SZARKK/)** — phone or desktop, no install.

*Early test build. Expect rough edges.*

</div>

---

## Features

- **2D dodge zone** — weave freely across the bottom 2/5ths of the arena
- **Dual-Fighter** — break a V1 Enforcer tractor beam without hitting your captured ship and unlock twin-volley fire
- **Six stackable capsules** — shoot floating mid-arena pickups to charge Cyan, Red, Purple, Yellow, Clone, and Plasma gauges
- **Nose-locked red laser** — a piercing beam locked to the fighter that drains only while firing (2x DPS vs Normal-tier enemies). The 32-bit skin draws it as a solid plasma lance
- **Chain Lightning & Fighter Clones** — short-range arcing bolts (with bullet ricochet, a 3-plane repel, and a death Cross Lightning blast) and a trio of autonomous holograms from Sector 07
- **Plasma Rings** — aim and fire 3 piercing rings, then bounce them off an 8-second ricochet border (Sector 08+)
- **Sector campaign** — 4 waves per sector, with a Challenge stage after every 2nd sector
- **Enforcers, Centoids, Super Centoids, Centophages & Pulsars** — Flux / Null Elites and Masters, splitting serpents, a hunting Master serpent, and fire-jamming Pulsars
- **Hard Mode [SEC 06+]** — start already at Sector 06 intensity, with the full roster and all six capsules unlocked from H01, plus Masters and CRT Field debuffs
- **Hangar & skins** — default 32-bit Aurex Fighter and Nexus Fleet art, with the Alpha Test 0.1.2 neon wireframe kept as a legacy skin
- **Training / Sandbox** — infinite-lives arena to deploy enemies, test loadouts, and simulate real sectors
- **Local leaderboard** — top 10 scores per mode, saved in your browser with callsign, sector, and accuracy
- **Nexus Archive** — in-game tactical database of ships, enemies, and power-ups
- **CRT / SFX / Auto-Fire** — toggle scanlines, sound, and continuous fire from the HUD

## Controls

Move anywhere in the **bottom 2/5ths** of the arena. Auto-Fire off lets you conserve power-ups; toggle it on for continuous fire.

### Desktop

| Action | Input |
| :--- | :--- |
| Move (2D) | `WASD` or Arrow Keys |
| Fire | `Space`, `Z`, `J`, or Click |
| Auto-Fire | `F` |
| Pause | `P` or `Esc` |
| Mute | `M` |

The HUD also has **AUTO**, **CRT**, **SFX**, and pause buttons. Switch to **Touch UI** from the dock if you want on-screen fire. Open **SKINS** from the main menu or pause screen to swap Hangar looks.

### Touch

| Action | Input |
| :--- | :--- |
| Move | Touch and drag **anywhere below the dotted line** (you do not need to touch the ship) |
| Fire | Hold or tap **FIRE** with your other thumb |
| PC Mode | Switch back to the compact desktop keybar from the dock |

## Power-Ups

Capsules float mid-arena (20% chance each standard wave once unlocked) or drop one second after a destroyed enemy. **Shoot the capsule** to activate it. Gauges stack — different colors split the bottom meter. Active energy persists between sectors and Challenges.

| Capsule | Unlocks | What you get |
| :--- | :--- | :--- |
| **Cyan — Homing Missiles** | Sector 02, Wave 3+ | 30 conserved volleys of twin missiles. They track enemies, Enforcer Wings, and floating capsules within 2 planes (76 px) on either side. Shatter Null Threads in one hit and deal **1.3x** damage to Elite/Master Enforcers [Null]. |
| **Red — Continuous Laser** | Sector 03+ | 11 seconds of nose-locked piercing laser (drains **only while firing**). **2x** DPS vs Normal-tier enemies and **1.3x** vs Flux Enforcers. Blocked by Null Threads; Flux Threads convert the beam into slowed, dissolving bolts. |
| **Purple — Arc Wave** | Sector 04+ | 6 wide waves (0.5 dmg each) that void enemy shots. After the 6th wave, **double-tap Fire** for a massive AOE Cannon Shot (tap 1 charges, tap 2 fires — or it auto-fires after 3 seconds). |
| **Yellow — Chain Lightning** | Sector 07+ (also 10% Pulsar drop) | Turns the AUREX gold and charges 24 shots, fired as 3-bolt bursts (0.25s between bolts, 0.80s cooldown). Each hit deals 1 damage and jumps up to 200 px to as many as 8 additional targets. While the bolts are firing, incoming bullets ricochet into enemies, and colliding ships bounce 3 planes (114 px) back with firing disabled for 4s. Dying with this gauge active unleashes a full-screen Cross Lightning blast that one-shots everything in its path, then chains regular damage. |
| **Fighter Clones** | Sector 07+ (also 20% Super Centoid drop) | Deploys 3 hologram clones (left, right, back). They break off after 0.8s with 1s of invincibility and 4 HP each, firing 2x-speed dark-purple bolts for 20 seconds. The timer pauses between sectors, waves, and Challenges. Clones vanish if you die. |
| **Plasma Rings** | Sector 08+ (also 25% Centophage drop) | The ship pauses under a damage-blocking shield. You have 4s to aim a guided line (WASD / arrows, or drag on the playfield) and fire 3 piercing rings (2.5 dmg, 0.25s apart). If you wait, they auto-fire in 3 random directions. After the burst you get 0.5s of invincibility, and an 8s ricochet border starts on the first enemy or wall hit. |

## The Nexus

Start with **3 lives** (cap of 5). An extra fighter arrives at **20,000** points, then every **35,000**.

- Standard sectors run **4 waves**
- A **Challenge** stage starts after every 2nd sector (`Sec 02 → CH.01`, `Sec 04 → CH.02`, and so on)
- Perfect Challenge clear: **+10,000**. Otherwise: **+100** per hit
- Each wave, a unit has a **5%** chance to swap one tier up or down
- **Hard Mode** labels sectors `H01+` and Challenges `H-CH`. `H01` plays at Sector 06 intensity; `H-CH.01` starts at Challenge 3 rules (guarded Masters and extra rounds). The full roster and all six capsules are unlocked from `H01` (content through Sector 08). The first Master or Centophage kill in `H01` guarantees one random unlocked capsule. Hard Mode has its own hi-score and leaderboard. When a surviving Master or Elite Flux/Null Enforcer re-enters, there is a 50% chance of a 4s CRT Field (no power-up minimum): Flux Field slows move and fire rate by 1.5x; Null Field reduces your damage to 0.33x

### Hostiles

Points are formation / diving unless noted.

| Unit | Debut | HP | Points | Notes |
| :--- | :--- | ---: | ---: | :--- |
| Drone | Sector 01 | 1 | 50 / 100 | Swarming scouts. Rare capsule drop from Sec 02 W3 |
| Interceptor | Sector 01 | 1 | 80 / 160 | Wide-arc divers that fire amber plasma |
| V1 Enforcer | Early sectors | 3 | 150 / 400 | Tractor beam kidnap for Dual-Fighter. At 1 HP, proximity to Flux or Null shifts its color and bursts an AOE buff on death (+30% speed or +33% HP) |
| Centoid | Sector 04+ | 8 segments (head 4 / body 1) | 220 head / 60 seg | Horizontal zig-zag serpent. Headshots erase the whole chain with no split. Otherwise it can split (max 2 living snakes) |
| Elite Enforcer [Flux] | Sec 02, Wave 3+ | 6 (12 in CH.2+ raids) | 350 / 900 | 10% abduction chance per wave. Cyan Enforcer Wings paint Flux Threads that slow your ship and dissolve bullets |
| Elite Enforcer [Null] | Sector 03+ | 6 (12 in CH.2+ raids) | 400 / 1000 | 10% abduction chance per wave. Crimson wings paint Null Threads that block shots (6 hits) and inflict Slow + −20% DMG |
| Super Centoid | Sector 07+ | 10 segments (head 6 / body 2) | 450 head / 120 seg | Elite 90°-corridor serpent (formerly Alpha Centoid). Headshots insta-clear the chain. 20% chance to drop Fighter Clones |
| Pulsar | Sector 07+ | 6 | 380 / 950 | Electro orbs jam firing for 2s (no HP damage). Death sparks halve fire rate for 4s. 10% chance to drop Chain Lightning |
| Master Enforcer [Flux / Null] | Sector 06+ | 18 | 750 / 1800 · 850 / 2000 | Aura-ringed dreadnoughts. Kill 10 of one type without dying for a glowing reward capsule. Guarded in Challenge 3+ / Hard Mode |
| Centophage | Sector 08+ | 6+ segments (head 8 / body 3, cap 24) | 1200 head / 250 seg | Master-tier hunter, 1.8× Super Centoid speed (284 px/s). Every 2s has an 80% chance to chase a non-Centoid Normal, Advanced, or Elite unit (6s cooldown on a miss) and devour it for +1 / +2 / +3 segments (no score for the prey). Independent drops: 25% Plasma Rings, 7% Clones, 7% Chain Lightning |
| Enforcer Wings | Deployed by Elites & Masters | 1 | 150 | High-speed drones that paint cyan Flux Threads or crimson Null Threads |

## Training / Sandbox

Open **TRAINING / SANDBOX** from the main menu for an infinite-lives test arena. Deploy or drag any enemy (including Centophages), float or tap-place capsules, toggle Dual-Fighter and all six power-ups, pause idle animation, and switch enemies between attack and idle. You can also run a **Training Round** that simulates a real Normal or Hard sector.

Sandbox runs are for practice — they do not write to the leaderboard.

## Leaderboard

After Game Over, record an 8-character **callsign** to a **top 10** board (Normal and Hard are separate). Each run stores score, sector, and accuracy in your browser. Clearing the board takes a two-step confirmation. On phones under 430 px wide, the columns are tightened so rank, callsign, score, sector, and accuracy still fit.

## Play locally

This project uses ES modules, so **double-clicking `index.html` will not work** (`file://` blocks the scripts). Serve the folder instead.

```bash
cd SZARKK
python -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

Or, in VS Code / Antigravity, right-click `index.html` → **Open with Live Server**.

You can also skip the local setup and [play the live build](https://szarkk.github.io/SZARKK/).

## Project structure

```
index.html              # Game shell, HUD, overlays, Hangar, and sandbox UI
css/style.css           # Neon arcade UI
js/
  main.js               # Game loop and boot
  config.js             # Version, tuning, and Nexus Archive catalog
  player.js             # AUREX movement and fire
  enemies.js            # Sectors, waves, and Challenge stages
  enforcers.js          # Tractor beam, Flux / Null Elites & Masters, Wings
  special_enemies.js    # Centoids, Super Centoids, Centophages, Pulsars, swaps
  powerups.js           # Capsules and stackable gauges
  projectiles.js        # Shots, laser, threads, Arc Wave, lightning, clones, rings
  skins.js              # Hangar registry (32-bit default + Alpha Test 0.1.2 legacy)
  sprite_loader.js / sprite_manifest.js / animator.js
  sandbox.js            # Training / Sandbox arena
  renderer.js / sprites.js / ui.js / audio.js
  renderers/            # 32-bit Saturn ship, fleet, and combat FX
  leaderboard.js        # Local top 10 (Normal / Hard)
  utils.js
assets/                 # Palettes and installed sprite manifest
tools/export_sprites.html
legacy/index-original.html   # Earlier single-file snapshot
```

## Status

**Alpha Test 0.1.3** — a public early test. Systems are in and playable, but this is still a work in progress. Feedback welcome.

What's new in 0.1.3: default 32-bit Hangar skins (with the 0.1.2 wireframe kept as Legacy), the Centophage, Plasma Rings, Chain Lightning ricochet / repel / death Cross, tougher Super Centoids (10 segments, 6/2 HP) and Centoids (4 HP heads), Null Field now at 0.33x damage, and Hard Mode unlocking the full roster from H01.

## Credits

Created by [Szarkk](https://github.com/Szarkk).

Inspired by classic arcade formation shooters.
