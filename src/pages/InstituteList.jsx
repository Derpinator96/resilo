import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, Sun, MapPin, Loader2 } from 'lucide-react'

export default function InstituteList() {
  const { district, type } = useParams()
  const navigate = useNavigate()
  
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/institutes?district=${encodeURIComponent(district)}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch facilities')
        return res.json()
      })
      .then(fetchedData => {
        if (Array.isArray(fetchedData)) {
          setData(fetchedData)
        } else {
          setData([])
        }
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setError('Failed to connect to the database.')
        setLoading(false)
      })
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

        <header className="mb-10 animate-slide-up">
          <div className="flex items-center gap-3 text-sm font-black text-indigo-600 uppercase tracking-widest mb-3">
            <MapPin size={18} /> {district} District
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">{type} <span className="text-gradient">Facilities</span></h1>
          <p className="mt-2 text-slate-500 text-lg">Select a facility to view its high-density resilience profile.</p>
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
                className="flex items-center justify-between p-6 text-left transition-all duration-300 bg-white border border-slate-100 shadow-lg shadow-slate-200/50 rounded-3xl hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] animate-fade-in"
              >
                <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-xl shrink-0 ${type === 'Solar Centre' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                    {type === 'Solar Centre' ? <Sun size={28} /> : <Building2 size={28} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{inst.name}</h3>
                    <div className="flex gap-2 mt-1">
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
