import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { LayoutDashboard, Sun, MapPin, Code2, ShieldAlert, ScanLine, Menu, X } from 'lucide-react'
import { useRole } from '../hooks/useRole'
import logoDark from '../assets/logo-dark.svg'

export default function AppNavbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthority } = useRole()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Do not render on landing/login
  const isLoginPage = location.pathname === '/' || location.pathname === '/signUp'
  if (isLoginPage) return null

  const handleFacilitiesClick = (e) => {
    e.preventDefault()
    // The instructions say: "clicking it should navigate to /list without a pre-selected district, 
    // or if that route requires a district param, navigate to /dashboard with a ?scrollTo=districts query param"
    // Since our route is `/list/:district/:type`, let's just go to dashboard.
    navigate('/dashboard')
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    }, 100)
    setMobileMenuOpen(false)
  }

  const isFacilitiesActive = location.pathname.startsWith('/list') || location.pathname.startsWith('/institute')

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Solar Forecast', path: '/solar-forecast', icon: Sun },
    { label: 'Facilities', path: '/list', icon: MapPin, onClick: handleFacilitiesClick, isActive: isFacilitiesActive },
    { label: 'API Docs', path: '/api-docs', icon: Code2 },
    ...(isAuthority ? [{ label: 'Authority', path: '/authority', icon: ShieldAlert }] : []),
    { label: 'AI Scanner', path: '/sanitation', icon: ScanLine }
  ]

  const linkClass = ({ isActive }, customActive = false) => 
    `flex items-center gap-2 px-[14px] py-[6px] rounded-full font-medium text-sm transition-all ` + 
    (isActive || customActive 
      ? 'bg-[#0A192F] text-white font-semibold' 
      : 'text-slate-600 bg-transparent hover:bg-slate-50 hover:text-[#0A192F]')

  const mobileLinkClass = ({ isActive }, customActive = false) => 
    `flex items-center gap-3 w-full p-3 rounded-xl font-medium text-base transition-all ` + 
    (isActive || customActive 
      ? 'bg-[#0A192F] text-white font-semibold' 
      : 'text-slate-600 bg-transparent hover:bg-slate-50 hover:text-[#0A192F]')

  return (
    <div className="fixed top-[36px] w-full z-40 h-[56px] bg-white border-b border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="max-w-[1200px] mx-auto h-full px-8 flex items-center justify-between">
        
        {/* Left: Mobile Menu Toggle / Logo */}
        <div className="flex items-center gap-4">
          <button 
            className="md:hidden p-1 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <img 
            src={logoDark} 
            alt="Resilo Logo" 
            className="w-24 cursor-pointer" 
            onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }}
          />
        </div>

        {/* Center: Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              to={link.path}
              onClick={(e) => {
                 if (link.onClick) link.onClick(e)
                 else setMobileMenuOpen(false)
              }}
              className={(navData) => linkClass(navData, link.isActive)}
            >
              <link.icon size={16} />
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Right: Reserved for Auth Header */}
        <div className="w-8"></div>
        
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-[56px] left-0 right-0 bg-white border-b border-slate-200 shadow-lg p-4 z-[39] md:hidden">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.label}
                to={link.path}
                onClick={(e) => {
                  if (link.onClick) link.onClick(e)
                  else setMobileMenuOpen(false)
                }}
                className={(navData) => mobileLinkClass(navData, link.isActive)}
              >
                <link.icon size={18} />
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </div>
  )
}
