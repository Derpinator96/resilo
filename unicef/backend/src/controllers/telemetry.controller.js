import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse }  from "../utils/ApiResponse.js";
import { ApiError }     from "../utils/ApiError.js";
import { Telemetry }    from "../models/telemetry.model.js";

// POST /api/telemetry  — called by ESP32 every 2s
export const receiveTelemetry = asyncHandler(async (req, res) => {
  const { voltage, current, realPower, apparentPower, reactivePower, powerFactor } = req.body;
  if (voltage === undefined) throw new ApiError(400, "Missing fields");

  const doc = await Telemetry.findOneAndReplace(
    {},
    { voltage, current, realPower, apparentPower, reactivePower, powerFactor, updatedAt: new Date() },
    { upsert: true, new: true }
  );

  res.status(200).json(new ApiResponse(200, doc, "Telemetry updated"));
});

// GET /api/telemetry/latest  — polled by frontend every 2s
export const getLatestTelemetry = asyncHandler(async (req, res) => {
  const doc = await Telemetry.findOne();
  if (!doc) throw new ApiError(404, "No telemetry yet");
  res.status(200).json(new ApiResponse(200, doc, "Latest telemetry"));
});

// GET /api/telemetry/history?limit=100  — optional, for charts/export
export const getTelemetryHistory = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  const docs = await Telemetry.find().sort({ createdAt: -1 }).limit(limit);
  res.status(200).json(new ApiResponse(200, docs.reverse(), "History"));
});