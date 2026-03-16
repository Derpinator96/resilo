import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ShieldAlert, Cpu, Activity, Clock, CheckCircle, ChevronRight, MessageSquare, ArrowRight } from 'lucide-react'

export default function AuthorityDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Active')

  const [suggestions, setSuggestions] = useState({})
  const [generatingFor, setGeneratingFor] = useState(null)

  useEffect(() => {
    if (!user || user.role !== 'Authority') {
      navigate('/')
      return
    }
    fetchReports()
    const interval = setInterval(fetchReports, 10000)
    return () => clearInterval(interval)
  }, [user, navigate])

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports')
      const data = await res.json()
      setReports(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (id) => {
    try {
      await fetch(`/api/reports/${id}/resolve`, { method: 'PUT' })
      fetchReports()
    } catch (error) {
      console.error(error)
    }
  }

  const handleGenerateAISuggestion = async (id) => {
    setGeneratingFor(id)
    try {
      const res = await fetch(`/api/reports/${id}/suggest`, { method: 'POST' })
      const data = await res.json()
      setSuggestions(prev => ({ ...prev, [id]: data.suggestion }))
    } catch (error) {
      console.error(error)
      setSuggestions(prev => ({ ...prev, [id]: "Error: NVIDIA API proxy timeout or context length exceeded." }))
    } finally {
      setGeneratingFor(null)
    }
  }

  const activeReports = reports.filter(r => r.status === 'Active')
  const historyReports = reports.filter(r => r.status === 'Resolved')

  const timeAgo = (dateStr) => {
    const diff = Math.floor((new Date() - new Date(dateStr)) / 60000)
    if (diff < 1) return 'Just now'
    if (diff < 60) return `${diff}m ago`
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
    return `${Math.floor(diff / 1440)}d ago`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-900">
        <div className="w-12 h-12 border-4 border-rose-500/30 rounded-full border-t-rose-500 animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <nav className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-rose-500/20 text-rose-500 rounded-lg">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">RESILO ALERT CENTER</h1>
            <p className="text-xs font-semibold text-rose-400">STATE AUTHORITY PORTAL</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-colors border border-slate-600 rounded-lg hover:bg-slate-700"
          >
            Global Dashboard <ArrowRight size={16} />
          </button>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="text-sm font-bold text-slate-400 hover:text-white"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('Active')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'Active' ? 'bg-rose-600 text-white shadow-[0_0_20px_rgba(225,29,72,0.4)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            <Activity size={20} /> Active Incidents
            <span className={`px-2 py-0.5 ml-2 text-xs rounded-full ${activeTab === 'Active' ? 'bg-white text-rose-600' : 'bg-slate-700 text-slate-300'}`}>
              {activeReports.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('History')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'History' ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(5,150,105,0.4)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            <Clock size={20} /> Resolution History
          </button>
        </div>

        <div className="space-y-4">
          {(activeTab === 'Active' ? activeReports : historyReports).length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-slate-700 rounded-3xl">
              <CheckCircle size={48} className="mx-auto mb-4 text-slate-600" />
              <h3 className="text-xl font-bold text-slate-400">No {activeTab.toLowerCase()} incidents in the pipeline.</h3>
            </div>
          ) : (
            (activeTab === 'Active' ? activeReports : historyReports).map(report => (
              <div key={report._id} className={`p-6 bg-slate-800 rounded-2xl border ${report.status === 'Active' ? (report.type === 'Auto' ? 'border-orange-500/50 shadow-lg shadow-orange-500/10' : 'border-rose-500/50 shadow-lg shadow-rose-500/10') : 'border-slate-700 opacity-60'} animate-slide-up`}>

                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className={`mt-1 p-3 rounded-xl ${report.type === 'Auto' ? 'bg-orange-500/20 text-orange-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {report.type === 'Auto' ? <Cpu size={24} /> : <MessageSquare size={24} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2.5 py-1 text-xs font-black uppercase tracking-wider rounded-md ${report.type === 'Auto' ? 'bg-orange-500 text-white' : 'bg-rose-500 text-white'}`}>
                          {report.type} ESCALATION
                        </span>
                        <span className="text-sm font-semibold text-slate-400 flex items-center gap-1">
                          <Clock size={14} /> {timeAgo(report.createdAt)}
                        </span>
                      </div>

                      <h2 className="text-2xl font-bold text-white mb-1">
                        [{report.component}] Critical Failure
                      </h2>
                      <p className="text-slate-300 font-medium mb-3">Facility: <span className="text-white">{report.instituteName}</span></p>

                      <div className="p-4 bg-slate-900 rounded-xl mb-4 border border-slate-700">
                        <p className="text-slate-300">"{report.description}"</p>
                      </div>

                      {report.status === 'Active' && (
                        <div className="mt-4">
                          {suggestions[report._id] ? (
                            <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                              <div className="flex items-center gap-2 mb-2 text-indigo-400 font-bold uppercase text-xs tracking-wider">
                                <Cpu size={14} /> NVIDIA NIM Synthetic Response
                              </div>
                              <p className="text-indigo-100">{suggestions[report._id]}</p>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleGenerateAISuggestion(report._id)}
                              disabled={generatingFor === report._id}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-indigo-400 bg-indigo-500/10 rounded-lg hover:bg-indigo-500/20 transition-colors disabled:opacity-50"
                            >
                              <Cpu size={16} /> {generatingFor === report._id ? 'Generating Action Plan...' : 'Suggest Actionable Fix (AI)'}
                            </button>
                          )}
                        </div>
                      )}

                      {report.status === 'Resolved' && report.resolvedAt && (
                        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm font-bold flex items-center gap-2">
                          <CheckCircle size={16} /> Resolved {timeAgo(report.resolvedAt)}
                        </div>
                      )}
                    </div>
                  </div>

                  {report.status === 'Active' && (
                    <button
                      onClick={() => handleResolve(report._id)}
                      className="flex-shrink-0 flex items-center gap-2 px-6 py-3 font-bold text-white bg-slate-700 rounded-xl hover:bg-emerald-600 hover:shadow-[0_0_15px_rgba(5,150,105,0.4)] transition-all"
                    >
                      <CheckCircle size={20} /> Mark Resolved
                    </button>
                  )}
                </div>

              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
