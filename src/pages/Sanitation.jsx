import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, UploadCloud, CheckCircle2, ShieldCheck, Droplets, AlertTriangle } from 'lucide-react'

export default function Sanitation() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  // 'idle' | 'scanning' | 'complete' | 'error'
  const [scanState, setScanState] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // AI Response Data
  const [aiResult, setAiResult] = useState(null)

  // Checklists form states
  const [bacteriaChecked, setBacteriaChecked] = useState(false)
  const [soapChecked, setSoapChecked] = useState(false)

  const handleUploadClick = () => {
    if (scanState !== 'idle') return
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setScanState('scanning')
    setErrorMessage('')

    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await fetch('http://localhost:5000/api/sanitation/scan', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to analyze image.')

      const data = await response.json()
      setAiResult(data)
      setScanState('complete')

    } catch (error) {
      console.error("AI Scan Error:", error)
      setErrorMessage(error.message || "Network error. Is the backend running?")
      setScanState('error')
    }
  }

  const resetScan = () => {
    setScanState('idle')
    setAiResult(null)
    setErrorMessage('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

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
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

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
              <p className="mt-2 text-sm text-gray-500">Running GPT-4o Vision model</p>
            </div>
          )}

          {scanState === 'error' && (
            <div className="flex flex-col items-center justify-center w-full p-10 bg-white border border-red-200 shadow-sm rounded-3xl">
              <AlertTriangle size={48} className="mb-4 text-red-500" />
              <h3 className="text-xl font-bold text-slate-800">Analysis Failed</h3>
              <p className="mt-2 text-sm text-center text-red-600">{errorMessage}</p>
              <button onClick={resetScan} className="px-6 py-2 mt-6 font-semibold text-white bg-gray-800 rounded-lg hover:bg-gray-900">
                Try Again
              </button>
            </div>
          )}

          {scanState === 'complete' && aiResult && (
            <div className={`p-8 bg-white border shadow-lg rounded-3xl lg:p-10 border-t-8 ${aiResult.hygieneStatus.toLowerCase().includes('good') || aiResult.hygieneStatus.toLowerCase().includes('clean')
                ? 'border-t-green-500 border-green-200'
                : 'border-t-red-600 border-red-200 bg-red-50'
              }`}>
              <div className="flex items-start gap-5">
                <div className={`p-3 rounded-full shrink-0 ${aiResult.hygieneStatus.toLowerCase().includes('good') || aiResult.hygieneStatus.toLowerCase().includes('clean')
                    ? 'bg-green-100 text-green-600'
                    : 'bg-red-100 text-red-600'
                  }`}>
                  <AlertTriangle size={32} />
                </div>
                <div className="w-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-slate-900">Risk Profile</h3>
                  </div>

                  <div className="p-4 bg-white border shadow-sm rounded-xl mb-4">
                    <p className="text-xs font-bold tracking-wider text-gray-500 uppercase mb-1">General Hygiene Status</p>
                    <p className="text-lg font-semibold text-slate-800">{aiResult.hygieneStatus}</p>
                  </div>

                  <div className="p-4 bg-white border shadow-sm rounded-xl mb-4">
                    <p className="text-xs font-bold tracking-wider text-gray-500 uppercase mb-3">Visible Contaminants</p>
                    {aiResult.visibleContaminants && aiResult.visibleContaminants.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {aiResult.visibleContaminants.map((item, idx) => (
                          <span key={idx} className="px-3 py-1 text-sm font-medium text-amber-800 bg-amber-100 rounded-lg">
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">None detected.</p>
                    )}
                  </div>

                  <div className="p-4 bg-white border shadow-sm rounded-xl mb-6">
                    <p className="text-xs font-bold tracking-wider text-gray-500 uppercase mb-3">Potential Outbreaks</p>
                    {aiResult.potentialDiseases && aiResult.potentialDiseases.length > 0 ? (
                      <ul className="space-y-2">
                        {aiResult.potentialDiseases.map((disease, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm font-bold text-red-700">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></div>
                            {disease}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No immediate disease vectors identified.</p>
                    )}
                  </div>

                  <button onClick={resetScan} className="font-bold text-teal-600 hover:text-teal-700">
                    Scan another area
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Manual Verification Toggles */}


      </div>
    </div>
  )
}
