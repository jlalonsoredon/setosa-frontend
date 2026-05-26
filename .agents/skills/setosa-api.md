# Skill: setosa-api

Contrato de la API REST del backend Python desplegado en **Render**.

Base URL: `PUBLIC_API_URL` (variable de entorno)

---

## Endpoints

### GET /get_data

Devuelve una fila del dataset CSV para rellenar el formulario y la tabla.

**Request:**
```
GET /get_data
```

**Response (200):**
```json
{
  "fields": {
    "campo_1": "valor",
    "campo_2": 42,
    "campo_3": "valor"
  }
}
```
> ⚠️ Completar con el esquema real una vez que el backend esté operativo.

**Uso en frontend:**
```ts
import type { EventData } from './api';

const res = await fetch(`${import.meta.env.PUBLIC_API_URL}/get_data`);
const json = await res.json();
// json.fields → objeto con los datos del suceso
```

---

### GET /get_prediction

Ejecuta el modelo ML y devuelve la predicción de severidad.

**Request:**
```
GET /get_prediction
```

**Response (200):**
```json
{
  "severity": 0.82,
  "label": "HIGH",
  "confidence": 0.91
}
```
> ⚠️ Completar con el esquema real del modelo una vez definido.

**Uso en frontend:**
```ts
import type { PredictionData } from './api';

const res = await fetch(`${import.meta.env.PUBLIC_API_URL}/get_prediction`);
const prediction: PredictionData = await res.json();
// prediction.label → "LOW" | "MEDIUM" | "HIGH"
// prediction.severity → número entre 0 y 1
```

---

## Manejo de errores

| Código HTTP | Causa probable                          | Acción en frontend              |
|-------------|------------------------------------------|---------------------------------|
| 200         | OK                                       | Mostrar datos                   |
| 500         | Error interno del backend               | Mostrar error en StatusBar      |
| 503         | Backend arrancando en Render (cold start)| Reintentar tras 3s, avisar user |
| CORS error  | Origen no permitido en el backend        | Contactar con backend para añadir origen de Vercel |

### Cold start de Render

Los servicios gratuitos de Render "duermen" tras 15 min de inactividad.
El primer request puede tardar 30-60 segundos.

Implementar un indicador de carga claro durante ese tiempo:
```tsx
{state === 'loading' && <StatusBar status="loading" label="Conectando con API..." />}
```

---

## Cliente centralizado (`src/components/setosa/api.ts`)

```ts
const BASE = import.meta.env.PUBLIC_API_URL;

export async function getData(): Promise<EventData> {
  const res = await fetch(`${BASE}/get_data`);
  if (!res.ok) throw new Error(`get_data falló: ${res.status}`);
  return res.json();
}

export async function getPrediction(): Promise<PredictionData> {
  const res = await fetch(`${BASE}/get_prediction`);
  if (!res.ok) throw new Error(`get_prediction falló: ${res.status}`);
  return res.json();
}
```
