# Wall Panel Sonos Card

A Sonos multi-room control card for Home Assistant, designed for wall-mounted tablets. Three internal views (Now Playing / Favorites / Speakers) accessible from a single-screen card with no popups.

## Features

- **Player view** — cover, track meta, transport, volume slider sized for finger touch
- **Favorites view** — single-column list with category pills (no on-screen search to avoid keyboards on wall panels)
- **Speakers view** — tap to add/remove rooms from the current group, with per-room volume sliders for the group
- **Header dropdown** — tap the room name to switch active speaker or jump to a saved group
- **Tweakable** — track text size and volume bar thickness configurable per-instance
- Dark theme by default, matching dusty-blue / sage accent palette

## Install

### Via HACS (recommended)

1. HACS → Frontend → ⋮ → Custom repositories
2. Add `https://github.com/your-org/wall-panel-sonos-card` as type "Lovelace"
3. Install "Wall Panel Sonos Card", refresh

### Manual

1. Download `dist/wall-panel-sonos-card.js` from the latest release
2. Drop it in `<config>/www/`
3. Add a resource: Settings → Dashboards → ⋮ → Resources → Add → URL `/local/wall-panel-sonos-card.js`, type `JavaScript module`

## Build from source

```bash
cd ha-card
npm install
npm run build
# dist/wall-panel-sonos-card.js
```

## YAML example

```yaml
type: custom:wall-panel-sonos-card
default_view: player
layout: wall
track_scale: 1.15
vol_bar_scale: 1.4
entities:
  - media_player.living_room
  - media_player.kitchen
  - media_player.deck
  - media_player.pool
  - media_player.primary_bedroom
names:
  media_player.primary_bedroom: Bedroom
groups:
  - id: downstairs
    label: Downstairs
    entities:
      - media_player.living_room
      - media_player.kitchen
      - media_player.deck
  - id: outdoor
    label: Outdoor
    entities:
      - media_player.deck
      - media_player.pool
favorites:
  - id: hotel_costes
    name: Hotel Costes Radio
    type: station
    media_content_id: x-sonosapi-stream:s2887?sid=254
    media_content_type: music
    art: "linear-gradient(135deg, #1a1a1a 0%, #6a4a2c 100%)"
  - id: pool_mix
    name: Pool Mix 2025
    type: playlist
    script: script.play_pool_mix
    art: "linear-gradient(135deg, #00b3a4 0%, #f4d35e 100%)"
```

## Companion: Sonos Mini Card

The bundle also registers `custom:wall-panel-sonos-mini-card` — a compact "Now Playing" tile sized for a home dashboard alongside weather / scene cards. Hides itself entirely when no configured entity is playing or paused. Tapping the art / text / room label fires a navigate action so a tap takes you to the full card.

```yaml
type: custom:wall-panel-sonos-mini-card
navigation_path: /lovelace/music
volume_step: 5
entities:
  - media_player.living_room
  - media_player.kitchen
  - media_player.primary_bedroom
# Optional — same shape as the full card. Duplicate the entries here if
# you want the mini tile to show custom art for metadata-less streams.
station_art:
  - match: "stationId=s297990"
    name: "MSNBC Now"
    image: "https://upload.wikimedia.org/wikipedia/commons/1/15/MSNBC_2015_logo.svg"
```

The mini card uses the same metadata fallbacks as the full card: it borrows title/art from the group coordinator when the picked entity is a slave, extracts the streaming source from `media_content_id` when HA doesn't expose one, and respects `station_art` when supplied.

## Config reference

| Key | Type | Required | Default | Description |
|---|---|---|---|---|
| `entities` | string[] | yes | — | Sonos `media_player.*` entity IDs |
| `names` | object | no | — | Map of `entity_id → friendly label` override |
| `groups` | array | no | — | Saved groups shown in the room dropdown |
| `favorites` | array | no | — | Items shown in the Favorites view |
| `default_view` | string | no | `player` | `player` / `favorites` / `grouping` |
| `layout` | string | no | `wall` | `wall` (no search input) / `mobile` |
| `track_scale` | number | no | `1.15` | Now-playing text scale (0.9–1.6) |
| `vol_bar_scale` | number | no | `1.4` | Volume bar thickness (1.0–2.5) |
| `max_volume` | number | no | `100` | Cap the slider's effective range (1–100). Set to e.g. `40` for finer control at low volumes — the slider then maps 0–100% width to 0–40 actual volume. The +/- buttons step proportionally (~5% of range, min 1). |
| `station_art` | array | no | — | Cover art / labels for streaming sources HA exposes no metadata for (TuneIn, SiriusXM, Sonos Radio). See below. |

### Station art

HA's Sonos integration doesn't populate `media_title` or `entity_picture` for many streaming sources — the only identifying string is buried in `media_content_id` (e.g. `&source=TuneIn&...&stationId=s297990&...`). `station_art` lets you map a substring of `media_content_id` to a cover image and label.

```yaml
station_art:
  - match: "stationId=s297990"   # case-insensitive substring of media_content_id
    name: "MSNBC Now"
    image: "https://upload.wikimedia.org/wikipedia/commons/1/15/MSNBC_2015_logo.svg"
  - match: "source=SiriusXM"
    name: "SiriusXM"
    image: "https://example.com/siriusxm.png"
```

The first matching entry wins. To find the right `match` string, open Developer Tools → States while the station is playing and copy a stable substring out of `media_content_id`.

### Favorite item

| Key | Type | Description |
|---|---|---|
| `id` | string | Unique key |
| `name` | string | Display name |
| `type` | `playlist` / `station` / `album` | Used for filtering and icon |
| `media_content_id` + `media_content_type` | string | Played via `media_player.play_media` |
| `script` | string | Alternative — fires a `script.*` entity. The card passes `entity_id` (active room) and `group_members` (current group) as script fields so one script can target whichever room the user is on. |
| `art` | string | CSS background (gradient or `url(...)`) |

## Theming

Override any of the CSS custom properties via a `card-mod` block or a custom theme:

```css
/* Palette */
--wp-text
--wp-text-dim
--wp-bg
--wp-card
--wp-card-2
--wp-accent
--wp-accent-2

/* Translucent fills (derived from palette by default) */
--wp-overlay-soft       /* button bg, tab bg, pill bg */
--wp-overlay            /* banner bg, group-volumes bg */
--wp-overlay-strong     /* title bg when menu is open */
--wp-scrim              /* dropdown backdrop */
--wp-divider            /* progress bar / volume slider track */
--wp-on-accent-soft     /* check circle on grouped row */
--wp-pill-on-active     /* secondary pill over an accent surface */
--wp-accent-soft        /* "in group" row tint — color-mix of --wp-accent */

/* Shadows */
--wp-shadow-card
--wp-shadow-cover
--wp-shadow-play
--wp-shadow-menu

/* Geometry & scale */
--wp-radius
--wp-radius-pill
--wp-track-scale
--wp-vol-scale
```

## Status

v0.1.0 — initial release. Visual editor covers core fields; `favorites` / `groups` still YAML-only.
