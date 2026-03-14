import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Droplet, BatteryCharging, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function InstituteDetail() {
  const { state } = useLocation()
  const navigate = useNavigate()
  
  const inst = state || {
    name: "Unknown Facility",
    waterQuality: 'Unknown',
    waterLevel: 0,
    solarHealth: 'Unknown'
  }

  // Helper bindings for UI coloring based on strict mock DB conditions defined
  const isWaterCritical = inst.waterQuality.includes('Low') || inst.waterQuality.includes('Turbid')
  const isSolarCritical = inst.solarHealth.includes('Critical')

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50 lg:px-8 pb-32">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 mb-8 text-sm font-medium text-gray-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft size={18} />
          Back to List
        </button>

        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{inst.name}</h1>
          <p className="mt-1 text-gray-500 text-lg">Live Hardware Telemetry</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Water Sensor Module */}
          <div className="p-8 bg-white border border-gray-100 shadow-sm rounded-3xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                <Droplet size={28} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Water Output</h2>
            </div>
            
            <div className={`p-4 border rounded-2xl mb-6 ${isWaterCritical && inst.isMock ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
              <div className="flex items-center gap-2 mb-1">
                {isWaterCritical && inst.isMock ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                <p className="font-bold uppercase tracking-wider text-xs">Quality Assessment</p>
              </div>
              <p className="text-lg font-semibold">{inst.waterQuality}</p>
            </div>

            <div>
              <div className="flex items-end justify-between mb-2">
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Tank Level</span>
                <span className="text-xl font-bold text-slate-800">{inst.waterLevel ?? 0}%</span>
              </div>
              <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${inst.waterLevel < 30 ? 'bg-orange-400' : 'bg-teal-500'}`} 
                  style={{ width: `${inst.waterLevel ?? 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Energy Sensor Module */}
          <div className="p-8 bg-white border border-gray-100 shadow-sm rounded-3xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <BatteryCharging size={28} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Solar Grid</h2>
            </div>
            
            <div className={`p-4 border rounded-2xl ${isSolarCritical && inst.isMock ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-gray-50 border-gray-200 text-slate-700'}`}>
               <div className="flex items-center gap-2 mb-1">
                {isSolarCritical && inst.isMock ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                <p className="font-bold uppercase tracking-wider text-xs">Panel Health Array</p>
              </div>
              <p className="text-lg font-semibold">{inst.solarHealth}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
