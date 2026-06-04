import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import {
  ArrowLeft, BatteryCharging, Power, ThermometerSun,
  AlertTriangle, CheckCircle2, ShieldAlert, X, Activity,
  Wifi, TrendingUp, TrendingDown, MoreHorizontal, MapPin
} from 'lucide-react'
import IoTMonitor from '../components/IoTMonitor'
import SolarForecast from './SolarForecast' 

// --- FUTURISTIC SVG PATTERN GENERATORS ---
const generateCircuitGrid = () => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.5"/>
      <circle cx="100" cy="100" r="2" fill="rgba(255,255,255,0.4)"/>
      <path d="M 20 20 L 80 20 L 80 80" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1" stroke-dasharray="4 4"/>
      <circle cx="20" cy="20" r="1.5" fill="rgba(255,255,255,0.3)"/>
      <circle cx="80" cy="80" r="1.5" fill="rgba(255,255,255,0.3)"/>
    </svg>
  `
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}")`
}

const generateContourLines = () => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <path d="M -50 100 Q 50 50 100 150 T 250 100" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
      <path d="M -50 120 Q 50 70 100 170 T 250 120" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
      <path d="M -50 140 Q 50 90 100 190 T 250 140" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
    </svg>
  `
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}")`
}

// --- REUSABLE GLASS & LAYOUT CLASSES ---
const glassCardClass = "bg-white/25 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.15)] rounded-3xl transition-all duration-300 hover:bg-white/35 hover:border-white/70 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)]"
// This forces exactly 3 cards per row with gap-8 (2rem) and automatically centers them if fewer exist.
const flexCardWidth = "w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.34rem)]" 

export default function InstituteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useUser()

  let [inst, setInst] = useState(location.state || null)
  const [loading, setLoading] = useState(!inst)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [reportComponent, setReportComponent] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSolarExpanded, setIsSolarExpanded] = useState(false)

  useEffect(() => {
    if (inst) return;
    const fetchInst = async () => {
      if (id.includes('mock') || id.includes('Alpha')) {
        setTimeout(() => {
          setInst({
            _id: id,
            district: 'Raigarh',
            name: id.includes('Alpha') ? 'Mock Govt School Alpha' : 'Mock District Health Centre',
            type: id.includes('Alpha') ? 'School' : 'Healthcare',
            solarGrid: { generation: 4.2, efficiency: 92, statusDesc: 'Optimal Output' },
            battery: { level: 95, health: 'Optimal' },
            electricity: { isAvailable: true },
            powerCuts: { history: ['Yesterday 2PM'], frequency: 'Rare' },
            infraClimate: { temp: 28, humidity: 45 },
            equipmentHealth: { medicineFridgeTemp: 4, statusDesc: 'Stable: In Range' }
          })
          setLoading(false)
        }, 500)
      } else {
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
  }, [id, inst])

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
        body: JSON.stringify({ instituteId: inst._id, instituteName: inst.name, component: reportComponent, type: 'Manual', description: reportDescription })
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    </div>
  )

  if (!inst) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800">
      <ShieldAlert size={48} className="text-amber-500 mb-4" />
      <h2 className="text-2xl font-bold mb-2">Facility Data Unavailable</h2>
      <p className="text-slate-500 mb-6">We could not locate the infrastructure data for this facility.</p>
      <button onClick={() => navigate(-1)} className="px-6 py-3 rounded-xl bg-purple-600 text-white font-bold">Return to Dashboard</button>
    </div>
  )

  inst = {
    ...inst,
    solarGrid: inst.solarGrid || { generation: inst.pvRating || 10, efficiency: 85, statusDesc: 'Stable' },
    battery: { ...inst.battery, level: 95, health: 'Optimal' },
    infraClimate: inst.infraClimate || { temp: 28, humidity: 45 },
    equipmentHealth: inst.equipmentHealth || { statusDesc: 'Stable', medicineFridgeTemp: 4 }
  }

  const isStaff = !!user

  // ── SUB-COMPONENTS ──
  const StatusPill = ({ isCritical, text }) => (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-4 border ${isCritical ? 'bg-red-500/20 border-red-500/30 text-red-700' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-800'}`}>
      {isCritical ? <ShieldAlert size={14} /> : <CheckCircle2 size={14} />}
      <span className="text-xs font-bold uppercase tracking-wider">{isCritical ? 'Critical' : 'Stable'}</span>
      <span className="text-xs ml-1 opacity-80">{text}</span>
    </div>
  )

  const MetricRow = ({ label, value, isAlert }) => (
    <div className="flex items-center justify-between py-3 border-b border-white/20 last:border-0">
      <span className="text-xs font-bold tracking-wider uppercase text-purple-950/60">{label}</span>
      <span className={`text-base font-extrabold ${isAlert ? 'text-red-600' : 'text-black'}`}>{value}</span>
    </div>
  )

  const ReportBtn = ({ name, stopProp }) => isStaff ? (
    <button onClick={e => { if (stopProp) e.stopPropagation(); handleOpenReport(name) }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 text-xs font-bold tracking-wide transition-colors">
      <AlertTriangle size={12} /> Report
    </button>
  ) : null

  return (
    <div className="relative min-h-screen overflow-hidden font-sans">
      {/* ── BACKGROUND ── */}
      <div className="absolute inset-0 -z-10" style={{ background: `linear-gradient(135deg, #7C3AED 0%, #A855F7 18%, #C084FC 35%, #D946EF 52%, #EC4899 72%, #F9A8D4 88%, #FFF7FC 100%)` }} />
      <div className="fixed top-[-10rem] left-[-10rem] w-[40rem] h-[40rem] rounded-full bg-violet-600/30 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10rem] right-[-10rem] w-[40rem] h-[40rem] rounded-full bg-fuchsia-600/30 blur-[150px] pointer-events-none" />

      {/* ── MAIN CONTENT ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 lg:px-8 pb-32">
        
        {/* Navigation */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-10 text-sm font-bold text-purple-950 hover:text-black transition-colors hover:scale-105 origin-left">
          <ArrowLeft size={18} strokeWidth={2.5} /> Back
        </button>

        {/* ── HERO HEADER ── */}
        <header className="text-center mb-16 flex flex-col items-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-white/30 backdrop-blur-md border border-white/50 text-purple-950 shadow-sm hover:scale-105 transition-transform">
              <MapPin size={14} /> {inst.district} District
            </span>
            <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-purple-600/10 backdrop-blur-md border border-purple-500/20 text-purple-900 shadow-sm hover:scale-105 transition-transform">
              {inst.type} Facility
            </span>
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 shadow-sm hover:scale-105 transition-transform">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-black uppercase tracking-widest text-emerald-700">Live Telemetry</span>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-950 via-fuchsia-950 to-pink-900 mb-4 text-center px-4 leading-tight capitalize">
            {inst.name}
          </h1>
          <p className="text-lg font-bold text-purple-950/70 max-w-2xl mx-auto">
            Real-Time Solar Infrastructure Monitoring & AI Climate Forecast
          </p>
        </header>

        {/* ── PREMIUM KPI CARDS (Flex Centered) ── */}
        <div className="flex flex-wrap justify-center gap-8 mb-12">
          {[
            { label: 'Solar Efficiency', value: `${inst.solarGrid.efficiency}%`, sub: `${inst.solarGrid.generation} kW generation`, icon: BatteryCharging, color: 'text-amber-600', bg: 'bg-amber-500/20', trend: inst.solarGrid.efficiency < 50 ? 'down' : 'up' },
            { label: 'Battery Backup', value: `${inst.battery.level}%`, sub: inst.battery.health, icon: Power, color: 'text-purple-600', bg: 'bg-purple-500/20', trend: inst.battery.level < 30 ? 'down' : 'up' },
            { label: 'Infra Temp', value: `${inst.infraClimate.temp}°C`, sub: `Humidity ${inst.infraClimate.humidity}%`, icon: ThermometerSun, color: 'text-pink-600', bg: 'bg-pink-500/20', trend: inst.infraClimate.temp > 35 ? 'down' : 'up' },
          ].map((m, i) => (
            <div key={i} className={`${flexCardWidth} ${glassCardClass} p-8 relative overflow-hidden group`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-14 h-14 rounded-2xl ${m.bg} flex items-center justify-center border border-white/30 backdrop-blur-md`}>
                    <m.icon size={28} className={m.color} />
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${m.trend === 'up' ? 'bg-emerald-500/20 text-emerald-800' : 'bg-red-500/20 text-red-800'}`}>
                    {m.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {m.trend === 'up' ? 'Normal' : 'Alert'}
                  </div>
                </div>
                <div className="text-5xl font-extrabold text-black tracking-tight mb-2">{m.value}</div>
                <div className="text-sm font-bold tracking-widest uppercase text-purple-950/60 mb-1">{m.label}</div>
                <div className="text-xs font-semibold text-purple-950/40">{m.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── TELEMETRY GRID (Flex Centered) ── */}
        <div className="flex flex-wrap justify-center gap-8 mb-16">
          
          {/* SOLAR GRID (Spans dynamically when expanded) */}
          <div
            className={`
              ${glassCardClass} p-8 relative overflow-hidden group cursor-pointer 
              ${isSolarExpanded 
                ? 'w-full border-amber-400/50 shadow-[0_0_40px_rgba(245,158,11,0.2)]' 
                : flexCardWidth
              }
            `}
            onClick={() => { if (!isSolarExpanded && isStaff) setIsSolarExpanded(true) }}
          >
            <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none" style={{ backgroundImage: generateCircuitGrid(), backgroundSize: '100px 100px' }} />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-white/30 backdrop-blur-md">
                    <BatteryCharging size={24} className="text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-black tracking-tight">Solar Grid Network</h3>
                    {isSolarExpanded && isStaff && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 mt-1">
                        <Wifi size={12} className="animate-pulse" /> Live Node Telemetry
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isSolarExpanded ? (
                    <button onClick={e => { e.stopPropagation(); setIsSolarExpanded(false) }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/40 hover:bg-white/60 text-black text-xs font-bold transition-colors">
                      <X size={14} /> Close Map
                    </button>
                  ) : (
                    <ReportBtn name="Solar Grid" stopProp />
                  )}
                  <button className="p-2 text-purple-950/60 hover:text-black transition-colors"><MoreHorizontal size={20} /></button>
                </div>
              </div>

              <StatusPill isCritical={inst.solarGrid.efficiency < 50} text={inst.solarGrid.statusDesc} />

              {!isSolarExpanded ? (
                <div className="flex-grow flex flex-col justify-end mt-4">
                  <MetricRow label="Active Generation" value={`${inst.solarGrid.generation} kW`} />
                  <MetricRow label="Node Efficiency" value={`${inst.solarGrid.efficiency}%`} isAlert={inst.solarGrid.efficiency < 50} />
                  {isStaff && (
                    <div className="mt-6 flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs font-bold tracking-wide">
                      <Activity size={14} className="animate-pulse" /> Click to map live IoT nodes
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-8 rounded-2xl overflow-hidden border border-white/30 bg-white/10 backdrop-blur-md h-[400px]">
                  <IoTMonitor />
                </div>
              )}
            </div>
          </div>

          {/* INFRA CLIMATE */}
          <div className={`${flexCardWidth} ${glassCardClass} p-8 relative overflow-hidden group`}>
            <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none" style={{ backgroundImage: generateContourLines(), backgroundSize: '200px 200px', backgroundPosition: 'center' }} />
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center border border-white/30 backdrop-blur-md">
                    <ThermometerSun size={24} className="text-pink-600" />
                  </div>
                  <h3 className="text-lg font-black text-black tracking-tight">Facility Climate</h3>
                </div>
                <div className="flex items-center gap-3">
                  <ReportBtn name="Climate" />
                  <button className="p-2 text-purple-950/60 hover:text-black transition-colors"><MoreHorizontal size={20} /></button>
                </div>
              </div>
              <StatusPill isCritical={inst.infraClimate.temp > 40} text={`Ambient: ${inst.infraClimate.temp}°C`} />
              <div className="flex-grow flex flex-col justify-end mt-4">
                <MetricRow label="Internal Temp" value={`${inst.infraClimate.temp}°C`} isAlert={inst.infraClimate.temp > 35} />
                <MetricRow label="Humidity Index" value={`${inst.infraClimate.humidity}%`} isAlert={inst.infraClimate.humidity > 70} />
              </div>
            </div>
          </div>

          {/* COLD CHAIN (Healthcare only) */}
          {inst.type === 'Healthcare' && (
            <div className={`${flexCardWidth} ${glassCardClass} p-8 relative overflow-hidden group`}>
              <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none" style={{ backgroundImage: generateCircuitGrid(), backgroundSize: '100px 100px', transform: 'rotate(180deg)' }} />
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-white/30 backdrop-blur-md">
                      <ThermometerSun size={24} className="text-emerald-700" />
                    </div>
                    <h3 className="text-lg font-black text-black tracking-tight">Cold Chain</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <ReportBtn name="Cold Chain" />
                    <button className="p-2 text-purple-950/60 hover:text-black transition-colors"><MoreHorizontal size={20} /></button>
                  </div>
                </div>
                <StatusPill isCritical={inst.equipmentHealth.medicineFridgeTemp > 8 || inst.equipmentHealth.medicineFridgeTemp < 2} text={inst.equipmentHealth.statusDesc} />
                <div className="flex-grow flex flex-col justify-end mt-4">
                  <div className="p-5 rounded-2xl bg-white/20 border border-white/40 backdrop-blur-md">
                    <div className="text-xs font-bold tracking-widest uppercase text-purple-950/60 mb-2">Medicine Storage</div>
                    <div className="flex items-end justify-between">
                      <span className="text-3xl font-extrabold text-black">{inst.equipmentHealth.medicineFridgeTemp}°C</span>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-500/20 text-red-800 border border-red-500/30">CRITICAL</span>
                    </div>
                    <div className="mt-3 text-xs font-semibold text-purple-950/50">Safe threshold: 2°C – 8°C</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── ML FORECAST COMPONENT ── */}
        <div className="mt-16">
           <SolarForecast district={inst.district} centre={inst.name} />
        </div>

      </div>

      {/* ── AI FLOATING BUTTON ── */}
      {inst && (
        <button
          className="fixed bottom-8 left-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl border border-white/50 bg-white/30 backdrop-blur-xl shadow-[0_8px_32px_rgba(124,58,237,0.3)] hover:bg-white/50 hover:scale-105 hover:-translate-y-1 transition-all duration-300 group"
          onClick={() => navigate('/AIChat', { state: { institute: inst } })}
        >
          <span className="relative flex w-3 h-3">
            <span className="absolute inline-flex w-full h-full rounded-full opacity-75 bg-purple-600 animate-ping" />
            <span className="relative inline-flex w-3 h-3 rounded-full bg-purple-700" />
          </span>
          <span className="text-sm font-black tracking-wide text-purple-950 uppercase">AI Copilot</span>
        </button>
      )}

      {/* ── REPORT MODAL ── */}
      {isModalOpen && (
        <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-purple-950/40 backdrop-blur-sm">
          <div onClick={e => e.stopPropagation()} className="w-full max-w-lg p-8 rounded-[2rem] bg-white/40 backdrop-blur-2xl border border-white/50 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-black">Report Anomaly</h3>
                <p className="text-sm font-bold text-purple-950/60 mt-1">{reportComponent} Module</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full bg-white/40 hover:bg-white/60 text-black transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={submitReport}>
              <label className="block text-xs font-black tracking-widest uppercase text-purple-950/60 mb-3">Incident Details</label>
              <textarea required rows={4} value={reportDescription} onChange={e => setReportDescription(e.target.value)} placeholder="Describe the hardware failure, damage, or metric anomaly..." className="w-full p-5 mb-6 rounded-2xl bg-white/30 border border-white/50 text-black font-medium placeholder-purple-950/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none" />
              <button type="submit" disabled={isSubmitting} className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-black uppercase tracking-widest shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100">
                {isSubmitting ? 'Transmitting...' : 'Submit Official Report'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}