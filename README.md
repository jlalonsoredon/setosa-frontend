# Setosa Frontend — Severity Prediction Dashboard

**Setosa** is a real‑time traffic‑incident severity dashboard built on the [Sci‑Fi UI](https://github.com/nerdyman/astro-scifi) template for Astro. It consumes a remote API to register incidents and predict their severity, rendering results inside a cockpit‑style HUD shell.

**License:** [MIT](LICENSE)

## Workflow

1. Click **"Nuevo suceso"** → the app requests `GET /get_data` from the backend.
2. The form and history table are populated with the returned data.
3. Fill in the form fields and click **"Obtener severidad"** → the app sends a `POST /get_prediction`.
4. The severity panel updates with the prediction, probability, and recommended contacts (ambulance, police, fire, tow truck).

## API

All backend communication is centralized in [`src/services/api.ts`](src/services/api.ts). Two SSR endpoints proxy requests to the upstream API:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/data` | GET | Fetches incident data (form schema + history) |
| `/api/predict` | POST | Sends form data and returns severity prediction |

The upstream URL is defined via `PUBLIC_API_URL` in the environment (see [`.env.example`](.env.example)).

## Stack

Astro 6, Tailwind v4 (`@tailwindcss/vite`), React islands for interactivity (AlertCenter, charts, map), MapLibre GL, uPlot.

## Routes

| Path | What it is |
|------|------------|
| `/` | Main dashboard — AlertCenter island with form, table, map, and severity panel |
| `/components` | Component documentation (nav + preview + snippets per primitive) |
| `/kit` | Component showcase (panels, HUD, radar, terminal) |
| `/settings` | Global shell preferences (theme, overlays, motion, sound) |
| `/dashboard` | uPlot charts + Open-Meteo sample |
| `/map` | MapLibre tactical map |
| `/intel` | YouTube embed + optional COCO-SSD object detection |

## Key components

- **`AlertCenter`** (`src/components/alertas/AlertCenter.tsx`) — drives the main workflow: fetches data, manages form state, sends predictions, renders severity results and contact buttons.
- **`AppShell`** / **`AppNav`** (`src/components/shell/`) — layout shell with vignette, scanlines, grain, and navigation.
- **Sci‑Fi primitives** — `Panel`, `Frame`, `Button`, HUD elements, terminal, radar, effects (glow, scanlines, animated borders).

## Env flags

See [`.env.example`](.env.example). Key variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PUBLIC_API_URL` | — | Base URL for the severity‑prediction API |
| `PUBLIC_FEATURE_INTEL_ML` | `true` | Toggle TensorFlow.js block on `/intel` |
| `PUBLIC_FEATURE_MAP` | `true` | Toggle MapLibre tactical map |

## Commands

| Command | Action |
|---------|--------|
| `npm install` | Dependencies |
| `npm run dev` | Dev server (`:4321`) |
| `npm run build` | Production build |
| `npm run preview` | Preview build |

**Node ≥ 22.12** (Astro 6).
