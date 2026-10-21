# Project Instructions & Developer Guidelines

## Video Player Design Protection Directives

The existing custom video player on SanyuHub is fully designed, tested, approved, and locked.

Before making any changes or working on tasks involving the video player, you MUST adhere to the following mandatory guidelines:

1. **Read Design Lock Specification First:**
   Always consult `docs/PLAYER_DESIGN_LOCK.md` prior to starting any task related to media playback, live TV streams, movies, or series watch pages.

2. **Protected Visual Design:**
   The approved video player design is protected by default. Never modify, redesign, restyle, reconstruct, or replace the player layout, CSS styling, inline SVG icons, dimensions, button positions, volume sliders, settings popover, or responsive styling rules in `css/style.css` or HTML templates (`live-tv/watch.html`, `watch.html`, `series-watch.html`) without explicit written authorization from the user.

3. **Separate Visual Design from Functionality:**
   When fixing bugs, improving stream buffering (e.g. 30-second continuous forward buffering for Live TV), tuning HLS.js settings, or updating error handling logic in `js/app.js`, do NOT alter the HTML markup, CSS classes, or visual appearance of the video player.

4. **No Global/Unintended CSS Side Effects:**
   Avoid broad CSS rule changes that could inadvertently affect the player UI. Keep changes tightly scoped.

5. **No Full Player Replacements:**
   Never replace the existing player with a third-party player, iframe embed, or alternate component merely to implement a feature or fix a bug.

6. **Conflict Protocol:**
   If a requested functional task strictly requires a visual alteration, STOP and explain the conflict to the user, identifying the precise visual elements affected, before making changes.

7. **Baseline & Safeguard Maintenance:**
   Preserve existing visual baseline screenshots and regression tests (`tests/player-design-lock.test.js`, `tests/visual-baseline.spec.js`). A request to fix bugs, alter stream handling, or add buffering does NOT grant permission to redesign or update visual baselines.
