---
name: Ping Pong
description: Split-flap mechanical scoreboard for live tournament scoring and brackets
colors:
  board: "#e8e6df"
  surface: "#ffffff"
  ink: "#141414"
  ink-muted: "#5c5c5c"
  ink-soft: "#8a8a8a"
  flap-black: "#1a1a1a"
  flap-white: "#ffffff"
  flap-top: "#2c2c2c"
  live: "#c1121f"
  error: "#b91c1c"
typography:
  display:
    fontFamily: '"Oswald", "Arial Narrow", sans-serif'
    fontSize: "clamp(2.75rem, 12vw, 4.5rem)"
    fontWeight: 500
    lineHeight: 1
    fontFeature: "tabular-nums"
  display-compact:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "clamp(2.25rem, 8vw, 3.25rem)"
    fontWeight: 500
    lineHeight: 1
    fontFeature: "tabular-nums"
  headline:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.06em"
  title:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.04em"
  body:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "0.8125rem"
    fontWeight: 500
    letterSpacing: "0.12em"
  flap-letter:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: 1
  home-letter:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "1.75rem"
    fontWeight: 500
    lineHeight: 1
  flap-mini:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1
  flap-index:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1
  live-pill:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1
  match-tag:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "0.625rem"
    fontWeight: 600
    lineHeight: 1
  sets-label:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1
  home-footer:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.5
  win-banner:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "clamp(4.5rem, 16vw, 6rem)"
    fontWeight: 600
    lineHeight: 1
  flap-set:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: 1
  score-name:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "clamp(1.5rem, 4vw, 2.25rem)"
    fontWeight: 600
    lineHeight: 1
  button:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1
  ghost-link:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1
rounded:
  default: "0.75rem"
  sm: "0.375rem"
  md: "0.5rem"
  pill: "999px"
spacing:
  touch-min: "3.5rem"
  stack: "1rem"
  row: "0.625rem"
components:
  button-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.default}"
    padding: "0.875rem 1.25rem"
    height: "{spacing.touch-min}"
  button-primary:
    backgroundColor: "{colors.flap-black}"
    textColor: "{colors.flap-white}"
    rounded: "{rounded.default}"
    padding: "0.875rem 1.25rem"
    height: "{spacing.touch-min}"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 0.75rem"
    height: "2.75rem"
  flap-tile:
    backgroundColor: "{colors.flap-black}"
    textColor: "{colors.flap-white}"
    rounded: "{rounded.md}"
  match-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0.625rem 0.75rem"
---

# Design System: Ping Pong

## Overview

**Creative North Star: "Split-flap mechanical scoreboard"**

Ping Pong looks like an airport departure board: warm paper ground, Oswald condensed type, and black split-flap tiles with a hinge line and side nubs. Comps in `assets/d6-*.png` and the landscape scoreboard are the visual authority.

## Colors

- **Board** `#e8e6df`
- **Flap black** `#1a1a1a` with `#2c2c2c` top half
- **Live** `#c1121f` for the En vivo dot
- **Error** `#b91c1c`

## Typography

Oswald throughout. Headings and buttons uppercase condensed. Flap glyphs medium weight, not ultra-black.

## Components

Split-flap tiles (letter, board, mini, index), flap toggles, match cards with index badges, open scoreboard (no white player cards). When a match ends, GANÓ uses win-banner scale and fills the middle row; live point flaps drop to display-compact.
