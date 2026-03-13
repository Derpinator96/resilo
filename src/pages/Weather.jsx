import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Droplets, Thermometer, Wind, AlertTriangle, CloudRain, Sun, Loader2 } from 'lucide-react'

export default function Weather() {
  const navigate = useNavigate()

  const [weatherData, setWeatherData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Fetch real weather data from Open-Meteo API for Raipur, Chhattisgarh (Lat: 21.2514, Lon: 81.6296)
    const fetchWeather = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=21.2514&longitude=81.6296&current=temperature_2m,relative_humidity_2m,rain,weather_code&daily=temperature_2m_max,temperature_2m_min,rain_sum&timezone=auto'
        )
        
        if (!response.ok) throw new Error('Failed to fetch weather data')
        
        const data = await response.json()
        
        // Map Open-Meteo weather codes to basic conditions
        const getCondition = (code) => {
          if (code <= 3) return 'Clear / Partly Cloudy'
          if (code <= 48) return 'Fog / Overcast'
          if (code <= 67) return 'Rain / Drizzle'
          if (code <= 77) return 'Snow'
          if (code <= 82) return 'Heavy Rain Showers'
          if (code >= 95) return 'Thunderstorm'
          return 'Unknown'
        }

        const currentRain = data.current.rain || 0
        const dailyRain = data.daily.rain_sum[0] || 0
        
        // Use daily rain sum if current is 0 to show better alerts if expected today
        const totalRainfall = Math.max(currentRain, dailyRain)

        setWeatherData({
          rainfall: totalRainfall, // mm
          temperature: Math.round(data.current.temperature_2m), // Celsius
          humidity: Math.round(data.current.relative_humidity_2m), // %
          minTemp: Math.round(data.daily.temperature_2m_min[0]),
          maxTemp: Math.round(data.daily.temperature_2m_max[0]),
          condition: getCondition(data.current.weather_code)
        })
      } catch (err) {
        console.error("Error fetching weather:", err)
        setError("Could not load live weather data. Displaying fallback data.")
        // Fallback data in case of failure
        setWeatherData({
          rainfall: 145,
          temperature: 31,
          humidity: 88,
          minTemp: 24,
          maxTemp: 32,
          condition: 'Heavy Rain (Fallback)'
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchWeather()
  }, [])

  if (isLoading || !weatherData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
        <p className="mt-4 font-medium text-gray-500">Connecting to Live Weather API...</p>
      </div>
    )
  }

  // Basic Disaster Alert Logic based on LIVE data
  const isFloodWarning = weatherData.rainfall > 50 // Threshold lowered slightly for realistic testing
  const isDroughtAlert = weatherData.rainfall < 5 && weatherData.temperature > 38

  // We explicitly show warning if neither condition is met to demonstrate the UI works
  // if you want the mockup design to always show, but we'll stick to actual logic now.
  const showSafeBanner = !isFloodWarning && !isDroughtAlert

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50 text-slate-900 lg:px-8">
      <div className="max-w-xl mx-auto">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="flex items-center gap-2 mb-8 text-sm font-medium text-gray-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <header className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Live Weather & Alerts</h1>
          <p className="text-gray-500">Real-time forecast for Raipur District</p>
        </header>

        {error && (
          <div className="p-3 mb-6 text-sm text-amber-800 bg-amber-50 rounded-lg border border-amber-200">
            {error}
          </div>
        )}

        {/* Disaster Alerts */}
        {isFloodWarning && (
          <div className="flex items-start gap-4 p-5 mb-8 text-red-900 bg-red-100 border border-red-200 shadow-sm rounded-xl animate-fade-in">
            <AlertTriangle size={24} className="shrink-0 text-red-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold tracking-tight">FLOOD WARNING</h3>
              <p className="mt-1 text-sm text-red-800">
                Heavy rainfall ({weatherData.rainfall}mm) expected. Please move to higher ground and secure livestock immediately.
              </p>
            </div>
          </div>
        )}

        {isDroughtAlert && (
           <div className="flex items-start gap-4 p-5 mb-8 text-orange-900 bg-orange-100 border border-orange-200 shadow-sm rounded-xl animate-fade-in">
             <AlertTriangle size={24} className="shrink-0 text-orange-600 mt-0.5" />
             <div>
               <h3 className="text-lg font-bold tracking-tight">HEAT/DROUGHT ALERT</h3>
               <p className="mt-1 text-sm text-orange-800">
                 Extreme heat ({weatherData.temperature}°C) and low rainfall. Conserve water immediately.
               </p>
             </div>
           </div>
        )}

        {showSafeBanner && (
           <div className="flex items-start gap-4 p-5 mb-8 text-teal-900 bg-teal-50 border border-teal-200 shadow-sm rounded-xl animate-fade-in">
             <div className="p-1 bg-teal-200 rounded-full shrink-0 text-teal-700 mt-0.5">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
             </div>
             <div>
               <h3 className="text-lg font-bold tracking-tight">Normal Conditions</h3>
               <p className="mt-1 text-sm text-teal-800">
                 No severe weather alerts at this time.
               </p>
             </div>
           </div>
        )}

        {/* Forecast Card */}
        <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-3xl">
          {/* Main Hero */}
          <div className="flex items-center justify-between p-8 text-white bg-teal-600">
            <div>
              <p className="font-medium text-teal-100 mb-1">Today</p>
              <h2 className="text-5xl font-bold tracking-tight">{weatherData.temperature}°</h2>
              <p className="mt-2 text-lg font-medium text-teal-50">{weatherData.condition}</p>
            </div>
            {weatherData.rainfall > 3 ? <CloudRain size={72} className="opacity-80" /> : <Sun size={72} className="opacity-80" />}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-px bg-gray-100">
            <div className="flex items-center gap-4 p-6 bg-white">
              <Droplets className="text-blue-500" size={24} />
              <div>
                <p className="text-xs font-semibold tracking-wider text-gray-400">RAINFALL</p>
                <p className="font-semibold text-slate-800">{weatherData.rainfall} mm</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 bg-white">
              <Wind className="text-cyan-500" size={24} />
              <div>
                <p className="text-xs font-semibold tracking-wider text-gray-400">HUMIDITY</p>
                <p className="font-semibold text-slate-800">{weatherData.humidity}%</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 bg-white col-span-2">
              <Thermometer className="text-rose-500" size={24} />
              <div className="flex justify-between w-full pr-4">
                <div>
                  <p className="text-xs font-semibold tracking-wider text-gray-400">MIN TEMP</p>
                  <p className="font-semibold text-slate-800">{weatherData.minTemp}°C</p>
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-wider text-gray-400">MAX TEMP</p>
                  <p className="font-semibold text-slate-800">{weatherData.maxTemp}°C</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
