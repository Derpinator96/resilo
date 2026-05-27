import React from 'react';
import { motion } from 'framer-motion';
import { Target, Zap, Activity, BarChart, Server, Globe, Code, GraduationCap } from 'lucide-react';
import profGhoshImg from '../assets/prof_ghosh.jpeg';
import debanjanImg from '../assets/debanjan.jpeg';
import kalyanImg from '../assets/kalyan.jpeg';

function AboutTeamSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.25 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] } 
    }
  };

  return (
    <section id="about-us" className="relative w-full overflow-hidden bg-[#f8fafc] py-32">

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="flex flex-col gap-24"
        >
          
          {/* 1. Lead Mentor Section */}
          <motion.div variants={itemVariants} className="mx-auto w-full max-w-6xl">
            <div className="flex flex-col lg:flex-row items-stretch gap-12 lg:gap-16 w-full">
              
              {/* Left Column: Portrait Photo */}
              <div className="w-full lg:w-[40%] shrink-0 flex justify-center lg:justify-start">
                <div className="relative w-full max-w-105 h-100 lg:h-full min-h-100 lg:min-h-130 rounded-[28px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.06)] border-4 border-white bg-[#f8fafc]">
                  <img 
                    src={profGhoshImg} 
                    alt="Prof. S. Ghosh" 
                    className="absolute inset-0 w-full h-full object-cover object-[center_22%]"
                  />
                  <div className="absolute inset-0 rounded-3xl border border-blue-500/10 pointer-events-none"></div>
                </div>
              </div>

              {/* Right Column: Integrated Content */}
              <div className="flex-1 flex flex-col justify-start">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600/80">
                    Project Lead & Research Mentor
                  </span>
                </div>

                <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-2 tracking-tight">
                  Prof. S. Ghosh
                </h2>
                <p className="text-xl font-bold text-blue-600 mb-6">
                  Project Mentor & Research Guide
                </p>

                {/* Institutional Details */}
                <div className="flex items-center gap-3 mb-6 bg-white border border-slate-100 rounded-2xl p-4 max-w-md shadow-xs">
                  <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-xs border border-slate-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-800 text-sm">Department of Electrical Engineering</p>
                    <p className="text-slate-500 text-xs font-semibold">National Institute of Technology Raipur</p>
                  </div>
                </div>

                {/* Detailed Description */}
                <div className="space-y-4 mb-8 text-slate-600 leading-relaxed font-semibold text-[0.98rem] max-w-3xl">
                  <p>
                    Prof. S. Ghosh is a distinguished academician and researcher with extensive expertise in renewable energy systems, optimization, cyber-physical systems, and smart energy solutions.
                  </p>
                  <p>
                    His guidance and vision drive our project towards building intelligent, sustainable, and impactful solutions for real-world healthcare infrastructure.
                  </p>
                </div>

                <div className="h-px w-full bg-slate-200/60 mb-8"></div>

                {/* Expertise Showcase */}
                <div className="mb-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Areas of Research & Expertise</p>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { icon: <Zap className="h-4 w-4" />, name: "Renewable Energy Systems" },
                      { icon: <Activity className="h-4 w-4" />, name: "Energy Optimization" },
                      { icon: <Target className="h-4 w-4" />, name: "Cyber-Physical Systems" },
                      { icon: <BarChart className="h-4 w-4" />, name: "Smart Grid Analytics" }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 rounded-full bg-blue-50/40 border border-blue-100/60 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:border-blue-200 transition-all duration-300">
                        <span className="text-blue-600">{item.icon}</span>
                        {item.name}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Badges */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
                    <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[13px] font-black text-slate-800">Academic Mentor</p>
                      <p className="text-[10.5px] text-slate-500 font-medium">Guiding research and innovation in solar energy and smart systems</p>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
                    <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[13px] font-black text-slate-800">Research Leader</p>
                      <p className="text-[10.5px] text-slate-500 font-medium">Inspiring the next generation of engineers and innovators</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>

          {/* 4. Development Section */}
          <div className="flex flex-col items-center gap-16">
            <motion.div variants={itemVariants} className="flex flex-col items-center">
              <span className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
                Development & Auditing Team
              </span>
              <div className="h-0.5 w-10 rounded-full bg-slate-200"></div>
            </motion.div>

            {/* Card 1: Kalyan */}
            <motion.div variants={itemVariants} className="mx-auto w-full max-w-6xl">
              <div className="flex flex-col lg:flex-row items-stretch gap-12 lg:gap-16 w-full">
                
                {/* Left Column: Portrait Photo */}
                <div className="w-full lg:w-[40%] shrink-0 flex justify-center lg:justify-start">
                  <div className="relative w-full max-w-105 h-100 lg:h-full min-h-100 lg:min-h-125 rounded-[28px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.06)] border-4 border-white bg-[#f8fafc] group">
                    <img 
                      src={kalyanImg} 
                      alt="Kalyan Deb" 
                      className="absolute inset-0 w-full h-full object-cover object-center grayscale-[0.3] hover:grayscale-0 transition-all duration-700"
                    />
                    <div className="absolute inset-0 rounded-3xl border border-blue-500/10 pointer-events-none"></div>
                  </div>
                </div>

                {/* Right Column: Integrated Content */}
                <div className="flex-1 flex flex-col justify-start">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100/50">
                      <Code className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600/80">Developer</span>
                  </div>

                  <h3 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Kalyan Deb</h3>
                  <p className="text-xl font-bold text-blue-600 mb-1">Full Stack & ML Developer</p>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-8">Electrical Engineering</p>

                  <div className="h-px w-full bg-slate-200/60 mb-8"></div>

                  {/* Quote */}
                  <div className="relative mb-10">
                    <div className="absolute -left-2 -top-4 text-blue-100 opacity-50">
                      <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 32 32"><path d="M10 8v8H6v2h4v8H2v-8h4V8h4zm16 0v8h-4v2h4v8h-8v-8h4V8h4z"></path></svg>
                    </div>
                    <p className="relative z-10 text-slate-600 text-lg italic leading-relaxed pl-8 font-semibold">
                      “Focusing on scalable backend architectures and data-driven systems to automate smart healthcare energy auditing.”
                    </p>
                  </div>

                  {/* Tech Stack */}
                  <div className="mb-10">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tech Stack</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { icon: <Server className="h-4 w-4" />, name: "Node.js" },
                        { icon: <Target className="h-4 w-4" />, name: "MongoDB" },
                        { icon: <Zap className="h-4 w-4" />, name: "ML Integration" },
                        { icon: <Activity className="h-4 w-4" />, name: "Audit Automation" }
                      ].map((tech, i) => (
                        <div key={i} className="flex items-center gap-2.5 rounded-xl bg-slate-50 border border-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition-all hover:border-blue-200 hover:bg-blue-50/30">
                          <span className="text-blue-600">{tech.icon}</span>
                          {tech.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>

            {/* Card 2: Debanjan */}
            <motion.div variants={itemVariants} className="mx-auto w-full max-w-6xl">
              <div className="flex flex-col lg:flex-row items-stretch gap-12 lg:gap-16 w-full">
                
                {/* Left Column: Portrait Photo */}
                <div className="w-full lg:w-[40%] shrink-0 flex justify-center lg:justify-start">
                  <div className="relative w-full max-w-105 h-100 lg:h-full min-h-100 lg:min-h-125 rounded-[28px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.06)] border-4 border-white bg-[#f8fafc] group">
                    <img 
                      src={debanjanImg} 
                      alt="Debanjan Mazumder" 
                      className="absolute inset-0 w-full h-full object-cover object-center grayscale-[0.3] hover:grayscale-0 transition-all duration-700"
                    />
                    <div className="absolute inset-0 rounded-3xl border border-blue-500/10 pointer-events-none"></div>
                  </div>
                </div>

                {/* Right Column: Integrated Content */}
                <div className="flex-1 flex flex-col justify-start">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100/50">
                      <Code className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600/80">Developer</span>
                  </div>

                  <h3 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Debanjan Mazumder</h3>
                  <p className="text-xl font-bold text-blue-600 mb-1">Frontend & ML Developer</p>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-8">Electrical Engineering</p>

                  <div className="h-px w-full bg-slate-200/60 mb-8"></div>

                  {/* Quote */}
                  <div className="relative mb-10">
                    <div className="absolute -left-2 -top-4 text-blue-100 opacity-50">
                      <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 32 32"><path d="M10 8v8H6v2h4v8H2v-8h4V8h4zm16 0v8h-4v2h4v8h-8v-8h4V8h4z"></path></svg>
                    </div>
                    <p className="relative z-10 text-slate-600 text-lg italic leading-relaxed pl-8 font-semibold">
                      “Integrating machine learning into renewable energy solutions through intuitive, high-performance dashboard architectures.”
                    </p>
                  </div>

                  {/* Tech Stack */}
                  <div className="mb-10">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tech Stack</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { icon: <Target className="h-4 w-4" />, name: "React" },
                        { icon: <Zap className="h-4 w-4" />, name: "ML Systems" },
                        { icon: <BarChart className="h-4 w-4" />, name: "Dashboard UI" },
                        { icon: <Server className="h-4 w-4" />, name: "Renewable Systems" }
                      ].map((tech, i) => (
                        <div key={i} className="flex items-center gap-2.5 rounded-xl bg-slate-50 border border-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition-all hover:border-blue-200 hover:bg-blue-50/30">
                          <span className="text-blue-600">{tech.icon}</span>
                          {tech.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>

        </motion.div>
      </div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Animated Gradient Hero Section */}
      <section className="relative overflow-hidden bg-[#011425] py-12 lg:py-16 text-white">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 -left-1/4 h-125 w-125 animate-pulse rounded-full bg-cyan-600/20 blur-[100px] mix-blend-screen transition-all duration-1000"></div>
          <div className="absolute bottom-0 -right-1/4 h-100 w-100 animate-pulse rounded-full bg-blue-600/30 blur-[120px] mix-blend-screen transition-all duration-1000 delay-500"></div>
        </div>
        
        <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mb-4 font-montserrat text-3xl font-bold tracking-tight md:text-4xl lg:text-4xl text-transparent-white bg-clip-text bg-linear-to-r ">
            Meet the Team Behind the Smart Solar Audit Platform
          </h1>
          <p className="mx-auto max-w-3xl text-sm font-small text-cyan-100/90 md:text-base">
            Combining Renewable Energy, AI, and Smart Infrastructure for Sustainable Healthcare Solutions.
          </p>
        </div>
      </section>

      {/* Team Content */}
      <AboutTeamSection />
    </div>
  );
}
