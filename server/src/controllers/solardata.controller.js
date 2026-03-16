import axios from "axios";
import dotenv from "dotenv";
import { SolarForecast } from "../models/solar.model.js";

dotenv.config();

const NASA_POWER_API = "https://power.larc.nasa.gov/api/temporal/hourly/point";
const OPENWEATHER_API = "https://api.openweathermap.org/data/2.5/forecast";

const CAPACITY_KW = 3;
const PERFORMANCE_RATIO = 0.80;

// Chhattisgarh districts
const districts = [
  { name: "Raipur", lat: 21.25, lon: 81.63 },
  { name: "Bilaspur", lat: 22.08, lon: 82.15 },
  { name: "Durg", lat: 21.19, lon: 81.28 },
  { name: "Korba", lat: 22.35, lon: 82.68 },
  { name: "Raigarh", lat: 21.9, lon: 83.4 },
  { name: "Janjgir-Champa", lat: 22.0, lon: 82.6 },
  { name: "Mahasamund", lat: 21.1, lon: 82.1 },
  { name: "Kanker", lat: 20.27, lon: 81.49 },
  { name: "Jagdalpur (Bastar)", lat: 19.07, lon: 82.02 },
  { name: "Dhamtari", lat: 20.71, lon: 81.55 },
  { name: "Rajnandgaon", lat: 21.1, lon: 81.0 },
  { name: "Balod", lat: 20.73, lon: 81.2 },
  { name: "Baloda Bazar", lat: 21.66, lon: 82.16 },
  { name: "Bemetara", lat: 21.7, lon: 81.53 },
  { name: "Mungeli", lat: 22.07, lon: 81.68 },
  { name: "Gaurela-Pendra-Marwahi", lat: 22.75, lon: 81.95 },
  { name: "Kondagaon", lat: 19.6, lon: 81.67 },
  { name: "Sukma", lat: 18.4, lon: 81.7 },
  { name: "Bijapur", lat: 18.82, lon: 80.82 },
  { name: "Narayanpur", lat: 20.56, lon: 81.07 },
  { name: "Surajpur", lat: 23.22, lon: 82.87 },
  { name: "Balrampur", lat: 23.62, lon: 83.6 },
  { name: "Korea", lat: 23.4, lon: 82.4 },
  { name: "Surguja", lat: 23.08, lon: 83.2 },
  { name: "Jashpur", lat: 22.9, lon: 83.9 },
  { name: "Sakti", lat: 22.03, lon: 82.97 },
  { name: "Sarangarh-Bilaigarh", lat: 21.6, lon: 82.9 },
  { name: "Manendragarh-Chirimiri-Bharatpur", lat: 23.2, lon: 82.35 },
  { name: "Khairagarh-Chhuikhadan-Gandai", lat: 21.45, lon: 80.98 },
  { name: "Mohla-Manpur-Ambagarh Chowki", lat: 20.9, lon: 80.7 },
  { name: "Kawardha (Kabirdham)", lat: 22.01, lon: 81.23 },
  { name: "Gariaband", lat: 20.63, lon: 82.06 },
  { name: "Baloda Bazar-Bhatapara", lat: 21.66, lon: 82.16 }
];

export const generateForecastForAllDistricts = async () => {
  const today = new Date();
  const y = today.getUTCFullYear();
  const m = String(today.getUTCMonth() + 1).padStart(2, "0");
  const d = String(today.getUTCDate()).padStart(2, "0");
  const yyyymmdd = `${y}${m}${d}`;

  const results = [];

  for (const district of districts) {
    try {
      /* ---------------- NASA hourly irradiance (today) ---------------- */
      const nasaRes = await axios.get(NASA_POWER_API, {
        params: {
          parameters: "ALLSKY_SFC_SW_DWN",
          community: "RE",
          longitude: district.lon,
          latitude: district.lat,
          start: yyyymmdd,
          end: yyyymmdd,
          format: "JSON"
        }
      });

      const irradianceObj =
        nasaRes.data?.properties?.parameter?.ALLSKY_SFC_SW_DWN || {};

      const hourlyIrradiance = Object.values(irradianceObj);

      const hourlyPredictions = hourlyIrradiance.slice(0, 24).map((irr, i) => ({
        hour: i,
        prediction_MW: (irr * CAPACITY_KW * PERFORMANCE_RATIO) / 1000
      }));

      /* ---------------- OpenWeatherMap 5-day forecast ---------------- */
      const owRes = await axios.get(OPENWEATHER_API, {
        params: {
          lat: district.lat,
          lon: district.lon,
          appid: process.env.API_KEY,
          units: "metric"
        }
      });

      const owData = owRes.data?.list || [];

      const dailyPredictions = [];

      for (const entry of owData) {
        const dt = new Date(entry.dt * 1000);
        const date = dt.toISOString().slice(0, 10);

        // Approximate irradiance using cloud cover & solar geometry
        const cloudFactor = 1 - (entry.clouds?.all || 0) / 100;
        const solarIrradiance = 1000 * cloudFactor; // baseline 1000 W/m² adjusted

        dailyPredictions.push({
          date,
          prediction_MW: (solarIrradiance * CAPACITY_KW * PERFORMANCE_RATIO) / 1000
        });
      }

      /* ---------------- Save to MongoDB ---------------- */
      const forecastDoc = new SolarForecast({
        district: district.name,
        location: { lat: district.lat, lon: district.lon },
        hourlyPredictions,
        dailyPredictions
      });

      await forecastDoc.save();
      results.push(forecastDoc);

      console.log(`Forecast generated for ${district.name}`);
    } catch (err) {
      console.error(`Error for district ${district.name}:`, err.message);
    }
  }

  return results;
};

/* ---------------- Get latest forecast ---------------- */
export const getLatestForecasts = async (req, res) => {
  try {
    const forecasts = await SolarForecast.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$district",
          latestDoc: { $first: "$$ROOT" }
        }
      }
    ]);

    const data = forecasts.map((f) => ({
      district: f.latestDoc.district,
      location: f.latestDoc.location,
      generatedAt: f.latestDoc.createdAt,
      hourlyPredictions: f.latestDoc.hourlyPredictions,
      dailyPredictions: f.latestDoc.dailyPredictions
    }));

    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (err) {
    console.error("Error fetching forecasts:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};