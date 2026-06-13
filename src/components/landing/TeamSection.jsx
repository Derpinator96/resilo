import { motion } from 'framer-motion'

const team = [
  { name: 'Anurag Verma', role: 'Full Stack & AI/IoT Integration' },
  { name: 'Kalyan Deb', role: 'ML & Embedded Systems' },
  { name: 'Debanjan Mazumder', role: 'Hardware & IoT' },
  { name: 'Ketan Sharma', role: 'IoT Infrastructure & Telemetry' },
  { name: 'Anish Jaiswal', role: 'Frontend & UX' },
  { name: 'Satyam Trivedi', role: 'UI/UX Engineering' }
]

export default function TeamSection() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const leftCol = {
    hidden: { opacity: 0, x: -32 },
    show: { opacity: 1, x: 0, transition: { duration: 0.7 } }
  }

  const listContainer = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.4 } }
  }

  const listItem = {
    hidden: { opacity: 0, x: 20 },
    show: { opacity: 1, x: 0 }
  }

  return (
    <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto overflow-hidden">
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
            The Team
          </span>
          <h2 className="text-4xl md:text-5xl font-light text-[#1C1C1C] tracking-tight leading-tight mb-6">
            Built by engineers who care about impact.
          </h2>
          <p className="text-lg text-slate-600 font-medium max-w-md">
            We built Resilo to prove that cutting-edge AI and resilient infrastructure can solve the most pressing challenges in rural healthcare.
          </p>
        </motion.div>

        {/* Right Column - Lime Card */}
        <div className="relative w-full max-w-sm mx-auto">
          {/* Ghost Stack Effect */}
          <div className="absolute inset-0 bg-[#1A3028] rounded-[24px] opacity-20 translate-x-[12px] translate-y-[12px] pointer-events-none"></div>
          
          <motion.div 
            initial={prefersReducedMotion ? "show" : "hidden"} 
            whileInView="show" 
            viewport={{ once: true, amount: 0.2 }}
            className="relative bg-[#C9DC6A] rounded-[24px] p-8 shadow-xl"
          >
            <span className="text-[11px] font-bold text-[#E8581A] uppercase tracking-widest border-b border-dotted border-[#B0C0B0] pb-1 block w-full mb-6">
              TEAM LUMINOVA
            </span>

            <motion.ul variants={listContainer} className="flex flex-col gap-4">
              {team.map((member, i) => (
                <motion.li key={i} variants={listItem} className="flex flex-col border-b border-[#1A3028]/10 pb-3 last:border-0 last:pb-0">
                  <span className="font-bold text-[#1A3028] text-lg">{member.name}</span>
                  <span className="text-sm font-medium text-[#1A3028]/70">{member.role}</span>
                </motion.li>
              ))}
            </motion.ul>

            <div className="mt-8 pt-4 border-t border-[#1A3028]/20">
              <span className="font-bold text-[#1A3028] text-sm block text-center">National Institute of Technology, Raipur</span>
            </div>

          </motion.div>
        </div>

      </div>
    </section>
  )
}
