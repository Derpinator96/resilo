// src/pages/DashboardPDF.jsx
// Pure @react-pdf/renderer — NO html2canvas, NO screenshots.
// All charts are drawn with native SVG primitives inside @react-pdf/renderer's <Svg> component.

import React from 'react';
import {
  Document, Page, Text, View, Image, Svg, Path, Rect, Line, Circle, Polygon,
  StyleSheet, PDFDownloadLink, Font,
} from '@react-pdf/renderer';

// ─── Font Registration ────────────────────────────────────────────────────────
Font.register({
  family: 'Times-Roman',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/times-new-roman@1.0.4/Times New Roman.ttf',        fontWeight: 'normal' },
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/times-new-roman@1.0.4/Times New Roman Bold.ttf',   fontWeight: 'bold'   },
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/times-new-roman@1.0.4/Times New Roman Italic.ttf', fontStyle:  'italic' },
  ],
});
const TNR = 'Times-Roman';

// ─── Colour Palette ───────────────────────────────────────────────────────────
const C = {
  dark:    '#1f2020', slate:   '#414e5e', mid:     '#3c3c3c',
  light:   '#f8f7f1', lighter: '#f7f6fa', white:   '#ffffff',
  green:   '#00963c', red:     '#cc3600', border:  '#e5e7eb',
  grey:    '#6b7280', divider: '#d1d5db',
};

// ─── Chart stroke colours (exact match to Dashboard.jsx) ─────────────────────
const CH = {
  purple:  '#8884d8', green2:  '#82ca9d', orange:  '#ff7300',
  blue:    '#3366CC', red2:    '#DC3912', yellow:  '#FF9900',
  dkgreen: '#109618', pie: ["#0088FE","#00C49F","#FFBB28","#FF8042","#AF19FF","#FF4560","#00E396"],
};

// ─── Calculation Constants ────────────────────────────────────────────────────
const SAFETY_FACTOR     = 1.25;
const POWER_FACTOR      = 0.8;
const BATTERY_EFF       = 0.8;
const INVERTER_EFF      = 0.8;
const BACKUP_HOURS      = 10;
const HOURS_PER_DAY     = 16;
const DAYS_PER_MONTH    = 30;
const PERFORMANCE_RATIO = 0.75;
const DERATING_FACTOR   = 0.88;
const SOILING_FACTOR    = 0.92;
const MISMATCH_FACTOR   = 0.97;
const DIVERSITY_FACTOR  = 0.7;
const EFFECTIVE_EFFICIENCY = 56.25;

const LOAD_BACKUP_MODEL = {
  "ceiling fan":12,"tube light":8,"led light":8,
  "iceline refrigerator":24,"deep freezer":24,"refrigerator":24,
  "glassdoor refrigerator":24,"laboratory refrigerator":24,
  "servo controlled baby warmer":6,"shadowless lamp":4,
  "cooler":10,"pc":8,"ac":8,"printer":1,
};
function getBackupHours(load) {
  return LOAD_BACKUP_MODEL[load.typeOfLoad?.toLowerCase().trim()] || 4;
}

function formulasused() {
  return {
    InverterSizing: "Inverter Rating (VA) = (Total Connected Loads (W) × Safety Factor) / Power Factor",
    BatterySizing: "Battery Capacity (AH) = (Total Loads (W) × Backup Hours × Safety Factor) / (Bat. Voltage × Bat. Eff. × Inv. Eff.)",
    IdealSolarGeneration: "Ideal Solar Gen (kWh) = Solar Irradiance (kWh/m²) × Total Installed (kWp) × Effective Efficiency",
    EffectiveEfficiency: "Eff. Efficiency = Perf. Ratio(0.75) × Derating(0.88) × Soiling(0.92) × Mismatch(0.97) × Degradation(≈0.965 for 5 yrs)",
    EfficiencyReduction: "Efficiency Reduction (%) = ((Ideal Gen - Actual Gen) / Ideal Gen) × 100",
  };
}

function calcSystem(centre, loads, batteryVoltage, batteryCount) {
  const gridconsumption = centre.gridconsumption || [];
  const pvLoads = loads.filter(l => Number(l.pvConnectedquantity) > 0);
  const criticalLoads = loads.filter(l => l.criticalLoad);
  const pvloadTotalW = pvLoads.reduce((s,l) => s + Number(l.pvConnectedquantity)*Number(l.ratingOfLoad), 0);
  const criticalloadW = criticalLoads.reduce((s,l) => s + Number(l.numberOfLoad)*Number(l.ratingOfLoad), 0);
  const totalloadW = loads.filter(l => l.typeOfLoad?.toLowerCase() !== "ac")
    .reduce((s,l) => s + Number(l.numberOfLoad)*Number(l.ratingOfLoad), 0);
  const pvloadWithSafety = pvloadTotalW * SAFETY_FACTOR;
  const pvloadrequiredInverterVA = pvloadWithSafety / POWER_FACTOR;
  const criticalloadWithSafety = criticalloadW * SAFETY_FACTOR;
  const criticalloadrequiredInverterVA = criticalloadWithSafety / POWER_FACTOR;
  const totalloadWithSafety = totalloadW * SAFETY_FACTOR;
  const totalloadrequiredInverterVA = totalloadWithSafety * DIVERSITY_FACTOR / POWER_FACTOR;
  const sysV = batteryVoltage * batteryCount || 48;
  const pvloadrequiredBatteryAH = (pvloadWithSafety * BACKUP_HOURS) / (sysV * BATTERY_EFF * INVERTER_EFF);
  const criticalloadrequiredBatteryAH = criticalLoads.reduce((sum,load) => {
    const loadW = Number(load.numberOfLoad)*Number(load.ratingOfLoad);
    return sum + (loadW * SAFETY_FACTOR * getBackupHours(load)) / (sysV * BATTERY_EFF * INVERTER_EFF);
  }, 0);
  const totalloadrequiredBatteryAH = loads.reduce((sum,load) => {
    const loadW = Number(load.numberOfLoad)*Number(load.ratingOfLoad);
    return sum + (loadW * SAFETY_FACTOR * getBackupHours(load) * DIVERSITY_FACTOR) / (sysV * BATTERY_EFF * INVERTER_EFF);
  }, 0);
  const criticalLoadMonthlyKwh = loads.reduce((sum,load) => {
    if (!load.criticalLoad) return sum;
    const name = load.typeOfLoad?.toLowerCase();
    let h = 0;
    if (name.includes("freezer")||name.includes("refrigerator")) h = 24*30;
    else if (name.includes("servo controlled baby")) h = 6*(centre?.additionalInfo?.noofdeliveryperMonth||0);
    else if (name.includes("shadowless lamp")) h = 2*(centre?.additionalInfo?.noofdeliveryperMonth||0);
    else h = HOURS_PER_DAY*DAYS_PER_MONTH;
    return sum + (Number(load.ratingOfLoad)*Number(load.numberOfLoad)*h)/1000;
  }, 0);
  const avggrid = gridconsumption.length
    ? gridconsumption.reduce((s,d)=>s+d.consumption,0)/gridconsumption.length : 0;
  const maxMonthly = (totalloadW/1000)*24*DAYS_PER_MONTH;
  const UF = maxMonthly ? avggrid/maxMonthly : 0;
  const totalLoadMonthlyKwh = (totalloadW*HOURS_PER_DAY*DAYS_PER_MONTH*UF)/1000;
  const pvLoadMonthlyKwh = (pvloadTotalW*HOURS_PER_DAY*DAYS_PER_MONTH)/1000;
  return {
    pvloads:pvLoads, pvloadTotalW, criticalloadW, totalloadW,
    pvloadWithSafety, criticalloadWithSafety, totalloadWithSafety,
    pvloadrequiredInverterVA, criticalloadrequiredInverterVA, totalloadrequiredInverterVA,
    pvloadrequiredBatteryAH, criticalloadrequiredBatteryAH, totalloadrequiredBatteryAH,
    pvLoadMonthlyKwh, criticalLoadMonthlyKwh, totalLoadMonthlyKwh, sysV,
  };
}

function solarEfficiencyReduction(centre) {
  const ideals = centre.solargeneration || [];
  const actuals = centre.actualsolargeneration || [];
  const validVals = actuals.map(a=>a.generation).filter(v=>v>0);
  const avg = validVals.length ? validVals.reduce((s,v)=>s+v,0)/validVals.length : 0;
  return ideals.map((ideal,i) => {
    const raw = actuals[i] ? actuals[i].generation : 0;
    const actual = (raw===0 && validVals.length>0) ? avg : raw;
    const reduction = ideal.generation>0 ? ((ideal.generation-actual)/ideal.generation)*100 : 0;
    return { month:ideal.month, idealGeneration:ideal.generation, actualGeneration:actual, actualGenerationRaw:raw, reductionPercent:reduction };
  });
}

function doComparison(centre) {
  const loads = centre.loadsConnected||[];
  const ideals = centre.solargeneration||[];
  const actuals = centre.actualsolargeneration||[];
  const grid = centre.gridconsumption||[];
  const bv = centre.battery ? Number(centre.battery.voltage) : 48;
  const bc = centre.battery ? Number(centre.battery.count) : 0;
  const totalBatteryAH = centre.battery ? Number(centre.battery.capacityAh) : 0;
  const existingInverterKVA = centre.inverter ? Number(centre.inverter.inverterRatingKVA) : null;
  const calc = calcSystem(centre, loads, bv, bc);
  const avgIdeal  = ideals.length  ? ideals.reduce((s,d)=>s+d.generation,0)/ideals.length  : 0;
  const avgActual = actuals.length ? actuals.reduce((s,d)=>s+d.generation,0)/actuals.length : 0;
  const avgGrid   = grid.length    ? grid.reduce((s,d)=>s+d.consumption,0)/grid.length    : 0;
  const suf = (a,b) => a>=b ? "sufficient" : "insufficient";
  return {
    calc, existingInverterKVA, totalBatteryAH, avgIdeal, avgActual, avgGrid,
    cr: {
      inverter: { pvLoad:suf(existingInverterKVA??0,calc.pvloadrequiredInverterVA/1000), criticalLoad:suf(existingInverterKVA??0,calc.criticalloadrequiredInverterVA/1000), totalLoad:suf(existingInverterKVA??0,calc.totalloadrequiredInverterVA/1000) },
      battery:  { pvLoad:suf(totalBatteryAH,calc.pvloadrequiredBatteryAH), criticalLoad:suf(totalBatteryAH,calc.criticalloadrequiredBatteryAH), totalLoad:suf(totalBatteryAH,calc.totalloadrequiredBatteryAH) },
      solarVsGrid:     { ideal:suf(avgIdeal,avgGrid),         actual:suf(avgActual,avgGrid) },
      solarVsPvLoad:   { ideal:suf(avgIdeal,calc.pvLoadMonthlyKwh),  actual:suf(avgActual,calc.pvLoadMonthlyKwh) },
      solarVsCritical: { ideal:suf(avgIdeal,calc.criticalLoadMonthlyKwh), actual:suf(avgActual,calc.criticalLoadMonthlyKwh) },
      solarVsTotal:    { ideal:suf(avgIdeal,calc.totalLoadMonthlyKwh), actual:suf(avgActual,calc.totalLoadMonthlyKwh) },
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  SVG CHART HELPERS
//  All charts are drawn with @react-pdf/renderer's <Svg> primitives.
//  W = total SVG width, H = total SVG height
//  pl/pr/pt/pb = left/right/top/bottom padding (axis space)
// ─────────────────────────────────────────────────────────────────────────────

const CHART_W = 480, CHART_H = 160;
const PL=44, PR=10, PT=10, PB=30;  // plot area padding
const plotW = CHART_W - PL - PR;
const plotH = CHART_H - PT - PB;

function niceMax(val) {
  if (!val || val===0) return 10;
  const mag = Math.pow(10, Math.floor(Math.log10(val)));
  return Math.ceil(val/mag)*mag;
}

// Grid lines + axis labels
function ChartGrid({ maxY, yLabel, xLabels }) {
  const steps = 4;
  return (
    <>
      {/* Y axis label */}
      {/* Grid lines + Y tick labels */}
      {Array.from({length:steps+1}, (_,i) => {
        const y = PT + plotH - (i/steps)*plotH;
        const val = ((i/steps)*maxY).toFixed(0);
        return (
          <React.Fragment key={i}>
            <Line x1={PL} y1={y} x2={PL+plotW} y2={y} strokeWidth={0.3} stroke="#cccccc" strokeDasharray="3,3" />
            <Text x={PL-3} y={y+3} fontSize={6} fill="#888" textAnchor="end">{val}</Text>
          </React.Fragment>
        );
      })}
      {/* X tick labels */}
      {xLabels.map((lbl,i) => {
        const x = PL + (i/(xLabels.length-1||1))*plotW;
        return <Text key={i} x={x} y={CHART_H-PB+10} fontSize={5.5} fill="#888" textAnchor="middle">{lbl}</Text>;
      })}
      {/* Axes */}
      <Line x1={PL} y1={PT} x2={PL} y2={PT+plotH} stroke="#555" strokeWidth={0.5} />
      <Line x1={PL} y1={PT+plotH} x2={PL+plotW} y2={PT+plotH} stroke="#555" strokeWidth={0.5} />
      {/* Y-axis label rotated via transform */}
      <Text x={10} y={PT+plotH/2} fontSize={6} fill="#555" textAnchor="middle"
        transform={`rotate(-90 10 ${PT+plotH/2})`}>{yLabel}</Text>
    </>
  );
}

// Build a polyline "d" string from data
function toPolyline(values, maxY) {
  return values.map((v,i) => {
    const x = PL + (i/(values.length-1||1))*plotW;
    const y = PT + plotH - Math.min(v/maxY,1)*plotH;
    return `${i===0?'M':'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

// Format month string → short label e.g. "2025-04-01" → "Apr-25"
function shortMonth(m) {
  if (!m) return '';
  try {
    const d = new Date(m);
    return d.toLocaleDateString('en-IN', {month:'short', year:'2-digit'});
  } catch { return String(m).slice(0,7); }
}

// ── LINE CHART ────────────────────────────────────────────────────────────────
function PdfLineChart({ title, series, yLabel }) {
  // series: [{ label, color, values:[number] }]
  const xLabels = series[0]?.xLabels || [];
  const allVals = series.flatMap(s=>s.values);
  const maxY = niceMax(Math.max(...allVals, 1));
  return (
    <View style={{marginBottom:10}}>
      <Text style={[st.chartTitle]}>{title}</Text>
      <Svg width={CHART_W} height={CHART_H}>
        <ChartGrid maxY={maxY} yLabel={yLabel} xLabels={xLabels} />
        {series.map((s,si) => (
          <Path key={si} d={toPolyline(s.values, maxY)} stroke={s.color} strokeWidth={1.5} fill="none" />
        ))}
      </Svg>
      {/* Legend */}
      <View style={st.legendRow}>
        {series.map((s,si) => (
          <View key={si} style={st.legendItem}>
            <Svg width={14} height={8}><Line x1={0} y1={4} x2={14} y2={4} stroke={s.color} strokeWidth={2}/></Svg>
            <Text style={st.legendText}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── BAR CHART ─────────────────────────────────────────────────────────────────
function PdfBarChart({ title, categories, series, yLabel }) {
  // categories: string[], series:[{label,color,values}]
  const allVals = series.flatMap(s=>s.values);
  const maxY = niceMax(Math.max(...allVals, 1));
  const n = categories.length;
  const ns = series.length;
  const groupW = plotW / n;
  const barW = Math.max(2, (groupW * 0.7) / ns);
  const steps = 4;
  return (
    <View style={{marginBottom:10}}>
      <Text style={st.chartTitle}>{title}</Text>
      <Svg width={CHART_W} height={CHART_H}>
        {/* Grid */}
        {Array.from({length:steps+1},(_,i) => {
          const y = PT + plotH - (i/steps)*plotH;
          const val = ((i/steps)*maxY).toFixed(0);
          return (
            <React.Fragment key={i}>
              <Line x1={PL} y1={y} x2={PL+plotW} y2={y} strokeWidth={0.3} stroke="#cccccc" strokeDasharray="3,3"/>
              <Text x={PL-3} y={y+3} fontSize={6} fill="#888" textAnchor="end">{val}</Text>
            </React.Fragment>
          );
        })}
        {/* Axes */}
        <Line x1={PL} y1={PT} x2={PL} y2={PT+plotH} stroke="#555" strokeWidth={0.5}/>
        <Line x1={PL} y1={PT+plotH} x2={PL+plotW} y2={PT+plotH} stroke="#555" strokeWidth={0.5}/>
        <Text x={10} y={PT+plotH/2} fontSize={6} fill="#555" textAnchor="middle"
          transform={`rotate(-90 10 ${PT+plotH/2})`}>{yLabel}</Text>
        {/* Bars */}
        {categories.map((cat,ci) => {
          const groupX = PL + ci*groupW + groupW*0.15;
          return series.map((s,si) => {
            const val = s.values[ci] || 0;
            const bh = Math.max(0, (val/maxY)*plotH);
            const bx = groupX + si*barW;
            const by = PT + plotH - bh;
            return <Rect key={`${ci}-${si}`} x={bx} y={by} width={barW-1} height={bh} fill={s.color}/>;
          });
        })}
        {/* X labels */}
        {categories.map((cat,ci) => {
          const x = PL + ci*groupW + groupW/2;
          const label = cat.length>10 ? cat.slice(0,9)+'…' : cat;
          return <Text key={ci} x={x} y={CHART_H-PB+10} fontSize={5} fill="#888" textAnchor="middle">{label}</Text>;
        })}
      </Svg>
      <View style={st.legendRow}>
        {series.map((s,si) => (
          <View key={si} style={st.legendItem}>
            <Svg width={10} height={8}><Rect x={0} y={1} width={10} height={6} fill={s.color}/></Svg>
            <Text style={st.legendText}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── PIE CHART ─────────────────────────────────────────────────────────────────
function PdfPieChart({ title, data }) {
  // data: [{name, value, color}]
  const total = data.reduce((s,d)=>s+d.value, 0);
  if (!total) return (
    <View style={{marginBottom:10}}>
      <Text style={st.chartTitle}>{title}</Text>
      <Text style={st.calcLine}>No data available.</Text>
    </View>
  );
  const cx=120, cy=75, r=60;
  let startAngle = -Math.PI/2;
  const slices = data.map(d => {
    const sweep = (d.value/total)*2*Math.PI;
    const endAngle = startAngle + sweep;
    const x1 = cx + r*Math.cos(startAngle);
    const y1 = cy + r*Math.sin(startAngle);
    const x2 = cx + r*Math.cos(endAngle);
    const y2 = cy + r*Math.sin(endAngle);
    const large = sweep > Math.PI ? 1 : 0;
    const midAngle = startAngle + sweep/2;
    const lx = cx + (r+14)*Math.cos(midAngle);
    const ly = cy + (r+14)*Math.sin(midAngle);
    const path = `M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`;
    const pct = ((d.value/total)*100).toFixed(1);
    const slice = { path, color:d.color, lx, ly, pct, name:d.name, value:d.value };
    startAngle = endAngle;
    return slice;
  });
  return (
    <View style={{marginBottom:10}}>
      <Text style={st.chartTitle}>{title}</Text>
      <View style={{flexDirection:'row', alignItems:'flex-start'}}>
        <Svg width={250} height={160}>
          {slices.map((sl,i) => <Path key={i} d={sl.path} fill={sl.color} stroke="#fff" strokeWidth={0.5}/>)}
          {slices.filter(sl=>Number(sl.pct)>3).map((sl,i) => (
            <Text key={i} x={sl.lx} y={sl.ly} fontSize={5.5} fill="#333" textAnchor="middle">{sl.pct}%</Text>
          ))}
        </Svg>
        {/* Legend beside pie */}
        <View style={{flex:1, paddingTop:8}}>
          {data.map((d,i) => (
            <View key={i} style={st.legendItem}>
              <Svg width={10} height={8}><Rect x={0} y={1} width={10} height={6} fill={d.color}/></Svg>
              <Text style={[st.legendText,{fontSize:6.5,flexWrap:'wrap',flex:1}]}>{d.name}: {d.value}W ({((d.value/total)*100).toFixed(1)}%)</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  page: { backgroundColor:C.white, fontFamily:TNR, paddingTop:24, paddingBottom:40, paddingHorizontal:30, fontSize:10, color:C.dark },
  // Cover header
  coverHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:6, paddingVertical:8, marginBottom:12, borderBottomWidth:2, borderBottomColor:C.slate },
  logo: { width:68, height:68, objectFit:'contain' },
  headerCenter: { flex:1, alignItems:'center', paddingHorizontal:8 },
  instituteName: { fontFamily:TNR, fontWeight:'bold', fontSize:13, color:C.slate, textAlign:'center', letterSpacing:0.5 },
  instituteImp: { fontFamily:TNR, fontSize:8.5, color:C.mid, textAlign:'center', marginTop:2, fontStyle:'italic' },
  reportTitle: { fontFamily:TNR, fontWeight:'bold', fontSize:11.5, color:C.dark, textAlign:'center', marginTop:4 },
  reportSubtitle: { fontFamily:TNR, fontSize:8.5, color:C.mid, textAlign:'center', marginTop:2 },
  unicefLine: { fontFamily:TNR, fontWeight:'bold', fontSize:8.5, color:C.slate, textAlign:'center', marginTop:3, letterSpacing:0.3 },
  // Centre banner
  centreBanner: { backgroundColor:C.slate, paddingHorizontal:10, paddingVertical:7, marginBottom:10, borderRadius:3 },
  centreName: { fontFamily:TNR, fontWeight:'bold', fontSize:13, color:C.white, textAlign:'center', letterSpacing:1 },
  // Section
  sectionTitle: { fontFamily:TNR, fontWeight:'bold', fontSize:10.5, color:C.slate, borderBottomWidth:1.5, borderBottomColor:C.slate, paddingBottom:3, marginTop:12, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 },
  subTitle: { fontFamily:TNR, fontWeight:'bold', fontSize:9, color:C.dark, borderLeftWidth:3, borderLeftColor:C.slate, paddingLeft:5, marginTop:8, marginBottom:4, textTransform:'uppercase' },
  // Info row
  infoRow: { flexDirection:'row', marginBottom:2 },
  infoLabel: { fontFamily:TNR, fontWeight:'bold', fontSize:9, color:C.dark, width:'34%' },
  infoColon: { fontSize:9, width:'3%', color:C.dark },
  infoValue: { fontFamily:TNR, fontSize:9, color:C.mid, width:'63%' },
  // Stat card
  statGrid: { flexDirection:'row', flexWrap:'wrap', gap:5, marginBottom:6 },
  statCard: { backgroundColor:C.light, borderRadius:3, paddingHorizontal:7, paddingVertical:5, alignItems:'center', justifyContent:'center', width:'30%' },
  statLabel: { fontFamily:TNR, fontSize:6.5, color:C.slate, fontWeight:'bold', textTransform:'uppercase', textAlign:'center', marginBottom:2 },
  statVal: { fontFamily:TNR, fontWeight:'bold', fontSize:13, color:C.dark, textAlign:'center' },
  statUnit: { fontFamily:TNR, fontSize:6.5, color:C.mid },
  // Healthcare stats
  healthGrid: { flexDirection:'row', marginBottom:8 },
  healthCard: { flex:1, alignItems:'center', paddingVertical:6 },
  healthNum: { fontFamily:TNR, fontWeight:'bold', fontSize:19, color:C.dark },
  healthLabel: { fontFamily:TNR, fontSize:7.5, color:C.mid, textAlign:'center', marginTop:1 },
  // Image
  imageRow: { flexDirection:'row', gap:6, marginTop:5, marginBottom:5 },
  imgBox: { flex:1, borderRadius:3, overflow:'hidden', backgroundColor:C.light },
  imgSm: { width:'30%', borderRadius:3, overflow:'hidden', backgroundColor:C.light },
  siteImg: { width:'100%', height:120, objectFit:'cover' },
  imgLabel: { fontFamily:TNR, fontSize:6.5, color:C.grey, textAlign:'center', marginTop:1, fontStyle:'italic' },
  // Month cards
  monthGrid: { flexDirection:'row', flexWrap:'wrap', gap:3, marginBottom:4 },
  monthCard: { backgroundColor:C.lighter, borderRadius:3, padding:4, alignItems:'center', width:'14.5%' },
  monthLbl: { fontFamily:TNR, fontSize:6, color:C.slate, fontWeight:'bold', textAlign:'center', marginBottom:1 },
  monthVal: { fontFamily:TNR, fontWeight:'bold', fontSize:9.5, color:C.dark },
  monthUnit: { fontFamily:TNR, fontSize:5.5, color:C.mid },
  // Table
  table: { marginTop:3, marginBottom:5 },
  thead: { backgroundColor:C.slate, flexDirection:'row' },
  trow: { flexDirection:'row', borderBottomWidth:0.4, borderBottomColor:C.border },
  trowAlt: { flexDirection:'row', borderBottomWidth:0.4, borderBottomColor:C.border, backgroundColor:C.lighter },
  th: { fontFamily:TNR, fontWeight:'bold', fontSize:7.5, color:C.white, paddingHorizontal:3, paddingVertical:2.5, textTransform:'uppercase' },
  td: { fontFamily:TNR, fontSize:7.5, color:C.mid, paddingHorizontal:3, paddingVertical:2.5 },
  tdB: { fontFamily:TNR, fontWeight:'bold', fontSize:7.5, color:C.dark, paddingHorizontal:3, paddingVertical:2.5 },
  tdG: { fontFamily:TNR, fontWeight:'bold', fontSize:7.5, color:C.green, paddingHorizontal:3, paddingVertical:2.5 },
  tdR: { fontFamily:TNR, fontWeight:'bold', fontSize:7.5, color:C.red, paddingHorizontal:3, paddingVertical:2.5 },
  // Load table col widths
  lc0:{width:'5%'}, lc1:{width:'18%'}, lc2:{width:'8%'}, lc3:{width:'7%'},
  lc4:{width:'7%'}, lc5:{width:'8%'}, lc6:{width:'7%'}, lc7:{width:'20%'}, lc8:{width:'20%'},
  // Eff table
  ec0:{width:'5%'}, ec1:{width:'22%'}, ec2:{width:'24%'}, ec3:{width:'25%'}, ec4:{width:'24%'},
  // Formula
  formulaBox: { backgroundColor:C.light, borderRadius:3, padding:6, marginBottom:4, borderLeftWidth:3, borderLeftColor:C.slate },
  formulaLbl: { fontFamily:TNR, fontWeight:'bold', fontSize:7.5, color:C.slate, marginBottom:2, textTransform:'uppercase' },
  formulaTxt: { fontFamily:TNR, fontSize:8, color:C.dark, lineHeight:1.4 },
  constChip: { backgroundColor:C.white, borderRadius:2, paddingHorizontal:4, paddingVertical:1.5 },
  constTxt: { fontFamily:TNR, fontSize:7, color:C.dark },
  // Calc
  calcBox: { backgroundColor:C.light, borderRadius:3, paddingHorizontal:7, paddingVertical:5, marginBottom:4 },
  calcBold: { fontFamily:TNR, fontWeight:'bold', fontSize:8.5, color:C.dark, marginBottom:2 },
  calcLine: { fontFamily:TNR, fontSize:7.5, color:C.mid, marginBottom:1.5, lineHeight:1.4 },
  // Analysis
  anaGrid: { flexDirection:'row', flexWrap:'wrap', gap:4, marginBottom:5 },
  anaCard: { backgroundColor:C.white, borderRadius:3, paddingHorizontal:5, paddingVertical:4, flexDirection:'row', justifyContent:'space-between', alignItems:'center', width:'48%', borderWidth:0.5, borderColor:C.border },
  anaLbl: { fontFamily:TNR, fontSize:7.5, color:C.mid, flex:1 },
  anaVal: { fontFamily:TNR, fontWeight:'bold', fontSize:10, color:C.dark, marginLeft:3 },
  anaUnit: { fontFamily:TNR, fontSize:6.5, color:C.grey },
  // Sufficiency card grid
  suffGrid: { flexDirection:'row', flexWrap:'wrap', gap:4, marginTop:4, marginBottom:5 },
  suffCard: { backgroundColor:C.white, borderRadius:3, paddingHorizontal:6, paddingVertical:7, width:'48%', alignItems:'center', borderWidth:0.5, borderColor:C.border },
  suffCard3: { backgroundColor:C.white, borderRadius:3, paddingHorizontal:6, paddingVertical:7, width:'31%', alignItems:'center', borderWidth:0.5, borderColor:C.border },
  suffTitle: { fontFamily:TNR, fontSize:7, color:C.mid, fontWeight:'bold', textAlign:'center', marginBottom:4, textTransform:'uppercase' },
  suffBadgeRow: { flexDirection:'row', gap:6 },
  badgeOk:   { backgroundColor:C.green, borderRadius:2, paddingHorizontal:4, paddingVertical:2 },
  badgeFail: { backgroundColor:C.red,   borderRadius:2, paddingHorizontal:4, paddingVertical:2 },
  badgeTxt:  { fontFamily:TNR, fontWeight:'bold', fontSize:6.5, color:C.white },
  badgeLbl:  { fontFamily:TNR, fontSize:6, color:C.grey, textAlign:'center', marginBottom:1 },
  // Additional info
  addCard: { backgroundColor:C.light, borderRadius:3, paddingHorizontal:7, paddingVertical:6, width:'48%', marginBottom:4 },
  addLbl: { fontFamily:TNR, fontSize:6.5, color:C.grey, fontWeight:'bold', textTransform:'uppercase', marginBottom:2 },
  addVal: { fontFamily:TNR, fontWeight:'bold', fontSize:9.5, color:C.dark },
  // Remarks
  remarksBox: { backgroundColor:C.light, borderRadius:3, padding:7, marginTop:3 },
  remarksTxt: { fontFamily:TNR, fontSize:8.5, color:C.mid, lineHeight:1.5, fontStyle:'italic' },
  // Charts
  chartTitle: { fontFamily:TNR, fontWeight:'bold', fontSize:8, color:C.mid, textTransform:'uppercase', marginBottom:3, letterSpacing:0.3 },
  legendRow: { flexDirection:'row', flexWrap:'wrap', gap:6, marginTop:3, marginBottom:2 },
  legendItem: { flexDirection:'row', alignItems:'center', gap:3 },
  legendText: { fontFamily:TNR, fontSize:6.5, color:C.mid },
  // Footer
  footer: { position:'absolute', bottom:12, left:30, right:30, flexDirection:'row', justifyContent:'space-between', borderTopWidth:0.4, borderTopColor:C.divider, paddingTop:3 },
  footerTxt: { fontFamily:TNR, fontSize:7, color:C.grey },
});

// ─── Reusable helpers ─────────────────────────────────────────────────────────
function IRow({ label, value }) {
  return (
    <View style={st.infoRow}>
      <Text style={st.infoLabel}>{label}</Text>
      <Text style={st.infoColon}>:</Text>
      <Text style={st.infoValue}>{value ?? '—'}</Text>
    </View>
  );
}
function Badge({ result }) {
  const ok = result === 'sufficient';
  return <View style={ok ? st.badgeOk : st.badgeFail}><Text style={st.badgeTxt}>{ok ? 'SUFFICIENT' : 'INSUFFICIENT'}</Text></View>;
}
function Footer({ centre }) {
  return (
    <View style={st.footer} fixed>
      <Text style={st.footerTxt}>NIT Raipur — Solar Audit Report | UNICEF Initiative</Text>
      <Text style={st.footerTxt}>{centre.centreName?.toUpperCase()} | {centre.district?.toUpperCase()}</Text>
      <Text style={st.footerTxt} render={({pageNumber,totalPages}) => `Page ${pageNumber} of ${totalPages}`}/>
    </View>
  );
}

// ─── MAIN PDF DOCUMENT ────────────────────────────────────────────────────────
function SolarAuditPDF({ centre, nitrLogo, unicefLogo }) {
  const loads = centre.loadsConnected || [];
  const grid  = centre.gridconsumption || [];
  const ideals  = centre.solargeneration || [];
  const actuals = centre.actualsolargeneration || [];
  const effRed  = solarEfficiencyReduction(centre);
  const { calc, existingInverterKVA, totalBatteryAH, avgIdeal, avgActual, avgGrid, cr } = doComparison(centre);
  const formulas = formulasused();

  const bv = centre.battery ? Number(centre.battery.voltage) : 48;
  const bc = centre.battery ? Number(centre.battery.count) : 0;
  const dateStr = centre.dateOfInstallation
    ? new Date(centre.dateOfInstallation).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'}) : '—';

  // Load sorting (same as Dashboard.jsx)
  const lightsAndFans = loads.filter(l => !l.criticalLoad && (l.typeOfLoad.toLowerCase().includes("light") || l.typeOfLoad.toLowerCase().includes("fan")));
  const criticals = loads.filter(l => l.criticalLoad).sort((a,b) => a.typeOfLoad.localeCompare(b.typeOfLoad));
  const remaining = loads.filter(l => !l.criticalLoad && !l.typeOfLoad.toLowerCase().includes("light") && !l.typeOfLoad.toLowerCase().includes("fan"));
  const orderedLoads = [...lightsAndFans, ...criticals, ...remaining];

  // ── Chart data ──
  const xMonths = effRed.map(r => shortMonth(r.month));

  // Chart 1: Actual vs Ideal solar generation
  const chart1Series = [
    { label:'Ideal Solar Generation',  color:CH.purple, values:effRed.map(r=>r.idealGeneration),  xLabels:xMonths },
    { label:'Actual Solar Generation', color:CH.green2, values:effRed.map(r=>r.actualGeneration),  xLabels:xMonths },
  ];
  // Chart 2: Efficiency reduction
  const chart2Series = [
    { label:'Efficiency Reduction (%)', color:CH.orange, values:effRed.map(r=>r.reductionPercent), xLabels:xMonths },
  ];
  // Chart 3: Solar gen + grid + PV load
  const chart3Series = [
    { label:'Ideal Solar Generation',    color:CH.blue,    values:effRed.map(r=>r.idealGeneration), xLabels:xMonths },
    { label:'Actual Solar Generation',   color:CH.red2,    values:effRed.map(r=>r.actualGeneration), xLabels:xMonths },
    { label:'Grid Consumption',          color:CH.yellow,  values:grid.map(g=>g.consumption), xLabels:xMonths },
    { label:'PV Load (Monthly KWH)',     color:CH.dkgreen, values:effRed.map(()=>calc.pvLoadMonthlyKwh), xLabels:xMonths },
  ];
  // Chart 4: Solar gen + total + critical load
  const chart4Series = [
    { label:'Ideal Solar Generation',      color:CH.blue,    values:effRed.map(r=>r.idealGeneration), xLabels:xMonths },
    { label:'Actual Solar Generation',     color:CH.red2,    values:effRed.map(r=>r.actualGeneration), xLabels:xMonths },
    { label:'Critical Load (Monthly KWH)', color:CH.yellow,  values:effRed.map(()=>calc.criticalLoadMonthlyKwh), xLabels:xMonths },
    { label:'Total Load (Monthly KWH)',    color:CH.dkgreen, values:effRed.map(()=>calc.totalLoadMonthlyKwh), xLabels:xMonths },
  ];
  // Chart 5: Battery sufficiency bar
  const battBarCats = ['Battery (AH)'];
  const battBarSeries = [
    { label:'Existing Battery Capacity (AH)',       color:CH.purple, values:[totalBatteryAH] },
    { label:'PV Load Required (AH)',                color:CH.green2, values:[calc.pvloadrequiredBatteryAH] },
    { label:'Critical Load Required (AH)',          color:CH.orange, values:[calc.criticalloadrequiredBatteryAH] },
    { label:'Total Load Required (AH)',             color:CH.dkgreen,values:[calc.totalloadrequiredBatteryAH] },
  ];
  // Chart 6: Inverter sufficiency bar
  const invBarCats = ['Inverter (KVA)'];
  const invBarSeries = [
    { label:'Existing Inverter Rating (KVA)',        color:CH.purple, values:[existingInverterKVA||0] },
    { label:'PV Load Required (KVA)',               color:CH.green2, values:[calc.pvloadrequiredInverterVA/1000] },
    { label:'Critical Load Required (KVA)',         color:CH.orange, values:[calc.criticalloadrequiredInverterVA/1000] },
    { label:'Total Load Required (KVA)',            color:CH.dkgreen,values:[calc.totalloadrequiredInverterVA/1000] },
  ];
  // Chart 7: Grid vs PV load bar
  const loadNames = loads.map(l=>l.typeOfLoad);
  const chart7Series = [
    { label:'PV Connected Load (W)', color:CH.purple, values:loads.map(l=>Number(l.pvConnectedquantity||0)*Number(l.ratingOfLoad)) },
    { label:'Total Load (W)',        color:CH.orange, values:loads.map(l=>Number(l.numberOfLoad)*Number(l.ratingOfLoad)) },
  ];
  // Chart 8: Load distribution pie
  const loadPieData = loads.map((l,i) => ({
    name: l.typeOfLoad, value: Number(l.numberOfLoad)*Number(l.ratingOfLoad), color: CH.pie[i%7],
  }));
  // Chart 9: Criticality pie
  const critTotal = loads.reduce((s,l)=>s+(l.criticalLoad ? Number(l.numberOfLoad)*Number(l.ratingOfLoad) : 0),0);
  const nonCritTotal = loads.reduce((s,l)=>s+(!l.criticalLoad ? Number(l.numberOfLoad)*Number(l.ratingOfLoad) : 0),0);
  const critPieData = [
    { name:'Critical Load', value:critTotal, color:CH.pie[6] },
    { name:'Non-Critical Load', value:nonCritTotal, color:CH.green2 },
  ];

  return (
    <Document>

      {/* ══════════════════ PAGE 1 — Cover + Site + Healthcare ══════════════════ */}
      <Page size="A4" style={st.page}>
        {/* COVER HEADER — first page only */}
        <View style={st.coverHeader}>
          {nitrLogo   ? <Image src={nitrLogo}   style={st.logo}/> : <View style={[st.logo,{backgroundColor:C.light}]}/>}
          <View style={st.headerCenter}>
            <Text style={st.instituteName}>NATIONAL INSTITUTE OF TECHNOLOGY RAIPUR</Text>
            <Text style={st.instituteImp}>(An Institute of National Importance)</Text>
            <Text style={st.reportTitle}>Technical Audit Report on Solar Power Infrastructure</Text>
            <Text style={st.reportSubtitle}>Healthcare Facilities Across Chhattisgarh</Text>
            <Text style={st.unicefLine}>UNICEF Sponsored Climate-Resilient Health Infrastructure Initiative</Text>
          </View>
          {unicefLogo ? <Image src={unicefLogo} style={st.logo}/> : <View style={[st.logo,{backgroundColor:C.light}]}/>}
        </View>

        <View style={st.centreBanner}>
          <Text style={st.centreName}>{centre.centreName?.toUpperCase()}</Text>
        </View>

        <Text style={st.sectionTitle}>Site Details</Text>
        <View style={{flexDirection:'row', gap:12}}>
          <View style={{flex:1}}>
            <IRow label="Centre Name" value={centre.centreName?.toUpperCase()}/>
            <IRow label="District"    value={centre.district?.toUpperCase()}/>
            <IRow label="Latitude"    value={String(centre.latitude??'—')}/>
            <IRow label="Longitude"   value={String(centre.longitude??'—')}/>
          </View>
          {centre.images?.siteImageUrl && (
            <View style={{width:'42%'}}>
              <Image src={centre.images.siteImageUrl} style={[st.siteImg,{borderRadius:3}]}/>
              <Text style={st.imgLabel}>Site Image</Text>
            </View>
          )}
        </View>

        <Text style={st.sectionTitle}>Healthcare Statistics</Text>
        <View style={st.healthGrid}>
          {[
            {label:'No. of Beds',            val:centre?.additionalInfo?.noofBeds},
            {label:'Avg OPD Daily',           val:centre?.additionalInfo?.noofOPDdaily},
            {label:'IPD Admissions / Month',  val:centre?.additionalInfo?.noofIPDAdmissionperMonth},
            {label:'Deliveries / Month',      val:centre?.additionalInfo?.noofdeliveryperMonth},
          ].map((item,i) => (
            <View key={i} style={st.healthCard}>
              <Text style={st.healthNum}>{item.val??'—'}</Text>
              <Text style={st.healthLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
        <Footer centre={centre}/>
      </Page>

      {/* ══════════════════ PAGE 2 — System Details ══════════════════ */}
      <Page size="A4" style={st.page}>
        <Text style={st.sectionTitle}>System Details</Text>

        <Text style={st.subTitle}>Solar Panel Specifications</Text>
        <View style={st.statGrid}>
          {[
            {label:'Total Rating',        val:String(centre.pvRating*centre.noOfPanels/1000), unit:'KWP'},
            {label:'Panel Rating',        val:String(centre.pvRating),                        unit:'WATTS'},
            {label:'No. of Panels',       val:String(centre.noOfPanels),                      unit:''},
            {label:'Voltage Rating',      val:String(centre.pvVoltage),                       unit:'VOLTS'},
            {label:'Manufacturer',        val:centre.pvSystemake?.toUpperCase()||'N/A',        unit:''},
            {label:'Date of Installation',val:dateStr,                                         unit:''},
          ].map((item,i) => (
            <View key={i} style={st.statCard}>
              <Text style={st.statLabel}>{item.label}</Text>
              <Text style={st.statVal}>{item.val}</Text>
              {item.unit ? <Text style={st.statUnit}>{item.unit}</Text> : null}
            </View>
          ))}
        </View>
        <View style={st.imageRow}>
          {centre.images?.panelImageUrl && <View style={[st.imgBox,{flex:2}]}><Image src={centre.images.panelImageUrl} style={st.siteImg}/><Text style={st.imgLabel}>Panel Image</Text></View>}
          {centre.images?.panelratingImageUrl && <View style={[st.imgBox,{flex:1}]}><Image src={centre.images.panelratingImageUrl} style={st.siteImg}/><Text style={st.imgLabel}>Panel Rating</Text></View>}
        </View>

        <Text style={st.subTitle}>Battery Specifications</Text>
        <View style={st.statGrid}>
          {[
            {label:'Total Capacity',    val:String(centre.battery?.capacityAh??'—'), unit:'AH'},
            {label:'Battery Rating',    val:String(centre.battery?.capacityAh??'—'), unit:'AH'},
            {label:'No. of Batteries',  val:String(centre.battery?.count??'—'),       unit:''},
            {label:'System Voltage',    val:String((centre.battery?.voltage??0)*(centre.battery?.count??0)), unit:'VOLTS'},
            {label:'Voltage Rating',    val:String(centre.battery?.voltage??'—'),     unit:'VOLTS'},
            {label:'Manufacturer',      val:centre.battery?.Manufacturer?.toUpperCase()||'N/A', unit:''},
          ].map((item,i) => (
            <View key={i} style={st.statCard}>
              <Text style={st.statLabel}>{item.label}</Text>
              <Text style={st.statVal}>{item.val}</Text>
              {item.unit ? <Text style={st.statUnit}>{item.unit}</Text> : null}
            </View>
          ))}
        </View>
        <View style={st.imageRow}>
          {centre.images?.batteryImageUrl && <View style={[st.imgBox,{flex:2}]}><Image src={centre.images.batteryImageUrl} style={st.siteImg}/><Text style={st.imgLabel}>Battery Image</Text></View>}
          {centre.images?.batteryratingImageUrl && <View style={[st.imgBox,{flex:1}]}><Image src={centre.images.batteryratingImageUrl} style={st.siteImg}/><Text style={st.imgLabel}>Battery Rating</Text></View>}
        </View>

        <Text style={st.subTitle}>Inverter Specifications</Text>
        <View style={st.statGrid}>
          {[
            {label:'Total Rating',   val:String(centre.inverter?.inverterRatingKVA??'—'), unit:'KVA'},
            {label:'Voltage Rating', val:String(centre.inverter?.voltage??'—'),           unit:'VOLTS'},
            {label:'Type',           val:centre.inverter?.type?.toUpperCase()||'N/A',     unit:''},
            {label:'Manufacturer',   val:centre.inverter?.make?.toUpperCase()||'N/A',     unit:''},
          ].map((item,i) => (
            <View key={i} style={st.statCard}>
              <Text style={st.statLabel}>{item.label}</Text>
              <Text style={st.statVal}>{item.val}</Text>
              {item.unit ? <Text style={st.statUnit}>{item.unit}</Text> : null}
            </View>
          ))}
        </View>
        <View style={st.imageRow}>
          {centre.images?.inverterImageUrl && <View style={[st.imgBox,{flex:2}]}><Image src={centre.images.inverterImageUrl} style={st.siteImg}/><Text style={st.imgLabel}>Inverter Image</Text></View>}
          {centre.images?.inverterRatingImageUrl && <View style={[st.imgBox,{flex:1}]}><Image src={centre.images.inverterRatingImageUrl} style={st.siteImg}/><Text style={st.imgLabel}>Inverter Rating</Text></View>}
        </View>
        <Footer centre={centre}/>
      </Page>

      {/* ══════════════════ PAGE 3 — Energy Details ══════════════════ */}
      <Page size="A4" style={st.page}>
        <Text style={st.sectionTitle}>Energy Details</Text>

        <Text style={st.subTitle}>Last 12 Months — Grid Energy Consumption</Text>
        {grid.length > 0 ? (
          <View style={st.monthGrid}>
            {grid.map((g,i) => (
              <View key={i} style={st.monthCard}>
                <Text style={st.monthLbl}>{g.month ? new Date(g.month).toLocaleDateString('en-IN',{month:'short',year:'numeric'}) : '—'}</Text>
                <Text style={st.monthVal}>{g.consumption}</Text>
                <Text style={st.monthUnit}>KWH</Text>
              </View>
            ))}
          </View>
        ) : <Text style={st.calcLine}>No grid consumption data available.</Text>}

        <Text style={st.subTitle}>Last 12 Months — Actual Solar Generation</Text>
        {actuals.length > 0 ? (
          <View style={st.monthGrid}>
            {actuals.map((g,i) => (
              <View key={i} style={st.monthCard}>
                <Text style={st.monthLbl}>{g.month ? new Date(g.month).toLocaleDateString('en-IN',{month:'short',year:'numeric'}) : '—'}</Text>
                <Text style={st.monthVal}>{g.generation}</Text>
                <Text style={st.monthUnit}>KWH</Text>
              </View>
            ))}
          </View>
        ) : <Text style={st.calcLine}>No actual solar generation data available.</Text>}

        <Text style={st.subTitle}>Last 12 Months — Ideal Solar Generation</Text>
        {ideals.length > 0 ? (
          <View style={st.monthGrid}>
            {ideals.map((g,i) => (
              <View key={i} style={st.monthCard}>
                <Text style={st.monthLbl}>{g.month ? new Date(g.month).toLocaleDateString('en-IN',{month:'short',year:'numeric'}) : '—'}</Text>
                <Text style={st.monthVal}>{g.generation}</Text>
                <Text style={st.monthUnit}>KWH</Text>
              </View>
            ))}
          </View>
        ) : <Text style={st.calcLine}>No ideal solar generation data available.</Text>}

        <Footer centre={centre}/>
      </Page>

      {/* ══════════════════ PAGE 4 — Load Table + Efficiency Table ══════════════════ */}
      <Page size="A4" style={st.page}>
        <Text style={st.sectionTitle}>Load Details</Text>
        {orderedLoads.length > 0 ? (
          <View style={st.table}>
            <View style={st.thead}>
              <Text style={[st.th,st.lc0]}>#</Text>
              <Text style={[st.th,st.lc1]}>Type of Load</Text>
              <Text style={[st.th,st.lc2]}>Rating (W)</Text>
              <Text style={[st.th,st.lc3]}>Count</Text>
              <Text style={[st.th,st.lc4]}>PV Qty</Text>
              <Text style={[st.th,st.lc5]}>Critical</Text>
              <Text style={[st.th,st.lc6]}>Vol (L)</Text>
              <Text style={[st.th,st.lc7]}>Make</Text>
              <Text style={[st.th,st.lc8]}>Model</Text>
            </View>
            {orderedLoads.map((l,i) => (
              <View key={i} style={i%2===0 ? st.trow : st.trowAlt}>
                <Text style={[st.td, st.lc0]}>{i+1}</Text>
                <Text style={[st.tdB,st.lc1]}>{l.typeOfLoad?.toUpperCase()}</Text>
                <Text style={[st.td, st.lc2]}>{l.ratingOfLoad}</Text>
                <Text style={[st.td, st.lc3]}>{l.numberOfLoad}</Text>
                <Text style={[st.td, st.lc4]}>{l.pvConnectedquantity||'—'}</Text>
                <Text style={[l.criticalLoad ? st.tdG : st.tdR, st.lc5]}>{l.criticalLoad?'Yes':'No'}</Text>
                <Text style={[st.td, st.lc6]}>{l.grossVolume||'—'}</Text>
                <Text style={[st.td, st.lc7]}>{l.make||'—'}</Text>
                <Text style={[st.td, st.lc8]}>{l.model||'—'}</Text>
              </View>
            ))}
          </View>
        ) : <Text style={st.calcLine}>No load details available.</Text>}

        <Text style={st.sectionTitle}>Solar Panel Generation Efficiency — Last 12 Months</Text>
        {effRed.length > 0 ? (
          <View style={st.table}>
            <View style={st.thead}>
              <Text style={[st.th,st.ec0]}>#</Text>
              <Text style={[st.th,st.ec1]}>Period</Text>
              <Text style={[st.th,st.ec2]}>Ideal Gen (KWH)</Text>
              <Text style={[st.th,st.ec3]}>Actual Gen (KWH)</Text>
              <Text style={[st.th,st.ec4]}>Efficiency Reduction (%)</Text>
            </View>
            {effRed.map((r,i) => (
              <View key={i} style={i%2===0 ? st.trow : st.trowAlt}>
                <Text style={[st.td, st.ec0]}>{i+1}</Text>
                <Text style={[st.tdB,st.ec1]}>{r.month ? new Date(r.month).toLocaleDateString('en-IN',{month:'long',year:'numeric'}) : '—'}</Text>
                <Text style={[st.td, st.ec2]}>{r.idealGeneration}</Text>
                <Text style={[st.td, st.ec3]}>{r.actualGenerationRaw===0 ? 'Meter Fault' : r.actualGenerationRaw.toFixed(2)}</Text>
                <Text style={[r.actualGenerationRaw===0 ? st.td : st.tdB, st.ec4]}>{r.actualGenerationRaw===0 ? 'Meter Fault' : `${r.reductionPercent.toFixed(2)}%`}</Text>
              </View>
            ))}
          </View>
        ) : <Text style={st.calcLine}>No efficiency data available.</Text>}
        <Footer centre={centre}/>
      </Page>

      {/* ══════════════════ PAGE 5 — Formulas + Calculations ══════════════════ */}
      <Page size="A4" style={st.page}>
        <Text style={st.sectionTitle}>Formulas Used</Text>
        <View style={{flexDirection:'row', gap:6, marginBottom:5}}>
          <View style={[st.formulaBox,{flex:1}]}>
            <Text style={st.formulaLbl}>Ideal Solar Generation</Text>
            <Text style={st.formulaTxt}>{formulas.IdealSolarGeneration}</Text>
            <Text style={[st.formulaLbl,{marginTop:5}]}>Effective Efficiency</Text>
            <Text style={st.formulaTxt}>{formulas.EffectiveEfficiency}</Text>
          </View>
          <View style={[st.formulaBox,{flex:1}]}>
            <Text style={st.formulaLbl}>Efficiency Reduction</Text>
            <Text style={st.formulaTxt}>{formulas.EfficiencyReduction}</Text>
          </View>
        </View>
        <View style={{flexDirection:'row', gap:6, marginBottom:5}}>
          <View style={[st.formulaBox,{flex:1}]}>
            <Text style={st.formulaLbl}>Inverter Sizing</Text>
            <Text style={st.formulaTxt}>{formulas.InverterSizing}</Text>
          </View>
          <View style={[st.formulaBox,{flex:1}]}>
            <Text style={st.formulaLbl}>Battery Sizing</Text>
            <Text style={st.formulaTxt}>{formulas.BatterySizing}</Text>
          </View>
        </View>
        <View style={[st.formulaBox,{marginBottom:8}]}>
          <Text style={st.formulaLbl}>Constants Used</Text>
          <View style={{flexDirection:'row', flexWrap:'wrap', gap:3, marginTop:3}}>
            {[
              `Safety Factor: ${(SAFETY_FACTOR-1)*100}%`, `Power Factor: ${POWER_FACTOR}`,
              `Battery Eff: ${BATTERY_EFF*100}%`,         `Inverter Eff: ${INVERTER_EFF*100}%`,
              `Backup Hours: ${BACKUP_HOURS}`,             `Hours/Day: ${HOURS_PER_DAY}`,
              `Days/Month: ${DAYS_PER_MONTH}`,             `Perf. Ratio: ${PERFORMANCE_RATIO}`,
              `Derating: ${DERATING_FACTOR}`,              `Soiling: ${SOILING_FACTOR}`,
              `Mismatch: ${MISMATCH_FACTOR}`,              `Diversity Factor: ${DIVERSITY_FACTOR}`,
              `Effective Efficiency: ${EFFECTIVE_EFFICIENCY}%`,
            ].map((txt,i) => <View key={i} style={st.constChip}><Text style={st.constTxt}>{txt}</Text></View>)}
          </View>
        </View>

        <Text style={st.sectionTitle}>Calculations</Text>
        <View style={{flexDirection:'row', gap:8}}>
          <View style={{flex:1}}>
            <View style={st.calcBox}>
              <Text style={st.calcBold}>Inverter Sizing — PV Connected Load</Text>
              <Text style={st.calcLine}>Total PV Load × Safety Factor: {calc.pvloadTotalW} × {SAFETY_FACTOR} = {calc.pvloadWithSafety} W</Text>
              <Text style={st.calcLine}>Required Rating: {calc.pvloadWithSafety} ÷ {POWER_FACTOR} = {calc.pvloadrequiredInverterVA.toFixed(2)} VA</Text>
            </View>
            <View style={st.calcBox}>
              <Text style={st.calcBold}>Inverter Sizing — Critical Load</Text>
              <Text style={st.calcLine}>Total Critical Load × Safety Factor: {calc.criticalloadW} × {SAFETY_FACTOR} = {calc.criticalloadWithSafety} W</Text>
              <Text style={st.calcLine}>Required Rating: {calc.criticalloadWithSafety} ÷ {POWER_FACTOR} = {calc.criticalloadrequiredInverterVA.toFixed(2)} VA</Text>
            </View>
            <View style={st.calcBox}>
              <Text style={st.calcBold}>Inverter Sizing — Total Load</Text>
              <Text style={st.calcLine}>Total Load × Safety Factor: {calc.totalloadW} × {SAFETY_FACTOR} = {calc.totalloadWithSafety} W</Text>
              <Text style={st.calcLine}>Required: {calc.totalloadWithSafety} × {DIVERSITY_FACTOR} ÷ {POWER_FACTOR} = {calc.totalloadrequiredInverterVA.toFixed(2)} VA</Text>
            </View>
          </View>
          <View style={{flex:1}}>
            <View style={st.calcBox}>
              <Text style={st.calcBold}>Battery Sizing — PV Connected Load</Text>
              <Text style={st.calcLine}>({calc.pvloadWithSafety} × {BACKUP_HOURS}) ÷ ({calc.sysV} × {BATTERY_EFF} × {INVERTER_EFF})</Text>
              <Text style={st.calcLine}>Required: {calc.pvloadrequiredBatteryAH.toFixed(2)} AH</Text>
            </View>
            <View style={st.calcBox}>
              <Text style={st.calcBold}>Battery Sizing — Critical Load</Text>
              <Text style={st.calcLine}>({calc.criticalloadWithSafety} × Backup Hours per load) ÷ ({calc.sysV} × {BATTERY_EFF} × {INVERTER_EFF})</Text>
              <Text style={st.calcLine}>Required: {calc.criticalloadrequiredBatteryAH.toFixed(2)} AH</Text>
            </View>
            <View style={st.calcBox}>
              <Text style={st.calcBold}>Battery Sizing — Total Load</Text>
              <Text style={st.calcLine}>({calc.totalloadWithSafety} × Backup Hrs × {DIVERSITY_FACTOR}) ÷ ({calc.sysV} × {BATTERY_EFF} × {INVERTER_EFF})</Text>
              <Text style={st.calcLine}>Required: {calc.totalloadrequiredBatteryAH.toFixed(2)} AH</Text>
            </View>
          </View>
        </View>
        <Text style={[st.calcLine,{marginTop:4,fontStyle:'italic'}]}>
          Note: Total Load calculations use diversity factor and represent estimated simultaneous operational demand.
        </Text>
        <Footer centre={centre}/>
      </Page>

      {/* ══════════════════ PAGE 6 — Analysis ══════════════════ */}
      <Page size="A4" style={st.page}>
        <Text style={st.sectionTitle}>Analysis</Text>

        <Text style={st.subTitle}>Solar Sufficiency Analysis</Text>
        <View style={st.anaGrid}>
          {[
            {label:'Avg Ideal Monthly Solar Gen',  val:avgIdeal.toFixed(2),                       unit:'KWH'},
            {label:'Avg Actual Monthly Solar Gen', val:avgActual.toFixed(2),                      unit:'KWH'},
            {label:'Avg Monthly Grid Consumption', val:avgGrid.toFixed(2),                        unit:'KWH'},
            {label:'Monthly Total Load',           val:calc.totalLoadMonthlyKwh.toFixed(2),       unit:'KWH'},
            {label:'Monthly PV Load',              val:calc.pvLoadMonthlyKwh.toFixed(2),          unit:'KWH'},
            {label:'Monthly Critical Load',        val:calc.criticalLoadMonthlyKwh.toFixed(2),    unit:'KWH'},
          ].map((item,i) => (
            <View key={i} style={st.anaCard}>
              <Text style={st.anaLbl}>{item.label}</Text>
              <Text style={st.anaVal}>{item.val} <Text style={st.anaUnit}>{item.unit}</Text></Text>
            </View>
          ))}
        </View>
        <View style={st.suffGrid}>
          {[
            {title:'Solar Gen vs Grid Consumption',   result:cr.solarVsGrid},
            {title:'Solar Gen vs PV Connected Load',  result:cr.solarVsPvLoad},
            {title:'Solar Gen vs Critical Load',       result:cr.solarVsCritical},
            {title:'Solar Gen vs Total Load',          result:cr.solarVsTotal},
          ].map((item,i) => (
            <View key={i} style={st.suffCard}>
              <Text style={st.suffTitle}>{item.title}</Text>
              <View style={st.suffBadgeRow}>
                <View style={{alignItems:'center'}}><Text style={st.badgeLbl}>Ideal</Text><Badge result={item.result.ideal}/></View>
                <View style={{alignItems:'center'}}><Text style={st.badgeLbl}>Actual</Text><Badge result={item.result.actual}/></View>
              </View>
            </View>
          ))}
        </View>

        <Text style={st.subTitle}>Battery Sufficiency Analysis</Text>
        <View style={st.anaGrid}>
          {[
            {label:'Existing Battery Capacity',        val:totalBatteryAH.toFixed(2),                         unit:'AH'},
            {label:'Required Capacity (PV Load)',      val:calc.pvloadrequiredBatteryAH.toFixed(2),           unit:'AH'},
            {label:'Required Capacity (Critical Load)',val:calc.criticalloadrequiredBatteryAH.toFixed(2),     unit:'AH'},
            {label:'Required Capacity (Total Load)',   val:calc.totalloadrequiredBatteryAH.toFixed(2),        unit:'AH'},
          ].map((item,i) => (
            <View key={i} style={st.anaCard}>
              <Text style={st.anaLbl}>{item.label}</Text>
              <Text style={st.anaVal}>{item.val} <Text style={st.anaUnit}>{item.unit}</Text></Text>
            </View>
          ))}
        </View>
        <View style={[st.suffGrid,{justifyContent:'flex-start'}]}>
          {[
            {title:'Battery for PV Load',       result:cr.battery.pvLoad},
            {title:'Battery for Critical Load', result:cr.battery.criticalLoad},
            {title:'Battery for Total Load',    result:cr.battery.totalLoad},
          ].map((item,i) => (
            <View key={i} style={st.suffCard3}>
              <Text style={st.suffTitle}>{item.title}</Text>
              <Badge result={item.result}/>
            </View>
          ))}
        </View>

        <Text style={st.subTitle}>Inverter Sufficiency Analysis</Text>
        <View style={st.anaGrid}>
          {[
            {label:'Existing Inverter Capacity',       val:existingInverterKVA ? existingInverterKVA.toFixed(2) : '—', unit:'KVA'},
            {label:'Required Capacity (PV Load)',      val:(calc.pvloadrequiredInverterVA/1000).toFixed(2),            unit:'KVA'},
            {label:'Required Capacity (Critical Load)',val:(calc.criticalloadrequiredInverterVA/1000).toFixed(2),      unit:'KVA'},
            {label:'Required Capacity (Total Load)',   val:(calc.totalloadrequiredInverterVA/1000).toFixed(2),         unit:'KVA'},
          ].map((item,i) => (
            <View key={i} style={st.anaCard}>
              <Text style={st.anaLbl}>{item.label}</Text>
              <Text style={st.anaVal}>{item.val} <Text style={st.anaUnit}>{item.unit}</Text></Text>
            </View>
          ))}
        </View>
        <View style={[st.suffGrid,{justifyContent:'flex-start'}]}>
          {[
            {title:'Inverter for PV Load',       result:cr.inverter.pvLoad},
            {title:'Inverter for Critical Load', result:cr.inverter.criticalLoad},
            {title:'Inverter for Total Load',    result:cr.inverter.totalLoad},
          ].map((item,i) => (
            <View key={i} style={st.suffCard3}>
              <Text style={st.suffTitle}>{item.title}</Text>
              <Badge result={item.result}/>
            </View>
          ))}
        </View>
        <Footer centre={centre}/>
      </Page>

      {/* ══════════════════ PAGE 7 — Charts 1 & 2 ══════════════════ */}
      <Page size="A4" style={st.page}>
        <Text style={st.sectionTitle}>Visual Insights</Text>
        <PdfLineChart
          title="Chart 1 — Actual Solar Generation vs Ideal Solar Generation"
          series={chart1Series}
          yLabel="Energy (KWH)"
        />
        <PdfLineChart
          title="Chart 2 — Solar Generation Efficiency Reduction (%)"
          series={chart2Series}
          yLabel="Efficiency Reduction (%)"
        />
        <Footer centre={centre}/>
      </Page>

      {/* ══════════════════ PAGE 8 — Charts 3 & 4 ══════════════════ */}
      <Page size="A4" style={st.page}>
        <PdfLineChart
          title="Chart 3 — Solar Generation, Grid Consumption and PV Load Comparison"
          series={chart3Series}
          yLabel="Energy (KWH)"
        />
        <PdfLineChart
          title="Chart 4 — Solar Generation, Total and Critical Load Comparison"
          series={chart4Series}
          yLabel="Energy (KWH)"
        />
        <Footer centre={centre}/>
      </Page>

      {/* ══════════════════ PAGE 9 — Charts 5 & 6 ══════════════════ */}
      <Page size="A4" style={st.page}>
        <PdfBarChart
          title="Chart 5 — Battery Sufficiency Analysis"
          categories={battBarCats}
          series={battBarSeries}
          yLabel="Capacity (AH)"
        />
        <PdfBarChart
          title="Chart 6 — Inverter Sufficiency Analysis"
          categories={invBarCats}
          series={invBarSeries}
          yLabel="Rating (KVA)"
        />
        <Footer centre={centre}/>
      </Page>

      {/* ══════════════════ PAGE 10 — Charts 7, 8, 9 ══════════════════ */}
      <Page size="A4" style={st.page}>
        <PdfBarChart
          title="Chart 7 — Load Type Comparison (Grid vs PV Connected)"
          categories={loadNames}
          series={chart7Series}
          yLabel="Load Rating (W)"
        />
        <PdfPieChart
          title="Chart 8 — Load Distribution"
          data={loadPieData}
        />
        <PdfPieChart
          title="Chart 9 — Load Criticality Comparison"
          data={critPieData}
        />
        <Footer centre={centre}/>
      </Page>

      {/* ══════════════════ PAGE 11 — Additional Info + Remarks ══════════════════ */}
      <Page size="A4" style={st.page}>
        <Text style={st.sectionTitle}>Additional Information — Grid & Maintenance Details</Text>
        <View style={{flexDirection:'row', flexWrap:'wrap', gap:5}}>
          {[
            {label:'Grid Supply',                   val:centre?.additionalInfo?.gridSupply===true?'Yes':centre?.additionalInfo?.gridSupply===false?'No':'—'},
            {label:'Grid Supply Quality',            val:centre?.additionalInfo?.gridsupplyQuality?.toUpperCase()||'—'},
            {label:'Supply Type',                    val:centre?.additionalInfo?.Supply?.toUpperCase()||'—'},
            {label:'Load Tripping (Day)',             val:centre?.additionalInfo?.anyloadtrippingduringtheDay?.toUpperCase()||'—'},
            {label:'Involvement of CREDA',           val:centre?.additionalInfo?.InvolvementofCREDA===true?'Yes':centre?.additionalInfo?.InvolvementofCREDA===false?'No':'—'},
            {label:'Panel Maintenance Freq.',        val:centre?.additionalInfo?.panelmaintenanceFrequency?.toUpperCase()||'—'},
            {label:'Solar Panel Failure Freq.',      val:centre?.additionalInfo?.failureFrequencyofsolarPanels?.toUpperCase()||'—'},
            {label:'Changing Battery Water Freq.',   val:centre?.additionalInfo?.frequencyofchangingbatteryWater?.toUpperCase()||'—'},
            {label:'Battery Backup Till Sunrise',    val:centre?.additionalInfo?.batterybackuptillSunrise?.toUpperCase()||'—'},
            {label:'Resolution Time (Solar Repairs)',val:centre?.additionalInfo?.resolutionTimeforSolarPanelRepairs?.toUpperCase()||'—'},
            {label:'Downtime During Faults',         val:centre?.additionalInfo?.downtimeduringFaults?.toUpperCase()||'—'},
            {label:'No. of Beds',                    val:String(centre?.additionalInfo?.noofBeds??'—')},
            {label:'Avg OPD Daily',                  val:String(centre?.additionalInfo?.noofOPDdaily??'—')},
            {label:'IPD Admissions/Month',           val:String(centre?.additionalInfo?.noofIPDAdmissionperMonth??'—')},
            {label:'Deliveries/Month',               val:String(centre?.additionalInfo?.noofdeliveryperMonth??'—')},
          ].map((item,i) => (
            <View key={i} style={st.addCard}>
              <Text style={st.addLbl}>{item.label}</Text>
              <Text style={st.addVal}>{item.val}</Text>
            </View>
          ))}
        </View>

        <Text style={st.sectionTitle}>Remarks</Text>
        <View style={st.remarksBox}>
          <Text style={st.remarksTxt}>{centre.remarks||'No remarks added.'}</Text>
        </View>

        {centre.imagefile && (
          <>
            <Text style={st.sectionTitle}>Uploaded / Reference File</Text>
            <Text style={[st.calcLine,{marginTop:3}]}>File: {centre.imagefile}</Text>
          </>
        )}
        <Footer centre={centre}/>
      </Page>

    </Document>
  );
}

// ─── Export Button ─────────────────────────────────────────────────────────────
export function ExportPDFButton({ centre, nitrLogo, unicefLogo }) {
  return (
    <PDFDownloadLink
      document={<SolarAuditPDF centre={centre} nitrLogo={nitrLogo} unicefLogo={unicefLogo}/>}
      fileName={`Solar_Audit_${centre.centreName?.replace(/\s+/g,'_')}_${centre.district}.pdf`}
      style={{
        display:'inline-block', marginTop:16, padding:'10px 24px',
        backgroundColor:'#414e5e', color:'#ffffff', borderRadius:8,
        fontWeight:'bold', fontSize:14, textDecoration:'none', letterSpacing:1,
      }}
    >
      {({loading}) => loading ? '⏳ Building PDF...' : '⬇️ Download PDF Report'}
    </PDFDownloadLink>
  );
}

export default SolarAuditPDF;
