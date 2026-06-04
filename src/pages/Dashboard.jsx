import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, ChevronDown, Check } from 'lucide-react'

// --- CONSTANTS ---
const districtCoords = {
  "Balod": [20.73, 81.20], "Baloda Bazar": [21.65, 82.16], "Balrampur": [23.62, 83.61],
  "Bastar": [19.07, 81.95], "Bemetara": [21.71, 81.53], "Bijapur": [18.79, 80.82],
  "Bilaspur": [22.08, 82.14], "Dantewada": [18.90, 81.35], "Dhamtari": [20.71, 81.55],
  "Durg": [21.19, 81.28], "Gariaband": [20.63, 82.06], "Gaurela Pendra Marwahi": [22.78, 81.90],
  "Janjgir-Champa": [22.01, 82.58], "Jashpur": [22.89, 84.14], "Kabirdham": [22.01, 81.25],
  "Kanker": [20.27, 81.49], "Kondagaon": [19.59, 81.66], "Korba": [22.36, 82.75],
  "Koriya": [23.26, 82.55], "Mahasamund": [21.11, 82.10], "Manendragarh-Chirmiri-Bharatpur": [23.20, 82.35],
  "Mohla-Manpur-Ambagarh Chowki": [20.70, 80.75], "Mungeli": [22.06, 81.68], "Narayanpur": [19.72, 81.25],
  "Raigarh": [21.89, 83.39], "Raipur": [21.25, 81.63], "Rajnandgaon": [21.10, 81.03],
  "Sakti": [22.03, 82.96], "Sarangarh-Bilaigarh": [21.58, 83.08], "Sukma": [18.39, 81.66],
  "Surajpur": [23.22, 82.87], "Surguja": [23.12, 83.19], "Khairagarh-Chhuikhadan-Gandai": [21.42, 81.05]
}

const MeshBackground = () => (
  <>
    <div className="fixed inset-0 z-0 bg-slate-50 pointer-events-none" />
    <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-200/50 rounded-full blur-[120px] pointer-events-none z-0" />
    <div className="fixed bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-cyan-200/30 rounded-full blur-[150px] pointer-events-none z-0" />
    <div className="fixed top-[40%] left-[20%] w-[40vw] h-[40vw] bg-blue-100/40 rounded-full blur-[100px] pointer-events-none z-0" />
  </>
)

export default function Dashboard() {
  const [districts, setDistricts] = useState([])
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  
  useEffect(() => {
    fetch('/api/districts')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) setDistricts(data)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const coords = districtCoords[selectedDistrict]
  const mapSrc = coords
    ? `https://embed.windy.com/embed2.html?lat=${coords[0]}&lon=${coords[1]}&zoom=11&level=surface&overlay=rain`
    : null

  const handleDistrictSelect = (district) => {
    setSelectedDistrict(district)
    setIsOpen(false)
    // Instantly route the user to the list of centres for this district
    navigate(`/list/${district}/Solar Centre`) 
  }

  return (
    <div className="relative min-h-screen px-4 py-8 overflow-hidden lg:px-8 pb-32">
      <MeshBackground />

      <div className="relative z-10 max-w-6xl mx-auto py-16">
        <header className="text-center mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center px-4 py-1.5 mb-8 text-[11px] font-black uppercase tracking-[0.25em] text-blue-800 bg-white/60 backdrop-blur-md border border-blue-100 rounded-full shadow-sm">
             Climatathon 2024
          </div>
          <h1 className="text-5xl lg:text-8xl font-extrabold tracking-tight text-slate-900 mb-6 leading-none">
            Global <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Dashboard</span>
          </h1>
          <p className="max-w-xl mx-auto text-lg text-slate-500 font-medium">
            Strategic infrastructure surveillance and climate risk intelligence for Chhattisgarh.
          </p>

          {/* District Selector */}
          <div className="mt-14 max-w-md mx-auto relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full flex items-center justify-between py-6 px-10 text-xl font-bold bg-white/70 backdrop-blur-lg border border-white shadow-xl shadow-blue-900/5 rounded-[2.5rem] focus:outline-none hover:bg-white hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/15 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <MapPin className={`w-6 h-6 ${selectedDistrict ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className={selectedDistrict ? 'text-slate-800' : 'text-slate-400'}>
                  {selectedDistrict || "Select District"}
                </span>
              </div>
              <ChevronDown className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            <div className={`absolute z-50 top-full left-0 w-full mt-4 bg-white/90 backdrop-blur-xl border border-white/80 shadow-2xl shadow-blue-900/10 rounded-[2.5rem] overflow-hidden transition-all duration-300 origin-top ${isOpen ? 'opacity-100 scale-y-100 visible' : 'opacity-0 scale-y-95 invisible'}`}>
              <div className="max-h-[320px] overflow-y-auto p-3 custom-scrollbar">
                {districts.map((district) => (
                  <button
                    key={district}
                    onClick={() => handleDistrictSelect(district)}
                    className="w-full flex items-center justify-between px-7 py-4 text-left text-slate-600 font-bold hover:bg-blue-50 hover:text-blue-700 rounded-2xl transition-all"
                  >
                    {district}
                    {selectedDistrict === district && <Check size={20} className="text-blue-600" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {mapSrc && (
          <div className="bg-white/70 backdrop-blur-lg p-4 border border-white shadow-xl shadow-blue-900/5 rounded-[4rem] overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 transition-shadow duration-500 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="px-8 py-8 border-b border-slate-100 mb-2">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sector Climate Map</h2>
              <p className="text-blue-600 font-bold text-xs uppercase tracking-widest mt-2">State Status</p>
            </div>
            <div className="relative h-[550px] w-full rounded-[3rem] overflow-hidden bg-slate-50 border border-slate-100">
              <iframe title="Windy Map" src={mapSrc} className="absolute inset-0 w-full h-full border-0" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}