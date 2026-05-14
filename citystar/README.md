# City Star

> UWM's national footprint, lit like a city at night. Tap any glowing dot to
> reveal the constellation of UWM team members behind that broker.

## What this is

City Star is a **broker-DNA visualizer** for UWM. Inspired by Spotify's
SongDNA, but the "song" is a broker (the remote party on a 175M-number
dataset) and the "contributors" are the UWM employees who have touched that
broker across departments — Sales, Underwriting, Welcome, Operations, Closing.

The home screen is a dark US map; brokers light up their cities. Brightness
scales with activity. Tap a city and the broker's whole UWM team fans out as
color-coded bubbles: size = career book, glow ring = recent touch on this
broker.

## Try it now (no install)

This folder is a self-contained static demo. Open `citystar/index.html` in any
browser. From a phone, hit the raw.githack URL for the branch:

```
https://raw.githack.com/followthewhiterabbitneo/-timmytime-library/claude/create-github-project-pgOLJ/citystar/index.html
```

Works in mobile Safari. No build step. All assets are CDN-hosted (D3 +
us-atlas TopoJSON).

## Department colors

| Department    | Color    |
| ------------- | -------- |
| Sales         | UWM Orange `#f56600` |
| Underwriting  | UWM Blue   `#1f4ea3` |
| Welcome       | Amber      `#ffb142` |
| Operations    | Sky        `#57c4e5` |
| Closing       | Violet     `#b86bff` |

Override the palette in `styles.css` (`:root` block) to match the latest
UWM brand tokens.

## Files

```
citystar/
├── index.html        page shell
├── styles.css        UWM-themed dark UI
├── app.js            D3 map + tap-to-fan-out interaction
└── data/
    └── brokers.json  8 demo brokers, fictional team members
```

The demo data is **fully synthetic** — no real broker, NMLS, or volume info.

## Production roadmap

The static demo is the design probe. The production cut:

- **Frontend** — port to Next.js + TypeScript, keep D3 + Tailwind, ship via
  internal CDN.
- **Backend** — FastAPI service exposing `GET /broker?phone=...` →
  `{ broker, team[] }`. Joins the 175M-number index against your CRM/loan
  warehouse.
- **In-house model** — Ollama or vLLM hosting Llama 3.1 / Qwen 2.5 on a UWM
  box. The model writes the natural-language insight line under the broker
  card ("Maria last spoke with this broker 2 days ago about an FHA file") and
  never leaves the network. The app talks to `localhost` only.
- **Privacy** — no third-party analytics, no SaaS SDKs, CSP locked to self
  + the internal model endpoint.

## License

Internal UWM project. All rights reserved.
