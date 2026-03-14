import axios from "axios";
import { WeatherData } from "../models/weather.model.js";

const cities = [
  "Raipur", "Bilaspur", "Durg", "Korba", "Raigarh", "Janjgir",
  "Balod", "Baloda Bazar", "Jagdalpur", "Bemetara", "Bijapur",
  "Dantewada", "Ambikapur", "Kanker", "Kawardha",
  "Kondagaon", "Mahasamund", "Mungeli", "Narayanpur",
  "Rajnandgaon", "Sukma", "Surajpur"
];


// Fetch and save weather for all cities
export async function fetchWeatherForDistricts() {
  for (const city of cities) {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${city},IN&appid=${process.env.API_KEY}&units=metric`;
      const response = await axios.get(url);
      const data = response.data;

      const record = new WeatherData({
        city: data.name,
        weather: data.weather[0].main,
        temperature: data.main.temp,
        minTemp: data.main.temp_min,
        maxTemp: data.main.temp_max,
        pressure: data.main.pressure,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed
      });

      await record.save();
    } catch (err) {
      console.error(`❌ Weather fetch failed for ${city}: ${err.response?.status || err.message}`);
    }
  }
}

// Controller to send data to frontend
export async function getWeatherData(req, res) {
  try {
    const records = await WeatherData.find().sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
}