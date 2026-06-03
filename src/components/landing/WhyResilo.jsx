import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const cards = [
  { id: 1, title: 'Real-time Tracking', text: 'Live telemetry updates every 500ms ensuring absolute visibility into power generation and consumption.' },
  { id: 2, title: 'AI Diagnostics', text: 'Computer vision models analyze sanitation and infrastructure hazards instantly.' },
  { id: 3, title: 'Secure Auditing', text: 'Tamper-resistant logs tracking all system interventions and status changes.' }
]

export default function WhyResilo() {
  const [index, setIndex] = useState(0)
  const navigate = useNavigate()
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const nextCard = () => setIndex((prev) => (prev + 1) % cards.length)
  const prevCard = () => setIndex((prev) => (prev - 1 + cards.length) % cards.length)

  const leftCol = {
    hidden: { opacity: 0, x: -32 },
    show: { opacity: 1, x: 0, transition: { duration: 0.7 } }
  }

  const rightCol = {
    hidden: { opacity: 0, y: 40, rotate: 2 },
    show: { opacity: 1, y: 0, rotate: 0, transition: { duration: 0.7 } }
  }

  return (
    <section id="features" className="py-24 px-6 md:px-12 max-w-7xl mx-auto overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        
        {/* Left Column */}
        <motion.div 
          initial={prefersReducedMotion ? "show" : "hidden"} 
          whileInView="show" 
          viewport={{ once: true, amount: 0.25 }}
          variants={leftCol}
          className="flex flex-col items-start"
        >
          <span className="text-[11px] font-bold text-[#E8581A] uppercase tracking-widest border-b border-dotted border-[#B0C0B0] pb-1 block w-fit mb-6">
            Why Resilo?
          </span>
          <h2 className="text-4xl md:text-5xl font-light text-slate-900 tracking-tight leading-tight mb-6">
            Smarter infrastructure for a resilient future.
          </h2>
          <p className="text-lg text-slate-600 font-medium mb-10 max-w-md">
            Our platform goes beyond just mapping facilities. We bring active telemetry, predictive maintenance, and strict 
            role-based authority to rural development.
          </p>
          <button
            onClick={() => navigate('/signUp')}
            className="flex items-center justify-between gap-4 pl-6 pr-1 py-1 rounded-full bg-[#1A3028] hover:bg-[#13241d] transition-transform active:scale-95 text-white font-bold text-lg"
          >
            Get Started
            <span className="w-12 h-12 rounded-full bg-[#C9DC6A] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A3028" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </span>
          </button>
        </motion.div>

        {/* Right Column - Stacked Cards */}
        <motion.div 
          initial={prefersReducedMotion ? "show" : "hidden"} 
          whileInView="show" 
          viewport={{ once: true, amount: 0.25 }}
          variants={rightCol}
          className="relative h-[320px] w-full max-w-sm mx-auto perspective-1000"
        >
          {/* Ghost Card Behind */}
          <div className="absolute inset-0 bg-[#E8581A] rounded-[24px] opacity-[0.35] translate-x-[12px] translate-y-[12px] scale-[0.96] shadow-lg pointer-events-none transition-all duration-300"></div>

          {/* Active Card Carousel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={prefersReducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 40, scale: 0.96 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
              className="absolute inset-0 bg-[#F4A261] rounded-[24px] p-10 flex flex-col justify-center shadow-xl z-10"
            >
              <h3 className="text-3xl font-bold text-[#1A2020] mb-4 tracking-tight">
                {cards[index].title}
              </h3>
              <p className="text-[#1A2020]/80 font-medium text-lg leading-relaxed">
                {cards[index].text}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-4">
            <button onClick={prevCard} className="w-12 h-12 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-colors text-slate-800">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button onClick={nextCard} className="w-12 h-12 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-colors text-slate-800">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
