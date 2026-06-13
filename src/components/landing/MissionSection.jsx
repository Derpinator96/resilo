import { motion } from 'framer-motion'

export default function MissionSection() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const headingVariant = {
    hidden: { opacity: 0, x: -40 },
    show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
  }

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.15 } }
  }

  const pVariant = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
  }

  return (
    <section id="mission" className="py-24 px-6 md:px-12 max-w-7xl mx-auto overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-start">
        <motion.div
          initial={prefersReducedMotion ? "show" : "hidden"}
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={headingVariant}
        >
          <span className="text-[11px] font-bold text-[#E8581A] uppercase tracking-widest border-b border-dotted border-[#B0C0B0] pb-1 block w-fit mb-6">
            The Mission
          </span>
          <h2 className="text-4xl md:text-5xl font-light text-[#1C1C1C] tracking-tight leading-tight">
            Bridging the gap between energy reliability and healthcare access.
          </h2>
        </motion.div>

        <motion.div
          initial={prefersReducedMotion ? "show" : "hidden"}
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={container}
          className="flex flex-col gap-6 text-lg text-slate-600 font-medium leading-relaxed"
        >
          <motion.p variants={pVariant}>
            Rural facilities are the backbone of community health, yet they operate in environments where power grids are unpredictable. 
            When electricity fails, critical equipment like surgical lamps and baby warmers go offline.
          </motion.p>
          <motion.p variants={pVariant}>
            Resilo provides an intelligent layer on top of existing solar infrastructure. By streaming telemetry data and combining it with 
            advanced machine learning, we can forecast exactly how much power a facility will generate in the coming days.
          </motion.p>
          <motion.p variants={pVariant}>
            This means facility administrators are no longer guessing. They know with certainty if their energy reserves can support 
            critical healthcare deliveries.
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}
