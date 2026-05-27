import mongoose from "mongoose";

const telemetrySchema = new mongoose.Schema({
  voltage:       { type: Number, required: true },
  current:       { type: Number, required: true },
  realPower:     { type: Number, required: true },
  apparentPower: { type: Number, required: true },
  reactivePower: { type: Number, required: true },
  powerFactor:   { type: Number, required: true },
}, { timestamps: true, collection: 'telemetries' });

export const Telemetry = mongoose.model("Telemetry", telemetrySchema);