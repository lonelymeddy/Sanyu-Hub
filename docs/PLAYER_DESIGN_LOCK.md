# VIDEO PLAYER DESIGN LOCK & SPECIFICATION

**Authoritative Reference — Approved Player Design**
**Status:** PROTECTED & LOCKED
**Last Verified Baseline:** Current Implementation

---

## 1. Overview & Purpose

This document serves as the permanent, authoritative design lock specification for the video player component used across SanyuHub (`live-tv/watch.html`, `watch.html`, `series-watch.html`).

The visual appearance, layout, dimensions, color palette, control ordering, icon set, and responsive behavior of this player have been fully tested, reviewed, and approved.

**STRICT RULE:** No developer or AI agent may redesign, restyle, reconstruct, alter the layout, or replace the icons of this video player without prior explicit written authorization. Functional fixes (stream playback, error handling, buffering, security, etc.) must strictly preserve this visual specification.

---

## 2. File Classification

### A. PROTECTED — PLAYER DESIGN (DO NOT MODIFY VISUALS)
The following files control the visual appearance, HTML component layout, control ordering, icon graphics, and styling rules of the video player:

1. **`css/style.css`** (Player CSS sections: lines ~936–1550 and ~2360–2420)
   - `.live-video-wrapper`, `.player-wrapper`
   - `.live-video-player`, `.live-iframe-player`
   - `.player-overlay-top`, `.player-live-badge`
   - `.live-central-play-btn`, `.live-unmute-banner`
   - `.live-loading-overlay`, `.live-error-overlay`
   - `.live-controls-bar` (`.controls-left`, `.controls-middle`, `.controls-right`)
   - `.ctrl-btn`, `.volume-container`, `.volume-slider`
   - `.ctrl-progress-container`, `.ctrl-progress-track`, `.ctrl-progress-fill`, `.ctrl-progress-thumb`
   - `.player-settings-menu`, `.settings-menu-header`, `.settings-menu-body`, `.settings-group`, `.speed-btn`, `.quality-select`, `.settings-action-btn`
2. **`live-tv/watch.html`** (Player section `#liveTvPlayerSection`)
3. **`watch.html`** (Player section `#playerWrapper`)
4. **`series-watch.html`** (Player section `#seriesPlayerWrapper`)

### B. CONTROLLED — PLAYER FUNCTIONALITY (EDITABLE FOR LOGIC FIXES ONLY)
The following code handles video playback, stream initialization, event listeners, quality switching, buffer management, error recovery, and settings UI toggling:

1. **`js/app.js`**
   - `attachCustomPlayerController(config)` (lines ~697–1050)
   - `initLiveTvWatchPage()` (lines ~1628–1720)
   - `initSeriesWatchPage()` (lines ~2557–2650)
   - `initWatchPage()` (lines ~2747–2850)

*Note: When modifying functional logic in `js/app.js`, developers must NOT alter CSS class names, remove DOM elements, or change inline SVG structures produced or manipulated by the controller.*

### C. PROTECTION — TESTS & DOCUMENTATION
- `docs/PLAYER_DESIGN_LOCK.md` (this document)
- `AGENTS.md` (project directives)
- `tests/player-design-lock.test.js` (automated DOM/CSS structural verification)
- `tests/visual-baseline.spec.js` (Playwright screenshot comparison test)
- `tests/baselines/` (approved visual reference images)

---

## 3. Component Hierarchy & Control Order

### Player Viewport Container Structure
```
[live-video-wrapper / player-wrapper] (16:9 aspect ratio, max-height 55vh, background #000, border-radius 8px 8px 0 0)
 │
 ├── <video> element (.live-video-player)
 │
 ├── [.player-overlay-top]
 │     └── [.player-live-badge] (Red #ff3b30 live dot + "LIVE" text, translucent backdrop blur)
 │
 ├── [button.live-central-play-btn] (56px x 56px circular button, centered at 50%/50% transform, blurred backdrop)
 │     ├── <svg.play-icon> (24px, fill #ffffff)
 │     └── <svg.pause-icon> (24px, fill #ffffff, display:none when paused)
 │
 ├── [button.live-unmute-banner] (Centered top banner, pulse animation, border #f4c400, "Audio Muted — Tap to Unmute")
 │
 ├── [.live-loading-overlay] (Spinner + "Connecting to live broadcast...")
 │
 ├── [.live-error-overlay] (Warning icon + Error Title + Error Message + Retry button #f4c400)
 │
 └── [.live-controls-bar] (Positioned absolute bottom, gradient backdrop: linear-gradient(to top, rgba(0,0,0,0.92), rgba(0,0,0,0.6), transparent))
       │
       ├── [.controls-left]
       │     ├── [button#ctrlRewindBtn] (10s Rewind SVG icon, default display:none for live non-DVR streams)
       │     ├── [button#ctrlPlayPauseBtn] (Play/Pause SVG icon toggle)
       │     └── [button#ctrlForwardBtn] (10s Forward SVG icon, default display:none for live non-DVR streams)
       │
       ├── [.controls-middle]
       │     ├── [.ctrl-progress-container] (Interactive scrub timeline, track 4px, fill #e50914, thumb 12px white circle)
       │     ├── [.live-stream-status] (Live Edge indicator button, display:none when scrubbing timeline is active)
       │     └── [span.ctrl-time-display] (11px font, #d1d1d1, white-space: nowrap)
       │
       └── [.controls-right]
             ├── [.volume-container]
             │     ├── [button#ctrlMuteBtn] (Volume high / Mute SVG icon toggle)
             │     └── [input.volume-slider] (Range slider, width 64px, track rgba(255,255,255,0.3), thumb #f4c400)
             ├── [button#ctrlSettingsBtn] (Gear SVG icon, aria-expanded)
             ├── [button#ctrlFullscreenBtn] (Fullscreen SVG icon)
             │
             └── [.player-settings-menu] (Popover menu, bottom 48px, right 0, width 290px, backdrop-filter: blur(16px))
                   ├── [.settings-menu-header] ("Playback Settings" + Close &times; button)
                   └── [.settings-menu-body]
                         ├── [#speedSettingsGroup] (Buttons: 0.5x, 0.75x, 1x [active], 1.25x, 1.5x, 2x)
                         ├── [#qualitySettingsGroup] (<select> Auto Quality / Level options)
                         ├── [#audioSettingsGroup] (<select> Audio tracks)
                         ├── [#subtitleSettingsGroup] (<select> Subtitle tracks)
                         ├── [#castSettingsGroup] (Cast to Device button with Cast SVG icon)
                         └── [#pipSettingsGroup] (Picture-in-Picture button with PiP SVG icon)
```

---

## 4. Visual Styling, Layout & Color Specifications

| Element / Class | Dimensions / Position | Background / Color | Special Effects |
| :--- | :--- | :--- | :--- |
| `.live-video-wrapper` | Aspect Ratio 16/9, Max Height 55vh | `#000000` | Border radius 8px 8px 0 0, overflow hidden |
| `.live-central-play-btn` | 56px x 56px circle, top 50%, left 50% | `rgba(0,0,0,0.65)`, border 2px `rgba(255,255,255,0.8)` | `backdrop-filter: blur(8px)`, hover fill `#e50914` |
| `.live-unmute-banner` | Top 16px, center horizontal | `rgba(0,0,0,0.85)`, border 1px `#f4c400`, text `#f4c400` | `backdrop-filter: blur(8px)`, pulse keyframe animation |
| `.live-controls-bar` | Absolute bottom 0, full width | `linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)` | Smooth opacity transition (0.25s ease) |
| `.ctrl-btn` | 36px x 36px, border-radius 8px | Transparent, hover `rgba(255,255,255,0.18)` | SVG fill `#ffffff` (22px x 22px) |
| `.ctrl-progress-fill` | Height 100% of 4px track | `#e50914` (Netflix Red) | Rounded corners 2px |
| `.ctrl-progress-thumb` | 12px x 12px circle | `#ffffff` | Box shadow 0 0 6px `rgba(0,0,0,0.6)`, scale(1.2) on hover |
| `.volume-slider` | Width 64px, Height 4px | `rgba(255,255,255,0.3)` | Thumb `#f4c400` (12px circle) |
| `.player-settings-menu` | Width 290px, max-width 85vw, bottom 48px | `rgba(18,18,18,0.96)`, border `rgba(255,255,255,0.15)` | `backdrop-filter: blur(16px)`, box-shadow `rgba(0,0,0,0.85)` |
| `.speed-btn.active` | Height 28px, border-radius 4px | `#f4c400`, color `#080808` | Font weight 700 |

---

## 5. Responsive Behavior

### Desktop (> 576px)
- Volume slider visible (`width: 64px`).
- Control bar padding: `12px 16px`, gap: `12px`.
- Controls bar auto-hides after 3 seconds of cursor inactivity during video playback.

### Mobile (<= 576px)
- `.volume-slider` is hidden (`display: none;`) to conserve horizontal space; volume button remains available.
- Control bar padding shrinks to `8px 10px`, gap reduces to `6px`.
- Settings menu popover constrained to `max-width: 85vw`.
- Touch interaction on progress container supported with `touch-action: none`.

---

## 6. Icons & Asset Inventory

All control icons are clean inline SVG elements embedded directly in the HTML templates to prevent asset loading delays.
- **Play:** Path `M8 5v14l11-7z`
- **Pause:** Path `M6 19h4V5H6v14zm8-14v14h4V5h-4z`
- **Rewind 10s:** Counter-clockwise arrow with centered bold "10" text
- **Forward 10s:** Clockwise arrow with centered bold "10" text
- **Volume High:** Speaker with double sound wave lines
- **Volume Mute:** Speaker with diagonal strikethrough slash
- **Settings (Gear):** Standard 24px gear icon
- **Fullscreen:** 4-corner expand brackets
- **Cast to Device:** Chromecast screen icon
- **Picture-in-Picture:** Inset display box icon

---

## 7. Authorized Change Procedure

If a future feature or design update genuinely requires altering any aspect of the player's visual specification:

1. **Explicit Request:** The user must explicitly instruct a visual modification (e.g. "Change the player control bar background to solid dark gray").
2. **Impact Assessment:** The engineer must review `docs/PLAYER_DESIGN_LOCK.md` and document the exact visual parameters affected.
3. **Approval:** Confirmation must be received from the user before committing visual changes.
4. **Baseline Update:** Upon user approval, updated screenshots must be generated and committed to `tests/baselines/` along with an updated `docs/PLAYER_DESIGN_LOCK.md`.
