import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin } from 'lucide-react'

const generateStructuralGrid = (text) => {
  const cleanText = (text || 'FACILITY').replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 12).toUpperCase()
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
      <defs>
        <pattern id="subGrid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/>
        </pattern>
      </defs>
      <rect width="120" height="120" fill="url(#subGrid)"/>
      <path d="M 120 0 L 0 0 0 120" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
      <circle cx="120" cy="120" r="1.5" fill="rgba(255,255,255,0.3)"/>
      <circle cx="0" cy="0" r="1.5" fill="rgba(255,255,255,0.3)"/>
      <text x="6" y="16" font-family="ui-monospace, SFMono-Regular, monospace" font-size="9" font-weight="700" fill="rgba(255,255,255,0.25)" letter-spacing="2">${cleanText}</text>
    </svg>
  `
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}")`
}

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
    return { prefix: type?.toUpperCase() || 'CENTRE', name: rawName }
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 lg:px-8 pb-32">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: `linear-gradient(135deg, #7C3AED 0%, #A855F7 18%, #C084FC 35%, #D946EF 52%, #EC4899 72%, #F9A8D4 88%, #FFF7FC 100%)`,
        }}
      />
      <div className="fixed top-[-10rem] left-[-10rem] w-[35rem] h-[35rem] rounded-full bg-violet-600/30 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10rem] right-[-10rem] w-[35rem] h-[35rem] rounded-full bg-fuchsia-600/30 blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 mb-8 text-sm font-bold text-purple-950 hover:text-black transition-colors"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
          Back to Dashboard
        </button>

        <header className="mb-12">
          <div className="flex items-center gap-2 mb-3 text-sm font-black tracking-[0.2em] uppercase text-purple-950">
            <MapPin size={18} strokeWidth={2.5} />
            {district} District
          </div>
          <h1 className="text-5xl font-black tracking-tight text-black">
            {type} <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-950 via-fuchsia-950 to-pink-900">Facilities</span>
          </h1>
          <p className="mt-3 text-lg font-medium text-purple-950/80">
            Select a facility to view its high-density resilience profile & AI Forecast.
          </p>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[5/4] rounded-3xl bg-white/30 backdrop-blur-2xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.15)]" />
            ))}
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-white/30 backdrop-blur-2xl border border-red-400/60 text-red-950 font-bold shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
            {error}
          </div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white/30 backdrop-blur-2xl border border-white/50 text-purple-950 font-bold shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
            No facilities found matching these criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {data.map((inst) => {
              const { prefix, name } = parseFacilityName(inst.name)
              return (
                <button
                  key={inst._id}
                  onClick={() => navigate(`/institute/${inst._id}`, { state: inst })}
                  className="group relative flex flex-col items-center justify-center p-5 text-center overflow-hidden aspect-[5/4] bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-all duration-300 hover:bg-white/40 hover:border-white/80 hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)] hover:-translate-y-1 hover:scale-[1.03]"
                >
                  <div
                    className="absolute inset-0 opacity-50 transition-all duration-500 group-hover:opacity-100 group-hover:scale-105"
                    style={{
                      backgroundImage: generateStructuralGrid(inst.name),
                      backgroundSize: '120px 120px',
                      backgroundPosition: 'center',
                      maskImage: 'radial-gradient(circle at center, transparent 35%, black 100%)',
                      WebkitMaskImage: 'radial-gradient(circle at center, transparent 35%, black 100%)'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent" />
                  <div className="relative z-10">
                    <h3 className="text-4xl font-black tracking-tight text-black">{prefix}</h3>
                    {name && (
                      <p className="mt-2 text-sm font-bold text-purple-950/80 transition-colors group-hover:text-black">
                        {name}
                      </p>
                    )}
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