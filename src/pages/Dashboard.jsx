import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, ArrowRight, School, Hospital } from 'lucide-react'

// Array of the 33 districts in Chhattisgarh
const districts = [
  "Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", 
  "Dantewada", "Dhamtari", "Durg", "Gariaband", "Gaurela Pendra Marwahi", "Janjgir-Champa", 
  "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Manendragarh-Chirmiri-Bharatpur", 
  "Mohla-Manpur-Ambagarh Chowki", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sakti", 
  "Sarangarh-Bilaigarh", "Sukma", "Surajpur", "Surguja", "Khairagarh-Chhuikhadan-Gandai"
].sort()

// Counts of Schools and Healthcare elements manually pulled from offline records
const districtStats = {
  "Balod": { schools: 1569, healthcare: 235 },
  "Baloda Bazar": { schools: 2229, healthcare: 207 },
  "Balrampur": { schools: 2195, healthcare: 229 },
  "Bastar": { schools: 2448, healthcare: 280 },
  "Bemetara": { schools: 1433, healthcare: 163 },
  "Bijapur": { schools: 952, healthcare: 114 },
  "Bilaspur": { schools: 3205, healthcare: 247 },
  "Dantewada": { schools: 895, healthcare: 98 },
  "Dhamtari": { schools: 1712, healthcare: 200 },
  "Durg": { schools: 1660, healthcare: 162 },
  "Gariaband": { schools: 1656, healthcare: 225 },
  "Gaurela Pendra Marwahi": { schools: 800, healthcare: 95 },
  "Janjgir-Champa": { schools: 2913, healthcare: 196 },
  "Jashpur": { schools: 2633, healthcare: 304 },
  "Kabirdham": { schools: 1789, healthcare: 179 },
  "Kanker": { schools: 2601, healthcare: 292 },
  "Kondagaon": { schools: 2061, healthcare: 203 },
  "Korba": { schools: 2436, healthcare: 300 },
  "Koriya": { schools: 1680, healthcare: 109 },
  "Mahasamund": { schools: 2137, healthcare: 261 },
  "Manendragarh-Chirmiri-Bharatpur": { schools: 800, healthcare: 122 },
  "Mohla-Manpur-Ambagarh Chowki": { schools: 800, healthcare: 98 },
  "Mungeli": { schools: 1121, healthcare: 151 },
  "Narayanpur": { schools: 623, healthcare: 75 },
  "Raigarh": { schools: 3493, healthcare: 312 },
  "Raipur": { schools: 2356, healthcare: 175 },
  "Rajnandgaon": { schools: 3164, healthcare: 177 },
  "Sakti": { schools: 900, healthcare: 141 },
  "Sarangarh-Bilaigarh": { schools: 900, healthcare: 138 },
  "Sukma": { schools: 1052, healthcare: 115 },
  "Surajpur": { schools: 2249, healthcare: 259 },
  "Surguja": { schools: 2265, healthcare: 233 },
  "Khairagarh-Chhuikhadan-Gandai": { schools: 800, healthcare: 100 }
}

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
    ? `https://embed.windy.com/embed2.html?lat=${coords[0]}&lon=${coords[1]}&zoom=11&level=surface&overlay=rain`
    : null

  const categories = [
    { title: "Schools", type: "School", color: "bg-teal-50 text-teal-700", icon: School },
    { title: "Healthcare Centers", type: "Healthcare", color: "bg-blue-50 text-blue-700", icon: Hospital },
  ]

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
                <span className="font-semibold text-slate-700">
                  {districtStats[selectedDistrict]?.schools || 0} Schools
                </span>
              </div>

              <div className="flex items-center gap-2.5 px-4 py-2 bg-white border border-gray-100 rounded-lg shadow-sm">
                <Hospital size={18} className="text-blue-600" />
                <span className="font-semibold text-slate-700">
                  {districtStats[selectedDistrict]?.healthcare || 0} Health Centres
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Windy Map (District-Wide Climate) */}
        {mapSrc && (
          <div className="mb-12 overflow-hidden bg-white border border-gray-100 shadow-sm rounded-3xl animate-fade-in">
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
              height="400"
              frameBorder="0"
            ></iframe>
          </div>
        )}

        {/* Institute Category Hub */}
        {selectedDistrict && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-8 animate-fade-in">
            {categories.map((cat) => (
              <button
                key={cat.title}
                onClick={() => navigate(`/list/${selectedDistrict}/${cat.type}`)}
                className="group relative flex flex-col justify-between p-8 overflow-hidden text-left bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 min-h-[190px] active:scale-95"
              >
                <div>
                  <div className={`inline-flex items-center justify-center w-14 h-14 mb-4 rounded-2xl ${cat.color}`}>
                    <cat.icon size={26} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">{cat.title}</h3>
                  <p className="text-sm text-gray-500">
                    View resilience profiles for {cat.type === 'School' ? districtStats[selectedDistrict]?.schools : districtStats[selectedDistrict]?.healthcare} local {cat.title.toLowerCase()}
                  </p>
                </div>

                <div className="absolute flex items-center justify-center w-12 h-12 transition-all duration-300 transform translate-x-4 opacity-0 right-6 bottom-8 group-hover:translate-x-0 group-hover:opacity-100 bg-gray-50 rounded-full text-slate-400">
                  <ArrowRight size={24} />
                </div>
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}