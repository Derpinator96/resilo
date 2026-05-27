import mongoose, { Schema } from "mongoose";

const glimpseSchema = new Schema(
  {
    division: { type: String, required: true },
    district: { type: String, required: true },
    facilityName: { type: String, required: true },
    facilityType: { type: String },
    imageUrl: { type: String, required: true },
    cloudinaryId: { type: String, required: true },
    uploadedBy: { type: String },
    latitude: { type: String },
    longitude: { type: String },
    surveyDate: { type: String }
  },
  { timestamps: true }
);

export const Glimpse = mongoose.model("Glimpse", glimpseSchema);