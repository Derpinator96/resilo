import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

import userRouter from './routes/user.route.js'
import centreDataRouter from './routes/centredata.route.js';
import glimpseRoutes from './routes/glimpses.route.js';
import telemetryRouter from './routes/telemetry.route.js';
import mlForecastRouter from './routes/mlforecast.route.js';


app.use("/api/v2/centres", centreDataRouter);
app.use("/api/v2/users", userRouter);
app.use("/api/glimpses", glimpseRoutes);
app.use("/api/telemetry", telemetryRouter);
app.use("/api/ml", mlForecastRouter);

// Global error handler — must be last
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong";
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: err.errors || [],
  });
});

export {app}