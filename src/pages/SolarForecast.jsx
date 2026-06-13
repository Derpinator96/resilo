import React, { useState, useEffect } from "react";
import { useAuth } from '@clerk/clerk-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const SHADOWLESS_LAMP_HOURS = 2;
const BABY_WARMER_HOURS = 6;
const glassCardClass = "bg-white/25 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.15)] rounded-3xl transition-all duration-300 hover:bg-white/35 hover:border-white/70 hover:-translate-y-1"

import MeshBackground from '../components/MeshBackground';

export default function SolarForecast() {
    const { getToken } = useAuth();
    
    const [districts, setDistricts] = useState([]);
    const [selectedDistrict, setSelectedDistrict] = useState("");
    const [centres, setCentres] = useState([]);
    const [selectedCentre, setSelectedCentre] = useState("");

    const [result,  setResult]  = useState(null);
    const [loading,  setLoading] = useState(false);
    const [error,    setError]   = useState("");

    const [deliveries,    setDeliveries]    = useState("");
    const [equipment,     setEquipment]     = useState(null);
    const [eqLoading,     setEqLoading]     = useState(false);
    const [eqError,       setEqError]       = useState("");
    const [energyResult,  setEnergyResult]  = useState(null);

    useEffect(() => {
        fetch('/api/districts')
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                if (Array.isArray(data)) setDistricts(data);
            })
            .catch(err => console.error("Error fetching districts:", err));
    }, []);

    useEffect(() => {
        if (!selectedDistrict) {
            setCentres([]);
            setSelectedCentre("");
            return;
        }
        fetch(`/api/institutes?district=${encodeURIComponent(selectedDistrict)}`)
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                if (Array.isArray(data)) setCentres(data);
            })
            .catch(err => console.error("Error fetching centres:", err));
    }, [selectedDistrict]);

    const fetchForecast = async () => {
        if (!selectedDistrict || !selectedCentre) return;
        setLoading(true); setError(""); setResult(null); setEquipment(null); setEnergyResult(null); setDeliveries("");
        try {
            const token = await getToken();
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const res = await fetch(`/api/mlforecast/predict?district=${encodeURIComponent(selectedDistrict)}&centreName=${encodeURIComponent(selectedCentre)}`, { headers });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to fetch forecast");
            }
            const data = await res.json();
            setResult(data);

            setEqLoading(true);
            try {
                const eqResp = await fetch(`/api/mlforecast/equipment?district=${encodeURIComponent(selectedDistrict)}&centreName=${encodeURIComponent(selectedCentre)}`, { headers });
                if (eqResp.ok) {
                    const eqData = await eqResp.json();
                    setEquipment(eqData);
                } else setEqError("Could not fetch equipment data.");
            } catch (e) {
                setEqError("Could not fetch equipment data.");
            } finally { setEqLoading(false); }
        } catch (e) {
            setError(e.message || "Failed to fetch forecast");
        } finally { setLoading(false); }
    };

    const calculateEnergy = () => {
        if (!deliveries || !equipment) return;
        const n = parseInt(deliveries);
        if (isNaN(n) || n <= 0) return;

        const lamp   = equipment.equipment?.shadowlessLamp;
        const warmer = equipment.equipment?.babyWarmer;

        const lampEnergy   = lamp ? (lamp.ratingOfLoad / 1000) * SHADOWLESS_LAMP_HOURS * n : 0;
        const warmerEnergy = warmer ? (warmer.ratingOfLoad / 1000) * BABY_WARMER_HOURS * n : 0;
        const totalDemand  = lampEnergy + warmerEnergy;

        const solarGen     = result?.forecast?.estimated_generation_kwh || 0;
        const surplus      = solarGen - totalDemand;
        const sufficient   = surplus >= 0;
        const coveragePct  = solarGen > 0 ? Math.min(100, Math.round((solarGen / totalDemand) * 100)) : 0;

        setEnergyResult({
            deliveries: n, lampEnergy: Math.round(lampEnergy * 100) / 100, warmerEnergy: Math.round(warmerEnergy * 100) / 100,
            totalDemand: Math.round(totalDemand * 100) / 100, solarGen: Math.round(solarGen * 100) / 100,
            surplus: Math.round(Math.abs(surplus) * 100) / 100, sufficient, coveragePct, lamp, warmer
        });
    };

    return (
        <div className="relative min-h-screen pt-[92px] pb-32 bg-slate-50 font-sans">
            <MeshBackground />
            <div className="relative z-10 max-w-7xl mx-auto px-4 lg:px-8 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-4xl font-extrabold text-[#0A192F] tracking-tight">AI Climate Intelligence</h2>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">XGBoost Engine · Live Open-Meteo Integration</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <select 
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        className="p-3 rounded-xl border border-slate-300 bg-white shadow-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                        <option value="">Select District</option>
                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    
                    <select 
                        value={selectedCentre}
                        onChange={(e) => setSelectedCentre(e.target.value)}
                        disabled={!selectedDistrict}
                        className="p-3 rounded-xl border border-slate-300 bg-white shadow-sm focus:ring-2 focus:ring-teal-500 outline-none disabled:opacity-50"
                    >
                        <option value="">Select Facility</option>
                        {centres.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                    </select>
                </div>

                {error && <div className="p-6 text-center text-red-900 bg-red-500/20 backdrop-blur-xl border border-red-500/40 rounded-3xl font-bold">{error}</div>}

            {/* PRE-FETCH CTA STATE */}
            {!result && !loading && !error && (
                <div className={`${glassCardClass} p-16 flex flex-col items-center justify-center text-center`}>
                    <div className="w-20 h-20 bg-gradient-to-tr from-teal-500/20 to-teal-500/20 border border-white/50 text-slate-800 rounded-3xl flex items-center justify-center mb-6 backdrop-blur-md shadow-inner">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                        </svg>
                    </div>
                    <h3 className="text-3xl font-black text-black mb-3">Engine Ready</h3>
                    <p className="text-base font-medium text-slate-900/70 mb-10 max-w-lg">
                        Initialize the AI prediction matrix to fetch live environmental data and calculate renewable load capacities for {selectedCentre || 'the facility'}.
                    </p>
                    <button onClick={fetchForecast} disabled={!selectedDistrict || !selectedCentre} className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-teal-600 to-teal-600 hover:from-teal-500 hover:to-teal-500 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none">
                        <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        Predict Irradiance
                    </button>
                </div>
            )}

            {/* LOADING STATE */}
            {loading && (
                <div className={`${glassCardClass} p-20 flex flex-col items-center justify-center`}>
                    <div className="w-16 h-16 border-4 border-white/30 border-t-teal-600 rounded-full animate-spin mb-6"></div>
                    <p className="text-sm font-black uppercase tracking-widest text-slate-900/70 animate-pulse">Running XGBoost Model Matrix...</p>
                </div>
            )}

            {/* RESULTS STATE */}
            {result && !loading && (
                <>
                    {/* FORECAST CARDS */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                        {[
                            { label: 'Predicted GHI', value: result.forecast.predicted_ghi, unit: 'MJ/m²', grad: 'from-yellow-200/40 to-orange-200/40', text: 'text-orange-950' },
                            { label: 'Est. Generation', value: result.forecast.estimated_generation_kwh, unit: 'kWh', grad: 'from-green-200/40 to-emerald-200/40', text: 'text-emerald-950' },
                            { label: 'Solar Irradiance', value: result.forecast.predicted_kwh_m2, unit: 'kWh/m²', grad: 'from-blue-200/30 to-indigo-200/30', text: 'text-blue-950' },
                            { label: 'Pred. Temp', value: result.forecast.predicted_temp || 35, unit: '°C', grad: 'from-red-200/40 to-orange-200/40', text: 'text-red-950' },
                            { label: 'Pred. Humidity', value: result.forecast.predicted_humidity || 60, unit: '%', grad: 'from-cyan-200/40 to-blue-200/40', text: 'text-cyan-950' }
                        ].map((c, i) => (
                            <div key={i} className={`bg-white/25 backdrop-blur-xl border border-white/40 rounded-3xl p-6 relative overflow-hidden group shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all hover:scale-105 hover:-translate-y-1`}>
                                <div className={`absolute inset-0 bg-gradient-to-br ${c.grad} opacity-60 pointer-events-none`} />
                                <div className="relative z-10">
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-900/60 mb-3">{c.label}</p>
                                    <p className={`text-3xl font-black ${c.text} tracking-tighter`}>
                                        {c.value}
                                        <span className="text-sm font-bold ml-1 opacity-70">{c.unit}</span>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* HISTORY CHART */}
                    <div className={`${glassCardClass} p-8`}>
                        <h3 className="text-lg font-black text-black tracking-tight mb-1">7-Day Irradiance Analysis</h3>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-900/50 mb-8">Historical baseline (MJ/m²)</p>
                        <ResponsiveContainer width="100%" height={260}>
                            <LineChart data={result.forecast.history} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#4c1d95', fontWeight: 600 }} tickFormatter={d => d.slice(5)} stroke="rgba(255,255,255,0.4)" />
                                <YAxis tick={{ fontSize: 12, fill: '#4c1d95', fontWeight: 600 }} stroke="rgba(255,255,255,0.4)" />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.5)', fontWeight: 'bold', color: '#000' }} formatter={v => [`${v} MJ/m²`, "GHI"]} labelFormatter={l => `Date: ${l}`} />
                                <Line type="monotone" dataKey="ghi" stroke="#8b5cf6" strokeWidth={4} dot={{ r: 6, fill: '#fff', stroke: '#8b5cf6', strokeWidth: 2 }} activeDot={{ r: 8, fill: '#ec4899', stroke: '#fff' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* DELIVERY ENERGY CALCULATOR */}
                    <div className={`${glassCardClass} p-8`}>
                        <div className="mb-8">
                            <h3 className="text-xl font-black text-black tracking-tight mb-1">Grid Defection Planner</h3>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-900/50">Determine exact operational capacity based on tomorrow's solar yield</p>
                        </div>
                        
                        {eqLoading && <p className="text-sm font-bold text-slate-900/50 animate-pulse">Syncing hardware logs…</p>}
                        {eqError && <p className="text-sm font-bold text-red-600">{eqError}</p>}

                        {equipment && !eqLoading && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
                                    <div className="bg-white/20 border border-white/40 rounded-2xl p-5 backdrop-blur-md">
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-900/50 mb-3">Shadowless Lamp</p>
                                        {equipment.equipment?.shadowlessLamp ? (
                                            <div>
                                                <p className="text-3xl font-black text-black">{equipment.equipment.shadowlessLamp.ratingOfLoad}<span className="text-sm ml-1">W</span></p>
                                            </div>
                                        ) : (<p className="text-sm font-bold text-slate-900/30 italic">Unregistered</p>)}
                                    </div>
                                    <div className="bg-white/20 border border-white/40 rounded-2xl p-5 backdrop-blur-md">
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-900/50 mb-3">Baby Warmer</p>
                                        {equipment.equipment?.babyWarmer ? (
                                            <div>
                                                <p className="text-3xl font-black text-black">{equipment.equipment.babyWarmer.ratingOfLoad}<span className="text-sm ml-1">W</span></p>
                                            </div>
                                        ) : (<p className="text-sm font-bold text-slate-900/30 italic">Unregistered</p>)}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 items-end mb-10">
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-black uppercase tracking-widest text-slate-900/70 mb-2">Target Operations (Deliveries)</label>
                                        <input
                                            type="number" min="1"
                                            placeholder="Input delivery volume..."
                                            value={deliveries}
                                            onChange={e => { setDeliveries(e.target.value); setEnergyResult(null); }}
                                            className="w-full bg-white/40 border border-white/50 backdrop-blur-md rounded-2xl px-5 py-4 text-black font-black placeholder-slate-900/30 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={calculateEnergy}
                                        disabled={!deliveries || parseInt(deliveries) <= 0}
                                        className="w-full sm:w-auto bg-black text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest disabled:opacity-30 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/20"
                                    >Compute</button>
                                </div>

                                {energyResult && (
                                    <div className="space-y-6">
                                        <div className="bg-white/20 border border-white/40 rounded-3xl p-6 backdrop-blur-md">
                                            <div className="flex justify-between items-center py-3 border-b border-white/30 text-base font-black">
                                                <span className="text-slate-900/70">Required Demand</span>
                                                <span className="text-black text-xl">{energyResult.totalDemand} kWh</span>
                                            </div>
                                            <div className="flex justify-between items-center py-3 text-base font-black">
                                                <span className="text-slate-900/70">Predicted Yield</span>
                                                <span className="text-emerald-700 text-xl">{energyResult.solarGen} kWh</span>
                                            </div>
                                        </div>

                                        <div className="bg-white/30 rounded-full h-4 overflow-hidden border border-white/50">
                                            <div
                                                className={`h-full transition-all duration-1000 ${energyResult.sufficient ? "bg-gradient-to-r from-emerald-400 to-green-500" : energyResult.coveragePct >= 70 ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-gradient-to-r from-red-400 to-rose-500"}`}
                                                style={{ width: `${energyResult.coveragePct}%` }}
                                            />
                                        </div>

                                        <div className={`rounded-3xl p-6 border backdrop-blur-xl ${energyResult.sufficient ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900" : "bg-red-500/10 border-red-500/30 text-red-900"}`}>
                                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                                                <div className={`flex items-center justify-center w-12 h-12 rounded-2xl ${energyResult.sufficient ? 'bg-emerald-500/20' : 'bg-red-500/20'} shrink-0`}>
                                                    <span className="text-2xl">{energyResult.sufficient ? "✓" : "!"}</span>
                                                </div>
                                                <div>
                                                    <p className="font-black text-lg sm:text-xl tracking-tight mb-1">
                                                        {energyResult.sufficient ? "System Optimal: Zero Grid Reliance" : "Warning: Capacity Deficit Detected"}
                                                    </p>
                                                    <p className="text-sm font-bold opacity-80">
                                                        {energyResult.sufficient ? `Estimated ${energyResult.surplus} kWh surplus margin after operational load.` : `Critical ${Math.abs(energyResult.surplus)} kWh shortfall. Backup grid initialization required.`}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </>
            )}
            </div>
        </div>
    );
}