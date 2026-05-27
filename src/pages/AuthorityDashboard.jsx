import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser, useClerk, useAuth } from '@clerk/clerk-react'
import { ShieldAlert, Cpu, Activity, Clock, CheckCircle, MessageSquare, ArrowRight, Shield, List, Users, Database } from 'lucide-react'
import UpdateCentre from '../components/UpdateCentre'

export default function AuthorityDashboard() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const { getToken } = useAuth()
  const navigate = useNavigate()

  const [reports, setReports] = useState([])
  const [roleRequests, setRoleRequests] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Active') // Active, History, Demands, Logs

  const [suggestions, setSuggestions] = useState({})
  const [generatingFor, setGeneratingFor] = useState(null)

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [user, navigate, activeTab])

  const authFetch = async (url, options = {}) => {
    const token = await getToken()
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    })
  }

  const fetchData = async () => {
    try {
      if (activeTab === 'Active' || activeTab === 'History') {
        const res = await authFetch('/api/reports')
        if(res.ok) setReports(await res.json())
      } else if (activeTab === 'Demands') {
        const res = await authFetch('/api/role-requests')
        if(res.ok) setRoleRequests(await res.json())
      } else if (activeTab === 'Logs') {
        const res = await authFetch('/api/audit-logs')
        if(res.ok) setAuditLogs(await res.json())
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleResolveReport = async (id) => {
    try {
      await authFetch(`/api/reports/${id}/resolve`, { method: 'PUT' })
      fetchData()
    } catch (error) {
      console.error(error)
    }
  }

  const handleResolveRequest = async (id, status) => {
    try {
      const res = await authFetch(`/api/role-requests/${id}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error)
      }
      fetchData()
    } catch (error) {
      console.error(error)
    }
  }

  const handleGenerateAISuggestion = async (id) => {
    setGeneratingFor(id)
    try {
      const res = await authFetch(`/api/reports/${id}/suggest`, { method: 'POST' })
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
    if (!dateStr) return '';
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

  const userRole = user?.publicMetadata?.role || 'community'

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <nav className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-rose-500/20 text-rose-500 rounded-lg">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">RESILO ALERT CENTER</h1>
            <p className="text-xs font-semibold text-rose-400 uppercase">STATE {userRole.replace('_', ' ')} PORTAL</p>
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
            onClick={() => { signOut(); navigate('/'); }}
            className="text-sm font-bold text-slate-400 hover:text-white"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-wrap gap-4 mb-8">
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

          {(userRole === 'super_admin' || userRole === 'admin') && (
            <>
              <button
                onClick={() => setActiveTab('Demands')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'Demands' ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                <Users size={20} /> Access Demands
              </button>

              <button
                onClick={() => setActiveTab('Manage Data')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'Manage Data' ? 'bg-sky-600 text-white shadow-[0_0_20px_rgba(2,132,199,0.4)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                <Database size={20} /> Manage Data
              </button>

              <button
                onClick={() => setActiveTab('Logs')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'Logs' ? 'bg-slate-600 text-white shadow-[0_0_20px_rgba(71,85,105,0.4)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                <List size={20} /> Audit Logs
              </button>
            </>
          )}
        </div>

        <div className="space-y-4">
          {activeTab === 'Manage Data' && <UpdateCentre />}
          {(activeTab === 'Active' || activeTab === 'History') && (
            (activeTab === 'Active' ? activeReports : historyReports).length === 0 ? (
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
                        onClick={() => handleResolveReport(report._id)}
                        className="flex-shrink-0 flex items-center gap-2 px-6 py-3 font-bold text-white bg-slate-700 rounded-xl hover:bg-emerald-600 hover:shadow-[0_0_15px_rgba(5,150,105,0.4)] transition-all"
                      >
                        <CheckCircle size={20} /> Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))
            )
          )}

          {activeTab === 'Demands' && (
            roleRequests.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-slate-700 rounded-3xl">
                <Users size={48} className="mx-auto mb-4 text-slate-600" />
                <h3 className="text-xl font-bold text-slate-400">No pending access requests.</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roleRequests.map(req => (
                  <div key={req._id} className="p-6 bg-slate-800 rounded-2xl border border-indigo-500/30 shadow-lg shadow-indigo-500/10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-3 py-1 text-xs font-bold uppercase bg-indigo-500/20 text-indigo-400 rounded-full">
                          {req.requestedRole} Request
                        </span>
                        <span className="text-sm font-semibold text-slate-400">{timeAgo(req.createdAt)}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white truncate" title={req.clerkUserEmail}>{req.clerkUserEmail}</h3>
                      <div className="mt-4 p-3 bg-slate-900 rounded-lg border border-slate-700">
                        <p className="text-xs font-bold text-slate-500 uppercase">Target Facility</p>
                        <p className="text-sm font-semibold text-slate-300 mt-1">{req.requestedInstituteId?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{req.requestedInstituteId?.district || ''}</p>
                      </div>
                    </div>
                    <div className="mt-6 flex gap-3">
                      <button
                        onClick={() => handleResolveRequest(req._id, 'approved')}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleResolveRequest(req._id, 'rejected')}
                        className="flex-1 py-2 bg-slate-700 hover:bg-rose-600 text-white text-sm font-bold rounded-lg transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'Logs' && (
            auditLogs.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-slate-700 rounded-3xl">
                <List size={48} className="mx-auto mb-4 text-slate-600" />
                <h3 className="text-xl font-bold text-slate-400">No audit logs available.</h3>
              </div>
            ) : (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-900/50 text-slate-400 font-bold uppercase text-xs">
                      <tr>
                        <th className="px-6 py-4">Timestamp</th>
                        <th className="px-6 py-4">Action</th>
                        <th className="px-6 py-4">Target Collection</th>
                        <th className="px-6 py-4">Actor ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {auditLogs.map(log => (
                        <tr key={log._id} className="hover:bg-slate-700/20 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-bold rounded-md ${
                              log.action === 'CREATE' ? 'bg-emerald-500/20 text-emerald-400' :
                              log.action === 'UPDATE' ? 'bg-blue-500/20 text-blue-400' :
                              log.action === 'RESOLVE' ? 'bg-indigo-500/20 text-indigo-400' :
                              'bg-slate-500/20 text-slate-400'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-200">{log.targetCollection}</td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-500 truncate max-w-[150px]" title={log.clerkUserId}>
                            {log.clerkUserId}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
