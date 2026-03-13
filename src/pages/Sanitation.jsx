import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, UploadCloud, CheckCircle2, ShieldCheck, Droplets } from 'lucide-react'

export default function Sanitation() {
  const navigate = useNavigate()
  
  // 'idle' | 'scanning' | 'complete'
  const [scanState, setScanState] = useState('idle')

  // Checklists form states
  const [bacteriaChecked, setBacteriaChecked] = useState(false)
  const [soapChecked, setSoapChecked] = useState(false)

  const handleUploadClick = () => {
    if (scanState !== 'idle') return
    
    setScanState('scanning')
    // Simulate a 2.5 second AI network request latency
    setTimeout(() => {
      setScanState('complete')
    }, 2500)
  }

  const resetScan = () => setScanState('idle')

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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sanitation Inspection</h1>
          <p className="mt-1 text-gray-500">Facility AI quality assurance</p>
        </header>

        {/* AI Upload Zone Main Component */}
        <div className="mb-8">
          {scanState === 'idle' && (
            <button 
              onClick={handleUploadClick}
              className="flex flex-col items-center justify-center w-full p-10 transition-colors bg-white border-2 border-dashed border-sky-200 rounded-3xl hover:bg-sky-50 active:scale-[0.98]"
            >
              <div className="p-4 mb-4 rounded-full bg-sky-100 text-sky-600">
                <Camera size={32} />
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-800">Tap to Scan Washroom</h3>
              <p className="text-sm text-center text-gray-500">
                Take a photo or upload from gallery
              </p>
              <div className="flex items-center gap-2 mt-6 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                <UploadCloud size={16} /> Drag & Drop Supported
              </div>
            </button>
          )}

          {scanState === 'scanning' && (
            <div className="flex flex-col items-center justify-center w-full p-16 bg-white border border-gray-100 shadow-sm rounded-3xl animate-pulse">
              <div className="w-16 h-16 mb-6 border-4 border-gray-200 rounded-full border-t-blue-600 animate-spin"></div>
              <h3 className="text-xl font-bold text-slate-800">Analyzing Photo...</h3>
              <p className="mt-2 text-sm text-gray-500">Running computer vision models</p>
            </div>
          )}

          {scanState === 'complete' && (
            <div className="p-8 bg-white border border-green-200 shadow-lg rounded-3xl lg:p-10 border-t-8 border-t-green-500">
              <div className="flex items-start gap-5">
                <div className="p-3 bg-green-100 rounded-full shrink-0 text-green-600">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">AI Hygiene Assessment: <span className="text-green-600">Clean</span></h3>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    No major issues detected in the visual analysis. Standard hygiene parameters met.
                  </p>
                  <button onClick={resetScan} className="mt-5 font-bold text-teal-600 hover:text-teal-700">
                    Scan another room
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Manual Verification Toggles */}
        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-3xl">
          <h2 className="mb-6 text-sm font-bold tracking-wider text-gray-400 uppercase">Manual Verification</h2>
          
          <div className="space-y-4">
            {/* Toggle 1: Bacteria */}
            <div className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="p-2 text-orange-600 bg-orange-100 rounded-lg">
                  <ShieldCheck size={24} />
                </div>
                <div>
                   <p className="font-semibold text-slate-800">Bacteria Present?</p>
                   <p className="text-xs text-gray-500">Visual mold/dirt check</p>
                </div>
              </div>
              <button 
                onClick={() => setBacteriaChecked(!bacteriaChecked)}
                className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${bacteriaChecked ? 'bg-red-500' : 'bg-gray-200'}`}
              >
                <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${bacteriaChecked ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Toggle 2: Soap */}
            <div className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="p-2 text-teal-600 bg-teal-100 rounded-lg">
                  <Droplets size={24} />
                </div>
                <div>
                   <p className="font-semibold text-slate-800">Soap Available?</p>
                   <p className="text-xs text-gray-500">Check dispenser status</p>
                </div>
              </div>
              <button 
                onClick={() => setSoapChecked(!soapChecked)}
                className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${soapChecked ? 'bg-green-500' : 'bg-gray-200'}`}
              >
                <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${soapChecked ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
