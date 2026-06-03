import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function Hero() {
  const lineRef = useRef(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!prefersReducedMotion) {
      gsap.fromTo(lineRef.current, 
        { scaleY: 0 }, 
        { scaleY: 1, transformOrigin: 'top', duration: 1.2, delay: 1.5, ease: 'power2.out' }
      )
      
      ScrollTrigger.create({
        trigger: '#hero',
        start: '50% top',
        onEnter: () => gsap.to(lineRef.current, { opacity: 0, duration: 0.3 }),
        onLeaveBack: () => gsap.to(lineRef.current, { opacity: 1, duration: 0.3 })
      })
    }

    return () => ScrollTrigger.getAll().forEach(t => t.kill())
  }, [])

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.18, delayChildren: 0.3 } }
  }
  
  const item = {
    hidden: { opacity: 0, y: 32 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
  }

  return (
    <section id="hero" className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-slate-900 rounded-[24px]">
      {/* Background Media Container */}
      <div className="absolute inset-0 z-0">
        <video 
          src="https://res.cloudinary.com/dczsriebs/video/upload/v1780447390/VID20260505171542.mp4" 
          autoPlay 
          muted 
          loop 
          playsInline 
          style={{ objectFit: 'cover', width: '100%', height: '100%', borderRadius: 'inherit' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A140E]/45 to-[#0A140E]/70 z-10" />
      </div>

      <div className="relative z-20 text-center px-6 max-w-4xl w-full pt-16">
        <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col items-center">
          
          <motion.div variants={item} className="mb-6 inline-block">
            <span className="text-[11px] font-bold text-[#E8581A] uppercase tracking-widest border-b border-dotted border-[#B0C0B0] pb-1 block w-full text-center">
              Intelligent IoT Diagnostics
            </span>
          </motion.div>

          <motion.h1 variants={item} className="text-5xl md:text-7xl font-light text-white mb-2 tracking-tight">
            Monitor Power.
          </motion.h1>
          <motion.h1 variants={item} className="text-5xl md:text-7xl font-light text-white mb-8 tracking-tight">
            Deliver Care.
          </motion.h1>

          <motion.div variants={item}>
            <button className="flex items-center justify-between gap-4 pl-6 pr-1 py-1 rounded-full bg-[#C9DC6A] hover:bg-[#B8CD59] transition-transform active:scale-95 text-slate-900 font-bold text-lg mt-4">
              Explore Platform
              <span className="w-12 h-12 rounded-full bg-[#1A3028] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <polyline points="19 12 12 19 5 12"></polyline>
                </svg>
              </span>
            </button>
          </motion.div>
        </motion.div>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4">
        <motion.div 
          animate={{ y: [0, 8, 0] }} 
          transition={{ repeat: Infinity, duration: 1.4 }}
          className="text-white/70"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </motion.div>
        <div ref={lineRef} className="w-[1px] h-16 bg-white/50" />
      </div>
    </section>
  )
}
