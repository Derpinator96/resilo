import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, ArrowRight, Sparkles, BatteryCharging, CloudRain, Activity, School, Hospital } from 'lucide-react'

// Array of the 33 districts in Chhattisgarh
const districts = [
  "Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", 
  "Dantewada", "Dhamtari", "Durg", "Gariaband", "Gaurela Pendra Marwahi", "Janjgir-Champa", 
  "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Manendragarh-Chirmiri-Bharatpur", 
  "Mohla-Manpur-Ambagarh Chowki", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sakti", 
  "Sarangarh-Bilaigarh", "Sukma", "Surajpur", "Surguja", "Khairagarh-Chhuikhadan-Gandai"
].sort()

// Coordinates of districts
const districtCoords = {
  "Balod": [20.73, 81.20],
  "Baloda Bazar": [21.65, 82.16],
  "Balrampur": [23.62, 83.61],
  "Bastar": [19.07, 81.95],
  "Bemetara": [21.71, 81.53],
  "Bijapur": [18.79, 80.82],
  "Bilaspur": [22.08, 82.14],
  "Dantewada": [18.90, 81.35],
  "Dhamtari": [20.71, 81.55],
  "Durg": [21.19, 81.28],
  "Gariaband": [20.63, 82.06],
  "Gaurela Pendra Marwahi": [22.78, 81.90],
  "Janjgir-Champa": [22.01, 82.58],
  "Jashpur": [22.89, 84.14],
  "Kabirdham": [22.01, 81.25],
  "Kanker": [20.27, 81.49],
  "Kondagaon": [19.59, 81.66],
  "Korba": [22.36, 82.75],
  "Koriya": [23.26, 82.55],
  "Mahasamund": [21.11, 82.10],
  "Manendragarh-Chirmiri-Bharatpur": [23.20, 82.35],
  "Mohla-Manpur-Ambagarh Chowki": [20.70, 80.75],
  "Mungeli": [22.06, 81.68],
  "Narayanpur": [19.72, 81.25],
  "Raigarh": [21.89, 83.39],
  "Raipur": [21.25, 81.63],
  "Rajnandgaon": [21.10, 81.03],
  "Sakti": [22.03, 82.96],
  "Sarangarh-Bilaigarh": [21.58, 83.08],
  "Sukma": [18.39, 81.66],
  "Surajpur": [23.22, 82.87],
  "Surguja": [23.12, 83.19],
  "Khairagarh-Chhuikhadan-Gandai": [21.42, 81.05]
}

// Mock data (later replace with backend API)
const districtData = {
  Korba: {
    energy: { solar: "2.3 kW", outages: "3 today", risk: "Medium" },
    water: { tds: "310 ppm", ph: "7.1", risk: "Low" },
    sanitation: { toilets: "92% functional", waste: "Stable", risk: "Low" },
    weather: { rainfall: "14 mm", wind: "18 km/h", risk: "Medium" }
  }
}

export default function Dashboard() {
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const navigate = useNavigate()

  const coords = districtCoords[selectedDistrict]

  const mapSrc = coords
    ? `https://embed.windy.com/embed2.html?lat=${coords[0]}&lon=${coords[1]}&zoom=13&level=surface&overlay=rain`
    : null

  const modules = [
    { title: "Sanitation", path: "/sanitation", color: "bg-blue-50 text-blue-700", icon: Sparkles },
    { title: "Energy", path: "/energy", color: "bg-amber-50 text-amber-700", icon: BatteryCharging },
    { title: "Weather", path: "/weather", color: "bg-cyan-50 text-cyan-700", icon: CloudRain },
    { title: "Water", path: "/water", color: "bg-teal-50 text-teal-700", icon: Activity }
  ]

  const moduleKeyMap = {
    Sanitation: "sanitation",
    Energy: "energy",
    Weather: "weather",
    Water: "water"
  }

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50 lg:px-8">
      <div className="max-w-4xl mx-auto">

        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-1 text-gray-500 text-lg">Select your district to begin</p>
        </header>

        {/* District Selector */}
        <div className="mb-12">

          <div className="relative mb-5">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <MapPin className="w-6 h-6 text-gray-400" />
            </div>

            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full py-5 pl-14 pr-12 text-xl font-medium bg-white border border-gray-200 shadow-sm appearance-none rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800"
            >
              <option value="" disabled>Select District</option>
              {districts.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>

            <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {selectedDistrict && (
            <div className="flex flex-wrap gap-4 px-2">
              <div className="flex items-center gap-2.5 px-4 py-2 bg-white border border-gray-100 rounded-lg shadow-sm">
                <School size={18} className="text-teal-600" />
                <span className="font-semibold text-slate-700">1 School</span>
              </div>

              <div className="flex items-center gap-2.5 px-4 py-2 bg-white border border-gray-100 rounded-lg shadow-sm">
                <Hospital size={18} className="text-blue-600" />
                <span className="font-semibold text-slate-700">1 Health Centre</span>
              </div>
            </div>
          )}

        </div>

        {/* Module Hub */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-8">

          {modules.map((mod) => {

            const key = moduleKeyMap[mod.title]
            const data = districtData[selectedDistrict]?.[key]

            return (
              <button
                key={mod.title}
                onClick={() => navigate(mod.path)}
                className="group relative flex flex-col justify-between p-8 overflow-hidden text-left bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 min-h-[190px]"
              >

                <div>
                  <div className={`inline-flex items-center justify-center w-14 h-14 mb-4 rounded-2xl ${mod.color}`}>
                    <mod.icon size={26} strokeWidth={2.5} />
                  </div>

                  <h3 className="text-xl font-bold text-slate-800 mb-2">{mod.title}</h3>

                  {data && (
                    <div className="text-sm text-gray-500 space-y-1">

                      {Object.entries(data)
                        .filter(([k]) => k !== "risk")
                        .slice(0,2)
                        .map(([k,v]) => (
                          <div key={k}>
                            {k.toUpperCase()}: {v}
                          </div>
                        ))
                      }

                      <div className="font-semibold text-slate-700">
                        Overall Risk: {data.risk}
                      </div>

                    </div>
                  )}

                </div>

                <div className="absolute flex items-center justify-center w-12 h-12 transition-all duration-300 transform translate-x-4 opacity-0 right-6 bottom-8 group-hover:translate-x-0 group-hover:opacity-100 bg-gray-50 rounded-full text-slate-400">
                  <ArrowRight size={24} />
                </div>

              </button>
            )
          })}

        </div>

        {/* Windy Map */}
        {mapSrc && (
          <div className="mt-12 overflow-hidden bg-white border border-gray-100 shadow-sm rounded-3xl">

            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-slate-800">
                Live Climate Risk Map – {selectedDistrict}
              </h2>
              <p className="text-sm text-gray-500">
                Wind speed, rainfall and storm conditions in the surrounding area
              </p>
            </div>

            <iframe
              title="Windy Map"
              src={mapSrc}
              width="100%"
              height="500"
              frameBorder="0"
            ></iframe>

          </div>
        )}

      </div>
    </div>
  )
}