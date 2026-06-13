import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function FooterCta() {
  const footerCtaRef = useRef(null)
  const footerHeadingRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!prefersReducedMotion) {
      gsap.to(footerHeadingRef.current, {
        y: -30,
        ease: 'none',
        scrollTrigger: {
          trigger: footerCtaRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      })
    }

    return () => ScrollTrigger.getAll().forEach(t => t.kill())
  }, [])

  return (
    <section ref={footerCtaRef} className="py-32 px-6 bg-[#1A2020] text-center rounded-b-[24px] overflow-hidden relative mt-12">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-[#C9DC6A] opacity-[0.03] blur-3xl rounded-full pointer-events-none"></div>

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
        <h2 ref={footerHeadingRef} className="text-5xl md:text-7xl font-light text-white mb-10 tracking-tight leading-tight">
          Ready to secure your <br className="hidden md:block"/> facility's future?
        </h2>
        
        <button
          onClick={() => navigate('/signUp')}
          className="flex items-center justify-between gap-4 pl-8 pr-2 py-2 rounded-full bg-[#C9DC6A] hover:bg-[#B8CD59] transition-transform active:scale-95 text-[#1C1C1C] font-bold text-xl shadow-2xl shadow-[#C9DC6A]/20"
        >
          Join Resilo Today
          <span className="w-14 h-14 rounded-full bg-[#1A3028] flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </span>
        </button>

        <div className="mt-20 pt-8 border-t border-white/10 w-full flex flex-col md:flex-row items-center justify-between text-white/40 text-sm font-medium">
          <p>© 2026 Project Resilo. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <button onClick={() => navigate('/api-docs')} className="hover:text-white transition-colors">API Docs</button>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </section>
  )
}
