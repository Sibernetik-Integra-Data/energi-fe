# Kebun — Page Summary

Source: https://www.figma.com/design/4iyGlWAJXMiJAmMatLlDXV/Kebun (file key: 4iyGlWAJXMiJAmMatLlDXV)

Overview
- Mobile-focused designs (multiple `Android Large` frames) representing the Kebun (garden/farm) app screens.
- Section titled `POV Kepala Kebun - Design 1` suggests this is a POV/role-based flow for a head gardener or manager.

Key UI structure and components
- Status Bar: present as a reusable instance across frames (fixed at top).
- Top app header area: horizontally laid-out frame with spacing and rounded container variants.
- Primary content uses vertical layout frames with padding (common: 16–40px) and item spacing ~16px.
- Content blocks/cards: rounded rectangles (corner radius ~24) with drop shadows for elevation.
- Illustration group(s): grouped vector artwork placed in hero areas.
- Repeated frames named like `Frame 9541`, `Frame 9512` indicate componentized UI pieces (cards, headers, controls).

Visual / style notes
- Backgrounds: many frames use white fills; some cards use very light gray fills (#efefef-ish from RGBA values).
- Elevation: drop shadows used for key cards and header panels.
- Layout: mixture of vertical stacking (layoutMode: VERTICAL) and horizontal controls (HORIZONTAL with space-between).

Behavior / interactions (from design data)
- Several frames marked `isFixed`/`scrollBehavior: FIXED` indicating fixed header/status regions and vertically scrolling content areas.
- `overflowDirection: VERTICAL_SCROLLING` on main frames — typical mobile scroll behavior.

Developer notes / implementation hints
- Reuse the Status Bar and top header as fixed components; implement main content as a vertical scroll container.
- Card components: rounded, white background, subtle shadow — map to design system tokens for elevation and radii.
- Extract text/content and image assets from Figma nodes when implementing real data-driven views.

Files fetched
- Figma file key: `4iyGlWAJXMiJAmMatLlDXV` (full file JSON cached locally via MCP helper).

If you want, I can:
- Extract a text-only list of component names and their node IDs from the file for implementation.
- Export selected images or SVGs for use in the frontend.
- Generate a small React/Vue component scaffold matching the main card layout.
