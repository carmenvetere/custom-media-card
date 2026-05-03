// Visual editor for the card config. Renders the standard HA entity picker
// + a few simple inputs. Power-users will still write YAML for `favorites`
// and `groups`; the editor covers the common path.

import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { HomeAssistant, LovelaceCardEditor } from "custom-card-helpers";
import { EDITOR_TAG } from "./const";
import type { WallPanelSonosCardConfig } from "./types";

@customElement(EDITOR_TAG)
export class WallPanelSonosCardEditor
  extends LitElement
  implements LovelaceCardEditor
{
  static styles = css`
    .row { display: flex; flex-direction: column; gap: 6px; padding: 8px 0; }
    label { font-size: 12px; color: var(--secondary-text-color); }
    input, select { padding: 8px; border-radius: 6px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); font: inherit; }
    .help { font-size: 11px; color: var(--secondary-text-color); margin-top: 2px; }
  `;

  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config!: WallPanelSonosCardConfig;

  setConfig(config: WallPanelSonosCardConfig) { this._config = config; }

  private _val<K extends keyof WallPanelSonosCardConfig>(k: K, v: WallPanelSonosCardConfig[K]) {
    this._config = { ...this._config, [k]: v };
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config } }));
  }

  render() {
    if (!this._config) return html``;
    const entityIds = this.hass
      ? Object.keys(this.hass.states).filter(id => id.startsWith("media_player."))
      : [];

    return html`
      <div class="row">
        <label>Media player entities (one per room)</label>
        <textarea rows="6" @change=${(e: Event) => {
          const lines = (e.target as HTMLTextAreaElement).value.split("\n").map(s => s.trim()).filter(Boolean);
          this._val("entities", lines);
        }}>${(this._config.entities ?? []).join("\n")}</textarea>
        <div class="help">Available: ${entityIds.slice(0, 5).join(", ")}${entityIds.length > 5 ? "…" : ""}</div>
      </div>
      <div class="row">
        <label>Default view</label>
        <select @change=${(e: Event) => this._val("default_view", (e.target as HTMLSelectElement).value as any)}>
          ${["player","favorites","grouping"].map(v => html`
            <option value=${v} ?selected=${this._config.default_view === v}>${v}</option>
          `)}
        </select>
      </div>
      <div class="row">
        <label>Layout</label>
        <select @change=${(e: Event) => this._val("layout", (e.target as HTMLSelectElement).value as any)}>
          <option value="wall" ?selected=${(this._config.layout ?? "wall") === "wall"}>wall</option>
          <option value="mobile" ?selected=${this._config.layout === "mobile"}>mobile</option>
        </select>
      </div>
      <div class="row">
        <label>Track text scale (0.9–1.6)</label>
        <input type="number" min="0.9" max="1.6" step="0.05"
          .value=${String(this._config.track_scale ?? 1.15)}
          @change=${(e: Event) => this._val("track_scale", parseFloat((e.target as HTMLInputElement).value))}/>
      </div>
      <div class="row">
        <label>Volume bar scale (1.0–2.5)</label>
        <input type="number" min="1" max="2.5" step="0.1"
          .value=${String(this._config.vol_bar_scale ?? 1.4)}
          @change=${(e: Event) => this._val("vol_bar_scale", parseFloat((e.target as HTMLInputElement).value))}/>
      </div>
      <div class="row">
        <div class="help">Configure <code>favorites:</code> and <code>groups:</code> in YAML for now — visual editing for those is on the roadmap.</div>
      </div>
    `;
  }
}
