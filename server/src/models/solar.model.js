import mongoose from "mongoose";

const solarForecastSchema = new mongoose.Schema(
  {
    district: { type: String, required: true },
    location: {
      lat: { type: Number, required: true },
      lon: { type: Number, required: true }
    },
    generatedAt: { type: Date, default: Date.now },

    // Hourly predictions for current day
    hourlyPredictions: [
      {
        hour: { type: Number, required: true },
        prediction_MW: { type: Number, required: true }
      }
    ],

    // Daily predictions for next 7 days
    dailyPredictions: [
      {
        date: { type: String, required: true },
        prediction_MW: { type: Number, required: true }
      }
    ]
  },
  { timestamps: true }
);

export const SolarForecast = mongoose.model("SolarForecast", solarForecastSchema);