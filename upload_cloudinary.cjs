const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({ 
  cloud_name: 'dczsriebs', 
  api_key: '598324884566341', 
  api_secret: 'n0MwZtfdtGKUOLd2X_QqFyanXmg' 
});

const mediaDir = path.join(__dirname, 'public', 'media');

async function uploadMedia() {
  try {
    const files = fs.readdirSync(mediaDir);
    
    for (const file of files) {
      if (file.endsWith('.html')) {
        console.log(`Skipping HTML file: ${file}`);
        continue;
      }
      
      const filePath = path.join(mediaDir, file);
      const isVideo = file.endsWith('.mp4');
      const resourceType = isVideo ? 'video' : 'image';
      
      console.log(`Uploading ${file} as ${resourceType}...`);
      
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: resourceType,
        use_filename: true,
        unique_filename: false,
        overwrite: true
      });
      
      console.log(`Successfully uploaded: ${file}`);
      console.log(`  Secure URL: ${result.secure_url}`);
      console.log(`  Public ID: ${result.public_id}\n`);
    }
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
  }
}

uploadMedia();
