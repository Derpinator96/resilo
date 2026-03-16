import cron from "node-cron";
import { generateForecastForAllDistricts } from "./controllers/solardata.controller.js";

cron.schedule("0 0 * * *", async () => {
  console.log("🌞 Running daily solar forecast job for all districts...");
  try {
    const results = await generateForecastForAllDistricts();
    console.log(`✅ Forecast job completed. Stored ${results.length} district documents.`);
  } catch (err) {
    console.error("❌ Forecast job failed:", err.message);
  }
});