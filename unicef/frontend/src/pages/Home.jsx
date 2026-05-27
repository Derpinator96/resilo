import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Observer } from 'gsap/Observer';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  Search,
  X,
  Activity,
  Sun,
  Info,
  MapPin,
  Loader2
} from 'lucide-react';
import axios from 'axios';

import heroBg from '../assets/Center.png';
import centersSurvey from '../assets/centers_survey.jpeg';
import Footer from '../components/Footer.jsx';

// Register standard GSAP plugins along with the Observer utility
gsap.registerPlugin(ScrollTrigger, Observer);

// ==========================================
// Helper: ResilientImage
// ==========================================
const ResilientImage = ({ src, alt, className }) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    setCurrentSrc(src);
    setAttempts([]);
  }, [src]);

  const handleError = () => {
    const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.JPG', '.JPEG', '.PNG', '.WEBP'];
    const lastDot = src.lastIndexOf('.');
    if (lastDot === -1) {
      setCurrentSrc('/images/fallback-facility.jpg');
      return;
    }
    const basePath = src.substring(0, lastDot);
    const originalExt = src.substring(lastDot);
    const nextExt = extensions.find(ext => ext !== originalExt && !attempts.includes(ext));
    if (nextExt) {
      setAttempts(prev => [...prev, nextExt]);
      setCurrentSrc(`${basePath}${nextExt}`);
    } else {
      setCurrentSrc('/images/fallback-facility.jpg');
    }
  };

  return <img src={currentSrc} alt={alt} className={className} onError={handleError} />;
};

// ==========================================
// 1. HERO SECTION
// ==========================================
const HeroSection = () => {
  const heroRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.hero-label', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.2 });
      gsap.fromTo('.hero-heading', { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out', delay: 0.4 });
      gsap.fromTo('.hero-sub', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.7 });
      gsap.fromTo('.hero-cta', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.95 });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} className="relative w-full h-full flex items-center overflow-hidden bg-[#011425]">
      <div className="absolute inset-0 z-0">
        <img src={heroBg} alt="Solar-powered healthcare facility" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(1,20,37,0.95) 0%, rgba(1,20,37,0.8) 35%, rgba(1,20,37,0.3) 65%, rgba(1,20,37,0.05) 100%)' }} />
        <div className="absolute inset-0 bg-linear-to-t from-[#011425]/90 via-transparent to-transparent pointer-events-none" />
      </div>
      <div className="relative z-10 w-full max-w-7xl mx-auto pl-16 md:pl-24 lg:pl-32 pr-8">
        <div className="hero-label inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-md mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_6px_#3b82f6]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">UNICEF · Solar Energy Initiative</span>
        </div>
        <h1 className="hero-heading max-w-175 mb-4 uppercase" style={{ fontFamily: "'Montserrat', sans-serif", lineHeight: '0.92', letterSpacing: '-3px' }}>
          <span className="block text-[3rem] sm:text-[3.8rem] md:text-[4.2rem] lg:text-[4.5rem] font-bold text-white/95">UNICEF Solar Energy</span>
          <span className="block text-[3.4rem] sm:text-[4.2rem] md:text-[4.8rem] lg:text-[5.4rem] font-bold bg-linear-to-r from-white via-white to-blue-400 bg-clip-text text-transparent">Audit Dashboard</span>
        </h1>
        <p className="hero-sub text-[0.95rem] md:text-[1.08rem] text-white/40 max-w-130 leading-relaxed tracking-wide mb-8">
          Monitoring sustainable energy transformation<br />across healthcare facilities
        </p>
        <div className="hero-cta flex flex-wrap gap-4">
          <Link to="/dashboard" className="group px-7 py-3.5 rounded-2xl bg-linear-to-r from-[#011425] to-[#1e40af] text-white font-semibold text-[0.9rem] tracking-wide shadow-[0_6px_24px_rgba(1,20,37,0.35)] transition-all duration-300 hover:shadow-[0_10px_36px_rgba(1,20,37,0.55)] hover:scale-[1.04]">
            <span className="flex items-center gap-2">Explore Dashboard<svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></span>
          </Link>
          <Link 
            to="/glimpses" 
            className="px-7 py-3.5 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-lg text-white/80 font-semibold text-[0.9rem] tracking-wide transition-all duration-300 hover:bg-white/10 hover:border-white/30 hover:scale-[1.04]"
          >
            View Surveyed Facilities
          </Link>

        </div>
      </div>
    </section>
  );
};

// ==========================================
// 2. MISSION SECTION
// ==========================================
const impactGallery = [
  { src: "/images/impact_story.png", alt: "Technicians performing a solar audit", tag: "FIELD AUDIT", title: "Solar Site Inspection", className: "col-start-1 col-end-7 row-start-1 row-end-8 z-20" },
  { src: "/images/load.jpg", alt: "Government health building with solar infrastructure", tag: "ENERGY REVIEW", title: "Facility Load Analysis", className: "col-start-7 col-end-13 row-start-1 row-end-6 z-10" },
  { src: "/images/storage_room.png", alt: "Solar array near building", tag: "MONITORING", title: "Power Backup Systems", className: "col-start-1 col-end-6 row-start-8 row-end-13 z-30" },
  { src: "/images/rooftop_solar.png", alt: "Rural healthcare center", tag: "INFRASTRUCTURE", title: "Rooftop Solar Mapping", className: "col-start-6 col-end-10 row-start-6 row-end-13 z-20" },
  { src: "/images/impact_gallery_5.png", alt: "Power room infrastructure", tag: "HEALTHCARE ENERGY", title: "Critical Equipment Survey", className: "col-start-10 col-end-13 row-start-6 row-end-13 z-30" },
];

const MissionSection = () => {
  return (
    <section className="h-full w-full px-[8%] flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16 xl:gap-24 bg-[radial-gradient(circle_at_top_left,#f8fafc_0%,#ffffff_100%)] relative overflow-hidden">
      <div className="flex-[1.1] relative flex justify-center items-center h-105 w-full self-center">
        <div className="grid grid-cols-12 grid-rows-12 w-full h-105 gap-3.75 relative z-20">
          {impactGallery.map((image) => (
            <div key={image.title} className={`relative rounded-[20px] overflow-hidden shadow-[0_15px_35px_rgba(0,0,0,0.04)] border border-slate-100 transition-all duration-500 bg-[#f8fafc] hover:-translate-y-2 hover:scale-[1.01] hover:z-30 hover:shadow-[0_20px_45px_rgba(37,99,235,0.18)] hover:border-blue-600/60 group ${image.className}`}>
              <img src={image.src} alt={image.alt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-linear-to-t from-[#091020]/90 via-[#091020]/35 to-transparent pointer-events-none"></div>
              <div className="absolute left-0 right-0 bottom-0 p-4 text-white transition-all duration-500 ease-out transform translate-y-2 group-hover:translate-y-0">
                <p className="text-[0.66rem] uppercase tracking-[0.22em] font-extrabold text-blue-300/90 mb-1">{image.tag}</p>
                <h3 className="text-[0.95rem] font-bold leading-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>{image.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-[1.3] z-20 pl-0 lg:pl-4 flex flex-col justify-center">
        <div className="flex items-center gap-3 mb-4"><div className="h-px w-10 bg-linear-to-r from-transparent to-blue-600" /><span className="text-[0.68rem] font-black uppercase tracking-[0.25em] text-blue-600">Field Operations</span></div>
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 leading-[1.1] font-montserrat uppercase tracking-tight">How We Audit <br /><span className="text-blue-600 inline-block">Health Facilities</span><br />For Solar Readiness</h2>
        <div className="flex flex-col gap-4 text-[0.95rem] text-slate-500 leading-relaxed font-medium font-montserrat max-w-2xl">
          <p>Healthcare facilities across Chhattisgarh are surveyed through on-site energy audits conducted by field engineers and technical teams. During each visit, teams inspect electrical infrastructure, rooftop conditions, backup systems, and daily energy usage.</p>
          <p>The audit includes assessing rooftop suitability for solar installation, recording the load of critical healthcare equipment, and evaluating backup reliability during outages.</p>
          <p className="border-l-4 border-blue-600/40 pl-5 text-slate-600 italic text-[0.9rem]">Using this data, the platform helps identify facilities suitable for solar integration and supports long-term sustainable healthcare energy planning.</p>
        </div>
      </div>
    </section>
  );
};

// ==========================================
// 3. IMPACT SECTION
// ==========================================
const MetricCounter = ({ target, duration = 5500, suffix = "", isDecimal = false, triggerActive }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!triggerActive) return;
    let startTime = null;
    let animationFrameId;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const currentVal = easeProgress * target;
      setCount(isDecimal ? currentVal.toFixed(1) : Math.floor(currentVal));
      if (progress < 1) animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [target, duration, isDecimal, triggerActive]);

  return <span>{count}{suffix}</span>;
};

const ImpactSection = ({ isActive, onViewCenters }) => {
  const [stats, setStats] = useState({ districtsMonitored: 0, facilitiesAnalyzed: 0, auditCompleted: 0, pendingAudit: 0 });

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/v2/centres/summary`, { withCredentials: true })
      .then(res => {
        const data = res.data.data;
        setStats({
          districtsMonitored: data.auditedDistricts,
          facilitiesAnalyzed: data.totalFacilities,
          auditCompleted: data.totalFacilities,
          pendingAudit: data.pendingAudits
        });
      })
      .catch(err => console.error("Failed to load summary stats", err));
  }, []);

  const statsCards = [
    { value: stats.districtsMonitored, suffix: "", label: "DISTRICTS", description: "Complete coverage across the state", accent: "from-blue-500 to-sky-400", iconClass: "bg-blue-50 text-blue-600 border-blue-100", textGradient: "from-blue-600 to-indigo-600", icon: ( <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> ) },
    { value: stats.facilitiesAnalyzed, suffix: "", label: "FACILITIES ANALYZED", description: "Facilities evaluated for solar feasibility", accent: "from-cyan-500 to-blue-500", iconClass: "bg-cyan-50 text-cyan-600 border-cyan-100", textGradient: "from-cyan-600 to-blue-600", icon: ( <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 21h16" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18V9" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18V5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 18v-6" /></svg> ) },
    { value: stats.auditCompleted, suffix: "", label: "AUDIT COMPLETED", description: "Healthcare facilities completed", accent: "from-emerald-500 to-teal-400", iconClass: "bg-emerald-50 text-emerald-600 border-emerald-100", textGradient: "from-emerald-600 to-teal-600", icon: ( <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="3.5" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" /></svg> ) },
    { value: stats.pendingAudit, suffix: "", label: "PENDING AUDITS", description: "Facilities awaiting verification status", accent: "from-amber-500 to-orange-500", iconClass: "bg-amber-50 text-amber-600 border-amber-100", textGradient: "from-amber-600 to-orange-600", icon: ( <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 2 6 13h5l-1 9 7-11h-5l1-9Z" /></svg> ) }
  ];

  return (
    <section className="h-full w-full relative overflow-hidden text-slate-900 flex flex-col items-center justify-center px-[6%] lg:px-[8%]">
      <div className="absolute inset-0 z-0">
        <img src="/images/card_3_facility.png" alt="Solar infrastructure background" className="w-full h-full object-cover" />
        <div className="absolute inset-0 backdrop-blur-[1px]" style={{ background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.5) 22%, rgba(255, 255, 255, 0.8) 52%, rgba(255, 255, 255, 0.8) 88%, rgba(255, 255, 255, 0.2 ) 100%)' }} />
      </div>

      <div className="relative z-10 max-w-7xl w-full mx-auto flex flex-col items-center">
        <div className="text-center max-w-4xl mx-auto mb-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-300/60 bg-white/70 backdrop-blur-sm px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-blue-700 mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            LIVE DATA - REAL-TIME OVERVIEW
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-[2.3rem] font-black text-slate-900 mb-2 leading-tight tracking-tight font-montserrat uppercase">
            Real-Time <span className="bg-linear-to-r from-blue-600 via-sky-500 to-indigo-600 bg-clip-text text-transparent inline-block">Solar Audit</span> Insights Across Chhattisgarh
          </h2>
          <p className="text-[0.88rem] md:text-[0.92rem] text-slate-700 font-semibold max-w-2xl mx-auto leading-relaxed">
            Live monitoring and analytical reporting of solar energy performance across public healthcare facilities, enabling data-driven decisions.
          </p>
        </div>

        <div className="w-full border-t border-slate-200/70 pt-6 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {statsCards.map((card) => (
              <div key={card.label} className="bg-white border border-slate-100 rounded-[20px] p-5 text-left relative overflow-hidden shadow-[0_4px_24px_rgba(15,23,42,0.07)] group">
                <div className={`absolute top-0 left-0 w-full h-1 bg-linear-to-r ${card.accent} pointer-events-none`}></div>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl border ${card.iconClass}`}>{card.icon}</div>
                  <div className="min-w-0">
                    <div className={`text-2xl font-black mb-0.5 font-montserrat leading-none tracking-[-0.5px] bg-linear-to-r ${card.textGradient} bg-clip-text text-transparent`}>
                      <MetricCounter target={card.value} suffix={card.suffix} triggerActive={isActive} />
                    </div>
                    <div className="text-[0.68rem] text-slate-700 font-extrabold uppercase tracking-[0.5px] font-montserrat">{card.label}</div>
                    <p className="mt-1 text-[0.72rem] text-slate-400 leading-normal font-medium">{card.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button onClick={onViewCenters} className="group relative overflow-hidden rounded-full bg-[#011425] text-white px-7 py-3.5 text-[11px] font-black uppercase tracking-[0.18em] shadow-[0_10px_28px_rgba(1,20,37,0.2)] transition-all duration-300 hover:scale-[1.03] hover:bg-blue-700">
            <span>VIEW SURVEYED CENTERS<span className="ml-2">➔</span></span>
          </button>
        </div>
      </div>
    </section>
  );
};

// ==========================================
// 4. MAP SECTION
// ==========================================
const FitBounds = ({ data }) => {
  const map = useMap();
  useEffect(() => { if (data) { const geoJsonLayer = L.geoJSON(data); map.fitBounds(geoJsonLayer.getBounds(), { padding: [5, 5] }); } }, [data, map]);
  return null;
};

const normalizeDistrictName = (geoName) => {
  if (!geoName) return null;
  const name = geoName.toString().trim();
  const spellingMap = { "Dakshin Bastar Dantewada": "Dantewada", "Baster": "Bastar", "Uttar Bastar Kanker": "Kanker", "Kawardha": "Kabirdham" };
  return spellingMap[name] || name;
};

function ChhattisgarhAuditMap() {
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [hoveredDistrict, setHoveredDistrict] = useState(null);
  const [cgGeoData, setCgGeoData] = useState(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [auditedDistrictsSet, setAuditedDistrictsSet] = useState(new Set());
  const [stats, setStats] = useState({ totalFacilitiesCovered: 0, districtsAudited: 0, completionRate: 0 });

  useEffect(() => {
    fetch('/chhattisgarh_districts.geojson')
      .then(res => res.json())
      .then(data => { setCgGeoData(data); setGeoLoading(false); })
      .catch(err => { console.error("Error loading GeoJSON: ", err); setGeoLoading(false); });
  }, []);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/v2/centres/audited-districts`, { withCredentials: true })
      .then(res => {
        const districts = res.data.data;
        setAuditedDistrictsSet(new Set(districts.map(d => d.toLowerCase().trim())));
      })
      .catch(err => console.error("Failed to load audited districts", err));
  }, []);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/v2/centres/summary`, { withCredentials: true })
      .then(res => {
        const data = res.data.data;
        setStats({
          totalFacilitiesCovered: data.totalFacilities,
          districtsAudited: data.auditedDistricts,
          completionRate: Math.round((data.auditedDistricts / data.totalDistricts) * 100)
        });
      })
      .catch(err => console.error("Failed to load summary stats for map", err));
  }, []);

  const handleMouseMove = (e) => { setMousePos({ x: e.clientX, y: e.clientY }); };

  const getLeafletStyle = (geoName) => {
    const isAudited = auditedDistrictsSet.has(geoName.toLowerCase().trim());
    return { fillColor: isAudited ? '#235d90' : '#dbeafe', color: isAudited ? '#000c18' : '#011425', weight: 1.5, fillOpacity: isAudited ? 0.95 : 0.6 };
  };

  const onEachDistrict = (feature, layer) => {
    const rawGeoName = feature.properties.dtname || feature.properties.district || feature.properties.NAME_2 || feature.properties.name || "Unknown";
    const geoName = normalizeDistrictName(rawGeoName);
    const isAudited = auditedDistrictsSet.has(geoName.toLowerCase().trim());
    const styles = getLeafletStyle(geoName);
    layer.setStyle({ fillColor: styles.fillColor, color: styles.color, weight: styles.weight, fillOpacity: styles.fillOpacity, opacity: 0.8 });
    layer.on({
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({ weight: 2.5, fillOpacity: isAudited ? 0.9 : 0.8, color: isAudited ? '#000c18' : '#2563eb', fillColor: isAudited ? '#08213f' : '#bfdbfe' });
        l.bringToFront();
        setHoveredDistrict({ name: geoName, isAudited });
      },
      mousemove: (e) => setMousePos({ x: e.originalEvent.clientX, y: e.originalEvent.clientY }),
      mouseout: (e) => {
        const l = e.target;
        l.setStyle({ weight: 1.5, fillOpacity: styles.fillOpacity, color: styles.color, fillColor: styles.fillColor });
        setHoveredDistrict(null);
      },
      click: async () => {
        if (isAudited) {
          try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v2/centres/${encodeURIComponent(geoName)}`, { withCredentials: true });
            const centres = res.data.data.centres;
            const distFacilities = centres.map(c => ({
              facility: c.centreName,
              type: "Health Centre",
              location: `${c.latitude}, ${c.longitude}`,
              date: new Date(c.createdAt).toLocaleDateString()
            }));
            setSelectedDistrict({
              name: geoName,
              geo: feature,
              data: { totalFacilities: distFacilities.length, division: centres[0]?.district || 'Geographic', facilities: distFacilities }
            });
          } catch (error) { console.error("Failed to fetch district data", error); }
        } else {
          setSelectedDistrict({ name: geoName, geo: feature, data: null });
        }
        setSearchTerm('');
      }
    });
  };

  const filteredFacilities = useMemo(() => {
    if (!selectedDistrict || !selectedDistrict.data) return [];
    return selectedDistrict.data.facilities.filter(facility => facility.facility.toLowerCase().includes(searchTerm.toLowerCase()) || facility.type.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [selectedDistrict, searchTerm]);

  return (
    <section className="relative w-full h-full overflow-hidden flex items-center justify-center" onMouseMove={handleMouseMove}>
      <div className="absolute inset-0 z-0">
        <img src="/images/map.jpg" alt="Geographic coverage map background" className="w-full h-full object-cover" />
        <div className="absolute inset-0 backdrop-blur-[1px]" style={{ background: 'linear-gradient(to right, rgba(255, 255, 255, 0.88) 0%, rgba(255, 255, 255, 0.70) 60%, rgba(255, 255, 255, 0.5) 100%)' }} />
      </div>
      <div className="relative z-10 mx-auto max-w-7xl w-full px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100/50 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-blue-600 mb-4 self-start"><MapPin className="h-3.5 w-3.5" /> LIVE GIS COVERAGE</div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight mb-4 font-montserrat uppercase">Interactive Audit <br /><span className="text-blue-600">Coverage Map</span></h2>
            <p className="text-[0.92rem] text-slate-500 leading-relaxed font-medium mb-6">Explore district-wise healthcare facilities surveyed under the UNICEF Solar Energy Audit initiative across Chhattisgarh.</p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-xs"><div className="text-xl font-black text-blue-600 font-montserrat">{stats.totalFacilitiesCovered}</div><div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Centers</div></div>
              <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-xs"><div className="text-xl font-black text-blue-700 font-montserrat">{stats.districtsAudited}</div><div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Districts</div></div>
              <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-xs"><div className="text-xl font-black text-blue-800 font-montserrat">{stats.completionRate}%</div><div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Coverage</div></div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Map Legend</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3"><div className="h-3 w-3 rounded-full shrink-0 bg-[#235d90] border border-[#000c18]" /><div className="flex flex-col"><span className="text-xs font-black text-slate-700 leading-none">Survey Completed</span></div></div>
                <div className="flex items-center gap-3"><div className="h-3 w-3 rounded-full shrink-0 bg-[#dbeafe] border border-[#3b82f6]" /><div className="flex flex-col"><span className="text-xs font-black text-slate-700 leading-none">Survey Pending</span></div></div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-7 flex justify-center items-center relative h-[65vh] lg:h-screen w-full bg-slate-50/50 rounded-3xl border border-slate-100 overflow-hidden shadow-inner">
            {geoLoading ? (
              <div className="flex flex-col items-center justify-center h-full w-full"><Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" /><span className="text-sm font-bold text-slate-500">Loading Geospatial Data...</span></div>
            ) : cgGeoData ? (
              <MapContainer
                key="static-map-instance"
                center={[21.5, 82.0]}
                zoom={6.5}
                zoomControl={false}
                scrollWheelZoom={false}
                dragging={false}
                touchZoom={false}
                doubleClickZoom={false}
                boxZoom={false}
                keyboard={false}
                className="w-full h-full"
                style={{ background: 'transparent' }}
              >
                <GeoJSON data={cgGeoData} onEachFeature={onEachDistrict} />
              </MapContainer>
            ) : ( <div className="flex flex-col items-center justify-center h-full w-full text-slate-500 font-bold">Failed to load map data.</div> )}
            <AnimatePresence>
              {hoveredDistrict && (
                <div className="fixed z-9999 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3 shadow-2xl border border-slate-800 flex flex-col w-60 pointer-events-none" style={{ left: `${mousePos.x + 20}px`, top: `${mousePos.y - 40}px` }}>
                  <span className="text-xs font-black tracking-tight uppercase text-white pb-1 border-b border-slate-800">{hoveredDistrict.name}</span>
                  {hoveredDistrict.isAudited ? (
                    <div className="flex flex-col gap-1 mt-1.5"><div className="flex justify-between items-center text-[10px] text-slate-400"><span>Status</span><span className="font-extrabold flex items-center gap-1 text-emerald-400">Completed</span></div></div>
                  ) : ( <div className="text-[10px] text-slate-400 mt-1 italic">Survey data not available.</div> )}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {selectedDistrict && (
            <div className="absolute inset-0 z-99999 flex items-center justify-center p-4">
              <div className="absolute bg-slate-900/60 backdrop-blur-[6px]" onClick={() => setSelectedDistrict(null)} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative z-10 w-full max-w-4xl bg-white/95 backdrop-blur-xl rounded-4xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[80vh]">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-linear-to-r from-blue-50/40 via-white to-white">
                  <div><span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#00ADEF] bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/10">{selectedDistrict.data?.division || "GEOGRAPHIC"} DIVISION</span><h3 className="text-2xl font-black text-slate-900 mt-2 font-montserrat tracking-tight uppercase">{selectedDistrict.name} District</h3></div>
                  <button onClick={() => setSelectedDistrict(null)} className="absolute top-6 right-6 h-10 w-10 flex items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-slate-400"><X className="h-5 w-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-slate-50/30">
                  {selectedDistrict.data ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0"><Activity className="h-5 w-5" /></div><div className="flex flex-col"><span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Centers</span><span className="text-lg font-black text-slate-800">{selectedDistrict.data.totalFacilities}</span></div></div>
                        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0"><Sun className="h-5 w-5" /></div><div className="flex flex-col"><span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Solar Audits</span><span className="text-lg font-black text-slate-800">100%</span></div></div>
                      </div>
                      <div className="flex flex-col gap-3 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-1"><span className="text-xs font-black uppercase tracking-widest text-slate-800">Surveyed Healthcare Facilities</span></div>
                        <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input type="text" placeholder="Search facility name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500" /></div>
                        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white mt-1"><div className="max-h-60 overflow-y-auto"><table className="w-full text-left border-collapse"><thead className="sticky top-0 bg-slate-100/90 backdrop-blur z-10"><tr><th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">Facility Name</th><th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">Type</th><th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">Location</th></tr></thead><tbody>{filteredFacilities.length > 0 ? filteredFacilities.map((facility, idx) => (<tr key={idx} className="border-b border-slate-100 hover:bg-blue-50/50"><td className="px-4 py-3 text-xs font-bold text-slate-800">{facility.facility}</td><td className="px-4 py-3"><span className="text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{facility.type}</span></td><td className="px-4 py-3 text-[11px] text-slate-500">{facility.location}</td></tr>)) : (<tr><td colSpan="3" className="text-center py-8 text-xs font-bold text-slate-400">No facilities match "{searchTerm}".</td></tr>)}</tbody></table></div></div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-3xl border border-slate-100 shadow-sm"><div className="h-16 w-16 flex items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-slate-300 mb-4"><Info className="h-8 w-8" /></div><h4 className="text-lg font-black text-slate-800 mb-2">Survey data not available yet</h4><p className="text-xs text-slate-500 font-semibold max-w-sm">Audit data files for <span className="text-slate-800 font-black">{selectedDistrict.name}</span> have not yet been synchronized.</p></div>
                  )}
                </div>
                <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex justify-between items-center"><span className="text-[10px] font-bold text-slate-500">UNICEF Solar Energy Audit Initiative</span><button onClick={() => setSelectedDistrict(null)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider">Close</button></div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ==========================================
// 5. FACILITIES SECTION
// ==========================================
const FacilitiesSection = ({ onCardClick }) => {
  const [glimpses, setGlimpses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGlimpses = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/glimpses`, { withCredentials: true });
        if (res.data.success) {
          const map = new Map();
          res.data.data.forEach(g => {
            const name = g.facilityName;
            if (!map.has(name)) {
              map.set(name, {
                id: name,
                facility: name,
                district: g.district,
                type: g.facilityType || 'Health Centre',
                image: g.imageUrl || null,
                date: g.surveyDate ? new Date(g.surveyDate).toLocaleDateString('en-GB') : 'N/A',
                gps: (g.latitude && g.longitude) ? `${g.latitude}, ${g.longitude}` : 'Not available'
              });
            } else {
              const existing = map.get(name);
              if (!existing.image && g.imageUrl) existing.image = g.imageUrl;
            }
          });
          setGlimpses(Array.from(map.values()));
        }
      } catch (error) {
        console.error("Error fetching glimpses:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGlimpses();
  }, []);

  const FacilityImage = ({ src, alt, className }) => {
    const [error, setError] = useState(false);
    if (!src || error) {
      return (
        <div className={`${className} flex items-center justify-center bg-slate-200 text-slate-400`}>
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      );
    }
    return <img src={src} alt={alt} className={className} onError={() => setError(true)} />;
  };

  if (loading) {
    return <section className="relative h-full w-full flex items-center justify-center bg-[#f8fafc]"><div className="text-slate-500 font-bold">Loading gallery...</div></section>;
  }

  return (
    <section className="relative h-full w-full flex flex-col justify-center bg-[radial-gradient(circle_at_bottom_right,#eff6ff_0%,#ffffff_100%)]">
      <div className="absolute inset-0 z-0">
        <img src="images/feature.jpg" alt="Geographic coverage map background" className="w-full h-full object-cover" />
        <div className="absolute inset-0 backdrop-blur-[1px]" style={{ background: 'linear-gradient(to right, rgba(255, 255, 255, 0.88) 0%, rgba(255, 255, 255, 0.70) 60%, rgba(255, 255, 255, 0.5) 100%)' }} />
      </div>
      <div className="relative z-10 max-w-7xl w-full mx-auto px-6 md:px-8 flex flex-col max-h-[85vh]">
        <div className="text-center mb-6 shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-100 bg-blue-50/50 backdrop-blur-md text-blue-600 font-extrabold uppercase tracking-[0.25em] text-[9px] mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" /> Survey Glimpses
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-none tracking-tight mb-2 font-montserrat uppercase">Featured Facilities</h2>
          <p className="text-slate-500 text-xs md:text-sm max-w-xl mx-auto font-medium">Visual documentation of active healthcare facilities audited under the UNICEF Solar initiative across Chhattisgarh.</p>
        </div>

        {glimpses.length > 0 ? (
          <div
            data-scroll-mask="true"
            className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent"
          >
            <div className="flex gap-5 pr-4 snap-x snap-mandatory">
              {glimpses.map(facility => (
                <div
                  key={facility.id}
                  onClick={() => onCardClick(facility)}
                  className="group relative cursor-pointer overflow-hidden rounded-xl bg-white border border-slate-200 shadow-md transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col h-85 w-75 shrink-0 snap-start"
                >
                  {/* Image Section */}
                  <div className="relative h-52 w-full overflow-hidden shrink-0 bg-slate-50">
                    <div className="absolute inset-0 bg-linear-to-t from-slate-900/70 via-slate-900/20 to-transparent z-10" />
                    <FacilityImage
                      src={facility.image}
                      alt={facility.facility}
                      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                    <span className="absolute top-3 left-3 z-20 rounded-md bg-blue-600 text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest shadow-md">
                      {facility.type}
                    </span>
                    <span className="absolute bottom-3 left-3 z-20 flex items-center gap-1 text-xs text-white font-semibold uppercase tracking-wide drop-shadow">
                      <MapPin className="h-3.5 w-3.5 text-sky-400 shrink-0" /> {facility.district}
                    </span>
                  </div>

                  {/* Content Section */}
                  <div className="p-3 relative z-20 flex flex-col justify-between grow">
                    <div className="min-w-0">
                      <h3 className="mb-1 text-sm font-bold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors truncate">
                        {facility.facility}
                      </h3>
                      <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
                        {facility.district} DISTRICT • CG
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[11px] text-slate-500 font-medium mt-auto">
                      <span className="text-slate-400">{facility.date}</span>
                      <div className="flex items-center gap-1 text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded-md px-2 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>COORDS</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-10 rounded-xl border border-slate-200 bg-white/70 shadow-sm shrink-0">
            <p className="text-slate-500 font-semibold">No glimpses found.</p>
          </div>
        )}
              </div>
            </section>
          );
        };

// ==========================================
// 6. MAIN HOME PAGE (Strict Touch & Snap Orchestrator)
// ==========================================
export default function Home() {
  const containerRef = useRef(null);
  const currentIndexRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const [activePanel, setActivePanel] = useState(0);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [showSurveyModal, setShowSurveyModal] = useState(false);

  useEffect(() => {
  const container = containerRef.current;
  if (!container) return;

  const sections = container.querySelectorAll('.scroll-section');
  const totalSections = sections.length;

  const goToSection = (index) => {
    if (index < 0 || index >= totalSections || isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    currentIndexRef.current = index;
    setActivePanel(index);

    gsap.to(container, {
      yPercent: -index * 100,
      duration: 0.75,
      ease: 'power2.inOut',
      onComplete: () => {
        isAnimatingRef.current = false;
      }
    });
  };

  const observerInstance = Observer.create({
    target: window,
    type: "wheel,touch,pointer",
    wheelSpeed: 1,
    tolerance: 12,
    preventDefault: true,
    onChangeY: (self) => {
      const scrollContainer = self.target?.closest?.('[data-scroll-mask="true"]');
      
      if (scrollContainer) {
        const isAtBottom = self.deltaY > 0 && 
          scrollContainer.scrollHeight - scrollContainer.scrollTop <= scrollContainer.clientHeight + 2;
        const isAtTop = self.deltaY < 0 && scrollContainer.scrollTop <= 2;

        if (!isAtBottom && !isAtTop) {
          if (scrollContainer.scrollWidth > scrollContainer.clientWidth) {
            scrollContainer.scrollLeft += self.deltaY;
          } else {
            scrollContainer.scrollTop += self.deltaY;
          }
          return;
        }
      }

      if (!isAnimatingRef.current) {
        if (self.deltaY > 0) {
          goToSection(currentIndexRef.current + 1);
        } else if (self.deltaY < 0) {
          goToSection(currentIndexRef.current - 1);
        }
      }
    }
  });

  const handleResize = () => {
    gsap.set(container, { yPercent: -currentIndexRef.current * 100 });
  };
  window.addEventListener('resize', handleResize);

  return () => {
    observerInstance.kill();
    window.removeEventListener('resize', handleResize);
  };
}, []);

  const FacilityImageModal = ({ facility, onClose }) => {
    if (!facility) return null;
    return (
      <div className="fixed inset-0 z-99999 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
        <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-4xl border border-slate-100 bg-white shadow-2xl flex flex-col md:flex-row max-h-[75vh]">
          <button onClick={onClose} className="absolute right-4 top-4 z-30 h-8 w-8 flex items-center justify-center rounded-full bg-white text-slate-400 shadow-md">✕</button>
          <div className="relative w-full md:w-1/2 h-52 md:h-auto bg-slate-50 shrink-0">
            <img src={facility.image || '/images/fallback-facility.jpg'} alt={facility.facility} className="h-full w-full object-cover" />
          </div>
          <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
            <div>
              <span className="inline-flex mb-2 rounded-xl bg-blue-50 px-3 py-1 text-[9px] font-black tracking-widest text-blue-700 border border-blue-100 uppercase">{facility.type}</span>
              <h2 className="text-xl font-black text-slate-900 mb-1 font-montserrat uppercase tracking-tight">{facility.facility}</h2>
              <p className="text-slate-400 font-extrabold uppercase text-[9px] tracking-widest mb-6 pb-2 border-b border-slate-100">{facility.district} District • Chhattisgarh</p>
              <div className="space-y-4">
                <div><span className="text-[9px] text-slate-400 uppercase font-black block mb-0.5">GPS Coordinates</span><p className="text-slate-700 font-mono text-xs bg-slate-50 p-2 rounded-xl border border-slate-150">{facility.gps}</p></div>
                <div><span className="text-[9px] text-slate-400 uppercase font-black block mb-0.5">Surveyed On</span><p className="text-slate-800 font-bold text-xs">{facility.date}</p></div>
              </div>
            </div>
            <button onClick={onClose} className="mt-6 w-full rounded-xl bg-[#011425] text-white font-extrabold uppercase text-[10px] py-3.5">Close Details</button>
          </div>
        </div>
      </div>
    );
  };

  return (
  <div className="w-screen h-screen overflow-hidden bg-[#f8fafc] fixed inset-0">
    <div ref={containerRef} className="w-full h-full will-change-transform">
      <div className="scroll-section w-full h-screen shrink-0"><HeroSection /></div>
      <div className="scroll-section w-full h-screen shrink-0"><ImpactSection isActive={activePanel === 1} onViewCenters={() => setShowSurveyModal(true)} /></div>
      <div className="scroll-section w-full h-screen shrink-0"><MissionSection /></div>
      <div className="scroll-section w-full h-screen shrink-0"><ChhattisgarhAuditMap /></div>
      <div className="scroll-section w-full h-screen shrink-0"><FacilitiesSection onCardClick={setSelectedFacility} /></div>
      {/* 👇 Footer added as the 6th snap section */}
      <div className="scroll-section w-full h-screen shrink-0"><Footer /></div>
    </div>

    {/* Shared Interactive Modal */}
    {selectedFacility && <FacilityImageModal facility={selectedFacility} onClose={() => setSelectedFacility(null)} />}

    {/* Survey Modal - moved outside transformed container */}
    {showSurveyModal && (
      <div className="fixed inset-0 z-99999 flex items-center justify-center bg-slate-900/75 backdrop-blur-md p-6">
        <button
          onClick={() => setShowSurveyModal(false)}
          className="absolute top-24 right-8 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-2xl text-white backdrop-blur-md hover:bg-white/20"
        >
          ✕
        </button>
        <div className="relative w-full max-w-7xl overflow-hidden rounded-4xl border border-slate-700 bg-white shadow-2xl">
          <img
            src={centersSurvey}
            alt="Surveyed Healthcare Facilities"
            className="max-h-[90vh] w-full object-contain bg-slate-50"
          />
        </div>
      </div>
    )}

    {/* Premium Side Floating Indicators - updated to 6 items */}
    <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3.5 z-9999">
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <div 
          key={index} 
          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${activePanel === index ? 'bg-blue-600 scale-125 shadow-[0_0_8px_rgba(37,99,235,0.6)]' : 'bg-slate-300 hover:bg-slate-400'}`}
        />
      ))}
    </div>
  </div>
);
}