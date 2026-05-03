// Main card element. Lit port of ThemedSonosCard from the React mockup.
//
// Reads `hass` + `config` (set by Lovelace), derives display state from
// the active media_player entity + its group_members, and dispatches HA
// service calls for every interactive surface.

import { LitElement, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";
import type { HomeAssistant, LovelaceCard } from "custom-card-helpers";

import { CARD_TAG, EDITOR_TAG, CARD_VERSION } from "./const";
import { cardStyles } from "./styles";
import * as Svc from "./services";
import {
  iconStar, iconSpeaker, iconChev, iconVol, iconVolUp, iconVolDown,
  iconPrev, iconNext, iconPlay, iconPause,
  iconStation, iconAlbum, iconPlaylist,
  iconLink, iconCheck, iconEq,
} from "./icons";
import type {
  WallPanelSonosCardConfig,
  ViewName,
  MediaPlayerState,
  FavoriteConfig,
} from "./types";

const fmt = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

@customElement(CARD_TAG)
export class WallPanelSonosCard extends LitElement implements LovelaceCard {
  static styles = cardStyles;

  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config!: WallPanelSonosCardConfig;
  @state() private _view: ViewName = "player";
  @state() private _activeRoom: string = "";
  @state() private _menuOpen = false;
  @state() private _favTab: "All" | "Playlists" | "Stations" | "Albums" = "All";
  @state() private _favQ = "";
  // Per-entity slider value while a drag is in progress. Lets the knob
  // track the user's finger instead of snapping back to the last hass value.
  @state() private _dragVol: Record<string, number> = {};

  // Lovelace lifecycle
  static getStubConfig(): Partial<WallPanelSonosCardConfig> {
    return {
      type: `custom:${CARD_TAG}`,
      entities: [],
      default_view: "player",
      layout: "wall",
    };
  }
  static async getConfigElement() {
    await import("./editor");
    return document.createElement(EDITOR_TAG);
  }

  setConfig(config: WallPanelSonosCardConfig) {
    if (!config.entities || !Array.isArray(config.entities) || config.entities.length === 0) {
      throw new Error("wall-panel-sonos-card: 'entities' is required and must be a non-empty list of media_player entity IDs.");
    }
    const firstInit = !this._config;
    this._config = config;
    if (!this._activeRoom || !config.entities.includes(this._activeRoom)) {
      this._activeRoom = config.entities[0];
    }
    // Only honor default_view on the initial setConfig — re-renders from
    // dashboard edits / theme swaps shouldn't yank the user back from
    // whatever view they navigated to.
    if (firstInit && config.default_view) this._view = config.default_view;
    const trackScale = Math.max(0.9, Math.min(1.6, config.track_scale ?? 1.15));
    const volScale = Math.max(1, Math.min(2.5, config.vol_bar_scale ?? 1.4));
    this.style.setProperty("--wp-track-scale", String(trackScale));
    this.style.setProperty("--wp-vol-scale", String(volScale));
    if (config.layout === "mobile") this.setAttribute("narrow", "");
    else this.removeAttribute("narrow");
  }

  getCardSize() { return 8; }

  // ── Derived state from hass ───────────────────────────────────────
  private _state(id: string): MediaPlayerState | undefined {
    return this.hass?.states[id] as unknown as MediaPlayerState;
  }
  private _label(id: string) {
    return this._config?.names?.[id]
      ?? this._state(id)?.attributes.friendly_name
      ?? id.replace("media_player.", "").replace(/_/g, " ");
  }
  private _groupMembers(): string[] {
    const s = this._state(this._activeRoom);
    const m = s?.attributes.group_members ?? [this._activeRoom];
    // Filter to only entities the card was configured with
    return m.filter(x => this._config.entities.includes(x));
  }

  // ── Handlers ──────────────────────────────────────────────────────
  private _setView(v: ViewName) {
    this._view = (this._view === v && v !== "player") ? "player" : v;
    this._menuOpen = false;
  }
  private _onTitleClick() {
    if (this._view !== "player") this._view = "player";
    else this._menuOpen = !this._menuOpen;
  }
  private _pickRoom(id: string) {
    const cur = this._groupMembers();
    this._activeRoom = id;
    this._menuOpen = false;
    // If the picked room is already grouped with the previously-active
    // room, just switch the view — don't tear the group apart. Otherwise
    // solo it (matches the dropdown's "pick a standalone room" intent).
    if (!cur.includes(id)) Svc.unjoin(this.hass, id);
  }
  private _pickGroup(entities: string[]) {
    if (entities.length === 0) return;
    const primary = entities[0];
    this._activeRoom = primary;
    this._menuOpen = false;
    Svc.joinGroup(this.hass, primary, entities.slice(1));
  }
  private _toggleInGroup(id: string) {
    if (id === this._activeRoom) return;
    const cur = this._groupMembers();
    if (cur.includes(id)) Svc.unjoin(this.hass, id);
    else Svc.joinGroup(this.hass, this._activeRoom, [...cur.filter(x => x !== this._activeRoom), id]);
  }
  private _slide(e: PointerEvent, onChange: (v: number) => void, key?: string) {
    const el = e.currentTarget as HTMLElement;
    const update = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const v = Math.max(0, Math.min(100, Math.round(((ev.clientX - r.left) / r.width) * 100)));
      if (key) this._dragVol = { ...this._dragVol, [key]: v };
      onChange(v);
    };
    try { el.setPointerCapture(e.pointerId); } catch { /* noop */ }
    update(e);
    const move = (ev: PointerEvent) => update(ev);
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      try { el.releasePointerCapture(e.pointerId); } catch { /* noop */ }
      if (key && key in this._dragVol) {
        const next = { ...this._dragVol };
        delete next[key];
        this._dragVol = next;
      }
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  }

  // ── Render ────────────────────────────────────────────────────────
  render() {
    if (!this._config || !this.hass) return html``;
    const s = this._state(this._activeRoom);
    if (!s) return html`<ha-card><div style="padding:24px;color:var(--wp-text-dim)">Entity ${this._activeRoom} not found.</div></ha-card>`;

    const groupMembers = this._groupMembers();
    const groupSize = groupMembers.length;
    const titleText = this._view === "favorites" ? "Favorites"
      : this._view === "grouping" ? "Speakers"
      : this._label(this._activeRoom);

    return html`
      <ha-card>
        <div class="root">
          ${this._renderHeader(titleText, groupSize)}
          ${this._view === "player" ? this._renderPlayer(s) : nothing}
          ${this._view === "favorites" ? this._renderFavorites() : nothing}
          ${this._view === "grouping" ? this._renderGrouping(groupMembers) : nothing}
          ${this._menuOpen ? this._renderMenu(groupMembers) : nothing}
        </div>
      </ha-card>
    `;
  }

  private _renderHeader(titleText: string, groupSize: number) {
    return html`
      <div class="hdr">
        <button class=${classMap({ "hdr-btn": true, active: this._view === "favorites" })}
                @click=${() => this._setView("favorites")} aria-label="Favorites">
          ${iconStar}
        </button>
        <button class=${classMap({ "hdr-title": true, "menu-open": this._menuOpen })}
                @click=${this._onTitleClick}>
          <span>${titleText}</span>
          ${this._view === "player" && groupSize > 1
            ? html`<span class="group-pill">+${groupSize - 1}</span>` : nothing}
          ${this._view === "player"
            ? html`<span class=${classMap({ chev: true, up: this._menuOpen })}>${iconChev}</span>` : nothing}
        </button>
        <button class=${classMap({ "hdr-btn": true, active: this._view === "grouping" })}
                @click=${() => this._setView("grouping")} aria-label="Speakers">
          ${iconSpeaker}
        </button>
      </div>
    `;
  }

  private _renderPlayer(s: MediaPlayerState) {
    const a = s.attributes;
    const dur = a.media_duration ?? 0;
    const pos = a.media_position ?? 0;
    const playing = s.state === "playing";
    const vol = Math.round((a.volume_level ?? 0) * 100);
    const cover = a.entity_picture
      ? `url(${a.entity_picture})`
      : "linear-gradient(135deg, var(--wp-accent) 0%, var(--wp-card-2) 60%, var(--wp-bg) 100%)";

    return html`
      <div class="pv">
        <div class="src">
          ${a.source ? html`<span class="src-dot"></span>${a.source}` : nothing}
        </div>
        <div class="cover-wrap">
          <div class="cover" style=${styleMap({ background: cover })}></div>
        </div>
        <div class="meta">
          <div class="track">${a.media_title ?? "Nothing playing"}</div>
          <div class="sub">${a.media_artist ?? ""}${a.media_album_name ? ` · ${a.media_album_name}` : ""}</div>
        </div>
        <div class="progress">
          <span>${fmt(pos)}</span>
          <div class="bar"><span style=${styleMap({ width: `${dur > 0 ? (pos / dur) * 100 : 0}%` })}></span></div>
          <span>${fmt(dur)}</span>
        </div>
        <div class="transport">
          <button class="t-btn" @click=${() => Svc.setVolume(this.hass, this._activeRoom, Math.max(0, vol - 5))}>${iconVolDown}</button>
          <button class="t-btn" @click=${() => Svc.prev(this.hass, this._activeRoom)}>${iconPrev}</button>
          <button class="play-btn" @click=${() => Svc.playPause(this.hass, this._activeRoom)}>
            ${playing ? iconPause : iconPlay}
          </button>
          <button class="t-btn" @click=${() => Svc.next(this.hass, this._activeRoom)}>${iconNext}</button>
          <button class="t-btn" @click=${() => Svc.setVolume(this.hass, this._activeRoom, Math.min(100, vol + 5))}>${iconVolUp}</button>
        </div>
        <div class="vol-row">
          <span style="display:flex">${iconVol}</span>
          ${this._slider(vol, v => Svc.setVolume(this.hass, this._activeRoom, v), this._activeRoom)}
        </div>
      </div>
    `;
  }

  private _slider(value: number, onChange: (v: number) => void, key?: string) {
    const display = key && key in this._dragVol ? this._dragVol[key] : value;
    return html`
      <div class="slider" @pointerdown=${(e: PointerEvent) => this._slide(e, onChange, key)}>
        <div class="fill" style=${styleMap({ width: `${display}%` })}></div>
        <div class="knob" style=${styleMap({ left: `${display}%` })}></div>
      </div>
    `;
  }

  private _renderFavorites() {
    const cfg = this._config.favorites ?? [];
    const tabs: Array<typeof this._favTab> = ["All", "Playlists", "Stations", "Albums"];
    const filtered = cfg.filter(f => {
      if (this._favTab === "Playlists" && f.type !== "playlist") return false;
      if (this._favTab === "Stations" && f.type !== "station") return false;
      if (this._favTab === "Albums" && f.type !== "album") return false;
      if (this._favQ && !f.name.toLowerCase().includes(this._favQ.toLowerCase())) return false;
      return true;
    });
    const groupSize = this._groupMembers().length;

    return html`
      <div class="pv">
        <div class="fav-target">
          Play to <b>${this._label(this._activeRoom)}${groupSize > 1 ? ` +${groupSize - 1}` : ""}</b>
        </div>
        <div class="tabs">
          ${tabs.map(tb => html`
            <button class=${classMap({ tab: true, active: this._favTab === tb })}
                    @click=${() => this._favTab = tb}>${tb}</button>
          `)}
        </div>
        <div class="fav-list">
          ${filtered.length === 0
            ? html`<div style="text-align:center;color:var(--wp-text-dim);padding:40px;font-size:15px">No favorites configured</div>`
            : filtered.map(f => html`
              <button class="fav-item" @click=${() => this._playFavorite(f)}>
                <span class="fav-art" style=${styleMap({ background: f.art ?? "linear-gradient(135deg,#4a5d72,#2a3540)" })}>
                  ${f.type === "station" ? iconStation : f.type === "album" ? iconAlbum : iconPlaylist}
                </span>
                <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.name}</span>
              </button>
            `)}
        </div>
      </div>
    `;
  }

  private _playFavorite(f: FavoriteConfig) {
    if (f.script) Svc.fireScript(this.hass, f.script);
    else if (f.media_content_id && f.media_content_type)
      Svc.playMedia(this.hass, this._activeRoom, f.media_content_id, f.media_content_type);
    this._view = "player";
  }

  private _renderGrouping(groupMembers: string[]) {
    const allEntities = this._config.entities;
    const inGroup = (id: string) => groupMembers.includes(id);
    return html`
      <div class="pv">
        <div class="grp-banner">
          <div style="min-width:0">
            <div class="lbl">Currently grouped</div>
            <div class="rooms">${groupMembers.map(id => this._label(id)).join(" + ") || "—"}</div>
          </div>
          <div class="hint">Tap to toggle</div>
        </div>
        <div class="grp-grid">
          ${allEntities.map(id => {
            const active = id === this._activeRoom;
            const grouped = inGroup(id);
            return html`
              <button class=${classMap({ "grp-row": true, primary: active, grouped: grouped && !active })}
                      @click=${() => this._toggleInGroup(id)}>
                <span style="display:flex;align-items:center;gap:8px;flex:1;min-width:0">
                  ${active ? html`<span style="display:flex">${iconEq}</span>` : nothing}
                  <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${this._label(id)}</span>
                </span>
                ${active ? html`<span class="badge">PRIMARY</span>`
                  : grouped ? html`<span style="width:20px;height:20px;border-radius:50%;background:rgba(255,255,255,0.6);display:flex;align-items:center;justify-content:center;color:var(--wp-bg)">${iconCheck}</span>`
                  : nothing}
              </button>
            `;
          })}
        </div>
        ${groupMembers.length > 1 ? html`
          <div class="grp-volumes">
            <div class="grp-volumes-title">Group Volumes</div>
            ${groupMembers.map(id => {
              const v = Math.round((this._state(id)?.attributes.volume_level ?? 0) * 100);
              return html`
                <div class="grp-vol-row">
                  <span class="name">${this._label(id)}${id === this._activeRoom ? html`<span style="color:var(--wp-accent)"> ·</span>` : nothing}</span>
                  ${this._slider(v, vv => Svc.setVolume(this.hass, id, vv), id)}
                  <span class="val">${v}</span>
                </div>
              `;
            })}
          </div>
        ` : nothing}
      </div>
    `;
  }

  private _renderMenu(groupMembers: string[]) {
    const savedGroups = this._config.groups ?? [];
    const currentSig = [...groupMembers].sort().join(",");
    return html`
      <div class="menu-overlay" @click=${() => this._menuOpen = false}>
        <div class="menu-card" @click=${(e: Event) => e.stopPropagation()}>
          ${groupMembers.length > 1 || savedGroups.length > 0 ? html`<div class="menu-section">Groups</div>` : nothing}
          ${groupMembers.length > 1 ? html`
            <button class="menu-item active">
              <span style="display:flex">${iconLink}</span>
              <span style="flex:1">${groupMembers.map(id => this._label(id)).join(" + ")}</span>
              <span class="now-pill">NOW</span>
            </button>
          ` : nothing}
          ${savedGroups
            .filter(g => {
              const inConfig = g.entities.filter(e => this._config.entities.includes(e));
              return [...inConfig].sort().join(",") !== currentSig;
            })
            .map(g => html`
              <button class="menu-item" @click=${() => this._pickGroup(g.entities)}>
                <span style="display:flex">${iconLink}</span>
                <span style="flex:1">${g.label}</span>
              </button>
            `)}
          <div class="menu-section">Rooms</div>
          ${this._config.entities.map(id => {
            const isActive = id === this._activeRoom && groupMembers.length === 1;
            const inGrp = groupMembers.includes(id) && groupMembers.length > 1;
            return html`
              <button class=${classMap({ "menu-item": true, active: isActive })}
                      @click=${() => this._pickRoom(id)}>
                <span style="display:flex">${iconSpeaker}</span>
                <span style="flex:1">${this._label(id)}</span>
                ${inGrp ? html`<span class="group-pill">IN GROUP</span>` : nothing}
              </button>
            `;
          })}
        </div>
      </div>
    `;
  }
}

// Register with the HA card picker
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: CARD_TAG,
  name: "Wall Panel Sonos Card",
  description: "Sonos multi-room control designed for wall-mounted tablets.",
  preview: false,
  documentationURL: "https://github.com/your-org/wall-panel-sonos-card",
});

export { CARD_VERSION };
