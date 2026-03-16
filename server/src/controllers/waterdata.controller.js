import axios from "axios";
import dotenv from "dotenv";
import cron from "node-cron";
import { WaterData } from "../models/water.model.js";

dotenv.config();

const BLYNK_TOKEN = process.env.BLYNK_TOKEN;

// Map sensor endpoints (V0–V8)
const sensorEndpoints = {
  pH: `https://blynk.cloud/external/api/get?token=${BLYNK_TOKEN}&V0`,
  Hardness: `https://blynk.cloud/external/api/get?token=${BLYNK_TOKEN}&V1`,
  Solids: `https://blynk.cloud/external/api/get?token=${BLYNK_TOKEN}&V2`,
  Chloramines: `https://blynk.cloud/external/api/get?token=${BLYNK_TOKEN}&V3`,
  Sulfate: `https://blynk.cloud/external/api/get?token=${BLYNK_TOKEN}&V4`,
  Conductivity: `https://blynk.cloud/external/api/get?token=${BLYNK_TOKEN}&V5`,
  Organic_carbon: `https://blynk.cloud/external/api/get?token=${BLYNK_TOKEN}&V6`,
  Trihalomethanes: `https://blynk.cloud/external/api/get?token=${BLYNK_TOKEN}&V7`,
  Turbidity: `https://blynk.cloud/external/api/get?token=${BLYNK_TOKEN}&V8`
};

// Utility to fetch a single sensor value
const fetchSensorValue = async (url) => {
  try {
    const res = await axios.get(url);
    return parseFloat(res.data);
  } catch (err) {
    console.error(`Error fetching ${url}:`, err.message);
    return null;
  }
};

// Fetch, store, and predict
export const generateWaterQuality = async () => {
  try {
    const values = {};
    await Promise.all(
      Object.entries(sensorEndpoints).map(async ([key, url]) => {
        values[key] = await fetchSensorValue(url);
      })
    );

    // Save to MongoDB using schema field names (lowercase)
    const waterDoc = new WaterData({
      pH: values.pH,
      hardness: values.Hardness,
      solids: values.Solids,
      chloramines: values.Chloramines,
      sulfate: values.Sulfate,
      conductivity: values.Conductivity,
      organic_carbon: values.Organic_carbon,
      trihalomethanes: values.Trihalomethanes,
      turbidity: values.Turbidity,
      prediction: 0,
      label: "Pending"
    });
    await waterDoc.save();

    // Send to FastAPI model (needs capitalized keys)
    const mlRes = await axios.post("http://127.0.0.1:5001/predict-water", values);

    // Update MongoDB with prediction + label
    waterDoc.prediction = mlRes.data.prediction;
    waterDoc.label = mlRes.data.label;
    await waterDoc.save();

    console.log("Water quality data saved with prediction:", waterDoc._id);
  } catch (err) {
    console.error("Error generating water quality:", err.message);
  }
};

// Schedule job: run every hour
cron.schedule("0 */2 * * *", async () => {
  console.log("Running scheduled water quality job...");
  await generateWaterQuality();
});

// Get all records (for frontend charts)
export const getAllWaterQuality = async (req, res) => {
  try {
    const records = await WaterData.find().sort({ createdAt: -1 });
    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    console.error("Error fetching all water quality:", err.message);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};