import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Droplet, Activity, AlertCircle, CheckCircle } from 'lucide-react'

export default function Water() {
  const navigate = useNavigate()

  // Form State
  const [level, setLevel] = useState('')
  const [turbidity, setTurbidity] = useState('')
  
  // Submission State
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitted(true)
  }

  // Hardcoded warning logic for the simulation
  const isDanger = parseFloat(turbidity) > 5.0 || parseFloat(level) < 2.0

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50 text-slate-900 lg:px-8">
      <div className="max-w-xl mx-auto">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="flex items-center gap-2 mb-8 text-sm font-medium text-gray-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Water Quality Check</h1>
          <p className="text-gray-500">Manual entry for local reservoirs</p>
        </header>

        {/* Input Form */}
        <div className="p-6 mb-8 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Water Level Input */}
            <div>
              <label htmlFor="level" className="block mb-2 text-sm font-semibold tracking-wider text-gray-500 uppercase">
                Water Level (Meters)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Droplet className="w-5 h-5 text-teal-400" />
                </div>
                <input 
                  type="number"
                  step="0.1"
                  readOnly={isSubmitted}
                  required
                  id="level"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  placeholder="e.g. 4.5"
                  className="w-full py-4 pl-12 pr-4 text-lg bg-gray-50 border border-gray-200 shadow-inner rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-800"
                />
              </div>
            </div>

            {/* Turbidity Input */}
            <div>
              <label htmlFor="turbidity" className="block mb-2 text-sm font-semibold tracking-wider text-gray-500 uppercase">
                Turbidity / Quality (NTU)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Activity className="w-5 h-5 text-teal-400" />
                </div>
                <input 
                  type="number"
                  step="0.1"
                  readOnly={isSubmitted}
                  required
                  id="turbidity"
                  value={turbidity}
                  onChange={(e) => setTurbidity(e.target.value)}
                  placeholder="e.g. 2.1 (Must be < 5.0)"
                  className="w-full py-4 pl-12 pr-4 text-lg bg-gray-50 border border-gray-200 shadow-inner rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-800"
                />
              </div>
            </div>

            {!isSubmitted ? (
              <button 
                type="submit"
                className="w-full py-4 mt-4 font-bold text-white transition-colors bg-teal-600 rounded-xl hover:bg-teal-700 active:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-500/30"
              >
                Submit Data
              </button>
            ) : (
              <button 
                type="button"
                onClick={() => {
                  setIsSubmitted(false)
                  setLevel('')
                  setTurbidity('')
                }}
                className="w-full py-4 mt-4 font-bold transition-colors bg-gray-100 text-slate-600 rounded-xl hover:bg-gray-200"
              >
                Clear & Reset
              </button>
            )}
          </form>
        </div>

        {/* Simulated Warning Modal / Alert Banner */}
        {isSubmitted && (
          <div className="animate-fade-in">
            {isDanger ? (
               <div className="flex items-start gap-4 p-5 text-red-900 bg-red-100 border border-red-200 shadow-sm rounded-xl">
                 <AlertCircle size={24} className="shrink-0 text-red-600 mt-0.5" />
                 <div>
                   <h3 className="text-lg font-bold tracking-tight">WATER UNFIT FOR CONSUMPTION</h3>
                   <p className="mt-1 text-sm leading-relaxed text-red-800">
                     The entered metrics indicate potentially dangerous water quality or critically low levels. 
                     Do not drink this water without boiling. A notification has been sent to district authorities.
                   </p>
                 </div>
               </div>
            ) : (
               <div className="flex items-start gap-4 p-5 text-green-900 bg-green-100 border border-green-200 shadow-sm rounded-xl">
                 <CheckCircle size={24} className="shrink-0 text-green-600 mt-0.5" />
                 <div>
                   <h3 className="text-lg font-bold tracking-tight">WATER SAFE FOR CONSUMPTION</h3>
                   <p className="mt-1 text-sm leading-relaxed text-green-800">
                     Metrics are within standard operational parameters. Thank you for reporting.
                   </p>
                 </div>
               </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
