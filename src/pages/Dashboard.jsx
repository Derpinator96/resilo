import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, ArrowRight, School, Hospital, ChevronDown, Check } from 'lucide-react'

// --- CONSTANTS ---
const districts = [
  "Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", 
  "Dantewada", "Dhamtari", "Durg", "Gariaband", "Gaurela Pendra Marwahi", "Janjgir-Champa", 
  "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Manendragarh-Chirmiri-Bharatpur", 
  "Mohla-Manpur-Ambagarh Chowki", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sakti", 
  "Sarangarh-Bilaigarh", "Sukma", "Surajpur", "Surguja", "Khairagarh-Chhuikhadan-Gandai"
].sort()

const districtStats = {
  "Balod": { schools: 1569, healthcare: 235 }, "Baloda Bazar": { schools: 2229, healthcare: 207 },
  "Balrampur": { schools: 2195, healthcare: 229 }, "Bastar": { schools: 2448, healthcare: 280 },
  "Bemetara": { schools: 1433, healthcare: 163 }, "Bijapur": { schools: 952, healthcare: 114 },
  "Bilaspur": { schools: 3205, healthcare: 247 }, "Dantewada": { schools: 895, healthcare: 98 },
  "Dhamtari": { schools: 1712, healthcare: 200 }, "Durg": { schools: 1660, healthcare: 162 },
  "Gariaband": { schools: 1656, healthcare: 225 }, "Gaurela Pendra Marwahi": { schools: 800, healthcare: 95 },
  "Janjgir-Champa": { schools: 2913, healthcare: 196 }, "Jashpur": { schools: 2633, healthcare: 304 },
  "Kabirdham": { schools: 1789, healthcare: 179 }, "Kanker": { schools: 2601, healthcare: 292 },
  "Kondagaon": { schools: 2061, healthcare: 203 }, "Korba": { schools: 2436, healthcare: 300 },
  "Koriya": { schools: 1680, healthcare: 109 }, "Mahasamund": { schools: 2137, healthcare: 261 },
  "Manendragarh-Chirmiri-Bharatpur": { schools: 800, healthcare: 122 },
  "Mohla-Manpur-Ambagarh Chowki": { schools: 800, healthcare: 98 }, "Mungeli": { schools: 1121, healthcare: 151 },
  "Narayanpur": { schools: 623, healthcare: 75 }, "Raigarh": { schools: 3493, healthcare: 312 },
  "Raipur": { schools: 2356, healthcare: 175 }, "Rajnandgaon": { schools: 3164, healthcare: 177 },
  "Sakti": { schools: 900, healthcare: 141 }, "Sarangarh-Bilaigarh": { schools: 900, healthcare: 138 },
  "Sukma": { schools: 1052, healthcare: 115 }, "Surajpur": { schools: 2249, healthcare: 259 },
  "Surguja": { schools: 2265, healthcare: 233 }, "Khairagarh-Chhuikhadan-Gandai": { schools: 800, healthcare: 100 }
}

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

// Background Component to ensure isolation
const MeshBackground = () => (
  <div className="fixed inset-0 z-0 bg-white pointer-events-none overflow-hidden">
    <div 
      className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-200 blur-[120px]" 
      style={{ opacity: 0.5 }}
    />
    <div 
      className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-green-200 blur-[120px]" 
      style={{ opacity: 0.4 }}
    />
    <div 
      className="absolute bottom-[-10%] left-[5%] w-[40%] h-[40%] rounded-full bg-teal-100 blur-[100px]" 
      style={{ opacity: 0.5 }}
    />
  </div>
)

export default function Dashboard() {
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

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

  const categories = [
    { title: "Educational Hubs", type: "School", count: districtStats[selectedDistrict]?.schools || 0, color: "from-emerald-500 to-green-600", icon: School },
    { title: "Healthcare Units", type: "Healthcare", count: districtStats[selectedDistrict]?.healthcare || 0, color: "from-green-500 to-teal-600", icon: Hospital },
  ]

  return (
    <div className="relative min-h-screen">
      <MeshBackground />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        {/* Header Section */}
        <header className="text-center mb-20">
          <div className="inline-flex items-center px-4 py-1.5 mb-8 text-[11px] font-black uppercase tracking-[0.25em] text-emerald-800 bg-white border border-emerald-100 rounded-full shadow-sm">
             Climatathon 2024
          </div>
          <h1 className="text-6xl lg:text-8xl font-black tracking-tighter text-slate-900 mb-8 leading-none">
            Global <span className="text-transparent bg-clip-text bg-gradient-to-br from-emerald-600 to-green-800">Dashboard</span>
          </h1>
          <p className="max-w-xl mx-auto text-lg text-slate-600 font-medium">
            Strategic infrastructure surveillance and climate risk intelligence for Chhattisgarh.
          </p>

          {/* District Selector */}
          <div className="mt-14 max-w-md mx-auto relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full flex items-center justify-between py-6 px-10 text-xl font-bold bg-white/80 backdrop-blur-xl border border-white shadow-xl rounded-[2.5rem] focus:outline-none hover:border-emerald-200 transition-all"
            >
              <div className="flex items-center gap-4">
                <MapPin className={`w-6 h-6 ${selectedDistrict ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span className={selectedDistrict ? 'text-slate-900' : 'text-slate-400'}>
                  {selectedDistrict || "Select District"}
                </span>
              </div>
              <ChevronDown className={`w-6 h-6 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-emerald-600' : ''}`} />
            </button>

            {isOpen && (
              <div className="absolute z-50 top-full left-0 w-full mt-4 bg-white/95 backdrop-blur-3xl border border-white shadow-2xl rounded-[2.5rem] overflow-hidden">
                <div className="max-h-[320px] overflow-y-auto p-3">
                  {districts.map((district) => (
                    <button
                      key={district}
                      onClick={() => { setSelectedDistrict(district); setIsOpen(false); }}
                      className="w-full flex items-center justify-between px-7 py-4 text-left text-slate-600 font-bold hover:bg-emerald-50 hover:text-emerald-700 rounded-2xl transition-all"
                    >
                      {district}
                      {selectedDistrict === district && <Check size={20} className="text-emerald-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        {selectedDistrict && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {categories.map((cat) => (
                <button
                  key={cat.title}
                  onClick={() => navigate(`/list/${selectedDistrict}/${cat.type}`)}
                  className="group relative p-12 bg-white/60 backdrop-blur-md border border-white rounded-[3.5rem] shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 text-left overflow-hidden"
                >
                  <div className={`inline-flex items-center justify-center w-16 h-16 mb-10 rounded-2xl bg-gradient-to-br ${cat.color} text-white shadow-lg`}>
                    <cat.icon size={30} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800/40 mb-3">{cat.title}</h3>
                  <div className="flex items-baseline gap-4">
                    <span className="text-7xl font-black text-slate-900 tracking-tighter leading-none">{cat.count}</span>
                    <span className="text-emerald-600 font-black text-xl">Active</span>
                  </div>
                  <div className="mt-12 flex items-center text-emerald-700 font-extrabold text-sm group-hover:gap-3 transition-all tracking-widest uppercase">
                    View Infrastructure <ArrowRight size={20} className="ml-1" />
                  </div>
                </button>
              ))}
            </div>

            {/* Map */}
            {mapSrc && (
              <div className="bg-white/70 backdrop-blur-md p-4 border border-white shadow-2xl rounded-[4rem] overflow-hidden">
                <div className="px-8 py-8 border-b border-white/40 mb-2">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Sector Climate Map</h2>
                    <p className="text-emerald-600 font-bold text-xs uppercase tracking-widest mt-3">{selectedDistrict} District</p>
                </div>
                <div className="relative h-[550px] w-full rounded-[3rem] overflow-hidden bg-white/50">
                   <iframe title="Windy Map" src={mapSrc} className="absolute inset-0 w-full h-full border-0" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
