---
name: Ping Pong
description: Club dry-erase whiteboard for live tournament scoring and brackets
colors:
  board: "#f4f1ea"
  board-surface: "#faf8f3"
  graphite: "#2c2c2c"
  graphite-muted: "#5a5a5a"
  chalk-green: "#3d8b5f"
  chalk-green-hover: "#357a53"
  chalk-green-soft: "rgba(61, 139, 95, 0.12)"
  line: "#2c2c2c"
  error: "#8b2e2e"
typography:
  display:
    fontFamily: "system-ui, Segoe UI, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(4rem, 18vw, 5.5rem)"
    fontWeight: 800
    lineHeight: 1
    fontFeature: "tabular-nums"
  headline:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "clamp(1.5rem, 4vw, 2rem)"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "0.9375rem"
    fontWeight: 700
    letterSpacing: "0.06em"
rounded:
  default: "0.5rem"
spacing:
  touch-min: "3.5rem"
  stack: "1rem"
  row: "0.625rem"
components:
  button-default:
    backgroundColor: "{colors.board-surface}"
    textColor: "{colors.graphite}"
    rounded: "{rounded.default}"
    padding: "0.75rem 1.125rem"
    height: "{spacing.touch-min}"
  button-primary:
    backgroundColor: "{colors.chalk-green}"
    textColor: "#ffffff"
    rounded: "{rounded.default}"
    padding: "0.75rem 1.125rem"
    height: "{spacing.touch-min}"
  button-primary-hover:
    backgroundColor: "{colors.chalk-green-hover}"
    textColor: "#ffffff"
  button-danger:
    backgroundColor: "{colors.board-surface}"
    textColor: "{colors.error}"
    rounded: "{rounded.default}"
  input-field:
    backgroundColor: "{colors.board-surface}"
    textColor: "{colors.graphite}"
    rounded: "{rounded.default}"
    padding: "0.625rem 0.875rem"
    height: "{spacing.touch-min}"
  match-card:
    backgroundColor: "{colors.board-surface}"
    textColor: "{colors.graphite}"
    rounded: "{rounded.default}"
    padding: "1rem 1.125rem"
  match-card-active:
    backgroundColor: "{colors.board-surface}"
    textColor: "{colors.graphite}"
    rounded: "{rounded.default}"
---

# Design System: Ping Pong

## Overview

**Creative North Star: "Club dry-erase whiteboard"**

Ping Pong looks like a warm garage-club scoreboard drawn on a dry-erase surface: off-white board ground, graphite 2px lines, and a single chalk-green accent for primary actions and the active match. The UI operates in Spanish with direct copy and no account chrome. Density favors scanability from two meters (bracket on a TV) and one-handed taps at the table (scoreboard on a phone).

Operate mode governs every surface: large touch targets, tabular numerals for scores, and hierarchy through weight and border state—not decorative illustration or esports neon.

**Key Characteristics:**

- Warm board ground (#f4f1ea) with subtle paper grain, not SaaS gray or arcade black
- Graphite 2px outlines on every interactive surface; chalk green reserved for primary buttons and active matches only
- System-ui typography; scores at display scale (64px+ on mobile)
- Spanish UI copy throughout; bye labeled "Pasa" with dashed border, not color alone
- Motion limited to 180ms score-change animation; no page-load theatrics

## Colors

Warm dry-erase board tones with one restrained green accent and graphite structure lines.

### Primary

- **Chalk Green** (#3d8b5f): Primary buttons ("Nuevo torneo", "Entrar", "Crear torneo"), active match border, focus rings. Hover darkens to #357a53.
- **Chalk Green Soft** (rgba(61, 139, 95, 0.12)): Status success banners (winner announcement).

### Neutral

- **Board** (#f4f1ea): Page background; radial noise overlays simulate paper grain.
- **Board Surface** (#faf8f3): Cards, inputs, buttons at rest, score sides.
- **Graphite** (#2c2c2c): Body text, borders, offline banner background.
- **Graphite Muted** (#5a5a5a): Secondary copy, completed matches, round titles, set counts.
- **Line** (#2c2c2c): 2px borders on inputs, buttons, match cards, score panels.

### Tertiary

- **Error Red** (#8b2e2e): Error messages and danger button border/text.

### Named Rules

**The One Accent Rule.** Chalk green appears only on primary actions and the active match border. Everything else stays graphite-on-board.

**The Bye Is Text Rule.** Bye rows use a dashed border plus uppercase "Pasa" label—never color alone to signal a non-playable slot.

## Typography

**Display Font:** system-ui (with Segoe UI, -apple-system, BlinkMacSystemFont fallbacks)
**Body Font:** same stack
**Label Font:** same stack, uppercase with letter-spacing for round titles

**Character:** Utilitarian and legible at distance. No display serifs or monospace gimmicks.

### Hierarchy

- **Display** (800, clamp(4rem, 18vw, 5.5rem), line-height 1): Live point totals on scoreboard; tabular-nums.
- **Headline** (700, clamp(1.5rem, 4vw, 2rem), line-height 1.2): Page titles (Ping Pong, Torneo, Marcador).
- **Title** (700, 1.25rem): Section headings, champion banner.
- **Body** (400, 1rem, line-height 1.5, max ~65ch): Subtitles and helper copy in graphite-muted.
- **Label** (700, 0.9375rem, 0.06em letter-spacing, uppercase): Round titles ("Ronda 1"), bye label ("Pasa"), room code (tabular-nums, 0.08em tracking).

### Named Rules

**The Tabular Score Rule.** All live scores, set counts, and room codes use `font-variant-numeric: tabular-nums` so digits don't jump on update.

## Layout

Single-column app shell: `#app` max-width 42rem centered with 1.25rem side padding. Scoreboard view breaks out to full width (`max-width: none`, 0.75rem padding) and uses a two-column grid for the two players.

Vertical rhythm uses `.stack` (1rem gap) and `.row` (0.625rem gap, wrap). Scoreboard fills `min-height: 100dvh` minus action bar; offline banner is fixed to the bottom.

Touch minimum height is 3.5rem on all buttons, inputs, and score +/- controls.

## Elevation & Depth

Flat-by-default. Depth comes from tonal layering (board vs board-surface) and 2px graphite borders—not drop shadows. The only shadow is a subtle 0 2px 8px rgba on the active match card.

### Named Rules

**The Flat Board Rule.** Surfaces sit on the board ground with borders, not floating cards. Elevation is reserved for the active match state only.

## Shapes

Gently rounded corners (0.5rem) on all interactive surfaces. Borders are consistently 2px solid graphite. Completed matches and byes use dashed borders. Focus uses a 2px chalk-green outline with 2px offset—no glow halos.

## Components

### Buttons

- **Shape:** 0.5rem radius, 2px border, min-height 3.5rem
- **Default:** Board-surface fill, graphite text and border; hover shifts to board ground
- **Primary:** Chalk green fill and border, white text; hover #357a53
- **Danger:** Board-surface fill, error border and text (Deshacer context)
- **Score +/-:** 1.75rem glyph, min-width 3.5rem

### Cards / Containers

- **Match card:** Board-surface, 2px solid border, 1rem×1.125rem padding, 1.0625rem semibold text
- **Active match:** Chalk-green border + light shadow
- **Completed match:** Dashed border, muted color, weight 500
- **Bye row:** Dashed border, flex space-between, "Pasa" label
- **Champion banner:** Centered, 1.25rem bold
- **Score side:** Full-height grid cell, centered name + display points + set count

### Inputs / Fields

- **Style:** 2px graphite border, board-surface background, 0.5rem radius, 3.5rem min-height
- **Focus:** 2px chalk-green outline, 2px offset
- **Name rows:** Flex row with remove button; used in tournament setup

### Navigation

Link-styled as `.button` / `.button.primary` anchors. No persistent nav chrome—each view is a single screen with back/cancel links.

### Scoreboard (signature)

Two-column grid with large tabular points, per-side +/- controls, and bottom action row (Deshacer, Volver). Point changes animate 180ms opacity/scale via `score-updated` class.

### Status & Feedback

- **Status message:** Chalk-green-soft background, green border, bold centered text (winner)
- **Error message:** Error red, semibold inline text
- **Offline banner:** Fixed bottom, graphite background, board-colored text

## Do's and Don'ts

### Do:

- **Do** keep all copy in Spanish and direct ("Nuevo torneo", "Solo marcador", "Pasa").
- **Do** use 3.5rem minimum touch targets on every control at the table.
- **Do** show bracket matches as scannable cards with clear active/completed/bye states.
- **Do** animate only score digit changes (180ms ease-out).

### Don't:

- **Don't** add esports neon, terminal chrome, or Challonge-style tournament SaaS aesthetics.
- **Don't** use chalk green for decoration—only primary actions and active match.
- **Don't** rely on color alone to distinguish bye from playable matches.
- **Don't** add page-load animations or motion beyond score updates.
