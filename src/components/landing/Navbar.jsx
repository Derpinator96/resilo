import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const navRef = useRef(null)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        navRef.current?.classList.add('nav-scrolled')
        setIsScrolled(true)
      } else {
        navRef.current?.classList.remove('nav-scrolled')
        setIsScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Initial check
    handleScroll()
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .navbar-wrapper {
          position: fixed;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100;
          background: transparent;
          border-radius: 999px;
          border: 1px solid transparent;
          padding: 8px 16px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          width: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
        }
        .navbar-wrapper.nav-scrolled {
          background: rgba(20, 30, 22, 0.55);
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 32px rgba(0, 0, 0, 0.25);
        }
      `}} />
      <nav ref={navRef} className="navbar-wrapper">
        <div className="relative w-32 h-10 flex items-center overflow-hidden">
          <img 
            src="https://res.cloudinary.com/dczsriebs/image/upload/v1780447365/primary_logo.svg" 
            alt="Resilo Logo" 
            className={`absolute inset-y-0 left-0 h-8 object-contain transition-all duration-300 ${isScrolled ? 'opacity-0 -translate-x-8' : 'opacity-100 translate-x-0'}`}
          />
          <img 
            src="https://res.cloudinary.com/dczsriebs/image/upload/v1780447358/compact_logo.svg" 
            alt="Resilo Icon" 
            className={`absolute inset-y-0 left-0 h-8 object-contain transition-all duration-300 ${isScrolled ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
          />
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/90 px-6 py-2 rounded-full bg-[#1A2020]/30 border border-white/5 backdrop-blur-md">
          <a href="#mission" className="hover:text-[#C9DC6A] transition-colors">Mission</a>
          <a href="#features" className="hover:text-[#C9DC6A] transition-colors">Features</a>
          <a href="#impact" className="hover:text-[#C9DC6A] transition-colors">Impact</a>
        </div>

        <button
          onClick={() => navigate('/signUp')}
          className="flex items-center justify-between gap-3 pl-5 pr-1 py-1 rounded-full bg-[#C9DC6A] hover:bg-[#B8CD59] transition-transform active:scale-95 text-[#1C1C1C] font-bold text-sm shrink-0"
        >
          Sign Up
          <span className="w-8 h-8 rounded-full bg-[#1A3028] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </span>
        </button>
      </nav>
    </>
  )
}
