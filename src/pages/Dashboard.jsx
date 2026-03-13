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

export default function Dashboard() {
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const navigate = useNavigate()

  const modules = [
    { title: "Sanitation", path: "/sanitation", color: "bg-blue-50 text-blue-700", icon: Sparkles },
    { title: "Energy", path: "/energy", color: "bg-amber-50 text-amber-700", icon: BatteryCharging },
    { title: "Weather", path: "/weather", color: "bg-cyan-50 text-cyan-700", icon: CloudRain },
    { title: "Water", path: "/water", color: "bg-teal-50 text-teal-700", icon: Activity }
  ]

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-1 text-gray-500 text-lg">Select your district to begin</p>
        </header>

        {/* District Selector & Status Summary */}
        <div className="mb-12">
          <div className="relative mb-5">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <MapPin className="w-6 h-6 text-gray-400" />
            </div>
            <select 
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full py-5 pl-14 pr-12 text-xl font-medium bg-white border border-gray-200 shadow-sm appearance-none rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 transition-shadow"
            >
              <option value="" disabled>Select District</option>
              {districts.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
            {/* Custom dropdown arrow to replace native */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          {/* Status Summary */}
          {selectedDistrict && (
            <div className="flex flex-wrap gap-4 px-2 animate-fade-in">
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

        {/* Module Hub Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-8">
          {modules.map((mod) => (
            <button
              key={mod.title}
              onClick={() => navigate(mod.path)}
              className="group relative flex flex-col justify-between p-8 overflow-hidden text-left bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 min-h-[190px] active:scale-95"
            >
              <div className="z-10">
                <div className={`inline-flex items-center justify-center w-14 h-14 mb-6 rounded-2xl ${mod.color}`}>
                  <mod.icon size={28} strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">{mod.title}</h3>
              </div>
              
              <div className="absolute flex items-center justify-center w-12 h-12 transition-all duration-300 transform translate-x-4 opacity-0 right-6 md:right-8 bottom-8 group-hover:translate-x-0 group-hover:opacity-100 bg-gray-50 rounded-full text-slate-400">
                <ArrowRight size={24} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
