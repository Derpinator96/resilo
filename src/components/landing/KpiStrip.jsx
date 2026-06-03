import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function KpiStrip() {
  const [val1, setVal1] = useState(0)
  const [val2, setVal2] = useState(0)
  const stripRef = useRef(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!prefersReducedMotion) {
      ScrollTrigger.create({
        trigger: stripRef.current,
        start: 'top 80%',
        once: true,
        onEnter: () => {
          gsap.to({ val: 0 }, { val: 75, duration: 2, ease: 'power2.out', onUpdate: function() { setVal1(Math.round(this.targets()[0].val)) } })
          gsap.to({ val: 0 }, { val: 85, duration: 2, delay: 0.3, ease: 'power2.out', onUpdate: function() { setVal2(Math.round(this.targets()[0].val)) } })
        }
      })
    } else {
      setVal1(75)
      setVal2(85)
    }

    return () => ScrollTrigger.getAll().forEach(t => t.kill())
  }, [])

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.2 } }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  }

  return (
    <section ref={stripRef} className="w-full bg-[#1A3028] py-20 px-6 mt-12 mb-12">
      <div className="max-w-5xl mx-auto">
        <motion.div 
          variants={container} 
          initial="hidden" 
          whileInView="show" 
          viewport={{ once: true, amount: 0.2 }}
          className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-0"
        >
          {/* Stat 1 */}
          <motion.div variants={item} className="flex-1 text-center md:border-r border-white/10 px-6">
            <div className="text-[80px] md:text-[100px] leading-none font-[200] text-transparent inline-flex items-baseline" style={{ WebkitTextStroke: '1.5px #ffffff' }}>
              {val1}<span className="text-4xl ml-1 font-light text-white" style={{ WebkitTextStroke: '0' }}>%</span>
            </div>
            <p className="text-[#C9DC6A] font-bold tracking-wide mt-4 uppercase text-sm">
              Faster Response Times
            </p>
          </motion.div>

          {/* Stat 2 */}
          <motion.div variants={item} className="flex-1 text-center px-6">
            <div className="text-[80px] md:text-[100px] leading-none font-[200] text-transparent inline-flex items-baseline" style={{ WebkitTextStroke: '1.5px #ffffff' }}>
              {val2}<span className="text-4xl ml-1 font-light text-white" style={{ WebkitTextStroke: '0' }}>%</span>
            </div>
            <p className="text-[#C9DC6A] font-bold tracking-wide mt-4 uppercase text-sm">
              Uptime Improvement
            </p>
          </motion.div>

        </motion.div>
      </div>
    </section>
  )
}
