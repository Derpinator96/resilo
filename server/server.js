import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
import OpenAI from 'openai'
import Jimp from 'jimp'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import Institute from './models/Institute.js'

dotenv.config()

// Connect to MongoDB
async function connectDB() {
  let MONGODB_URI = process.env.MONGODB_URI
  
  if (!MONGODB_URI || MONGODB_URI.includes('127.0.0.1')) {
    console.log('Starting ephemeral in-memory MongoDB Server...')
    const mongoServer = await MongoMemoryServer.create()
    MONGODB_URI = mongoServer.getUri()
  }

  mongoose.connect(MONGODB_URI)
    .then(() => console.log(`Connected to MongoDB at ${MONGODB_URI}`))
    .catch(err => console.error('MongoDB connection error:', err))
}

connectDB()

const app = express()
app.use(cors())

// Use memory storage for Multer to access the file buffer directly without saving to disk
const upload = multer({ storage: multer.memoryStorage() })

// Initialize Configuration dynamically based on API Key type
const apiKey = process.env.OPENAI_API_KEY || ''
const isNvidiaKey = apiKey.startsWith('nvapi-')

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: isNvidiaKey ? "https://integrate.api.nvidia.com/v1" : undefined,
})

app.post('/api/sanitation/scan', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' })
    }

    // Compress the image with Jimp to radically reduce base64 size (pure JS, safe on all OS)
    const image = await Jimp.read(req.file.buffer)
    
    // Resize down to 800px width (maintain aspect ratio) and set 80% JPEG quality
    if (image.bitmap.width > 800) {
      image.resize(800, Jimp.AUTO)
    }
    image.quality(80)

    // Jimp automatically appends the data URI prefix (data:image/jpeg;base64,...)
    const dataURI = await image.getBase64Async(Jimp.MIME_JPEG)

    // If using an NVIDIA key, we must use an NVIDIA-hosted vision model instead of gpt-4o
    const targetModel = isNvidiaKey ? "meta/llama-3.2-90b-vision-instruct" : "gpt-4o"

    // Some endpoints may not strictly support the response_format flag, but we'll try to enforce JSON via the prompt.
    // Llama 3.2 on NVIDIA NIM supports the json_object format in newer version, but passing it might throw validation errors on some non-openai models.
    const responseFormatParams = isNvidiaKey ? {} : { response_format: { type: "json_object" } }

    const response = await openai.chat.completions.create({
      model: targetModel,
      ...responseFormatParams,
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Analyze this image of any environment, object, or waste area. Identify: 1. General hygiene status. 2. Specific contaminants or pollutants visible in the image. 3. The potential waterborne or vector-borne diseases (e.g., Cholera, Typhoid, Dengue) that could outbreak if these contaminants come into contact with a local water body. Return as exactly one JSON object with keys: 'hygieneStatus' (string), 'visibleContaminants' (array of strings), and 'potentialDiseases' (array of strings). Return ONLY the JSON."
            },
            {
              type: "image_url",
              image_url: {
                url: dataURI,
              },
            },
          ],
        },
      ],
      max_tokens: 1024,
    })

    let resultString = response.choices[0].message.content

    // Process Llama's Markdown and conversational text wrapper to find the JSON
    // 1. Try to find content within ```json ... ``` blocks
    const jsonMatch = resultString.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      resultString = jsonMatch[1];
    } else {
      // 2. If no code blocks, blindly find the first { and last }
      const startIndex = resultString.indexOf('{');
      const endIndex = resultString.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
        resultString = resultString.substring(startIndex, endIndex + 1);
      }
    }

    const parsedResult = JSON.parse(resultString)

    res.json(parsedResult)

  } catch (error) {
    console.error("OpenAI API Error details:", error.response ? error.response.data : error)
    res.status(500).json({ 
      error: 'Failed to analyze image.', 
      details: error.message || error.toString()
    })
  }
})

// Database Generation Routes
app.get('/api/institutes/seed', async (req, res) => {
  try {
    const districts = [
      "Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", 
      "Dantewada", "Dhamtari", "Durg", "Gariaband", "Gaurela Pendra Marwahi", "Janjgir-Champa", 
      "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Manendragarh-Chirmiri-Bharatpur", 
      "Mohla-Manpur-Ambagarh Chowki", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sakti", 
      "Sarangarh-Bilaigarh", "Sukma", "Surajpur", "Surguja", "Khairagarh-Chhuikhadan-Gandai"
    ]

    await Institute.deleteMany({ isMock: true })

    const mockInstitutes = []

    for (const district of districts) {
      // Create 2 Schools and 1 Healthcare per district
      mockInstitutes.push(
        {
          name: `Mock Govt School Alpha - ${district}`,
          type: 'School',
          district: district,
          isMock: true,
          waterQuality: 'Low/Highly Turbid',
          waterLevel: 25,
          solarHealth: 'Critical: 35% efficiency'
        },
        {
          name: `Mock Govt School Beta - ${district}`,
          type: 'School',
          district: district,
          isMock: true,
          waterQuality: 'Moderate/Slightly Turbid',
          waterLevel: 45,
          solarHealth: 'Warning: 60% efficiency'
        },
        {
          name: `Mock District Health Centre - ${district}`,
          type: 'Healthcare',
          district: district,
          isMock: true,
          waterQuality: 'Low/Highly Turbid',
          waterLevel: 15,
          solarHealth: 'Critical: 20% efficiency'
        }
      )
    }

    await Institute.insertMany(mockInstitutes)

    res.json({ message: 'Successfully seeded mock institutes', count: mockInstitutes.length })
  } catch (error) {
    console.error("Seed error:", error)
    res.status(500).json({ error: 'Failed to seed database', details: error.message })
  }
})

// Fetch Institutes Route (Mock DB Data Only)
app.get('/api/institutes', async (req, res) => {
  try {
    const { district, type } = req.query
    
    if (!district) {
      return res.status(400).json({ error: 'District parameter is required' })
    }

    const query = { district }
    if (type) query.type = type

    // Fetch exclusively from MongoDB (Mocks)
    const dbInstitutes = await Institute.find(query).lean()

    res.json(dbInstitutes)
    
  } catch (error) {
    console.error("Institute Fetch Error:", error)
    res.status(500).json({ error: 'Failed to fetch institutes' })
  }
})

// Global Error Handler for Express to prevent HTML stack traces and silent crashes
app.use((err, req, res, next) => {
  console.error("Global Express Error:", err)
  res.status(500).json({ error: "Server Error", details: err.message })
})

process.on('uncaughtException', err => console.error('Uncaught Exception:', err))
process.on('unhandledRejection', err => console.error('Unhandled Rejection:', err))

const PORT = 5000
app.listen(PORT, () => {
  console.log(`🚀 RESILO Backend running on http://localhost:${PORT}`)
})
