import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// ── Types ──────────────────────────────────────────────────────────────────

type AlertData = {
  id: string;
  timestamp: string;
  lat: number;
  lng: number;
  vehicleType: string;
  road: string;
  direction: string;
  numVehicles: number;
  injuredCount: number;
  description: string;
};

type PredictionResult = {
  severity: "low" | "medium" | "high" | "critical";
  score: number;
  label: string;
  recommendations: string[];
};

// ── Mock data ──────────────────────────────────────────────────────────────

let mockCounter = 0;

function buildMockAlert(): AlertData {
  mockCounter++;
  const templates: Partial<AlertData>[] = [
    { lat: 40.4168, lng: -3.7038, vehicleType: "car", road: "M-30 km 12.4", direction: "Sur", numVehicles: 2, injuredCount: 1, description: "Colisión por alcance en carril derecho" },
    { lat: 41.3851, lng: 2.1734, vehicleType: "motorcycle", road: "C-31 km 8.2", direction: "Norte", numVehicles: 1, injuredCount: 1, description: "Salida de calzada por hidro planación" },
    { lat: 37.3891, lng: -5.9845, vehicleType: "truck", road: "A-4 km 535.1", direction: "Norte", numVehicles: 3, injuredCount: 0, description: "Colisión múltiple en zona de obras" },
  ];
  const t = templates[(mockCounter - 1) % templates.length]!;
  return {
    id: `ALERT-DEMO-${String(mockCounter).padStart(3, "0")}`,
    timestamp: new Date().toISOString(),
    vehicleType: "car",
    road: "M-30",
    direction: "Norte",
    numVehicles: 1,
    injuredCount: 0,
    description: "",
    ...t,
  };
}

const MOCK_PREDICTION: PredictionResult = {
  severity: "medium",
  score: 0.62,
  label: "Gravedad moderada",
  recommendations: [
    "Activar unidad de emergencias médicas",
    "Señalizar desvío alternativo por M-40",
    "Notificar a DGT para actualización del tráfico",
  ],
};

// ── Severity helpers ───────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  low: {
    label: "BAJA",
    classes: "border-[var(--sf-color-primary)] shadow-[0_0_24px_var(--sf-glow-primary)] text-[var(--sf-color-primary)]",
    badge: "bg-[color-mix(in_oklab,var(--sf-color-primary)_18%,transparent)] text-[var(--sf-color-primary)]",
  },
  medium: {
    label: "MODERADA",
    classes: "border-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.35)] text-amber-400",
    badge: "bg-amber-400/15 text-amber-400",
  },
  high: {
    label: "ALTA",
    classes: "border-orange-400 shadow-[0_0_24px_rgba(251,146,60,0.4)] text-orange-400",
    badge: "bg-orange-400/15 text-orange-400",
  },
  critical: {
    label: "CRÍTICA",
    classes: "border-[var(--sf-color-secondary)] shadow-[0_0_32px_var(--sf-glow-secondary)] text-[var(--sf-color-secondary)]",
    badge: "bg-[color-mix(in_oklab,var(--sf-color-secondary)_18%,transparent)] text-[var(--sf-color-secondary)]",
  },
} as const;

// ── AlertMapView ───────────────────────────────────────────────────────────

function AlertMapView({ lat, lng }: { lat: number; lng: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const map = new maplibregl.Map({
      container: el,
      style: {
        version: 8,
        sources: {
          basemap: {
            type: "raster",
            tiles: ["https://tile.opentopomap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            maxzoom: 17,
            attribution:
              'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
          },
        },
        layers: [{ id: "basemap", type: "raster", source: "basemap", maxzoom: 17 }],
      },
      center: [lng, lat],
      zoom: 13,
      maxZoom: 17,
      attributionControl: true,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    const marker = new maplibregl.Marker({ color: "#00e5ff" }).setLngLat([lng, lat]).addTo(map);
    mapRef.current = map;
    markerRef.current = marker;

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(el);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    marker.setLngLat([lng, lat]);
    map.flyTo({ center: [lng, lat], zoom: 13, duration: 1200, essential: true });
  }, [lat, lng]);

  return (
    <div
      ref={containerRef}
      className="h-full min-h-[320px] w-full overflow-hidden rounded-sm border border-[var(--sf-border-subtle)] shadow-[0_0_24px_var(--sf-glow-primary)]"
      role="region"
      aria-label="Mapa del incidente"
    />
  );
}

// ── Input helpers ──────────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-sm border border-[var(--sf-border-subtle)] bg-[color-mix(in_oklab,var(--sf-bg-elevated)_90%,transparent)] px-3 py-1.5 font-sf-mono text-xs text-sf-text focus:border-[var(--sf-border-strong)] focus:outline-none focus:shadow-[0_0_14px_var(--sf-glow-primary)] transition";
const labelClass =
  "block font-sf-mono text-[0.65rem] uppercase tracking-[0.18em] text-sf-muted mb-1";

// ── Main component ─────────────────────────────────────────────────────────

export default function AlertCenter({ apiBase }: { apiBase: string }) {
  const [alertHistory, setAlertHistory] = useState<AlertData[]>([]);
  const [formData, setFormData] = useState<AlertData | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loadingAlert, setLoadingAlert] = useState(false);
  const [loadingPred, setLoadingPred] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlert = useCallback(async () => {
    setLoadingAlert(true);
    setError(null);
    setPrediction(null);
    try {
      let data: AlertData;
      if (apiBase) {
        const r = await fetch(`${apiBase}/get_data`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        data = (await r.json()) as AlertData;
      } else {
        await new Promise((res) => setTimeout(res, 600));
        data = buildMockAlert();
      }
      setAlertHistory((prev) => [data, ...prev].slice(0, 20));
      setFormData(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoadingAlert(false);
    }
  }, [apiBase]);

  const fetchPrediction = useCallback(async () => {
    if (!formData) return;
    setLoadingPred(true);
    setError(null);
    try {
      let result: PredictionResult;
      if (apiBase) {
        const r = await fetch(`${apiBase}/get_prediction`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        result = (await r.json()) as PredictionResult;
      } else {
        await new Promise((res) => setTimeout(res, 800));
        result = MOCK_PREDICTION;
      }
      setPrediction(result);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoadingPred(false);
    }
  }, [apiBase, formData]);

  const updateField = <K extends keyof AlertData>(key: K, value: AlertData[K]) => {
    setFormData((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const severityConfig = prediction ? SEVERITY_CONFIG[prediction.severity] : null;

  // ── Button classes (mirror Button.astro) ──────────────────────────────
  const btnPrimary =
    "group relative isolate inline-flex min-h-10 items-center justify-center gap-2 px-5 py-2 font-sf-mono text-xs uppercase tracking-[0.2em] transition-[transform,box-shadow,color,background-color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sf-primary active:scale-[0.98] rounded-sm bg-[color-mix(in_oklab,var(--sf-color-primary)_18%,var(--sf-bg-elevated))] text-sf-text border border-[var(--sf-border-strong)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--sf-color-primary)_25%,transparent),0_0_24px_var(--sf-glow-primary)] hover:shadow-[0_0_0_1px_var(--sf-color-primary),0_0_36px_var(--sf-glow-primary)] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";
  const btnSecondary =
    "group relative isolate inline-flex min-h-10 items-center justify-center gap-2 px-5 py-2 font-sf-mono text-xs uppercase tracking-[0.2em] transition-[transform,box-shadow,color,background-color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sf-primary active:scale-[0.98] rounded-sm bg-[color-mix(in_oklab,var(--sf-color-secondary)_14%,var(--sf-bg-elevated))] text-sf-text border border-[color-mix(in_oklab,var(--sf-color-secondary)_45%,transparent)] shadow-[0_0_20px_var(--sf-glow-secondary)] hover:shadow-[0_0_32px_var(--sf-glow-secondary)] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";

  return (
    <div className="flex flex-col gap-6">
      {/* ── Actions bar ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={fetchAlert}
          disabled={loadingAlert}
          data-sf-sound-hover
          data-sf-sound-click
          className={btnPrimary}
        >
          <span className="text-[var(--sf-color-primary)]">◉</span>
          {loadingAlert ? "Recibiendo…" : "Recibir nueva alerta"}
        </button>
        {!apiBase && (
          <span className="font-sf-mono text-[0.65rem] uppercase tracking-[0.15em] text-sf-dim">
            Modo demo · sin API configurada
          </span>
        )}
        {error && (
          <span className="font-sf-mono text-[0.65rem] uppercase tracking-[0.15em] text-red-400">
            Error: {error}
          </span>
        )}
      </div>

      {/* ── Alert history table ───────────────────────────────────────────── */}
      <div className="rounded-sm border border-[var(--sf-border-subtle)] bg-[color-mix(in_oklab,var(--sf-bg-elevated)_85%,transparent)]">
        <div className="border-b border-[var(--sf-border-subtle)] px-4 py-2.5">
          <span className="font-sf-mono text-[0.65rem] uppercase tracking-[0.2em] text-sf-muted">
            Historial de alertas
          </span>
          <span className="ml-3 font-sf-mono text-[0.65rem] text-sf-dim">
            ({alertHistory.length} registros)
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-[var(--sf-border-subtle)]">
                {["ID", "Hora", "Tipo vehículo", "Carretera", "Vehículos", "Heridos"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left font-sf-mono text-[0.6rem] uppercase tracking-[0.18em] text-sf-dim"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alertHistory.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center font-sf-mono text-xs text-sf-dim"
                  >
                    Sin alertas recibidas — pulse «Recibir nueva alerta»
                  </td>
                </tr>
              ) : (
                alertHistory.map((a, i) => (
                  <tr
                    key={a.id}
                    onClick={() => { setFormData(a); setPrediction(null); }}
                    className={`cursor-pointer border-b border-[var(--sf-border-subtle)] transition hover:bg-[color-mix(in_oklab,var(--sf-color-primary)_6%,transparent)] ${i === 0 ? "bg-[color-mix(in_oklab,var(--sf-color-primary)_8%,transparent)]" : ""}`}
                  >
                    <td className="px-4 py-2 font-sf-mono text-xs text-[var(--sf-color-primary)]">{a.id}</td>
                    <td className="px-4 py-2 font-sf-mono text-xs text-sf-muted">
                      {new Date(a.timestamp).toLocaleTimeString("es-ES")}
                    </td>
                    <td className="px-4 py-2 font-sf-mono text-xs text-sf-text uppercase">{a.vehicleType}</td>
                    <td className="px-4 py-2 font-sf-mono text-xs text-sf-muted">{a.road}</td>
                    <td className="px-4 py-2 font-sf-mono text-xs text-sf-text text-center">{a.numVehicles}</td>
                    <td className="px-4 py-2 font-sf-mono text-xs text-center">
                      <span
                        className={a.injuredCount > 0 ? "text-amber-400" : "text-sf-dim"}
                      >
                        {a.injuredCount}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Form + Map ───────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="rounded-sm border border-[var(--sf-border-strong)] bg-[color-mix(in_oklab,var(--sf-color-primary)_6%,var(--sf-bg-elevated))] p-5 shadow-[0_0_0_1px_color-mix(in_oklab,var(--sf-color-primary)_12%,transparent),0_0_24px_var(--sf-glow-primary)]">
          <p className="mb-4 font-sf-mono text-[0.65rem] uppercase tracking-[0.2em] text-sf-muted">
            Datos del incidente
            {formData && (
              <span className="ml-2 text-[var(--sf-color-primary)]">· {formData.id}</span>
            )}
          </p>
          {formData ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Latitud</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={formData.lat}
                    onChange={(e) => updateField("lat", parseFloat(e.target.value) || 0)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Longitud</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={formData.lng}
                    onChange={(e) => updateField("lng", parseFloat(e.target.value) || 0)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Tipo de vehículo</label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => updateField("vehicleType", e.target.value)}
                  className={inputClass}
                >
                  {["car", "truck", "motorcycle", "bus", "van", "other"].map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Carretera</label>
                  <input
                    type="text"
                    value={formData.road}
                    onChange={(e) => updateField("road", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Dirección</label>
                  <input
                    type="text"
                    value={formData.direction}
                    onChange={(e) => updateField("direction", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Nº vehículos</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.numVehicles}
                    onChange={(e) => updateField("numVehicles", parseInt(e.target.value) || 1)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Nº heridos</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.injuredCount}
                    onChange={(e) => updateField("injuredCount", parseInt(e.target.value) || 0)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Descripción</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  className={`${inputClass} resize-none`}
                />
              </div>
              <div>
                <label className={labelClass}>Timestamp</label>
                <input
                  type="text"
                  readOnly
                  value={new Date(formData.timestamp).toLocaleString("es-ES")}
                  className={`${inputClass} opacity-50 cursor-not-allowed`}
                />
              </div>
            </div>
          ) : (
            <p className="py-8 text-center font-sf-mono text-xs text-sf-dim">
              Sin datos — reciba una alerta para autocompletar
            </p>
          )}
        </div>

        {/* Map */}
        <div className="flex flex-col rounded-sm border border-[var(--sf-border-subtle)] bg-[color-mix(in_oklab,var(--sf-bg-elevated)_85%,transparent)] p-5">
          <p className="mb-3 font-sf-mono text-[0.65rem] uppercase tracking-[0.2em] text-sf-muted">
            Localización del incidente
            {formData && (
              <span className="ml-2 font-sf-mono text-[0.65rem] text-[var(--sf-color-primary)]">
                {formData.lat.toFixed(5)}, {formData.lng.toFixed(5)}
              </span>
            )}
          </p>
          <div className="flex-1">
            <AlertMapView
              lat={formData?.lat ?? 40.4168}
              lng={formData?.lng ?? -3.7038}
            />
          </div>
        </div>
      </div>

      {/* ── Severity section ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start gap-6">
        <button
          type="button"
          onClick={fetchPrediction}
          disabled={!formData || loadingPred}
          data-sf-sound-hover
          data-sf-sound-click
          className={btnSecondary}
        >
          <span className="text-[var(--sf-color-secondary)]">◈</span>
          {loadingPred ? "Evaluando…" : "Evaluar gravedad"}
        </button>

        {prediction && severityConfig && (
          <div
            className={`flex-1 min-w-[280px] rounded-sm border p-5 transition ${severityConfig.classes}`}
          >
            <div className="mb-3 flex items-center gap-3">
              <span
                className={`rounded-sm px-2.5 py-1 font-sf-mono text-[0.65rem] uppercase tracking-[0.2em] ${severityConfig.badge}`}
              >
                {severityConfig.label}
              </span>
              <span className="font-sf-mono text-xs text-sf-muted">
                Score: {(prediction.score * 100).toFixed(0)}%
              </span>
            </div>
            <p className="mb-3 font-sf-mono text-sm">{prediction.label}</p>
            {prediction.recommendations.length > 0 && (
              <ul className="space-y-1">
                {prediction.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 font-sf-mono text-xs text-sf-muted">
                    <span className="mt-0.5 shrink-0 text-sf-dim">›</span>
                    {r}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
