# SZARKK — 32-Bit Pixel Art, PixelLab Animation Standards, Alpha Test Skins & Future Roadmap

**Project:** SZARKK (*Sentient Zenith Augmentation Recursive Knowledge Kernel*)
**Baseline Version:** Alpha Test 0.1.2
**Target Visual Direction:** High-Detail 32-Bit Sega Saturn / PlayStation 1 / CAVE Vertical Arcade Shmup (*DoDonPachi*, *Radiant Silvergun*, *Metal Slug*, *Layer Section*)
**Authoring Pipeline:** PixelLab (AI Pixel Art & Animations) + Aseprite / Pixelorama Cleanup + Procedural Pixel Energy FX
**Master Color Palette:** Saturn Neon-Alloy (40 Core Colors — 8 Hue-Shifted 5-Shade Ramps)
**Drive Location:** `G:\My Drive\AI Workspaces\General Workspaces\Rezonance Saga\SZARKK-game\SZARKK_32Bit_Art_And_Skins_Prep.md`

---

## 1. Executive Summary & Core Architecture Goals

This document is the canonical art, animation, and engineering preparation guide for converting **SZARKK** from its current HD vector wireframe visuals (**Alpha Test 0.1.2**) into a cohesive **32-bit pixel-art arcade shooter** built to work seamlessly with **PixelLab animations** (ship banking/movement, animated explosions, enemy attacks, idle loops), while preserving all current designs permanently as the **`Alpha Test` Skin Pack** and laying out clean standards for all future content.

### Guiding Principles

1. **PixelLab-First Resolution (`480×640` Native 1:1 Pixel Buffer):** Because PixelLab's animation models (*Animate with Text*, *Create Animated Object*) perform best at **`32×32`, `48×48`, `64×64`, `96×96`, and `128×128`** (whereas `16×16` loses detail during movement/banking and explosion frames), SZARKK's 32-bit mode locks the canvas backing buffer to **`480×640` (`1 native pixel = 1 logical px`, `dpr = 1`)** with nearest-neighbor upscaling (`imageSmoothingEnabled = false` and CSS `image-rendering: pixelated`).
2. **Authentic 32-Bit Sprite Density:** True 32-bit arcade shmups (Saturn / PS1 / CAVE) used `32×32` player fighters, `48×48`–`64×64` elites, `80×80`–`96×96` heavy warships, and `64×64`–`128×128` multi-frame explosions — NOT 8-bit `16×16` sprites. Using `480×640` native matches real 32-bit arcade proportions, hits PixelLab's exact sweet spot, and requires **zero coordinate conversion** against existing hitboxes (`hitRadius`), formations, or Chain Lightning math.
3. **Zero "Mixels" (Strict 1:1 Texel Density):** Every PixelLab sprite, animation frame, explosion, and backdrop tile renders at exact `1:1` pixel scale inside the `480×640` buffer. Never scale a `64×64` sprite down to `0.5×` or stretch a `16×16` sprite up to `2×`.
4. **Drop-In Per-Clip Animation Sheets:** Instead of forcing you to manually stitch every PixelLab export into one giant mega-sheet, the engine supports **one PNG file per animation clip** (horizontal strips OR PixelLab's `2×2` / `4×4` grid exports) so exporting from PixelLab and dropping files into `assets/sprites/` works immediately.
5. **Preserve Current Designs as `Alpha Test` Skins:** Every existing `0.1.2` neon vector design is preserved untouched as the **`Alpha Test` Skin Pack**, selectable as a full theme or mixed-and-matched per category alongside 32-bit sprites.

---

## 2. Display Pipeline & Technical Standards

### 2.1 Resolution & Framebuffer Spec

| Property | 32-Bit Saturn Mode (Default) | Full `Alpha Test` Mode (Classic 0.1.2) |
| --- | --- | --- |
| **Logical Simulation Space** | `480 × 640` (unchanged) | `480 × 640` (unchanged) |
| **Canvas Backing Resolution** | `480 × 640` fixed (`dpr = 1`, no HiDPI smoothing) | `cssW * dpr × cssH * dpr` (HiDPI smooth vectors) |
| **Sprite Scale Ratio** | `1 sprite pixel = 1 logical px` (exact `1:1`) | Vector paths drawn at full display DPI |
| **Upscaling Filter** | `imageSmoothingEnabled = false` + `image-rendering: pixelated` | Default smooth anti-aliased canvas |
| **Coordinate Snapping** | Render-only `Math.round(x)`, `Math.round(y)` | Floating-point smooth coordinates |
| **Diving Sprite Rotation** | 16-step discrete angles (or PixelLab directional frames) | Continuous smooth `ctx.rotate(e.angle)` |
| **Sandbox Measure Grid / Ruler** | Drawn crisp over pixel buffer (`1F = 38px`, `Bolt = 152px`) | Same logical metrics |

*Optional Future Setting (`Pixel Scale`): If you ever want an extra-chunky retro filter on desktop, we can also offer an optional `CHUNKINESS` toggle (`32-BIT NATIVE 480×640` vs `RETRO 240×320` post-downscale) without ever having to re-draw your `32×32` / `64×64` PixelLab assets.*

### 2.2 Visual Polish Rules (32-Bit Authenticity)

- **No `ctx.shadowBlur` in 32-Bit Mode:** Replace blurry canvas glows with baked sprite glow rims, animated halo frames, and crisp 1–2px bright edges.
- **Ordered Bayer Dithering (2×2 / 4×4):** Use pixel dithering for the Endframe horizon sky, Tractor Beam cone bands, and Cyan/Red (plus future) CRT Field overlays.
- **Auto-Baked 1-Frame Pure White Hit Flash:** `sprite_loader.js` generates a pure white silhouette canvas for every loaded PNG automatically at startup — you never have to generate separate hit-flash frames in PixelLab.
- **Runtime Power-Up Recoloring (Generate Aurex Animations Once!):** Reserve a bright accent mask (or specific Saturn Neon-Alloy ramp indices) on the Aurex Fighter's wingtips/core so the engine automatically palette-swaps Cyan, Red, Purple, Yellow, Clone, and stacked **moving RGB wave** tints across all PixelLab movement animations at runtime.
- **Bitmap Canvas Font:** Use a crisp `6×8` / `8×8` pixel glyph sheet (`bitmap_font_8x8.png`) for `+150` score popups, `HEADSHOT!`, `WEAPONS JAMMED`, and Sector banners.

---

## 3. Master Color Palette — Saturn Neon-Alloy

The **Saturn Neon-Alloy** palette contains **40 master colors** organized into **8 hue-shifted 5-shade ramps**. Each shade has a fixed artistic role so PixelLab outputs, hand-cleaned sprites, and procedural energy weapons blend into one unified 32-bit aesthetic:

- **S1 (Outline / Abyss):** Coolest, darkest shade — 1px outer contours and deep hull crevices.
- **S2 (Deep Shadow):** Shaded underside armor plates and recessed vents.
- **S3 (Midtone / Body):** Primary readable hull hue.
- **S4 (Bright Neon / Lit Edge):** Top-lit bevels, wing glows, energy conduits.
- **S5 (Specular / Plasma Core):** Near-white / ice / ivory highlights, cockpit glints, and weapon cores.

### 3.1 Master Palette Swatch Table (Feed Directly into PixelLab!)

| Ramp Name | Gameplay Role | S1 (Outline) | S2 (Shadow) | S3 (Midtone) | S4 (Bright) | S5 (Core) |
| --- | --- | --- | --- | --- | --- | --- |
| **Endframe** | Space Void, Mountains, Nexus Grid | `#04050E` | `#0A0F24` | `#122042` | `#1D3C6E` | `#396EA6` |
| **Aurex Alloy** | Player Fighter, Metallic Trim | `#2D354F` | `#5A6988` | `#9BADB7` | `#DBE8F5` | `#FFFFFF` |
| **Flux Cyan** | Flux Enforcers, Flux Threads, Homing | `#082442` | `#0D5680` | `#129CD6` | `#2BE8FF` | `#D4FFFF` |
| **Null Crimson** | Null Enforcers, Null Threads, Laser | `#38081C` | `#7A1030` | `#CC1B42` | `#FF4769` | `#FFC2CF` |
| **V1 Solar Amber** | V1 Enforcer, Interceptors, Explosions | `#3D1414` | `#802B19` | `#D4551E` | `#FF9338` | `#FFE299` |
| **Pulsar Volt** | Pulsar, Chain Lightning, Electro Balls | `#45220C` | `#8F5110` | `#E09B19` | `#FFE44D` | `#FFFFD1` |
| **Arc / Clone Violet** | Arc Wave, Fighter Clones, Alpha Centoid | `#1D1042` | `#48218A` | `#8838DB` | `#D46BFF` | `#F7D6FF` |
| **Centoid Emerald** | Centoid, Shields, UI Confirmations | `#092E24` | `#12633D` | `#1FA854` | `#5CF27A` | `#D4FFBF` |

### 3.2 Palette Rules for PixelLab & Future Content

- **Always Lock PixelLab to Saturn Neon-Alloy:** Upload `assets/palettes/saturn_neon_alloy.png` (or `.gpl` / custom hex list) as PixelLab's forced palette before generating animations so frames never drift or introduce off-palette noise.
- **Background Value Cap:** Keep background tiles at Endframe `S1`–`S4` (`#04050E`–`#1D3C6E`) so high-value bullets, ships, and explosions stay unmistakably legible.
- **Enemy Bullet Visibility Rule:** Every enemy projectile MUST keep a bright pure white (`#FFFFFF`) center core ringed by an `S4` bright neon rim so it stays clear over dark space, explosions, and Cyan/Red CRT fields.
- **Adding Future Factions / Field Effects:** Always add a full **5-shade hue-shifted ramp** (cool shadow → warm/icy specular), never a lone unshaded RGB color.

---

## 4. PixelLab-Ready Sprite Size Standards (Current & Future Roster)

All cell dimensions below are in **native `480×640` pixels (`1 sprite px = 1 logical px`)**, aligned to PixelLab's optimal square canvas sizes (`32×32`, `48×48`, `64×64`, `96×96`, `128×128`) and mapped directly to SZARKK's exact hitboxes (`js/enemies.js`, `js/special_enemies.js`).

### 4.1 Current Ship & Enemy Roster Specification

| Entity | Tier | Logical `hitRadius` (Diameter) | PixelLab Cell Size | Target Active Hull Art | Animation Clips (Frame Budget) |
| --- | --- | --- | --- | --- | --- |
| **Aurex Fighter** | Player | Player (`±14` dual = `28` px) | **`32 × 32`** | `26 × 28` | `idle` (4f), `bank_left` (4f), `bank_right` (4f), `thrust_up` (4f), `overcharge` (4f) |
| **Fighter Clones** | Companion | `r13` (`26` px) | **`32 × 32`** | `22 × 24` | `idle` (4f hologram scan), `bank_left` (2f), `bank_right` (2f) |
| **Drone** | Normal (T1) | `r16` (`32` px) | **`32 × 32`** | `26 × 26` | `idle` (4f pulse), `dive` (4f) |
| **Interceptor** | Normal (T1) | `r16` (`32` px) | **`32 × 32`** | `30 × 26` | `idle` (4f wing glow), `dive` (4f) |
| **Enforcer Wings** | Deployable | `r14` (`28` px) | **`32 × 32`** | `22 × 26` | Flux & Null: `fly` (4f engine trail) |
| **Centoid** | Advanced (T2) | `r15` head / `r13` body | **`32 × 32`** | Head `28×28` / Body `22×22` | `head` (4f mandibles), `body` (4f crawling legs) |
| **V1 Enforcer** | Advanced (T2) | `r20` (`40` px) | **`48 × 48`** | `38 × 38` | `idle` (4f), `cracked` (4f), `synergy_flux` (4f), `synergy_null` (4f), `beam_open` (4f) |
| **Elite Enforcer [Flux]** | Elite (T3) | `r26` (`52` px) | **`64 × 64`** | `50 × 46` | `idle` (4f), `attack_wing` (4f), `damaged` (4f) |
| **Elite Enforcer [Null]** | Elite (T3) | `r26` (`52` px) | **`64 × 64`** | `50 × 46` | `idle` (4f), `attack_wing` (4f), `damaged` (4f) |
| **Alpha Centoid** | Elite (T3) | `r17` head / `r14` body | **`32 × 32`** | Head `30×30` / Body `24×24` | `head` (4f armored mandibles), `body` (4f glowing segments) |
| **Pulsar** | Elite (T3) | `r25` (`50` px) | **`64 × 64`** | `46 × 54` (incl. rods) | `idle` (6f crackling twin rods), `fire_orb` (4f), `damaged` (4f) |
| **Master Enforcer [Flux]** | Master (T4) | `r30` (`60` px + aura) | **`96 × 96`** *(or `80×80`)* | `62 × 58` + outer aura | `idle` (6f radiant aura), `attack_surge` (6f), `damaged` (6f), `critical` (6f) |
| **Master Enforcer [Null]** | Master (T4) | `r30` (`60` px + aura) | **`96 × 96`** *(or `80×80`)* | `62 × 58` + outer aura | `idle` (6f radiant aura), `attack_surge` (6f), `damaged` (6f), `critical` (6f) |
| **Power-Up Capsules (×5)** | Pickup | `r21` (`42` px) | **`32 × 32`** | `26 × 26` | 5 colors × `idle` (4f glint) + `glow_reward` (4f outer shimmer) |

*Note on Dual-Fighter Spacing: Because Aurex Fighter's active hull is `26` px wide inside its `32×32` cell and Dual-Fighter offsets are `±14` px (`28` px center-to-center), both fighters sit cleanly wingtip-to-wingtip with a 2px crisp gap!*

### 4.2 Animated Explosions, Projectiles & Combat FX (PixelLab-Friendly!)

| FX / Projectile Asset | PixelLab Cell Size | Frame Count & FPS | Looping? | Gameplay Trigger |
| --- | --- | --- | --- | --- |
| **Player Pulse / Clone Bolt** | **`16 × 16`** | 2–4 frames @ 12 fps | Loop | Standard white, Purple, Clone dark-purple, Refracted red |
| **Enemy Plasma Bullet** | **`16 × 16`** | 4 frames @ 12 fps | Loop | `10×10` active orb w/ `4×4` `#FFFFFF` core + bright rim |
| **Homing Missile** | **`24 × 24`** *(or `32×32`)* | 4 frames @ 14 fps | Loop | Sleek cyan micro-rocket w/ animated thruster exhaust |
| **Pulsar Electro Ball** | **`32 × 32`** | 6 frames @ 12 fps | Loop | Matches Drone size (`26×26` active) crackling yellow orb |
| **Purple Cannon Orb** | **`32 × 32`** | 6 frames @ 14 fps | Loop | Swirling violet overcharge projectile |
| **Hit / Armor Ping Spark** | **`24 × 24`** | 4–5 frames @ 18 fps | One-shot | Non-lethal hits on V1 / Elites / Masters / Null Threads |
| **Explosion — Small** | **`32 × 32`** | 6–8 frames @ 16 fps | One-shot | Drones, Interceptors, Enforcer Wings, Centoid segments |
| **Explosion — Medium** | **`64 × 64`** | 8–10 frames @ 16 fps | One-shot | V1 Enforcers, Elites, Pulsars, Fighter Clones, Alpha heads |
| **Explosion — Large** | **`96 × 96`** | 10–12 frames @ 15 fps | One-shot | Master Enforcers, Aurex Fighter destruction |
| **Explosion — Cannon AOE** | **`128 × 128`** | 10–12 frames @ 14 fps | One-shot | Purple 2× AOE Cannon detonation (layered with shockwave ring) |
| **Warp / Spawn Flash** | **`32 × 32`** | 6 frames @ 16 fps | One-shot | Capsule drop materialization, Clone break-off, Sandbox deploy |
| **Lightning, Laser, Threads, Beam** | **Procedural Pixel** | Real-time 60 fps | Dynamic | Integer-stepped pixel lines using Saturn Neon-Alloy ramps |

### 4.3 Future Sprite Size Standards (For Everything You Add Later)

| Future Archetype | PixelLab Cell Size | Logical `hitRadius` | Design & Animation Notes |
| --- | --- | --- | --- |
| **Micro-Drone / Seeker Mine** | **`16 × 16`** or **`24 × 24`** | `r10 – r12` | Compact high-contrast silhouette (`2–4` frame pulse) |
| **Standard Fighter (Tier 1)** | **`32 × 32`** | `r15 – r16` | Leave `2–3` px transparent margin inside cell for bank/glow |
| **Heavy / Advanced (Tier 2)** | **`48 × 48`** | `r19 – r21` | Distinct wider chassis (`4–6` frame idle + damage state) |
| **Elite / Specialist (Tier 3)** | **`64 × 64`** | `r24 – r26` | Signature moving hardware (rods, cannons, shield wings) |
| **Master / Mini-Boss (Tier 4)** | **`80 × 80`** or **`96 × 96`** | `r28 – r32` | Heavy armored chassis + animated aura/vents (`6–8` frames) |
| **Sector Boss Chassis (Tier 5)** | **`128 × 96`** or **`128 × 128`** | Multi-hitbox | Core hull (`128×96`) + attachable `32×32` / `48×48` destructible turrets |
| **Environmental Hazards / Gates** | **`32 × 32`** or **`48 × 48`** | `r14 – r22` | Looping energy animations (`4–6` frames) |
| **New Power-Up Capsules** | **`32 × 32`** | `r21` | Reuse the `26×26` beveled cube frame + new `16×16` animated center icon |

---

## 5. PixelLab Workflow & Technical Guardrails

Follow these rules inside **PixelLab** so every generated sprite and animation drops straight into SZARKK with minimal cleanup:

### 5.1 PixelLab Budget & Export Guardrails

1. **Keep Transparency Under Area Cap (`no_background: true`):** Keep static canvases `<= 256×256` (`<= 65,536` total pixels) so PixelLab outputs clean alpha transparency rather than a solid background fill.
2. **Respect Animation Pixel-Frame Budget (`width × height × frames <= 524,288`):**
   - `32×32` × `8` frames = `8,192` (tiny — huge headroom!)
   - `64×64` × `12` frames = `49,152` (plenty of room!)
   - `96×96` × `12` frames = `110,592` (safe!)
   - `128×128` × `12` frames = `196,608` (well under `524,288`!)
3. **Reference-First Consistency Rule:**
   - Step 1: Generate the **single static base pose** (e.g., Aurex Fighter center idle facing straight up, top-down orthogonal view, transparent background, locked to Saturn Neon-Alloy palette).
   - Step 2: Clean up any stray pixels and verify exact symmetry / center pivot (`16, 16` for a `32×32` sprite) in Aseprite or Pixelorama.
   - Step 3: Feed that **exact cleaned frame 0** into PixelLab's *Animate with Text* for every animation (`bank_left`, `bank_right`, `thrust_up`, `damaged`, `attack`) so hull proportions stay locked across every clip!
4. **Prompt Style Anchor (Reuse Across All SZARKK Sprites):**
   - Always specify: `top-down vertical shoot-em-up spaceship, orthogonal 2D view, 32-bit Sega Saturn arcade pixel art, crisp dark outline, metallic alloy shading, no perspective tilt, centered symmetrically, transparent background`.
   - For **player ships**: always face **NORTH (up)**.
   - For **enemy ships**: always face **SOUTH (down)** (formation default) so `angle = 0` matches formation facing cleanly!
5. **Export Format Preference:**
   - **Preferred:** Horizontal sprite strip PNG (`1 row × N cols`, zero padding between frames) — direct 1-click export from PixelLab!
   - **Also Supported Natively:** PixelLab's `2×2` or `4×4` grid PNG exports (`layout: 'grid'`) — no manual re-stitching required!

---

## 6. Asset Folder Structure & Animation System Architecture

### 6.1 Directory Tree (Per-Clip Drop-In Friendly)

```text
SZARKK-game/
├── assets/
│   ├── fonts/
│   │   ├── szarkk_hud.woff2                  # Self-hosted pixel UI font
│   │   └── bitmap_font_8x8.png               # Crisp in-canvas glyph sheet
│   ├── palettes/
│   │   ├── saturn_neon_alloy.gpl             # Aseprite / GIMP / Pixelorama palette
│   │   └── saturn_neon_alloy_ref.png         # 40-swatch reference PNG for PixelLab upload!
│   └── sprites/
│       ├── saturn_32bit/                     # Default 32-bit animated pixel pack
│       │   ├── player/
│       │   │   ├── aurex_idle.png            # 32x32 strip (4f)
│       │   │   ├── aurex_bank_left.png       # 32x32 strip (4f)
│       │   │   ├── aurex_bank_right.png      # 32x32 strip (4f)
│       │   │   ├── aurex_thrust_up.png       # 32x32 strip (4f)
│       │   │   ├── aurex_overcharge.png      # 32x32 strip (4f)
│       │   │   └── clone_idle.png            # 32x32 strip (4f)
│       │   ├── enemies/
│       │   │   ├── drone_idle.png            # 32x32 strip
│       │   │   ├── interceptor_idle.png      # 32x32 strip
│       │   │   ├── wing_flux_fly.png         # 32x32 strip
│       │   │   ├── wing_null_fly.png         # 32x32 strip
│       │   │   ├── centoid_head.png          # 32x32 strip
│       │   │   ├── centoid_body.png          # 32x32 strip
│       │   │   ├── alpha_centoid_head.png    # 32x32 strip
│       │   │   ├── alpha_centoid_body.png    # 32x32 strip
│       │   │   ├── v1_idle.png               # 48x48 strip (+ cracked / flux / null)
│       │   │   ├── elite_flux_idle.png       # 64x64 strip (+ attack / damaged)
│       │   │   ├── elite_null_idle.png       # 64x64 strip (+ attack / damaged)
│       │   │   ├── pulsar_idle.png           # 64x64 strip (+ fire_orb / damaged)
│       │   │   ├── master_flux_idle.png      # 96x96 strip (+ surge / damaged)
│       │   │   └── master_null_idle.png      # 96x96 strip (+ surge / damaged)
│       │   ├── pickups/
│       │   │   └── capsule_<type>_idle.png   # 32x32 strips (cyan/red/purple/yellow/clone)
│       │   ├── projectiles/
│       │   │   ├── proj_enemy_bullet.png     # 16x16 strip
│       │   │   ├── proj_homing_missile.png   # 24x24 strip
│       │   │   ├── proj_electro_ball.png     # 32x32 strip
│       │   │   └── proj_cannon_orb.png       # 32x32 strip
│       │   ├── fx/
│       │   │   ├── fx_hit_spark.png          # 24x24 one-shot (4-5f)
│       │   │   ├── fx_exp_small.png          # 32x32 one-shot (6-8f)
│       │   │   ├── fx_exp_med.png            # 64x64 one-shot (8-10f)
│       │   │   ├── fx_exp_large.png          # 96x96 one-shot (10-12f)
│       │   │   ├── fx_cannon_blast.png       # 128x128 one-shot (10-12f)
│       │   │   └── fx_spawn_warp.png         # 32x32 one-shot (6f)
│       │   └── environment/
│       │       └── bg_endframe_480x140.png
│       └── skins/                            # Future custom 32-bit skin packs!
│           └── <skin_id>/                    # Only include overridden PNG clips
└── js/
    ├── skins.js                              # SkinRegistry, Active Skin State & Persistence
    ├── sprite_manifest.js                    # Data-driven clip/grid registry
    ├── sprite_loader.js                      # Async loader + hit-flash baker + palette swapper
    ├── animator.js                           # Ship bank blending, enemy states & one-shot VFX queue
    └── renderers/
        ├── alpha_test_sprites.js             # Current 0.1.2 neon vector art (Alpha Test Skins!)
        └── saturn_pixel_sprites.js           # 32-bit animated sprite & pixel FX renderer
```

### 6.2 Per-Clip Manifest Schema (`js/sprite_manifest.js`)

Supports horizontal PixelLab strips, PixelLab `2×2` / `4×4` grids, and one-shot explosions seamlessly:

```js
export const SPRITE_MANIFEST = {
  AUREX: {
    cellW: 32,
    cellH: 32,
    clips: {
      idle:       { src: 'player/aurex_idle.png',       frames: 4, fps: 10, loop: true },
      bank_left:  { src: 'player/aurex_bank_left.png',  frames: 4, fps: 14, loop: false, holdLast: true },
      bank_right: { src: 'player/aurex_bank_right.png', frames: 4, fps: 14, loop: false, holdLast: true },
      thrust_up:  { src: 'player/aurex_thrust_up.png',  frames: 4, fps: 14, loop: true },
      overcharge: { src: 'player/aurex_overcharge.png', frames: 4, fps: 14, loop: true }
    }
  },
  FX_EXP_MED: {
    cellW: 64,
    cellH: 64,
    clips: {
      play: { src: 'fx/fx_exp_med.png', frames: 8, cols: 4, rows: 2, fps: 16, loop: false }
    }
  }
};
```

### 6.3 Ship Movement & Combat Animation Engine (`js/animator.js`)

To make PixelLab animations feel alive immediately in gameplay:

- **Unified Ship Movement State (PC + Touch 2D Drag):**
  - Compute smoothed `player.vx` and `player.vy` every frame from both keyboard (`WASD` / Arrows) and Touch UI 2D drag deltas (`dx`, `dy`), producing a normalized bank axis (`-1` full left → `0` level → `+1` full right).
  - Moving left steps through `bank_left` frames (`0 → 3`) and holds the banked frame while cruising left; releasing smoothly unwinds (`3 → 0`) back into `idle`! Pushing upward triggers `thrust_up` (brighter thrusters).
  - **Graceful Fallback:** If only `idle` exists while you are still creating other clips in PixelLab, the animator automatically stays on `idle` with zero errors!
- **One-Shot Animated Explosions (`game.spriteEffects[]`):**
  - `spawnExplosion(game, x, y, tier, tint)` queues an animated explosion sprite (`FX_EXP_SMALL` / `FX_EXP_MED` / `FX_EXP_LARGE` / `FX_CANNON_BLAST` / `FX_HIT_SPARK`) while optionally keeping lightweight pixel debris sparks.
  - In `Alpha Test` skin mode, the same hook routes back to the classic `0.1.2` wireframe square `spawnDeleteBurst`!
- **Sandbox `ANIM:ON / PAUSED` Integration:**
  - Freezes or resumes all enemy sprite-sheet playback frames directly from the Sandbox top strip so you can inspect individual PixelLab frames live in the arena.

---

## 7. The `Alpha Test` Skins System Architecture

All existing `Alpha Test 0.1.2` neon wireframe designs are preserved permanently as **`Alpha Test` Skins** — allowing players to toggle between the new 32-bit animated pixel art and the original `0.1.2` prototype look (either globally or mix-and-match per slot).

### 7.1 Skin Slots & Presets

| Skin Slot | `32-Bit Saturn` (New Default) | `Alpha Test` (Current 0.1.2 Art) | Future Unlockable Ideas |
| --- | --- | --- | --- |
| **Player Ship (`player`)** | `saturn_aurex` (32×32 animated pixel fighter) | `alpha_test` (0.1.2 wireframe Aurex + RGB wave) | `gold_ace`, `null_prototype`, `flux_stealth` |
| **Enemy Fleet (`enemies`)** | `saturn_fleet` (32–96px animated pixel roster) | `alpha_test` (0.1.2 wireframe enemies & Masters) | `wireframe_crimson`, `void_chrome` |
| **Weapons & FX (`fx`)** | `saturn_fx` (PixelLab explosions, pixel bolts, dithered fields) | `alpha_test` (0.1.2 vector beams & square bursts) | `retro_amber`, `plasma_overdrive` |
| **Arena Backdrop (`backdrop`)** | `saturn_endframe` (dithered sky, pixel mountains & grid) | `alpha_test` (0.1.2 smooth neon Endframe grid) | `deep_sector`, `red_alert_nexus` |

### 7.2 Seamless Hybrid, Permanent Built-Ins & Adding PixelLab Ship Skins

1. **Permanent Built-In Aurex Skins (Never Overwritten):**
   - **`32-BIT SATURN`** (`id: 'saturn_32bit'`, `renderer: 'SATURN_PIXEL'`) is permanently locked to the built-in procedural 32-bit Saturn Neon-Alloy Aurex Fighter (`js/renderers/saturn_pixel_sprites.js`) with 5-step banking, reactive thrusters, and live power-up RGB trim.
   - **`ALPHA TEST`** (`id: 'alpha_test'`, `renderer: 'ALPHA_VECTOR'`) is permanently locked to the original `Alpha Test 0.1.2` neon wireframe Aurex Fighter (`js/sprites.js`).
2. **Adding New PixelLab Aurex Ship Skins (Separate Cards):**
   - Every custom PixelLab Aurex Fighter you create is added as **its own separate skin** in `AUREX_SKINS` (`js/skins.js`) using `renderer: 'PIXELLAB_SPRITE'` and its own `manifestId` (e.g. `'AUREX_CRIMSON'`), rendered by `drawPixelLabAurexFighter()` (`js/renderers/saturn_pixel_sprites.js`).
   - Dropping in new PixelLab PNGs and registering a new entry in `js/sprite_manifest.js` + `assets/sprites/installed.json` + `js/skins.js` adds a brand-new card to the **Ship Skins** Hangar alongside `32-BIT SATURN` and `ALPHA TEST` — never overwriting either one!
3. **Display Pipeline Mode (`32-BIT [480×640]` vs `HD VECTOR`):**
   - Controlled independently in the **Ship Skins** modal or Sandbox `TOOLS ▼` (`#sbx-btn-render-mode`) and saved in `localStorage` (`szarkk_aurex_skin`, `szarkk_render_mode`).
   - **`32-BIT [480×640]`** locks the canvas to `dpr = 1` with `image-rendering: pixelated` for authentic Sega Saturn crispness; **`HD VECTOR`** switches back to classic HiDPI vector smoothing.
4. **Incremental Drop-In for Non-Ship Sprites (Enemies / Explosions / Pickups):**
   - Any enemy, explosion, or pickup whose PixelLab PNG has NOT been added to `assets/sprites/installed.json` yet automatically keeps its current built-in art with zero 404 console spam!

---

## 8. Phased Conversion & Future Development Roadmap

### Phase 0 — Engine Prep, `Alpha Test` Skins & PixelLab Drop-In Pipeline
- Generate `assets/palettes/saturn_neon_alloy.gpl` and `saturn_neon_alloy_ref.png` (ready to upload straight into PixelLab!).
- Extract current `js/sprites.js` into `js/renderers/alpha_test_sprites.js` untouched (`Alpha Test` Skin Pack).
- Build `js/skins.js` (4 skin slots + `32-Bit Saturn` & `Alpha Test` presets + `localStorage` + Sandbox quick toggle).
- Build `js/sprite_manifest.js`, `js/sprite_loader.js` (supporting strips, PixelLab `2×2`/`4×4` grids, auto white hit-flash, and power-up palette remapping), and `js/animator.js` (ship velocity banking + enemy animation states + `spriteEffects` one-shot explosions).
- Lock 32-bit canvas backing resolution to `480×640` (`dpr = 1`, `imageSmoothingEnabled = false`, `image-rendering: pixelated`) with render-only `Math.round()` snapping.

### Phase 1 — First PixelLab Drop-Ins: Ship Movement & Explosions + Backdrop/FX
- Generate and wire the first high-impact PixelLab animations:
  - **Aurex Fighter** (`32×32`: `idle`, `bank_left`, `bank_right`, `thrust_up`, `overcharge`) + runtime power-up trim recoloring.
  - **Explosions** (`fx_hit_spark` `24×24`, `fx_exp_small` `32×32`, `fx_exp_med` `64×64`, `fx_exp_large` `96×96`, `fx_cannon_blast` `128×128`).
- Upgrade **Endframe** horizon sky (Bayer-dithered navy bands), pixel mountain silhouette, stepped Nexus grid, pixel-snapped energy weapons (forked Chain Lightning, Continuous Laser, Threads, Tractor Beam), dithered CRT Field overlays, and `bitmap_font_8x8.png` canvas popups.

### Phase 2 — Full 32-Bit Enemy, Pickup & Projectile Roster
- **Batch 1 (Pickups & Projectiles):** 5 Power-Up Capsules (`32×32`), Fighter Clones (`32×32`), Enemy Bullets (`16×16`), Homing Missiles (`24×24`), Pulsar Electro Ball (`32×32`), Purple Cannon Orb (`32×32`).
- **Batch 2 (Normal & Advanced):** Drone (`32×32`), Interceptor (`32×32`), Enforcer Wings (`32×32`), Centoid (`32×32`), V1 Enforcer (`48×48` + synergy variants).
- **Batch 3 (Elites & Masters):** Alpha Centoid (`32×32`), Elite Flux & Null (`64×64`), Pulsar (`64×64` animated rods), Master Flux & Null (`96×96` animated radiant aura).
- Verify all **17 Nexus Archive** live previews (`js/ui.js`) play their live PixelLab animations cleanly in `32-Bit` mode and classic vectors in `Alpha Test` mode.

### Phase 3 — 32-Bit UI, HUD & Skins Hangar Modal
- Self-host a crisp pixel UI font (`assets/fonts/szarkk_hud.woff2`).
- Restyle HUD bar, stepped pixel power-up gauges, overlays, and Touch UI dock with sharp 32-bit bevel borders.
- Add the Main Menu **`SKINS / HANGAR`** modal featuring the **`Alpha Test` Skin Pack** and future skin slots.

### Phase 4 — Future Content Expansion Roadmap
- **New Field Buffs & Debuffs (`SANDBOX_FIELD_EFFECTS` & Hard Mode):** Add new Arena Field Effects (debuffs + positive field anomalies like Overdrive Gold Field, Shield Matrix, EMP Surge) with distinct Saturn Neon-Alloy dithered CRT overlays.
- **Tier 5 Multi-Part Sector Bosses:** `128×96` / `128×128` main chassis with independently animated & destructible `32×32` / `48×48` turrets/wings generated in PixelLab.
- **New Enemy Archetypes, Power-Ups & Formations:** Plug directly into `UNIT_META`, `FORMATION_STYLES`, and `SPRITE_MANIFEST`.
- **Unlockable Milestone Skins:** Keep **`Alpha Test` Skins** unlocked for everyone; add unlockable 32-bit skins for 10-kill Master streaks, Hard Mode clears, and 100% Challenge accuracy.
- **32-Bit Audio Expansion (Optional):** Layer optional Saturn-style FM/sampled retro SFX alongside the zero-latency Web Audio synth (`js/audio.js`).

---

## 9. Ready-to-Start Checklist

Everything is now aligned to **Saturn Neon-Alloy** + **PixelLab's native animation sizes (`32 / 48 / 64 / 96 / 128`)** + **`Alpha Test` Skins**. When you want to kick off **Phase 0**, just confirm:

1. **Start Phase 0 Engine Prep Now?** (Creates `saturn_neon_alloy.gpl` + `saturn_neon_alloy_ref.png` for PixelLab, extracts current art into the **`Alpha Test`** Skin Pack, and wires the drop-in `SPRITE_MANIFEST` + `animator.js` + Sandbox skin toggle — zero visual regressions!)
2. **Mixed `Alpha Test` Skin Look:** When mixing an `Alpha Test` vector skin into a `32-Bit` battlefield, should it draw through the `480×640` `dpr=1` pixel pass (retro pixelated wireframe) or crisp HiDPI vector on top?
