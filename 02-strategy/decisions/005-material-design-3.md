# 005: Material Design 3 for the interface

**Status:** Accepted

## Context
The interface should follow Google's Material Design system so that colours, type, shape, and components behave consistently and are easy to extend.

## Decision
Implement Material Design 3 (baseline) in plain CSS in `src/styles.css`:
- Colour roles (primary, surface, on-surface, outline, error, and so on) defined as custom properties, with light and dark values.
- Roboto type scale, loaded from Google Fonts.
- Shape and elevation tokens.
- Components built to the M3 specs: top app bar, filled, outlined, and text buttons, icon buttons, outlined text fields with floating labels, segmented buttons, lists, dialog, and a floating action button.

Icons are inline SVG paths from the Material icon set, so they do not depend on an icon font.

One colour sits outside the baseline roles: the add (+) button uses a green (`--add`) so that it stands apart from the purple primary.

## Not chosen
Google's Material Web component library (`@material/web`). It would add a CDN dependency and component APIs that I could not verify in a browser from this environment. It can be adopted later if the components need to behave more fully, such as focus traps or keyboard handling beyond the native `<dialog>`.

## Consequences
- The app loads Roboto from `fonts.googleapis.com`. If that fails, text falls back to the system sans-serif.
- Light and dark themes both follow the system setting, and `data-theme="dark"` forces dark.
- Visual changes are token edits in one place.
