import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sun, BatteryFull, Zap, AlertTriangle } from 'lucide-react'

export default function Energy() {
  const navigate = useNavigate()

  // Hardware Mock Data
  const solarGeneration = 2.4 // kWh
  const batteryHealth = 85 // %
  
  // Warning Threshold Logic
  const showGenerationAlert = solarGeneration < 3.0

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50 lg:px-8">
      <div className="max-w-xl mx-auto">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="flex items-center gap-2 mb-8 text-sm font-medium text-gray-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Energy & Power</h1>
          <p className="mt-1 text-gray-500">Live hardware monitoring</p>
        </header>

        {/* Warning Banners */}
        {showGenerationAlert && (
          <div className="flex items-start gap-4 p-5 mb-8 text-amber-900 bg-amber-100 border border-amber-200 shadow-sm rounded-xl">
            <AlertTriangle size={24} className="shrink-0 text-amber-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold tracking-tight">Attention Required</h3>
              <p className="mt-1 text-sm text-amber-800">
                Current solar generation ({solarGeneration} kWh) is below the minimum daily target. Switch to power conservation mode.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Card 1: Solar Generation */}
          <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl">
                  <Sun size={24} />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Solar Generation</h2>
              </div>
              <span className="text-2xl font-black text-slate-900">{solarGeneration} <span className="text-sm font-medium text-gray-400">kWh</span></span>
            </div>
            
            <div className="relative h-4 mt-6 overflow-hidden bg-gray-100 rounded-full">
              <div 
                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${showGenerationAlert ? 'bg-amber-500' : 'bg-green-500'}`}
                style={{ width: `${(solarGeneration / 5.0) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 text-xs font-semibold text-gray-400 uppercase">
              <span>0</span>
              <span>Target: 3.0</span>
              <span>5.0 kWh</span>
            </div>
          </div>

          {/* Card 2: Battery Health */}
          <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                  <BatteryFull size={24} />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Battery Health</h2>
              </div>
              <span className="text-2xl font-black text-slate-900">{batteryHealth}%</span>
            </div>
            
            <div className="relative h-4 mt-6 overflow-hidden bg-gray-100 rounded-full">
              <div 
                className="absolute top-0 left-0 h-full transition-all duration-1000 rounded-full bg-teal-500"
                style={{ width: `${batteryHealth}%` }}
              ></div>
            </div>
             <div className="flex justify-between mt-2 text-xs font-semibold text-gray-400 uppercase">
              <span>Critical</span>
              <span>Degraded</span>
              <span>Optimal</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl">
               <Zap className="text-purple-500" size={24} />
               <div>
                 <p className="text-xs font-semibold tracking-wider text-gray-400">DRAW</p>
                 <p className="font-semibold text-slate-800">1.2 kW</p>
               </div>
             </div>
             <div className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl">
               <Activity className="text-sky-500" size={24} />
               <div>
                 <p className="text-xs font-semibold tracking-wider text-gray-400">STATUS</p>
                 <p className="font-semibold text-slate-800">Online</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
