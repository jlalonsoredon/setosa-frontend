import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// ── Types ──────────────────────────────────────────────────────────────────

type AlertData = {
  // internal (not from API)
  id: string;
  timestamp: string;
  // API fields
  age_band_of_casualty: string;
  age_band_of_driver: string;
  casualty_type: string;
  day_period: string;
  first_point_of_impact: string;
  geo_hash: string;
  hit_object_in_carriageway: string;
  hit_object_off_carriageway: string;
  junction_location: string;
  light_conditions: string;
  number_of_casualties: number;
  number_of_vehicles: number;
  pedestrian_location: string;
  pedestrian_movement: string;
  road_type: string;
  skidding_and_overturning: string;
  special_conditions_at_site: string;
  speed_limit: number;
  urban_or_rural_area: string;
  vehicle_leaving_carriageway: string;
  vehicle_left_hand_drive: string;
  vehicle_manoeuvre: string;
  vehicle_type: string;
};

type PredictionResult = {
  prediction: number;
  severity_probability: number;
  threshold: number;
};

// ── Geohash decoder ────────────────────────────────────────────────────────

function decodeGeohash(hash: string): [number, number] {
  const B32 = "0123456789bcdefghjkmnpqrstuvwxyz";
  let latMin = -90, latMax = 90, lonMin = -180, lonMax = 180;
  let isLon = true;
  for (const ch of hash.toLowerCase()) {
    const val = B32.indexOf(ch);
    if (val < 0) break;
    for (let b = 4; b >= 0; b--) {
      const bit = (val >> b) & 1;
      if (isLon) { const m = (lonMin + lonMax) / 2; if (bit) lonMin = m; else lonMax = m; }
      else        { const m = (latMin + latMax) / 2; if (bit) latMin = m; else latMax = m; }
      isLon = !isLon;
    }
  }
  return [(latMin + latMax) / 2, (lonMin + lonMax) / 2];
}

// ── Mock data ──────────────────────────────────────────────────────────────

let mockCounter = 0;

const MOCK_TEMPLATES: Omit<AlertData, "id" | "timestamp">[] = [
  {
    age_band_of_casualty: "26 - 35", age_band_of_driver: "36 - 45",
    casualty_type: "Car occupant", day_period: "morning",
    first_point_of_impact: "Front", geo_hash: "gcpvh",
    hit_object_in_carriageway: "Parked vehicle", hit_object_off_carriageway: "No hit",
    junction_location: "Not at or within 20 metres of junction", light_conditions: "Daylight",
    number_of_casualties: 1, number_of_vehicles: 2,
    pedestrian_location: "Not a Pedestrian", pedestrian_movement: "Not a Pedestrian",
    road_type: "Single carriageway", skidding_and_overturning: "No skidding",
    special_conditions_at_site: "No", speed_limit: 30, urban_or_rural_area: "Urban",
    vehicle_leaving_carriageway: "Did not leave carriageway", vehicle_left_hand_drive: "No",
    vehicle_manoeuvre: "Going ahead", vehicle_type: "Car",
  },
  {
    age_band_of_casualty: "66 - 75", age_band_of_driver: "66 - 75",
    casualty_type: "Pedestrian", day_period: "evening",
    first_point_of_impact: "Front", geo_hash: "u100",
    hit_object_in_carriageway: "No", hit_object_off_carriageway: "No hit",
    junction_location: "Mid Junction - on roundabout", light_conditions: "Darkness - lights lit",
    number_of_casualties: 2, number_of_vehicles: 1,
    pedestrian_location: "In carriageway, crossing on pedestrian crossing facility",
    pedestrian_movement: "Crossing from driver's nearside",
    road_type: "Dual carriageway", skidding_and_overturning: "Skidded",
    special_conditions_at_site: "No", speed_limit: 50, urban_or_rural_area: "Urban",
    vehicle_leaving_carriageway: "Did not leave carriageway", vehicle_left_hand_drive: "No",
    vehicle_manoeuvre: "Slowing or stopping", vehicle_type: "Motorcycle",
  },
  {
    age_band_of_casualty: "46 - 55", age_band_of_driver: "46 - 55",
    casualty_type: "Car occupant", day_period: "afternoon",
    first_point_of_impact: "Offside", geo_hash: "gcn",
    hit_object_in_carriageway: "Road works", hit_object_off_carriageway: "Road sign",
    junction_location: "Not at or within 20 metres of junction", light_conditions: "Daylight",
    number_of_casualties: 3, number_of_vehicles: 3,
    pedestrian_location: "Not a Pedestrian", pedestrian_movement: "Not a Pedestrian",
    road_type: "Single carriageway", skidding_and_overturning: "No skidding",
    special_conditions_at_site: "Road works", speed_limit: 70, urban_or_rural_area: "Rural",
    vehicle_leaving_carriageway: "Off nearside of carriageway", vehicle_left_hand_drive: "No",
    vehicle_manoeuvre: "Overtaking moving vehicle - offside", vehicle_type: "Goods >3.5t",
  },
];

function buildMockAlert(): AlertData {
  mockCounter++;
  const t = MOCK_TEMPLATES[(mockCounter - 1) % MOCK_TEMPLATES.length]!;
  return { id: `ALERT-DEMO-${String(mockCounter).padStart(3, "0")}`, timestamp: new Date().toISOString(), ...t };
}

const MOCK_PREDICTION: PredictionResult = {
  prediction: 1,
  severity_probability: 0.7507278678830313,
  threshold: 0.5,
};

// ── Severity helpers ───────────────────────────────────────────────────────

const SEVERITY = {
  leve: {
    label: "LEVE",
    classes: "border-[var(--sf-color-primary)] shadow-[0_0_24px_var(--sf-glow-primary)]",
    badge: "bg-[color-mix(in_oklab,var(--sf-color-primary)_18%,transparent)] text-[var(--sf-color-primary)]",
    text: "text-[var(--sf-color-primary)]",
    recommendations: [
      "Señalizar la zona del incidente para evitar nuevos accidentes",
      "Solicitar servicio de grúa para retirar el vehículo",
      "Notificar a DGT para actualización del estado del tráfico",
    ],
    contacts: ["grua"] as const,
  },
  grave: {
    label: "GRAVE",
    classes: "border-[var(--sf-color-secondary)] shadow-[0_0_32px_var(--sf-glow-secondary)]",
    badge: "bg-[color-mix(in_oklab,var(--sf-color-secondary)_18%,transparent)] text-[var(--sf-color-secondary)]",
    text: "text-[var(--sf-color-secondary)]",
    recommendations: [
      "Activar unidad de emergencias médicas de inmediato",
      "Alertar a las fuerzas de seguridad del Estado",
      "Notificar a bomberos si existe riesgo de incendio o atrapados",
      "Señalizar desvío alternativo y cortar el carril afectado",
      "Solicitar servicio de grúa para despejar la calzada",
    ],
    contacts: ["ambulancia", "policia", "bomberos", "grua"] as const,
  },
} as const;

const CONTACT_CONFIG: Record<string, { label: string; symbol: string; color: string }> = {
  ambulancia: { label: "Ambulancia", symbol: "✚", color: "border-red-400 text-red-400 shadow-[0_0_14px_rgba(248,113,113,0.4)] hover:shadow-[0_0_24px_rgba(248,113,113,0.6)] bg-red-400/10" },
  policia:    { label: "Policía",    symbol: "◆", color: "border-blue-400 text-blue-400 shadow-[0_0_14px_rgba(96,165,250,0.4)] hover:shadow-[0_0_24px_rgba(96,165,250,0.6)] bg-blue-400/10" },
  bomberos:   { label: "Bomberos",   symbol: "▲", color: "border-orange-400 text-orange-400 shadow-[0_0_14px_rgba(251,146,60,0.4)] hover:shadow-[0_0_24px_rgba(251,146,60,0.6)] bg-orange-400/10" },
  grua:       { label: "Grúa",       symbol: "◈", color: "border-amber-400 text-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.4)] hover:shadow-[0_0_24px_rgba(251,191,36,0.6)] bg-amber-400/10" },
};

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
        sources: { basemap: { type: "raster", tiles: ["https://tile.opentopomap.org/{z}/{x}/{y}.png"], tileSize: 256, maxzoom: 17, attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)' } },
        layers: [{ id: "basemap", type: "raster", source: "basemap", maxzoom: 17 }],
      },
      center: [lng, lat], zoom: 13, maxZoom: 17, attributionControl: true,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    const marker = new maplibregl.Marker({ color: "#00e5ff" }).setLngLat([lng, lat]).addTo(map);
    mapRef.current = map;
    markerRef.current = marker;
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(el);
    return () => { ro.disconnect(); map.remove(); mapRef.current = null; markerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current; const marker = markerRef.current;
    if (!map || !marker) return;
    marker.setLngLat([lng, lat]);
    map.flyTo({ center: [lng, lat], zoom: 13, duration: 1200, essential: true });
  }, [lat, lng]);

  return (
    <div ref={containerRef} className="h-full min-h-[320px] w-full overflow-hidden rounded-sm border border-[var(--sf-border-subtle)] shadow-[0_0_24px_var(--sf-glow-primary)]" role="region" aria-label="Mapa del incidente" />
  );
}

// ── Traffic images ─────────────────────────────────────────────────────────

const TRAFIC_IMAGES = [
  "/trafic/image.png",
  "/trafic/image-1.png",
  "/trafic/image-2.png",
  "/trafic/image-3.png",
  "/trafic/image-4.png",
  "/trafic/image-5.png",
  "/trafic/image-6.png",
  "/trafic/image-7.png",
];

function randomTraficImage() {
  return TRAFIC_IMAGES[Math.floor(Math.random() * TRAFIC_IMAGES.length)]!;
}

// ── Form helpers ───────────────────────────────────────────────────────────

const inputClass = "w-full rounded-sm border border-[var(--sf-border-subtle)] bg-[color-mix(in_oklab,var(--sf-bg-elevated)_90%,transparent)] px-3 py-2 font-sf-mono text-sm text-sf-text focus:border-[var(--sf-border-strong)] focus:outline-none focus:shadow-[0_0_14px_var(--sf-glow-primary)] transition";
const labelClass = "block font-sf-mono text-xs uppercase tracking-[0.18em] text-sf-muted mb-1";
const sectionClass = "font-sf-mono text-xs uppercase tracking-[0.2em] text-sf-primary mb-3 mt-5 first:mt-0 border-b border-[var(--sf-border-subtle)] pb-1";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className={labelClass}>{label}</label>{children}</div>;
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return <p className={sectionClass}>{children}</p>;
}

// ── Main component ─────────────────────────────────────────────────────────

export default function AlertCenter({ apiBase }: { apiBase: string }) {
  const [alertHistory, setAlertHistory] = useState<AlertData[]>([]);
  const [formData, setFormData] = useState<AlertData | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loadingAlert, setLoadingAlert] = useState(false);
  const [loadingPred, setLoadingPred] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactedSet, setContactedSet] = useState<Set<string>>(new Set());
  const [traficImage, setTraficImage] = useState<string | null>(null);

  const fetchAlert = useCallback(async () => {
    setLoadingAlert(true); setError(null); setPrediction(null);
    try {
      let raw: Omit<AlertData, "id" | "timestamp">;
      if (apiBase) {
        const r = await fetch(`${apiBase}/get_data`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        raw = await r.json();
      } else {
        await new Promise((res) => setTimeout(res, 600));
        const { id: _i, timestamp: _t, ...rest } = buildMockAlert();
        raw = rest;
      }
      const data: AlertData = {
        id: `ALERT-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        ...raw,
      };
      setAlertHistory((prev) => [data, ...prev].slice(0, 20));
      setFormData(data);
      setTraficImage(randomTraficImage());
    } catch (e) { setError(String(e)); }
    finally { setLoadingAlert(false); }
  }, [apiBase]);

  const fetchPrediction = useCallback(async () => {
    if (!formData) return;
    setLoadingPred(true); setError(null);
    try {
      let result: PredictionResult;
      if (apiBase) {
        const r = await fetch(`${apiBase}/get_prediction`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        result = await r.json();
      } else {
        await new Promise((res) => setTimeout(res, 800));
        result = MOCK_PREDICTION;
      }
      setPrediction(result);
      setContactedSet(new Set());
    } catch (e) { setError(String(e)); }
    finally { setLoadingPred(false); }
  }, [apiBase, formData]);

  const set = <K extends keyof AlertData>(key: K, value: AlertData[K]) =>
    setFormData((prev) => (prev ? { ...prev, [key]: value } : prev));

  const txt = (key: keyof AlertData) => (
    <input type="text" value={String(formData?.[key] ?? "")} onChange={(e) => set(key, e.target.value as AlertData[typeof key])} className={inputClass} />
  );
  const num = (key: keyof AlertData) => (
    <input type="number" value={Number(formData?.[key] ?? 0)} onChange={(e) => set(key, Number(e.target.value) as AlertData[typeof key])} className={inputClass} />
  );

  const mapCoords = formData?.geo_hash ? decodeGeohash(formData.geo_hash) : ([51.5, -0.1] as [number, number]);

  const severityCfg = prediction
    ? (prediction.severity_probability >= prediction.threshold ? SEVERITY.grave : SEVERITY.leve)
    : null;

  const btnPrimary = "group relative isolate inline-flex min-h-10 items-center justify-center gap-2 px-5 py-2 font-sf-mono text-xs uppercase tracking-[0.2em] transition-[transform,box-shadow,color,background-color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sf-primary active:scale-[0.98] rounded-sm bg-[color-mix(in_oklab,var(--sf-color-primary)_18%,var(--sf-bg-elevated))] text-sf-text border border-[var(--sf-border-strong)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--sf-color-primary)_25%,transparent),0_0_24px_var(--sf-glow-primary)] hover:shadow-[0_0_0_1px_var(--sf-color-primary),0_0_36px_var(--sf-glow-primary)] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";
  const btnSecondary = "group relative isolate inline-flex min-h-10 items-center justify-center gap-2 px-5 py-2 font-sf-mono text-xs uppercase tracking-[0.2em] transition-[transform,box-shadow,color,background-color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sf-primary active:scale-[0.98] rounded-sm bg-[color-mix(in_oklab,var(--sf-color-secondary)_14%,var(--sf-bg-elevated))] text-sf-text border border-[color-mix(in_oklab,var(--sf-color-secondary)_45%,transparent)] shadow-[0_0_20px_var(--sf-glow-secondary)] hover:shadow-[0_0_32px_var(--sf-glow-secondary)] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";

  return (
    <div className="flex flex-col gap-6">

      {/* ── Actions bar ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" onClick={fetchAlert} disabled={loadingAlert} data-sf-sound-hover data-sf-sound-click className={btnPrimary}>
          <span className="text-[var(--sf-color-primary)]">◉</span>
          {loadingAlert ? "Recibiendo…" : "Recibir nueva alerta"}
        </button>
        {/* {!apiBase && <span className="font-sf-mono text-xs uppercase tracking-[0.15em] text-sf-dim">Modo demo · sin API configurada</span>}
        {error && <span className="font-sf-mono text-xs uppercase tracking-[0.15em] text-red-400">Error: {error}</span>} */}
      </div>

      {/* ── History table ────────────────────────────────────────────────── */}
      <div className="rounded-sm border border-[var(--sf-border-subtle)] bg-[color-mix(in_oklab,var(--sf-bg-elevated)_85%,transparent)]">
        <div className="border-b border-[var(--sf-border-subtle)] px-4 py-2.5">
          <span className="font-sf-mono text-xs uppercase tracking-[0.2em] text-sf-muted">Historial de alertas</span>
          <span className="ml-3 font-sf-mono text-xs text-sf-dim">({alertHistory.length} registros)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--sf-border-subtle)]">
                {["ID", "Hora", "Vehículo", "Tipo carretera", "Zona", "Velocidad", "Víctimas"].map((h) => (
                  <th key={h} className="px-4 py-2 text-left font-sf-mono text-xs uppercase tracking-[0.18em] text-sf-dim">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alertHistory.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center font-sf-mono text-sm text-sf-dim">Sin alertas recibidas — pulse «Recibir nueva alerta»</td></tr>
              ) : alertHistory.map((a, i) => (
                <tr key={a.id} onClick={() => { setFormData(a); setPrediction(null); }}
                  className={`cursor-pointer border-b border-[var(--sf-border-subtle)] transition hover:bg-[color-mix(in_oklab,var(--sf-color-primary)_6%,transparent)] ${i === 0 ? "bg-[color-mix(in_oklab,var(--sf-color-primary)_8%,transparent)]" : ""}`}>
                  <td className="px-4 py-2.5 font-sf-mono text-sm text-[var(--sf-color-primary)]">{a.id}</td>
                  <td className="px-4 py-2.5 font-sf-mono text-sm text-sf-muted">{new Date(a.timestamp).toLocaleTimeString("es-ES")}</td>
                  <td className="px-4 py-2.5 font-sf-mono text-sm text-sf-text uppercase">{a.vehicle_type}</td>
                  <td className="px-4 py-2.5 font-sf-mono text-sm text-sf-muted">{a.road_type}</td>
                  <td className="px-4 py-2.5 font-sf-mono text-sm text-sf-muted">{a.urban_or_rural_area}</td>
                  <td className="px-4 py-2.5 font-sf-mono text-sm text-sf-text text-center">{a.speed_limit}</td>
                  <td className="px-4 py-2.5 font-sf-mono text-sm text-center">
                    <span className={a.number_of_casualties > 0 ? "text-amber-400" : "text-sf-dim"}>{a.number_of_casualties}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Form + Map ───────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Form */}
        <div className="rounded-sm border border-[var(--sf-border-strong)] bg-[color-mix(in_oklab,var(--sf-color-primary)_6%,var(--sf-bg-elevated))] p-5 shadow-[0_0_0_1px_color-mix(in_oklab,var(--sf-color-primary)_12%,transparent),0_0_24px_var(--sf-glow-primary)] overflow-y-auto max-h-[640px]">
          <p className="mb-2 font-sf-mono text-xs uppercase tracking-[0.2em] text-sf-muted">
            Datos del incidente{formData && <span className="ml-2 text-[var(--sf-color-primary)]">· {formData.id}</span>}
          </p>

          {formData ? (
            <div className="space-y-3">

              <SectionHead>Localización</SectionHead>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Geo hash">{txt("geo_hash")}</Field>
                <Field label="Tipo de zona">{txt("urban_or_rural_area")}</Field>
                <Field label="Tipo de carretera">{txt("road_type")}</Field>
                <Field label="Límite de velocidad">{num("speed_limit")}</Field>
                <Field label="Ubicación en cruce">{txt("junction_location")}</Field>
                <Field label="Condiciones de luz">{txt("light_conditions")}</Field>
                <Field label="Período del día">{txt("day_period")}</Field>
                <Field label="Condiciones especiales">{txt("special_conditions_at_site")}</Field>
              </div>

              <SectionHead>Vehículo</SectionHead>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tipo de vehículo">{txt("vehicle_type")}</Field>
                <Field label="Nº de vehículos">{num("number_of_vehicles")}</Field>
                <Field label="Maniobra">{txt("vehicle_manoeuvre")}</Field>
                <Field label="Abandona calzada">{txt("vehicle_leaving_carriageway")}</Field>
                <Field label="Conducción izquierda">{txt("vehicle_left_hand_drive")}</Field>
              </div>

              <SectionHead>Impacto y circunstancias</SectionHead>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Primer punto de impacto">{txt("first_point_of_impact")}</Field>
                <Field label="Patinaje / vuelco">{txt("skidding_and_overturning")}</Field>
                <Field label="Objeto en calzada">{txt("hit_object_in_carriageway")}</Field>
                <Field label="Objeto fuera de calzada">{txt("hit_object_off_carriageway")}</Field>
              </div>

              <SectionHead>Víctimas</SectionHead>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nº de víctimas">{num("number_of_casualties")}</Field>
                <Field label="Tipo de víctima">{txt("casualty_type")}</Field>
                <Field label="Edad de la víctima">{txt("age_band_of_casualty")}</Field>
                <Field label="Edad del conductor">{txt("age_band_of_driver")}</Field>
              </div>

              <SectionHead>Peatón</SectionHead>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Localización peatón">{txt("pedestrian_location")}</Field>
                <Field label="Movimiento peatón">{txt("pedestrian_movement")}</Field>
              </div>

            </div>
          ) : (
            <p className="py-8 text-center font-sf-mono text-sm text-sf-dim">Sin datos — reciba una alerta para autocompletar</p>
          )}
        </div>

        {/* Map */}
        <div className="flex flex-col rounded-sm border border-[var(--sf-border-subtle)] bg-[color-mix(in_oklab,var(--sf-bg-elevated)_85%,transparent)] p-5 min-h-[420px]">
          <p className="mb-3 font-sf-mono text-xs uppercase tracking-[0.2em] text-sf-muted">
            Localización del incidente
            {formData && (
              <span className="ml-2 font-sf-mono text-xs text-[var(--sf-color-primary)]">
                geo: {formData.geo_hash} · {mapCoords[0].toFixed(4)}, {mapCoords[1].toFixed(4)}
              </span>
            )}
          </p>
          <div className="flex-1 min-h-0">
            <AlertMapView lat={mapCoords[0]} lng={mapCoords[1]} />
          </div>
        </div>
      </div>

      {/* ── Bottom: prediction + photo ──────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Left: evaluar gravedad + banner */}
        <div className="flex flex-col gap-4">
          <div>
            <button type="button" onClick={fetchPrediction} disabled={!formData || loadingPred} data-sf-sound-hover data-sf-sound-click className={btnSecondary}>
              <span className="text-[var(--sf-color-secondary)]">◈</span>
              {loadingPred ? "Evaluando…" : "Evaluar gravedad"}
            </button>
          </div>

          {prediction && severityCfg && (
            <div className={`rounded-sm border p-5 transition ${severityCfg.classes}`}>

              {/* Header */}
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className={`rounded-sm px-2.5 py-1 font-sf-mono text-xs uppercase tracking-[0.2em] ${severityCfg.badge}`}>
                  {severityCfg.label}
                </span>
                <span className={`font-sf-display text-2xl font-semibold tracking-wide ${severityCfg.text}`}>
                  Grado {prediction.prediction}
                </span>
                <span className="ml-auto font-sf-mono text-sm text-sf-muted">
                  Probabilidad: <span className={severityCfg.text}>{(prediction.severity_probability * 100).toFixed(1)}%</span>
                </span>
              </div>

              {/* Recommendations */}
              <p className="mb-2 font-sf-mono text-xs uppercase tracking-[0.18em] text-sf-muted">Recomendaciones</p>
              <ul className="mb-5 space-y-1.5">
                {severityCfg.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 font-sf-mono text-sm text-sf-muted">
                    <span className={`mt-0.5 shrink-0 ${severityCfg.text}`}>›</span>{r}
                  </li>
                ))}
              </ul>

              {/* Contact buttons */}
              <p className="mb-3 font-sf-mono text-xs uppercase tracking-[0.18em] text-sf-muted">Contactar asistencias</p>
              <div className="flex flex-wrap gap-3">
                {severityCfg.contacts.map((key) => {
                  const cfg = CONTACT_CONFIG[key]!;
                  const contacted = contactedSet.has(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setContactedSet((prev) => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; })}
                      data-sf-sound-click
                      className={`inline-flex items-center gap-2 rounded-sm border px-4 py-2 font-sf-mono text-xs uppercase tracking-[0.18em] transition duration-200 active:scale-[0.97] ${contacted ? `${cfg.color} opacity-60` : `${cfg.color} hover:brightness-125`}`}
                    >
                      <span>{cfg.symbol}</span>
                      {cfg.label}
                      {contacted && <span className="ml-1 text-[0.6rem] opacity-80">· Contactado</span>}
                    </button>
                  );
                })}
              </div>

            </div>
          )}
        </div>

        {/* Right: traffic photo below the map */}
        <div className="rounded-sm border border-[var(--sf-border-subtle)] bg-[color-mix(in_oklab,var(--sf-bg-elevated)_85%,transparent)] p-3 flex flex-col gap-2 overflow-hidden">
          <p className="font-sf-mono text-xs uppercase tracking-[0.2em] text-sf-muted">Imagen del incidente</p>
          <div className="overflow-hidden rounded-sm border border-[var(--sf-border-subtle)] min-h-[200px] max-h-[360px] flex items-center justify-center">
            {traficImage ? (
              <img
                key={traficImage}
                src={traficImage}
                alt="Imagen de tráfico"
                className="w-full h-auto object-contain block"
              />
            ) : (
              <p className="font-sf-mono text-sm text-sf-dim">Sin imagen — reciba una alerta</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
