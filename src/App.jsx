import { Routes, Route, useLocation } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { SignedIn, SignedOut, UserButton, SignInButton, SignUpButton, useUser } from '@clerk/clerk-react'
import InstitutionalHeader from './components/InstitutionalHeader'
import logoDark from './assets/logo-dark.svg'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Sanitation from './pages/Sanitation'
import InstituteList from './pages/InstituteList'
import InstituteDetail from './pages/InstituteDetail'
import AuthorityDashboard from './pages/AuthorityDashboard'
import AIChat from './pages/AIChat'
import SolarForecast from './pages/SolarForecast'
import AccessRequestForm from './components/AccessRequestForm'
import AppNavbar from './components/AppNavbar'
import ApiDocs from './pages/ApiDocs'
import { useRole } from './hooks/useRole'

function GlobalLayout({ children }) {
  const location = useLocation()
  const isLoginPage = location.pathname === '/' || location.pathname === '/signUp'
  const { role, isAuthority } = useRole()

  return (
    <div className="relative min-h-screen bg-gray-50">
      <InstitutionalHeader />
      <AppNavbar />
      {/* Clerk Auth — just the user avatar, positioned inside the navbar row */}
      {!isLoginPage && (
        <div className="fixed top-[36px] right-6 z-50 flex items-center h-[56px]">
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

      {/* Global Sanitation Scanner moved to Auth Header */}
    </div>
  )
}

function App() {
  return (
    <GlobalLayout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signUp" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sanitation" element={<Sanitation />} />
        <Route path="/list/:district/:type" element={<InstituteList />} />
        <Route path="/institute/:id" element={<InstituteDetail />} />
        <Route path="/authority" element={<AuthorityDashboard />} />
        <Route path="/AIChat" element={<AIChat />} />
        <Route path="/solar-forecast" element={<SolarForecast />} />
        <Route path="/api-docs" element={<ApiDocs />} />
      </Routes>
    </GlobalLayout>
  )
}

export default App