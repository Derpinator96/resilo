import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  ArrowLeft, Droplet, BatteryCharging, Power, ThermometerSun,
  AlertTriangle, CheckCircle2, ShieldAlert, X, Activity,
  Sun, Moon, Wifi, TrendingUp, TrendingDown, MoreHorizontal
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function InstituteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [inst, setInst] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isDark, setIsDark] = useState(false)

  // Report Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [reportComponent, setReportComponent] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Interactive Water Tank State
  const [isWaterExpanded, setIsWaterExpanded] = useState(false)
  const [waterLevelData, setWaterLevelData] = useState([])
  const [currentWaterLevel, setCurrentWaterLevel] = useState(0)

  // Interactive Water Quality State
  const [isQualityExpanded, setIsQualityExpanded] = useState(false)
  const [qualityDataHistory, setQualityDataHistory] = useState([])
  const [currentQuality, setCurrentQuality] = useState({
    ph: 7.0, hardness: 0, solids: 0, chloramine: 0, sulfate: 0,
    conductivity: 0, organicCarbon: 0, thm: 0, turbidity: 0
  })

  // Interactive Solar Grid State
  const [isSolarExpanded, setIsSolarExpanded] = useState(false)
  const [solarDataHistory, setSolarDataHistory] = useState([])
  const [currentSolar, setCurrentSolar] = useState({
    battery: 0, grid: 0, voltage: 0, current: 0, power: 0
  })


  useEffect(() => {
    if (inst) setCurrentWaterLevel(inst.waterLevel.level)
  }, [inst])

  useEffect(() => {
    if (!isWaterExpanded) return
    const fetchBlynk = async () => {
      try {
        const res = await fetch('https://blynk.cloud/external/api/get?token=-TTjeR-083F2bZTcW8FO8soQ6PJEw8xi&V0')
        const data = await res.text()
        const levelData = parseFloat(data)
        if (!isNaN(levelData)) {
          const now = new Date()
          const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          setCurrentWaterLevel(levelData)
          setWaterLevelData(prev => {
            const newArray = [...prev, { time: timeStr, level: levelData }]
            if (newArray.length > 20) return newArray.slice(newArray.length - 20)
            return newArray
          })

          // Auto-Escalate if critical
          if (levelData < 10) {
            triggerAutoEscalation('Water Tank', `CRITICAL LOW: Water level plummeted to ${levelData}%`)
          }
        }
      } catch (err) { console.error("Blynk fetch error:", err) }
    }
    fetchBlynk()
    const interval = setInterval(fetchBlynk, 3000)
    return () => clearInterval(interval)
  }, [isWaterExpanded])

  useEffect(() => {
    if (!isQualityExpanded) return
    const fetchQualityBlynk = async () => {
      try {
        const token = 'eTtvQMN4cS_BUF49XpDUI_pdWtVXlNnz'
        const baseUrl = `https://blynk.cloud/external/api/get?token=${token}`
        const pins = ['v0', 'v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8']

        const responses = await Promise.all(pins.map(pin => fetch(`${baseUrl}&${pin}`)))
        const values = await Promise.all(responses.map(res => res.text()))

        // Strip out any brackets/quotes just in case Blynk returns an array string like '["7.2"]' instead of '7.2'
        const parsedValues = values.map(val => parseFloat(val.replace(/[\[\]"]/g, '')) || 0)

        const [v0, v1, v2, v3, v4, v5, v6, v7, v8] = parsedValues

        const newQuality = {
          ph: v0, hardness: v1, solids: v2, chloramine: v3, sulfate: v4,
          conductivity: v5, organicCarbon: v6, thm: v7, turbidity: v8
        }
        setCurrentQuality(newQuality)

        const now = new Date()
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

        setQualityDataHistory(prev => {
          const newArray = [...prev, { time: timeStr, ph: v0, turbidity: v8, solids: v2 }]
          if (newArray.length > 20) return newArray.slice(newArray.length - 20)
          return newArray
        })

        // Auto-Escalate if critical
        if (v0 < 5.0 || v0 > 9.0) {
          triggerAutoEscalation('Water Quality', `CRITICAL pH: Detected severe pH imbalance at ${v0}`)
        }
      } catch (err) { console.error("Blynk quality fetch error:", err) }
    }
    fetchQualityBlynk()
    const interval = setInterval(fetchQualityBlynk, 5000)
    return () => clearInterval(interval)
  }, [isQualityExpanded])

  useEffect(() => {
    if (!isSolarExpanded) return
    const fetchSolarBlynk = async () => {
      try {
        const token = 'K8hLtUhm9nczMDy0Wa9NsAceBdhB-FhQ'
        const baseUrl = `https://blynk.cloud/external/api/get?token=${token}`
        const pins = ['v0', 'v1', 'v2', 'v3', 'v4']

        const responses = await Promise.all(pins.map(pin => fetch(`${baseUrl}&${pin}`)))
        const values = await Promise.all(responses.map(res => res.text()))

        const parsedValues = values.map(val => parseFloat(val.replace(/[\[\]"]/g, '')) || 0)

        const [v0, v1, v2, v3, v4] = parsedValues

        setCurrentSolar({
          battery: v0, grid: v1, voltage: v2, current: v3, power: v4
        })

        const now = new Date()
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

        setSolarDataHistory(prev => {
          const newArray = [...prev, { time: timeStr, power: v4, voltage: v2 }]
          if (newArray.length > 20) return newArray.slice(newArray.length - 20)
          return newArray
        })

        // Auto-Escalate if critical (e.g. battery dies or voltage drops aggressively)
        if (v0 < 15 && v1 === 0) {
          triggerAutoEscalation('Solar Grid', `CRITICAL POWER: Battery level critical (${v0}%) without grid supply!`)
        }
      } catch (err) { console.error("Blynk solar fetch error:", err) }
    }
    fetchSolarBlynk()
    const interval = setInterval(fetchSolarBlynk, 3500)
    return () => clearInterval(interval)
  }, [isSolarExpanded])

  const triggerAutoEscalation = async (componentName, desc) => {
    if (!inst) return;
    try {
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instituteId: inst._id,
          instituteName: inst.name,
          component: componentName,
          type: 'Auto',
          description: desc
        })
      })
    } catch (e) {
      console.error("Auto escalation failed", e)
    }
  }

  useEffect(() => {
    // Determine if it's our mock login via ID to seed properly
    const fetchInst = async () => {
      if (id.includes('mock') || id.includes('Alpha')) {
        setTimeout(() => {
          setInst({
            _id: id,
            name: id.includes('Alpha') ? 'Mock Govt School Alpha' : 'Mock District Health Centre',
            type: id.includes('Alpha') ? 'School' : 'Healthcare',

            waterQuality: { ph: 6.2, tds: 500, turbidity: 6.0, statusDesc: 'Low/Highly Turbid' },
            waterLevel: { level: 15, pumpStatus: 'Active', statusDesc: 'Critical Level' },
            solarGrid: { generation: 1, efficiency: 20, statusDesc: 'Critical: 20% efficiency' },
            battery: { level: 20, health: 'Replace Soon' },
            electricity: { isAvailable: false },
            powerCuts: { history: ['Yesterday 2PM'], frequency: 'Frequent' },
            infraClimate: { temp: 34, humidity: 70 },
            equipmentHealth: { medicineFridgeTemp: 9, statusDesc: 'Critical: Too Warm' }
          })
          setLoading(false)
        }, 500)
      } else {
        // Fetch actual institute from database if integrated
        try {
          const response = await fetch(`/api/institutes/${id}`)
          const data = await response.json()
          setInst(data)
        } catch (error) {
          console.error("Error fetching institute:", error)
        } finally {
          setLoading(false)
        }
      }
    }
    fetchInst()
  }, [id])

  const handleOpenReport = (componentName) => {
    setReportComponent(componentName)
    setIsModalOpen(true)
  }

  const submitReport = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instituteId: inst._id,
          instituteName: inst.name,
          component: reportComponent,
          type: 'Manual',
          description: reportDescription
        })
      })
      setIsModalOpen(false)
      setReportDescription('')
      alert('Issue reported successfully to the State Authority!')
    } catch (error) {
      console.error(error)
      alert('Failed to submit report.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── THEME TOKENS ──────────────────────────────────────────────────────────
  const t = {
    bg: isDark ? '#0f1117' : '#f0f2f7',
    surface: isDark ? '#1a1d27' : '#ffffff',
    surface2: isDark ? '#22263a' : '#f7f8fc',
    border: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
    text: isDark ? '#e8eaf0' : '#111827',
    textSec: isDark ? '#8892a4' : '#6b7280',
    textMuted: isDark ? '#5a6478' : '#9ca3af',
    accent: '#4f6ef7',
    accentBg: isDark ? 'rgba(79,110,247,0.15)' : 'rgba(79,110,247,0.08)',
    danger: '#ef4444',
    dangerBg: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.07)',
    success: '#10b981',
    successBg: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.07)',
    warn: '#f59e0b',
    warnBg: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.07)',
    shadow: isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.06)',
    shadowLg: isDark ? '0 12px 48px rgba(0,0,0,0.5)' : '0 12px 48px rgba(0,0,0,0.1)',
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: isDark ? '#0f1117' : '#f0f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 44, height: 44, border: `3px solid ${isDark ? '#2a2f45' : '#e2e8f0'}`, borderTopColor: '#4f6ef7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!inst) return (
    <div style={{ minHeight: '100vh', background: t.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: t.text }}>
      <ShieldAlert size={48} style={{ color: t.warn, marginBottom: 16 }} />
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Facility Data Unavailable</h2>
      <p style={{ color: t.textSec, marginBottom: 24 }}>We could not locate the infrastructure data for this facility.</p>
      <button
        onClick={() => navigate(-1)}
        style={{ padding: '10px 20px', borderRadius: 8, background: t.accent, color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
      >
        Return to Dashboard
      </button>
    </div>
  )

  const isStaff = user?.role === 'Staff'

  // ── SUB-COMPONENTS ────────────────────────────────────────────────────────
  const StatusPill = ({ isCritical, text }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px', borderRadius: 10,
      background: isCritical ? t.dangerBg : t.successBg,
      border: `1px solid ${isCritical ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
      marginBottom: 16
    }}>
      {isCritical
        ? <ShieldAlert size={14} style={{ color: t.danger, flexShrink: 0 }} />
        : <CheckCircle2 size={14} style={{ color: t.success, flexShrink: 0 }} />}
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: isCritical ? t.danger : t.success }}>
        {isCritical ? 'Critical' : 'Stable'}
      </span>
      <span style={{ fontSize: 12, color: t.textSec, marginLeft: 2 }}>{text}</span>
    </div>
  )

  const MetricRow = ({ label, value, accent }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 0', borderBottom: `1px solid ${t.border}`
    }}>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.textMuted }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: accent || t.text }}>{value}</span>
    </div>
  )

  const ReportBtn = ({ name, stopProp }) => isStaff ? (
    <button
      onClick={e => { if (stopProp) e.stopPropagation(); handleOpenReport(name) }}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
        background: t.dangerBg, color: t.danger,
        fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', transition: 'opacity 0.15s'
      }}
    >
      <AlertTriangle size={12} /> Report
    </button>
  ) : null

  const DataCard = ({ title, icon: Icon, iconColor, iconBg, statusDesc, isCritical, children }) => (
    <div style={{
      background: t.surface, borderRadius: 16, padding: 22,
      border: `1px solid ${t.border}`, boxShadow: t.shadow,
      display: 'flex', flexDirection: 'column', gap: 0
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={18} style={{ color: iconColor }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: t.text, letterSpacing: '0.01em' }}>{title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ReportBtn name={title} />
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, padding: 4 }}>
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>
      <StatusPill isCritical={isCritical} text={statusDesc} />
      <div>{children}</div>
    </div>
  )

  const miniSparkData = [
    { v: 30 }, { v: 45 }, { v: 38 }, { v: 55 }, { v: 42 },
    { v: inst.solarGrid.efficiency }, { v: inst.solarGrid.efficiency }
  ]

  return (
    <div style={{ minHeight: '100vh', background: t.bg, fontFamily: "'DM Sans','Segoe UI',sans-serif", color: t.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        input, textarea, button { font-family: inherit; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.2); border-radius: 2px; }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes ping    { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes fabGlow {
          0%,100% { box-shadow: 0 8px 32px rgba(79,110,247,0.4), 0 2px 8px rgba(0,0,0,0.12); }
          50%      { box-shadow: 0 8px 44px rgba(79,110,247,0.65), 0 2px 8px rgba(0,0,0,0.12); }
        }
        @keyframes fabGlowDark {
          0%,100% { box-shadow: 0 8px 32px rgba(79,110,247,0.3), 0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07); }
          50%      { box-shadow: 0 8px 44px rgba(79,110,247,0.5), 0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07); }
        }
        .card-anim { animation: fadeIn 0.35s ease both; }
        .nav-btn:hover { background: rgba(79,110,247,0.1) !important; color: #4f6ef7 !important; }
        .ai-fab { transition: transform 0.2s cubic-bezier(.4,0,.2,1) !important; }
        .ai-fab:hover { transform: translateY(-3px) scale(1.03) !important; }
        .ai-fab:active { transform: translateY(0) scale(0.97) !important; }
        textarea:focus { outline: none; box-shadow: 0 0 0 2px rgba(79,110,247,0.3); }
      `}</style>

      {/* ── TOP HEADER BAR ── */}
      <div style={{
        background: t.surface, borderBottom: `1px solid ${t.border}`,
        padding: '0 28px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => navigate(-1)}
            className="nav-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: `1px solid ${t.border}`, borderRadius: 9,
              padding: '6px 12px', cursor: 'pointer', color: t.textSec,
              fontSize: 12, fontWeight: 600, transition: 'all 0.15s'
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div style={{ width: 1, height: 22, background: t.border }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: t.text, lineHeight: 1.2 }}>{inst.name}</div>
            <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>Real-time IoT Telemetry</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700,
            background: inst.type === 'Healthcare' ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)',
            color: inst.type === 'Healthcare' ? '#3b82f6' : '#10b981',
            letterSpacing: '0.04em'
          }}>{inst.type}</span>

          <span style={{
            padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700,
            background: t.accentBg, color: t.accent, letterSpacing: '0.04em'
          }}>{inst.district} District</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 7, background: t.successBg }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.success, display: 'block', animation: 'ping 1.5s infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: t.success }}>Live</span>
          </div>

          {/* Dark / Light toggle */}
          <button
            onClick={() => setIsDark(p => !p)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: t.surface2, border: `1px solid ${t.border}`,
              borderRadius: 10, padding: '6px 12px', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, color: t.textSec, transition: 'all 0.2s'
            }}
          >
            {isDark ? <Sun size={14} style={{ color: '#f59e0b' }} /> : <Moon size={14} style={{ color: '#6366f1' }} />}
            {isDark ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 100px' }}>

        {/* ── SUMMARY METRIC BAR ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Solar Efficiency', value: `${inst.solarGrid.efficiency}%`, sub: `${inst.solarGrid.generation} kW generation`, icon: BatteryCharging, color: '#f59e0b', bg: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.1)', trend: inst.solarGrid.efficiency < 50 ? 'down' : 'up' },
            { label: 'Water Level', value: `${currentWaterLevel}%`, sub: inst.waterLevel.pumpStatus + ' pump', icon: Droplet, color: '#3b82f6', bg: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)', trend: currentWaterLevel < 30 ? 'down' : 'up' },
            { label: 'Battery Backup', value: `${inst.battery.level}%`, sub: inst.battery.health, icon: Power, color: '#8b5cf6', bg: isDark ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.1)', trend: inst.battery.level < 30 ? 'down' : 'up' },
            { label: 'Infra Temp', value: `${inst.infraClimate.temp}°C`, sub: `Humidity ${inst.infraClimate.humidity}%`, icon: ThermometerSun, color: '#ef4444', bg: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)', trend: inst.infraClimate.temp > 35 ? 'down' : 'up' },
          ].map((m, i) => (
            <div key={i} className="card-anim" style={{
              background: t.surface, borderRadius: 14, padding: '18px 20px',
              border: `1px solid ${t.border}`, boxShadow: t.shadow,
              animationDelay: `${i * 0.06}s`
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <m.icon size={18} style={{ color: m.color }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: m.trend === 'up' ? t.success : t.danger }}>
                  {m.trend === 'up' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  <span style={{ fontSize: 10, fontWeight: 700 }}>{m.trend === 'up' ? 'Normal' : 'Alert'}</span>
                </div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: t.text, lineHeight: 1, letterSpacing: '-0.02em' }}>{m.value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: t.textMuted, marginTop: 4 }}>{m.label}</div>
              <div style={{ fontSize: 11, color: t.textMuted, marginTop: 3, opacity: 0.7 }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* ── MAIN CARD GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>

          {/* SOLAR GRID */}
          {/* ── SOLAR GRID & BATTERY (expandable) ── */}
          <div
            className="card-anim"
            style={{
              background: t.surface, borderRadius: 16,
              border: isSolarExpanded ? `2px solid #f59e0b` : `1px solid ${t.border}`,
              boxShadow: isSolarExpanded ? t.shadowLg : t.shadow,
              gridColumn: isSolarExpanded ? 'span 3' : undefined,
              transition: 'all 0.4s cubic-bezier(.4,0,.2,1)',
              cursor: (!isSolarExpanded && isStaff) ? 'pointer' : 'default',
              padding: 22
            }}
            onClick={() => { if (!isSolarExpanded && isStaff) setIsSolarExpanded(true) }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BatteryCharging size={18} style={{ color: '#f59e0b' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>Solar Grid & Backup Battery</span>

                {isSolarExpanded && isStaff && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', background: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.08)', padding: '2px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Wifi size={11} /> Live Telemetry
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isSolarExpanded ? (
                  <button
                    onClick={e => { e.stopPropagation(); setIsSolarExpanded(false) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.border}`, background: 'none', color: t.textSec, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                  >
                    <X size={14} /> Close
                  </button>
                ) : (
                  <ReportBtn name="Solar Grid" stopProp />
                )}
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, padding: 4 }}>
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>

            <StatusPill
              isCritical={inst.solarGrid.efficiency < 50}
              text={inst.solarGrid.statusDesc}
            />

            {!isSolarExpanded ? (
              <div>
                <MetricRow label="Generation" value={`${inst.solarGrid.generation} kW`} />
                <MetricRow label="Efficiency" value={`${inst.solarGrid.efficiency}%`} accent={inst.solarGrid.efficiency < 50 ? t.danger : t.success} />
                {isStaff && (
                  <div style={{
                    marginTop: 14, padding: '10px 14px', borderRadius: 10,
                    background: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.08)', border: `1px solid rgba(245,158,11,0.2)`,
                    display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center'
                  }}>
                    <Activity size={14} style={{ color: '#f59e0b', animation: 'ping 1.5s infinite' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>Click to view Live IoT Telemetry</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 22, marginTop: 6 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                  {/* Wokwi iframe block */}
                  <div style={{ background: t.surface2, borderRadius: 14, padding: 18, border: `1px solid ${t.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 14 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.textMuted, marginBottom: 14, display: 'block' }}>Solar Array Sensors (ESP32)</span>
                      <span style={{ position: 'relative', top: -7, display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: t.success }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.success, animation: 'ping 1.5s infinite' }} /> Online
                      </span>
                    </div>
                    <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${t.border}` }}>
                      <iframe src="https://wokwi.com/projects/458496084647692289?view=diagram" width="100%" height="380px" style={{ border: 'none', display: 'block' }} title="Wokwi ESP32 Solar Grid" />
                    </div>
                  </div>

                  {/* Multi-line Recharts block */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                      <div style={{ background: t.surface2, padding: 12, borderRadius: 12, border: `1px solid ${t.border}` }}>
                        <div style={{ fontSize: 10, color: t.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Battery Level</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: currentSolar.battery < 20 ? t.danger : '#10b981' }}>{currentSolar.battery}%</div>
                      </div>
                      <div style={{ background: t.surface2, padding: 12, borderRadius: 12, border: `1px solid ${t.border}` }}>
                        <div style={{ fontSize: 10, color: t.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Grid Supply</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: currentSolar.grid > 0 ? '#3b82f6' : t.danger }}>{currentSolar.grid > 0 ? "Active" : "Down"}</div>
                      </div>
                      <div style={{ background: t.surface2, padding: 12, borderRadius: 12, border: `1px solid ${t.border}` }}>
                        <div style={{ fontSize: 10, color: t.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Solar Voltage</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#f59e0b' }}>{currentSolar.voltage} V</div>
                      </div>
                      <div style={{ background: t.surface2, padding: 12, borderRadius: 12, border: `1px solid ${t.border}` }}>
                        <div style={{ fontSize: 10, color: t.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Solar Current</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#06b6d4' }}>{currentSolar.current} A</div>
                      </div>
                      <div style={{ background: t.surface2, padding: 12, borderRadius: 12, border: `1px solid ${t.border}` }}>
                        <div style={{ fontSize: 10, color: t.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Solar Power</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#8b5cf6' }}>{currentSolar.power} W</div>
                      </div>
                    </div>

                    {/* Interactive Graph */}
                    <div style={{ flex: 1, background: t.surface, borderRadius: 12, padding: '14px 10px 10px', border: `1px solid ${t.border}`, minHeight: 220 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px 10px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase' }}>Live Array Plot</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', animation: 'ping 1s infinite' }}>POLLING PINS</span>
                      </div>
                      <ResponsiveContainer width="100%" height="85%">
                        <LineChart data={solarDataHistory}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                          <XAxis dataKey="time" tick={{ fontSize: 9, fill: t.textMuted }} tickLine={false} axisLine={false} minTickGap={20} />
                          <YAxis tick={{ fontSize: 9, fill: t.textMuted }} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, boxShadow: t.shadow, fontSize: 12 }} />

                          <Line type="monotone" name="Power (W)" dataKey="power" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                          <Line type="monotone" name="Voltage (V)" dataKey="voltage" stroke="#f59e0b" strokeWidth={3} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── WATER QUALITY (expandable) ── */}
          <div
            className="card-anim"
            style={{
              background: t.surface, borderRadius: 16,
              border: isQualityExpanded ? `2px solid ${t.accent}` : `1px solid ${t.border}`,
              boxShadow: isQualityExpanded ? t.shadowLg : t.shadow,
              gridColumn: isQualityExpanded ? 'span 3' : undefined,
              transition: 'all 0.4s cubic-bezier(.4,0,.2,1)',
              cursor: (!isQualityExpanded && isStaff) ? 'pointer' : 'default',
              padding: 22
            }}
            onClick={() => { if (!isQualityExpanded && isStaff) setIsQualityExpanded(true) }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: isDark ? 'rgba(6,182,212,0.15)' : 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Droplet size={18} style={{ color: '#06b6d4' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>Water Quality</span>

                {isQualityExpanded && isStaff && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: t.accent, background: t.accentBg, padding: '2px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Wifi size={11} /> Live Telemetry
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isQualityExpanded ? (
                  <button
                    onClick={e => { e.stopPropagation(); setIsQualityExpanded(false) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.border}`, background: 'none', color: t.textSec, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                  >
                    <X size={14} /> Close
                  </button>
                ) : (
                  <ReportBtn name="Water Quality" stopProp />
                )}
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, padding: 4 }}>
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>

            <StatusPill
              isCritical={currentQuality.ph < 5.0 || currentQuality.ph > 9.0}
              text={(currentQuality.ph < 5.0 || currentQuality.ph > 9.0) ? 'Critical: Severe Contamination Detected' : 'All 9 metrics registering optimal'}
            />

            {!isQualityExpanded ? (
              <div>
                <MetricRow label="pH Level" value={currentQuality.ph} accent={currentQuality.ph < 6.5 ? t.danger : t.success} />
                <MetricRow label="TDS / Solids" value={`${currentQuality.solids} ppm`} accent={currentQuality.solids > 300 ? t.warn : t.success} />
                <MetricRow label="Turbidity" value={`${currentQuality.turbidity} NTU`} accent={currentQuality.turbidity > 4 ? t.danger : t.success} />

                {isStaff && (
                  <div style={{
                    marginTop: 14, padding: '10px 14px', borderRadius: 10,
                    background: t.accentBg, border: `1px solid rgba(79,110,247,0.2)`,
                    display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center'
                  }}>
                    <Activity size={14} style={{ color: t.accent, animation: 'ping 1.5s infinite' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: t.accent }}>Click to view Live IoT Telemetry</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 22, marginTop: 6 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                  {/* Wokwi iframe block */}
                  <div style={{ background: t.surface2, borderRadius: 14, padding: 18, border: `1px solid ${t.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 14 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.textMuted, marginBottom: 14, display: 'block' }}>Quality Sensors (ESP32)</span>
                      <span style={{ position: 'relative', top: -7, display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: t.success }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.success, animation: 'ping 1.5s infinite' }} /> Online
                      </span>
                    </div>
                    <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${t.border}` }}>
                      <iframe src="https://wokwi.com/projects/458500393804670977?view=diagram" width="100%" height="380px" style={{ border: 'none', display: 'block' }} title="Wokwi ESP32" />
                    </div>
                  </div>

                  {/* 9-Parameter Grid block */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.textMuted }}>Live Telemetry Parameters</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: t.accent, animation: 'ping 1s infinite' }}>POLLING 9 PINS</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                      <div style={{ background: t.surface2, padding: 12, borderRadius: 12, border: `1px solid ${t.border}` }}>
                        <div style={{ fontSize: 10, color: t.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>pH Balance</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#06b6d4' }}>{currentQuality.ph}</div>
                      </div>
                      <div style={{ background: t.surface2, padding: 12, borderRadius: 12, border: `1px solid ${t.border}` }}>
                        <div style={{ fontSize: 10, color: t.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Turbidity</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#f59e0b' }}>{currentQuality.turbidity}</div>
                      </div>
                      <div style={{ background: t.surface2, padding: 12, borderRadius: 12, border: `1px solid ${t.border}` }}>
                        <div style={{ fontSize: 10, color: t.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Solids (TDS)</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#8b5cf6' }}>{currentQuality.solids}</div>
                      </div>
                      <div style={{ background: t.surface2, padding: 12, borderRadius: 12, border: `1px solid ${t.border}` }}>
                        <div style={{ fontSize: 10, color: t.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Hardness</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#10b981' }}>{currentQuality.hardness}</div>
                      </div>
                      <div style={{ background: t.surface2, padding: 12, borderRadius: 12, border: `1px solid ${t.border}` }}>
                        <div style={{ fontSize: 10, color: t.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Chloramine</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#ec4899' }}>{currentQuality.chloramine}</div>
                      </div>
                      <div style={{ background: t.surface2, padding: 12, borderRadius: 12, border: `1px solid ${t.border}` }}>
                        <div style={{ fontSize: 10, color: t.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Sulfate</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#3b82f6' }}>{currentQuality.sulfate}</div>
                      </div>
                      <div style={{ background: t.surface2, padding: 12, borderRadius: 12, border: `1px solid ${t.border}` }}>
                        <div style={{ fontSize: 10, color: t.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Conductivity</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#f97316' }}>{currentQuality.conductivity}</div>
                      </div>
                      <div style={{ background: t.surface2, padding: 12, borderRadius: 12, border: `1px solid ${t.border}` }}>
                        <div style={{ fontSize: 10, color: t.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Org. Carbon</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#14b8a6' }}>{currentQuality.organicCarbon}</div>
                      </div>
                      <div style={{ background: t.surface2, padding: 12, borderRadius: 12, border: `1px solid ${t.border}` }}>
                        <div style={{ fontSize: 10, color: t.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>THM</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#ef4444' }}>{currentQuality.thm}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div
            className="card-anim"
            style={{
              background: t.surface, borderRadius: 16,
              border: isWaterExpanded ? `2px solid ${t.accent}` : `1px solid ${t.border}`,
              boxShadow: isWaterExpanded ? t.shadowLg : t.shadow,
              gridColumn: isWaterExpanded ? 'span 3' : undefined,
              transition: 'all 0.4s cubic-bezier(.4,0,.2,1)',
              cursor: (!isWaterExpanded && isStaff) ? 'pointer' : 'default',
              padding: 22
            }}
            onClick={() => { if (!isWaterExpanded && isStaff) setIsWaterExpanded(true) }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Droplet size={18} style={{ color: '#3b82f6' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>Water Tank</span>

                {isWaterExpanded && isStaff && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: t.accent, background: t.accentBg, padding: '2px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Wifi size={11} /> Live Telemetry
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isWaterExpanded ? (
                  <button
                    onClick={e => { e.stopPropagation(); setIsWaterExpanded(false) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.border}`, background: 'none', color: t.textSec, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                  >
                    <X size={14} /> Close
                  </button>
                ) : (
                  <ReportBtn name="Water Tank" stopProp />
                )}
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, padding: 4 }}>
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>

            <StatusPill
              isCritical={currentWaterLevel < 30}
              text={currentWaterLevel < 30 ? 'Tank nearly empty. Immediate attention required.' : 'Operating at optimal capacity.'}
            />

            {!isWaterExpanded ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.textMuted }}>Current Level</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: t.text }}>{currentWaterLevel}%</span>
                </div>
                <div style={{ width: '100%', height: 8, background: t.surface2, borderRadius: 99, overflow: 'hidden', marginBottom: 14 }}>
                  <div style={{
                    height: '100%', borderRadius: 99,
                    width: `${currentWaterLevel}%`,
                    background: currentWaterLevel < 30 ? t.danger : t.accent,
                    transition: 'width 1s ease'
                  }} />
                </div>
                {isStaff && (
                  <div style={{
                    marginTop: 14, padding: '10px 14px', borderRadius: 10,
                    background: t.accentBg, border: `1px solid rgba(79,110,247,0.2)`,
                    display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center'
                  }}>
                    <Activity size={14} style={{ color: t.accent, animation: 'ping 1.5s infinite' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: t.accent }}>Click to view Live IoT Telemetry</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 22, marginTop: 6 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  {/* Wokwi simulation */}
                  <div style={{ background: t.surface2, borderRadius: 14, padding: 18, border: `1px solid ${t.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.textMuted }}>Live Hardware Simulation (ESP32)</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: t.success }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.success, animation: 'ping 1.5s infinite' }} />
                        Online
                      </span>
                    </div>
                    <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${t.border}` }}>
                      <iframe src="https://wokwi.com/projects/458494706884760577?view=diagram" width="100%" height="380px" style={{ border: 'none', display: 'block' }} title="Wokwi ESP32" />
                    </div>
                  </div>

                  {/* Live analytics */}
                  <div style={{ background: t.surface2, borderRadius: 14, padding: 18, border: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.textMuted }}>Real-time Level Analytics</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ position: 'relative', display: 'inline-flex' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.accent, opacity: 0.6, animation: 'ping 1s infinite', position: 'absolute' }} />
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.accent, display: 'block' }} />
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: t.accent, letterSpacing: '0.05em' }}>POLLING</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 20 }}>
                      <span style={{ fontSize: 52, fontWeight: 900, color: t.accent, lineHeight: 1, letterSpacing: '-0.03em' }}>{currentWaterLevel}</span>
                      <span style={{ fontSize: 20, fontWeight: 600, color: t.textMuted }}>%</span>
                    </div>

                    <div style={{ flex: 1, background: t.surface, borderRadius: 12, padding: '14px 10px 10px', border: `1px solid ${t.border}`, minHeight: 240 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={waterLevelData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                          <XAxis dataKey="time" tick={{ fontSize: 9, fill: t.textMuted }} tickLine={false} axisLine={false} minTickGap={20} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: t.textMuted }} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, boxShadow: t.shadow, fontSize: 12 }}
                            labelStyle={{ color: t.textSec, fontWeight: 700 }}
                            itemStyle={{ color: t.accent }}
                          />
                          <Line
                            type="monotone" dataKey="level" stroke={t.accent} strokeWidth={3}
                            dot={{ r: 3, fill: t.accent, stroke: t.surface, strokeWidth: 2 }}
                            activeDot={{ r: 5, fill: t.accent, stroke: t.surface, strokeWidth: 2 }}
                            animationDuration={300}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* INFRA CLIMATE */}
          <DataCard
            title="Infra Climate"
            icon={ThermometerSun}
            iconColor="#ec4899"
            iconBg={isDark ? 'rgba(236,72,153,0.15)' : 'rgba(236,72,153,0.1)'}
            statusDesc={`Local ambient: ${inst.infraClimate.temp}°C`}
            isCritical={inst.infraClimate.temp > 40}
          >
            <MetricRow label="Temperature" value={`${inst.infraClimate.temp}°C`} accent={inst.infraClimate.temp > 35 ? t.warn : t.success} />
            <MetricRow label="Humidity" value={`${inst.infraClimate.humidity}%`} accent={inst.infraClimate.humidity > 70 ? t.warn : t.success} />
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: t.textMuted }}>0°C</span>
                <span style={{ fontSize: 10, color: t.textMuted }}>50°C</span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: 'linear-gradient(90deg,#3b82f6,#10b981,#f59e0b,#ef4444)', position: 'relative' }}>
                <div style={{
                  position: 'absolute', top: '50%', transform: `translateX(-50%) translateY(-50%)`,
                  left: `${(inst.infraClimate.temp / 50) * 100}%`,
                  width: 12, height: 12, borderRadius: '50%', background: t.surface,
                  border: `2px solid ${t.warn}`, boxShadow: `0 0 6px ${t.warn}`
                }} />
              </div>
            </div>
          </DataCard>

          {/* COLD CHAIN (Healthcare only) */}
          {inst.type === 'Healthcare' && (
            <DataCard
              title="Cold Chain"
              icon={ThermometerSun}
              iconColor="#10b981"
              iconBg={isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)'}
              statusDesc={inst.equipmentHealth.statusDesc}
              isCritical={inst.equipmentHealth.medicineFridgeTemp > 8 || inst.equipmentHealth.medicineFridgeTemp < 2}
            >
              <div style={{ padding: 16, borderRadius: 12, background: t.surface2, border: `1px solid ${t.border}`, marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Medicine Fridge</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 36, fontWeight: 900, color: t.text, letterSpacing: '-0.02em' }}>{inst.equipmentHealth.medicineFridgeTemp}°C</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: t.dangerBg, color: t.danger }}>CRITICAL</span>
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: t.textMuted }}>Safe range: 2°C – 8°C</div>
              </div>
            </DataCard>
          )}

        </div>
      </div>

      {/* ── FLOATING AI RECOMMENDATION BUTTON ── */}
      {inst && (
        <button
          className="ai-fab"
          onClick={() => navigate('/AIChat', { state: { institute: inst } })}
          style={{
            position: 'fixed',
            bottom: 28,
            left: 28,
            zIndex: 90,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '13px 22px',
            borderRadius: 16,
            border: isDark ? '1px solid rgba(79,110,247,0.25)' : '1px solid rgba(79,110,247,0.15)',
            cursor: 'pointer',
            background: isDark
              ? 'linear-gradient(135deg, #1e2a4a 0%, #1a1d27 100%)'
              : 'linear-gradient(135deg, #4f6ef7 0%, #6d4ff7 100%)',
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.02em',
            animation: isDark ? 'fabGlowDark 3s ease-in-out infinite' : 'fabGlow 3s ease-in-out infinite',
          }}
        >
          {/* Pulsing dot */}
          <span style={{ position: 'relative', display: 'inline-flex', flexShrink: 0, width: 8, height: 8 }}>
            <span style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: isDark ? '#818cf8' : 'rgba(255,255,255,0.6)',
              animation: 'ping 1.5s infinite'
            }} />
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: isDark ? '#818cf8' : '#ffffff',
              display: 'block', position: 'relative'
            }} />
          </span>

          {/* Stars / sparkle icon */}
          <svg
            width="15" height="15" viewBox="0 0 24 24"
            fill="none" stroke={isDark ? '#a5b4fc' : '#ffffff'}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
            <path d="M20 3v4M22 5h-4" />
          </svg>

          <span style={{ color: isDark ? '#c7d2fe' : '#ffffff' }}>AI Recommendation</span>

          {/* Arrow */}
          <svg
            width="13" height="13" viewBox="0 0 24 24"
            fill="none" stroke={isDark ? '#818cf8' : '#ffffff'}
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ opacity: 0.7 }}
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* ── REPORT MODAL ── */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: t.surface, borderRadius: 20, padding: 28,
              width: '100%', maxWidth: 480, boxShadow: t.shadowLg,
              border: `1px solid ${t.border}`, animation: 'fadeIn 0.25s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>Report Issue</div>
                <div style={{ fontSize: 12, color: t.textMuted, marginTop: 3 }}>{reportComponent}</div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${t.border}`, background: 'none', cursor: 'pointer', color: t.textSec, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={submitReport}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: t.textSec, marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Description
              </label>
              <textarea
                required
                rows={4}
                style={{
                  width: '100%', padding: '12px 14px',
                  border: `1px solid ${t.border}`, borderRadius: 12,
                  background: t.surface2, color: t.text, fontSize: 13,
                  resize: 'none', marginBottom: 18, transition: 'box-shadow 0.15s'
                }}
                placeholder="Describe the issue — failure, damage, anomaly..."
                value={reportDescription}
                onChange={e => setReportDescription(e.target.value)}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%', padding: '13px',
                  background: isSubmitting ? t.textMuted : t.accent,
                  color: '#fff', border: 'none', borderRadius: 12,
                  fontSize: 13, fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.03em', transition: 'all 0.15s',
                  boxShadow: isSubmitting ? 'none' : '0 4px 16px rgba(79,110,247,0.35)'
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Official Report'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
