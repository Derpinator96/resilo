import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, ChevronRight } from 'lucide-react'

export default function InstituteList() {
  const { district, type } = useParams()
  const navigate = useNavigate()

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/institutes?district=${encodeURIComponent(district)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch facilities')
        return res.json()
      })
      .then((fetchedData) => {
        setData(Array.isArray(fetchedData) ? fetchedData : [])
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setError('Failed to connect to the database.')
        setLoading(false)
      })
  }, [district, type])

  const parseFacilityName = (rawName) => {
    if (!rawName) return { prefix: type?.toUpperCase() || 'FACILITY', name: '' }
    const words = rawName.trim().split(/\s+/)
    const knownTypes = ['phc', 'chc', 'shc', 'dh', 'hwc', 'upch']
    if (words.length > 1 && knownTypes.includes(words[0].toLowerCase())) {
      return {
        prefix: words[0].toUpperCase(),
        name: words.slice(1).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
      }
    }
    // Check if the name already has a prefix like "CIVIL HOSPITAL"
    if (rawName.toUpperCase().startsWith("CIVIL HOSPITAL")) {
      return { prefix: "CIVIL HOSPITAL", name: rawName.substring(14).trim() }
    }
    return { prefix: type?.toUpperCase() || 'CENTRE', name: rawName }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-['Inter']">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-8 pb-32">
        
        {/* Page Header block */}
        <header className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">

          
          <div className="flex items-center gap-2 mb-2 text-[12px] font-semibold tracking-[0.12em] uppercase text-[#0D9488]">
            <MapPin size={14} />
            {district} District
          </div>
          
          <h1 className="text-[36px] font-extrabold text-[#0A192F] mb-1">
            Solar Centre Facilities
          </h1>
          
          <p className="text-[15px] font-normal text-slate-500">
            Select a facility to view its high-density resilience profile & AI Forecast.
          </p>
        </header>

        {/* Loading / Error States */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 bg-white border border-slate-200 rounded-xl shadow-sm animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 rounded-xl bg-white border border-red-200 text-red-600 font-medium shadow-sm">
            {error}
          </div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-white border border-slate-200 text-slate-500 font-medium shadow-sm">
            No facilities found matching these criteria.
          </div>
        ) : (
          /* Facility Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            {data.map((inst) => {
              const { prefix, name } = parseFacilityName(inst.name)
              return (
                <button
                  key={inst._id}
                  onClick={() => navigate(`/institute/${inst._id}`)}
                  className="bg-white border border-slate-200 rounded-xl shadow-sm px-6 py-5 hover:border-[#0D9488] hover:shadow-[0_4px_12px_rgba(13,148,136,0.12)] transition-all duration-200 ease-out cursor-pointer text-left flex flex-col justify-between"
                >
                  {/* Row 1 */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="bg-[#F0FDFA] text-[#0D9488] font-semibold text-[11px] uppercase tracking-wide px-2.5 py-1 rounded-full">
                      {prefix}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-slate-500 text-[12px] font-medium">Active</span>
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="mb-4">
                    <h3 className="font-bold text-[18px] text-[#0A192F] leading-tight mb-1">
                      {name || prefix}
                    </h3>
                    <p className="font-normal text-[13px] text-slate-400">
                      {inst.district}
                    </p>
                  </div>

                  {/* Row 3 */}
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[#0A192F] text-[12px] font-medium">Solar System</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="text-[#0D9488] text-[12px] font-medium">Live</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="text-slate-400 text-[12px]">Pending</span>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}