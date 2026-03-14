import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, School, MapPin } from 'lucide-react'

export default function InstituteList() {
  const { district, type } = useParams()
  const navigate = useNavigate()
  
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Hardcoded mock institutes to replace unstable backend fetching
    const mockData = [
      {
        _id: 'mock-1',
        name: `Mock ${type === 'School' ? 'Govt School Alpha' : 'District Health Centre Alpha'} - ${district}`,
        type: type,
        district: district,
        isMock: true,
        waterQuality: 'Low/Highly Turbid',
        waterLevel: 25,
        solarHealth: 'Critical: 35% efficiency'
      },
      {
        _id: 'mock-2',
        name: `Mock ${type === 'School' ? 'Govt School Beta' : 'District Health Centre Beta'} - ${district}`,
        type: type,
        district: district,
        isMock: true,
        waterQuality: 'Moderate/Slightly Turbid',
        waterLevel: 45,
        solarHealth: 'Warning: 60% efficiency'
      },
      {
        _id: 'mock-3',
        name: `Mock ${type === 'School' ? 'Govt School Gamma' : 'District Health Centre Gamma'} - ${district}`,
        type: type,
        district: district,
        isMock: true,
        waterQuality: 'Optimal/Clear',
        waterLevel: 85,
        solarHealth: 'Stable: 95% efficiency'
      }
    ]

    // Simulate network delay for UX
    setTimeout(() => {
      setData(mockData)
      setLoading(false)
    }, 400)
  }, [district, type])

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50 lg:px-8 pb-32">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="flex items-center gap-2 mb-8 text-sm font-medium text-gray-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <header className="mb-8">
          <div className="flex items-center gap-3 text-sm font-semibold text-teal-600 uppercase tracking-widest mb-3">
            <MapPin size={16} /> {district} District
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{type} Facilities</h1>
          <p className="mt-1 text-gray-500 text-lg">Select a facility to view its resilience profile</p>
        </header>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-white border border-gray-100 rounded-2xl"></div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 text-red-600 bg-red-50 rounded-xl">{error}</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center bg-white border border-gray-100 rounded-3xl text-gray-500">
            No facilities found matching these criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {data.map(inst => (
              <button
                key={inst._id}
                onClick={() => navigate(`/institute/${inst._id}`, { state: inst })}
                className="flex items-center justify-between p-6 text-left transition-all duration-300 bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-md active:scale-[0.98]"
              >
                <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-xl shrink-0 ${type === 'School' ? 'bg-teal-50 text-teal-600' : 'bg-blue-50 text-blue-600'}`}>
                    {type === 'School' ? <School size={28} /> : <Building2 size={28} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{inst.name}</h3>
                    <div className="flex gap-2 mt-1">
                      {inst.isMock && (
                        <span className="px-2 py-0.5 text-xs font-bold text-purple-700 uppercase bg-purple-100 rounded-md">
                          Database Seed
                        </span>
                      )}
                      {!inst.isMock && (
                        <span className="px-2 py-0.5 text-xs font-bold text-green-700 uppercase bg-green-100 rounded-md">
                          Live Sensor Data
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
