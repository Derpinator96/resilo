import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

// ✅ Import the Provider from AuthProvider.js (not AuthContext.js)
import { AuthProvider } from './context/AuthProvider'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Sanitation from './pages/Sanitation'
import InstituteList from './pages/InstituteList'
import InstituteDetail from './pages/InstituteDetail'
import AuthorityDashboard from './pages/AuthorityDashboard'
import AIChat from './pages/AIChat'

function GlobalLayout({ children }) {
  const location = useLocation()
  const isLoginPage = location.pathname === '/'

  return (
    <div className="relative min-h-screen bg-gray-50">
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
    <AuthProvider>
      <GlobalLayout>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sanitation" element={<Sanitation />} />
          <Route path="/list/:district/:type" element={<InstituteList />} />
          <Route path="/institute/:id" element={<InstituteDetail />} />
          <Route path="/authority" element={<AuthorityDashboard />} />
          <Route path="/AIChat" element={<AIChat />} />
        </Routes>
      </GlobalLayout>
    </AuthProvider>
  )
}

export default App