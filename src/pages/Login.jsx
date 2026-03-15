import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'
import { ArrowRight, User, ShieldCheck, HardHat, Building, MapPin, Key } from 'lucide-react'

// Hardcoded districts for dropdown
const districts = [
  "Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur",
  "Dantewada", "Dhamtari", "Durg", "Gariaband", "Gaurela Pendra Marwahi", "Janjgir-Champa",
  "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Manendragarh-Chirmiri-Bharatpur",
  "Mohla-Manpur-Ambagarh Chowki", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sakti",
  "Sarangarh-Bilaigarh", "Sukma", "Surajpur", "Surguja", "Khairagarh-Chhuikhadan-Gandai"
].sort()

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [activeTab, setActiveTab] = useState('citizen')

  // Staff Form State
  const [staffDistrict, setStaffDistrict] = useState('')
  const [staffInstituteType, setStaffInstituteType] = useState('School')
  const [availableInstitutes, setAvailableInstitutes] = useState([])
  const [staffInstituteId, setStaffInstituteId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [staffPass, setStaffPass] = useState('')

  // Authority Form State
  const [authEmail, setAuthEmail] = useState('')
  const [authPass, setAuthPass] = useState('')

  // Fetch mock institutes when district/type changes for Staff login
  useEffect(() => {
    if (staffDistrict) {
      // Trigger a network call, but we can just use the mock endpoint for now
      fetch(`http://localhost:5000/api/institutes?district=${staffDistrict}&type=${staffInstituteType}`)
        .then(res => res.json())
        .then(data => setAvailableInstitutes(data))
        .catch(err => console.error(err))
    }
  }, [staffDistrict, staffInstituteType])

  const handleCitizenLogin = () => {
    login('Citizen')
    navigate('/dashboard')
  }

  const handleStaffLogin = (e) => {
    e.preventDefault()
    if (!staffInstituteId || !staffId || !staffPass) return;
    // Mock login success
    login('Staff', { instituteId: staffInstituteId, staffId })
    // Route to the selected institute
    navigate(`/institute/${staffInstituteId}`)
  }

  const handleAuthorityLogin = (e) => {
    e.preventDefault()
    if (!authEmail || !authPass) return;
    login('Authority')
    // Route to Alert Center (build later)
    navigate('/authority')
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden bg-slate-50">

      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-stripe-gradient opacity-20 blur-3xl mix-blend-multiply pointer-events-none animate-fade-in"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-stripe-gradient opacity-10 blur-3xl mix-blend-multiply pointer-events-none animate-fade-in" style={{ animationDelay: '0.2s' }}></div>

      <div className="z-10 w-full max-w-4xl">

        {/* Header */}
        <div className="mb-12 text-center animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 shadow-xl rounded-3xl bg-stripe-gradient shadow-indigo-500/20">
            <span className="text-4xl font-black text-white">R</span>
          </div>
          <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-slate-900">
            Project <span className="text-gradient">RESILO</span>
          </h1>
          <p className="max-w-xl mx-auto text-lg text-slate-500">
            The next-generation infrastructure monitoring platform connecting rural assets, AI triage, and central authorities.
          </p>
        </div>

        {/* Unified Auth Box */}
        <div className="p-2 mx-auto shadow-2xl bg-glass rounded-3xl animate-slide-up" style={{ animationDelay: '0.1s' }}>

          {/* Tabs */}
          <div className="flex gap-2 p-2 mb-6 bg-white/50 rounded-2xl">
            <button
              onClick={() => setActiveTab('citizen')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'citizen' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-white/40'}`}
            >
              <User size={18} /> Citizen Access
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'staff' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-white/40'}`}
            >
              <HardHat size={18} /> Facility Staff
            </button>
            <button
              onClick={() => setActiveTab('authority')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'authority' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:bg-white/40'}`}
            >
              <ShieldCheck size={18} /> Authority Portal
            </button>
          </div>

          {/* Render Active Form */}
          <div className="p-6 md:p-8">

            {/* CITIZEN */}
            {activeTab === 'citizen' && (
              <div className="text-center animate-fade-in">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-indigo-100 rounded-full text-indigo-600">
                  <User size={32} />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-slate-800">Public Dashboard</h2>
                <p className="mb-8 text-slate-500">
                  Access transparent, global reporting on infrastructure resilience across completely unlocked districts.
                </p>
                <button
                  onClick={handleCitizenLogin}
                  className="flex items-center justify-center w-full gap-2 py-5 text-lg font-bold text-white transition-all shadow-lg rounded-2xl bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/30 active:scale-[0.98]"
                >
                  Continue to Global Dashboard <ArrowRight size={20} />
                </button>
              </div>
            )}

            {/* STAFF */}
            {activeTab === 'staff' && (
              <form onSubmit={handleStaffLogin} className="animate-fade-in text-left">
                <h2 className="mb-6 text-2xl font-bold text-slate-800">Staff Authorization</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-slate-600">District Assignment</label>
                    <div className="relative">
                      <MapPin className="absolute z-10 text-slate-400 left-4 top-4" size={20} />
                      <select
                        required
                        className="w-full py-4 pl-12 pr-4 text-slate-700 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none font-medium"
                        value={staffDistrict}
                        onChange={e => setStaffDistrict(e.target.value)}
                      >
                        <option value="">Select District</option>
                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-slate-600">Facility Type</label>
                    <div className="relative">
                      <Building className="absolute z-10 text-slate-400 left-4 top-4" size={20} />
                      <select
                        className="w-full py-4 pl-12 pr-4 text-slate-700 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none font-medium"
                        value={staffInstituteType}
                        onChange={e => setStaffInstituteType(e.target.value)}
                      >
                        <option value="School">School</option>
                        <option value="Healthcare">Healthcare Center</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block mb-2 text-sm font-semibold text-slate-600">Assigned Institute</label>
                  <select
                    required
                    disabled={!staffDistrict || availableInstitutes.length === 0}
                    className="w-full py-4 px-4 text-slate-700 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none font-medium disabled:opacity-50 disabled:bg-slate-50"
                    value={staffInstituteId}
                    onChange={e => setStaffInstituteId(e.target.value)}
                  >
                    <option value="">Select your facility</option>
                    {availableInstitutes.map(inst => (
                      <option key={inst._id} value={inst._id}>{inst.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-slate-600">Staff ID</label>
                    <div className="relative">
                      <User className="absolute z-10 text-slate-400 left-4 top-4" size={20} />
                      <input
                        type="text"
                        required
                        placeholder="e.g. EMP-1024"
                        className="w-full py-4 pl-12 pr-4 text-slate-700 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                        value={staffId}
                        onChange={e => setStaffId(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-slate-600">Password</label>
                    <div className="relative">
                      <Key className="absolute z-10 text-slate-400 left-4 top-4" size={20} />
                      <input
                        type="password"
                        required
                        placeholder="Enter Password"
                        className="w-full py-4 pl-12 pr-4 text-slate-700 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                        value={staffPass}
                        onChange={e => setStaffPass(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="flex items-center justify-center w-full gap-2 py-5 text-lg font-bold text-white transition-all shadow-lg rounded-2xl bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-500/30 active:scale-[0.98]"
                >
                  Secure Log In <ArrowRight size={20} />
                </button>
              </form>
            )}

            {/* AUTHORITY */}
            {activeTab === 'authority' && (
              <form onSubmit={handleAuthorityLogin} className="animate-fade-in text-left">
                <h2 className="mb-6 text-2xl font-bold text-slate-800">State Authority Portal</h2>

                <div className="mb-4">
                  <label className="block mb-2 text-sm font-semibold text-slate-600">Official Email</label>
                  <input
                    type="email"
                    required
                    placeholder="name@cg.gov.in"
                    className="w-full py-4 px-5 text-slate-700 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-rose-500 focus:outline-none font-medium"
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                  />
                </div>

                <div className="mb-8">
                  <label className="block mb-2 text-sm font-semibold text-slate-600">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter robust password"
                    className="w-full py-4 px-5 text-slate-700 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-rose-500 focus:outline-none font-medium"
                    value={authPass}
                    onChange={e => setAuthPass(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="flex items-center justify-center w-full gap-2 py-5 text-lg font-bold text-white transition-all shadow-lg rounded-2xl bg-rose-600 hover:bg-rose-700 hover:shadow-rose-500/30 active:scale-[0.98]"
                >
                  Enter Alert Center <ArrowRight size={20} />
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}