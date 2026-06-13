import re

with open('src/pages/InstituteDetail.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. State declarations
code = re.sub(
    r'(const \[isSolarExpanded, setIsSolarExpanded\] = useState\(false\))',
    r'\1\n  const [liveWeather, setLiveWeather] = useState(null)',
    code
)

# 2. Add weather effect
weather_effect = """  useEffect(() => {
    if (inst?.latitude && inst?.longitude && !liveWeather) {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${inst.latitude}&longitude=${inst.longitude}&current=temperature_2m,relative_humidity_2m`)
        .then(res => res.json())
        .then(data => {
          if (data.current) {
            setLiveWeather({
              temp: data.current.temperature_2m,
              humidity: data.current.relative_humidity_2m
            })
          }
        })
        .catch(err => console.error("Weather fetch error:", err))
    }
  }, [inst, liveWeather])

  const handleOpenReport"""

code = code.replace('  const handleOpenReport', weather_effect)

# 3. Dynamic overrides
dynamic_override = """  let dynamicGeneration = inst.pvRating || 10;
  let dynamicEfficiency = 85;
  if (inst.actualsolargeneration && inst.solargeneration && inst.actualsolargeneration.length > 0 && inst.solargeneration.length > 0) {
    const lastGen = inst.actualsolargeneration[inst.actualsolargeneration.length - 1].generation;
    const estGen = inst.solargeneration[inst.solargeneration.length - 1].generation;
    dynamicGeneration = lastGen || inst.pvRating;
    dynamicEfficiency = estGen > 0 ? Math.min(100, Math.round((lastGen / estGen) * 100)) : 85;
  }

  inst = {
    ...inst,
    solarGrid: { generation: dynamicGeneration, efficiency: dynamicEfficiency, statusDesc: dynamicEfficiency > 70 ? 'Optimal Output' : 'Low Output' },
    battery: { ...inst.battery, level: inst.battery?.level || 95, health: inst.battery?.health || 'Optimal' },
    infraClimate: liveWeather || { temp: 28, humidity: 45 },
    equipmentHealth: inst.equipmentHealth || { statusDesc: 'Stable', medicineFridgeTemp: 4 }
  }"""

code = re.sub(
    r'  inst = \{\s*\.\.\.inst,\s*solarGrid:.*?\n.*?\n.*?\n.*?\n  \}',
    dynamic_override,
    code,
    flags=re.DOTALL
)

# 4. Fix colors
# loading spinner
code = code.replace('border-purple-200 border-t-purple-600', 'border-teal-200 border-t-teal-600')
code = code.replace('bg-purple-600 text-white font-bold">Return to Dashboard', 'bg-teal-600 text-white font-bold">Return to Dashboard')
# background gradients
code = re.sub(r'<div className="absolute inset-0 -z-10" style=\{\{ background: `linear-gradient\(.*?\}\} />\n', '', code)
code = code.replace('bg-violet-600/30', 'bg-slate-200/40')
code = code.replace('bg-fuchsia-600/30', 'hidden')
code = code.replace('text-purple-950 hover:text-black', 'text-slate-800 hover:text-black')
code = code.replace('text-purple-950 shadow-sm', 'text-slate-800 shadow-sm')
code = code.replace('bg-purple-600/10 backdrop-blur-md border border-purple-500/20 text-purple-900', 'bg-slate-800/10 backdrop-blur-md border border-slate-500/20 text-slate-800')
code = code.replace('bg-gradient-to-r from-violet-950 via-fuchsia-950 to-pink-900', 'text-slate-900')
code = code.replace('text-transparent bg-clip-text text-slate-900', 'text-slate-900')
code = code.replace('text-purple-950/70', 'text-slate-800/70')
# KPI cards colors
code = code.replace("text-purple-600", "text-teal-600").replace("bg-purple-500/20", "bg-teal-500/20")
code = code.replace("text-pink-600", "text-teal-600").replace("bg-pink-500/20", "bg-teal-500/20")
code = code.replace('text-purple-950/60', 'text-slate-800/60').replace('text-purple-950/40', 'text-slate-800/40').replace('text-purple-950/50', 'text-slate-800/50')
# AIChat button colors
code = code.replace('rgba(124,58,237,0.3)', 'rgba(0,0,0,0.15)')
code = code.replace('bg-purple-600', 'bg-slate-800').replace('bg-purple-700', 'bg-slate-900')
code = code.replace('text-purple-950 uppercase', 'text-slate-900 uppercase')
code = code.replace('bg-purple-950/40', 'bg-slate-900/40')
code = code.replace('placeholder-purple-950/30', 'placeholder-slate-900/30')
code = code.replace('focus:ring-purple-500/50', 'focus:ring-teal-500/50')
code = code.replace('bg-gradient-to-r from-violet-600 to-fuchsia-600', 'bg-slate-900')
code = code.replace('shadow-purple-500/30', 'shadow-teal-500/30').replace('shadow-purple-500/50', 'shadow-teal-500/50')

# 5. Add the image in the hero section
hero_image = """          {inst.images?.siteImageUrl && (
            <div className="w-full max-w-4xl h-64 md:h-96 rounded-3xl overflow-hidden mb-8 shadow-2xl relative group">
              <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
              <img src={inst.images.siteImageUrl} alt={inst.name} className="w-full h-full object-cover" />
            </div>
          )}
          <h1"""

code = code.replace('          <h1', hero_image)

with open('src/pages/InstituteDetail.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
