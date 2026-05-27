import { Glimpse } from "../models/glimpses.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Helper: Extract public_id from Cloudinary URL
// Example URL: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/glimpses/filename.jpg
const extractPublicIdFromUrl = (url) => {
  // Pattern: after '/upload/' (optionally skip version like v123/) and before any extension
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
  if (match && match[1]) {
    return match[1];
  }
  // Fallback if extraction fails – generate a unique id
  return `glimpse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// 1. Upload image to Cloudinary & Save data in MongoDB
export const uploadGlimpseImage = async (req, res) => {
  try {
    const { division, district, facilityName, facilityType, latitude, longitude, surveyDate } = req.body;
    const existingGlimpse = await Glimpse.findOne({ facilityName, district });
    
    if (existingGlimpse) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ 
        success: false, 
        message: "A glimpse for this health centre already exists. Please delete the existing one first." 
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload an image" });
    }

    // Upload to Cloudinary using utility (returns string URL)
    const cloudinaryUrl = await uploadToCloudinary(req.file.path);
    
    if (!cloudinaryUrl) {
      return res.status(500).json({ success: false, message: "Cloudinary upload failed – no URL returned" });
    }

    // Extract public_id from the URL
    const publicId = extractPublicIdFromUrl(cloudinaryUrl);

    const newGlimpse = new Glimpse({
      division,
      district,
      facilityName,
      facilityType,
      imageUrl: cloudinaryUrl,
      cloudinaryId: publicId,
      latitude,
      longitude,
      surveyDate
    });

    await newGlimpse.save();

    res.status(201).json({
      success: true,
      message: "Image uploaded and linked successfully",
      data: newGlimpse
    });
  } catch (error) {
    console.error("Upload error:", error);
    // Cleanup local file if it still exists
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// 2. Return all facilities with images
export const getAllGlimpses = async (req, res) => {
  try {
    const glimpses = await Glimpse.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: glimpses.length, data: glimpses });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// 3. Filter by district
export const getGlimpsesByDistrict = async (req, res) => {
  try {
    const { district } = req.params;
    const glimpses = await Glimpse.find({ district }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: glimpses.length, data: glimpses });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// 4. Get images of one facility
export const getGlimpsesByFacility = async (req, res) => {
  try {
    const { facilityName } = req.params;
    const glimpses = await Glimpse.find({ facilityName }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: glimpses.length, data: glimpses });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// 5. Delete image from Cloudinary & Delete from MongoDB
export const deleteGlimpse = async (req, res) => {
  try {
    const glimpse = await Glimpse.findById(req.params.id);
    
    if (!glimpse) {
      return res.status(404).json({ success: false, message: "Glimpse not found" });
    }

    // Delete image from cloudinary using stored cloudinaryId
    await cloudinary.uploader.destroy(glimpse.cloudinaryId);

    // Delete from DB
    await glimpse.deleteOne();

    res.status(200).json({ success: true, message: "Glimpse deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};