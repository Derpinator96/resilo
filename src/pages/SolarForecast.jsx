import React, { useState, useEffect } from "react";
import { useAuth } from '@clerk/clerk-react';
import {
    LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

//Energy calculation constants
const SHADOWLESS_LAMP_HOURS = 2;   // hrs per delivery
const BABY_WARMER_HOURS     = 6;   // hrs per delivery

export default function SolarForecastPage() {
    const { getToken } = useAuth();
    //Forecast state
    const [district, setDistrict] = useState("");
    const [centre,   setCentre]   = useState("");
    const [result,   setResult]   = useState(null);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState("");

    //Delivery calculator state
    const [deliveries,    setDeliveries]    = useState("");
    const [equipment,     setEquipment]     = useState(null);
    const [eqLoading,     setEqLoading]     = useState(false);
    const [eqError,       setEqError]       = useState("");
    const [energyResult,  setEnergyResult]  = useState(null);

    // Dynamic data
    const [districts, setDistricts] = useState([]);
    const [centres, setCentres] = useState([]);

    useEffect(() => {
        fetch('/api/districts')
            .then(res => res.json())
            .then(data => setDistricts(Array.isArray(data) ? data : []))
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (district) {
            fetch(`/api/institutes?district=${encodeURIComponent(district)}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setCentres(data.map(c => c.name));
                    }
                })
                .catch(console.error);
        } else {
            setCentres([]);
        }
    }, [district]);

    //Fetch solar forecast
    const fetchForecast = async () => {
        if (!district || !centre) return;
        setLoading(true);
        setError("");
        setResult(null);
        setEquipment(null);
        setEnergyResult(null);
        setDeliveries("");

        try {
            const token = await getToken();
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const res = await fetch(`/api/mlforecast/predict?district=${encodeURIComponent(district)}&centreName=${encodeURIComponent(centre)}`, { headers });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to fetch forecast");
            }
            const data = await res.json();
            setResult(data);

            // Also fetch equipment data for this centre in parallel
            setEqLoading(true);
            try {
                const eqResp = await fetch(`/api/mlforecast/equipment?district=${encodeURIComponent(district)}&centreName=${encodeURIComponent(centre)}`, { headers });
                if (eqResp.ok) {
                    const eqData = await eqResp.json();
                    setEquipment(eqData);
                } else {
                    setEqError("Could not fetch equipment data for this centre.");
                }
            } catch (e) {
                setEqError("Could not fetch equipment data for this centre.");
            } finally {
                setEqLoading(false);
            }

        } catch (e) {
            setError(e.message || "Failed to fetch forecast");
        } finally {
            setLoading(false);
        }
    };

    //Calculate energy demand
    const calculateEnergy = () => {
        if (!deliveries || !equipment) return;
        const n = parseInt(deliveries);
        if (isNaN(n) || n <= 0) return;

        const lamp   = equipment.equipment?.shadowlessLamp;
        const warmer = equipment.equipment?.babyWarmer;

        // Energy in kWh = (rating_W / 1000) * hours * deliveries
        const lampEnergy   = lamp
            ? (lamp.ratingOfLoad / 1000) * SHADOWLESS_LAMP_HOURS * n
            : 0;
        const warmerEnergy = warmer
            ? (warmer.ratingOfLoad / 1000) * BABY_WARMER_HOURS * n
            : 0;
        const totalDemand  = lampEnergy + warmerEnergy;

        const solarGen     = result?.forecast?.estimated_generation_kwh || 0;
        const surplus      = solarGen - totalDemand;
        const sufficient   = surplus >= 0;
        const coveragePct  = solarGen > 0
            ? Math.min(100, Math.round((solarGen / totalDemand) * 100))
            : 0;

        setEnergyResult({
            deliveries:    n,
            lampEnergy:    Math.round(lampEnergy * 100) / 100,
            warmerEnergy:  Math.round(warmerEnergy * 100) / 100,
            totalDemand:   Math.round(totalDemand * 100) / 100,
            solarGen:      Math.round(solarGen * 100) / 100,
            surplus:       Math.round(Math.abs(surplus) * 100) / 100,
            sufficient,
            coveragePct,
            lamp,
            warmer
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 pb-32">
            <div className="max-w-4xl mx-auto space-y-6 pt-16">

                {/* Page Header */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        Solar Irradiance Forecast
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        ML-powered prediction · XGBoost · Live weather from Open-Meteo
                    </p>
                </div>

                {/* Location Selector */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <p className="text-sm font-semibold text-slate-600 mb-3">
                        Select Location
                    </p>
                    <div className="flex gap-3 flex-wrap">
                        <select
                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 flex-1 min-w-40"
                            value={district}
                            onChange={e => {
                                setDistrict(e.target.value);
                                setCentre("");
                                setResult(null);
                                setEquipment(null);
                                setEnergyResult(null);
                                setDeliveries("");
                                setError("");
                            }}
                        >
                            <option value="">Select District</option>
                            {districts.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>

                        <select
                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 flex-1 min-w-45"
                            value={centre}
                            onChange={e => setCentre(e.target.value)}
                            disabled={!district}
                        >
                            <option value="">Select Centre</option>
                            {centres.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>

                        <button
                            onClick={fetchForecast}
                            disabled={!centre || loading}
                            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-blue-700 transition-colors"
                        >
                            {loading ? "Predicting…" : "Predict"}
                        </button>
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm mt-3">{error}</p>
                    )}
                </div>

                {/* Forecast Results */}
                {result && (
                    <>
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
                                <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide">
                                    Predicted GHI
                                </p>
                                <p className="text-3xl font-extrabold text-amber-800 mt-2">
                                    {result.forecast.predicted_ghi}
                                    <span className="text-sm font-semibold ml-1">MJ/m²</span>
                                </p>
                                <p className="text-xs text-amber-600 mt-1">
                                    for {result.forecast.for_date}
                                </p>
                            </div>

                            <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                                <p className="text-xs text-green-700 font-semibold uppercase tracking-wide">
                                    Est. Generation
                                </p>
                                <p className="text-3xl font-extrabold text-green-800 mt-2">
                                    {result.forecast.estimated_generation_kwh}
                                    <span className="text-sm font-semibold ml-1">kWh</span>
                                </p>
                                <p className="text-xs text-green-600 mt-1">
                                    {result.forecast.pv_capacity_kwp} kWp installed
                                </p>
                            </div>

                            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                                <p className="text-xs text-blue-700 font-semibold uppercase tracking-wide">
                                    Solar Irradiance
                                </p>
                                <p className="text-3xl font-extrabold text-blue-800 mt-2">
                                    {result.forecast.predicted_kwh_m2}
                                    <span className="text-sm font-semibold ml-1">kWh/m²</span>
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                    {result.centre.name} · {result.centre.district}
                                </p>
                            </div>
                        </div>

                        {/* 7-day History Chart */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <p className="text-sm font-semibold text-slate-700 mb-1">
                                Last 7 Days GHI
                            </p>
                            <p className="text-xs text-slate-400 mb-4">
                                Historical solar irradiance used as model input (MJ/m²)
                            </p>
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart
                                    data={result.forecast.history}
                                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 11 }}
                                        tickFormatter={d => d.slice(5)}
                                    />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip
                                        formatter={v => [`${v} MJ/m²`, "GHI"]}
                                        labelFormatter={l => `Date: ${l}`}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="ghi"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                )}

                {/* Delivery Energy Calculator */}
                {result && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">

                        {/* Section header */}
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-base font-bold text-slate-800">
                                Tomorrow's Delivery Energy Planner
                            </h2>
                        </div>
                        <p className="text-xs text-slate-400 mb-5">
                            Enter planned deliveries to check if tomorrow's solar generation covers the critical load demand
                        </p>

                        {eqLoading && (
                            <p className="text-sm text-slate-400">Loading equipment data…</p>
                        )}

                        {eqError && (
                            <p className="text-sm text-red-500">{eqError}</p>
                        )}

                        {equipment && !eqLoading && (
                            <>
                                {/* Equipment summary */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                                    {/* Shadowless Lamp */}
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                                             Shadowless Lamp
                                        </p>
                                        {equipment.equipment?.shadowlessLamp ? (
                                            <div className="space-y-1">
                                                <p className="text-sm text-slate-700 capitalize">
                                                    {equipment.equipment.shadowlessLamp.typeOfLoad}
                                                </p>
                                                <p className="text-xl font-bold text-slate-800">
                                                    {equipment.equipment.shadowlessLamp.ratingOfLoad}
                                                    <span className="text-sm font-normal ml-1">W</span>
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {equipment.equipment.shadowlessLamp.numberOfLoad} unit(s) ·{" "}
                                                    {SHADOWLESS_LAMP_HOURS} hrs/delivery
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-400 italic">Not found in centre data</p>
                                        )}
                                    </div>

                                    {/* Baby Warmer */}
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                                             Baby Warmer
                                        </p>
                                        {equipment.equipment?.babyWarmer ? (
                                            <div className="space-y-1">
                                                <p className="text-sm text-slate-700 capitalize">
                                                    {equipment.equipment.babyWarmer.typeOfLoad}
                                                </p>
                                                <p className="text-xl font-bold text-slate-800">
                                                    {equipment.equipment.babyWarmer.ratingOfLoad}
                                                    <span className="text-sm font-normal ml-1">W</span>
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {equipment.equipment.babyWarmer.numberOfLoad} unit(s) ·{" "}
                                                    {BABY_WARMER_HOURS} hrs/delivery
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-400 italic">Not found in centre data</p>
                                        )}
                                    </div>
                                </div>

                                {/* Deliveries input */}
                                <div className="flex gap-3 items-end mb-5">
                                    <div className="flex-1">
                                        <label className="block text-sm font-semibold text-slate-600 mb-1">
                                            Planned Deliveries Tomorrow
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="Enter number of deliveries"
                                            value={deliveries}
                                            onChange={e => {
                                                setDeliveries(e.target.value);
                                                setEnergyResult(null);
                                            }}
                                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                                        />
                                    </div>
                                    <button
                                        onClick={calculateEnergy}
                                        disabled={!deliveries || parseInt(deliveries) <= 0}
                                        className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-indigo-700 transition-colors"
                                    >
                                        Calculate
                                    </button>
                                </div>

                                {/* Energy breakdown & verdict */}
                                {energyResult && (
                                    <div className="space-y-4">

                                        {/* Breakdown */}
                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                                                Energy Breakdown for {energyResult.deliveries} Deliveries
                                            </p>
                                            <div className="space-y-2">
                                                {energyResult.lamp && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-600">
                                                             Shadowless Lamp
                                                            <span className="text-slate-400 text-xs ml-1">
                                                                ({energyResult.lamp.ratingOfLoad}W × {SHADOWLESS_LAMP_HOURS}h × {energyResult.deliveries})
                                                            </span>
                                                        </span>
                                                        <span className="font-semibold text-slate-800">
                                                            {energyResult.lampEnergy} kWh
                                                        </span>
                                                    </div>
                                                )}
                                                {energyResult.warmer && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-600">
                                                             Baby Warmer
                                                            <span className="text-slate-400 text-xs ml-1">
                                                                ({energyResult.warmer.ratingOfLoad}W × {BABY_WARMER_HOURS}h × {energyResult.deliveries})
                                                            </span>
                                                        </span>
                                                        <span className="font-semibold text-slate-800">
                                                            {energyResult.warmerEnergy} kWh
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold">
                                                    <span className="text-slate-700">Total Demand</span>
                                                    <span className="text-slate-900">{energyResult.totalDemand} kWh</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-600"> Solar Generation (predicted)</span>
                                                    <span className="font-semibold text-green-700">{energyResult.solarGen} kWh</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress bar */}
                                        <div>
                                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                                                <span>Solar coverage</span>
                                                <span>{energyResult.coveragePct}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-3">
                                                <div
                                                    className={`h-3 rounded-full transition-all duration-500 ${
                                                        energyResult.sufficient
                                                            ? "bg-green-500"
                                                            : energyResult.coveragePct >= 70
                                                                ? "bg-amber-400"
                                                                : "bg-red-500"
                                                    }`}
                                                    style={{ width: `${energyResult.coveragePct}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Verdict */}
                                        <div className={`rounded-xl p-5 border ${
                                            energyResult.sufficient
                                                ? "bg-green-50 border-green-200"
                                                : "bg-red-50 border-red-200"
                                        }`}>
                                            <div className="flex items-start gap-3">
                                                <span className="text-2xl">
                                                    {energyResult.sufficient ? "✅" : "⚠️"}
                                                </span>
                                                <div>
                                                    <p className={`font-bold text-base ${
                                                        energyResult.sufficient
                                                            ? "text-green-800"
                                                            : "text-red-800"
                                                    }`}>
                                                        {energyResult.sufficient
                                                            ? "Solar generation is sufficient"
                                                            : "Solar generation is insufficient"}
                                                    </p>
                                                    <p className={`text-sm mt-1 ${
                                                        energyResult.sufficient
                                                            ? "text-green-700"
                                                            : "text-red-700"
                                                    }`}>
                                                        {energyResult.sufficient
                                                            ? `${energyResult.surplus} kWh surplus available after covering ${energyResult.deliveries} delivery${energyResult.deliveries > 1 ? "s" : ""}.`
                                                            : `${Math.abs(energyResult.surplus)} kWh shortfall for ${energyResult.deliveries} delivery${energyResult.deliveries > 1 ? "s" : ""}. Grid backup or load scheduling recommended.`
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
