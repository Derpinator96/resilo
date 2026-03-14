import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, Droplet, BatteryCharging, Power, ThermometerSun, AlertTriangle, CheckCircle2, ShieldAlert, X, Activity } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function InstituteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [inst, setInst] = useState(null)
  const [loading, setLoading] = useState(true)

  // Report Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [reportComponent, setReportComponent] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Interactive Water Tank State
  const [isWaterExpanded, setIsWaterExpanded] = useState(false)
  const [waterLevelData, setWaterLevelData] = useState([])
  const [currentWaterLevel, setCurrentWaterLevel] = useState(0)

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
        }
      } catch (err) {
        console.error("Blynk fetch error:", err)
      }
    }

    fetchBlynk()
    const interval = setInterval(fetchBlynk, 3000)
    return () => clearInterval(interval)
  }, [isWaterExpanded])

  // Fetch full IoT Institute Document
  useEffect(() => {
    // For demonstration, if ID starts with 'mock', we'll simulate the fetched document
    // In production, this would be: fetch(`/api/institutes/${id}`)
    setTimeout(() => {
      setInst({
        _id: id,
        name: id.includes('Alpha') ? 'Mock Govt School Alpha' : 'Mock District Health Centre',
        type: id.includes('Alpha') ? 'School' : 'Healthcare',
        district: 'Balod',
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
  }, [id])

  const handleOpenReport = (componentName) => {
    setReportComponent(componentName)
    setIsModalOpen(true)
  }

  const submitReport = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await fetch('http://localhost:5000/api/reports', {
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

  if (loading || !inst) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-indigo-200 rounded-full border-t-indigo-600 animate-spin"></div>
      </div>
    )
  }

  const isStaff = user?.role === 'Staff'

  // Component Card Wrapper
  const DataCard = ({ title, icon: Icon, colorClass, statusDesc, isCritical, children }) => (
    <div className="relative flex flex-col justify-between p-6 bg-white shadow-xl shadow-slate-200/50 rounded-3xl animate-fade-in border border-slate-100">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${colorClass}`}>
              <Icon size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          </div>
          {isStaff && (
            <button
              onClick={() => handleOpenReport(title)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors"
            >
              <AlertTriangle size={14} /> Report Issue
            </button>
          )}
        </div>

        <div className={`p-4 border rounded-2xl mb-6 ${isCritical ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
          <div className="flex items-center gap-2 mb-1">
            {isCritical ? <ShieldAlert size={18} /> : <CheckCircle2 size={18} />}
            <span className="text-xs font-bold tracking-wider uppercase">System Status</span>
          </div>
          <p className="font-semibold">{statusDesc}</p>
        </div>

        <div className="space-y-4">
          {children}
        </div>
      </div>
    </div>
  )

  const MetricRow = ({ label, value }) => (
    <div className="flex items-center justify-between pb-2 border-b border-dashed border-slate-100 last:border-0 last:pb-0">
      <span className="text-sm font-semibold text-slate-500 uppercase">{label}</span>
      <span className="text-lg font-bold text-slate-800">{value}</span>
    </div>
  )

  return (
    <div className="min-h-screen px-4 py-8 lg:px-8 pb-32">
      <div className="max-w-6xl mx-auto">

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-8 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={18} /> BACK TO DISTRICT LIST
        </button>

        <header className="mb-10 animate-slide-up">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={`px-3 py-1 text-xs font-bold uppercase rounded-lg ${inst.type === 'Healthcare' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>
              {inst.type} Facility
            </span>
            <span className="px-3 py-1 text-xs font-bold text-indigo-700 uppercase bg-indigo-100 rounded-lg">
              {inst.district} District
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">{inst.name}</h1>
          <p className="mt-2 text-lg text-slate-500">Real-time IoT Telemetry & Analytics</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          <DataCard
            title="Solar Grid"
            icon={BatteryCharging}
            colorClass="bg-amber-100 text-amber-600"
            statusDesc={inst.solarGrid.statusDesc}
            isCritical={inst.solarGrid.efficiency < 50}
          >
            <MetricRow label="Generation" value={`${inst.solarGrid.generation} kW`} />
            <MetricRow label="Efficiency" value={`${inst.solarGrid.efficiency}%`} />
          </DataCard>

          <DataCard
            title="Water Quality"
            icon={Droplet}
            colorClass="bg-cyan-100 text-cyan-600"
            statusDesc={inst.waterQuality.statusDesc}
            isCritical={inst.waterQuality.statusDesc.includes('Turbid') || inst.waterQuality.statusDesc.includes('Low')}
          >
            <MetricRow label="pH Level" value={inst.waterQuality.ph} />
            <MetricRow label="TDS" value={`${inst.waterQuality.tds} ppm`} />
            <MetricRow label="Turbidity" value={`${inst.waterQuality.turbidity} NTU`} />
          </DataCard>

          {/* Water Tank Interactive Module */}
          <div className={`transition-all duration-500 ease-in-out ${isWaterExpanded ? 'md:col-span-2 lg:col-span-3 bg-white shadow-2xl rounded-3xl p-6 border-2 border-indigo-100' : 'bg-white shadow-xl shadow-slate-200/50 rounded-3xl p-6 border border-slate-100 cursor-pointer hover:shadow-2xl hover:-translate-y-1'} animate-fade-in`} onClick={() => !isWaterExpanded && setIsWaterExpanded(true)}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-blue-100 text-blue-600">
                  <Droplet size={24} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Water Tank</h2>
              </div>
              <div className="flex items-center gap-3">
                {isWaterExpanded && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsWaterExpanded(false); }}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors flex items-center gap-2 text-sm font-bold pr-4"
                  >
                    <X size={20} /> Close Telemetry
                  </button>
                )}
                {isStaff && !isWaterExpanded && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleOpenReport("Water Tank"); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors"
                  >
                    <AlertTriangle size={14} /> Report Issue
                  </button>
                )}
              </div>
            </div>

            <div className={`p-4 border rounded-2xl mb-6 ${currentWaterLevel < 30 ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
              <div className="flex items-center gap-2 mb-1">
                {currentWaterLevel < 30 ? <ShieldAlert size={18} /> : <CheckCircle2 size={18} />}
                <span className="text-xs font-bold tracking-wider uppercase">System Status</span>
              </div>
              <p className="font-semibold text-sm">{currentWaterLevel < 30 ? 'Critical Level: Water tank is nearly empty. Immediate attention required.' : 'Stable: Water tank is currently operating at optimal capacity.'}</p>
            </div>

            {!isWaterExpanded ? (
              <div className="space-y-4">
                <MetricRow label="Current Level" value={`${currentWaterLevel}%`} />
                <div className="w-full h-3 mt-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${currentWaterLevel < 30 ? 'bg-rose-500' : 'bg-blue-500'}`}
                    style={{ width: `${currentWaterLevel}%` }}
                  ></div>
                </div>
                <div className="mt-6 flex justify-center">
                  <p className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl">
                    <Activity size={16} className="animate-pulse" /> Click to view Live IoT Telemetry
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-8 animate-fade-in border-t border-slate-100 pt-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                    <Activity size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Live IoT Telemetry Panel</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Wokwi Circuit */}
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200">
                    <h4 className="text-sm font-bold tracking-wider text-slate-500 uppercase mb-4 flex items-center justify-between">
                      Live Hardware Simulation (ESP32)
                      <span className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        System Online
                      </span>
                    </h4>
                    <div className="w-full rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white">
                      <iframe src="https://wokwi.com/projects/458494706884760577" width="100%" height="400px" style={{ border: 'none', borderRadius: '12px' }}></iframe>
                    </div>
                  </div>

                  {/* Right Column: Live Graph & Analytics */}
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-sm font-bold tracking-wider text-slate-500 uppercase">Real-time Level Analytics</h4>
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                        </span>
                        <span className="text-xs font-bold text-indigo-600 uppercase">Polling Blynk API</span>
                      </div>
                    </div>

                    <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-6xl font-black text-indigo-600 tracking-tighter">{currentWaterLevel}</span>
                      <span className="text-2xl font-bold text-slate-400">%</span>
                    </div>

                    <div className="flex-grow w-full h-[250px] bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={waterLevelData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} minTickGap={20} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                            labelStyle={{ color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}
                          />
                          <Line type="monotone" dataKey="level" stroke="#4f46e5" strokeWidth={4} dot={{ r: 3, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }} animationDuration={300} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DataCard
            title="Mains Electricity"
            icon={Power}
            colorClass="bg-yellow-100 text-yellow-600"
            statusDesc={inst.electricity.isAvailable ? 'Grid Power Active' : 'Disconnected from Mains'}
            isCritical={!inst.electricity.isAvailable}
          >
            <MetricRow label="Battery Backup" value={`${inst.battery.level}%`} />
            <MetricRow label="Outage Temp" value={inst.powerCuts.frequency} />
          </DataCard>

          <DataCard
            title="Infra Climate"
            icon={ThermometerSun}
            colorClass="bg-fuchsia-100 text-fuchsia-600"
            statusDesc={`Local ambient conditions: ${inst.infraClimate.temp}°C`}
            isCritical={inst.infraClimate.temp > 40}
          >
            <MetricRow label="Temperature" value={`${inst.infraClimate.temp}°C`} />
            <MetricRow label="Humidity" value={`${inst.infraClimate.humidity}%`} />
          </DataCard>

          {inst.type === 'Healthcare' && (
            <DataCard
              title="Cold Chain"
              icon={ThermometerSun}
              colorClass="bg-emerald-100 text-emerald-600"
              statusDesc={inst.equipmentHealth.statusDesc}
              isCritical={inst.equipmentHealth.medicineFridgeTemp > 8 || inst.equipmentHealth.medicineFridgeTemp < 2}
            >
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-sm font-medium text-slate-500 mb-2">Internal Medicine Fridge Tracker</p>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-black text-slate-800">{inst.equipmentHealth.medicineFridgeTemp}°C</span>
                  <span className="text-xs font-bold text-emerald-600 uppercase">Live</span>
                </div>
              </div>
            </DataCard>
          )}

        </div>
      </div>

      {/* Manual Report Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg p-6 bg-white shadow-2xl rounded-3xl animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Report Issue: {reportComponent}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitReport}>
              <div className="mb-6">
                <label className="block mb-2 text-sm font-bold text-slate-700">Detailed Description</label>
                <textarea
                  required
                  rows={4}
                  className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                  placeholder="Explain the component failure, strange noises, visible damage, etc..."
                  value={reportDescription}
                  onChange={e => setReportDescription(e.target.value)}
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 text-lg font-bold text-white transition-all bg-indigo-600 shadow-lg rounded-2xl hover:bg-indigo-700 hover:shadow-indigo-500/30 disabled:opacity-50"
              >
                {isSubmitting ? 'Sending to Authority...' : 'Submit Official Report'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
