import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const districts = [
  { id: 1, name: 'BASTAR DISTRICT', centers: 'CH Bhanpuri · CHC Tokapal · PHC Tirtha · PHC Belar' },
  { id: 2, name: 'BILASPUR DISTRICT', centers: 'CHC Kota · CHC Ratanpur · PHC Hardikala' },
  { id: 3, name: 'RAIGARH DISTRICT', centers: 'CHC Loing · CHC Chaple · PHC Kodatarai · PHC Kaya' }
]

export default function AuditStatus() {
  const progressBarRef = useRef(null)
  const progressBarFill = useRef(null)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    if (!prefersReducedMotion) {
      gsap.to(progressBarFill.current, {
        width: '15%',
        duration: 1.6,
        ease: 'power3.out',
        scrollTrigger: { 
          trigger: progressBarRef.current, 
          start: 'top 80%', 
          once: true 
        }
      })
    } else {
      gsap.set(progressBarFill.current, { width: '15%' })
    }

    return () => ScrollTrigger.getAll().forEach(t => t.kill())
  }, [prefersReducedMotion])

  const leftCol = {
    hidden: { opacity: 0, x: -32 },
    show: { opacity: 1, x: 0, transition: { duration: 0.7 } }
  }

  const cardEntrance = {
    hidden: { opacity: 0, scale: 0.95, rotate: -1 },
    show: { opacity: 1, scale: 1, rotate: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } }
  }

  const listContainer = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } }
  }

  const listItem = {
    hidden: { opacity: 0, x: 16 },
    show: { opacity: 1, x: 0 }
  }

  return (
    <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto overflow-hidden bg-[#E8EFE4] rounded-[24px] mt-12 mb-12">
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
            FIELD AUDIT STATUS
          </span>
          <h2 className="text-4xl md:text-5xl font-light text-[#1C1C1C] tracking-tight leading-tight mb-6">
            6 of 40 Audits Complete
          </h2>
          <p className="text-lg text-slate-600 font-medium mb-10 max-w-md">
            Our team has conducted field visits across 11 facilities in 3 districts of Chhattisgarh. Each completed audit feeds structured baseline data directly into the Resilo ML pipeline. 34 audits remain.
          </p>
        </motion.div>

        {/* Right Column - Amber Card */}
        <motion.div 
          initial={prefersReducedMotion ? "show" : "hidden"} 
          whileInView="show" 
          viewport={{ once: true, amount: 0.25 }}
          variants={cardEntrance}
          className="rounded-[20px] bg-[#F5B944] p-8 shadow-xl"
        >
          <motion.ul variants={listContainer} className="flex flex-col gap-5 mb-8">
            {districts.map((district) => (
              <motion.li key={district.id} variants={listItem} className="flex flex-col border-b border-[#1A2020]/10 pb-4 last:border-0 last:pb-0">
                <span className="font-bold text-[#1A2020] mb-1">{district.name}</span>
                <span className="text-sm font-medium text-[#1A2020]/80">{district.centers}</span>
              </motion.li>
            ))}
          </motion.ul>

          <div className="w-full" ref={progressBarRef}>
            <div className="h-3 w-full bg-[#1A2020]/10 rounded-full overflow-hidden relative">
              <div ref={progressBarFill} className="absolute left-0 top-0 h-full bg-[#E8581A] rounded-full w-0"></div>
            </div>
            <div className="text-right mt-2 font-bold text-sm text-[#1A2020]">6/40</div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
