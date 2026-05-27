import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const uploadToCloudinary = async (localFilePath) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  if (!localFilePath) return null;
  if (!fs.existsSync(localFilePath)) {
    throw new Error(`Temp file not found at path: ${localFilePath}`);
  }

  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "unicef-solar",
      type: "upload",
      access_mode: "public",
    });
    fs.unlinkSync(localFilePath);
    return result.secure_url;
  } catch (err) {
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    throw new Error(`Cloudinary upload failed: ${err.message}`);
  }
};

// ← ADD THIS: for PDFs, Excel, Word, etc.
const uploadRawToCloudinary = async (localFilePath) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  if (!localFilePath) return null;
  if (!fs.existsSync(localFilePath)) {
    throw new Error(`Temp file not found at path: ${localFilePath}`);
  }

  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "raw",   // ← key difference
      folder: "unicef-solar",
      type: "upload",
      access_mode: "public",
    });
    fs.unlinkSync(localFilePath);
    return result.secure_url;
  } catch (err) {
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    throw new Error(`Cloudinary raw upload failed: ${err.message}`);
  }
};

export { uploadToCloudinary, uploadRawToCloudinary };