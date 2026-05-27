import axios from 'axios'
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import '../utils/icons.js' 
import nitrLogo   from '../assets/NITRR Logo.png';
import unicefLogo from '../assets/logo-unicef.png';
import { ExportPDFButton } from '../pages/DashboardPDF.jsx';

// Constants
const SAFETY_FACTOR  = 1.25;
const POWER_FACTOR   = 0.8;
const BATTERY_EFF    = 0.8;
const INVERTER_EFF   = 0.8;
const BACKUP_HOURS   = 10;
const HOURS_PER_DAY  = 16;
const DAYS_PER_MONTH = 30;
const PERFORMANCE_RATIO = 0.75;
const DERATING_FACTOR = 0.88;
const SOILING_FACTOR = 0.92;
const MISMATCH_FACTOR = 0.97;
const DIVERSITY_FACTOR = 0.7;
const EFFECTIVE_EFFICIENCY = 56.25; // 0.75 * 0.88 * 0.92 * 0.97 * 0.965 (5 year degradation)

// Function to determine backup hours for critical loads based on load type
const LOAD_BACKUP_MODEL = {
  "ceiling fan": 12,
  "tube light": 8,
  "led light": 8,
  "iceline refrigerator": 24,
  "deep freezer": 24,
  "refrigerator": 24,
  "glassdoor refrigerator": 24,
  "laboratory refrigerator": 24,
  "servo controlled baby warmer": 6,
  "shadowless lamp": 4,
  "cooler": 10,
  "pc": 8,
  "ac": 8,
  "printer": 1,
};
function getBackupHours(load) {
  const name = load.typeOfLoad?.toLowerCase().trim() || "";
  return LOAD_BACKUP_MODEL[name] || 4;
}

// Formulas used in calculations
function formulasused() {
  return {
    InverterSizing: "Inverter Rating (VA) = (Power Of Total Connected Loads (Watts) * Safety Factor) / Power Factor",
    BatterySizing: "Battery Capacity (AH) = (Power Of Total Connected Loads (Watts) * Backup Time (Hours)* Safety Factor) / (Battery Voltage * Battery Efficiency * Inverter Efficiency)",
    IdealSolarGeneration:"Ideal Solar Generation (kWh) = Solar Irradiance (kWh/m²) * Total Installed (kWp) * Effective Efficiency",
    EffectiveEfficiency:"Effective Efficiency = Performance Ratio (0.75) * Derating Factor (0.88) * Soiling Factor (0.92) * Mismatch Factor (0.97) * Degradation Factor (≈0.965 for 5 years)",
    EfficiencyReduction: "Effective Utilisation Efficiency Reduction (%) = ((Ideal Solar Generation - Actual Solar Energy Utilisation) / Ideal Solar Generation) * 100",
  }
};

// Calculation function
function calcSystem(centre, loads, batteryVoltage, batteryCount, monthlyEnergyConsumption) {
  const gridconsumption = centre.gridconsumption || [];
  const pvLoads  = loads.filter((l) => (l.pvConnectedquantity) > 0);
  const criticalLoads  = loads.filter((l) => l.criticalLoad);
  const monthlyenergyConsumption = centre.monthlyEnergyConsumption

  //total power calculation for pv connected load
  const pvloadTotalW = pvLoads.reduce(
    (s, l) => s + Number(l.pvConnectedquantity) * Number(l.ratingOfLoad), 0
  );
  
  //total power calculation for critical loads
  const criticalloadW = criticalLoads.reduce(
    (s, l) => s + Number(l.numberOfLoad) * Number(l.ratingOfLoad), 0
  );

  const totalloadW = loads
  .filter(load => load.typeOfLoad?.toLowerCase() !== "ac")
  .reduce((sum, load) => sum + Number(load.numberOfLoad) * Number(load.ratingOfLoad), 0);

  //inverter sizing calculation for pv connected load
  const pvloadWithSafety = pvloadTotalW * SAFETY_FACTOR;
  const pvloadrequiredInverterVA = pvloadWithSafety / POWER_FACTOR;
 
  //inverter sizing calculation for critical load
  const criticalloadWithSafety   = criticalloadW * SAFETY_FACTOR;
  const criticalloadrequiredInverterVA = criticalloadWithSafety / POWER_FACTOR;

  //inverter sizing calculation for total load
  const totalloadWithSafety = totalloadW * SAFETY_FACTOR;
  const totalloadrequiredInverterVA = totalloadWithSafety * DIVERSITY_FACTOR / POWER_FACTOR;

  const sysV = batteryVoltage * batteryCount|| 48 ;

  //battery sizing calaculations for pv connected load
  const pvloadrequiredBatteryAH =
    (pvloadWithSafety * BACKUP_HOURS) / (sysV * BATTERY_EFF * INVERTER_EFF);

  //battery sizing calaculations for critical load
  const criticalloadrequiredBatteryAH = criticalLoads.reduce((sum, load) => {
    const loadW =Number(load.numberOfLoad) * Number(load.ratingOfLoad);
    const backupHours = getBackupHours(load);
    const batteryAH =
      (loadW * SAFETY_FACTOR * backupHours) /
      (sysV * BATTERY_EFF * INVERTER_EFF);
    return sum + batteryAH;
  }, 0);

  //battery sizing calaculations for total load
 const totalloadrequiredBatteryAH = loads.reduce((sum, load) => {
  const loadW =Number(load.numberOfLoad) * Number(load.ratingOfLoad);
  const backupHours = getBackupHours(load);
  const batteryAH =
    (loadW * SAFETY_FACTOR * backupHours * DIVERSITY_FACTOR) /
    (sysV * BATTERY_EFF * INVERTER_EFF);
  return sum + batteryAH;
 }, 0);

  const criticalLoadMonthlyKwh = loads.reduce((sum, load) => {
    if (!load.criticalLoad) {
    return sum; // skip non‑critical loads
    }

    const rating  = Number(load.ratingOfLoad);
    const number  = Number(load.numberOfLoad);
    const name    = load.typeOfLoad?.toLowerCase();

    let hoursPerMonth = 0;
    // Refrigeration loads → always-on, 24h × 30 days
    if (
      name.includes("deep freezer") ||
      name.includes("iceline refrigerator") ||
      name.includes("refrigerator") ||
      name.includes("glassdoor refrigerator") ||
      name.includes("laboratory refrigerator")
    ) {hoursPerMonth = 24 * 30;}
    // Servo controlled baby warmer → 6h × deliveries per month
    else if (name.includes("servo controlled baby")) {
      hoursPerMonth = 6 * centre?.additionalInfo.noofdeliveryperMonth;
    }
    // Shadowless lamp → 2h × deliveries per month
    else if (name.includes("shadowless lamp")) {
      hoursPerMonth = 2 * centre?.additionalInfo.noofdeliveryperMonth;
    }
    // Default fallback → your old CRITICALLOAD_HOURS_PER_DAY × 30
    else {
      hoursPerMonth = HOURS_PER_DAY * DAYS_PER_MONTH;
    }

    return sum + (rating * number * hoursPerMonth) / 1000;
  }, 0);  

const avggridConsumption = gridconsumption.length
  ? (() => {
      const avg = gridconsumption.reduce((s, d) => s + d.consumption, 0) / gridconsumption.length;
      return avg === 0 ? monthlyenergyConsumption : avg;
    })()
  : 0;

// utilization factor calculation
  const connectedLoadKW = totalloadW / 1000;
  const maxPossibleMonthlyEnergy =connectedLoadKW * 24 * DAYS_PER_MONTH;
  const UTILIZATION_FACTOR =avggridConsumption / maxPossibleMonthlyEnergy;

const pvLoadMonthlyKwh = (pvloadTotalW * HOURS_PER_DAY * DAYS_PER_MONTH * UTILIZATION_FACTOR) / 1000;

const totalLoadMonthlyKwh =
  (totalloadW * HOURS_PER_DAY * DAYS_PER_MONTH * UTILIZATION_FACTOR) / 1000;

return {
  pvLoads,
  pvloadTotalW,
  criticalloadW,
  totalloadW,
  pvloadWithSafety,
  criticalloadWithSafety,
  totalloadWithSafety,
  pvloadrequiredInverterVA,
  criticalloadrequiredInverterVA,
  totalloadrequiredInverterVA,
  pvloadrequiredBatteryAH,
  criticalloadrequiredBatteryAH,
  totalloadrequiredBatteryAH,
  pvLoadMonthlyKwh,
  criticalLoadMonthlyKwh,
  totalLoadMonthlyKwh,
  sysV,
};
};

// Comparison function
function comparison({ centre }) {
  const loads     = centre.loadsConnected  || [];
  const idealsolarganeration = centre.solargeneration || [];
  const actualsolargeneration = centre.actualsolargeneration || [];
  const gridconsumption = centre.gridconsumption || [];

  // existing battery rating calculation
  const batteryVoltage = centre.battery ? Number(centre.battery.voltage)   : 48;
  const batteryCount   = centre.battery ? Number(centre.battery.count)      : 0;
  const batteryCapAh   = centre.battery ? Number(centre.battery.capacityAh) : 0;
  const totalBatteryAH = batteryCapAh;

  // exixting inverter rating calculation
  const existingInverterKVA = centre.inverter ? Number(centre.inverter.inverterRatingKVA) : null;
 
  const calc = calcSystem(centre, loads, batteryVoltage, batteryCount);

  //inverter sufficiency checks
  const pvloadinverterSufficient =
    existingInverterKVA !== null && existingInverterKVA >= (calc.pvloadrequiredInverterVA/1000);
  const criticalloadinverterSufficient =
    existingInverterKVA !== null && existingInverterKVA >= (calc.criticalloadrequiredInverterVA/1000);
  const totalloadinverterSufficient =
    existingInverterKVA !== null && existingInverterKVA >= (calc.totalloadrequiredInverterVA/1000);

  //battery sufficiency checks
  const pvloadbatterySufficient =
    totalBatteryAH > 0 && totalBatteryAH >= calc.pvloadrequiredBatteryAH;
  const criticalloadbatterySufficient =
    totalBatteryAH > 0 && totalBatteryAH >= calc.criticalloadrequiredBatteryAH;
  const totalloadbatterySufficient =
    totalBatteryAH > 0 && totalBatteryAH >= calc.totalloadrequiredBatteryAH;

  //solar generation comparison
  const avgidealSolargeneration = idealsolarganeration.length
    ? idealsolarganeration.reduce((s, d) => s + d.generation, 0) / idealsolarganeration.length
    : 0;
  
  const avgactualSolargeneration = actualsolargeneration.length
    ? actualsolargeneration.reduce((s, d) => s + d.generation, 0) / actualsolargeneration.length
    : 0;

  const avggridConsumption = gridconsumption.length
    ? gridconsumption.reduce((s, d) => s + d.consumption, 0) / gridconsumption.length
    : 0;
  
  const idealsolarVsGridConsumption  = avgidealSolargeneration >= avggridConsumption;
  const idealsolarVsPvLoad = avgidealSolargeneration >= calc.pvLoadMonthlyKwh;
  const actualsolarVsGridConsumption  = avgactualSolargeneration >= avggridConsumption;
  const actualsolarVsPvLoad = avgactualSolargeneration >= calc.pvLoadMonthlyKwh;

  const idealsolarVscriticalLoad = avgidealSolargeneration >= calc.criticalLoadMonthlyKwh;
  const actualsolarVscriticalLoad = avgactualSolargeneration >= calc.criticalLoadMonthlyKwh;
  const idealsolarVsTotalLoad = avgidealSolargeneration >= calc.totalLoadMonthlyKwh;
  const actualsolarVsTotalLoad = avgactualSolargeneration >= calc.totalLoadMonthlyKwh;

  // Final comparison result
  const comparisonResult = {
    inverter: {
      pvLoad: pvloadinverterSufficient ? "sufficient" : "insufficient",
      criticalLoad: criticalloadinverterSufficient ? "sufficient" : "insufficient",
      totalLoad: totalloadinverterSufficient ? "sufficient" : "insufficient",
    },
    battery: {
      pvLoad: pvloadbatterySufficient ? "sufficient" : "insufficient",
      criticalLoad: criticalloadbatterySufficient ? "sufficient" : "insufficient",
      totalLoad: totalloadbatterySufficient ? "sufficient" : "insufficient",
    },
    solarGenerationVsGridConsumption: {
      ideal: idealsolarVsGridConsumption ? "sufficient" : "insufficient",
      actual: actualsolarVsGridConsumption ? "sufficient" : "insufficient",
    },
    solarGenerationVsPvLoad: {
      ideal: idealsolarVsPvLoad ? "sufficient" : "insufficient",
      actual: actualsolarVsPvLoad ? "sufficient" : "insufficient",
    },
    solarGenerationVsCriticalLoad: {
      ideal: idealsolarVscriticalLoad ? "sufficient" : "insufficient",
      actual: actualsolarVscriticalLoad ? "sufficient" : "insufficient",
    },
    solarGenerationVsTotalLoad: {
      ideal: idealsolarVsTotalLoad ? "sufficient" : "insufficient",
      actual: actualsolarVsTotalLoad ? "sufficient" : "insufficient",
    }
  }
  return {
    calc,
    comparisonResult,
    existingInverterKVA,
    totalBatteryAH,
    avggridConsumption,
    avgidealSolargeneration,
    avgactualSolargeneration
  };
};

//function to get reduction percentage efficiency of solar generation
function solarGenerationEfficiencyReduction(centre) {
  const ideals = centre.solargeneration || [];
  const actuals = centre.actualsolargeneration || [];

  // Check if at least one month has non-zero actual generation
  const validValues = actuals.map(a => a.generation).filter(v => v > 0);
  const avg = validValues.length > 0
    ? validValues.reduce((s, v) => s + v, 0) / validValues.length
    : 0;

  const reductions = ideals.map((ideal, i) => {
    // If all months are zero → keep 0
    // If at least one month is available → fill zeros with average
    const actual = actuals[i]
      ? (actuals[i].generation === 0 && validValues.length > 0 ? avg : actuals[i].generation)
      : 0;

    const reduction = ideal.generation > 0
      ? ((ideal.generation - actual) / ideal.generation) * 100
      : 0;
    return {
      month: ideal.month,
      idealGeneration: ideal.generation,
      actualGeneration: actual,
      actualGenerationRaw: actuals[i] ? actuals[i].generation : 0,
      reductionPercent: reduction
    };
  });

  return reductions;
}

// Main Dashboard Component
function Dashboardcomponent({ centre }) {
  const {calc, comparisonResult, existingInverterKVA, totalBatteryAH, avggridConsumption, avgidealSolargeneration, avgactualSolargeneration, monthlyEnergyConsumption} = comparison({ centre });
  const formulas = formulasused();
  const efficiencyReductions = solarGenerationEfficiencyReduction(centre);
  const idealsolargeneration = centre.solargeneration || [];
  const actualsolargeneration = centre.actualsolargeneration || [];
  const gridconsumption = centre.gridconsumption || [];
  const loads = centre.loadsConnected || [];
  // Separate and sort loads before rendering
  const lightsAndFans = loads.filter(
    l =>
      !l.criticalLoad &&
      (l.typeOfLoad.toLowerCase().includes("light") ||
      l.typeOfLoad.toLowerCase().includes("fan"))
  );

  const criticalLoads = loads
    .filter(l => l.criticalLoad)
    .sort((a, b) => a.typeOfLoad.localeCompare(b.typeOfLoad));

  const remainingNonCritical = loads.filter(
    l =>
      !l.criticalLoad &&
      !l.typeOfLoad.toLowerCase().includes("light") &&
      !l.typeOfLoad.toLowerCase().includes("fan")
  );

  const orderedLoads = [...lightsAndFans, ...criticalLoads, ...remainingNonCritical];



  //1) Solar line chart data 
  const solarLineData = efficiencyReductions.map((r) => ({
    month: r.month,
    idealgeneration: r.idealGeneration,
    actualgeneration: r.actualGeneration 
  }));

  //2) Solar efficiency reduction line chart
  const efficiencyLineData = efficiencyReductions.map((r) => ({
    month: r.month,
    reductionPercent: r.reductionPercent
  }));

  //3) Actual solar , ideal solar , grid consumption, pv connected load line chart
  const comparisonLineData = efficiencyReductions.map((s,i) => ({
    month: s.month,
    idealgeneration: s.idealGeneration,
    actualgeneration: s.actualGeneration,
    gridconsumption: gridconsumption[i]?.consumption || 0,
    pvLoadMonthlyKwh: calc.pvLoadMonthlyKwh
  }));

  //4) Actual solar , ideal solar , monthly total load energy consumption , monthly critical load energy consumption line chart
  const loadComparisonLineData = efficiencyReductions.map((s,i) => ({
    month: s.month,
    idealgeneration: s.idealGeneration,
    actualgeneration: s.actualGeneration,
    criticalLoadMonthlyKwh: calc.criticalLoadMonthlyKwh,
    totalLoadMonthlyKwh: calc.totalLoadMonthlyKwh.toFixed(2)
  }));

  //5) Inverter and battery sufficiency bar chart data
  const BatterysystemCompData = [{
        name:     "Battery (AH)",
        existing: totalBatteryAH || 0,
        pvrequired: Number(calc.pvloadrequiredBatteryAH.toFixed(1)),
        criticalLoadRequired: Number(calc.criticalloadrequiredBatteryAH.toFixed(1)),
        totalLoadRequired: Number(calc.totalloadrequiredBatteryAH.toFixed(1)),
      }];

  const InvertersystemCompData = [{
    name:     "Inverter (VA)",
    existing: existingInverterKVA || 0,
    pvrequired: Number((calc.pvloadrequiredInverterVA/1000).toFixed(1)),
    criticalLoadRequired: Number((calc.criticalloadrequiredInverterVA/1000).toFixed(1)),
    totalLoadRequired: Number((calc.totalloadrequiredInverterVA/1000).toFixed(1)),
  }];

  //6) load distribution pie chart data
  const loadPieData = loads.map((l) => ({
      name:  l.typeOfLoad,
      value: Number(l.numberOfLoad) * Number(l.ratingOfLoad),
    }));
    
  //7) grid vs pv connected bar chart data
  const loadBreakdownData = loads.map((l) => ({
    name:    l.typeOfLoad,
    gridLoad:  Number(l.numberOfLoad) * Number(l.ratingOfLoad) ,
    pvLoad:   Number(l.pvConnectedquantity) * Number(l.ratingOfLoad),
  }));

  //8) critical vs non critical load bar chart data
  const criticalVsNonCriticalData = loads.map((l) => ({
    name: l.typeOfLoad,

    criticalLoad: l.criticalLoad
      ? Number(l.numberOfLoad) * Number(l.ratingOfLoad)
      : 0,

    nonCriticalLoad: !l.criticalLoad
      ? Number(l.numberOfLoad) * Number(l.ratingOfLoad)
      : 0,
  }));
  const criticalityPieData = [
  {
    name: "Critical Load",
    value: criticalVsNonCriticalData.reduce(
      (sum, item) => sum + item.criticalLoad,
      0
    ),
  },
  {
    name: "Non-Critical Load",
    value: criticalVsNonCriticalData.reduce(
      (sum, item) => sum + item.nonCriticalLoad,
      0
    ),
  },
];

  return (
    <div className="w-full font-sans text-[#3c3c3c]">
      <div className="bg-[#ffffff] px-6 py-5 rounded-xl shadow-sm border border-[#f8f7f1] mb-8">
        <h1 className="text-3xl font-extrabold text-[#1f2020]">{centre.centreName.toUpperCase()}</h1>
      </div>

      {/*Centre Details Side-by-Side*/}
        <section id="centre-details" className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-[#ffffff] rounded-xl shadow border border-[#f8f7f1] p-6 flex flex-col justify-between">
            <h2 className="text-xl font-bold text-[#414e5e] flex items-center gap-3 border-b border-[#f7f6fa] pb-3 uppercase tracking-wide">
              <span className="text-[#3c3c3c]"><FontAwesomeIcon icon="house" /></span>CENTRE DETAILS
            </h2>

            <div className="grid grid-cols-2 gap-x-6 gap-y-5 mt-4 mb-6">
              <div className="bg-[#f8f7f1] p-4 rounded-lg flex flex-col justify-center border border-[#f7f6fa]">
                <p className="text-sm font-semibold text-[#3c3c3c] flex items-center gap-2 mb-1 uppercase tracking-wide">
                  <span className="text-[#414e5e]"><FontAwesomeIcon icon="location-crosshairs" /></span>DISTRICT
                </p>
                <p className="text-[#1f2020] text-xl font-bold">{centre.district?.toUpperCase() || "N/A"}</p>
              </div>
              <div className="bg-[#f8f7f1] p-4 rounded-lg flex flex-col justify-center border border-[#f7f6fa]">
                <p className="text-sm font-semibold text-[#3c3c3c] flex items-center gap-2 mb-1 uppercase tracking-wide">
                  <span className="text-[#414e5e]"><FontAwesomeIcon icon="location-arrow" /></span>SITE NAME
                </p>
                <p className="text-[#1f2020] text-xl font-bold truncate">{centre.centreName?.toUpperCase() || "N/A"}</p>
              </div>
              <div className="bg-[#f8f7f1] p-4 rounded-lg flex flex-col justify-center border border-[#f7f6fa]">
                <p className="text-sm font-semibold text-[#3c3c3c] flex items-center gap-2 mb-1 uppercase tracking-wide">
                  <span className="text-[#414e5e]"><FontAwesomeIcon icon="location-crosshairs" /></span>LATITUDE
                </p>
                <p className="text-[#1f2020] text-xl font-bold">{centre.latitude}</p>
              </div>
              <div className="bg-[#f8f7f1] p-4 rounded-lg flex flex-col justify-center border border-[#f7f6fa]">
                <p className="text-sm font-semibold text-[#3c3c3c] flex items-center gap-2 mb-1 uppercase tracking-wide">
                  <span className="text-[#414e5e]"><FontAwesomeIcon icon="location-arrow" /></span>LONGITUDE
                </p>
                <p className="text-[#1f2020] text-xl font-bold">{centre.longitude}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#ffffff] rounded-xl shadow border border-[#f8f7f1] p-6 flex items-center justify-center overflow-hidden">
            <figure className="bg-[#f8f7f1] border border-[#f7f6fa] rounded-lg p-2 h-full w-full flex items-center justify-center">
              <img className="w-full h-full object-contain rounded"
                src={centre.images.siteImageUrl}
                alt="Site Image"
              />
            </figure>
          </div>
        </section>

      {/*Healthcare Stats Section*/}
        <section id="healthcare-stats" className="bg-[#ffffff] rounded-xl shadow border border-[#f8f7f1] pt-6 mb-8 overflow-hidden">
          <h3 className="text-center text-[#414e5e] font-bold text-sm mb-4 uppercase tracking-wide">Healthcare Statistics</h3>
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x-2 divide-[#f8f7f1] border-t-2 border-[#f8f7f1]">
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
              <p className="text-5xl font-bold text-[#1f2020] mb-3">{centre?.additionalInfo?.noofBeds || "—"}</p>
              <p className="text-[#3c3c3c] font-bold text-base">No. of Beds</p>
            </div>
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
              <p className="text-5xl font-bold text-[#1f2020] mb-3">{centre?.additionalInfo?.noofOPDdaily || "—"}</p>
              <p className="text-[#3c3c3c] font-bold text-base">Avg OPD Daily</p>
            </div>
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
              <p className="text-5xl font-bold text-[#1f2020] mb-3">{centre?.additionalInfo?.noofIPDAdmissionperMonth || "—"}</p>
              <p className="text-[#3c3c3c] font-bold text-base">IPD Admissions / Month</p>
            </div>
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
              <p className="text-5xl font-bold text-[#1f2020] mb-3">{centre?.additionalInfo?.noofdeliveryperMonth || "—"}</p>
              <p className="text-[#3c3c3c] font-bold text-base">Deliveries / Month</p>
            </div>
          </div>
        </section>

      {/*System Details*/}
        <section id="system-details" className="bg-[#ffffff] rounded-xl shadow border border-[#f8f7f1] p-6 mb-8">
          <h2 className="text-2xl font-extrabold text-[#414e5e] flex items-center gap-3 border-b-2 border-[#414e5e] pb-3 mb-8 uppercase tracking-wide">
            <span className="text-[#3c3c3c]"><FontAwesomeIcon icon="microchip" /></span>SYSTEM DETAILS
          </h2>

          {/* SOLAR PANEL BLOCK */}
          <div className="flex flex-col xl:flex-row gap-6 w-full mb-10 items-stretch">
            {/* Left Column (40%) - Data Specs */}
            <div className="w-full xl:w-[40%] flex flex-col">
              <h3 className="text-lg font-bold text-[#1f2020] flex items-center gap-2 mb-4 uppercase tracking-wide">
                <span className="text-[#414e5e]"><FontAwesomeIcon icon="solar-panel" /></span>SOLAR PANEL SPECIFICATIONS
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 flex-1 items-start auto-rows-max">
                <div className="bg-[#f8f7f1] p-4 rounded-lg shadow-sm border border-[#f7f6fa] flex flex-col h-35 justify-center items-center text-center">
                  <p className="text-[10px] font-semibold text-[#414e5e] mb-2 uppercase tracking-wide flex items-center gap-1.5"><FontAwesomeIcon icon="bolt" className="text-[#3c3c3c]" />TOTAL RATING</p>
                  <p className="text-xl font-bold text-[#1f2020] flex items-baseline gap-1">{centre.pvRating * centre.noOfPanels / 1000}<span className="text-xs font-medium text-[#3c3c3c]">KWP</span></p>
                </div>
                <div className="bg-[#f8f7f1] p-4 rounded-lg shadow-sm border border-[#f7f6fa] flex flex-col h-35 justify-center items-center text-center">
                  <p className="text-[10px] font-semibold text-[#414e5e] mb-2 uppercase tracking-wide flex items-center gap-1.5"><FontAwesomeIcon icon="solar-panel" className="text-[#3c3c3c]" />PANEL RATING</p>
                  <p className="text-xl font-bold text-[#1f2020] flex items-baseline gap-1">{centre.pvRating}<span className="text-xs font-medium text-[#3c3c3c]">WATTS</span></p>
                </div>
                <div className="bg-[#f8f7f1] p-4 rounded-lg shadow-sm border border-[#f7f6fa] flex flex-col h-35 justify-center items-center text-center">
                  <p className="text-[10px] font-semibold text-[#414e5e] mb-2 uppercase tracking-wide flex items-center gap-1.5"><FontAwesomeIcon icon="pen" className="text-[#3c3c3c]" />NO. OF PANELS</p>
                  <p className="text-xl font-bold text-[#1f2020] flex items-baseline gap-1">{centre.noOfPanels}</p>
                </div>
                <div className="bg-[#f8f7f1] p-4 rounded-lg shadow-sm border border-[#f7f6fa] flex flex-col h-35 justify-center items-center text-center">
                  <p className="text-[9px] font-semibold text-[#414e5e] mb-2 uppercase tracking-wide flex items-center gap-1.5"><FontAwesomeIcon icon="battery-full" className="text-[#3c3c3c]" />VOLTAGE RATING</p>
                  <p className="text-xl font-bold text-[#1f2020] flex items-baseline gap-1">{centre.pvVoltage}<span className="text-xs font-medium text-[#3c3c3c]">VOLTS</span></p>
                </div>
                <div className="bg-[#f8f7f1] p-4 rounded-lg shadow-sm border border-[#f7f6fa] flex flex-col h-35 justify-center items-center text-center">
                  <p className="text-[10px] font-semibold text-[#414e5e] mb-2 uppercase tracking-wide flex items-center gap-1.5"><FontAwesomeIcon icon="font-awesome" className="text-[#3c3c3c]" />MANUFACTURER</p>
                  <p className="text-sm font-bold text-[#1f2020] wrap-break-word leading-tight">{centre.pvSystemake?.toUpperCase() || "N/A"}</p>
                </div>
                <div className="bg-[#f8f7f1] p-4 rounded-lg shadow-sm border border-[#f7f6fa] flex flex-col h-35 justify-center items-center text-center">
                  <p className="text-[10px] font-semibold text-[#414e5e]-px mb-2 uppercase tracking-wide flex items-center gap-1.5"><FontAwesomeIcon icon="calendar" className="text-[#3c3c3c]" />DATE OF INSTALLATION</p>
                  <p className="text-lg font-bold text-[#1f2020]">{centre.dateOfInstallation ? new Date(centre.dateOfInstallation).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</p>
                </div>
              </div>
            </div>

            {/* Right Column (60%) - Media Evidence */}
            <div className="w-full xl:w-[60%] flex flex-col bg-[#ffffff] border border-[#e5e7eb] rounded-xl overflow-hidden shadow-sm h-fit">
              <div className="flex justify-between items-center px-4 py-3 bg-[#f3f4f6] border-b border-[#e5e7eb] text-[10px] font-bold text-[#4b5563] uppercase tracking-wide">
                <span>PANEL IMAGE</span>
                <span>PANEL RATING IMAGE</span>
              </div>
              <div className="flex flex-row justify-between w-full p-4 h-95">
                <div className="w-[72%] h-full rounded-lg overflow-hidden border border-[#f7f6fa] bg-[#f8f7f1]">
                  <img src={centre.images.panelImageUrl} alt="Solar Panel" className="w-full h-full object-cover" />
                </div>
                <div className="w-[25%] h-full rounded-lg overflow-hidden border border-[#f7f6fa] bg-[#f8f7f1] flex items-center justify-center">
                  {centre.images.panelratingImageUrl ? (
                    <img src={centre.images.panelratingImageUrl} alt="Panel Rating" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-[#3c3c3c] italic uppercase tracking-wider p-2 text-center">No Rating Plate</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* BATTERY BLOCK */}
          <div className="flex flex-col xl:flex-row gap-6 w-full mb-10 items-stretch">
            {/* Left Column (40%) - Data Specs */}
            <div className="w-full xl:w-[40%] flex flex-col">
              <h3 className="text-lg font-bold text-[#1f2020] flex items-center gap-2 mb-4 uppercase tracking-wide">
                <span className="text-[#414e5e]"><FontAwesomeIcon icon="battery-full" /></span>BATTERY SPECIFICATIONS
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 flex-1 items-start auto-rows-max">
                <div className="bg-[#f8f7f1] p-4 rounded-lg shadow-sm border border-[#f7f6fa] flex flex-col h-35 justify-center items-center text-center">
                  <p className="text-[9.5px] font-semibold text-[#414e5e] mb-2 uppercase tracking-wide flex items-center gap-1.5"><FontAwesomeIcon icon="bolt" className="text-[#3c3c3c]" />TOTAL CAPACITY</p>
                  <p className="text-xl font-bold text-[#1f2020] flex items-baseline gap-1">{centre.battery.capacityAh}<span className="text-xs font-medium text-[#3c3c3c]">AH</span></p>
                </div>
                <div className="bg-[#f8f7f1] p-4 rounded-lg shadow-sm border border-[#f7f6fa] flex flex-col h-35 justify-center items-center text-center">
                  <p className="text-[9.5px] font-semibold text-[#414e5e] mb-2 uppercase tracking-wide flex items-center gap-1.5"><FontAwesomeIcon icon="battery-full" className="text-[#3c3c3c]" />BATTERY RATING</p>
                  <p className="text-xl font-bold text-[#1f2020] flex items-baseline gap-1">{centre.battery.capacityAh}<span className="text-xs font-medium text-[#3c3c3c]">AH</span></p>
                </div>
                <div className="bg-[#f8f7f1] p-4 rounded-lg shadow-sm border border-[#f7f6fa] flex flex-col h-35 justify-center items-center text-center">
                  <p className="text-[9px] font-semibold text-[#414e5e] mb-2 uppercase tracking-wide flex items-center gap-1.5"><FontAwesomeIcon icon="pen" className="text-[#3c3c3c]" />NO. OF BATTERIES</p>
                  <p className="text-xl font-bold text-[#1f2020] flex items-baseline gap-1">{centre.battery.count}</p>
                </div>
                <div className="bg-[#f8f7f1] p-4 rounded-lg shadow-sm border border-[#f7f6fa] flex flex-col h-35 justify-center items-center text-center">
                  <p className="text-[9px] font-semibold text-[#414e5e] mb-2 uppercase tracking-wide flex items-center gap-1.5"><FontAwesomeIcon icon="battery-full" className="text-[#3c3c3c]" />SYSTEM VOLTAGE</p>
                  <p className="text-xl font-bold text-[#1f2020] flex items-baseline gap-1">{centre.battery.voltage * centre.battery.count}<span className="text-xs font-medium text-[#3c3c3c]">VOLTS</span></p>
                </div>
                <div className="bg-[#f8f7f1] p-4 rounded-lg shadow-sm border border-[#f7f6fa] flex flex-col h-35 justify-center items-center text-center">
                  <p className="text-[9.5px] font-semibold text-[#414e5e] mb-2 uppercase tracking-wide flex items-center gap-1.5"><FontAwesomeIcon icon="bolt" className="text-[#3c3c3c]" />VOLTAGE RATING</p>
                  <p className="text-xl font-bold text-[#1f2020] flex items-baseline gap-1">{centre.battery.voltage}<span className="text-xs font-medium text-[#3c3c3c]">VOLTS</span></p>
                </div>
                <div className="bg-[#f8f7f1] p-4 rounded-lg shadow-sm border border-[#f7f6fa] flex flex-col h-35 justify-center items-center text-center">
                  <p className="text-[9.5px] font-semibold text-[#414e5e] mb-2 uppercase tracking-wide flex items-center gap-1.5"><FontAwesomeIcon icon="font-awesome" className="text-[#3c3c3c]" />MANUFACTURER</p>
                  <p className="text-lg font-bold text-[#1f2020] wrap-break-word leading-tight">{centre.battery.Manufacturer?.toUpperCase() || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Right Column (60%) - Media Evidence */}
            <div className="w-full xl:w-[60%] flex flex-col bg-[#ffffff] border border-[#e5e7eb] rounded-xl overflow-hidden shadow-sm h-fit">
              <div className="flex justify-between items-center px-4 py-3 bg-[#f3f4f6] border-b border-[#e5e7eb] text-[10px] font-bold text-[#4b5563] uppercase tracking-wide">
                <span>BATTERY IMAGE</span>
                <span>BATTERY RATING IMAGE</span>
              </div>
              <div className="flex flex-row justify-between w-full p-4 h-95">
                <div className="w-[72%] h-full rounded-lg overflow-hidden border border-[#f7f6fa] bg-[#f8f7f1]">
                  <img src={centre.images.batteryImageUrl} alt="Battery" className="w-full h-full object-cover" />
                </div>
                <div className="w-[25%] h-full rounded-lg overflow-hidden border border-[#f7f6fa] bg-[#f8f7f1] flex items-center justify-center">
                  {centre.images.batteryratingImageUrl ? (
                    <img src={centre.images.batteryratingImageUrl} alt="Battery Rating" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-[#3c3c3c] italic uppercase tracking-wider p-2 text-center">No Rating Plate</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* INVERTER BLOCK */}
          <div className="flex flex-col xl:flex-row gap-6 w-full items-stretch">
            {/* Left Column (40%) - Data Specs */}
            <div className="w-full xl:w-[40%] flex flex-col">
              <h3 className="text-lg font-bold text-[#1f2020] flex items-center gap-2 mb-4 uppercase tracking-wide">
                <span className="text-[#414e5e]"><FontAwesomeIcon icon="bolt" /></span>INVERTER SPECIFICATIONS
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 flex-1 items-start auto-rows-max">
                <div className="bg-[#f8f7f1] p-4 rounded-lg shadow-sm border border-[#f7f6fa] flex flex-col h-35 justify-center items-center text-center">
                  <p className="text-[10px] font-semibold text-[#414e5e] mb-2 uppercase tracking-wide flex items-center gap-1.5"><FontAwesomeIcon icon="bolt" className="text-[#3c3c3c]" />TOTAL RATING</p>
                  <p className="text-xl font-bold text-[#1f2020] flex items-baseline gap-1">{centre.inverter.inverterRatingKVA}<span className="text-xs font-medium text-[#3c3c3c]">KVA</span></p>
                </div>
                <div className="bg-[#f8f7f1] p-4 rounded-lg shadow-sm border border-[#f7f6fa] flex flex-col h-35 justify-center items-center text-center">
                  <p className="text-[9.5px] font-semibold text-[#414e5e] mb-2 uppercase tracking-wide flex items-center gap-1.5"><FontAwesomeIcon icon="battery-full" className="text-[#3c3c3c]" />VOLTAGE RATING</p>
                  <p className="text-xl font-bold text-[#1f2020] flex items-baseline gap-1">{centre.inverter.voltage}<span className="text-xs font-medium text-[#3c3c3c]">VOLTS</span></p>
                </div>
                <div className="bg-[#f8f7f1] p-4 rounded-lg shadow-sm border border-[#f7f6fa] flex flex-col h-35 justify-center items-center text-center">
                  <p className="text-[10px] font-semibold text-[#414e5e] mb-2 uppercase tracking-wide flex items-center gap-1.5"><FontAwesomeIcon icon="pen" className="text-[#3c3c3c]" />TYPE</p>
                  <p className="text-lg font-bold text-[#1f2020] wrap-break-word leading-tight">{centre.inverter.type ? centre.inverter.type.toUpperCase() : "N/A"}</p>
                </div>
                <div className="bg-[#f8f7f1] p-4 rounded-lg shadow-sm border border-[#f7f6fa] flex flex-col h-35 justify-center items-center text-center">
                  <p className="text-[10px] font-semibold text-[#414e5e] mb-2 uppercase tracking-wide flex items-center gap-1.5"><FontAwesomeIcon icon="font-awesome" className="text-[#3c3c3c]" />MANUFACTURER</p>
                  <p className="text-lg font-bold text-[#1f2020] wrap-break-word leading-tight">{centre.inverter.make?.toUpperCase() || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Right Column (60%) - Media Evidence */}
            <div className="w-full xl:w-[60%] flex flex-col bg-[#ffffff] border border-[#e5e7eb] rounded-xl overflow-hidden shadow-sm h-fit">
              <div className="flex justify-between items-center px-4 py-3 bg-[#f3f4f6] border-b border-[#e5e7eb] text-[10px] font-bold text-[#4b5563] uppercase tracking-wide">
                <span>INVERTER IMAGE</span>
                <span>INVERTER RATING IMAGE</span>
              </div>
              <div className="flex flex-row justify-between w-full p-4 h-95">
                <div className="w-[72%] h-full rounded-lg overflow-hidden border border-[#f7f6fa] bg-[#f8f7f1]">
                  <img src={centre.images.inverterImageUrl} alt="Inverter Image" className="w-full h-full object-cover" />
                </div>
                <div className="w-[25%] h-full rounded-lg overflow-hidden border border-[#f7f6fa] bg-[#f8f7f1] flex items-center justify-center">
                  {centre.images.inverterRatingImageUrl ? (
                    <img src={centre.images.inverterRatingImageUrl} alt="Inverter Rating" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-[#3c3c3c] italic uppercase tracking-wider p-2 text-center">No Rating Plate</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

      {/*Energy details*/}
        <section id="energy-details" className="bg-[#ffffff] rounded-xl shadow border border-[#f8f7f1] p-6 mb-8"> 
          <div className="mb-6 border-b-2 border-[#414e5e] pb-3">
            <h2 className="text-2xl font-extrabold text-[#414e5e] flex items-center gap-3 uppercase tracking-wide"><span className="text-[#3c3c3c]"><FontAwesomeIcon icon="bolt" /></span>ENERGY DETAILS</h2>
          </div> 
          <div className="mb-10">
            <h3 className="text-lg font-bold text-[#1f2020] flex items-center gap-2 bg-[#f8f7f1] p-3 rounded-lg mb-5 border-l-4 border-[#414e5e] pl-3 uppercase tracking-wide">
                <span className="text-[#414e5e]"><FontAwesomeIcon icon="plug" /></span>LAST 12 MONTHS GRID ENERGY CONSUMPTION
            </h3>
            <div>
              {gridconsumption.length > 0 ? (
                <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {gridconsumption.map((g, i) => (
                    <li key={i} className="bg-[#f7f6fa] p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-sm border border-[#f8f7f1] hover:bg-[#ffffff] hover:-translate-y-1 hover:shadow-md transition">
                      <p className="text-xs font-bold text-[#414e5e] mb-2 uppercase tracking-wide flex items-center gap-1"><FontAwesomeIcon icon="calendar" className="text-[#3c3c3c]" /> {g.month? new Date(g.month).toLocaleDateString("en-IN", {
                        month: "short", year: "numeric",
                      }) : "_"}</p>
                      <p className="text-2xl font-bold text-[#1f2020]">{g.consumption}<span className="text-xs font-semibold text-[#3c3c3c] ml-1">KWH</span></p>
                    </li>
                  ))}
                </ul> 
              ) : (
                <p className="text-[#3c3c3c] italic p-4 bg-[#f8f7f1] rounded-lg">No grid consumption data available.</p>
              )}
            </div>
          </div>
          <div className="mb-10">
            <h3 className="text-lg font-bold text-[#1f2020] flex items-center gap-2 bg-[#f8f7f1] p-3 rounded-lg mb-5 border-l-4 border-[#414e5e] pl-3 uppercase tracking-wide">
                <span className="text-[#414e5e]"><FontAwesomeIcon icon="sun" /></span>LAST 12 MONTHS ACTUAL SOLAR GENERATION
            </h3>
            <div>
              {actualsolargeneration.length > 0 ? (
                <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {actualsolargeneration.map((g, i) => (
                    <li key={i} className="bg-[#f7f6fa] p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-sm border border-[#f8f7f1] hover:bg-[#ffffff] hover:-translate-y-1 hover:shadow-md transition">
                      <p className="text-xs font-bold text-[#414e5e] mb-2 uppercase tracking-wide flex items-center gap-1"><FontAwesomeIcon icon="calendar" className="text-[#3c3c3c]" /> {g.month? new Date(g.month).toLocaleDateString("en-IN", {
                        month: "short", year: "numeric",
                      }) : "_"}</p>
                      <p className="text-2xl font-bold text-[#1f2020]">{g.generation}<span className="text-xs font-semibold text-[#3c3c3c] ml-1">KWH</span></p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[#3c3c3c] italic p-4 bg-[#f8f7f1] rounded-lg">No actual solar generation data available.</p>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1f2020] flex items-center gap-2 bg-[#f8f7f1] p-3 rounded-lg mb-5 border-l-4 border-[#414e5e] pl-3 uppercase tracking-wide">
                <span className="text-[#414e5e]"><FontAwesomeIcon icon = "solar-panel" /></span>LAST 12 MONTHS IDEAL SOLAR GENERATION
            </h3>
            <div>
              {idealsolargeneration.length > 0 ? (
                <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {idealsolargeneration.map((g, i) => (
                    <li key={i} className="bg-[#f7f6fa] p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-sm border border-[#f8f7f1] hover:bg-[#ffffff] hover:-translate-y-1 hover:shadow-md transition">
                      <p className="text-xs font-bold text-[#414e5e] mb-2 uppercase tracking-wide flex items-center gap-1"><FontAwesomeIcon icon="calendar" className="text-[#3c3c3c]" /> {g.month? new Date(g.month).toLocaleDateString("en-In",{
                        month: "short", year: "numeric",
                      }) : "_"}</p>
                      <p className="text-2xl font-bold text-[#1f2020]">{g.generation}<span className="text-xs font-semibold text-[#3c3c3c] ml-1">KWH</span></p>
                    </li>
                    ))}
                </ul> 
              ) : (
                <p className="text-[#3c3c3c] italic p-4 bg-[#f8f7f1] rounded-lg"> No ideal solar generation data available</p>
              )}
            </div>
          </div>
        </section>
      
      {/* Load Details Table */}
        <section id="load-details" className="bg-[#ffffff] rounded-xl shadow border border-[#f8f7f1] p-6 mb-8 overflow-hidden">
          <h2 className="text-xl font-bold text-[#414e5e] flex items-center gap-3 border-b border-[#f7f6fa] pb-3 mb-6 uppercase tracking-wide">
            <span className="text-[#3c3c3c]"><FontAwesomeIcon icon="lightbulb" /></span>LOAD DETAILS
          </h2>
          {orderedLoads.length > 0 ? (
            <div className="rounded-lg shadow border border-[#f8f7f1] overflow-hidden">
              <table className="w-full text-left table-fixed border-collapse wrap-break-word">
                <thead className="bg-[#414e5e] text-[#ffffff]">
                  <tr>
                    <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider border-b border-[#3c3c3c]">S.No.</th>
                    <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider border-b border-[#3c3c3c]">TYPE OF LOAD</th>
                    <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider border-b border-[#3c3c3c]">RATING (W)</th>
                    <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider border-b border-[#3c3c3c]">COUNT</th>
                    <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider border-b border-[#3c3c3c]">PV QTY</th>
                    <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider border-b border-[#3c3c3c]">CRITICAL</th>
                    <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider border-b border-[#3c3c3c]">VOL (LITRES)</th>
                    <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider border-b border-[#3c3c3c]">MAKE</th>
                    <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider border-b border-[#3c3c3c]">MODEL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f8f7f1] bg-[#ffffff]">
                  {orderedLoads.map((load, index) => (
                    <tr key={index} className="hover:bg-[#f7f6fa] transition-colors">
                      <td className="px-3 py-3 text-sm text-[#3c3c3c] font-medium">{index + 1}</td>
                      <td className="px-3 py-3 text-sm font-bold text-[#1f2020] uppercase">{load.typeOfLoad}</td>
                      <td className="px-3 py-3 text-sm text-[#3c3c3c]">{load.ratingOfLoad}</td>
                      <td className="px-3 py-3 text-sm font-semibold text-[#1f2020]">{load.numberOfLoad}</td>
                      <td className="px-3 py-3 text-sm text-[#3c3c3c]">{load.pvConnectedquantity || " "}</td>
                      <td className="px-3 py-3 text-sm text-[#3c3c3c]">
                       <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-bold ${
                          load.criticalLoad ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {load.criticalLoad ? "Yes" : "No"}
                      </span>

                      </td>
                      <td className="px-3 py-3 text-sm text-[#3c3c3c]">{load.grossVolume || " "}</td>
                      <td className="px-3 py-3 text-sm text-[#3c3c3c]">{load.make || " "}</td>
                      <td className="px-3 py-3 text-sm text-[#3c3c3c]">{load.model || " "}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-[#3c3c3c] italic bg-[#f8f7f1] p-4 rounded-lg">No load details available.</p>
          )}
        </section>

      {/* Solar Generation efficiency reduction details*/}
        <section className="bg-[#ffffff] rounded-xl shadow border border-[#f8f7f1] p-6 mb-8 overflow-hidden">
          <h2 className="text-xl font-bold text-[#414e5e] flex items-center gap-3 border-b border-[#f7f6fa] pb-3 mb-6 uppercase tracking-wide">
            <span className="text-[#3c3c3c]"><FontAwesomeIcon icon = "solar-panel" /></span>SOLAR ENERGY EXTENT OF UTILISATION OVER LAST 12 MONTHS
          </h2>
          {efficiencyReductions.length > 0 ? (
            <div className="rounded-lg shadow border border-[#f8f7f1] overflow-hidden">
              <table className="w-full text-left table-fixed border-collapse wrap-break-word">
                <thead className="bg-[#414e5e] text-[#ffffff]">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider border-b border-[#3c3c3c]">S.NO.</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider border-b border-[#3c3c3c]">Generation Period</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider border-b border-[#3c3c3c]">Ideal Solar Energy Generation</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider border-b border-[#3c3c3c]">Actual Solar Energy Utilisation</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider border-b border-[#3c3c3c]">Efficiency Reduction (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f8f7f1] bg-[#ffffff]">
                  {efficiencyReductions.map((reduction, index) => (
                    <tr key={index} className="hover:bg-[#f7f6fa] transition-colors">
                      <td className="px-4 py-3 text-sm text-[#3c3c3c]">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#1f2020]">{reduction.month? new Date(reduction.month).toLocaleDateString("en-IN", {
                        month: "long", year: "numeric",
                      }) : "_"}</td>
                      <td className="px-4 py-3 text-sm text-[#3c3c3c]">{reduction.idealGeneration}</td>
                      <td className="px-4 py-3 text-sm text-[#3c3c3c]">
                        {reduction.actualGenerationRaw === 0
                          ? <span className="text-[#414e5e] font-semibold italic bg-[#f8f7f1] px-2 py-1 rounded">Meter Fault</span>
                          : <span className="font-medium text-[#1f2020]">{reduction.actualGenerationRaw.toFixed(2)}</span>}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {reduction.actualGenerationRaw === 0
                          ? <span className="text-[#414e5e] font-semibold italic bg-[#f8f7f1] px-2 py-1 rounded">Meter Fault</span>
                          : <span className="font-bold text-[#1f2020]">{reduction.reductionPercent.toFixed(2)}%</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            ) : (
            <p className="text-[#3c3c3c] italic bg-[#f8f7f1] p-4 rounded-lg">No efficiency details available.</p>
          )}
        </section>

      {/* Formulas Used Section */}
        <section id="formulas" className="bg-[#ffffff] rounded-xl shadow border border-[#f8f7f1] p-6 mb-8">
          <div className="mb-6 border-b-2 border-[#414e5e] pb-3">
            <h2 className="text-2xl font-extrabold text-[#414e5e] flex items-center gap-3 uppercase tracking-wide"><span className="text-[#3c3c3c]"><FontAwesomeIcon icon="calculator" /></span>FORMULAS USED</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-[#f8f7f1] p-5 rounded-xl border border-[#f7f6fa] shadow-sm">
                <p className="text-sm font-bold text-[#414e5e] mb-2 flex items-center gap-2 uppercase tracking-wide"><span className="text-[#3c3c3c]"><FontAwesomeIcon icon = "sun" /></span>Ideal Solar Generation:</p>
                <p className="text-[#1f2020] text-sm font-mono bg-[#ffffff] p-3 rounded border border-[#f8f7f1] leading-relaxed wrap-break-word"><strong> {formulas.IdealSolarGeneration}</strong></p>
                <p className="text-[#3c3c3c] text-sm mt-3 flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[#414e5e]">Effective Efficiency:</span> 
                  <span className="font-mono bg-[#ffffff] px-2 py-1 rounded border border-[#f8f7f1] text-[#1f2020]">{formulas.EffectiveEfficiency}</span>
                </p>
              </div>
              <div className="bg-[#f8f7f1] p-5 rounded-xl border border-[#f7f6fa] shadow-sm">
                <p className="text-sm font-bold text-[#414e5e] mb-2 flex items-center gap-2 uppercase tracking-wide"><span className="text-[#3c3c3c]"><FontAwesomeIcon icon = "arrow-trend-down" /></span>Solar Energy Utilisation Efficiency Reduction:</p>
                <p className="text-[#1f2020] text-sm font-mono bg-[#ffffff] p-3 rounded border border-[#f8f7f1] leading-relaxed wrap-break-word"><strong> {formulas.EfficiencyReduction}</strong></p>
              </div>
              <div className="bg-[#f8f7f1] p-5 rounded-xl border border-[#f7f6fa] shadow-sm">
                <p className="text-sm font-bold text-[#414e5e] mb-2 flex items-center gap-2 uppercase tracking-wide"><span className="text-[#3c3c3c]"><FontAwesomeIcon icon = "bolt" /></span>Inverter Sizing:</p>
                <p className="text-[#1f2020] text-sm font-mono bg-[#ffffff] p-3 rounded border border-[#f8f7f1] leading-relaxed wrap-break-word"><strong> {formulas.InverterSizing}</strong></p>
              </div>
              <div className="bg-[#f8f7f1] p-5 rounded-xl border border-[#f7f6fa] shadow-sm">
                <p className="text-sm font-bold text-[#414e5e] mb-2 flex items-center gap-2 uppercase tracking-wide"><span className="text-[#3c3c3c]"><FontAwesomeIcon icon = "battery-full" /></span>Battery Sizing:</p>
                <p className="text-[#1f2020] text-sm font-mono bg-[#ffffff] p-3 rounded border border-[#f8f7f1] leading-relaxed wrap-break-word"><strong> {formulas.BatterySizing}</strong></p>
              </div>
          </div>
          <div className="bg-[#f7f6fa] border-l-4 border-[#414e5e] p-5 rounded-r-xl text-[#3c3c3c] text-sm">
              <p className="font-bold flex items-center gap-2 mb-4 text-[#1f2020] text-base"><span className="text-[#414e5e]"><FontAwesomeIcon icon="exclamation-triangle" /></span>Note: The above formulas are based on standard engineering principles for solar PV system design and using following constants:</p>
              <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-5 font-mono text-xs text-[#1f2020]">
                <li className="bg-[#ffffff] px-3 py-2 rounded-lg border border-[#f8f7f1] shadow-sm"><span className="text-[#414e5e] font-bold">Safety Factor:</span> {(SAFETY_FACTOR-1)*100}%</li>
                <li className="bg-[#ffffff] px-3 py-2 rounded-lg border border-[#f8f7f1] shadow-sm"><span className="text-[#414e5e] font-bold">Power Factor:</span> {POWER_FACTOR}</li>
                <li className="bg-[#ffffff] px-3 py-2 rounded-lg border border-[#f8f7f1] shadow-sm"><span className="text-[#414e5e] font-bold">Battery Eff:</span> {BATTERY_EFF*100}%</li>
                <li className="bg-[#ffffff] px-3 py-2 rounded-lg border border-[#f8f7f1] shadow-sm"><span className="text-[#414e5e] font-bold">Inverter Eff:</span> {INVERTER_EFF*100}%</li>
                <li className="bg-[#ffffff] px-3 py-2 rounded-lg border border-[#f8f7f1] shadow-sm"><span className="text-[#414e5e] font-bold">Backup Hours:</span> {BACKUP_HOURS}</li>
                <li className="bg-[#ffffff] px-3 py-2 rounded-lg border border-[#f8f7f1] shadow-sm"><span className="text-[#414e5e] font-bold">Hours Per Day:</span> {HOURS_PER_DAY}</li>
                <li className="bg-[#ffffff] px-3 py-2 rounded-lg border border-[#f8f7f1] shadow-sm"><span className="text-[#414e5e] font-bold">Days/Month:</span> {DAYS_PER_MONTH}</li>
                <li className="bg-[#ffffff] px-3 py-2 rounded-lg border border-[#f8f7f1] shadow-sm"><span className="text-[#414e5e] font-bold">Perf Ratio:</span> {PERFORMANCE_RATIO}</li>
                <li className="bg-[#ffffff] px-3 py-2 rounded-lg border border-[#f8f7f1] shadow-sm"><span className="text-[#414e5e] font-bold">Derating:</span> {DERATING_FACTOR}</li>
                <li className="bg-[#ffffff] px-3 py-2 rounded-lg border border-[#f8f7f1] shadow-sm"><span className="text-[#414e5e] font-bold">Soiling:</span> {SOILING_FACTOR}</li>
                <li className="bg-[#ffffff] px-3 py-2 rounded-lg border border-[#f8f7f1] shadow-sm"><span className="text-[#414e5e] font-bold">Mismatch:</span> {MISMATCH_FACTOR}</li>
              </ul>
              <p className="font-bold text-[#1f2020] bg-[#ffffff] inline-block px-4 py-2 rounded-lg border border-[#414e5e] shadow-sm wrap-break-word max-w-full">Overall Effective Efficiency of Solar Panels: <span className="text-[#414e5e]">{EFFECTIVE_EFFICIENCY}%</span></p>
          </div>
        </section>

        {/*Calculation*/}
        <section id="calculations" className="bg-[#ffffff] rounded-xl shadow border border-[#f8f7f1] p-6 mb-8">
          <div className="mb-6 border-b-2 border-[#414e5e] pb-3">
            <h2 className="text-2xl font-extrabold text-[#414e5e] flex items-center gap-3 uppercase tracking-wide">
              <span className="text-[#3c3c3c]"><FontAwesomeIcon icon="calculator" /></span>CALCULATIONS
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8 mb-8">
            <div className="space-y-6">
              <div>
                <p className="font-bold text-[#414e5e] mb-2 flex items-center gap-2 text-base">
                  <span className="text-[#3c3c3c]"><FontAwesomeIcon icon="bolt" /></span>Inverter Sizing for PV Connected Load:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-[#3c3c3c] text-xs">
                  <li>Step 1: Calculate the total PV Connected Load with safety factor : {calc.pvloadTotalW} × {SAFETY_FACTOR} = {calc.pvloadWithSafety}</li>
                  <li>Step 2: Calculate the required inverter rating in VA : {calc.pvloadWithSafety} ÷ {POWER_FACTOR} = {calc.pvloadrequiredInverterVA.toFixed(2)}</li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-[#414e5e] mb-2 flex items-center gap-2 text-base">
                  <span className="text-[#3c3c3c]"><FontAwesomeIcon icon="bolt" /></span>Inverter Sizing for Critical Load:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-[#3c3c3c] text-xs">
                  <li>Step 1: Calculate the total Critical Load with safety factor : {calc.criticalloadW} × {SAFETY_FACTOR} = {calc.criticalloadWithSafety}</li>
                  <li>Step 2: Calculate the required inverter rating in VA : {calc.criticalloadWithSafety} ÷ {POWER_FACTOR} = {calc.criticalloadrequiredInverterVA.toFixed(2)}</li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-[#414e5e] mb-2 flex items-center gap-2 text-base">
                  <span className="text-[#3c3c3c]"><FontAwesomeIcon icon="bolt" /></span>Inverter Sizing for Total Load:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-[#3c3c3c] text-xs">
                  <li>Step 1: Calculate the total Load with safety factor : {calc.totalloadW} × {SAFETY_FACTOR} = {calc.totalloadWithSafety}</li>
                  <li>Step 2: Calculate the required inverter rating in VA : {calc.totalloadWithSafety} × {DIVERSITY_FACTOR} ÷ {POWER_FACTOR} = {calc.totalloadrequiredInverterVA.toFixed(2)}</li>
                </ul>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <p className="font-bold text-[#414e5e] mb-2 flex items-center gap-2 text-base">
                  <span className="text-[#3c3c3c]"><FontAwesomeIcon icon="battery-full" /></span>Battery Sizing for PV Connected Load:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-[#3c3c3c] text-xs">
                  <li>Step 1: Calculate the total PV Connected Load with safety factor : {calc.pvloadTotalW} × {SAFETY_FACTOR} = {calc.pvloadWithSafety}</li>
                  <li>Step 2: Calculate the required battery capacity in AH : ({calc.pvloadWithSafety} × {BACKUP_HOURS}) ÷ ({calc.sysV} × {BATTERY_EFF} × {INVERTER_EFF}) = {calc.pvloadrequiredBatteryAH.toFixed(2)}</li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-[#414e5e] mb-2 flex items-center gap-2 text-base">
                  <span className="text-[#3c3c3c]"><FontAwesomeIcon icon="battery-full" /></span>Battery Sizing for Critical Load:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-[#3c3c3c] text-xs">
                  <li>Step 1: Calculate the total Critical Load with safety factor : {calc.criticalloadW} × {SAFETY_FACTOR} = {calc.criticalloadWithSafety}</li>
                  <li>Step 2: Calculate the required battery capacity in AH : ({calc.criticalloadWithSafety} × {BACKUP_HOURS}) ÷ ({calc.sysV} × {BATTERY_EFF} × {INVERTER_EFF}) = {calc.criticalloadrequiredBatteryAH.toFixed(2)}</li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-[#414e5e] mb-2 flex items-center gap-2 text-base">
                  <span className="text-[#3c3c3c]"><FontAwesomeIcon icon="battery-full" /></span>Battery Sizing for Total Load:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-[#3c3c3c] text-xs">
                  <li>Step 1: Calculate the total Load with safety factor : {calc.totalloadW} × {SAFETY_FACTOR} = {calc.totalloadWithSafety}</li>
                  <li>Step 2: Calculate the required battery capacity in AH : ({calc.totalloadWithSafety} × {BACKUP_HOURS} × {DIVERSITY_FACTOR}) ÷ ({calc.sysV} × {BATTERY_EFF} × {INVERTER_EFF}) = {calc.totalloadrequiredBatteryAH.toFixed(2)}</li>
                </ul>
              </div>
            </div>
          </div>
          <p className="text-[#3c3c3c] text-sm italic">
            Total Load calculations represent estimated simultaneous operational demand using diversity factor and are intended for whole-centre sizing analysis.
          </p>
        </section>
      
      {/* Comparison Results */}
        <section id="analysis" className="bg-[#ffffff] rounded-xl shadow border border-[#f8f7f1] p-6 mb-8 space-y-10">
          <div className="border-b-2 border-[#414e5e] pb-3">
            <h2 className="text-2xl font-extrabold text-[#414e5e] flex items-center gap-3 uppercase tracking-wide"><span className="text-[#3c3c3c]"><FontAwesomeIcon icon = "trend-up"/></span>ANALYSIS</h2>
          </div>
          {/* Solar Sufficiency Analysis */}
          <div className="bg-[#f8f7f1] p-6 rounded-xl border border-[#f7f6fa]">
            <h3 className="text-lg font-bold text-[#1f2020] flex items-center gap-2 border-l-4 border-[#414e5e] pl-3 uppercase tracking-wide mb-6">
                <span className="text-[#414e5e]"><FontAwesomeIcon icon = "solar-panel" /></span>SOLAR SUFFICIENCY ANALYSIS
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5 text-sm">
                <div className="bg-[#ffffff] p-4 rounded-lg border border-[#f7f6fa] flex items-center justify-between gap-4">
                    <p className="text-[#3c3c3c] font-medium">Avg Ideal Monthly Solar Gen:</p>
                    <span className="font-extrabold text-xl text-[#1f2020] whitespace-nowrap">{avgidealSolargeneration.toFixed(2)}<code className="text-xs ml-1">KWH</code></span>
                </div>
                <div className="bg-[#ffffff] p-4 rounded-lg border border-[#f7f6fa] flex items-center justify-between gap-4">
                    <p className="text-[#3c3c3c] font-medium">Avg Actual Monthly Solar Utilisation:</p>
                    <span className="font-extrabold text-xl text-[#1f2020] whitespace-nowrap">{avgactualSolargeneration.toFixed(2)}<code className="text-xs ml-1">KWH</code></span>
                </div>
                <div className="bg-[#ffffff] p-4 rounded-lg border border-[#f7f6fa] flex items-center justify-between gap-4">
                    <p className="text-[#3c3c3c] font-medium">Avg Monthly Grid Consumption:</p>
                    <span className="font-extrabold text-xl text-[#1f2020] whitespace-nowrap">{avggridConsumption.toFixed(2)}<code className="text-xs ml-1">KWH</code></span>
                </div>
                <div className="bg-[#ffffff] p-4 rounded-lg border border-[#f7f6fa] flex items-center justify-between gap-4">
                    <p className="text-[#3c3c3c] font-medium">Monthly Total Load:</p>
                    <span className="font-extrabold text-xl text-[#1f2020] whitespace-nowrap">{calc.totalLoadMonthlyKwh.toFixed(2)}<code className="text-xs ml-1">KWH</code></span>
                </div>
                <div className="bg-[#ffffff] p-4 rounded-lg border border-[#f7f6fa] flex items-center justify-between gap-4">
                    <p className="text-[#3c3c3c] font-medium">Monthly PV Load:</p>
                    <span className="font-extrabold text-xl text-[#1f2020] whitespace-nowrap">{calc.pvLoadMonthlyKwh.toFixed(2)}<code className="text-xs ml-1">KWH</code></span>
                </div>
                <div className="bg-[#ffffff] p-4 rounded-lg border border-[#f7f6fa] flex items-center justify-between gap-4">
                    <p className="text-[#3c3c3c] font-medium">Monthly Critical Load:</p>
                    <span className="font-extrabold text-xl text-[#1f2020] whitespace-nowrap">{calc.criticalLoadMonthlyKwh.toFixed(2)}<code className="text-xs ml-1">KWH</code></span>
                </div>
            </div>
            {/*Divided sufficiency cards in stat card style below grid*/}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                 <div className="bg-[#ffffff] p-6 rounded-xl border border-[#f7f6fa] flex flex-col items-center justify-center text-center">
                    <p className="text-[#3c3c3c] font-semibold text-xs uppercase tracking-wide mb-3">Solar Gen Vs Grid Consumption</p>
                    <div className="flex items-center gap-3 w-full justify-around font-medium">
                        <span className="flex-1 flex flex-col items-center gap-1.5"><span className="text-[11px] text-[#3c3c3c]">Ideal</span> <strong className={`px-2 py-1 rounded text-xs text-white shadow-inner whitespace-nowrap ${comparisonResult.solarGenerationVsGridConsumption.ideal === 'sufficient' ? "bg-[#00963c]" : "bg-[#cc3600]"}`}> {comparisonResult.solarGenerationVsGridConsumption.ideal.toUpperCase()}</strong></span>
                        <span className="flex-1 flex flex-col items-center gap-1.5"><span className="text-[11px] text-[#3c3c3c]">Actual</span> <strong className={`px-2 py-1 rounded text-xs text-white shadow-inner whitespace-nowrap ${comparisonResult.solarGenerationVsGridConsumption.actual === 'sufficient' ? "bg-[#00963c]" : "bg-[#cc3600]"}`}>{comparisonResult.solarGenerationVsGridConsumption.actual.toUpperCase()}</strong></span>
                    </div>
                </div>
                <div className="bg-[#ffffff] p-6 rounded-xl border border-[#f7f6fa] flex flex-col items-center justify-center text-center">
                    <p className="text-[#3c3c3c] font-semibold text-xs uppercase tracking-wide mb-3">Solar Gen Vs PV Connected Load</p>
                     <div className="flex items-center gap-3 w-full justify-around font-medium">
                        <span className="flex-1 flex flex-col items-center gap-1.5"><span className="text-[11px] text-[#3c3c3c]">Ideal</span> <strong className={`px-2 py-1 rounded text-xs text-white shadow-inner whitespace-nowrap ${comparisonResult.solarGenerationVsPvLoad.ideal === 'sufficient' ? "bg-[#00963c]" : "bg-[#cc3600]"}`}> {comparisonResult.solarGenerationVsPvLoad.ideal.toUpperCase()}</strong></span>
                        <span className="flex-1 flex flex-col items-center gap-1.5"><span className="text-[11px] text-[#3c3c3c]">Actual</span> <strong className={`px-2 py-1 rounded text-xs text-white shadow-inner whitespace-nowrap ${comparisonResult.solarGenerationVsPvLoad.actual === 'sufficient' ? "bg-[#00963c]" : "bg-[#cc3600]"}`}>{comparisonResult.solarGenerationVsPvLoad.actual.toUpperCase()}</strong></span>
                    </div>
                </div>
                <div className="bg-[#ffffff] p-6 rounded-xl border border-[#f7f6fa] flex flex-col items-center justify-center text-center">
                    <p className="text-[#3c3c3c] font-semibold text-xs uppercase tracking-wide mb-3">Solar Gen Vs Critical Load</p>
                     <div className="flex items-center gap-3 w-full justify-around font-medium">
                        <span className="flex-1 flex flex-col items-center gap-1.5"><span className="text-[11px] text-[#3c3c3c]">Ideal</span> <strong className={`px-2 py-1 rounded text-xs text-white shadow-inner whitespace-nowrap ${comparisonResult.solarGenerationVsCriticalLoad.ideal === 'sufficient' ? "bg-[#00963c]" : "bg-[#cc3600]"}`}> {comparisonResult.solarGenerationVsCriticalLoad.ideal.toUpperCase()}</strong></span>
                        <span className="flex-1 flex flex-col items-center gap-1.5"><span className="text-[11px] text-[#3c3c3c]">Actual</span> <strong className={`px-2 py-1 rounded text-xs text-white shadow-inner whitespace-nowrap ${comparisonResult.solarGenerationVsCriticalLoad.actual === 'sufficient' ? "bg-[#00963c]" : "bg-[#cc3600]"}`}>{comparisonResult.solarGenerationVsCriticalLoad.actual.toUpperCase()}</strong></span>
                    </div>
                </div>
                <div className="bg-[#ffffff] p-6 rounded-xl border border-[#f7f6fa] flex flex-col items-center justify-center text-center">
                    <p className="text-[#3c3c3c] font-semibold text-xs uppercase tracking-wide mb-3">Solar Gen Vs Total Load</p>
                     <div className="flex items-center gap-3 w-full justify-around font-medium">
                        <span className="flex-1 flex flex-col items-center gap-1.5"><span className="text-[11px] text-[#3c3c3c]">Ideal</span> <strong className={`px-2 py-1 rounded text-xs text-white shadow-inner whitespace-nowrap ${comparisonResult.solarGenerationVsTotalLoad.ideal === 'sufficient' ? "bg-[#00963c]" : "bg-[#cc3600]"}`}> {comparisonResult.solarGenerationVsTotalLoad.ideal.toUpperCase()}</strong></span>
                        <span className="flex-1 flex flex-col items-center gap-1.5"><span className="text-[11px] text-[#3c3c3c]">Actual</span> <strong className={`px-2 py-1 rounded text-xs text-white shadow-inner whitespace-nowrap ${comparisonResult.solarGenerationVsTotalLoad.actual === 'sufficient' ? "bg-[#00963c]" : "bg-[#cc3600]"}`}>{comparisonResult.solarGenerationVsTotalLoad.actual.toUpperCase()}</strong></span>
                    </div>
                </div>
            </div>
          </div>
          {/*Battery Sufficiency Analysis */}
           <div className="bg-[#f8f7f1] p-6 rounded-xl border border-[#f7f6fa]">
            <h3 className="text-lg font-bold text-[#1f2020] flex items-center gap-2 border-l-4 border-[#414e5e] pl-3 uppercase tracking-wide mb-6">
                <span className="text-[#414e5e]"><FontAwesomeIcon icon = "battery-full" /></span>BATTERY SUFFICIENCY ANALYSIS
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 text-sm mb-8">
                <div className="bg-[#ffffff] p-4 rounded-lg border border-[#f7f6fa] flex items-center justify-between gap-4">
                    <p className="text-[#3c3c3c] font-medium">Existing Battery Capacity:</p>
                    <span className="font-extrabold text-xl text-[#1f2020] whitespace-nowrap">{totalBatteryAH.toFixed(2)}<code className="text-xs ml-1">AH</code></span>
                </div>
                <div className="bg-[#ffffff] p-4 rounded-lg border border-[#f7f6fa] flex items-center justify-between gap-4">
                    <p className="text-[#3c3c3c] font-medium">Required Capacity (PV Load):</p>
                    <span className="font-extrabold text-xl text-[#1f2020] whitespace-nowrap">{calc.pvloadrequiredBatteryAH.toFixed(2)}<code className="text-xs ml-1">AH</code></span>
                </div>
                <div className="bg-[#ffffff] p-4 rounded-lg border border-[#f7f6fa] flex items-center justify-between gap-4">
                    <p className="text-[#3c3c3c] font-medium">Required Capacity (Critical Load):</p>
                    <span className="font-extrabold text-xl text-[#1f2020] whitespace-nowrap">{calc.criticalloadrequiredBatteryAH.toFixed(2)}<code className="text-xs ml-1">AH</code></span>
                </div>
                <div className="bg-[#ffffff] p-4 rounded-lg border border-[#f7f6fa] flex items-center justify-between gap-4">
                    <p className="text-[#3c3c3c] font-medium">Required Capacity (Total Load):</p>
                    <span className="font-extrabold text-xl text-[#1f2020] whitespace-nowrap">{calc.totalloadrequiredBatteryAH.toFixed(2)}<code className="text-xs ml-1">AH</code></span>
                </div>
            </div>
            {/*Divided sufficiency cards*/}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-[#ffffff] p-6 rounded-xl border border-[#f7f6fa] flex items-center justify-center text-center">
                    <p className="text-[#3c3c3c] font-semibold text-xs flex-1 uppercase tracking-wide">Battery Sufficiency for PV Load</p>
                    <strong className={`px-4 py-2 rounded text-sm text-white shadow-inner font-medium whitespace-nowrap ${comparisonResult.battery.pvLoad === 'sufficient' ? "bg-[#00963c]" : "bg-[#cc3600]"}`}>{comparisonResult.battery.pvLoad.toUpperCase()}</strong>
                </div>
                 <div className="bg-[#ffffff] p-6 rounded-xl border border-[#f7f6fa] flex items-center justify-center text-center">
                    <p className="text-[#3c3c3c] font-semibold text-xs flex-1 uppercase tracking-wide">Battery Sufficiency for Critical Load</p>
                    <strong className={`px-4 py-2 rounded text-sm text-white shadow-inner font-medium whitespace-nowrap ${comparisonResult.battery.criticalLoad === 'sufficient' ? "bg-[#00963c]" : "bg-[#cc3600]"}`}>{comparisonResult.battery.criticalLoad.toUpperCase()}</strong>
                </div>
                 <div className="bg-[#ffffff] p-6 rounded-xl border border-[#f7f6fa] flex items-center justify-center text-center">
                    <p className="text-[#3c3c3c] font-semibold text-xs flex-1 uppercase tracking-wide">Battery Sufficiency for Total Load</p>
                    <strong className={`px-4 py-2 rounded text-sm text-white shadow-inner font-medium whitespace-nowrap ${comparisonResult.battery.totalLoad === 'sufficient' ? "bg-[#00963c]" : "bg-[#cc3600]"}`}>{comparisonResult.battery.totalLoad.toUpperCase()}</strong>
                </div>
            </div>
          </div>
          {/*Inverter Sufficiency Analysis */}
          <div className="bg-[#f8f7f1] p-6 rounded-xl border border-[#f7f6fa]">
            <h3 className="text-lg font-bold text-[#1f2020] flex items-center gap-2 border-l-4 border-[#414e5e] pl-3 uppercase tracking-wide mb-6">
                <span className="text-[#414e5e]"><FontAwesomeIcon icon = "bolt" /></span>INVERTER SUFFICIENCY ANALYSIS
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 text-sm mb-8">
                <div className="bg-[#ffffff] p-4 rounded-lg border border-[#f7f6fa] flex items-center justify-between gap-4">
                    <p className="text-[#3c3c3c] font-medium">Existing Inverter Capacity:</p>
                    <span className="font-extrabold text-xl text-[#1f2020] whitespace-nowrap">{existingInverterKVA.toFixed(2)}<code className="text-xs ml-1">KVA</code></span>
                </div>
                 <div className="bg-[#ffffff] p-4 rounded-lg border border-[#f7f6fa] flex items-center justify-between gap-4">
                    <p className="text-[#3c3c3c] font-medium">Required Capacity (PV Load):</p>
                    <span className="font-extrabold text-xl text-[#1f2020] whitespace-nowrap">{(calc.pvloadrequiredInverterVA/1000).toFixed(2)}<code className="text-xs ml-1">KVA</code></span>
                </div>
                 <div className="bg-[#ffffff] p-4 rounded-lg border border-[#f7f6fa] flex items-center justify-between gap-4">
                    <p className="text-[#3c3c3c] font-medium">Required Capacity (Critical Load):</p>
                    <span className="font-extrabold text-xl text-[#1f2020] whitespace-nowrap">{(calc.criticalloadrequiredInverterVA/1000).toFixed(2)}<code className="text-xs ml-1">KVA</code></span>
                </div>
                 <div className="bg-[#ffffff] p-4 rounded-lg border border-[#f7f6fa] flex items-center justify-between gap-4">
                    <p className="text-[#3c3c3c] font-medium">Required Capacity (Total Load):</p>
                    <span className="font-extrabold text-xl text-[#1f2020] whitespace-nowrap">{(calc.totalloadrequiredInverterVA/1000).toFixed(2)}<code className="text-xs ml-1">KVA</code></span>
                </div>
            </div>
             {/*Divided sufficiency cards*/}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-[#ffffff] p-6 rounded-xl border border-[#f7f6fa] flex items-center justify-center text-center">
                    <p className="text-[#3c3c3c] font-semibold text-xs flex-1 uppercase tracking-wide">Inverter Sufficiency for PV Load</p>
                    <strong className={`px-4 py-2 rounded text-sm text-white shadow-inner font-medium whitespace-nowrap ${comparisonResult.inverter.pvLoad === 'sufficient' ? "bg-[#00963c]" : "bg-[#cc3600]"}`}>{comparisonResult.inverter.pvLoad.toUpperCase()}</strong>
                </div>
                 <div className="bg-[#ffffff] p-6 rounded-xl border border-[#f7f6fa] flex items-center justify-center text-center">
                    <p className="text-[#3c3c3c] font-semibold text-xs flex-1 uppercase tracking-wide">Inverter Sufficiency for Critical Load</p>
                    <strong className={`px-4 py-2 rounded text-sm text-white shadow-inner font-medium whitespace-nowrap ${comparisonResult.inverter.criticalLoad === 'sufficient' ? "bg-[#00963c]" : "bg-[#cc3600]"}`}>{comparisonResult.inverter.criticalLoad.toUpperCase()}</strong>
                </div>
                 <div className="bg-[#ffffff] p-6 rounded-xl border border-[#f7f6fa] flex items-center justify-center text-center">
                    <p className="text-[#3c3c3c] font-semibold text-xs flex-1 uppercase tracking-wide">Inverter Sufficiency for Total Load</p>
                    <strong className={`px-4 py-2 rounded text-sm text-white shadow-inner font-medium whitespace-nowrap ${comparisonResult.inverter.totalLoad === 'sufficient' ? "bg-[#00963c]" : "bg-[#cc3600]"}`}>{comparisonResult.inverter.totalLoad.toUpperCase()}</strong>
                </div>
            </div>
          </div>
        </section>

      {/* Visual Insights - Charts Section with 2 per row layout */}
      <div id="visual-insights" className="mb-10">
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-2xl font-extrabold text-[#414e5e] flex items-center gap-3 uppercase tracking-wide">Visual Insights</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart 1 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2"> IDEAL SOLAR GENERATION VS ACTUAL SOLAR UTILISATION</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={solarLineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis label={{ value: 'Energy (KWH)', angle: -90, position: 'insideLeft', style: { fill: '#425C5A' } }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="idealgeneration" name="Ideal Solar Generation" stroke="#8884d8" />
                <Line type="monotone" dataKey="actualgeneration" name="Actual Solar Utilisation" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2"> SOLAR ENERGY UTILISATION EFFICIENCY REDUCTION (%)</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={efficiencyLineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis label={{ value: 'Efficiency Reduction (%)', angle: -90, position: 'insideLeft', style: { fill: '#425C5A' } }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="reductionPercent" name="Efficiency Reduction (%)" stroke="#ff7300" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 3 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2"><FontAwesomeIcon icon="chart-line" className="text-[#FFD43B]" /> SOLAR GENERATION, GRID CONSUMPTION AND PV LOAD COMPARISON</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={comparisonLineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis label={{ value: 'Energy (KWH)', angle: -90, position: 'insideLeft', style: { fill: '#425C5A' } }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="idealgeneration" name="Ideal Solar Generation" stroke="#3366CC" />
                <Line type="monotone" dataKey="actualgeneration" name="Actual Solar Utilisation" stroke="#DC3912" />
                <Line type="monotone" dataKey="gridconsumption" name="Grid Consumption" stroke="#FF9900" />
                <Line type="monotone" dataKey="pvLoadMonthlyKwh" name="PV Load (Monthly KWH)" stroke="#109618" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 4 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2"><FontAwesomeIcon icon="chart-line" className="text-[#FFD43B]" /> SOLAR GENERATION, TOTAL AND CRITICAL LOAD COMPARISON</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={loadComparisonLineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis label={{ value: 'Energy (KWH)', angle: -90, position: 'insideLeft', style: { fill: '#425C5A' } }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="idealgeneration" name="Ideal Solar Generation" stroke="#3366CC" />
                <Line type="monotone" dataKey="actualgeneration" name="Actual Solar Utilisation" stroke="#DC3912" />
                <Line type="monotone" dataKey="criticalLoadMonthlyKwh" name="Critical Load (Monthly KWH)" stroke="#FF9900" />
                <Line type="monotone" dataKey="totalLoadMonthlyKwh" name="Total Load (Monthly KWH)" stroke="#109618" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 5 & 6 - Battery and Inverter Sufficiency side by side */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2"><FontAwesomeIcon icon="chart-line" className="text-[#FFD43B]" /> BATTERY SUFFICIENCY ANALYSIS</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={BatterysystemCompData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Capacity (AH)', angle: -90, position: 'insideLeft', style: { fill: '#425C5A' } }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="existing" name="Existing Battery Capacity (AH)" fill="#8884d8" />
                <Bar dataKey="pvrequired" name="PV Load Required Battery Capacity (AH)" fill="#82ca9d" />
                <Bar dataKey="criticalLoadRequired" name="Critical Load Required Battery Capacity (AH)" fill="#ff7300" />
                <Bar dataKey="totalLoadRequired" name="Total Load Required Battery Capacity (AH)" fill="#109618" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2"><FontAwesomeIcon icon="chart-line" className="text-[#FFD43B]" /> INVERTER SUFFICIENCY ANALYSIS</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={InvertersystemCompData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Rating (KVA)', angle: -90, position: 'insideLeft', style: { fill: '#425C5A' } }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="existing" name="Existing Inverter Rating (KVA)" fill="#8884d8" />
                <Bar dataKey="pvrequired" name="PV Load Required Inverter Rating (KVA)" fill="#82ca9d" />
                <Bar dataKey="criticalLoadRequired" name="Critical Load Required Inverter Rating (KVA)" fill="#ff7300" />
                <Bar dataKey="totalLoadRequired" name="Total Load Required Inverter Rating (KVA)" fill="#109618" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 7 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2"><FontAwesomeIcon icon="chart-line" className="text-[#FFD43B]" /> LOAD TYPE COMPARISON (Grid vs PV Connected)</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={loadBreakdownData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Load Rating (W)', angle: -90, position: 'insideLeft', style: { fill: '#425C5A' } }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="pvLoad" name="PV Connected Load (W)" fill="#8884d8" />
                <Bar dataKey="gridLoad" name="Total Load (W)" fill="#ff7300" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 8 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2"><FontAwesomeIcon icon="chart-line" className="text-[#FFD43B]" /> LOAD DISTRIBUTION</h3>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={loadPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label={({ name, value }) => `${name}: ${value}W`}
                >
                  {loadPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF4560", "#00E396"][index % 7]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 9 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 lg:col-span-2">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2"><FontAwesomeIcon icon="chart-line" className="text-[#FFD43B]" /> LOAD CRITICALITY COMPARISON</h3>
            <div className="flex justify-center">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={criticalityPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label={({ name, value }) => `${name}: ${value}W`}
                  >
                    {criticalityPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === "Critical Load" ? "#00E396" : "#82ca9d"} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <section id="additional-info" className="bg-[#ffffff] rounded-xl shadow border border-[#f8f7f1] p-6 mb-8">
        
        {/* Headers */}
        <div className="mb-6 border-b-2 border-[#414e5e] pb-3 text-center sm:text-left">
          <h2 className="text-2xl font-extrabold text-[#414e5e] uppercase tracking-wide">
            Additional Information
          </h2>
          <p className="text-sm font-semibold text-[#6b7280] uppercase tracking-wider mt-1">
            Grid & Maintenance Details
          </p>
        </div>

        {/* Data Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Grid Supply */}
          <div className="bg-[#f8f7f1] p-5 rounded-xl border border-[#eae9e4] flex flex-col items-center sm:items-start text-center sm:text-left h-full">
            <p className="text-[#6b7280] font-bold text-xs uppercase tracking-wide mb-2">Grid Supply</p>
            <p className="text-lg font-extrabold text-[#1f2020] mt-auto">
              {centre?.additionalInfo?.gridSupply === true ? "Yes" : centre?.additionalInfo?.gridSupply === false ? "No" : "—"}
            </p>
          </div>

          {/* Grid Supply Quality */}
          <div className="bg-[#f8f7f1] p-5 rounded-xl border border-[#eae9e4] flex flex-col items-center sm:items-start text-center sm:text-left h-full">
            <p className="text-[#6b7280] font-bold text-xs uppercase tracking-wide mb-2">Grid Supply Quality</p>
            <p className="text-lg font-extrabold text-[#1f2020] mt-auto">
              {centre?.additionalInfo?.gridsupplyQuality?.toUpperCase() || "—"}
            </p>
          </div>

          {/* Supply Type */}
          <div className="bg-[#f8f7f1] p-5 rounded-xl border border-[#eae9e4] flex flex-col items-center sm:items-start text-center sm:text-left h-full">
            <p className="text-[#6b7280] font-bold text-xs uppercase tracking-wide mb-2">Supply Type</p>
            <p className="text-lg font-extrabold text-[#1f2020] mt-auto">
              {centre?.additionalInfo?.Supply?.toUpperCase() || "—"}
            </p>
          </div>

          {/* Load Tripping */}
          <div className="bg-[#f8f7f1] p-5 rounded-xl border border-[#eae9e4] flex flex-col items-center sm:items-start text-center sm:text-left h-full">
            <p className="text-[#6b7280] font-bold text-xs uppercase tracking-wide mb-2">Load Tripping (Day)</p>
            <p className="text-lg font-extrabold text-[#1f2020] mt-auto">
              {centre?.additionalInfo?.anyloadtrippingduringtheDay?.toUpperCase() || "—"}
            </p>
          </div>

          {/* Involvement of CREDA */}
          <div className="bg-[#f8f7f1] p-5 rounded-xl border border-[#eae9e4] flex flex-col items-center sm:items-start text-center sm:text-left h-full">
            <p className="text-[#6b7280] font-bold text-xs uppercase tracking-wide mb-2">Involvement of CREDA</p>
            <p className="text-lg font-extrabold text-[#1f2020] mt-auto">
              {centre?.additionalInfo?.InvolvementofCREDA === true ? "Yes" : centre?.additionalInfo?.InvolvementofCREDA === false ? "No" : "—"}
            </p>
          </div>

          {/* Panel Maintenance */}
          <div className="bg-[#f8f7f1] p-5 rounded-xl border border-[#eae9e4] flex flex-col items-center sm:items-start text-center sm:text-left h-full">
            <p className="text-[#6b7280] font-bold text-xs uppercase tracking-wide mb-2">Panel Maintenance Frequency</p>
            <p className="text-lg font-extrabold text-[#1f2020] mt-auto">
              {centre?.additionalInfo?.panelmaintenanceFrequency?.toUpperCase() || "—"}
            </p>
          </div>

          {/* Solar Failure */}
          <div className="bg-[#f8f7f1] p-5 rounded-xl border border-[#eae9e4] flex flex-col items-center sm:items-start text-center sm:text-left h-full">
            <p className="text-[#6b7280] font-bold text-xs uppercase tracking-wide mb-2">Failure Freq. of Solar Panels</p>
            <p className="text-lg font-extrabold text-[#1f2020] mt-auto">
              {centre?.additionalInfo?.failureFrequencyofsolarPanels?.toUpperCase() || "—"}
            </p>
          </div>

          {/* Battery Water */}
          <div className="bg-[#f8f7f1] p-5 rounded-xl border border-[#eae9e4] flex flex-col items-center sm:items-start text-center sm:text-left h-full">
            <p className="text-[#6b7280] font-bold text-xs uppercase tracking-wide mb-2">Changing Battery Water Freq.</p>
            <p className="text-lg font-extrabold text-[#1f2020] mt-auto">
              {centre?.additionalInfo?.frequencyofchangingbatteryWater?.toUpperCase() || "—"}
            </p>
          </div>

          {/* Battery Backup */}
          <div className="bg-[#f8f7f1] p-5 rounded-xl border border-[#eae9e4] flex flex-col items-center sm:items-start text-center sm:text-left h-full">
            <p className="text-[#6b7280] font-bold text-xs uppercase tracking-wide mb-2">Battery Backup Till Sunrise</p>
            <p className="text-lg font-extrabold text-[#1f2020] mt-auto">
              {centre?.additionalInfo?.batterybackuptillSunrise?.toUpperCase() || "—"}
            </p>
          </div>

          {/* Resolution Time */}
          <div className="bg-[#f8f7f1] p-5 rounded-xl border border-[#eae9e4] flex flex-col items-center sm:items-start text-center sm:text-left h-full">
            <p className="text-[#6b7280] font-bold text-xs uppercase tracking-wide mb-2">Resolution Time (Solar Repairs)</p>
            <p className="text-lg font-extrabold text-[#1f2020] mt-auto">
              {centre?.additionalInfo?.resolutionTimeforSolarPanelRepairs?.toUpperCase() || "—"}
            </p>
          </div>

          {/* Downtime */}
          <div className="bg-[#f8f7f1] p-5 rounded-xl border border-[#eae9e4] flex flex-col items-center sm:items-start text-center sm:text-left h-full">
            <p className="text-[#6b7280] font-bold text-xs uppercase tracking-wide mb-2">Downtime during Faults</p>
            <p className="text-lg font-extrabold text-[#1f2020] mt-auto">
              {centre?.additionalInfo?.downtimeduringFaults?.toUpperCase() || "—"}
            </p>
          </div>

        </div>
      </section>
      {/*Remarks Section*/}
      <section className="bg-[#f8f7f1] p-6 rounded-xl border border-[#f7f6fa] shadow-sm mb-8">
        <h3 className="text-lg font-bold text-[#414e5e] mb-3 uppercase tracking-wide">Remarks</h3>
        <p className="text-[#1f2020] bg-[#ffffff] p-5 rounded-lg shadow-inner italic border border-[#f8f7f1] leading-relaxed wrap-break-word">{centre.remarks || "—"}</p>
      </section>

      {/*Uploaded File Section*/}
      <section className="bg-[#f8f7f1] p-6 rounded-xl border border-[#f7f6fa] shadow-sm">
        <h3 className="text-lg font-bold text-[#414e5e] mb-4 uppercase tracking-wide">Uploaded & Reference File </h3>
        <div className="bg-[#ffffff] p-5 rounded-lg shadow-inner inline-block border border-[#f8f7f1]">
        {centre.imagefile ? (
          <a href={centre.imagefile} target="_blank" rel="noopener noreferrer" className="text-[#ffffff] bg-[#414e5e] px-6 py-3 rounded-lg hover:bg-[#3c3c3c] hover:shadow-md transition-all font-bold tracking-wide">
            View File
          </a>
        ) : (
          <p className="text-[#3c3c3c] italic">No file uploaded.</p>
        )}
        </div>
      </section>
      <ExportPDFButton centre={centre} nitrLogo={nitrLogo} unicefLogo={unicefLogo} />

    </div>
  )
}


function Dashboard() {
  const districts     = useSelector((state) => state.data.districts);
  const healthCentres = useSelector((state) => state.data.healthCentres);

  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCentre,   setSelectedCentre]   = useState("");
  const [centresData,      setCentresData]       = useState([]);
  const [loading,          setLoading]           = useState(false);
  const [error,            setError]             = useState(null);

  const availableCentres = selectedDistrict
    ? healthCentres[selectedDistrict] || []
    : [];

  useEffect(() => {
    if (!selectedDistrict) {
      setCentresData([]);
      setSelectedCentre("");
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedCentre("");
    setCentresData([]);

    axios
      .get(
        `${import.meta.env.VITE_API_URL}/api/v2/centres/${encodeURIComponent(
          selectedDistrict.toLowerCase()
        )}`,
        { withCredentials: true }
      )
      .then((res) => {
        setCentresData(res.data?.data?.centres || []);
        setLoading(false);
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setCentresData([]);
        } else {
          setError(err.response?.data?.message || err.message);
        }
        setLoading(false);
      });
  }, [selectedDistrict]);

  const displayedCentres = selectedCentre
  ? centresData.filter(
      (c) => c.centreName.toLowerCase() === selectedCentre.toLowerCase()
    )
  : [];


  return (
    <div className="min-h-screen bg-[#f7f6fa] text-[#3c3c3c] font-sans pb-12">
      <div className="bg-[#011425] px-8 py-6 shadow-md text-[#ffffff] border-b-[6px] border-[#1f2020] flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Solar Audit Dashboard</h1>
          <h4 className="text-[#f8f7f1] text-sm md:text-base opacity-90 tracking-wide"> Chhattisgarh State Health Facilities Power Overview</h4>
        </div>
      </div>

      <div className="max-w-400 mx-auto px-4 sm:px-6 lg:px-8 space-y-6 flex flex-col md:flex-row gap-8">
        
        {/* Left Combined Sidebar: Filters & Section Nav */}
        <div className="w-full md:w-72 shrink-0">
          <aside className="bg-[#011425] text-[#ffffff] p-6 rounded-xl shadow-lg border border-[#3c3c3c] sticky top-20">
             <div className="flex items-center gap-2 mb-6 border-b border-[#3c3c3c] pb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              <h2 className="text-sm font-bold tracking-widest uppercase">FILTERS</h2>
            </div>

            {/* Filter Section */}
            <div className="mb-6 space-y-4">
              <label className="block text-xs font-semibold text-[#f8f7f1] mb-2 uppercase tracking-wide opacity-80 pl-2">Select District</label>
              <select
                className="w-full bg-[#ffffff] text-[#1f2020] text-sm p-3 rounded shadow-inner border border-transparent focus:border-[#414e5e] focus:ring-2 focus:ring-[#f8f7f1] transition outline-none cursor-pointer"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
              >
                <option value="" className="text-[#3c3c3c] italic"> Select District </option>
                {districts.map((d) => (
                  <option key={d} value={d} className="font-medium">{d}</option>
                ))}
              </select>
              <label className="block text-xs font-semibold text-[#f8f7f1] mb-2 uppercase tracking-wide opacity-80 pl-2">Select Centre</label>
              <select
                className="w-full bg-[#ffffff] text-[#1f2020] text-sm p-3 rounded shadow-inner border border-transparent focus:border-[#414e5e] focus:ring-2 focus:ring-[#f8f7f1] transition outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                value={selectedCentre}
                onChange={(e) => setSelectedCentre(e.target.value)}
                disabled={!selectedDistrict}
              >
                <option value="" className="text-[#3c3c3c] italic"> {selectedDistrict
                    ? "Select a centre"
                    : " Select a district first "} </option>
                {availableCentres.map((c) => (
                  <option key={c} value={c} className="font-medium">{c}</option>
                ))}
              </select>
            </div>

             {/* Section Nav Section */}
             {selectedCentre && (
                <div className="mt-8 space-y-1.5 border-t border-[#3c3c3c] pt-5">
                    {[
                        { icon: 'house', label: 'Site Details', id: 'centre-details' },
                        { icon: 'microchip', label: 'System Details', id: 'system-details' },
                        { icon: 'bolt', label: 'Energy Details', id: 'energy-details' },
                        { icon: 'lightbulb', label: 'Load Details', id: 'load-details' },
                        { icon: 'calculator', label: 'Formulas', id: 'formulas' },
                        { icon: 'arrow-trend-up', label: 'Analysis', id: 'analysis' },
                        { icon: 'chart-area', label: 'Visual Insights', id: 'visual-insights' },
                        { icon: 'file', label: 'Additional Info', id: 'additional-info' },
                    ].map((item, index) => (
                        <a key={index} 
                           href={`#${item.id}`} 
                           className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#f8f7f1] hover:bg-[#ffffff20] hover:text-white transition font-medium tracking-tight whitespace-nowrap">
                            <span className="w-5 text-center"><FontAwesomeIcon icon={item.icon} className="opacity-80"/></span>
                            {item.label}
                        </a>
                    ))}
                </div>
            )}

          </aside>
        </div>

        {/* Main Content Area */}
        <div className="w-full flex-1 flex flex-col gap-6 overflow-hidden">
          {/* Main Content States */}
          {loading && (
            <div className="bg-[#ffffff] p-12 rounded-xl shadow-sm border border-[#f8f7f1] text-center flex items-center justify-center min-h-100">
              <p className="text-[#414e5e] font-bold text-xl animate-pulse flex items-center justify-center gap-3 bg-[#f8f7f1] px-8 py-4 rounded-full shadow-inner">
                <svg className="animate-spin h-6 w-6 text-[#1f2020]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Loading Facility Audit Data...
              </p>
            </div>
          )}
          {error   && (
            <div className="bg-[#1f2020] text-[#ffffff] p-8 rounded-xl shadow-md font-medium flex items-center gap-4 border-l-8 border-[#414e5e]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#f8f7f1]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-lg">Error: {error}</p>
            </div>
          )}
          {!loading && !error && selectedCentre === "" && (
            <div className="bg-[#ffffff] p-12 rounded-xl shadow-sm border border-[#f8f7f1] text-center flex flex-col items-center justify-center h-full min-h-125">
              <div className="bg-[#f8f7f1] p-6 rounded-full mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-[#414e5e]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
              </div>
              <h3 className="text-[#1f2020] text-2xl font-bold mb-2 tracking-wide">Select a Facility</h3>
              <p className="text-[#3c3c3c] text-lg font-medium max-w-md">Please use the sidebar filters to select a district and a specific health centre to view its complete audit dashboard.</p>
            </div>
          )}
          {!loading && !error && selectedCentre !== "" && displayedCentres.length === 0 && (
            <div className="bg-[#ffffff] p-12 rounded-xl shadow-sm border border-[#f8f7f1] text-center flex flex-col items-center justify-center min-h-100">
              <div className="bg-[#f8f7f1] p-6 rounded-full mb-6">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-[#3c3c3c]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
              </div>
              <p className="text-[#3c3c3c] text-xl font-bold">No data available for the selected centre.</p>
            </div>
          )}

          {/* Centre Cards Component injection */}
          {!loading && !error && displayedCentres.map((centre) => (
            <Dashboardcomponent key={centre._id} centre={centre} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard