// Sidebar panel for managing the shared store (favorites / groups /
// station art) served by the wall_panel_sonos custom component.
//
// Bundled separately from the card (see rollup.config.mjs) into
// custom_components/wall_panel_sonos/panel.js, which the integration
// serves and registers via panel_custom. HA injects `hass` and
// `narrow` like it does for cards.
//
// Editing UX mirrors the card's visual editor, but writes go to the
// integration's WebSocket API so every dashboard sees the same lists.

import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { HomeAssistant } from "custom-card-helpers";
import type { FavoriteConfig, StationArt } from "./types";

interface GroupEntry {
  id: string;
  label: string;
  entities: string[];
}

interface SharedStore {
  favorites: FavoriteConfig[];
  groups: GroupEntry[];
  station_art: StationArt[];
}

type SectionKey = keyof SharedStore;

@customElement("wall-panel-sonos-panel")
export class WallPanelSonosPanel extends LitElement {
  static styles = css`
    :host {
      display: block;
      height: 100%;
      overflow-y: auto;
      background: var(--primary-background-color);
      color: var(--primary-text-color);
      font-family: var(--paper-font-body1_-_font-family, sans-serif);
    }
    .wrap {
      max-width: 760px;
      margin: 0 auto;
      padding: 24px 16px 64px;
    }
    h1 {
      font-size: 24px;
      font-weight: 500;
      margin: 8px 0 4px;
    }
    .lede {
      color: var(--secondary-text-color);
      font-size: 14px;
      margin-bottom: 20px;
    }
    .sec {
      border: 1px solid var(--divider-color);
      border-radius: 12px;
      margin: 12px 0;
      overflow: hidden;
      background: var(--card-background-color);
    }
    .sec-head {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 16px;
      cursor: pointer;
      user-select: none;
      font-weight: 600;
      font-size: 16px;
    }
    .sec-head .count {
      margin-left: auto;
      font-size: 12px;
      color: var(--secondary-text-color);
      font-weight: 400;
    }
    .sec-body { padding: 4px 16px 16px; }
    .row { display: flex; flex-direction: column; gap: 6px; padding: 6px 0; }
    .row-inline { display: flex; gap: 8px; align-items: flex-end; padding: 6px 0; }
    .row-inline > div { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
    label { font-size: 12px; color: var(--secondary-text-color); }
    input, select, textarea {
      padding: 8px;
      border-radius: 6px;
      border: 1px solid var(--divider-color);
      background: var(--primary-background-color);
      color: var(--primary-text-color);
      font: inherit;
      box-sizing: border-box;
      width: 100%;
    }
    textarea { resize: vertical; }
    .help { font-size: 11px; color: var(--secondary-text-color); margin-top: 2px; }
    .item {
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      margin: 8px 0;
    }
    .item-head {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      cursor: pointer;
      user-select: none;
    }
    .item-head .name {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .item-head .kind { font-size: 12px; color: var(--secondary-text-color); }
    .item-body { padding: 6px 12px 12px; border-top: 1px solid var(--divider-color); }
    .btn {
      background: none;
      border: 1px solid var(--divider-color);
      border-radius: 6px;
      padding: 5px 10px;
      cursor: pointer;
      color: var(--primary-text-color);
      font: inherit;
      font-size: 13px;
    }
    .btn.danger { color: var(--error-color, #cf6679); border-color: var(--error-color, #cf6679); }
    .btn.primary {
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
      border-color: var(--primary-color);
    }
    .actions { display: flex; gap: 6px; }
    .adder { margin-top: 10px; }
    .chip-list { display: flex; flex-wrap: wrap; gap: 6px; padding: 6px 0; }
    .chip {
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid var(--divider-color);
      background: var(--primary-background-color);
      cursor: pointer;
      font-size: 13px;
      user-select: none;
    }
    .chip.on {
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
      border-color: var(--primary-color);
    }
    .banner {
      padding: 12px 16px;
      border-radius: 8px;
      margin: 12px 0;
      font-size: 14px;
    }
    .banner.error { background: var(--error-color, #cf6679); color: #fff; }
    .banner.saving { background: var(--secondary-background-color); color: var(--secondary-text-color); }
    .import-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 4px 0 16px;
    }
    .import-row .btn { flex-shrink: 0; }
  `;

  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ type: Boolean }) narrow = false;

  @state() private _data: SharedStore | null = null;
  @state() private _error: string | null = null;
  @state() private _saving = false;
  @state() private _importResult: string | null = null;
  @state() private _open: SectionKey | null = "favorites";
  @state() private _openItem: Record<string, boolean> = {};
  private _unsub?: () => void;
  private _subscribed = false;

  updated() {
    if (!this._subscribed && this.hass) {
      this._subscribed = true;
      this._subscribe();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unsub?.();
    this._unsub = undefined;
    this._subscribed = false;
  }

  private async _subscribe() {
    try {
      this._unsub = await this.hass.connection.subscribeMessage<SharedStore>(
        data => { this._data = data; },
        { type: "wall_panel_sonos/subscribe" },
      );
    } catch (err) {
      this._error = `Couldn't reach the wall_panel_sonos integration — is it installed and is "wall_panel_sonos:" present in configuration.yaml? (${err instanceof Error ? err.message : err})`;
    }
  }

  private async _save(key: SectionKey, value: unknown[]) {
    // Optimistic local update; the subscription echo will confirm.
    if (this._data) this._data = { ...this._data, [key]: value };
    this._saving = true;
    this._error = null;
    try {
      await this.hass.callWS({ type: "wall_panel_sonos/set", key, value });
    } catch (err) {
      this._error = `Save failed: ${err instanceof Error ? err.message : err}`;
    } finally {
      this._saving = false;
    }
  }

  // ── Import from dashboards ────────────────────────────────────────
  // Walk every Lovelace dashboard config, collect the lists from each
  // wall-panel-sonos-card / mini-card instance, and merge anything new
  // into the store. Existing store entries always win — import never
  // overwrites, so it's safe to run repeatedly.
  private async _importFromDashboards() {
    this._saving = true;
    this._error = null;
    this._importResult = null;
    try {
      // null = the default dashboard; the list call returns the rest.
      const paths: (string | null)[] = [null];
      try {
        const dashboards = await this.hass.callWS<{ url_path: string }[]>(
          { type: "lovelace/dashboards/list" },
        );
        paths.push(...dashboards.map(d => d.url_path));
      } catch { /* older HA without multi-dashboard — default only */ }

      const cards: Record<string, unknown>[] = [];
      const walk = (node: unknown) => {
        if (Array.isArray(node)) { node.forEach(walk); return; }
        if (node && typeof node === "object") {
          const o = node as Record<string, unknown>;
          if (o.type === "custom:wall-panel-sonos-card"
            || o.type === "custom:wall-panel-sonos-mini-card") cards.push(o);
          Object.values(o).forEach(walk);
        }
      };
      for (const p of paths) {
        try {
          const cfg = await this.hass.callWS(
            p === null
              ? { type: "lovelace/config" }
              : { type: "lovelace/config", url_path: p },
          );
          walk(cfg);
        } catch { /* dashboard with no stored config (yaml default, etc.) */ }
      }

      if (!this._data) throw new Error("store not loaded yet");
      const stats: string[] = [];
      const merge = async <T>(
        key: SectionKey,
        existing: T[],
        idOf: (item: T) => string | undefined,
        collect: (card: Record<string, unknown>) => T[] | undefined,
      ) => {
        const seen = new Set(existing.map(idOf).filter(Boolean) as string[]);
        const added: T[] = [];
        let skipped = 0;
        for (const card of cards) {
          for (const item of collect(card) ?? []) {
            const id = idOf(item);
            if (!id || seen.has(id)) { skipped++; continue; }
            seen.add(id);
            added.push(item);
          }
        }
        if (added.length) await this._save(key, [...existing, ...added]);
        stats.push(`${added.length} ${key.replace("_", " ")}${skipped ? ` (${skipped} duplicates skipped)` : ""}`);
      };

      await merge<FavoriteConfig>("favorites", this._data.favorites,
        f => f.id ?? f.name, c => c.favorites as FavoriteConfig[] | undefined);
      await merge<GroupEntry>("groups", this._data.groups,
        g => g.id ?? g.label, c => c.groups as GroupEntry[] | undefined);
      await merge<StationArt>("station_art", this._data.station_art,
        s => s.match, c => c.station_art as StationArt[] | undefined);

      this._importResult = cards.length === 0
        ? "No wall-panel-sonos-card instances found in any dashboard."
        : `Scanned ${paths.length} dashboard${paths.length === 1 ? "" : "s"}, found ${cards.length} card${cards.length === 1 ? "" : "s"}. Imported ${stats.join(", ")}.`;
    } catch (err) {
      this._error = `Import failed: ${err instanceof Error ? err.message : err}`;
    } finally {
      this._saving = false;
    }
  }

  private _move<T>(list: T[], idx: number, dir: -1 | 1): T[] {
    const j = idx + dir;
    if (j < 0 || j >= list.length) return list;
    const next = list.slice();
    [next[idx], next[j]] = [next[j], next[idx]];
    return next;
  }
  private _toggleItem(key: string) {
    this._openItem = { ...this._openItem, [key]: !this._openItem[key] };
  }
  private _mediaPlayers(): string[] {
    return this.hass
      ? Object.keys(this.hass.states).filter(id => id.startsWith("media_player.")).sort()
      : [];
  }
  private _scripts(): string[] {
    return this.hass
      ? Object.keys(this.hass.states).filter(id => id.startsWith("script.")).sort()
      : [];
  }

  render() {
    return html`
      <div class="wrap">
        <h1>Sonos Card</h1>
        <div class="lede">
          Shared favorites, groups, and station art for every
          <code>wall-panel-sonos-card</code> with <code>use_shared_store: true</code>.
          Changes apply to all dashboards immediately — no reload needed.
        </div>
        ${this._error ? html`<div class="banner error">${this._error}</div>` : nothing}
        ${this._saving ? html`<div class="banner saving">Saving…</div>` : nothing}
        ${this._importResult ? html`<div class="banner saving">${this._importResult}</div>` : nothing}
        ${!this._data && !this._error ? html`<div class="banner saving">Loading…</div>` : nothing}
        ${this._data ? html`
          <div class="import-row">
            <button class="btn" ?disabled=${this._saving} @click=${() => this._importFromDashboards()}>
              ⇪ Import from dashboards
            </button>
            <span class="help">Scans every dashboard for wall-panel-sonos-card instances and copies their YAML favorites, groups, and station art into the store. Never overwrites existing store entries — safe to run more than once.</span>
          </div>
          ${this._section("favorites", "Favorites", `${this._data.favorites.length} items`, () => this._renderFavorites(this._data!))}
          ${this._section("groups", "Groups", `${this._data.groups.length} items`, () => this._renderGroups(this._data!))}
          ${this._section("station_art", "Station art", `${this._data.station_art.length} mappings`, () => this._renderStationArt(this._data!))}
        ` : nothing}
      </div>
    `;
  }

  private _section(key: SectionKey, title: string, count: string, body: () => unknown) {
    const open = this._open === key;
    return html`
      <div class="sec">
        <div class="sec-head" @click=${() => { this._open = open ? null : key; }}>
          <span>${open ? "▾" : "▸"} ${title}</span>
          <span class="count">${count}</span>
        </div>
        ${open ? html`<div class="sec-body">${body()}</div>` : nothing}
      </div>
    `;
  }

  // ── Favorites ─────────────────────────────────────────────────────
  private _patchFav(data: SharedStore, idx: number, patch: Partial<FavoriteConfig>) {
    this._save("favorites", data.favorites.map((f, j) => j === idx ? { ...f, ...patch } : f));
  }
  private _renderFavorites(data: SharedStore) {
    const favs = data.favorites;
    const scripts = this._scripts();
    return html`
      ${favs.map((f, i) => {
        const key = `fav:${i}`;
        const open = !!this._openItem[key];
        const mode: "media" | "script" = f.script ? "script" : "media";
        return html`
          <div class="item">
            <div class="item-head" @click=${() => this._toggleItem(key)}>
              <span>${open ? "▾" : "▸"}</span>
              <span class="name">${f.name || f.id || "(untitled)"}</span>
              <span class="kind">${f.type ?? ""}</span>
              <div class="actions" @click=${(e: Event) => e.stopPropagation()}>
                <button class="btn" ?disabled=${i === 0}
                  @click=${() => this._save("favorites", this._move(favs, i, -1))}>↑</button>
                <button class="btn" ?disabled=${i === favs.length - 1}
                  @click=${() => this._save("favorites", this._move(favs, i, 1))}>↓</button>
                <button class="btn danger"
                  @click=${() => this._save("favorites", favs.filter((_, j) => j !== i))}>Remove</button>
              </div>
            </div>
            ${open ? html`
              <div class="item-body">
                <div class="row-inline">
                  <div>
                    <label>ID</label>
                    <input type="text" .value=${f.id ?? ""}
                      @change=${(e: Event) => this._patchFav(data, i, { id: (e.target as HTMLInputElement).value.trim() })}/>
                  </div>
                  <div>
                    <label>Name</label>
                    <input type="text" .value=${f.name ?? ""}
                      @change=${(e: Event) => this._patchFav(data, i, { name: (e.target as HTMLInputElement).value })}/>
                  </div>
                </div>
                <div class="row">
                  <label>Type</label>
                  <div class="chip-list">
                    ${(["playlist", "station", "album"] as const).map(t => html`
                      <span class="chip ${f.type === t ? "on" : ""}"
                        @click=${() => this._patchFav(data, i, { type: t })}>${t}</span>
                    `)}
                  </div>
                </div>
                <div class="row">
                  <label>Source</label>
                  <div class="chip-list">
                    <span class="chip ${mode === "media" ? "on" : ""}"
                      @click=${() => this._patchFav(data, i, { script: undefined })}>media_content_id</span>
                    <span class="chip ${mode === "script" ? "on" : ""}"
                      @click=${() => this._patchFav(data, i, { media_content_id: undefined, media_content_type: undefined })}>script</span>
                  </div>
                </div>
                ${mode === "media" ? html`
                  <div class="row">
                    <label>media_content_id</label>
                    <textarea rows="2"
                      @change=${(e: Event) => this._patchFav(data, i, { media_content_id: (e.target as HTMLTextAreaElement).value.trim() || undefined })}
                      >${f.media_content_id ?? ""}</textarea>
                    <div class="help">Get one via Developer Tools → Services → media_player.play_media → Choose media.</div>
                  </div>
                  <div class="row">
                    <label>media_content_type</label>
                    <input type="text" .value=${f.media_content_type ?? ""} placeholder="music"
                      @change=${(e: Event) => this._patchFav(data, i, { media_content_type: (e.target as HTMLInputElement).value.trim() || undefined })}/>
                  </div>
                ` : html`
                  <div class="row">
                    <label>Script</label>
                    <select @change=${(e: Event) => this._patchFav(data, i, { script: (e.target as HTMLSelectElement).value || undefined })}>
                      <option value="">— pick a script —</option>
                      ${scripts.map(s => html`<option value=${s} ?selected=${f.script === s}>${s}</option>`)}
                    </select>
                  </div>
                `}
                <div class="row">
                  <label>Art (URL or CSS gradient, optional)</label>
                  <textarea rows="2"
                    placeholder="linear-gradient(135deg, #1a1a1a 0%, #6a4a2c 100%)"
                    @change=${(e: Event) => this._patchFav(data, i, { art: (e.target as HTMLTextAreaElement).value.trim() || undefined })}
                    >${f.art ?? ""}</textarea>
                </div>
              </div>
            ` : nothing}
          </div>
        `;
      })}
      <div class="adder">
        <button class="btn primary" @click=${() => {
          this._save("favorites", [...favs, { id: `favorite_${favs.length + 1}`, name: "New favorite", type: "playlist" }]);
          this._openItem = { ...this._openItem, [`fav:${favs.length}`]: true };
        }}>+ Add favorite</button>
      </div>
    `;
  }

  // ── Groups ────────────────────────────────────────────────────────
  private _patchGroup(data: SharedStore, idx: number, patch: Partial<GroupEntry>) {
    this._save("groups", data.groups.map((g, j) => j === idx ? { ...g, ...patch } : g));
  }
  private _renderGroups(data: SharedStore) {
    const groups = data.groups;
    const players = this._mediaPlayers();
    return html`
      ${groups.map((g, i) => {
        const key = `grp:${i}`;
        const open = !!this._openItem[key];
        return html`
          <div class="item">
            <div class="item-head" @click=${() => this._toggleItem(key)}>
              <span>${open ? "▾" : "▸"}</span>
              <span class="name">${g.label || g.id}</span>
              <span class="kind">${g.entities?.length ?? 0} rooms</span>
              <div class="actions" @click=${(e: Event) => e.stopPropagation()}>
                <button class="btn" ?disabled=${i === 0}
                  @click=${() => this._save("groups", this._move(groups, i, -1))}>↑</button>
                <button class="btn" ?disabled=${i === groups.length - 1}
                  @click=${() => this._save("groups", this._move(groups, i, 1))}>↓</button>
                <button class="btn danger"
                  @click=${() => this._save("groups", groups.filter((_, j) => j !== i))}>Remove</button>
              </div>
            </div>
            ${open ? html`
              <div class="item-body">
                <div class="row-inline">
                  <div>
                    <label>ID</label>
                    <input type="text" .value=${g.id ?? ""}
                      @change=${(e: Event) => this._patchGroup(data, i, { id: (e.target as HTMLInputElement).value.trim() })}/>
                  </div>
                  <div>
                    <label>Label</label>
                    <input type="text" .value=${g.label ?? ""}
                      @change=${(e: Event) => this._patchGroup(data, i, { label: (e.target as HTMLInputElement).value })}/>
                  </div>
                </div>
                <div class="row">
                  <label>Rooms (all media_player entities shown — pick your Sonos ones)</label>
                  <div class="chip-list">
                    ${players.map(id => {
                      const on = (g.entities ?? []).includes(id);
                      return html`
                        <span class="chip ${on ? "on" : ""}"
                          @click=${() => this._patchGroup(data, i, {
                            entities: on
                              ? (g.entities ?? []).filter(x => x !== id)
                              : [...(g.entities ?? []), id],
                          })}>${this.hass.states[id]?.attributes?.friendly_name ?? id}</span>
                      `;
                    })}
                  </div>
                </div>
              </div>
            ` : nothing}
          </div>
        `;
      })}
      <div class="adder">
        <button class="btn primary" @click=${() => {
          this._save("groups", [...groups, { id: `group_${groups.length + 1}`, label: "New group", entities: [] }]);
          this._openItem = { ...this._openItem, [`grp:${groups.length}`]: true };
        }}>+ Add group</button>
      </div>
    `;
  }

  // ── Station art ───────────────────────────────────────────────────
  private _patchArt(data: SharedStore, idx: number, patch: Partial<StationArt>) {
    this._save("station_art", data.station_art.map((s, j) => j === idx ? { ...s, ...patch } : s));
  }
  private _renderStationArt(data: SharedStore) {
    const entries = data.station_art;
    return html`
      ${entries.map((s, i) => {
        const key = `art:${i}`;
        const open = !!this._openItem[key];
        return html`
          <div class="item">
            <div class="item-head" @click=${() => this._toggleItem(key)}>
              <span>${open ? "▾" : "▸"}</span>
              <span class="name">${s.name || s.match || "(unmatched)"}</span>
              <div class="actions" @click=${(e: Event) => e.stopPropagation()}>
                <button class="btn" ?disabled=${i === 0}
                  @click=${() => this._save("station_art", this._move(entries, i, -1))}>↑</button>
                <button class="btn" ?disabled=${i === entries.length - 1}
                  @click=${() => this._save("station_art", this._move(entries, i, 1))}>↓</button>
                <button class="btn danger"
                  @click=${() => this._save("station_art", entries.filter((_, j) => j !== i))}>Remove</button>
              </div>
            </div>
            ${open ? html`
              <div class="item-body">
                <div class="row">
                  <label>Match (case-insensitive substring of media_content_id)</label>
                  <input type="text" .value=${s.match ?? ""} placeholder="stationId=s297990"
                    @change=${(e: Event) => this._patchArt(data, i, { match: (e.target as HTMLInputElement).value })}/>
                  <div class="help">Find one via Developer Tools → States while the station plays.</div>
                </div>
                <div class="row">
                  <label>Label</label>
                  <input type="text" .value=${s.name ?? ""}
                    @change=${(e: Event) => this._patchArt(data, i, { name: (e.target as HTMLInputElement).value || undefined })}/>
                </div>
                <div class="row">
                  <label>Image URL</label>
                  <input type="text" .value=${s.image ?? ""} placeholder="https://example.com/logo.png"
                    @change=${(e: Event) => this._patchArt(data, i, { image: (e.target as HTMLInputElement).value.trim() || undefined })}/>
                </div>
              </div>
            ` : nothing}
          </div>
        `;
      })}
      <div class="adder">
        <button class="btn primary" @click=${() => {
          this._save("station_art", [...entries, { match: "" }]);
          this._openItem = { ...this._openItem, [`art:${entries.length}`]: true };
        }}>+ Add mapping</button>
      </div>
    `;
  }
}
