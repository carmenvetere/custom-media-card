# Wall Panel Sonos Card

A Sonos multi-room control card for Home Assistant, designed for wall-mounted tablets. Three internal views (Now Playing / Favorites / Speakers) accessible from a single-screen card with no popups.

## Features

- **Player view** — cover, track meta, transport, volume slider sized for finger touch; tap the volume icon to mute/unmute
- **Favorites view** — single-column list with category pills, curated via YAML or the visual editor
- **Search view** — live query against `media_player.search_media` (HA 2025.x+); disable per-instance for wall panels where a keyboard prompt is unwelcome
- **Speakers view** — tap to add/remove rooms from the current group, with per-room volume sliders for the group; taps reflect instantly while Sonos re-forms the group
- **Header dropdown** — tap the room name to switch active speaker or jump to a saved group
- **Instant touch response** — transport and mute fire on press (pointerdown), not release, and every state change renders optimistically before the Sonos round-trip completes
- **Accessible** — full aria labeling, keyboard-operable sliders (arrow keys / Home / End), visible focus rings for keyboard navigation
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

## Shared store + sidebar panel (optional)

By default each card instance keeps its own `favorites:` / `groups:` / `station_art:` in dashboard YAML. The bundled **`wall_panel_sonos` custom component** moves those lists into HA's `.storage` and adds a **"Sonos Card" sidebar panel** for editing them — every card with `use_shared_store: true` reads the same lists and updates live when you edit, across all dashboards.

### Install the integration

1. Copy `custom_components/wall_panel_sonos/` from this repo into `<config>/custom_components/` (HACS manages only the card; the integration is a manual copy).
2. Add one line to `configuration.yaml`:
   ```yaml
   wall_panel_sonos:
   ```
3. Restart Home Assistant. A **Sonos Card** item appears in the sidebar.

### Point cards at the store

```yaml
type: custom:wall-panel-sonos-card
use_shared_store: true
entities:
  - media_player.living_room
# favorites/groups/station_art may stay here as a fallback — they're
# used until the store loads, or if the integration is removed.
```

Notes:
- Edits in the panel require an **admin** user; wall tablets running restricted users can read but not write.
- The store pushes updates over WebSocket — cards reflect panel edits immediately, no reload.
- The mini card doesn't read the shared store yet (its `station_art` stays per-card config).

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
| `default_view` | string | no | `player` | `player` / `favorites` / `search` / `grouping` |
| `search_enabled` | boolean | no | `true` | Show the Search view in the header. Set `false` on wall-panel installs to avoid the on-screen keyboard prompt. Requires HA 2025.x for `media_player.search_media`. |
| `use_shared_store` | boolean | no | `false` | Read favorites/groups/station_art from the `wall_panel_sonos` integration's shared store (see "Shared store + sidebar panel"). YAML lists become the fallback. |
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

/* Shadows — outer card + cover fall back to HA's --ha-card-box-shadow
   when the theme sets one, so a theme with its own elevation shows through. */
--wp-shadow-card
--wp-shadow-cover
--wp-shadow-play
--wp-shadow-menu

/* Geometry — outer radius follows the HA theme's --ha-card-border-radius.
   Interior tiles derive from two smaller stops so a theme aiming for a
   flatter or more-rounded language can shift them independently. Pill
   (999px) and round-button (50%) shapes stay hard-coded — they're
   structural, not decorative. */
--wp-radius            /* outer card, falls back to --ha-card-border-radius, 28px */
--wp-radius-tile       /* cover, menu card, group volumes panel */
--wp-radius-tile-sm    /* menu items, favorite art tile, banner */
--wp-radius-pill       /* fav rows, group rows */
--wp-track-scale
--wp-vol-scale
```

## Status

Visual editor now covers rooms, options, favorites, groups, and station art — YAML remains a fully supported path for power users. Service-call failures (bad `media_content_id`, unknown script, offline speaker) surface as a red banner at the top of the card for 5 seconds.
