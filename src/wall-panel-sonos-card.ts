// Main card element. Lit port of ThemedSonosCard from the React mockup.
//
// Reads `hass` + `config` (set by Lovelace), derives display state from
// the active media_player entity + its group_members, and dispatches HA
// service calls for every interactive surface.

import { LitElement, html, nothing, type PropertyValues } from "lit";
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
  StationArt,
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
  // Becomes true once the user manually picks a room (dropdown or
  // Speakers view) — suppresses the one-shot auto-pick that lands on
  // whatever's already playing when the card first sees hass.
  private _userPickedRoom = false;
  @state() private _menuOpen = false;
  @state() private _favTab: "All" | "Playlists" | "Stations" | "Albums" = "All";
  @state() private _favQ = "";
  // Per-entity slider value held while the user drags AND briefly after
  // release, so the knob tracks the finger and doesn't snap back to the
  // stale hass value before the volume_set service round-trips.
  @state() private _dragVol: Record<string, number> = {};
  // Optimistic play/playing state — flips immediately on click, cleared
  // when hass state catches up. Avoids the perceived "lag" on the play
  // button while the media_player.media_play_pause call is in flight.
  @state() private _optimisticPlaying: boolean | null = null;
  // When the user picks a favorite, show its name in the player view as
  // "Loading…" until hass reports a track change. Without this the
  // player view appears frozen on the previous track for a beat.
  @state() private _loadingName: string | null = null;
  private _loadingTimer?: ReturnType<typeof setTimeout>;
  private _prevTitle: string | undefined;
  // Wall-clock used to interpolate media_position between hass updates.
  // Bumped every 500ms while a track is playing.
  @state() private _now = Date.now();
  private _dragTimers: Record<string, ReturnType<typeof setTimeout>> = {};
  private _tickHandle?: ReturnType<typeof setInterval>;

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

  connectedCallback() {
    super.connectedCallback();
    this._tickHandle = setInterval(() => {
      // Only re-render the progress bar when there's something to advance.
      const s = this._state(this._activeRoom);
      if (s?.state === "playing" && this._view === "player") this._now = Date.now();
    }, 500);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._tickHandle) clearInterval(this._tickHandle);
    if (this._loadingTimer) clearTimeout(this._loadingTimer);
    for (const t of Object.values(this._dragTimers)) clearTimeout(t);
    this._dragTimers = {};
  }

  willUpdate(changed: PropertyValues) {
    if (!changed.has("hass") || !this._config) return;
    // One-shot: when hass first arrives, switch the active room to
    // whatever's currently playing (largest group wins, then earliest
    // in entities). After this, we never auto-switch again — manual
    // picks own the selection.
    if (!this._userPickedRoom) {
      const best = this._pickActivePlayer();
      if (best && best !== this._activeRoom) this._activeRoom = best;
      this._userPickedRoom = true;
    }
    // Clear the optimistic play state once hass reflects what we sent.
    if (this._optimisticPlaying !== null) {
      const real = this._state(this._activeRoom)?.state === "playing";
      if (real === this._optimisticPlaying) this._optimisticPlaying = null;
    }
    // Clear the favorite "Loading…" overlay as soon as the track title
    // changes (Sonos has actually switched). Falls back to the 8s timer
    // we set in _playFavorite if the title never changes.
    if (this._loadingName !== null) {
      const cur = this._state(this._activeRoom)?.attributes.media_title;
      if (cur && cur !== this._prevTitle) {
        this._loadingName = null;
        if (this._loadingTimer) { clearTimeout(this._loadingTimer); this._loadingTimer = undefined; }
      }
    }
    // Clear post-release volume latches whose hass value has caught up.
    // Active drags don't have a timer entry yet, so they're left alone.
    let nextDrag: Record<string, number> | null = null;
    for (const key of Object.keys(this._dragVol)) {
      if (!this._dragTimers[key]) continue;
      const real = Math.round((this._state(key)?.attributes.volume_level ?? 0) * 100);
      if (Math.abs(real - this._dragVol[key]) <= 2) {
        if (!nextDrag) nextDrag = { ...this._dragVol };
        delete nextDrag[key];
        clearTimeout(this._dragTimers[key]);
        delete this._dragTimers[key];
      }
    }
    if (nextDrag) this._dragVol = nextDrag;
  }

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
  // Find a group member whose attributes carry the actual playing track
  // metadata (HA's Sonos integration only populates these on the
  // coordinator). Returns undefined if no member has metadata.
  private _coordinatorMeta(
    members: string[] | undefined,
  ): MediaPlayerState["attributes"] | undefined {
    if (!members) return undefined;
    for (const id of members) {
      if (id === this._activeRoom) continue;
      const att = this._state(id)?.attributes;
      if (att && (att.media_title || att.entity_picture)) return att;
    }
    return undefined;
  }
  // Look up a user-configured station_art entry by substring match
  // against media_content_id. Used to surface art/labels for streaming
  // sources HA doesn't populate metadata for (TuneIn, SiriusXM, etc.).
  private _stationArt(contentId: string | undefined): StationArt | undefined {
    if (!contentId || !this._config?.station_art?.length) return undefined;
    const cid = contentId.toLowerCase();
    return this._config.station_art.find(
      e => e.match && cid.includes(e.match.toLowerCase()),
    );
  }
  // Sonos buries the streaming service in the media_content_id query
  // string when no `source` attribute is exposed (TuneIn radio, etc.).
  private _sourceFromContentId(contentId: string | undefined): string | undefined {
    if (!contentId) return undefined;
    const m = contentId.match(/[?&]source=([^&]+)/i);
    return m ? decodeURIComponent(m[1]) : undefined;
  }
  // Pick the entity that should be the default "active room" on first
  // load: prefer the playing entity in the largest configured group;
  // tiebreak by position in `entities`. Returns null when nothing is
  // playing — caller falls back to the existing default.
  private _pickActivePlayer(): string | null {
    const ents = this._config.entities;
    let best: { id: string; size: number; idx: number } | null = null;
    for (let i = 0; i < ents.length; i++) {
      const id = ents[i];
      const st = this._state(id);
      if (st?.state !== "playing") continue;
      const members = st.attributes.group_members ?? [id];
      const size = members.filter(m => ents.includes(m)).length;
      if (!best || size > best.size || (size === best.size && i < best.idx)) {
        best = { id, size, idx: i };
      }
    }
    return best?.id ?? null;
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
    this._userPickedRoom = true;
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
    this._userPickedRoom = true;
    this._menuOpen = false;
    Svc.joinGroup(this.hass, primary, entities.slice(1));
  }
  private _onPlayPause(currentlyPlaying: boolean) {
    // Flip the icon immediately so the press feels responsive — willUpdate
    // clears this once hass reports the actual new state.
    this._optimisticPlaying = !currentlyPlaying;
    Svc.playPause(this.hass, this._activeRoom);
  }
  private _toggleInGroup(id: string) {
    if (id === this._activeRoom) return;
    const cur = this._groupMembers();
    if (cur.includes(id)) Svc.unjoin(this.hass, id);
    else Svc.joinGroup(this.hass, this._activeRoom, [...cur.filter(x => x !== this._activeRoom), id]);
  }
  private _slide(e: PointerEvent, max: number, onChange: (v: number) => void, key?: string) {
    const el = e.currentTarget as HTMLElement;
    // Cancel any post-release latch from a prior drag of the same slider.
    if (key && this._dragTimers[key]) {
      clearTimeout(this._dragTimers[key]);
      delete this._dragTimers[key];
    }
    // Throttle service calls during drag. pointermove fires ~60×/s on most
    // hardware; without this we'd flood HA → Sonos with volume_set calls
    // and the queue would lag behind the user's finger.
    const SEND_INTERVAL_MS = 120;
    let lastSent = 0;
    let pending: number | null = null;
    let pendingTimer: ReturnType<typeof setTimeout> | null = null;
    const sendNow = (v: number) => {
      lastSent = Date.now();
      pending = null;
      if (pendingTimer) { clearTimeout(pendingTimer); pendingTimer = null; }
      onChange(v);
    };
    const update = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
      const v = Math.round(ratio * max);
      if (key) this._dragVol = { ...this._dragVol, [key]: v };
      const since = Date.now() - lastSent;
      if (since >= SEND_INTERVAL_MS) {
        sendNow(v);
      } else {
        pending = v;
        if (!pendingTimer) {
          pendingTimer = setTimeout(() => {
            pendingTimer = null;
            if (pending !== null) sendNow(pending);
          }, SEND_INTERVAL_MS - since);
        }
      }
    };
    try { el.setPointerCapture(e.pointerId); } catch { /* noop */ }
    update(e);
    const move = (ev: PointerEvent) => update(ev);
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      try { el.releasePointerCapture(e.pointerId); } catch { /* noop */ }
      // Always commit the final value so the actual volume matches where
      // the user released the knob, regardless of throttling.
      if (pending !== null) sendNow(pending);
      if (pendingTimer) { clearTimeout(pendingTimer); pendingTimer = null; }
      // Hold the optimistic value while volume_set round-trips; willUpdate
      // clears it as soon as hass reports back, otherwise the timer expires
      // and we fall back to the live hass value.
      if (key) {
        this._dragTimers[key] = setTimeout(() => {
          delete this._dragTimers[key];
          if (key in this._dragVol) {
            const next = { ...this._dragVol };
            delete next[key];
            this._dragVol = next;
          }
        }, 2000);
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
    // HA's Sonos integration only populates media_title, entity_picture,
    // artist/album, and position on the group coordinator — slaves report
    // state="playing" with all metadata fields empty. Borrow the metadata
    // from whichever group member actually has it.
    const meta = (a.media_title || a.entity_picture)
      ? a
      : this._coordinatorMeta(a.group_members) ?? a;
    const dur = meta.media_duration ?? 0;
    const playing = this._optimisticPlaying ?? (s.state === "playing");
    const realVol = Math.round((a.volume_level ?? 0) * 100);
    const room = this._activeRoom;
    const maxVol = this._maxVol();
    const step = this._volStep(maxVol);
    // While a drag/step is latched, show the optimistic value instead
    // of waiting for hass to round-trip — feels much more responsive.
    const vol = room in this._dragVol ? this._dragVol[room] : realVol;
    // Interpolate position from the last hass snapshot. Sonos only pushes
    // media_position on state change, so without this the bar would freeze.
    const updatedAt = meta.media_position_updated_at
      ? new Date(meta.media_position_updated_at).getTime()
      : 0;
    const elapsed = s.state === "playing" && updatedAt
      ? Math.max(0, (this._now - updatedAt) / 1000)
      : 0;
    const rawPos = (meta.media_position ?? 0) + elapsed;
    const pos = dur > 0 ? Math.min(dur, rawPos) : rawPos;
    const contentId = meta.media_content_id ?? a.media_content_id;
    const station = this._stationArt(contentId);
    const coverImage = station?.image
      ? `url("${station.image}")`
      : meta.entity_picture
        ? `url("${meta.entity_picture}")`
        : "linear-gradient(135deg, var(--wp-accent) 0%, var(--wp-card-2) 60%, var(--wp-bg) 100%)";
    // Sonos reports state="playing" with no media_title for TV, line-in,
    // and many streaming sources, plus the brief window between tracks.
    // Don't lie with "Nothing playing" while audio is coming out — fall
    // back to whatever identifying info we can scrape together.
    const isPlaying = s.state === "playing";
    const trackTitle = this._loadingName
      ?? meta.media_title
      ?? station?.name
      ?? (isPlaying ? (meta.app_name ?? a.app_name ?? "Playing") : "Nothing playing");
    const trackSub = this._loadingName
      ? "Loading…"
      : `${meta.media_artist ?? ""}${meta.media_album_name ? ` · ${meta.media_album_name}` : ""}`;
    // Surface the streaming service in the source line above the cover
    // even when HA doesn't populate the `source` attribute (TuneIn etc.).
    const sourceLabel = a.source ?? this._sourceFromContentId(contentId);

    return html`
      <div class="pv">
        <div class="src">
          ${sourceLabel ? html`<span class="src-dot"></span>${sourceLabel}` : nothing}
        </div>
        <div class="cover-wrap">
          <div class="cover" style=${styleMap({ backgroundImage: coverImage })}></div>
        </div>
        <div class="meta">
          <div class="track">${trackTitle}</div>
          <div class="sub">${trackSub}</div>
        </div>
        <div class="progress">
          <span>${fmt(pos)}</span>
          <div class="bar"><span style=${styleMap({ width: `${dur > 0 ? (pos / dur) * 100 : 0}%` })}></span></div>
          <span>${fmt(dur)}</span>
        </div>
        <div class="transport">
          <button class="t-btn" @click=${() => this._stepVol(-step, maxVol)}>${iconVolDown}</button>
          <button class="t-btn" @click=${() => Svc.prev(this.hass, this._activeRoom)}>${iconPrev}</button>
          <button class="play-btn" @click=${() => this._onPlayPause(playing)}>
            ${playing ? iconPause : iconPlay}
          </button>
          <button class="t-btn" @click=${() => Svc.next(this.hass, this._activeRoom)}>${iconNext}</button>
          <button class="t-btn" @click=${() => this._stepVol(step, maxVol)}>${iconVolUp}</button>
        </div>
        <div class="vol-row">
          <span class="vol-icon">${iconVol}</span>
          ${this._slider(vol, maxVol, v => Svc.setVolume(this.hass, this._activeRoom, v), this._activeRoom)}
          <span class="vol-num">${vol}</span>
        </div>
      </div>
    `;
  }

  private _maxVol(): number {
    const m = this._config?.max_volume ?? 100;
    return Math.max(1, Math.min(100, Math.round(m)));
  }
  private _volStep(max: number): number {
    // Keep the +/- step proportional so the buttons are useful at any
    // max_volume — about 5% of the range, never less than 1.
    return Math.max(1, Math.round(max / 20));
  }
  private _stepVol(delta: number, max: number) {
    const room = this._activeRoom;
    const cur = room in this._dragVol
      ? this._dragVol[room]
      : Math.round((this._state(room)?.attributes.volume_level ?? 0) * 100);
    const next = Math.max(0, Math.min(max, cur + delta));
    if (next === cur) return;
    // Optimistic latch so repeated taps feel instant + remain coherent
    // even before hass round-trips the volume_set call.
    this._dragVol = { ...this._dragVol, [room]: next };
    if (this._dragTimers[room]) clearTimeout(this._dragTimers[room]);
    this._dragTimers[room] = setTimeout(() => {
      delete this._dragTimers[room];
      if (room in this._dragVol) {
        const nextDrag = { ...this._dragVol };
        delete nextDrag[room];
        this._dragVol = nextDrag;
      }
    }, 2000);
    Svc.setVolume(this.hass, room, next);
  }

  private _slider(value: number, max: number, onChange: (v: number) => void, key?: string) {
    const display = key && key in this._dragVol ? this._dragVol[key] : value;
    const pct = max > 0 ? Math.max(0, Math.min(100, (display / max) * 100)) : 0;
    return html`
      <div class="slider" @pointerdown=${(e: PointerEvent) => this._slide(e, max, onChange, key)}>
        <div class="fill" style=${styleMap({ width: `${pct}%` })}></div>
        <div class="knob" style=${styleMap({ left: `${pct}%` })}></div>
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
      <div class="pv pv-scroll">
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
                <span class="fav-label">${f.name}</span>
              </button>
            `)}
        </div>
      </div>
    `;
  }

  private _playFavorite(f: FavoriteConfig) {
    if (f.script) Svc.fireScript(this.hass, f.script, {
      // Pass the active room (and its current group) so the script can
      // target whichever speaker the user is looking at, instead of
      // hard-coding an entity per script.
      entity_id: this._activeRoom,
      group_members: this._groupMembers(),
    });
    else if (f.media_content_id && f.media_content_type)
      Svc.playMedia(this.hass, this._activeRoom, f.media_content_id, f.media_content_type);
    // Capture the title that's playing right now so willUpdate can detect
    // when Sonos has actually switched to the new track and clear the
    // "Loading…" overlay. Safety-net timer also clears it after 8s.
    this._prevTitle = this._state(this._activeRoom)?.attributes.media_title;
    this._loadingName = f.name;
    if (this._loadingTimer) clearTimeout(this._loadingTimer);
    this._loadingTimer = setTimeout(() => { this._loadingName = null; }, 8000);
    this._view = "player";
  }

  private _renderGrouping(groupMembers: string[]) {
    const allEntities = this._config.entities;
    const inGroup = (id: string) => groupMembers.includes(id);
    return html`
      <div class="pv pv-scroll">
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
                  ${this._slider(v, 100, vv => Svc.setVolume(this.hass, id, vv), id)}
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
