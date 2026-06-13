import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser, useClerk, useAuth } from '@clerk/clerk-react'
import { useRole } from '../hooks/useRole'
import { ShieldAlert, Cpu, Activity, Clock, CheckCircle, MessageSquare, ArrowRight, Shield, List, Users, Database } from 'lucide-react'
import UpdateCentre from '../components/UpdateCentre'
import logoDark from '../assets/logo-dark.svg'
import MeshBackground from '../components/MeshBackground'
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
      <div className="flex justify-center items-center min-h-screen bg-slate-50/70 backdrop-blur-md">
        <div className="w-12 h-12 border-4 border-rose-500/30 rounded-full border-t-rose-500 animate-spin"></div>
      </div>
    )
  }

  const { role: userRole } = useRole()

  return (
    <div className="relative flex flex-col min-h-[calc(100vh-36px)] font-sans pb-32">
      <MeshBackground />
      
      <div className="relative z-10 flex flex-col flex-1 pt-[92px]">
        {/* Page Header */}
        <div className="px-8 pt-6 pb-2 shrink-0">
          <div className="flex items-center gap-4 mb-4">
            <img src={logoDark} alt="Resilo" className="h-[28px]" />
            <h1 className="text-[28px] font-extrabold text-[#0A192F] tracking-tight">ALERT CENTER</h1>
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-teal-100 text-teal-800 rounded-full border border-teal-200 shadow-sm ml-2">
              STATE {userRole.replace('_', ' ')} PORTAL
            </span>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="px-8 shrink-0 sticky top-[92px] z-30 bg-transparent py-2">
          <div className="flex flex-row gap-3 overflow-x-auto pb-4 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('Active')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all whitespace-nowrap ${
                activeTab === 'Active' 
                  ? 'bg-[#0A192F] text-white shadow-md' 
                  : 'bg-white/70 text-slate-500 border border-slate-200 hover:bg-white hover:text-slate-700'
              }`}
            >
              <Activity size={18} /> Active Incidents
              <span className={`px-2 py-0.5 ml-1 text-xs rounded-full font-bold ${
                activeTab === 'Active' ? 'bg-white text-[#0A192F]' : 'bg-slate-100 text-slate-600'
              }`}>
                {activeReports.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('History')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all whitespace-nowrap ${
                activeTab === 'History' 
                  ? 'bg-[#0A192F] text-white shadow-md' 
                  : 'bg-white/70 text-slate-500 border border-slate-200 hover:bg-white hover:text-slate-700'
              }`}
            >
              <Clock size={18} /> Resolution History
            </button>

            {(userRole === 'super_admin' || userRole === 'admin') && (
              <>
                <button
                  onClick={() => setActiveTab('Demands')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all whitespace-nowrap ${
                    activeTab === 'Demands' 
                      ? 'bg-[#0A192F] text-white shadow-md' 
                      : 'bg-white/70 text-slate-500 border border-slate-200 hover:bg-white hover:text-slate-700'
                  }`}
                >
                  <Users size={18} /> Access Demands
                </button>

                <button
                  onClick={() => setActiveTab('Manage Data')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all whitespace-nowrap ${
                    activeTab === 'Manage Data' 
                      ? 'bg-[#0A192F] text-white shadow-md' 
                      : 'bg-white/70 text-slate-500 border border-slate-200 hover:bg-white hover:text-slate-700'
                  }`}
                >
                  <Database size={18} /> Manage Data
                </button>

                <button
                  onClick={() => setActiveTab('Logs')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all whitespace-nowrap ${
                    activeTab === 'Logs' 
                      ? 'bg-[#0A192F] text-white shadow-md' 
                      : 'bg-white/70 text-slate-500 border border-slate-200 hover:bg-white hover:text-slate-700'
                  }`}
                >
                  <List size={18} /> Audit Logs
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto px-8 py-6 relative">
          
          {/* Active Incidents Tab */}
          {activeTab === 'Active' && (
            <div className="space-y-4 max-w-4xl">
              {activeReports.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/40 backdrop-blur-sm">
                  <CheckCircle size={48} className="mx-auto mb-4 text-teal-500" />
                  <h3 className="text-lg font-semibold text-slate-600">No active incidents in the pipeline.</h3>
                </div>
              ) : (
                activeReports.map(report => (
                  <div key={report._id} className="p-5 bg-white/70 backdrop-blur-md border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] rounded-xl flex flex-col md:flex-row items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1 w-full">
                      <div className={`mt-1 shrink-0 p-3 rounded-xl ${report.type === 'Auto' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                        {report.type === 'Auto' ? <Cpu size={24} /> : <MessageSquare size={24} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-md ${report.type === 'Auto' ? 'bg-orange-100 text-orange-800' : 'bg-rose-100 text-rose-800'}`}>
                            {report.type} ESCALATION
                          </span>
                          <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                            <Clock size={12} /> {timeAgo(report.createdAt)}
                          </span>
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900 mb-1">
                          [{report.component}] Critical Failure
                        </h2>
                        <p className="text-sm font-medium text-slate-600 mb-3">Facility: <span className="text-slate-900 font-bold">{report.instituteName}</span></p>
                        
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg mb-4 text-sm text-slate-600 italic">
                          "{report.description}"
                        </div>

                        {suggestions[report._id] ? (
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-[200px] overflow-y-auto custom-scrollbar">
                            <div className="flex items-center gap-2 mb-2 text-teal-600 font-bold uppercase text-[11px] tracking-wider sticky top-0 bg-slate-50/90 backdrop-blur pb-1">
                              <Cpu size={14} /> NVIDIA NIM Synthetic Response
                            </div>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{suggestions[report._id]}</p>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleGenerateAISuggestion(report._id)}
                            disabled={generatingFor === report._id}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-100 rounded-md hover:bg-teal-100 transition-colors disabled:opacity-50"
                          >
                            <Cpu size={14} /> {generatingFor === report._id ? 'Generating Action Plan...' : 'Suggest Actionable Fix (AI)'}
                          </button>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleResolveReport(report._id)}
                      className="shrink-0 flex items-center gap-2 px-4 py-2 font-bold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors text-sm shadow-sm"
                    >
                      <CheckCircle size={16} /> Mark Resolved
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Resolution History Tab */}
          {activeTab === 'History' && (
            <div className="max-w-4xl bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              {historyReports.length === 0 ? (
                <div className="py-20 text-center">
                  <Clock size={48} className="mx-auto mb-4 text-slate-300" />
                  <h3 className="text-base font-semibold text-slate-500">No resolution history found.</h3>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {historyReports.map(report => (
                    <div key={report._id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-sm font-semibold text-slate-900">[{report.component}] Failure</h4>
                          <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{report.instituteName}</span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{report.description}</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2 text-xs font-medium text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100">
                        <CheckCircle size={14} /> Resolved {timeAgo(report.resolvedAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Access Demands Tab */}
          {activeTab === 'Demands' && (
            <div className="space-y-4 max-w-4xl">
              {roleRequests.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/40 backdrop-blur-sm">
                  <Users size={48} className="mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-semibold text-slate-600">No pending access requests.</h3>
                </div>
              ) : (
                roleRequests.map(req => (
                  <div key={req._id} className="p-5 bg-white/70 backdrop-blur-md border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-100 rounded-md">
                          {req.requestedRole} Request
                        </span>
                        <span className="text-xs font-medium text-slate-400">{timeAgo(req.createdAt)}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 truncate mb-1" title={req.clerkUserEmail}>{req.clerkUserEmail}</h3>
                      <div className="text-xs text-slate-500">
                        Target Facility: <span className="font-semibold text-slate-700">{req.requestedInstituteId?.name || 'Unknown'}</span> ({req.requestedInstituteId?.district || 'Unknown District'})
                      </div>
                    </div>
                    <div className="shrink-0 flex gap-2 min-w-[160px]">
                      <button
                        onClick={() => handleResolveRequest(req._id, 'approved')}
                        className="flex-1 py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-md transition-colors shadow-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleResolveRequest(req._id, 'rejected')}
                        className="flex-1 py-1.5 px-3 bg-white hover:bg-red-50 border border-red-200 text-red-600 text-sm font-semibold rounded-md transition-colors shadow-sm"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Manage Data Tab */}
          {activeTab === 'Manage Data' && (
            <div className="max-w-5xl">
              <UpdateCentre />
            </div>
          )}

          {/* Audit Logs Tab */}
          {activeTab === 'Logs' && (
            <div className="max-w-5xl">
              {auditLogs.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/40 backdrop-blur-sm">
                  <List size={48} className="mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-semibold text-slate-600">No audit logs available.</h3>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
                  <table className="w-full text-left text-sm text-slate-600 table-fixed min-w-[600px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3 w-40">Timestamp</th>
                        <th className="px-5 py-3 w-32">Action</th>
                        <th className="px-5 py-3 w-48">Collection</th>
                        <th className="px-5 py-3">Actor ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auditLogs.map((log, i) => (
                        <tr key={log._id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="px-5 py-3 font-mono text-[11px] text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${
                              log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              log.action === 'UPDATE' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                              log.action === 'RESOLVE' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                              'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-5 py-3 font-medium text-slate-700 text-xs">{log.targetCollection}</td>
                          <td className="px-5 py-3 font-mono text-[11px] text-slate-400 truncate" title={log.clerkUserId}>
                            {log.clerkUserId}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
