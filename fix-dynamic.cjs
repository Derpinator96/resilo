const fs = require('fs');
const path = require('path');

const fp = path.join(__dirname, 'src', 'pages', 'InstituteDetail.jsx');
let content = fs.readFileSync(fp, 'utf8');

// 1. Add liveWeather state
content = content.replace(
  "let [inst, setInst] = useState(location.state || null)\n  const [loading, setLoading] = useState(!inst)",
  "let [inst, setInst] = useState(location.state || null)\n  const [loading, setLoading] = useState(!inst)\n  const [liveWeather, setLiveWeather] = useState(null)"
);

// 2. Add weather useEffect
const useEffectTarget = "  }, [id, inst])";
const useEffectReplacement = `  }, [id, inst])

  useEffect(() => {
    if (inst?.latitude && inst?.longitude && !liveWeather) {
      fetch(\`https://api.open-meteo.com/v1/forecast?latitude=\${inst.latitude}&longitude=\${inst.longitude}&current=temperature_2m,relative_humidity_2m\`)
        .then(res => res.json())
        .then(data => {
          if (data.current) {
            setLiveWeather({
              temp: data.current.temperature_2m,
              humidity: data.current.relative_humidity_2m
            });
          }
        })
        .catch(err => console.error("Weather fetch error:", err));
    }
  }, [inst, liveWeather])`;
content = content.replace(useEffectTarget, useEffectReplacement);

// 3. Replace inst override block
const instOverrideTarget = `  inst = {
    ...inst,
    solarGrid: inst.solarGrid || { generation: inst.pvRating || 10, efficiency: 85, statusDesc: 'Stable' },
    battery: { ...inst.battery, level: 95, health: 'Optimal' },
    infraClimate: inst.infraClimate || { temp: 28, humidity: 45 },
    equipmentHealth: inst.equipmentHealth || { statusDesc: 'Stable', medicineFridgeTemp: 4 }
  }`;

const instOverrideReplacement = `  let dynamicEfficiency = 85;
  if (inst.actualsolargeneration && inst.solargeneration && inst.actualsolargeneration.length > 0 && inst.solargeneration.length > 0) {
    const actual = inst.actualsolargeneration[inst.actualsolargeneration.length - 1].generation;
    const expected = inst.solargeneration[inst.solargeneration.length - 1].generation;
    if (expected > 0 && actual > 0) {
      dynamicEfficiency = Math.round((actual / expected) * 100);
    }
  }

  const dynamicBatteryBackup = inst.additionalInfo?.batterybackuptillSunrise || (inst.battery?.capacityAh ? \`\${inst.battery.capacityAh} Ah\` : 'Unknown');

  inst = {
    ...inst,
    solarGrid: inst.solarGrid || { generation: inst.pvRating || 10, efficiency: dynamicEfficiency, statusDesc: dynamicEfficiency < 50 ? 'Low Output' : 'Stable' },
    battery: { ...inst.battery, level: dynamicBatteryBackup, health: inst.battery?.Manufacturer ? \`Make: \${inst.battery.Manufacturer}\` : 'Optimal' },
    infraClimate: liveWeather || inst.infraClimate || { temp: 28, humidity: 45 },
    equipmentHealth: inst.equipmentHealth || { statusDesc: 'Stable', medicineFridgeTemp: 4 }
  }`;

content = content.replace(instOverrideTarget, instOverrideReplacement);

// 4. Update KPI Array
const kpiTarget = `          {[
            { label: 'Solar Efficiency', value: \`\${inst.solarGrid.efficiency}%\`, sub: \`\${inst.solarGrid.generation} kW generation\`, icon: BatteryCharging, color: 'text-amber-600', bg: 'bg-amber-500/20', trend: inst.solarGrid.efficiency < 50 ? 'down' : 'up' },
            { label: 'Battery Backup', value: \`\${inst.battery.level}%\`, sub: inst.battery.health, icon: Power, color: 'text-teal-600', bg: 'bg-teal-500/20', trend: inst.battery.level < 30 ? 'down' : 'up' },
            { label: 'Infra Temp', value: \`\${inst.infraClimate.temp}°C\`, sub: \`Humidity \${inst.infraClimate.humidity}%\`, icon: ThermometerSun, color: 'text-slate-600', bg: 'bg-slate-500/20', trend: inst.infraClimate.temp > 35 ? 'down' : 'up' },
          ].map((m, i) => (`

const kpiReplacement = `          {[
            { label: 'Solar Efficiency', value: \`\${inst.solarGrid.efficiency}%\`, sub: \`\${inst.solarGrid.generation} kW generation\`, icon: BatteryCharging, color: 'text-amber-600', bg: 'bg-amber-500/20', trend: inst.solarGrid.efficiency < 50 ? 'down' : 'up' },
            { label: 'Battery Backup', value: \`\${inst.battery.level}\`, sub: inst.battery.health, icon: Power, color: 'text-teal-600', bg: 'bg-teal-500/20', trend: inst.battery.level === 'Unknown' ? 'down' : 'up' },
            { label: 'Infra Temp', value: \`\${inst.infraClimate.temp}°C\`, sub: \`Humidity \${inst.infraClimate.humidity}%\`, icon: ThermometerSun, color: 'text-slate-600', bg: 'bg-slate-500/20', trend: inst.infraClimate.temp > 35 ? 'down' : 'up' },
          ].map((m, i) => (`;

content = content.replace(kpiTarget, kpiReplacement);

fs.writeFileSync(fp, content);
console.log('done fixing dynamic values');
