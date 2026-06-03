import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Navbar from '../components/landing/Navbar'
import Hero from '../components/landing/Hero'
import StatBento from '../components/landing/StatBento'
import MissionSection from '../components/landing/MissionSection'
import PipelineSection from '../components/landing/PipelineSection'
import WhyResilo from '../components/landing/WhyResilo'
import KpiStrip from '../components/landing/KpiStrip'
import AuditStatus from '../components/landing/AuditStatus'
import TeamSection from '../components/landing/TeamSection'
import FooterCta from '../components/landing/FooterCta'

export default function LandingPage() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    return () => ScrollTrigger.getAll().forEach(t => t.kill())
  }, [])

  return (
    <div className="bg-[#1C1C1C] p-[10px] min-h-screen w-full">
      <div className="bg-[#F0F5F0] rounded-[24px] overflow-hidden min-h-[calc(100vh-20px)] relative text-slate-900 mx-auto max-w-[1440px] shadow-2xl">
        <Navbar />
        <Hero />
        <StatBento />
        <MissionSection />
        <PipelineSection />
        <WhyResilo />
        <KpiStrip />
        <AuditStatus />
        <TeamSection />
        <FooterCta />
      </div>
    </div>
  )
}
