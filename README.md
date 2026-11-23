<div align="center">

# GRID GALAGA // 1982

**A neon arcade shooter for the browser.**  
Dive the Grid, stack capsules, and rescue your captured fighter before the Recognizers close in.

[![Play Now](https://img.shields.io/badge/%E2%96%B6_PLAY_NOW-00f6ff?style=for-the-badge&labelColor=05080c)](https://szarkk.github.io/SZARKK/)
[![Version](https://img.shields.io/badge/Alpha_Test-0.1.1-ff1e42?style=for-the-badge&labelColor=05080c)](https://szarkk.github.io/SZARKK/)

**[ENTER THE GRID](https://szarkk.github.io/SZARKK/)** — phone or desktop, no install.

*Early test build. Expect rough edges.*

</div>

---

## Features

- **2D dodge zone** — weave freely across the bottom 2/5ths of the arena
- **Dual-Fighter** — break a Classic MCP Recognizer tractor beam without hitting your captured ship and unlock twin-volley fire
- **Stackable capsules** — shoot floating mid-arena pickups to charge Cyan, Red, and Purple gauges (they stack and paint an RGB glow on your ship)
- **Nose-locked red laser** — a true piercing beam that stays locked to the fighter and drains only while firing
- **Sector campaign** — 4 waves per sector, with a Challenge stage after every 2nd sector
- **Elites & Masters** — Elite Recognizers from Sector 02/03, Master Recognizers from Sector 06+
- **Hard Mode [SEC 06+]** — start already at Sector 06 intensity, with full waves and Masters live
- **Local leaderboard** — top 10 scores per mode, saved in your browser with callsign, sector, and accuracy
- **Grid Archive** — in-game tactical database of ships, enemies, and power-ups
- **CRT / SFX / Auto-Fire** — toggle scanlines, sound, and continuous fire from the HUD

## Controls

Move anywhere in the **bottom 2/5ths** of the arena. Auto-Fire off lets you conserve power-ups; toggle it on for continuous fire.

### Desktop

| Action | Input |
| :--- | :--- |
| Move (2D) | `WASD` or Arrow Keys |
| Fire | `Space`, `Z`, or Click |
| Auto-Fire | `F` |
| Pause | `P` or `Esc` |
| Mute | `M` |

The HUD also has **AUTO**, **CRT**, **SFX**, and pause buttons. Switch to **Touch UI** from the dock if you want on-screen fire.

### Touch

| Action | Input |
| :--- | :--- |
| Move | Drag directly on or **below** your fighter (the extended handle keeps your finger off the ship) |
| Fire | Hold or tap **FIRE** with your other thumb |
| PC Mode | Switch back to the compact desktop keybar from the dock |

## Power-Ups

Capsules float mid-arena (50% chance each standard wave once unlocked) or drop one second after a destroyed enemy. **Shoot the capsule** to activate it. Gauges stack — different colors split the bottom meter. Active energy persists between sectors and Challenges.

| Capsule | Unlocks | What you get |
| :--- | :--- | :--- |
| **Cyan — Homing Missiles** | Sector 02, Wave 3+ | 30 conserved volleys of twin missiles. They track enemies, Lightwings, and floating capsules. Shatter Ares ribbons in one hit and deal **1.3x** damage to Elite/Master Ares Recognizers. |
| **Red — Continuous Laser** | Sector 03+ | 12 seconds of nose-locked piercing laser (drains **only while firing**). Deals **1.3x** to Legacy Recognizers. Blocked by crimson ribbons; cyan ribbons convert the beam into slowed, dissolving bolts. |
| **Purple — Arc Wave** | Sector 04+ | 6 wide waves that void enemy shots. After the 6th wave, **double-tap Fire** for a massive AOE Cannon Shot (tap 1 charges, tap 2 fires — or it auto-fires after 3 seconds). |

## The Grid

Start with **3 lives** (cap of 5). An extra fighter arrives at **20,000** points, then every **35,000**.

- Standard sectors run **4 waves**
- A **Challenge** stage starts after every 2nd sector (`Sec 02 → CH.01`, `Sec 04 → CH.02`, and so on)
- Perfect Challenge clear: **+10,000**. Otherwise: **+100** per hit
- **Hard Mode** labels sectors `H01+` and Challenges `H-CH`. `H01` plays at Sector 06 intensity; `H-CH.01` starts at Challenge 3 rules (guarded Masters and extra rounds). Hard Mode has its own hi-score and leaderboard

### Hostiles

Points are formation / diving unless noted.

| Unit | Debut | HP | Points | Notes |
| :--- | :--- | ---: | ---: | :--- |
| Bit-Drone | Sector 01 | 1 | 50 / 100 | Swarming scouts. Rare capsule drop from Sec 02 W3 |
| Grid-Interceptor | Sector 01 | 1 | 80 / 160 | Wide-arc divers that fire amber plasma |
| MCP Recognizer [1982] | Early sectors | 2 | 150 / 400 | Tractor beam kidnap. Destroy it, not your captured ship, for Dual-Fighter |
| Elite Legacy Recognizer | Sec 02, Wave 3+ | 6 (12 in CH.2+ raids) | 350 / 900 | Launches cyan Lightwings whose ribbons slow your ship and dissolve bullets |
| Elite Ares Recognizer | Sector 03+ | 6 (12 in CH.2+ raids) | 400 / 1000 | Launches crimson Lightwings. Ribbons block shots (6 hits) and inflict Slow + −20% DMG |
| Master Legacy / Ares Recognizer | Sector 06+ | 15 | 750 / 1800 · 850 / 2000 | Aura-ringed dreadnoughts with heavy drops; guarded in Challenge 3+ / Hard Mode |
| Lightwings | Deployed by Elites & Masters | 1 | 150 | High-speed drones that paint cyan or crimson light ribbons |

## Leaderboard

After Game Over, record an 8-character **callsign** to a **top 10** board (Normal and Hard are separate). Each run stores score, sector, and accuracy in your browser. Clearing the board takes a two-step confirmation.

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
index.html              # Game shell, HUD, and overlays
css/style.css           # Neon arcade UI
js/
  main.js               # Game loop and boot
  config.js             # Version, tuning, and Grid Archive catalog
  player.js             # Light-Fighter movement and fire
  enemies.js            # Sectors, waves, and Challenge stages
  recognizers.js        # Tractor beam, Elites, Masters, Lightwings
  powerups.js           # Capsules and stackable gauges
  projectiles.js        # Shots, laser, ribbons, Arc Wave, cannon
  renderer.js / sprites.js / ui.js / audio.js
  leaderboard.js        # Local top 10 (Normal / Hard)
  utils.js
legacy/index-original.html   # Earlier single-file snapshot
```

## Status

**Alpha Test 0.1.1** — a public early test. Systems are in and playable, but this is still a work in progress. Feedback welcome.

## Credits

Created by [Szarkk](https://github.com/Szarkk).

Inspired by classic arcade formation shooters and the look of the Grid.
