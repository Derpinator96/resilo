import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import cron from "node-cron";

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


import userRouter from './routes/user.routes.js'
import solarRouter from "./routes/solar.routes.js"
import waterRouter from "./routes/water.routes.js"
import weatherRouter from "./routes/weather.routes.js" 
import { fetchWeatherForDistricts } from "./controllers/weatherdata.controller.js";



app.use("/api/v1/Solardata", solarRouter)
app.use("/api/v1/Userdata", userRouter)
app.use("/api/v1/Waterdata", waterRouter)
app.use("/api/v1/Weatherdata", weatherRouter)

// ── Node-cron job ──
// Runs every day at 6 AM IST
cron.schedule("0 6 * * *", () => {
  console.log("⏰ Running daily weather fetch for all districts...");
  fetchWeatherForDistricts();
});


export { app }