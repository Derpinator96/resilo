import React, { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────
// Gauge Chart
// ─────────────────────────────────────────────────────────────
function GaugeChart({ value, min, max, unit, label, color, warningAt, dangerAt }) {
  const radius = 80;
  const strokeWidth = 13;
  const cx = 110;
  const cy = 108;
  const startAngle = -218;
  const endAngle = 38;
  const totalAngle = endAngle - startAngle;
  const pct = Math.min(Math.max((value - min) / (max - min), 0), 1);
  const angle = startAngle + pct * totalAngle;
  const toRad = (deg) => (deg * Math.PI) / 180;

  const arcPath = (startDeg, endDeg, r) => {
    const s = toRad(startDeg);
    const e = toRad(endDeg);
    const x1 = cx + r * Math.cos(s);
    const y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e);
    const y2 = cy + r * Math.sin(e);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const needleAngleRad = toRad(angle);
  const needleLen = radius - 12;
  const nx = cx + needleLen * Math.cos(needleAngleRad);
  const ny = cy + needleLen * Math.sin(needleAngleRad);
  const normalEnd = warningAt ? startAngle + ((warningAt - min) / (max - min)) * totalAngle : endAngle;
  const warningEnd = dangerAt ? startAngle + ((dangerAt - min) / (max - min)) * totalAngle : endAngle;
  const activeColor =
    value >= (dangerAt ?? Infinity) ? "#ef4444" :
    value >= (warningAt ?? Infinity) ? "#f59e0b" : color;

  const ticks = 6;
  const tickMarks = Array.from({ length: ticks + 1 }, (_, i) => {
    const t = i / ticks;
    const tickAngle = toRad(startAngle + t * totalAngle);
    const inner = radius - 14;
    const outer = radius - 4;
    const val = min + t * (max - min);
    return {
      x1: cx + inner * Math.cos(tickAngle), y1: cy + inner * Math.sin(tickAngle),
      x2: cx + outer * Math.cos(tickAngle), y2: cy + outer * Math.sin(tickAngle),
      val: val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0),
      lx: cx + (radius + 14) * Math.cos(tickAngle), ly: cy + (radius + 14) * Math.sin(tickAngle),
    };
  });

  return (
    <div className="flex flex-col items-center w-full">
      <svg viewBox="0 0 220 162" className="w-full max-w-62.5">
        <path d={arcPath(startAngle, endAngle, radius)} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} strokeLinecap="round" />
        {warningAt && <path d={arcPath(startAngle, Math.min(normalEnd, endAngle), radius)} fill="none" stroke={color + "28"} strokeWidth={strokeWidth} strokeLinecap="round" />}
        {warningAt && dangerAt && <path d={arcPath(normalEnd, Math.min(warningEnd, endAngle), radius)} fill="none" stroke="#f59e0b28" strokeWidth={strokeWidth} strokeLinecap="round" />}
        {dangerAt && <path d={arcPath(warningEnd, endAngle, radius)} fill="none" stroke="#ef444428" strokeWidth={strokeWidth} strokeLinecap="round" />}
        {value !== null && <path d={arcPath(startAngle, startAngle + pct * totalAngle, radius)} fill="none" stroke={activeColor} strokeWidth={strokeWidth} strokeLinecap="round" />}
        {tickMarks.map((t, i) => (
          <g key={i}>
            <line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="#cbd5e1" strokeWidth={1.5} />
            <text x={t.lx} y={t.ly} textAnchor="middle" dominantBaseline="middle" fontSize="6.5" fill="#94a3b8">{t.val}</text>
          </g>
        ))}
        {value !== null && (
          <>
            <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={activeColor} strokeWidth={2.5} strokeLinecap="round" />
            <circle cx={cx} cy={cy} r={7} fill="white" stroke={activeColor} strokeWidth={2.5} />
            <circle cx={cx} cy={cy} r={3} fill={activeColor} />
          </>
        )}
        <text x={cx} y={cy + 28} textAnchor="middle" fontSize="19" fontWeight="700" fill={value !== null ? activeColor : "#94a3b8"}>
          {value !== null ? value.toFixed(2) : "—"}
        </text>
        <text x={cx} y={cy + 42} textAnchor="middle" fontSize="9" fill="#64748b">{unit}</text>
      </svg>
      <div className="mt-1 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
        <p className="mt-0.5 text-4xl font-extrabold tabular-nums leading-none" style={{ color: value !== null ? activeColor : "#94a3b8" }}>
          {value !== null ? value.toFixed(2) : "—"}
          <span className="ml-1 text-base font-semibold text-slate-400">{unit}</span>
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Power Factor Arc
// ─────────────────────────────────────────────────────────────
function PowerFactorArc({ value }) {
  const pct = value !== null ? Math.min(Math.max(value, 0), 1) : 0;
  const color = pct >= 0.95 ? "#10b981" : pct >= 0.8 ? "#f59e0b" : "#ef4444";
  const label = pct >= 0.95 ? "Excellent" : pct >= 0.8 ? "Fair" : "Poor";
  const r = 60;
  const cx = 90;
  const cy = 80;
  const startAngle = Math.PI;
  const endAngle = 0;
  const arcAngle = startAngle + pct * (endAngle - startAngle);
  const sx = cx + r * Math.cos(startAngle);
  const sy = cy + r * Math.sin(startAngle);
  const ex = cx + r * Math.cos(arcAngle);
  const ey = cy + r * Math.sin(arcAngle);
  const large = pct > 0.5 ? 1 : 0;

  return (
    <div className="flex flex-col items-center w-full">
      <svg viewBox="0 0 180 100" className="w-full max-w-55">
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#e2e8f0" strokeWidth={13} strokeLinecap="round" />
        {value !== null && pct > 0 && (
          <path d={`M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`} fill="none" stroke={color} strokeWidth={13} strokeLinecap="round" />
        )}
        <text x={cx} y={cy - 10} textAnchor="middle" fontSize="22" fontWeight="700" fill={value !== null ? color : "#94a3b8"}>
          {value !== null ? value.toFixed(2) : "—"}
        </text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize="9" fill={color} fontWeight="600">{value !== null ? label : ""}</text>
        <text x={cx - r - 2} y={cy + 16} textAnchor="middle" fontSize="7.5" fill="#94a3b8">0</text>
        <text x={cx + r + 2} y={cy + 16} textAnchor="middle" fontSize="7.5" fill="#94a3b8">1</text>
      </svg>
      <div className="mt-1 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Power Factor</p>
        <p className="mt-0.5 text-4xl font-extrabold tabular-nums leading-none" style={{ color: value !== null ? color : "#94a3b8" }}>
          {value !== null ? value.toFixed(2) : "—"}
          <span className="ml-1 text-base font-semibold text-slate-400">pf</span>
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Metric Cards
// ─────────────────────────────────────────────────────────────
function StatCard({ label, value, unit, color, decimals = 2 }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100 flex flex-col justify-between min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 truncate">{label}</p>
      <p className="text-2xl font-extrabold tabular-nums leading-tight mt-1 truncate" style={{ color: color ?? "#0f172a" }}>
        {value !== null ? (typeof value === "number" ? value.toFixed(decimals) : value) : "—"}
        {value !== null && <span className="text-xs font-semibold text-slate-400 ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}

function EnergyCounterCard({ label, value, unit }) {
  const fixedValue = value !== null ? value.toFixed(5) : "0.00000";
  const [whole, decimal] = fixedValue.split(".");

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100 flex flex-col justify-between md:col-span-2 xl:col-span-2 min-w-0">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 truncate">{label}</p>
        <span className="text-amber-500 text-xs font-bold">⚡</span>
      </div>
      <div className="mt-1 flex items-baseline font-mono bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 w-fit">
        <span className="text-2xl font-extrabold tracking-tight text-slate-800 tabular-nums">
          {whole}
        </span>
        <span className="text-xl font-extrabold text-amber-500">.</span>
        <span className="text-xl font-bold text-amber-500 tracking-wide tabular-nums">
          {decimal}
        </span>
        <span className="ml-2 font-sans text-xs font-semibold uppercase tracking-wider text-slate-400">
          {unit}
        </span>
      </div>
    </div>
  );
}

function Sparkline({ data, color }) {
  if (!data || data.length < 2) return <div className="h-10 flex items-center justify-center text-xs text-slate-300">No data</div>;
  const w = 300; const h = 40;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

const HISTORY_LENGTH = 60;
const HISTORY_KEYS = ["voltage", "current", "realPower", "apparentPower", "reactivePower", "powerFactor"];

const NULL_DATA = {
  voltage: null, current: null,
  realPower: null, apparentPower: null,
  reactivePower: null, powerFactor: null,
};

const ZERO_DATA = {
  voltage: 0, current: 0,
  realPower: 0, apparentPower: 0,
  reactivePower: 0, powerFactor: 0,
};

const EMPTY_HISTORY = () => Object.fromEntries(HISTORY_KEYS.map((k) => [k, []]));

function parsePayload(payload) {
  const voltage       = payload.voltage       ?? payload.Voltage        ?? payload.V  ?? 0;
  const current       = payload.current       ?? payload.Current        ?? payload.I  ?? 0;
  const realPower     = payload.realPower     ?? payload.real_power     ?? payload.P  ?? (voltage * current);
  const apparentPower = payload.apparentPower ?? payload.apparent_power ?? payload.S  ?? 0;
  const reactivePower = payload.reactivePower ?? payload.reactive_power ?? payload.Q  ?? 0;
  const powerFactor   = payload.powerFactor   ?? payload.power_factor   ?? payload.pf ?? 0;
  return { voltage, current, realPower, apparentPower, reactivePower, powerFactor };
}

export default function IoTMonitor() {
  const [refreshSec, setRefreshSec]   = useState(0.5);
  const [data, setData]               = useState(NULL_DATA);
  const [energy, setEnergy]           = useState(0.0); 
  const [connected, setConnected]     = useState(false);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [history, setHistory]         = useState(EMPTY_HISTORY);
  
  const timerRef = useRef(null);
  const lastTimestampRef = useRef(Date.now());

  const seedHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/telemetry/history?limit=60');
      if (!res.ok) return;
      const docs = await res.json();
      if (!Array.isArray(docs) || docs.length === 0) return;
      const seeded = EMPTY_HISTORY();
      docs.forEach((doc) => {
        const p = parsePayload(doc.payload || doc);
        HISTORY_KEYS.forEach((k) => seeded[k].push(p[k]));
      });
      setHistory(seeded);
    } catch { /* ignore */ }
  }, []);

  const fetchLatest = useCallback(async () => {
    const now = Date.now();
    const deltaHours = (now - lastTimestampRef.current) / 3600000.0;
    
    try {
      const res = await fetch('/api/telemetry/latest');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const newData = parsePayload(json.payload || json);

      if (newData.realPower > 0) {
        setEnergy((prev) => prev + (newData.realPower * deltaHours) / 1000.0);
      }

      setData(newData);
      setHistory((prev) => {
        const next = { ...prev };
        HISTORY_KEYS.forEach((k) => {
          next[k] = [...prev[k].slice(-(HISTORY_LENGTH - 1)), newData[k]];
        });
        return next;
      });
      setLastUpdated(new Date());
      setConnected(true);
      setLoading(false);
      setError("");
    } catch (err) {
      console.error("Telemetry fetch error", err);
      setConnected(false);
      setLoading(false);
      setError("Cannot reach backend — Drop detected. Forcing parameters to zero.");
      
      setData(ZERO_DATA);
      setHistory((prev) => {
        const next = { ...prev };
        HISTORY_KEYS.forEach((k) => {
          next[k] = [...prev[k].slice(-(HISTORY_LENGTH - 1)), 0];
        });
        return next;
      });
    } finally {
      lastTimestampRef.current = now;
    }
  }, []);

  useEffect(() => {
    seedHistory();
    fetchLatest();
    timerRef.current = setInterval(fetchLatest, refreshSec * 1000);
    return () => clearInterval(timerRef.current);
  }, [fetchLatest, seedHistory, refreshSec]);

  const efficiency =
    data.apparentPower && data.apparentPower > 0
      ? ((data.realPower / data.apparentPower) * 100).toFixed(1) + "%"
      : null;

  const pfStatus =
    data.powerFactor === null  ? { text: "—",        cls: "text-slate-400"   } :
    data.powerFactor >= 0.95   ? { text: "Excellent", cls: "text-emerald-600" } :
    data.powerFactor >= 0.8    ? { text: "Fair",      cls: "text-amber-500"   } :
                                 { text: "Poor",       cls: "text-red-500"     };

  return (
    <div className="space-y-5">
      {/* STATUS BAR */}
      <div className="bg-white rounded-xl shadow-sm px-5 py-4 border border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-red-500 animate-pulse"}`} />
          {loading   && <span className="text-amber-600 text-xs font-medium">Connecting...</span>}
          {connected && <span className="text-emerald-600 text-xs font-medium">✓ Pipeline Syncing</span>}
          {error     && <span className="text-red-500 text-xs font-semibold">⚠ {error}</span>}
          {lastUpdated && (
            <span className="text-slate-400 text-xs ml-2">Updated {lastUpdated.toLocaleTimeString()}</span>
          )}
        </div>
        <select
          value={refreshSec}
          onChange={(e) => setRefreshSec(Number(e.target.value))}
          className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 focus:outline-none"
        >
          <option value={0.5}>Poll 0.5s</option>
          <option value={1}>Poll 1s</option>
          <option value={2}>Poll 2s</option>
          <option value={5}>Poll 5s</option>
        </select>
      </div>

      {/* ROW 1: CORE METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { key: "voltage",   label: "Voltage",    unit: "V", color: "#0284c7", min: 0, max: 280,  warningAt: 240,  dangerAt: 260  },
          { key: "current",   label: "Current",    unit: "A", color: "#059669", min: 0, max: 20,   warningAt: 15,   dangerAt: 18   },
          { key: "realPower", label: "Real Power", unit: "W", color: "#d97706", min: 0, max: 5000, warningAt: 3500, dangerAt: 4500 },
        ].map(({ key, ...props }) => (
          <div key={key} className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
            <GaugeChart value={data[key]} {...props} />
          </div>
        ))}
      </div>

      {/* ROW 2: ADVANCED SYSTEM POWERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
          <GaugeChart value={data.apparentPower} min={0} max={5000} unit="VA"  label="Apparent Power" color="#7c3aed" warningAt={3500} dangerAt={4500} />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
          <GaugeChart value={data.reactivePower} min={0} max={3000} unit="VAR" label="Reactive Power"  color="#db2777" />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
          <PowerFactorArc value={data.powerFactor} />
        </div>
      </div>

      {/* ROW 3: STAT CARDS + HARMONIZED KWH TOTALIZER */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        <StatCard label="Voltage"        value={data.voltage}       unit="V"   color="#0284c7"  />
        <StatCard label="Current"        value={data.current}       unit="A"   color="#059669"  />
        <StatCard label="Real Power"     value={data.realPower}     unit="W"   color="#d97706"  />
        <StatCard label="Apparent Power" value={data.apparentPower} unit="VA"  color="#7c3aed"  />
        <StatCard label="Reactive Power" value={data.reactivePower} unit="VAR" color="#db2777"  />
        <StatCard label="Power Factor"   value={data.powerFactor}   unit="pf"
          color={data.powerFactor >= 0.95 ? "#10b981" : data.powerFactor >= 0.8 ? "#f59e0b" : "#ef4444"} />
        
        {/* Harmonized Light Metric Totalizer Card */}
        <EnergyCounterCard label="Total Energy Audited" value={energy} unit="kWh" />
      </div>

      {/* ROW 4: PF STATUS & EFFICIENCY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Power Factor Status</p>
          <div className="flex items-center gap-3">
            <div className={`text-3xl font-extrabold ${pfStatus.cls}`}>
              {data.powerFactor !== null ? data.powerFactor.toFixed(3) : "—"}
            </div>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${
              pfStatus.text === "Excellent" ? "bg-emerald-100 text-emerald-700" :
              pfStatus.text === "Fair"      ? "bg-amber-100  text-amber-700"   :
              pfStatus.text === "Poor"      ? "bg-red-100    text-red-700"     :
                                              "bg-slate-100  text-slate-400"
            }`}>{pfStatus.text}</span>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            When data packets are missing or drop out, system logs default immediately to 0 to prevent auditing inflation.
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Load Efficiency (P / S)</p>
          {efficiency ? (
            <>
              <div className="text-3xl font-extrabold text-[#011425]">{efficiency}</div>
              <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-linear-to-r from-emerald-400 to-teal-500 transition-all duration-700" style={{ width: efficiency }} />
              </div>
              <p className="text-xs text-slate-400 mt-2">{data.realPower?.toFixed(1)} W real / {data.apparentPower?.toFixed(1)} VA apparent</p>
            </>
          ) : (
            <p className="text-slate-400 text-sm">Data flow inactive</p>
          )}
        </div>
      </div>

      {/* ROW 5: TREND LINES SPARKLINES */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
          Live Trends — Last {HISTORY_LENGTH} Readings
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[
            { key: "voltage",       label: "Voltage",        unit: "V",   color: "#0284c7" },
            { key: "current",       label: "Current",        unit: "A",   color: "#059669" },
            { key: "realPower",     label: "Real Power",     unit: "W",   color: "#d97706" },
            { key: "apparentPower", label: "Apparent Power", unit: "VA",  color: "#7c3aed" },
            { key: "reactivePower", label: "Reactive Power", unit: "VAR", color: "#db2777" },
            { key: "powerFactor",   label: "Power Factor",   unit: "pf",  color: "#0891b2" },
          ].map(({ key, label, unit, color }) => (
            <div key={key}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-slate-500">{label}</span>
                <span className="text-xs font-bold tabular-nums" style={{ color }}>
                  {history[key].length > 0 ? history[key][history[key].length - 1].toFixed(2) : "—"} {unit}
                </span>
              </div>
              <Sparkline data={history[key]} color={color} />
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-300 mt-4 text-center">
          {history.voltage.length} / {HISTORY_LENGTH} active samples logged
        </p>
      </div>

    </div>
  );
}
