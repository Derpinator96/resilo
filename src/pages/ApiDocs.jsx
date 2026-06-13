import React, { useState } from 'react';
import { Copy, CheckCircle2, ChevronDown, ChevronRight, Lock, Unlock, ShieldAlert, Code2 } from 'lucide-react';
import MeshBackground from '../components/MeshBackground';

const ENDPOINTS = [
  {
    tag: 'Locations',
    routes: [
      {
        method: 'GET',
        path: '/api/districts',
        description: 'Returns a list of all available districts.',
        auth: 'Public',
        response: '[\n  "Raipur",\n  "Bilaspur"\n]',
      },
      {
        method: 'GET',
        path: '/api/institutes?district=:district',
        description: 'Returns all healthcare facilities within a specific district.',
        auth: 'Public',
        response: '[\n  {\n    "_id": "60d5ec...",\n    "name": "PHC Abhanpur",\n    "type": "PHC"\n  }\n]',
      }
    ]
  },
  {
    tag: 'Telemetry',
    routes: [
      {
        method: 'GET',
        path: '/api/telemetry/latest',
        description: 'Returns the most recent IoT sensor readings across all facilities.',
        auth: 'Public',
        response: '[\n  {\n    "instituteId": "...",\n    "timestamp": "2026-06-14T03:00:00Z",\n    "temperature": 34.2\n  }\n]',
      },
      {
        method: 'GET',
        path: '/api/telemetry/history',
        description: 'Returns historical telemetry data for trend analysis.',
        auth: 'Public',
        response: '[\n  {\n    "timestamp": "...",\n    "humidity": 45\n  }\n]',
      }
    ]
  },
  {
    tag: 'ML Forecast',
    routes: [
      {
        method: 'POST',
        path: '/api/mlforecast/predict',
        description: 'Generates XGBoost solar generation predictions based on Open-Meteo live weather data.',
        auth: 'Bearer Token (All Roles)',
        request: '{\n  "district": "Raipur",\n  "centreName": "PHC Abhanpur"\n}',
        response: '{\n  "forecast": {\n    "estimated_generation_kwh": 45.2\n  }\n}',
      },
      {
        method: 'GET',
        path: '/api/mlforecast/equipment',
        description: 'Retrieves equipment ratings for energy requirement calculation.',
        auth: 'Bearer Token (All Roles)',
        response: '{\n  "equipment": {\n    "shadowlessLamp": { "ratingOfLoad": 120 }\n  }\n}',
      }
    ]
  },
  {
    tag: 'Centre Data',
    routes: [
      {
        method: 'GET',
        path: '/api/centredata/:district',
        description: 'Fetches detailed infrastructure audit parameters for facilities in a district.',
        auth: 'Bearer Token (All Roles)',
        response: '[\n  {\n    "centreName": "PHC Abhanpur",\n    "pvRating": 10\n  }\n]',
      },
      {
        method: 'PATCH',
        path: '/api/centredata/update/:id',
        description: 'Updates a facility\'s audit data. Accepts multipart/form-data for image uploads.',
        auth: 'Bearer Token (admin, super_admin)',
        request: 'FormData: {\n  "pvRating": 12,\n  "batteryImage": (File)\n}',
        response: '{\n  "message": "Centre data updated successfully"\n}',
      }
    ]
  },
  {
    tag: 'Reporting',
    routes: [
      {
        method: 'POST',
        path: '/api/reports/submit',
        description: 'Submits a facility failure or anomaly report to the Authority Dashboard.',
        auth: 'Bearer Token (All Roles)',
        request: '{\n  "instituteId": "...",\n  "issueType": "Inverter Failure",\n  "description": "..."\n}',
        response: '{\n  "success": true,\n  "reportId": "..."\n}',
      }
    ]
  },
  {
    tag: 'AI Services',
    routes: [
      {
        method: 'POST',
        path: '/api/sanitation/scan',
        description: 'Analyzes an uploaded facility image using GPT-4o Vision for sanitation compliance.',
        auth: 'Bearer Token (All Roles)',
        request: 'FormData: {\n  "image": (File)\n}',
        response: '{\n  "isCompliant": false,\n  "issuesFound": ["Stagnant water detected"]\n}',
      }
    ]
  }
];

// Reusable Copy Block
const CodeBlock = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group rounded-lg overflow-hidden bg-slate-900 border border-slate-700 mt-2">
      <div className="absolute right-2 top-2">
        <button onClick={copyToClipboard} className="p-1.5 rounded-md bg-slate-800 text-slate-400 hover:text-white transition-colors">
          {copied ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
        </button>
      </div>
      <pre className="p-4 text-sm text-sky-300 font-mono overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const EndpointCard = ({ route }) => {
  const [expanded, setExpanded] = useState(false);
  
  const getMethodColor = (m) => {
    if (m === 'GET') return 'bg-teal-100 text-teal-800 border-teal-200';
    if (m === 'POST') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (m === 'PATCH') return 'bg-violet-100 text-violet-800 border-violet-200';
    return 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="bg-white/70 backdrop-blur-md border border-slate-200 shadow-[0_4px_24px_rgba(10,25,47,0.06)] rounded-2xl overflow-hidden mb-6 transition-all hover:shadow-[0_8px_32px_rgba(10,25,47,0.08)]">
      {/* Header */}
      <div 
        className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center gap-4 justify-between bg-white/50 hover:bg-white/80 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 rounded-md text-xs font-black tracking-widest uppercase border ${getMethodColor(route.method)}`}>
            {route.method}
          </span>
          <span className="font-mono text-slate-800 font-semibold">{route.path}</span>
        </div>
        <div className="flex items-center gap-4 text-slate-500">
          <span className="text-sm">{route.description}</span>
          {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="p-6 border-t border-slate-100 bg-white/40">
          
          {/* Auth Banner */}
          <div className="flex items-center gap-2 mb-6 text-sm font-semibold">
            {route.auth === 'Public' ? (
              <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                <Unlock size={16} /> Public Route
              </span>
            ) : route.auth.includes('admin') ? (
              <span className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                <ShieldAlert size={16} /> Requires Admin Authority
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                <Lock size={16} /> Bearer Token Required
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {route.request && (
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-[#0A192F] mb-2">Request Body</h4>
                <CodeBlock code={route.request} />
              </div>
            )}
            <div className={!route.request ? 'lg:col-span-2' : ''}>
              <h4 className="text-xs font-black uppercase tracking-widest text-[#0A192F] mb-2">Response Shape</h4>
              <CodeBlock code={route.response} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function ApiDocs() {
  const [activeTag, setActiveTag] = useState(ENDPOINTS[0].tag);

  const scrollToSection = (tag) => {
    setActiveTag(tag);
    const yOffset = -120; 
    const element = document.getElementById(`section-${tag}`);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({top: y, behavior: 'smooth'});
    }
  };

  return (
    <div className="relative min-h-screen pt-[92px] pb-32 bg-slate-50 font-sans">
      <MeshBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 lg:px-8">
        
        {/* Page Header */}
        <header className="mb-12">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#0A192F] text-white rounded-full text-sm font-semibold tracking-wide mb-6 shadow-lg shadow-blue-900/20">
            <Code2 size={18} className="text-teal-400" /> API v1.0 Live
          </div>
          <h1 className="text-5xl font-extrabold text-[#0A192F] tracking-tight mb-4">
            Resilo API Reference
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl">
            Integrate directly with Resilo's live telemetry, AI forecasting, and state audit infrastructure.
          </p>
          <div className="mt-6 flex items-center gap-2">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Base URL:</span>
            <code className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg text-sm font-mono font-semibold">https://resilo.app</code>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          
          {/* Left Sidebar */}
          <div className="w-full lg:w-64 shrink-0 lg:sticky lg:top-[120px]">
            <nav className="flex flex-col gap-1 border-l-2 border-slate-200 py-2">
              {ENDPOINTS.map((group) => (
                <button
                  key={group.tag}
                  onClick={() => scrollToSection(group.tag)}
                  className={`text-left px-5 py-2.5 text-sm font-bold transition-all -ml-[2px] border-l-2 ${
                    activeTag === group.tag 
                      ? 'border-[#0D9488] text-[#0D9488] bg-teal-50/50' 
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                  }`}
                >
                  {group.tag}
                </button>
              ))}
            </nav>
          </div>

          {/* Right Content */}
          <div className="flex-1 min-w-0">
            
            {/* Global Auth Card */}
            <div className="bg-[#0A192F] text-white rounded-3xl p-8 mb-12 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Lock size={120} />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <ShieldAlert className="text-amber-400" /> Authentication required
                </h3>
                <p className="text-slate-300 mb-6 leading-relaxed">
                  Most routes in the Resilo API are protected and require a Bearer token. 
                  Tokens are provisioned dynamically via Clerk authentication.
                </p>
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-5 font-mono text-sm text-sky-200">
                  <div className="mb-2 text-slate-400 font-sans text-xs font-bold uppercase tracking-widest">React Example</div>
                  const {'{'} getToken {'}'} = useAuth();<br/>
                  const token = await getToken();<br/>
                  fetch('/api/endpoint', {'{'}<br/>
                  &nbsp;&nbsp;headers: {'{'} Authorization: `Bearer {'${token}'}` {'}'}<br/>
                  {'}'});
                </div>
              </div>
            </div>

            {/* Endpoint Groups */}
            {ENDPOINTS.map((group) => (
              <div key={group.tag} id={`section-${group.tag}`} className="mb-16">
                <h2 className="text-3xl font-extrabold text-[#0A192F] mb-6 flex items-center gap-3">
                  {group.tag}
                  <div className="h-px bg-slate-200 flex-1 ml-4"></div>
                </h2>
                
                {group.routes.map((route, i) => (
                  <EndpointCard key={i} route={route} />
                ))}
              </div>
            ))}

          </div>
        </div>
      </div>
    </div>
  );
}
