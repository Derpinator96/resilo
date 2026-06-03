import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function StatBento() {
  const [facilitiesCount, setFacilitiesCount] = useState(0)
  const [monthsCount, setMonthsCount] = useState(1)
  const sectionRef = useRef(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!prefersReducedMotion) {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 80%',
        once: true,
        onEnter: () => {
          gsap.to({ val: 0 }, { val: 34, duration: 1.8, ease: 'power2.out', onUpdate: function() { setFacilitiesCount(Math.round(this.targets()[0].val)) } })
          gsap.to({ val: 1 }, { val: 2, duration: 1.8, delay: 0.5, ease: 'power2.out', onUpdate: function() { setMonthsCount(Math.round(this.targets()[0].val)) } })
        }
      })
    } else {
      setFacilitiesCount(34)
      setMonthsCount(2)
    }
  }, [])

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } }
  }

  const card = {
    hidden: { opacity: 0, scale: 0.94, y: 24 },
    show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } }
  }

  return (
    <section ref={sectionRef} className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
      <motion.div 
        variants={container} 
        initial="hidden" 
        whileInView="show" 
        viewport={{ once: true, amount: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Top Left - Dark Media Card */}
        <motion.div variants={card} className="rounded-[24px] overflow-hidden bg-[#1A2020] aspect-square md:aspect-auto md:h-[400px] relative">
          <div className="absolute inset-0">
            <img 
              src="https://res.cloudinary.com/dczsriebs/image/upload/v1780447357/20260506_33205PMByGPSMapCamera.jpg" 
              alt="Facilities" 
              style={{ objectFit: 'cover', width: '100%', height: '100%', borderRadius: 'inherit' }} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </div>
          <div className="relative z-10 p-8 flex flex-col justify-end h-full">
            <h3 className="text-white text-2xl font-light">Solar grids managed across rural facilities.</h3>
          </div>
        </motion.div>

        {/* Top Right - Light Stat Card */}
        <motion.div variants={card} className="rounded-[24px] bg-white p-8 md:p-12 flex flex-col justify-between md:h-[400px] shadow-sm">
          <span className="text-[11px] font-bold text-[#E8581A] uppercase tracking-widest border-b border-dotted border-[#B0C0B0] pb-1 block w-fit">
            Network Scale
          </span>
          <div>
            <div className="text-[100px] leading-none font-[200] text-transparent" style={{ WebkitTextStroke: '1.5px #1A2020' }}>
              {facilitiesCount}
            </div>
            <p className="text-slate-500 font-medium text-lg mt-4 max-w-xs">
              Active facilities streaming real-time IoT metrics to the Resilo dashboard.
            </p>
          </div>
        </motion.div>

        {/* Bottom Left - Light Stat Card */}
        <motion.div variants={card} className="rounded-[24px] bg-[#E8F0E8] p-8 md:p-12 flex flex-col justify-between md:h-[320px]">
          <span className="text-[11px] font-bold text-[#E8581A] uppercase tracking-widest border-b border-dotted border-[#B0C0B0] pb-1 block w-fit">
            Predictive Horizon
          </span>
          <div>
            <div className="text-[80px] leading-none font-[200] text-transparent flex items-baseline" style={{ WebkitTextStroke: '1.5px #1A2020' }}>
              1–{monthsCount}<span className="text-4xl ml-2 font-light text-slate-800" style={{ WebkitTextStroke: '0' }}>mo</span>
            </div>
            <p className="text-slate-600 font-medium mt-4">
              Advanced ML forecasting for critical infrastructure failures.
            </p>
          </div>
        </motion.div>

        {/* Bottom Right - Dark Media Card */}
        <motion.div variants={card} className="rounded-[24px] overflow-hidden bg-[#1A2020] md:h-[320px] relative aspect-[4/3] md:aspect-auto">
          <div className="absolute inset-0">
            <img 
              src="https://res.cloudinary.com/dczsriebs/image/upload/v1780447360/IMG-20260505-WA0037.jpg" 
              alt="Predictive ML" 
              style={{ objectFit: 'cover', width: '100%', height: '100%', borderRadius: 'inherit' }} 
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
