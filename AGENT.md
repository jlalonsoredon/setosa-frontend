# AGENT.md — setosa-frontend

## Descripción del proyecto

Frontend del sistema **Setosa** desplegado en **Vercel**, construido sobre el theme
[astro-sci-fi-ui](https://github.com/jonnysmillie/astro-sci-fi-ui) (Astro 6 + React +
Tailwind v4). Consume una API REST en Python alojada en **Render**.

---

## Stack

| Capa        | Tecnología                                                        |
|-------------|-------------------------------------------------------------------|
| Framework   | Astro 6 (Node ≥ 22.12)                                            |
| UI kit      | astro-sci-fi-ui — kit: tokens, primitives, shell, lib             |
| Componentes | React (islas `.tsx`) solo donde hay interactividad real           |
| Estilos     | Tailwind v4 + tokens CSS del theme (`--sf-color-*`, `--sf-bg-*`) |
| Deploy      | Vercel (static)                                                   |
| Backend     | API Python en Render                                              |

---

## Qué páginas del theme se conservan y cuáles se eliminan

El theme incluye páginas demo que son **showroom** y deben eliminarse o reemplazarse:

| Página original       | Acción en setosa-frontend        |
|-----------------------|----------------------------------|
| `src/pages/index.astro`      | ✅ Reemplazar — será el dashboard principal |
| `src/pages/kit.astro`        | ❌ Eliminar                      |
| `src/pages/settings.astro`   | ⚠️ Mantener si se quiere exponer configuración de tema |
| `src/pages/dashboard.astro`  | ❌ Eliminar — sustituido por index |
| `src/pages/map.astro`        | ❌ Eliminar                      |
| `src/pages/intel.astro`      | ❌ Eliminar                      |
| `src/pages/components.astro` | ❌ Eliminar                      |

Componentes demo que también pueden eliminarse si no se usan:
- `src/components/charts/` (uPlot)
- `src/components/map/` (MapLibre)
- `src/components/intel/` (TensorFlow.js)
- `src/data/component-docs.ts`

---

## Estructura de carpetas del proyecto

```
src/
  components/
    # ── kit del theme (NO modificar) ──────────────────────────
    core/          Frame, Panel, Text, Button, Divider
    effects/       Glow, Scanlines, AnimatedBorder
    hud/           HudMount, HudBar, HudReadout, HudTicker, HudCorners…
    terminal/      Terminal, TerminalLine, TerminalPrompt
    radar/         Radar
    shell/         AppShell, AppNav
    # ── propios del proyecto (crear aquí) ─────────────────────
    setosa/
      EventForm.tsx        formulario "Nuevo suceso"
      DataTable.tsx        tabla de datos del suceso
      SeverityPanel.tsx    panel de severidad/predicción
      api.ts               cliente fetch hacia la API de Render
  layouts/
    ScifiLayout.astro      (theme — NO modificar)
  lib/
    settings.ts, sound.ts  (theme — NO modificar)
  pages/
    index.astro            página principal del dashboard (reemplaza la demo)
  styles/
    tokens.css             (theme — NO modificar)
    global.css             (theme — NO modificar)
  plugins/
    sci-fi.mjs             (theme — NO modificar)
```

---

## API de Render

Base URL en variable de entorno `PUBLIC_API_URL`.

| Endpoint           | Método | Descripción                                      |
|--------------------|--------|--------------------------------------------------|
| `/get_data`        | GET    | Devuelve una fila aleatoria del CSV como JSON    |
| `/get_prediction`  | GET    | Devuelve la predicción de severidad del ML model |

---

## Componentes principales de setosa

### EventForm + DataTable
- Al pulsar **"Nuevo suceso"** → llama a `GET /get_data`
- Rellena el formulario y la tabla con los datos recibidos
- Estado gestionado en React con `useState`
- Montar con `client:load` en `index.astro`

### SeverityPanel
- Al pulsar **"Obtener severidad"** → llama a `GET /get_prediction`
- Muestra la valoración usando `HudBar` + `HudReadout` del theme
- Montar con `client:load`

---

## Convenciones

- Usar siempre componentes del theme (`Panel`, `Button`, `Frame`, `HudBar`…) en lugar de HTML plano
- Los tokens CSS correctos son `--sf-color-primary`, `--sf-bg-panel`, `--sf-text-primary`, etc. (ver skill)
- `StatusBar` **no existe** en el theme — usar `HudBar` + `HudReadout` para estados
- Los componentes React van en `src/components/setosa/` con extensión `.tsx`
- Usar `client:load` para interactividad inmediata; `client:visible` si el componente está bajo el fold
- Variables de entorno públicas con prefijo `PUBLIC_`
- No usar `<form action="...">` — toda la lógica es con eventos React

---

## Variables de entorno

```env
# .env.local (nunca subir a git)
PUBLIC_API_URL=https://setosa-backend.onrender.com

# Flags del theme — siempre false en setosa
PUBLIC_FEATURE_INTEL_ML=false
PUBLIC_FEATURE_MAP=false
```

---

## .gitignore — qué NO subir

```gitignore
# Secrets
.env
.env.local
.env.*.local

# Build y dependencias
node_modules/
dist/
.astro/

# Herramientas de deploy
.vercel/
```

Los archivos `AGENT.md` y `.agent/skills/` **sí se suben a git** — son documentación para el agente.

---

## Comandos

```bash
npm install          # instalar dependencias
npm run dev          # servidor de desarrollo en :4321
npm run build        # build de producción
npm run preview      # previsualizar el build
```

---

## Skills disponibles

- `.agent/skills/vercel-react-best-practices.md` — buenas prácticas React + Vercel
- `.agent/skills/astro-sci-fi-ui.md` — props reales de componentes, tokens CSS, arquitectura
- `.agent/skills/setosa-api.md` — contrato de la API del backend

---

## Archivos del theme a eliminar en setosa-frontend

El theme incluye páginas demo que **no se usan** en este proyecto y deben eliminarse
al hacer fork o clonar la plantilla:

```
# Páginas demo — eliminar
src/pages/dashboard.astro     → reemplazar por index.astro con nuestro dashboard
src/pages/map.astro            → eliminar (no usamos MapLibre)
src/pages/intel.astro          → eliminar (no usamos TensorFlow.js / COCO-SSD)
src/pages/kit.astro            → opcional: mantener solo en local como referencia

# Componentes pesados no necesarios — se pueden eliminar si no se usan
src/components/map/            → eliminar
src/components/intel/          → eliminar
src/components/charts/         → eliminar (salvo que se use uPlot en algún panel)

# Datos demo — revisar y limpiar
src/data/dashboard-snapshot.json   → eliminar
src/data/component-docs.ts         → eliminar si se elimina /kit
```

Lo que **sí se conserva** íntegramente:
```
src/components/core/       Panel, Frame, Button, Text
src/components/effects/    Glow, Scanlines, AnimatedBorder
src/components/hud/        HudBar, HudMount, HudReadout, HudTicker, HudCorners…
src/components/shell/      AppShell, AppNav
src/layouts/               ScifiLayout
src/styles/                tokens.css, utilities.css
src/plugins/               sci-fi.mjs
src/lib/                   settings.ts, sound.ts
```

---

## Notas para el agente

1. Antes de crear cualquier componente, leer `.agent/skills/astro-sci-fi-ui.md` para usar los props correctos.
2. `StatusBar` NO existe — no inventar componentes del theme. Consultar siempre la skill.
3. Los tokens CSS son `--sf-color-primary`, NO `--sf-accent` ni similares.
4. Las páginas demo del theme (kit, dashboard, map, intel) se eliminan; no referenciarlas.
5. React solo en `src/components/setosa/`; nunca importar `.astro` desde `.tsx`.
