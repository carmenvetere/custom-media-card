// Service-call wrappers — keeps the card body declarative.
// Every interactive surface in the card calls one of these.

import type { HomeAssistant } from "custom-card-helpers";

export const playPause = (hass: HomeAssistant, entity_id: string) =>
  hass.callService("media_player", "media_play_pause", { entity_id });

export const next = (hass: HomeAssistant, entity_id: string) =>
  hass.callService("media_player", "media_next_track", { entity_id });

export const prev = (hass: HomeAssistant, entity_id: string) =>
  hass.callService("media_player", "media_previous_track", { entity_id });

export const setVolume = (
  hass: HomeAssistant,
  entity_id: string,
  pct: number,
) =>
  hass.callService("media_player", "volume_set", {
    entity_id,
    volume_level: Math.max(0, Math.min(1, pct / 100)),
  });

export const muteToggle = (
  hass: HomeAssistant,
  entity_id: string,
  is_muted: boolean,
) =>
  hass.callService("media_player", "volume_mute", {
    entity_id,
    is_volume_muted: !is_muted,
  });

// Sonos grouping uses join/unjoin. The "primary" is the entity_id you call
// join on; group_members is the list of others to add.
export const joinGroup = (
  hass: HomeAssistant,
  primary: string,
  members: string[],
) =>
  hass.callService("media_player", "join", {
    entity_id: primary,
    group_members: members,
  });

export const unjoin = (hass: HomeAssistant, entity_id: string) =>
  hass.callService("media_player", "unjoin", { entity_id });

export const playMedia = (
  hass: HomeAssistant,
  entity_id: string,
  media_content_id: string,
  media_content_type: string,
) =>
  hass.callService("media_player", "play_media", {
    entity_id,
    media_content_id,
    media_content_type,
  });

export const fireScript = (hass: HomeAssistant, script_entity: string) =>
  hass.callService("script", script_entity.replace("script.", ""), {});
