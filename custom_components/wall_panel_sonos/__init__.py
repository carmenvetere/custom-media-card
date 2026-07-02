"""Shared storage + sidebar panel for the Wall Panel Sonos Card.

Stores favorites / groups / station_art in HA's .storage so every
dashboard instance of the card reads the same lists, and registers a
sidebar panel ("Sonos Card") for editing them.

Setup: add `wall_panel_sonos:` to configuration.yaml and restart.

WebSocket API:
  wall_panel_sonos/get        -> current data
  wall_panel_sonos/set        -> replace one section (admin only)
  wall_panel_sonos/subscribe  -> push updates as they happen
"""
from __future__ import annotations

from pathlib import Path
from typing import Any, Callable

import voluptuous as vol

from homeassistant.components import panel_custom, websocket_api
from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store
from homeassistant.helpers.typing import ConfigType

DOMAIN = "wall_panel_sonos"
STORAGE_KEY = DOMAIN
STORAGE_VERSION = 1
PANEL_URL_PATH = "wall-panel-sonos"
PANEL_JS_URL = f"/{DOMAIN}/panel.js"

SECTIONS = ("favorites", "groups", "station_art")

CONFIG_SCHEMA = vol.Schema({DOMAIN: vol.Schema({})}, extra=vol.ALLOW_EXTRA)

DEFAULT_DATA: dict[str, list] = {s: [] for s in SECTIONS}


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up storage, websocket commands, and the sidebar panel."""
    if DOMAIN not in config:
        return True

    store: Store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
    data = await store.async_load() or dict(DEFAULT_DATA)
    # Heal partial data from older versions / manual edits.
    for section in SECTIONS:
        data.setdefault(section, [])

    subscribers: list[Callable[[dict], None]] = []
    hass.data[DOMAIN] = {"store": store, "data": data, "subscribers": subscribers}

    websocket_api.async_register_command(hass, ws_get)
    websocket_api.async_register_command(hass, ws_set)
    websocket_api.async_register_command(hass, ws_subscribe)

    panel_js = Path(__file__).parent / "panel.js"
    try:
        # HA 2024.7+ — the old register_static_path logs a deprecation.
        from homeassistant.components.http import StaticPathConfig

        await hass.http.async_register_static_paths(
            [StaticPathConfig(PANEL_JS_URL, str(panel_js), False)]
        )
    except ImportError:
        hass.http.register_static_path(PANEL_JS_URL, str(panel_js), cache_headers=False)

    await panel_custom.async_register_panel(
        hass,
        webcomponent_name="wall-panel-sonos-panel",
        frontend_url_path=PANEL_URL_PATH,
        module_url=PANEL_JS_URL,
        sidebar_title="Sonos Card",
        sidebar_icon="mdi:music-box-multiple",
        require_admin=False,
        config={},
    )
    return True


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/get"})
@websocket_api.async_response
async def ws_get(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Return the full shared store."""
    connection.send_result(msg["id"], hass.data[DOMAIN]["data"])


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/set",
        vol.Required("key"): vol.In(SECTIONS),
        vol.Required("value"): [dict],
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_set(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Replace one section and notify subscribers. Admin only — wall
    tablets typically run restricted users that should read, not write."""
    domain_data = hass.data[DOMAIN]
    data = domain_data["data"]
    data[msg["key"]] = msg["value"]
    await domain_data["store"].async_save(data)
    for send in list(domain_data["subscribers"]):
        send(data)
    connection.send_result(msg["id"], data)


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/subscribe"})
@websocket_api.async_response
async def ws_subscribe(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Subscribe to store changes. Sends the current data immediately so
    clients don't need a separate get call."""
    subscribers: list[Callable[[dict], None]] = hass.data[DOMAIN]["subscribers"]

    def send_update(data: dict) -> None:
        connection.send_message(websocket_api.event_message(msg["id"], data))

    subscribers.append(send_update)

    def unsub() -> None:
        if send_update in subscribers:
            subscribers.remove(send_update)

    connection.subscriptions[msg["id"]] = unsub
    connection.send_result(msg["id"])
    send_update(hass.data[DOMAIN]["data"])
