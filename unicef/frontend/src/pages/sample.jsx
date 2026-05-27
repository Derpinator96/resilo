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
    EfficiencyReduction: "Efficiency Reduction (%) = ((Ideal Solar Generation - Actual Solar Generation) / Ideal Solar Generation) * 100",
  }
};

// Calculation function
function calcSystem(centre, loads, batteryVoltage, batteryCount) {
  const gridconsumption = centre.gridconsumption || [];
  const pvLoads  = loads.filter((l) => (l.pvConnectedquantity) > 0);
  const criticalLoads  = loads.filter((l) => l.criticalLoad);

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
    ? gridconsumption.reduce((s, d) => s + d.consumption, 0) / gridconsumption.length
    : 0;

const pvLoadMonthlyKwh = (pvloadTotalW * HOURS_PER_DAY * DAYS_PER_MONTH) / 1000;

// utilization factor calculation
  const connectedLoadKW = totalloadW / 1000;
  const maxPossibleMonthlyEnergy =connectedLoadKW * 24 * DAYS_PER_MONTH;
  const UTILIZATION_FACTOR =avggridConsumption / maxPossibleMonthlyEnergy;

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
  const {calc, comparisonResult, existingInverterKVA, totalBatteryAH, avggridConsumption, avgidealSolargeneration, avgactualSolargeneration} = comparison({ centre });
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
    <div>
      <div>
        <h1>{centre.centreName.toUpperCase()}</h1>
      </div>

      {/*Centre Details*/}
        <section>
          <div>
            <h2><span><FontAwesomeIcon icon="house" /></span>CENTRE DETAILS</h2>
            <div>
              <p><span><FontAwesomeIcon icon="location-crosshairs" /></span>DISTRICT</p>
              <p><strong>{centre.district?.toUpperCase() || "N/A"}</strong></p>
            </div>
            <div>
              <p><span><FontAwesomeIcon icon="location-arrow" /></span>CENTRE NAME</p>
              <p><strong>{centre.centreName?.toUpperCase() || "N/A"}</strong></p>
            </div>
          </div>
        </section>

      {/*Location Details*/}
        <section>
          <div>
            <h2><span><FontAwesomeIcon icon="location-dot" /></span>LOCATION DETAILS</h2>
            <div>
              <p><span><FontAwesomeIcon icon="location-crosshairs" /></span>LATITUDE</p>
              <p><strong>{centre.latitude}</strong></p>
            </div>
            <div>
              <p><span><FontAwesomeIcon icon="location-arrow" /></span>LONGITUDE</p>
              <p><strong>{centre.longitude}</strong></p>
            </div>
          </div>
        </section>

      {/*Centre Image*/}
        <div>
          <figcaption>Centre Image</figcaption>
          <figure>
            <img
              src={centre.images.siteImageUrl}
              alt="Site Image"
            />
          </figure>
        </div>


      {/*System Details*/}
        <section>
          <div>
            <h2><span><FontAwesomeIcon icon="microchip" /></span>SYSTEM DETAILS</h2>
            <h3><span><FontAwesomeIcon icon="solar-panel" /></span>SOLAR PANEL SPECIFICATIONS</h3>
            <div>
              <p><span><FontAwesomeIcon icon="bolt" /></span>TOTAL RATING</p>
              <p><strong>{ centre.pvRating * centre.noOfPanels / 1000}</strong><span> KWp</span></p>
            </div>
            <div>
              <p><span><FontAwesomeIcon icon="solar-panel" /></span>PANEL RATING</p>
              <p><strong>{ centre.pvRating}</strong><span> WATTS</span></p>
            </div>
            <div>
              <p><span><FontAwesomeIcon icon="pen" />NO. OF PANELS</span></p>
              <p><strong>{centre.noOfPanels}</strong></p>
            </div>
            <div>
              <p><span><FontAwesomeIcon icon="battery-full" /></span>VOLTAGE RATING</p>
              <p><strong>{ centre.pvVoltage}</strong><span> VOLTS</span></p>
            </div>
            <div>
              <p><span><FontAwesomeIcon icon="font-awesome" /></span>MANUFACTURER</p>
              <p><strong>{ centre.pvSystemake?.toUpperCase() || "N/A" }</strong></p>
            </div>
            <div>
              <p><span><FontAwesomeIcon icon="calendar" /></span>DATE OF INSTALLATION</p>
              <p><strong>{ centre.dateOfInstallation
                ? new Date(centre.dateOfInstallation).toLocaleDateString("en-IN", {
                day: "2-digit", month: "short", year: "numeric",})
              : "—"}</strong></p>
            </div>
          </div>
          {/* Solar Panel Image Section */}
          <div>
            <figure>
              <figcaption>Solar Panel Image</figcaption>
              <img
                src={centre.images.panelImageUrl}
                alt="Solar Panel Image"
              />
            </figure>

            <figure>
              <figcaption>Panel Rating Image</figcaption>
              <img
                src={centre.images.panelratingImageUrl}
                alt="Panel Rating Image"
              />
            </figure>
          </div>

          <div>
            <h3><span><FontAwesomeIcon icon="battery-full" /></span>BATTERY SPECIFICATIONS</h3>
            <div>
              <p><span><FontAwesomeIcon icon="bolt" /></span>TOTAL CAPACITY</p>
              <p><strong>{ centre.battery.capacityAh }</strong><span> AH</span></p>
            </div>
            <div>
              <p><span><FontAwesomeIcon icon="battery-full" /></span>BATTERY RATING</p>
              <p><strong>{ centre.battery.capacityAh}</strong><span> AH</span></p>
            </div>
            <div>
              <p><span><FontAwesomeIcon icon="pen" />NO. OF BATTERIES</span></p>
              <p><strong>{centre.battery.count}</strong></p>
            </div>
            <div>
              <p><span><FontAwesomeIcon icon="battery-full" /></span>SYSTEM TOTAL VOLTAGE RATING</p>
              <p><strong>{ centre.battery.voltage * centre.battery.count}</strong><span> VOLTS</span></p>
            </div>
            <div>
              <p><span><FontAwesomeIcon icon="bolt" /></span>BATTERY VOLTAGE RATING</p>
              <p><strong>{ centre.battery.voltage}</strong><span> VOLTS</span></p>
            </div>
            <div>
              <p><span><FontAwesomeIcon icon="font-awesome" /></span>MANUFACTURER</p>
              <p><strong>{ centre.battery.Manufacturer?.toUpperCase() || "N/A" }</strong></p>
            </div>
          </div>
          {/* Battery Image Section */}
          <div>
            <figure>
              <figcaption>Battery Image</figcaption>
              <img
                src={centre.images.batteryImageUrl}
                alt="Battery Image"
              />
            </figure>

            <figure>
              <figcaption>Battery Rating Image</figcaption>
              <img
                src={centre.images.batteryratingImageUrl}
                alt="Battery Rating Image"
              />
            </figure>
          </div>

          <div>
            <h3><span><FontAwesomeIcon icon="bolt" /></span>INVERTER SPECIFICATIONS</h3>
            <div>
              <p><span><FontAwesomeIcon icon="bolt" /></span>TOTAL RATING</p>
              <p><strong>{ centre.inverter.inverterRatingKVA}</strong><span> KVA</span></p>
            </div>
            <div>
              <p><span><FontAwesomeIcon icon="battery-full" /></span>VOLTAGE RATING</p>
              <p><strong>{ centre.inverter.voltage}</strong><span> VOLTS</span></p>
            </div>
            <div>
              <p><span><FontAwesomeIcon icon="pen" /></span>TYPE</p>
              <p><strong>{ centre.inverter.type? centre.inverter.type.toUpperCase() : "N/A" }</strong></p>
            </div>
            <div>
              <p><span><FontAwesomeIcon icon="font-awesome" /></span>MANUFACTURER</p>
              <p><strong>{ centre.inverter.make?.toUpperCase() || "N/A" }</strong></p>
            </div>
          </div>
          {/* Inverter Image Section */}
          <div>
            <figure>
              <figcaption>Inverter Image</figcaption>
              <img
                src={centre.images.inverterImageUrl}
                alt="Inverter Image"
              />
            </figure>

            <figure>
              <figcaption>Inverter Rating Image</figcaption>
              <img
                src={centre.images.inverterRatingImageUrl}
                alt="Inverter Rating Image"
              />
            </figure>
          </div>
        </section>

      {/*Energy details*/}
        <section> 
          <div>
            <h2><span><FontAwesomeIcon icon="bolt" /></span>ENERGY DETAILS</h2>
          </div> 
          <div>
            <h3><span><FontAwesomeIcon icon="plug" /></span>LAST 12 MONTHS GRID ENERGY CONSUMPTION</h3>
            <div>
              {gridconsumption.length > 0 ? (
                <ul>
                  {gridconsumption.map((g, i) => (
                    <li key={i}>
                      <p><span><FontAwesomeIcon icon="bolt" /></span> {g.month? new Date(g.month).toLocaleDateString("en-IN", {
                        month: "long", year: "numeric",
                      }) : "_"}</p>
                      <p><strong>{g.consumption}</strong><span> KWH</span></p>
                    </li>
                  ))}
                </ul> 
              ) : (
                <p>No grid consumption data available.</p>
              )}
            </div>
          </div>
          <div>
            <h3><span><FontAwesomeIcon icon="sun" /></span>LAST 12 MONTHS ACTUAL SOLAR GENERATION</h3>
            <div>
              {actualsolargeneration.length > 0 ? (
                <ul>
                  {actualsolargeneration.map((g, i) => (
                    <li key={i}>
                      <p><span><FontAwesomeIcon icon="bolt" /></span> {g.month? new Date(g.month).toLocaleDateString("en-IN", {
                        month: "long", year: "numeric",
                      }) : "_"}</p>
                      <p><strong>{g.generation}</strong><span> KWH</span></p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No actual solar generation data available.</p>
              )}
            </div>
          </div>
          <div>
            <h3><span><FontAwesomeIcon icon = "solar-panel" /></span>LAST 12 MONTHS IDEAL SOLAR GENERATION</h3>
            <div>
              {idealsolargeneration.length > 0 ? (
                <ul>
                  {idealsolargeneration.map((g, i) => (
                    <li key={i}>
                      <p><span><FontAwesomeIcon icon = "bolt" /></span> {g.month? new Date(g.month).toLocaleDateString("en-In",{
                        month: "long", year: "numeric",
                      }) : "_"}</p>
                      <p><strong>{g.generation}</strong><span> KWH</span></p>
                    </li>
                    ))}
                </ul> 
              ) : (
                <p> No ideal solar generation data available</p>
              )}
            </div>
          </div>

        </section>
      
      {/* Load Details Table */}
      <section>
        <div>
          <h2><span><FontAwesomeIcon icon="lightbulb" /></span>LOAD DETAILS</h2>
          {orderedLoads.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>TYPE OF LOAD</th>
                  <th>RATING OF LOAD </th>
                  <th>NUMBER OF LOAD</th>
                  <th>PV CONNECTED QUANTITY</th>
                  <th>CRITICAL LOAD</th>
                  <th>GROSS VOLUME (LITRES)</th>
                  <th>MANUFACTURER</th>
                  <th>MODEL</th>
                </tr>
              </thead>
              <tbody>
                {orderedLoads.map((load, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{load.typeOfLoad}</td>
                    <td>{load.ratingOfLoad}</td>
                    <td>{load.numberOfLoad}</td>
                    <td>{load.pvConnectedquantity || "-"}</td>
                    <td>{load.criticalLoad ? "Yes" : "No"}</td>
                    <td>{load.grossVolume || "-"}</td>
                    <td>{load.make || "-"}</td>
                    <td>{load.model || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No load details available.</p>
          )}
        </div>
      </section>

      {/* Solar Generation efficiency reduction details*/}
      <section>
        <div>
          <h2><span><FontAwesomeIcon icon = "solar-panel" /></span>SOLAR PANEL GENERATION EFFICIENCY OVER LAST 12 MONTHS</h2>
          {efficiencyReductions.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>S.NO.</th>
                  <th>Generation Period</th>
                  <th>Ideal Solar Energy Generation</th>
                  <th>Actual Solar Energy Generation</th>
                  <th>Efficiency Reduction (%)</th>
                </tr>
              </thead>
              <tbody>
                {efficiencyReductions.map((reduction, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{reduction.month}</td>
                    <td>{reduction.idealGeneration}</td>
                    <td>
                      {reduction.actualGenerationRaw === 0
                        ? "Meter Fault"
                        : reduction.actualGenerationRaw.toFixed(2)}
                    </td>
                    <td>
                      {reduction.actualGenerationRaw === 0
                        ? "Meter Fault"
                        : reduction.reductionPercent.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            ) : (
            <p>No efficiency details available.</p>
          )}

        </div>
      </section>

      {/* Formulas Used Section */}
      <section>
        <div>
          <h2><span><FontAwesomeIcon icon="calculator" /></span>FORMULAS USED</h2>
        </div>
        <div>
            <div>
              <p><span><FontAwesomeIcon icon = "sun" /></span>Ideal Solar Generation:</p>
              <p><strong> {formulas.IdealSolarGeneration}</strong></p>
              <p>Effective Efficiency:<strong> {formulas.EffectiveEfficiency}</strong></p>
            </div>
            <div>
              <p><span><FontAwesomeIcon icon = "arrow-trend-down" /></span>Solar Generation Efficiency Reduction:</p>
              <p><strong> {formulas.EfficiencyReduction}</strong></p>
            </div>
            <div>
              <p><span><FontAwesomeIcon icon = "bolt" /></span>Inverter Sizing:</p>
              <p><strong> {formulas.InverterSizing}</strong></p>
            </div>
            <div>
              <p><span><FontAwesomeIcon icon = "battery-full" /></span>Battery Sizing:</p>
              <p><strong> {formulas.BatterySizing}</strong></p>
            </div>
        </div>
        <div>
            <p><span><FontAwesomeIcon icon="exclamation-triangle" /></span>Note: The above formulas are based on standard engineering principles for solar PV system design and using following constants:</p>
            <ul>
              <li>Safety Factor: {(SAFETY_FACTOR-1)*100}%</li>
              <li>Power Factor: {POWER_FACTOR}</li>
              <li>Battery Efficiency: {BATTERY_EFF*100}%</li>
              <li>Inverter Efficiency: {INVERTER_EFF*100}%</li>
              <li>Backup Hours: {BACKUP_HOURS}</li>
              <li>Hours Per Day: {HOURS_PER_DAY}</li>
              <li>Days Per Month: {DAYS_PER_MONTH}</li>
              <li>Performance Ratio: {PERFORMANCE_RATIO}</li>
              <li>Derating Factor: {DERATING_FACTOR}</li>
              <li>Soiling Factor: {SOILING_FACTOR}</li>
              <li>Mismatch Factor: {MISMATCH_FACTOR}</li>
            </ul>
            <p>Overall Effective Efficiency of Solar Panels: {EFFECTIVE_EFFICIENCY}%</p>
        </div>
      </section>

      {/* calculation*/}
      <section>
        <div>
          <h2><span><FontAwesomeIcon icon="calculator" /></span>CALCULATIONS</h2>
        </div>
        <div>
          <p><span><FontAwesomeIcon icon="bolt" /></span>Inverter Sizing for PV Connected Load:</p>
          <p>
            <ul>
              <li>Step 1: Calculate the total PV Connected Load with safety factor : {calc.pvloadTotalW} × {SAFETY_FACTOR} = {calc.pvloadWithSafety}</li>
              <li>Step 2: Calculate the required inverter rating in VA : {calc.pvloadWithSafety} ÷ {POWER_FACTOR} = {calc.pvloadrequiredInverterVA.toFixed(2)}</li>
            </ul>
          </p>
          <p><span><FontAwesomeIcon icon="bolt" /></span>Inverter Sizing for Critical Load: </p>
          <p>
            <ul>
              <li>Step 1: Calculate the total Critical Load with safety factor : {calc.criticalloadW} × {SAFETY_FACTOR} = {calc.criticalloadWithSafety}</li>
              <li>Step 2: Calculate the required inverter rating in VA : {calc.criticalloadWithSafety} ÷ {POWER_FACTOR} = {calc.criticalloadrequiredInverterVA.toFixed(2)}</li>
            </ul>
          </p>
          <p><span><FontAwesomeIcon icon="bolt" /></span>Inverter Sizing for Total Load: </p>
          <p>
            <ul>
              <li>Step 1: Calculate the total Load with safety factor : {calc.totalloadW} × {SAFETY_FACTOR} = {calc.totalloadWithSafety}</li>
              <li>Step 2: Calculate the required inverter rating in VA : {calc.totalloadWithSafety} × {DIVERSITY_FACTOR} ÷ {POWER_FACTOR} = {calc.totalloadrequiredInverterVA.toFixed(2)}</li>
            </ul>
          </p>
        </div>
        <div>
          <p><span><FontAwesomeIcon icon="battery-full" /></span>Battery Sizing for PV Connected Load: </p>
          <p>
            <ul>
              <li>Step 1: Calculate the total PV Connected Load with safety factor : {calc.pvloadTotalW} × {SAFETY_FACTOR} = {calc.pvloadWithSafety}</li>
              <li>Step 2: Calculate the required battery capacity in AH : ({calc.pvloadWithSafety} × {BACKUP_HOURS}) ÷ ({calc.sysV} × {BATTERY_EFF} × {INVERTER_EFF}) = {calc.pvloadrequiredBatteryAH.toFixed(2)}</li>
            </ul>
          </p>
          <p><span><FontAwesomeIcon icon="battery-full" /></span>Battery Sizing for Critical Load: </p>
          <p>
            <ul>
              <li>Step 1: Calculate the total Critical Load with safety factor : {calc.criticalloadW} × {SAFETY_FACTOR} = {calc.criticalloadWithSafety}</li>
              <li>Step 2: Calculate the required battery capacity in AH : ({calc.criticalloadWithSafety} × {BACKUP_HOURS}) ÷ ({calc.sysV} × {BATTERY_EFF} × {INVERTER_EFF}) = {calc.criticalloadrequiredBatteryAH.toFixed(2)}</li>
            </ul>
          </p>
          <p><span><FontAwesomeIcon icon="battery-full" /></span>Battery Sizing for Total Load: </p>
          <p>
            <ul>
              <li>Step 1: Calculate the total Load with safety factor : {calc.totalloadW} × {SAFETY_FACTOR} = {calc.totalloadWithSafety}</li>
              <li>Step 2: Calculate the required battery capacity in AH : ({calc.totalloadWithSafety} × {BACKUP_HOURS } × {DIVERSITY_FACTOR}) ÷ ({calc.sysV} × {BATTERY_EFF} × {INVERTER_EFF}) = {calc.totalloadrequiredBatteryAH.toFixed(2)}</li>
            </ul>
          </p>
          <p>Total Load calculations represent estimated simultaneous operational demand using diversity factor and are intended for whole-centre sizing analysis.</p>
        </div>
        <div>
          
        </div>
      </section>

      {/* Comparison Results */}
      <section>
        <div>
          <h2><span><FontAwesomeIcon icon = "trend-up"/></span>ANALYSIS</h2>
        </div>
        {/* Solar Sufficiency Analysis */}
        <div>
          <h3><span><FontAwesomeIcon icon = "solar-panel" /></span>SOLAR SUFFICIENCY ANALYSIS</h3>
        </div>
        <div>
          <p><span><FontAwesomeIcon icon ="angle-right" /></span> Avg Ideal Monthly Solar Generation : {avgidealSolargeneration.toFixed(2)}</p>
          <p><span><FontAwesomeIcon icon ="angle-right" /></span> Avg Actual Monthly Solar Generation : {avgactualSolargeneration.toFixed(2)}</p>
          <p><span><FontAwesomeIcon icon = "angle-right" /></span> Avg Monthly Grid Consumption : {avggridConsumption.toFixed(2)}</p>
          <p><span><FontAwesomeIcon icon ="angle-right" /></span> Estimated Monthly Total Load : {calc.totalLoadMonthlyKwh.toFixed(2)}</p>
          <p><span><FontAwesomeIcon icon ="angle-right" /></span> Estimated Monthly PV Load : {calc.pvLoadMonthlyKwh.toFixed(2)}</p>
          <p><span><FontAwesomeIcon icon ="angle-right" /></span> Estimated Monthly Critical Load : {calc.criticalLoadMonthlyKwh.toFixed(2)}</p>
          <p><span><FontAwesomeIcon icon = "angle-right" /></span>
          Solar Generation Vs Grid Consumption:
          Ideal Solar Generation Vs Grid Consumption: <strong> {comparisonResult.solarGenerationVsGridConsumption.ideal.toUpperCase()}</strong>
          Actual Solar Generation Vs Grid Consumption: <strong>{comparisonResult.solarGenerationVsGridConsumption.actual.toUpperCase()}</strong>
          </p>
          <p><span><FontAwesomeIcon icon = "angle-right" /></span>
          Solar Generation Vs PV Connected Load:
          Ideal Solar Generation Vs PV Connected Load: <strong> {comparisonResult.solarGenerationVsPvLoad.ideal.toUpperCase()}</strong>
          Actual Solar Generation Vs PV Connected Load: <strong>{comparisonResult.solarGenerationVsPvLoad.actual.toUpperCase()}</strong> 
          </p>
          <p><span><FontAwesomeIcon icon = "angle-right" /></span>
          Solar Generation Vs Critical Load:
          Ideal Solar Generation Vs Critical Load: <strong> {comparisonResult.solarGenerationVsCriticalLoad.ideal.toUpperCase()}</strong>
          Actual Solar Generation Vs Critical Load: <strong>{comparisonResult.solarGenerationVsCriticalLoad.actual.toUpperCase()}</strong> 
          </p>
          <p><span><FontAwesomeIcon icon = "angle-right" /></span>
          Solar Generation Vs Total Load:
          Ideal Solar Generation Vs Total Load: <strong> {comparisonResult.solarGenerationVsTotalLoad.ideal.toUpperCase()}</strong>
          Actual Solar Generation Vs Total Load: <strong>{comparisonResult.solarGenerationVsTotalLoad.actual.toUpperCase()}</strong>
          </p>
        </div>
        {/*Battery Sufficiency Analysis */}
        <div>
          <h3><span><FontAwesomeIcon icon = "battery-full" /></span>BATTERY SUFFICIENCY ANALYSIS</h3>
        </div>
        <div>
          <p><span><FontAwesomeIcon icon ="angle-right" /></span> Existing Battery Capacity : {totalBatteryAH.toFixed(2)}AH</p>
          <p><span><FontAwesomeIcon icon ="angle-right" /></span> Required Battery Capacity for PV Load : {calc.pvloadrequiredBatteryAH.toFixed(2)}AH</p>
          <p><span><FontAwesomeIcon icon ="angle-right" /></span> Required Battery Capacity for Critical Load : {calc.criticalloadrequiredBatteryAH.toFixed(2)}AH</p>
          <p><span><FontAwesomeIcon icon ="angle-right" /></span> Required Battery Capacity for Total Load : {calc.totalloadrequiredBatteryAH.toFixed(2)}AH</p>
          <p><span><FontAwesomeIcon icon = "angle-right" /></span> Battery Sufficiency for PV Load: <strong>{comparisonResult.battery.pvLoad.toUpperCase()}</strong></p>
          <p><span><FontAwesomeIcon icon = "angle-right" /></span> Battery Sufficiency for Critical Load: <strong>{comparisonResult.battery.criticalLoad.toUpperCase()}</strong></p>
          <p><span><FontAwesomeIcon icon = "angle-right" /></span> Battery Sufficiency for Total Load: <strong>{comparisonResult.battery.totalLoad.toUpperCase()}</strong></p>
        </div>
        {/*Inverter Sufficiency Analysis */}
        <div>
          <h3><span><FontAwesomeIcon icon = "bolt" /></span>INVERTER SUFFICIENCY ANALYSIS</h3>
        </div>
        <div>
          <p><span><FontAwesomeIcon icon ="angle-right" /></span> Existing Inverter Capacity : {existingInverterKVA.toFixed(2)}KVA</p>
          <p><span><FontAwesomeIcon icon ="angle-right" /></span> Required Inverter Capacity for PV Load : {(calc.pvloadrequiredInverterVA/1000).toFixed(2)}KVA</p>
          <p><span><FontAwesomeIcon icon ="angle-right" /></span> Required Inverter Capacity for Critical Load : {(calc.criticalloadrequiredInverterVA/1000).toFixed(2)}KVA</p>
          <p><span><FontAwesomeIcon icon ="angle-right" /></span> Required Inverter Capacity for Total Load : {(calc.totalloadrequiredInverterVA/1000).toFixed(2)}KVA</p>
          <p><span><FontAwesomeIcon icon = "angle-right" /></span> Inverter Sufficiency for PV Load: <strong>{comparisonResult.inverter.pvLoad.toUpperCase()}</strong></p>
          <p><span><FontAwesomeIcon icon = "angle-right" /></span> Inverter Sufficiency for Critical Load: <strong>{comparisonResult.inverter.criticalLoad.toUpperCase()}</strong></p>
          <p><span><FontAwesomeIcon icon = "angle-right" /></span> Inverter Sufficiency for Total Load: <strong>{comparisonResult.inverter.totalLoad.toUpperCase()}</strong></p>
        </div>
      </section>

      {/* Charts Section */}
      <section>
        <div>
          <h2><span><FontAwesomeIcon icon="chart-line" /></span>VISUAL INSIGHTS</h2>
        </div>
         <div>
          <h3><span><FontAwesomeIcon icon="solar-panel" /></span>ACTUAL SOLAR GENERATION VS IDEAL SOLAR GENERATION</h3>
          <LineChart
            width={800}
            height={400}  
            data={solarLineData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          > 
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis label={{ value: 'Energy (KWH)', angle: -90, position: 'insideLeft' }} />
            <Tooltip /> 
            <Legend />
            <Line type="monotone" dataKey="idealgeneration" name="Ideal Solar Generation" stroke="#8884d8" />
            <Line type="monotone" dataKey="actualgeneration" name="Actual Solar Generation" stroke="#82ca9d" />
          </LineChart>
        </div>
        <div>
          <h3><span><FontAwesomeIcon icon="arrow-trend-down" /></span>SOLAR GENERATION EFFICIENCY REDUCTION (%)</h3>
          <LineChart
            width={800}
            height={400}
            data={efficiencyLineData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis label={{ value: 'Efficiency Reduction (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="reductionPercent" name="Efficiency Reduction (%)" stroke="#ff7300" />
          </LineChart>
        </div>
        <div>
          <h3><FontAwesomeIcon icon="chart-line" /><span>SOLAR GENERATION, GRID CONSUMPTION AND PV LOAD COMPARISON</span></h3>
          <LineChart
            width={800}
            height={400}
            data={comparisonLineData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis label={{ value: 'Energy (KWH)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="idealgeneration" name="Ideal Solar Generation" stroke="#3366CC" />
            <Line type="monotone" dataKey="actualgeneration" name="Actual Solar Generation" stroke="#DC3912" />
            <Line type="monotone" dataKey="gridconsumption" name="Grid Consumption" stroke="#FF9900" />
            <Line type="monotone" dataKey="pvLoadMonthlyKwh" name="PV Load (Monthly KWH)" stroke="#109618" />
          </LineChart>
        </div>
        <div>
          <h3><FontAwesomeIcon icon="chart-line" /><span>SOLAR GENERATION, TOTAL AND CRITICAL LOAD COMPARISON</span></h3>
          <LineChart
            width={800}
            height={400}
            data={loadComparisonLineData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis label={{ value: 'Energy (KWH)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="idealgeneration" name="Ideal Solar Generation" stroke="#3366CC" />
            <Line type="monotone" dataKey="actualgeneration" name="Actual Solar Generation" stroke="#DC3912" />
            <Line type="monotone" dataKey="criticalLoadMonthlyKwh" name="Critical Load (Monthly KWH)" stroke="#FF9900" />
            <Line type="monotone" dataKey="totalLoadMonthlyKwh" name="Total Load (Monthly KWH)" stroke="#109618" />
          </LineChart>
        </div>
        <div>
          <h3><FontAwesomeIcon icon="chart-line" /><span>BATTERY AND INVERTER SUFFICIENCY ANALYSIS</span></h3>
          <BarChart
            width={800}
            height={400}
            data={BatterysystemCompData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Capacity (AH)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="existing" name="Existing Battery Capacity (AH)" fill="#8884d8" />
            <Bar dataKey="pvrequired" name="PV Load Required Battery Capacity (AH)" fill="#82ca9d" />
            <Bar dataKey="criticalLoadRequired" name="Critical Load Required Battery Capacity (AH)" fill="#ff7300" />
            <Bar dataKey="totalLoadRequired" name="Total Load Required Battery Capacity (AH)" fill="#109618" />
          </BarChart>
          <BarChart
            width={800}
            height={400}
            data={InvertersystemCompData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Rating (KVA)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="existing" name="Existing Inverter Rating (KVA)" fill="#8884d8" />
            <Bar dataKey="pvrequired" name="PV Load Required Inverter Rating (KVA)" fill="#82ca9d" />
            <Bar dataKey="criticalLoadRequired" name="Critical Load Required Inverter Rating (KVA)" fill="#ff7300" />
            <Bar dataKey="totalLoadRequired" name="Total Load Required Inverter Rating (KVA)" fill="#109618" />
          </BarChart>
        </div>
        <div>
          <h3><FontAwesomeIcon icon="chart-line" /><span>LOAD TYPE COMPARISON</span></h3>
          <BarChart
            width={800}
            height={400}
            data={loadBreakdownData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Load Rating (W)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="pvLoad" name="PV Connected Load (W)" fill="#8884d8" />
            <Bar dataKey="gridLoad" name="Total Load (W)" fill="#ff7300" />
          </BarChart>
        </div>
        <div>
          <h3>
            <FontAwesomeIcon icon="chart-line" />
            <span> LOAD TYPE COMPARISON</span>
          </h3>

          <PieChart width={450} height={450}>
            <Pie
              data={loadPieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={150}
              label={({ name, value }) => `${name}: ${value}W`}
            >
              {loadPieData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={[
                    "#0088FE",
                    "#00C49F",
                    "#FFBB28",
                    "#FF8042",
                    "#AF19FF",
                    "#FF4560",
                    "#00E396",
                  ][index % 7]}
                />
              ))}
            </Pie>

            <Tooltip />
            <Legend />
          </PieChart>
        </div>
        <div>
          <h3>
            <FontAwesomeIcon icon="chart-line" />
            <span> LOAD CRITICALITY COMPARISON</span>
          </h3>

          <PieChart width={450} height={450}>
            <Pie
              data={criticalityPieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={150}
              label={({ name, value }) => `${name}: ${value}W`}
            >
              {criticalityPieData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.name === "Critical Load"
                      ? "#ff7300"
                      : "#82ca9d"
                  }
                />
              ))}
            </Pie>

            <Tooltip />
            <Legend />
          </PieChart>
        </div>

        {/*6. Remarks*/}
      <section>
        <h3>Remarks</h3>
        <p>{centre.remarks || "—"}</p>
      </section>

      {/*7. Uploaded File */}
      <section>
        <h3>Uploaded & Reference File </h3>
        {centre.imagefile ? (
          <a href={centre.imagefile} target="_blank" rel="noopener noreferrer">
            View File
          </a>
        ) : (
          <p>No file uploaded.</p>
        )}
      </section>


      </section>



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
        `http://localhost:8000/api/v2/centres/${encodeURIComponent(
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
    <>
    <div>
      <h1>Dashboard</h1>
      <h4>View Solar Audit Insights: Powering Health Facilities Across Chhattisgarh</h4>
    </div>
    <div>
       <section>
        <h2>Select Centre</h2>

        <div>
          <label>Select District</label>
          <br />
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
          >
            <option value=""> Select District </option>
            {districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <br />

        <div>
          <label>Select Centre</label>
          <br />
          <select
            value={selectedCentre}
            onChange={(e) => setSelectedCentre(e.target.value)}
            disabled={!selectedDistrict}
          >
            <option value=""> {selectedDistrict
                ? "Select a centre"
                : " Select a district first "} </option>
            {availableCentres.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </section>

      {/* States */}
      {loading && <p>Loading...</p>}
      {error   && <p>{error}</p>}
      {!loading && !error && selectedCentre === "" && (
        <p>Select a centre from dropdown</p>
      )}
      {!loading && !error && selectedCentre !== "" && displayedCentres.length === 0 && (
        <p>No data available for selected centre</p>
      )}

      {/* Centre Cards */}
      {!loading && !error && displayedCentres.map((centre) => (
        <Dashboardcomponent key={centre._id} centre={centre} />
      ))}
    </div>
    </>
  )
}

export default Dashboard
