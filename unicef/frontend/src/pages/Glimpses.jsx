import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';

// Simple image component that uses the URL as-is and shows a fallback on error
function FacilityImage({ src, alt, className }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className={`${className} flex items-center justify-center bg-slate-200 text-slate-400`}>
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} onError={() => setError(true)} />;
}

// DistrictCard (no buttons)
function DistrictCard({ facility, onClick }) {
  return (
    <div 
      onClick={() => onClick(facility)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-cyan-300 flex flex-col"
    >
      <div className="relative h-56 w-full overflow-hidden shrink-0 bg-slate-100">
        <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 via-transparent to-transparent z-10"></div>
        <FacilityImage 
          src={facility.image} 
          alt={facility.facility} 
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <span className="absolute top-4 left-4 z-20 rounded-full bg-white/95 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-700 border border-cyan-200 backdrop-blur-md shadow-sm">
          {facility.type}
        </span>
      </div>
      <div className="p-5 relative z-20 flex flex-col grow">
        <h3 className="mb-1 text-xl font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">
          {facility.facility}
        </h3>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">
          {facility.district} District
        </p>
        <div className="mt-auto flex items-center justify-between text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {facility.date}
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            GPS Info
          </div>
        </div>
      </div>
    </div>
  );
}

// FacilityModal (simplified, uses the same FacilityImage)
function FacilityModal({ facility, onClose }) {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!facility) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-slate-800 backdrop-blur-md transition-all hover:bg-red-500 hover:text-white"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex flex-col md:flex-row h-full max-h-[85vh]">
          <div className="relative w-full md:w-3/5 h-64 md:h-auto bg-slate-100">
            <FacilityImage src={facility.image} alt={facility.facility} className="h-full w-full object-cover md:object-contain" />
          </div>
          <div className="w-full md:w-2/5 p-6 md:p-8 flex flex-col justify-center overflow-y-auto">
            <div className="inline-flex mb-4 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-700 border border-cyan-200 uppercase">
              {facility.type}
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{facility.facility}</h2>
            <p className="text-slate-500 font-semibold uppercase text-sm mb-8 pb-4 border-b border-slate-200">
              {facility.district} District
            </p>
            <div className="space-y-6">
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Location</p>
                <p className="text-slate-800 font-medium flex items-center gap-2">
                  <svg className="h-5 w-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {facility.location}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold mb-1">GPS Coordinates</p>
                <p className="text-slate-700 font-mono text-sm bg-slate-50 p-3 rounded-lg border break-all">
                  {facility.gps}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Survey Date</p>
                <p className="text-slate-800 font-medium flex items-center gap-2">
                  <svg className="h-5 w-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {facility.date}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="mt-10 w-full rounded-xl bg-linear-to-r from-cyan-600 to-blue-600 px-4 py-3 text-sm font-bold text-white hover:shadow-lg transition">
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// FilterButtons component
function FilterButtons({ districts, activeFilter, onFilterChange }) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
      <button
        onClick={() => onFilterChange('All')}
        className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
          activeFilter === 'All' 
            ? 'bg-cyan-600 text-white shadow-md' 
            : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
        }`}
      >
        All Districts
      </button>
      {districts.map(district => (
        <button
          key={district}
          onClick={() => onFilterChange(district)}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
            activeFilter === district 
              ? 'bg-cyan-600 text-white shadow-md' 
              : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          {district}
        </button>
      ))}
    </div>
  );
}

// StatsSection component
function StatsSection({ total, districts, types }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
      <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-xl p-6 text-center shadow-sm transition hover:border-cyan-300 hover:-translate-y-1">
        <p className="text-4xl font-extrabold text-slate-900 mb-1">{total}</p>
        <p className="text-xs text-slate-500 uppercase font-semibold">Total Facilities</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-xl p-6 text-center shadow-sm transition hover:border-cyan-300 hover:-translate-y-1">
        <p className="text-4xl font-extrabold text-slate-900 mb-1">{districts}</p>
        <p className="text-xs text-slate-500 uppercase font-semibold">Districts</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-xl p-6 text-center shadow-sm transition hover:border-cyan-300 hover:-translate-y-1">
        <p className="text-4xl font-extrabold text-slate-900 mb-1">{types.PHC || 0}</p>
        <p className="text-xs text-slate-500 uppercase font-semibold">PHCs Surveyed</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-xl p-6 text-center shadow-sm transition hover:border-cyan-300 hover:-translate-y-1">
        <p className="text-4xl font-extrabold text-slate-900 mb-1">{(types.CHC || 0) + (types.DH || 0)}</p>
        <p className="text-xs text-slate-500 uppercase font-semibold">CHCs & DHs</p>
      </div>
    </div>
  );
}

export default function Glimpses() {
  const [loading, setLoading] = useState(true);
  const [glimpses, setGlimpses] = useState([]);
  const [groupedFacilities, setGroupedFacilities] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedFacility, setSelectedFacility] = useState(null);

  const fetchGlimpses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/glimpses`, { withCredentials: true });
      if (res.data.success) {
        console.log('Fetched glimpses:', res.data.data);
        setGlimpses(res.data.data);
      } else {
        toast.error(res.data.message || 'Failed to load');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load glimpses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlimpses();
  }, []);

  // Group by facilityName – use first occurrence's image and details
  useEffect(() => {
    const map = new Map();
    glimpses.forEach(g => {
      const name = g.facilityName;
      if (!map.has(name)) {
        map.set(name, {
          id: name,
          facility: name,
          district: g.district,
          type: g.facilityType || 'Unknown',
          image: g.imageUrl || null,
          date: g.surveyDate ? new Date(g.surveyDate).toLocaleDateString('en-GB') : 'N/A',
          gps: (g.latitude && g.longitude) ? `${g.latitude}, ${g.longitude}` : 'Not available',
          location: (g.latitude && g.longitude) ? `Lat: ${g.latitude}, Lng: ${g.longitude}` : 'Coordinates missing'
        });
      } else {
        // Use first image if current has none (optional)
        const existing = map.get(name);
        if (!existing.image && g.imageUrl) existing.image = g.imageUrl;
      }
    });
    setGroupedFacilities(Array.from(map.values()));
  }, [glimpses]);

  const districts = useMemo(() => [...new Set(groupedFacilities.map(f => f.district))].sort(), [groupedFacilities]);
  const typesCount = useMemo(() => groupedFacilities.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + 1;
    return acc;
  }, {}), [groupedFacilities]);
  const filtered = useMemo(() => 
    activeFilter === 'All' ? groupedFacilities : groupedFacilities.filter(f => f.district === activeFilter),
    [activeFilter, groupedFacilities]
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading gallery...</div>;

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800 pt-10 pb-20">
      <Toaster position="top-right" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900">Survey Glimpses</h1>
          <p className="max-w-2xl mx-auto text-slate-600 text-lg mt-2">
            A visual documentation of health facilities surveyed under the UNICEF Solar Energy Project across Chhattisgarh.
          </p>
        </div>

        <StatsSection total={groupedFacilities.length} districts={districts.length} types={typesCount} />
        <FilterButtons districts={districts} activeFilter={activeFilter} onFilterChange={setActiveFilter} />

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(facility => (
              <DistrictCard key={facility.id} facility={facility} onClick={setSelectedFacility} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 rounded-2xl border border-slate-200 bg-white/60">
            <p className="text-slate-500 text-lg">No facilities found.</p>
            <p className="text-slate-400 text-sm mt-2">Upload some glimpses using the admin data entry page.</p>
          </div>
        )}
      </div>

      {selectedFacility && <FacilityModal facility={selectedFacility} onClose={() => setSelectedFacility(null)} />}
    </div>
  );
}