// Service-call wrappers — keeps the card body declarative.
// Every interactive surface in the card calls one of these.

import type { HomeAssistant } from "custom-card-helpers";
import type { SearchMediaResult } from "./types";

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

export const fireScript = (
  hass: HomeAssistant,
  script_entity: string,
  vars: Record<string, unknown> = {},
) => {
  const name = script_entity.startsWith("script.")
    ? script_entity.slice("script.".length)
    : script_entity;
  return hass.callService("script", name, vars);
};

// media_player.search_media returns items from the integration's search
// backend (HA 2025.x+). Called via the WebSocket API so we can request
// `return_response: true` and read the results directly, which the
// classic callService signature doesn't expose.
//
// Response shape is nested under `response[entity_id]` — HA aggregates
// per-target results even for a single-entity call. We defensively look
// in both `response.<eid>` and the top level in case a future HA
// version flattens it.
export const searchMedia = async (
  hass: HomeAssistant,
  entity_id: string,
  search_query: string,
  media_content_type?: string,
): Promise<SearchMediaResult[]> => {
  const raw = await hass.callWS<Record<string, unknown>>({
    type: "call_service",
    domain: "media_player",
    service: "search_media",
    service_data: {
      search_query,
      ...(media_content_type ? { media_content_type } : {}),
    },
    target: { entity_id },
    return_response: true,
  });
  const response = (raw?.response as Record<string, { result?: SearchMediaResult[] }> | undefined)
    ?? (raw as Record<string, { result?: SearchMediaResult[] }>);
  return response?.[entity_id]?.result ?? [];
};
