import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function PipelineSection() {
  const sectionRef = useRef(null)
  const step1Ref = useRef(null)
  const arrow1Ref = useRef(null)
  const step2Ref = useRef(null)
  const arrow2Ref = useRef(null)
  const step3Ref = useRef(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!prefersReducedMotion) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          toggleActions: 'play none none reverse'
        }
      })

      tl.from(step1Ref.current, { opacity: 0, x: -30, duration: 0.5 })
        .from(arrow1Ref.current, { opacity: 0, scaleX: 0, transformOrigin: 'left', duration: 0.3 }, '-=0.1')
        .from(step2Ref.current, { opacity: 0, x: -30, duration: 0.5 }, '-=0.1')
        .from(arrow2Ref.current, { opacity: 0, scaleX: 0, transformOrigin: 'left', duration: 0.3 }, '-=0.1')
        .from(step3Ref.current, { opacity: 0, x: -30, duration: 0.5 }, '-=0.1')
    }

    return () => ScrollTrigger.getAll().forEach(t => t.kill())
  }, [])

  return (
    <section className="py-12 px-6 md:px-12 max-w-7xl mx-auto overflow-hidden">
      <div ref={sectionRef} className="rounded-[24px] bg-[#1A3028] p-10 md:p-16 relative overflow-hidden text-white flex flex-col justify-center min-h-[400px]">
        {/* Background Layer */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://res.cloudinary.com/dczsriebs/image/upload/v1780447361/IMG-20260506-WA0038.jpg" 
            alt="" 
            style={{ objectFit: 'cover', width: '100%', height: '100%', borderRadius: 'inherit', opacity: 0.12 }} 
          />
        </div>

        <div className="relative z-10 w-full">
          <span className="text-[11px] font-bold text-[#C9DC6A] uppercase tracking-widest border-b border-dotted border-[#C9DC6A]/40 pb-1 block w-fit mb-12">
            The Data Pipeline
          </span>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 w-full max-w-4xl mx-auto">
            {/* Step 1 */}
            <div ref={step1Ref} className="flex flex-col items-center text-center gap-4 w-40 shrink-0">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-sm shadow-xl">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9DC6A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <p className="font-medium text-sm text-white/90">IoT Ingestion</p>
            </div>

            {/* Arrow 1 */}
            <div ref={arrow1Ref} className="hidden md:block h-px bg-gradient-to-r from-transparent via-[#C9DC6A]/50 to-transparent flex-1 relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t border-r border-[#C9DC6A] rotate-45"></div>
            </div>
            
            {/* Mobile line connecting */}
            <div className="md:hidden w-px h-12 bg-gradient-to-b from-transparent via-[#C9DC6A]/50 to-transparent"></div>

            {/* Step 2 */}
            <div ref={step2Ref} className="flex flex-col items-center text-center gap-4 w-40 shrink-0">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-sm shadow-xl">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9DC6A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <p className="font-medium text-sm text-white/90">ML Forecast</p>
            </div>

            {/* Arrow 2 */}
            <div ref={arrow2Ref} className="hidden md:block h-px bg-gradient-to-r from-transparent via-[#C9DC6A]/50 to-transparent flex-1 relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t border-r border-[#C9DC6A] rotate-45"></div>
            </div>

            {/* Mobile line connecting */}
            <div className="md:hidden w-px h-12 bg-gradient-to-b from-transparent via-[#C9DC6A]/50 to-transparent"></div>

            {/* Step 3 */}
            <div ref={step3Ref} className="flex flex-col items-center text-center gap-4 w-40 shrink-0">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-sm shadow-xl">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9DC6A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <p className="font-medium text-sm text-white/90">Actionable Alerts</p>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
