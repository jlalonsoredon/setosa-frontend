# Skill: astro-sci-fi-ui

Guía de uso del theme [jonnysmillie/astro-sci-fi-ui](https://github.com/jonnysmillie/astro-sci-fi-ui)
para el proyecto setosa-frontend. Basada en `docs/architecture.md` y `docs/components.md` del repo.

---

## Arquitectura del theme

El theme separa dos capas claramente:

| Capa | Qué es | ¿Modificar? |
|------|--------|-------------|
| **Kit reutilizable** | `tokens.css`, `core/`, `effects/`, `hud/`, `terminal/`, `radar/`, `AppShell`, `AppNav`, `lib/` | ❌ No tocar |
| **Páginas demo** | `dashboard.astro`, `map.astro`, `intel.astro`, `kit.astro` | ✅ Reemplazar o eliminar |

Para setosa-frontend, **eliminar o ignorar** las páginas demo que no se usan:
- `src/pages/dashboard.astro` → reemplazar por nuestra página principal
- `src/pages/map.astro` → eliminar
- `src/pages/intel.astro` → eliminar
- `src/pages/kit.astro` → mantener solo como referencia local, no se despliega

---

## Layout base de una página

```astro
---
import ScifiLayout from "../layouts/ScifiLayout.astro";
import AppShell from "../components/shell/AppShell.astro";
import AppNav from "../components/shell/AppNav.astro";
import Panel from "../components/core/Panel.astro";
---

<ScifiLayout title="Setosa — Dashboard">
  <AppShell>
    <AppNav />
    <Panel variant="primary" glow>
      <!-- contenido aquí -->
    </Panel>
  </AppShell>
</ScifiLayout>
```

---

## Componentes core — props completas

### `Frame.astro`
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `variant` | `"primary"` \| `"secondary"` | `"primary"` | Color del trazo |
| `glow` | boolean | `false` | Filtro de brillo en el marco |
| `animated` | boolean | `false` | Animación sutil de shimmer |
| `edges` | `"angled"` \| `"square"` | `"angled"` | Esquinas SVG biseladas vs borde rectangular |
| `class` | string | — | Clases extra en el wrapper |

⚠️ Con `edges="angled"`, el slot es un rectángulo completo — usar `sf-frame-content-inset` para que el trazo SVG de las esquinas sea visible.

### `Panel.astro`
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `variant` | `"primary"` \| `"secondary"` | `"primary"` | Pasa a `Frame` |
| `glow` | boolean | `false` | Pasa a `Frame` |
| `animated` | boolean | `false` | Pasa a `Frame` |
| `layer` | `"base"` \| `"raised"` | `"base"` | Sombra / elevación del panel interior |
| `glass` | boolean | `false` | Tratamiento "frosted glass" |
| `class` | string | — | En el `Frame` exterior |

### `Text.astro`
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `variant` | `"heading"` \| `"label"` \| `"data"` | `"data"` | Preset tipográfico |
| `as` | `"h1"` \| `"h2"` \| `"h3"` \| `"p"` \| `"span"` | auto | Elemento HTML |
| `glow` | boolean | `false` | Brillo suave en el texto |
| `class` | string | — | Clases extra |

### `Button.astro`
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `variant` | `"primary"` \| `"secondary"` \| `"ghost"` | `"primary"` | Estilo visual |
| `type` | `"button"` \| `"submit"` \| `"reset"` | `"button"` | Tipo nativo |
| `sound` | boolean | `true` | Añade `data-sf-sound-hover/click` |
| `animatedBorder` | boolean | `false` | Borde animado (Framer Motion) |
| `id` | string | — | DOM id |
| `class` | string | — | Clases extra |

---

## Componentes HUD

### `HudMount.astro`
Overlay fullscreen para superponer HUD sobre el contenido.
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `fixed` | boolean | `false` | `fixed` vs `absolute` |
| `class` | string | — | Clases wrapper |

### `HudBar.astro`
Barra de estado superior o inferior — **usar para mostrar estados de carga/error**.
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `position` | `"top"` \| `"bottom"` | `"top"` | Posición |
| `fixed` | boolean | `false` | Fijada al viewport |
| `mode` | `"overlay"` \| `"inline"` | `"overlay"` | Overlay absoluto vs flujo |
| `variant` | `"primary"` \| `"secondary"` | `"primary"` | Acento |
| `class` | string | — | Clases wrapper |

### `HudReadout.astro`
Muestra un valor con su etiqueta. Slots: `label` (named) + default (valor).
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `align` | `"left"` \| `"right"` | `"left"` | Alineación |
| `class` | string | — | Clases wrapper |

```astro
<HudReadout align="left">
  <span slot="label">SEVERIDAD</span>
  HIGH
</HudReadout>
```

### `HudTicker.astro`
Marquee decorativo (aria-hidden).
| Prop | Tipo | Default |
|------|------|---------|
| `durationSec` | number | `22` |
| `class` | string | — |

### `HudCorners`, `HudReticle`, `HudFrame`
Overlays presentacionales — ver props directamente en cada archivo fuente.

---

## Effects

- **`AnimatedBorder.jsx`** (React / Framer Motion): anillo conic-gradient animado. Pasar `className` para espaciado. Dentro de un `Frame` con `edges="angled"`, combinar con `sf-frame-content-inset`.
- **`Glow.astro`**, **`Scanlines.astro`**: wrappers de layout; admiten `class`.

---

## Terminal y Radar

- `Terminal.astro` + `TerminalLine.astro` + `TerminalPrompt.astro`: composición; `Terminal.astro` acepta `class`.
- `Radar.astro`: props de labels y sizing — ver fuente.

---

## CSS tokens principales

```css
var(--sf-accent)        /* color de acento principal (cyan por defecto) */
var(--sf-bg)            /* fondo base */
var(--sf-border)        /* color de bordes de panel */
var(--sf-glow)          /* sombra de brillo */
var(--sf-text)          /* texto principal */
var(--sf-text-muted)    /* texto secundario */
```

Usar estos tokens en lugar de colores hardcodeados de Tailwind.

---

## Temas disponibles (atributo `data-theme`)

| Valor | Descripción |
|-------|-------------|
| (ninguno) | **Synthwave** — cyan/magenta sobre violeta-negro |
| `nebula` | Cyan/violeta (look clásico) |
| `ember` | Tonos cálidos anaranjados |
| `matrix` | Verde terminal |
| `void` | Negro profundo |

---

## Flags de entorno del theme

```env
PUBLIC_FEATURE_INTEL_ML=false   # desactiva TensorFlow.js en /intel
PUBLIC_FEATURE_MAP=false         # desactiva MapLibre en /map
```

Para setosa-frontend ambos en `false`.

---

## Reglas para islas React en este theme

- Los componentes `.astro` del theme NO se importan desde `.tsx`
- Para botones interactivos en React, usar `<button>` con las clases token de Tailwind del theme, no importar `Button.astro`
- Usar `client:load` solo si la interactividad es inmediata; `client:visible` si está bajo el fold
- `AnimatedBorder.jsx` sí se puede importar desde React al ser ya un componente `.jsx`

---

## Archivos a NO modificar

```
src/styles/tokens.css
src/plugins/sci-fi.mjs
src/components/shell/AppShell.astro
src/components/shell/AppNav.astro
src/layouts/ScifiLayout.astro
src/lib/settings.ts
src/lib/sound.ts
```
