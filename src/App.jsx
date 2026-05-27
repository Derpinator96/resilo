import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Sparkles, ShieldAlert } from 'lucide-react'
import { SignedIn, SignedOut, UserButton, SignInButton, SignUpButton, useUser } from '@clerk/clerk-react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Sanitation from './pages/Sanitation'
import InstituteList from './pages/InstituteList'
import InstituteDetail from './pages/InstituteDetail'
import AuthorityDashboard from './pages/AuthorityDashboard'
import AIChat from './pages/AIChat'
import SolarForecast from './pages/SolarForecast'
import AccessRequestForm from './components/AccessRequestForm'

function GlobalLayout({ children }) {
  const location = useLocation()
  const isLoginPage = location.pathname === '/'
  const { user } = useUser()
  const role = user?.publicMetadata?.role || 'community'
  const isAuthority = role === 'admin' || role === 'super_admin'

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Clerk Auth Header */}
      {!isLoginPage && (
        <div className="absolute top-4 right-6 z-50 flex items-center gap-4">
          {isAuthority && location.pathname !== '/authority' && (
            <Link 
              to="/authority" 
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-700 bg-white border-2 border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
            >
              <ShieldAlert size={16} className="text-rose-500" />
              Authority Portal
            </Link>
          )}
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Sign In</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton>
              <UserButton.UserProfilePage 
                label="Role Access" 
                url="role-access" 
                labelIcon={<Sparkles size={16} />}
              >
                <AccessRequestForm />
              </UserButton.UserProfilePage>
            </UserButton>
          </SignedIn>
        </div>
      )}

      {children}

      {/* Global Sanitation Scanner FAB (Hidden on Login & Sanitation itself) */}
      {!isLoginPage && location.pathname !== '/sanitation' && (
        <Link
          to="/sanitation"
          className="fixed z-50 flex items-center gap-2 px-5 py-4 font-bold text-white shadow-xl bg-slate-900 rounded-full bottom-6 right-6 hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all duration-300"
        >
          <Sparkles size={20} className="text-blue-400" />
          <span className="hidden sm:inline">AI Sanitation Scan</span>
        </Link>
      )}
    </div>
  )
}

function App() {
  return (
    <GlobalLayout>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sanitation" element={<Sanitation />} />
        <Route path="/list/:district/:type" element={<InstituteList />} />
        <Route path="/institute/:id" element={<InstituteDetail />} />
        <Route path="/authority" element={<AuthorityDashboard />} />
        <Route path="/AIChat" element={<AIChat />} />
        <Route path="/solar-forecast" element={<SolarForecast />} />
      </Routes>
    </GlobalLayout>
  )
}

export default App