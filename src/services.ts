// Service-call wrappers — keeps the card body declarative.
// Every interactive surface in the card calls one of these.

import type { HomeAssistant } from "custom-card-helpers";
import type { BrowseMediaNode, SearchMediaResult } from "./types";

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
// The response shape has moved around between HA versions:
//   - {response: {<entity_id>: {result: [...]}}, context}
//   - {response: {result: [...]}, context}
//   - {result: [...]}
// We try each shape defensively rather than assuming one.
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
      // Include entity_id in service_data as well as target — some
      // HA versions bind on one, some on the other, both together works.
      entity_id,
      search_query,
      ...(media_content_type ? { media_content_type } : {}),
    },
    target: { entity_id },
    return_response: true,
  });
  const result = extractSearchResult(raw, entity_id);
  if (!result.length) {
    // Only when we came back empty — helps diagnose an unexpected shape
    // without spamming the console on every successful search.
    // eslint-disable-next-line no-console
    console.debug("[wall-panel-sonos-card] search_media returned no items; raw response:", raw);
  }
  return result;
};

const extractSearchResult = (
  raw: unknown,
  entity_id: string,
): SearchMediaResult[] => {
  const arrayAt = (o: unknown): SearchMediaResult[] | null => {
    const v = (o as { result?: unknown })?.result;
    return Array.isArray(v) ? (v as SearchMediaResult[]) : null;
  };
  if (!raw || typeof raw !== "object") return [];
  const r = raw as Record<string, unknown>;
  // {result: [...]}
  const flat = arrayAt(r);
  if (flat) return flat;
  // {response: ...}
  const resp = r.response as Record<string, unknown> | undefined;
  if (resp && typeof resp === "object") {
    // {response: {result: [...]}}
    const flatInResp = arrayAt(resp);
    if (flatInResp) return flatInResp;
    // {response: {<entity_id>: {result: [...]}}}
    const perEntity = arrayAt(resp[entity_id]);
    if (perEntity) return perEntity;
    // {response: {<any-entity>: {result: [...]}}} — fall through to
    // whichever key HA used if entity_id doesn't match verbatim.
    for (const k of Object.keys(resp)) {
      const v = arrayAt(resp[k]);
      if (v) return v;
    }
  }
  // {<entity_id>: {result: [...]}}
  const perEntity = arrayAt(r[entity_id]);
  if (perEntity) return perEntity;
  return [];
};

// Browse a media_player's media tree over the WebSocket API. Used to
// enumerate the Music Assistant library (playlists / radio / albums)
// for the Favorites view's music_assistant source.
export const browseMedia = (
  hass: HomeAssistant,
  entity_id: string,
  media_content_id?: string,
  media_content_type?: string,
): Promise<BrowseMediaNode> =>
  hass.callWS({
    type: "media_player/browse_media",
    entity_id,
    ...(media_content_id ? { media_content_id } : {}),
    ...(media_content_type ? { media_content_type } : {}),
  });

// Fallback search path for Music Assistant installs whose player
// entities don't implement media_player.search_media yet: the
// music_assistant.search action searches all configured providers.
// It needs the MA config entry id, which we look up by domain.
export const maSearch = async (
  hass: HomeAssistant,
  search_query: string,
  limit = 8,
): Promise<SearchMediaResult[]> => {
  const entries = await hass.callWS<{ entry_id: string; domain: string }[]>({
    type: "config_entries/get",
    domain: "music_assistant",
  });
  const entry = entries?.[0];
  if (!entry) throw new Error("Music Assistant integration not found");
  const raw = await hass.callWS<Record<string, unknown>>({
    type: "call_service",
    domain: "music_assistant",
    service: "search",
    service_data: {
      config_entry_id: entry.entry_id,
      name: search_query,
      limit,
    },
    return_response: true,
  });
  const resp = ((raw as { response?: unknown })?.response ?? raw) as Record<string, unknown>;
  // Response groups items by category; each item carries uri /
  // media_type / name / image. Category list is defensive — MA has
  // grown podcasts/audiobooks over time.
  const out: SearchMediaResult[] = [];
  const CATEGORIES = ["tracks", "artists", "albums", "playlists", "radio", "podcasts", "audiobooks"];
  for (const cat of CATEGORIES) {
    const items = resp?.[cat];
    if (!Array.isArray(items)) continue;
    for (const item of items as Record<string, unknown>[]) {
      const uri = item.uri ?? item.media_content_id;
      const name = item.name ?? item.title;
      if (typeof uri !== "string" || typeof name !== "string") continue;
      out.push({
        title: name,
        media_content_id: uri,
        media_content_type: (item.media_type as string | undefined) ?? "music",
        media_class: cat.replace(/s$/, ""),
        thumbnail: (item.image as string | undefined) ?? undefined,
      });
    }
  }
  return out;
};
