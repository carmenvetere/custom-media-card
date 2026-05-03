// Type definitions for the Wall Panel Sonos Card.
// Trimmed shape of the bits of HomeAssistant we actually use.

import type { LovelaceCardConfig } from "custom-card-helpers";

export interface WallPanelSonosCardConfig extends LovelaceCardConfig {
  type: string;
  // List of media_player entity IDs to expose as rooms.
  entities: string[];
  // Optional friendly name override per entity (id -> label).
  names?: Record<string, string>;
  // Optional list of pre-built groups shown in the room dropdown.
  groups?: { id: string; label: string; entities: string[] }[];
  // Optional list of favorites. If omitted, card will try
  // media_player/browse_media on the active entity.
  favorites?: FavoriteConfig[];
  // Default view when card mounts. 'player' | 'favorites' | 'grouping'
  default_view?: "player" | "favorites" | "grouping";
  // Visual tweaks
  track_scale?: number; // 0.9 - 1.6
  vol_bar_scale?: number; // 1 - 2.5
  // 'wall' or 'mobile' — affects density / hides on-screen keyboard input.
  layout?: "wall" | "mobile";
}

export interface FavoriteConfig {
  id: string;
  name: string;
  type: "playlist" | "station" | "album";
  // Either a media_content_id usable with media_player.play_media
  // or a script entity id to fire.
  media_content_id?: string;
  media_content_type?: string;
  script?: string;
  // Optional cover override (URL or CSS gradient)
  art?: string;
}

export type ViewName = "player" | "favorites" | "grouping";

// HA media_player entity state shape (subset)
export interface MediaPlayerState {
  entity_id: string;
  state: string; // 'playing' | 'paused' | 'idle' | 'off' | ...
  attributes: {
    friendly_name?: string;
    volume_level?: number; // 0..1
    is_volume_muted?: boolean;
    media_title?: string;
    media_artist?: string;
    media_album_name?: string;
    media_duration?: number;
    media_position?: number;
    media_position_updated_at?: string;
    entity_picture?: string;
    group_members?: string[];
    source?: string;
  };
}
